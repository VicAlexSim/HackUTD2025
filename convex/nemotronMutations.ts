import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const updateVideoFeed = internalMutation({
  args: {
    techId: v.id("users"),
    frameStorageId: v.id("_storage"),
    issueId: v.optional(v.id("issues")),
    detectedAssets: v.array(v.string()),
    detectedComponents: v.array(v.string()),
    currentActivity: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("videoFeeds")
      .withIndex("by_techId", (q) => q.eq("techId", args.techId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        frameStorageId: args.frameStorageId,
        issueId: args.issueId,
        detectedAssets: args.detectedAssets,
        detectedComponents: args.detectedComponents,
        currentActivity: args.currentActivity,
      });
    } else {
      await ctx.db.insert("videoFeeds", {
        techId: args.techId,
        frameStorageId: args.frameStorageId,
        issueId: args.issueId,
        detectedAssets: args.detectedAssets,
        detectedComponents: args.detectedComponents,
        currentActivity: args.currentActivity,
        isActive: true,
      });
    }
  },
});

export const insertAgenticTicket = internalMutation({
  args: {
    issueId: v.id("issues"),
    ticketId: v.string(),
    status: v.string(),
    priority: v.string(),
    assignedTech: v.id("users"),
    suggestedActions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("agenticTickets", {
      issueId: args.issueId,
      ticketId: args.ticketId,
      status: args.status,
      priority: args.priority,
      assignedTech: args.assignedTech,
      autoUpdates: [],
      suggestedActions: args.suggestedActions,
    });

    await ctx.db.patch(args.issueId, {
      agenticTicketId: args.ticketId,
      nextStepSuggestions: args.suggestedActions,
    });
  },
});

export const addTicketUpdate = internalMutation({
  args: {
    issueId: v.id("issues"),
    update: v.string(),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db
      .query("agenticTickets")
      .withIndex("by_issueId", (q) => q.eq("issueId", args.issueId))
      .first();

    if (ticket) {
      const newUpdate = {
        timestamp: Date.now(),
        update: args.update,
        source: args.source,
      };
      await ctx.db.patch(ticket._id, {
        autoUpdates: [...ticket.autoUpdates, newUpdate],
      });
    }
  },
});
