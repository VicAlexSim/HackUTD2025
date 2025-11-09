"use node";

import { v } from "convex/values";
import { internalAction, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";

export const retrieveDocuments = internalAction({
  args: {
    query: v.string(),
    category: v.optional(v.union(
      v.literal("sop"),
      v.literal("safety"),
      v.literal("troubleshooting"),
      v.literal("repair")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any[]> => {
    // Use Convex search to find relevant documents
    const documents: any = await ctx.runQuery(internal.agents.ragQueries.searchDocuments, {
      query: args.query,
      category: args.category,
      limit: args.limit || 5,
    });

    return documents;
  },
});

export const getGuidance = internalAction({
  args: {
    issue: v.string(),
    context: v.string(),
  },
  handler: async (ctx, args): Promise<{ guidance: string; sources: any[] }> => {
    // Retrieve relevant documents
    const docs: any = await ctx.runAction(internal.agents.ragAgent.retrieveDocuments, {
      query: args.issue,
      limit: 3,
    });

    // Generate guidance using retrieved context
    const response: Response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-nano-12b-v2-vl:free",
        messages: [
          {
            role: "system",
            content: "You are a maintenance guidance assistant. Use the provided SOPs and documentation to give clear, step-by-step instructions."
          },
          {
            role: "user",
            content: `Issue: ${args.issue}\n\nContext: ${args.context}\n\nRelevant documentation:\n${docs.map((d: any) => `${d.title}: ${d.content}`).join('\n\n')}\n\nProvide clear guidance.`
          }
        ],
      }),
    });

    const data: any = await response.json();
    return {
      guidance: data.choices[0].message.content,
      sources: docs.map((d: any) => ({ title: d.title, category: d.category })),
    };
  },
});
