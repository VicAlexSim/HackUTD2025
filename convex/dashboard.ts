import { query } from "./_generated/server";
import { v } from "convex/values";

export const getOverview = query({
  args: {},
  handler: async (ctx) => {
    const workOrders = await ctx.db.query("workOrders").collect();
    const technicians = await ctx.db.query("technicians").collect();
    const recentFeeds = await ctx.db.query("cameraFeeds").order("desc").take(10);

    const feedsWithUrls = await Promise.all(
      recentFeeds.map(async (feed) => ({
        ...feed,
        imageUrl: await ctx.storage.getUrl(feed.imageStorageId),
      }))
    );

    return {
      stats: {
        totalWorkOrders: workOrders.length,
        pendingWorkOrders: workOrders.filter((wo) => wo.status === "pending").length,
        inProgressWorkOrders: workOrders.filter((wo) => wo.status === "in_progress").length,
        completedWorkOrders: workOrders.filter((wo) => wo.status === "completed").length,
        availableTechnicians: technicians.filter((t) => t.status === "available").length,
        busyTechnicians: technicians.filter((t) => t.status === "busy").length,
      },
      recentFeeds: feedsWithUrls,
      technicians,
      workOrders: workOrders.slice(0, 10),
    };
  },
});

export const getAgentActivity = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    return await ctx.db.query("agentLogs").order("desc").take(limit);
  },
});
