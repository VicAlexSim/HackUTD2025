import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    technicianId: v.string(),
    imageStorageId: v.id("_storage"),
    workOrderId: v.optional(v.id("workOrders")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("cameraFeeds", {
      technicianId: args.technicianId,
      imageStorageId: args.imageStorageId,
      workOrderId: args.workOrderId,
    });
  },
});

export const list = query({
  args: {
    technicianId: v.optional(v.string()),
    workOrderId: v.optional(v.id("workOrders")),
  },
  handler: async (ctx, args) => {
    let feeds;
    
    if (args.technicianId !== undefined) {
      feeds = await ctx.db
        .query("cameraFeeds")
        .withIndex("by_technician", (q) => q.eq("technicianId", args.technicianId!))
        .order("desc")
        .take(20);
    } else if (args.workOrderId !== undefined) {
      feeds = await ctx.db
        .query("cameraFeeds")
        .withIndex("by_work_order", (q) => q.eq("workOrderId", args.workOrderId!))
        .order("desc")
        .take(20);
    } else {
      feeds = await ctx.db.query("cameraFeeds").order("desc").take(20);
    }

    return await Promise.all(
      feeds.map(async (feed) => ({
        ...feed,
        imageUrl: await ctx.storage.getUrl(feed.imageStorageId),
      }))
    );
  },
});

export const updateAnalysis = mutation({
  args: {
    id: v.id("cameraFeeds"),
    analysis: v.string(),
    detectedIssues: v.array(v.string()),
    confidence: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      analysis: args.analysis,
      detectedIssues: args.detectedIssues,
      confidence: args.confidence,
    });
    return null;
  },
});
