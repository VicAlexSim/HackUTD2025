"use node";
import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import OpenAI from "openai";
import { Id } from "./_generated/dataModel";

const openai = new OpenAI({
  baseURL: process.env.CONVEX_OPENAI_BASE_URL,
  apiKey: process.env.CONVEX_OPENAI_API_KEY,
});

// Simulated NVIDIA Nemotron client (using OpenAI as fallback for demo)
const nemotron = new OpenAI({
  baseURL: process.env.NVIDIA_NEMOTRON_BASE_URL || process.env.CONVEX_OPENAI_BASE_URL,
  apiKey: process.env.NVIDIA_NEMOTRON_API_KEY || process.env.CONVEX_OPENAI_API_KEY,
});

export const createIssue = action({
  args: {
    storageId: v.id("_storage"),
    description: v.string(),
    location: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(api.auth.loggedInUser);
    if (!user) {
      throw new Error("User not logged in");
    }

    const imageUrl = await ctx.storage.getUrl(args.storageId);
    if (!imageUrl) {
      throw new Error("Image not found");
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Extract the asset tag and error code from this data center equipment image. The asset tag is typically a string of letters and numbers (e.g., "ASSET-12345" or "SRV-001"). The error code is usually displayed on screen or LED panel (e.g., "ERR-404" or "E001"). Respond ONLY with a valid JSON object with "assetTag" and "errorCode" fields. If you cannot find either field, use an empty string for that field. Example: {"assetTag": "ASSET-123", "errorCode": "ERR-500"}`,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }

    let assetTag = "";
    let errorCode = "";
    
    try {
      const parsed = JSON.parse(content);
      assetTag = parsed.assetTag || "";
      errorCode = parsed.errorCode || "";
    } catch (e) {
      console.error("Failed to parse AI response:", e);
    }

    const issueId: Id<"issues"> = await ctx.runMutation(
      internal.issues.insertIssue,
      {
        techId: user._id,
        assetTag: assetTag || undefined,
        errorCode: errorCode || undefined,
        description: args.description,
        location: args.location,
        imageStorageId: args.storageId,
      },
    );

    await ctx.scheduler.runAfter(0, internal.ai.generateTroubleshootingGuide, {
      issueId,
      description: args.description,
      assetTag: assetTag || undefined,
      errorCode: errorCode || undefined,
    });

    await ctx.scheduler.runAfter(0, internal.nemotron.createAgenticTicket, {
      issueId,
      description: args.description,
      location: args.location,
      assetTag: assetTag || undefined,
      techId: user._id,
    });

    const similarIssues = await ctx.runQuery(internal.issues.findSimilarIssues, {
      assetTag: assetTag || undefined,
      errorCode: errorCode || undefined,
      currentIssueId: issueId,
    });

    if (similarIssues.length > 0) {
      const summarizedSolution = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that summarizes solutions to technical issues in data centers.",
          },
          {
            role: "user",
            content: `Summarize the following solutions for similar issues (be concise, 2-3 sentences max):\n\n${similarIssues
              .map((issue, index) => `${index + 1}. ${issue.solution}`)
              .join("\n")}`,
          },
        ],
      });
      
      const solutionSummary = summarizedSolution.choices[0].message.content;
      await ctx.runMutation(internal.issues.updateIssueWithSimilar, {
        issueId,
        similarIssues: similarIssues.map((issue) => ({
          issueId: issue._id,
          solution: issue.solution!,
          techId: issue.techId,
        })),
        solutionSummary: solutionSummary ?? undefined,
      });
    }

    const recentIssues = await ctx.runQuery(
      internal.issues.countRecentSimilarIssues,
      {
        assetTag: assetTag || undefined,
        errorCode: errorCode || undefined,
      },
    );

    if (recentIssues.length >= 2) {
      const allIssueIds = [...recentIssues.map((issue) => issue._id), issueId];
      await ctx.runMutation(internal.issues.flagPattern, {
        issueIds: allIssueIds,
      });
      await ctx.scheduler.runAfter(0, internal.ai.analyzePattern, {
        issueId,
        allIssueIds,
        assetTag: assetTag || undefined,
        errorCode: errorCode || undefined,
      });
    }

    return issueId;
  },
});

export const analyzePattern = internalAction({
  args: {
    issueId: v.id("issues"),
    allIssueIds: v.array(v.id("issues")),
    assetTag: v.optional(v.string()),
    errorCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const issues = await ctx.runQuery(
      internal.issues.countRecentSimilarIssues,
      {
        assetTag: args.assetTag,
        errorCode: args.errorCode,
      },
    );

    const issuesContext = issues
      .map(
        (issue) =>
          `- Issue at ${new Date(issue._creationTime).toLocaleString()}:\n  Location: ${issue.location}\n  Description: ${issue.description}\n  Solution: ${issue.solution ?? "Pending"}\n`,
      )
      .join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a senior data center operations analyst. Identify root causes of recurring hardware issues.",
        },
        {
          role: "user",
          content: `We detected a pattern of recurring issues in the last hour:\n\n${issuesContext}\n\nWhat is the likely root cause? Consider environmental factors (cooling, power), hardware batches, or configuration issues. Provide a concise analysis (3-4 sentences) and suggest next steps for the operations team.`,
        },
      ],
    });

    const analysis = response.choices[0].message.content;
    if (analysis) {
      await ctx.runMutation(internal.issues.addRootCauseAnalysis, {
        issueId: args.issueId,
        analysis,
      });
    }
  },
});

export const generateTroubleshootingGuide = internalAction({
  args: {
    issueId: v.id("issues"),
    description: v.string(),
    assetTag: v.optional(v.string()),
    errorCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert data center technician. Provide clear, safe, step-by-step troubleshooting guides.",
        },
        {
          role: "user",
          content: `Generate a troubleshooting guide for this issue. Prioritize safety and clarity. Format as a numbered list (5-7 steps max).

**Description:** ${args.description}
**Asset Tag:** ${args.assetTag ?? "N/A"}
**Error Code:** ${args.errorCode ?? "N/A"}`,
        },
      ],
    });

    const guide = response.choices[0].message.content;
    if (guide) {
      await ctx.runMutation(internal.issues.addTroubleshootingGuide, {
        issueId: args.issueId,
        guide,
      });
    }
  },
});
