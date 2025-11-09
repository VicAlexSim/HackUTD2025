import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    location: v.string(),
    equipment: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const workOrderId = await ctx.db.insert("workOrders", {
      title: args.title,
      description: args.description,
      priority: args.priority,
      status: "pending",
      location: args.location,
      equipment: args.equipment,
      createdBy: userId,
    });

    return workOrderId;
  },
});

export const list = query({
  args: {
    status: v.optional(v.union(v.literal("pending"), v.literal("assigned"), v.literal("in_progress"), v.literal("completed"), v.literal("blocked"))),
  },
  handler: async (ctx, args) => {
    if (args.status !== undefined) {
      return await ctx.db
        .query("workOrders")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("workOrders").order("desc").take(50);
  },
});

export const get = query({
  args: { id: v.id("workOrders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("workOrders"),
    status: v.union(v.literal("pending"), v.literal("assigned"), v.literal("in_progress"), v.literal("completed"), v.literal("blocked")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const updates: any = { status: args.status };
    if (args.status === "completed") {
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(args.id, updates);
    return null;
  },
});

export const assign = mutation({
  args: {
    workOrderId: v.id("workOrders"),
    technicianId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(args.workOrderId, {
      assignedTechnicianId: args.technicianId,
      status: "assigned",
    });

    return null;
  },
});
