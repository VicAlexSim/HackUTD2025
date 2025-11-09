import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Log an activity (internal - used by other mutations/actions)
 */
export const logActivity = internalMutation({
  args: {
    type: v.union(
      v.literal("voice_response"),
      v.literal("inventory_order"),
      v.literal("inventory_replace"),
      v.literal("vision_analysis"),
      v.literal("ticket_created"),
      v.literal("ticket_updated"),
      v.literal("camera_updated"),
      v.literal("system_action")
    ),
    actor: v.union(
      v.literal("kramtron"),
      v.literal("user"),
      v.literal("system")
    ),
    title: v.string(),
    description: v.string(),
    metadata: v.optional(v.object({
      cameraId: v.optional(v.string()),
      ticketId: v.optional(v.string()),
      partNumber: v.optional(v.string()),
      partName: v.optional(v.string()),
      quantity: v.optional(v.number()),
      message: v.optional(v.string()),
      response: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("activityLog", {
      type: args.type,
      actor: args.actor,
      title: args.title,
      description: args.description,
      metadata: args.metadata,
      timestamp: Date.now(),
    });
  },
});

/**
 * Get all activity logs, optionally filtered by type or actor
 */
export const getActivityLogs = query({
  args: {
    limit: v.optional(v.number()),
    type: v.optional(v.union(
      v.literal("voice_response"),
      v.literal("inventory_order"),
      v.literal("inventory_replace"),
      v.literal("vision_analysis"),
      v.literal("ticket_created"),
      v.literal("ticket_updated"),
      v.literal("camera_updated"),
      v.literal("system_action")
    )),
    actor: v.optional(v.union(
      v.literal("kramtron"),
      v.literal("user"),
      v.literal("system")
    )),
  },
  returns: v.array(v.object({
    _id: v.id("activityLog"),
    _creationTime: v.number(),
    type: v.union(
      v.literal("voice_response"),
      v.literal("inventory_order"),
      v.literal("inventory_replace"),
      v.literal("vision_analysis"),
      v.literal("ticket_created"),
      v.literal("ticket_updated"),
      v.literal("camera_updated"),
      v.literal("system_action")
    ),
    actor: v.union(
      v.literal("kramtron"),
      v.literal("user"),
      v.literal("system")
    ),
    title: v.string(),
    description: v.string(),
    metadata: v.optional(v.object({
      cameraId: v.optional(v.string()),
      ticketId: v.optional(v.string()),
      partNumber: v.optional(v.string()),
      partName: v.optional(v.string()),
      quantity: v.optional(v.number()),
      message: v.optional(v.string()),
      response: v.optional(v.string()),
    })),
    timestamp: v.number(),
  })),
  handler: async (ctx, args) => {
    let logs;
    
    if (args.type) {
      // TypeScript knows args.type is defined here
      const type = args.type;
      logs = await ctx.db
        .query("activityLog")
        .withIndex("by_type", (q) => q.eq("type", type))
        .collect();
    } else if (args.actor) {
      // TypeScript knows args.actor is defined here
      const actor = args.actor;
      logs = await ctx.db
        .query("activityLog")
        .withIndex("by_actor", (q) => q.eq("actor", actor))
        .collect();
    } else {
      logs = await ctx.db
        .query("activityLog")
        .withIndex("by_timestamp")
        .collect();
    }
    
    // Sort by timestamp (most recent first)
    logs.sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply limit if provided
    if (args.limit) {
      logs = logs.slice(0, args.limit);
    }
    
    return logs;
  },
});

