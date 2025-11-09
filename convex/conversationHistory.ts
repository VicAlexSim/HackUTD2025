import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Get conversation history for a specific camera feed
 * This retrieves all messages (technician, engineer, and Kramtron) for the camera
 */
export const getCameraConversationHistory = query({
  args: {
    cameraId: v.id("cameraFeeds"),
  },
  returns: v.union(
    v.object({
      cameraId: v.id("cameraFeeds"),
      cameraName: v.string(),
      location: v.string(),
      conversationHistory: v.array(v.object({
        role: v.string(),
        content: v.string(),
        timestamp: v.number(),
      })),
      totalMessages: v.number(),
      lastUpdated: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Get camera details
    const camera = await ctx.db.get(args.cameraId);
    if (!camera) {
      return null;
    }

    // Get conversation memory for this camera
    const memory = await ctx.db
      .query("agentMemory")
      .withIndex("by_agent_and_context", (q) => 
        q.eq("agentType", "vision").eq("contextId", args.cameraId)
      )
      .first();

    if (!memory) {
      return {
        cameraId: args.cameraId,
        cameraName: camera.name,
        location: camera.location,
        conversationHistory: [],
        totalMessages: 0,
      };
    }

    return {
      cameraId: args.cameraId,
      cameraName: camera.name,
      location: camera.location,
      conversationHistory: memory.memoryData.conversationHistory,
      totalMessages: memory.memoryData.conversationHistory.length,
      lastUpdated: memory._creationTime,
    };
  },
});

/**
 * Get all conversations across all cameras
 * Useful for viewing all chat history
 */
export const getAllConversations = query({
  args: {},
  returns: v.array(v.object({
    cameraId: v.string(),
    cameraName: v.string(),
    location: v.string(),
    messageCount: v.number(),
    lastMessage: v.optional(v.object({
      role: v.string(),
      content: v.string(),
      timestamp: v.number(),
    })),
    lastUpdated: v.number(),
  })),
  handler: async (ctx) => {
    // Get all conversation memories
    const memories = await ctx.db
      .query("agentMemory")
      .withIndex("by_agent_and_context")
      .filter((q) => q.eq(q.field("agentType"), "vision"))
      .collect();

    const conversations = [];

    for (const memory of memories) {
      // contextId is a string, but we need to parse it as a camera ID
      // Get all cameras and find the matching one
      const cameras = await ctx.db.query("cameraFeeds").collect();
      const camera = cameras.find(c => c._id === memory.contextId);
      
      if (!camera) continue;

      const history = memory.memoryData.conversationHistory;
      const lastMessage = history.length > 0 ? history[history.length - 1] : undefined;

      conversations.push({
        cameraId: memory.contextId,
        cameraName: camera.name,
        location: camera.location,
        messageCount: history.length,
        lastMessage,
        lastUpdated: memory._creationTime,
      });
    }

    // Sort by most recent first
    return conversations.sort((a, b) => b.lastUpdated - a.lastUpdated);
  },
});

