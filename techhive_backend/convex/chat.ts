import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listMessages = query({
  args: {
    issueId: v.id("issues"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_issueId", (q) => q.eq("issueId", args.issueId))
      .collect();

    return Promise.all(
      messages.map(async (message) => {
        const fromUser = await ctx.db.get(message.from);
        return {
          ...message,
          fromName: fromUser?.name ?? "Unknown",
        };
      }),
    );
  },
});

export const sendMessage = mutation({
  args: {
    to: v.id("users"),
    issueId: v.id("issues"),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const from = await getAuthUserId(ctx);
    if (!from) {
      throw new Error("Not authenticated");
    }
    await ctx.db.insert("messages", {
      from,
      to: args.to,
      issueId: args.issueId,
      body: args.body,
    });
  },
});
