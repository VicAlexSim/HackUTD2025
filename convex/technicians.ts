import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
  args: {
    name: v.string(),
    skills: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("technicians", {
      name: args.name,
      status: "available",
      skills: args.skills,
      isOnline: true,
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("technicians").order("desc").collect();
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("technicians"),
    status: v.union(v.literal("available"), v.literal("busy"), v.literal("offline")),
    currentLocation: v.optional(v.string()),
    currentWorkOrderId: v.optional(v.id("workOrders")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const updates: any = { status: args.status };
    if (args.currentLocation !== undefined) {
      updates.currentLocation = args.currentLocation;
    }
    if (args.currentWorkOrderId !== undefined) {
      updates.currentWorkOrderId = args.currentWorkOrderId;
    }

    await ctx.db.patch(args.id, updates);
    return null;
  },
});

export const getAvailable = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("technicians")
      .withIndex("by_status", (q) => q.eq("status", "available"))
      .collect();
  },
});
