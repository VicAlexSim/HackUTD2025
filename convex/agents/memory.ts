import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";

export const getMemory = internalQuery({
  args: {
    agentType: v.union(
      v.literal("vision"),
      v.literal("supervisor"),
      v.literal("rag"),
      v.literal("coordinator")
    ),
    contextId: v.string(),
  },
  handler: async (ctx, args) => {
    const memory = await ctx.db
      .query("agentMemory")
      .withIndex("by_agent_and_context", (q) =>
        q.eq("agentType", args.agentType).eq("contextId", args.contextId)
      )
      .first();
    
    return memory;
  },
});

export const updateMemory = internalMutation({
  args: {
    agentType: v.union(
      v.literal("vision"),
      v.literal("supervisor"),
      v.literal("rag"),
      v.literal("coordinator")
    ),
    contextId: v.string(),
    newMessage: v.object({
      role: v.string(),
      content: v.string(),
      timestamp: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("agentMemory")
      .withIndex("by_agent_and_context", (q) =>
        q.eq("agentType", args.agentType).eq("contextId", args.contextId)
      )
      .first();

    if (existing) {
      const history = existing.memoryData.conversationHistory;
      history.push(args.newMessage);
      
      // Keep only last 10 messages
      const trimmedHistory = history.slice(-10);
      
      await ctx.db.patch(existing._id, {
        memoryData: {
          ...existing.memoryData,
          conversationHistory: trimmedHistory,
          lastAction: args.newMessage.content,
        },
      });
    } else {
      await ctx.db.insert("agentMemory", {
        agentType: args.agentType,
        contextId: args.contextId,
        memoryData: {
          conversationHistory: [args.newMessage],
          currentState: "active",
          lastAction: args.newMessage.content,
        },
      });
    }
  },
});

export const clearMemory = internalMutation({
  args: {
    agentType: v.union(
      v.literal("vision"),
      v.literal("supervisor"),
      v.literal("rag"),
      v.literal("coordinator")
    ),
    contextId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("agentMemory")
      .withIndex("by_agent_and_context", (q) =>
        q.eq("agentType", args.agentType).eq("contextId", args.contextId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
