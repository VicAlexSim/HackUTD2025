import { v } from "convex/values";
import { internalQuery } from "../_generated/server";

/**
 * Get conversation context for the camera
 */
export const getConversationContext = internalQuery({
  args: {
    cameraId: v.id("cameraFeeds"),
  },
  returns: v.array(v.object({
    role: v.string(),
    content: v.string(),
    timestamp: v.number(),
  })),
  handler: async (ctx, args) => {
    const memory = await ctx.db
      .query("agentMemory")
      .withIndex("by_agent_and_context", (q) => 
        q.eq("agentType", "vision").eq("contextId", args.cameraId)
      )
      .first();
    
    if (!memory) {
      return [];
    }
    
    // Return last 10 messages for context
    return memory.memoryData.conversationHistory.slice(-10);
  },
});

/**
 * Get camera and technician context
 */
export const getCameraContext = internalQuery({
  args: {
    cameraId: v.id("cameraFeeds"),
  },
  returns: v.object({
    cameraName: v.string(),
    location: v.string(),
    recentAnalysis: v.optional(v.string()),
    activeTickets: v.array(v.object({
      title: v.string(),
      description: v.string(),
      priority: v.string(),
    })),
  }),
  handler: async (ctx, args) => {
    // Get camera info
    const camera = await ctx.db.get(args.cameraId);
    if (!camera) {
      return {
        cameraName: "Unknown",
        location: "Unknown",
        activeTickets: [],
      };
    }
    
    // Get recent analysis
    const recentAnalysis = await ctx.db
      .query("visionAnalysis")
      .withIndex("by_camera", (q) => q.eq("cameraId", args.cameraId))
      .order("desc")
      .first();
    
    // Get active tickets for this camera
    const tickets = await ctx.db
      .query("tickets")
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "in_progress")
        )
      )
      .collect();
    
    const activeTickets = tickets
      .filter(t => t.metadata?.cameraId === args.cameraId)
      .map(t => ({
        title: t.title,
        description: t.description,
        priority: t.priority,
      }));
    
    return {
      cameraName: camera.name,
      location: camera.location,
      recentAnalysis: recentAnalysis?.analysis,
      activeTickets,
    };
  },
});

/**
 * Get inventory item by part number
 */
export const getInventoryItem = internalQuery({
  args: {
    partNumber: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      partNumber: v.string(),
      name: v.string(),
      quantity: v.number(),
      status: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const item = await ctx.db
      .query("inventory")
      .withIndex("by_part_number", (q) => q.eq("partNumber", args.partNumber))
      .unique();
    
    if (!item) {
      return null;
    }
    
    return {
      partNumber: item.partNumber,
      name: item.name,
      quantity: item.quantity,
      status: item.status,
    };
  },
});

/**
 * Search for inventory items by description/name
 * Used when exact part number doesn't exist
 */
export const searchInventoryByDescription = internalQuery({
  args: {
    description: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      partNumber: v.string(),
      name: v.string(),
      quantity: v.number(),
      status: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const searchLower = args.description.toLowerCase();
    
    // Get all inventory items
    const allItems = await ctx.db.query("inventory").collect();
    
    // Try to find a match based on keywords
    // Look for: nvme, ssd, hdd, terabyte, tb, gb, etc.
    const keywords = searchLower.split(/\s+/);
    
    // Score items based on keyword matches
    let bestMatch: typeof allItems[0] | null = null;
    let bestScore = 0;
    
    for (const item of allItems) {
      const itemNameLower = item.name.toLowerCase();
      const itemPartLower = item.partNumber.toLowerCase();
      
      let score = 0;
      
      // Check for storage-related keywords
      if (keywords.some(k => k.includes("nvme") || k.includes("ssd") || k.includes("hdd"))) {
        if (itemNameLower.includes("nvme") || itemNameLower.includes("ssd") || itemNameLower.includes("hdd")) {
          score += 10;
        }
      }
      
      // Check for size keywords (1tb, 2tb, etc.)
      const sizeMatch = searchLower.match(/(\d+)\s*(?:tb|terabyte|gb|gigabyte)/i);
      if (sizeMatch) {
        const size = parseInt(sizeMatch[1]);
        const itemSizeMatch = itemNameLower.match(/(\d+)\s*(?:tb|terabyte|gb|gigabyte)/i);
        if (itemSizeMatch) {
          const itemSize = parseInt(itemSizeMatch[1]);
          // Prefer exact match, but also accept close matches
          if (itemSize === size) {
            score += 20;
          } else if (Math.abs(itemSize - size) <= 1) {
            score += 10;
          }
        }
      }
      
      // Check for brand/model keywords
      if (keywords.some(k => itemNameLower.includes(k))) {
        score += 5;
      }
      
      // Prefer storage category
      if (item.category === "storage") {
        score += 3;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    }
    
    // Only return if we have a reasonable match (score > 5)
    if (bestMatch && bestScore > 5) {
      return {
        partNumber: bestMatch.partNumber,
        name: bestMatch.name,
        quantity: bestMatch.quantity,
        status: bestMatch.status,
      };
    }
    
    return null;
  },
});

