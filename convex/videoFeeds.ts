import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getActiveFeeds = query({
  args: {},
  handler: async (ctx) => {
    const feeds = await ctx.db
      .query("videoFeeds")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    return Promise.all(
      feeds.map(async (feed) => {
        const tech = await ctx.db.get(feed.techId);
        const frameUrl = await ctx.storage.getUrl(feed.frameStorageId);
        return {
          ...feed,
          techName: tech?.name ?? "Unknown",
          frameUrl: frameUrl ?? undefined,
        };
      })
    );
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const uploadFrame = mutation({
  args: {
    storageId: v.id("_storage"),
    issueId: v.optional(v.id("issues")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("videoFeeds")
      .withIndex("by_techId", (q) => q.eq("techId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        frameStorageId: args.storageId,
        issueId: args.issueId,
      });
    } else {
      await ctx.db.insert("videoFeeds", {
        techId: userId,
        frameStorageId: args.storageId,
        issueId: args.issueId,
        isActive: true,
      });
    }
  },
});

export const deactivateFeed = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const feed = await ctx.db
      .query("videoFeeds")
      .withIndex("by_techId", (q) => q.eq("techId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (feed) {
      await ctx.db.patch(feed._id, { isActive: false });
    }
  },
});
