import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * Log conversation message
 */
export const logConversation = internalMutation({
  args: {
    cameraId: v.id("cameraFeeds"),
    speaker: v.union(v.literal("technician"), v.literal("engineer")),
    message: v.string(),
    isWakeWord: v.boolean(),
    response: v.optional(v.string()),
    audioUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get or create memory for this camera
    let memory = await ctx.db
      .query("agentMemory")
      .withIndex("by_agent_and_context", (q) => 
        q.eq("agentType", "vision").eq("contextId", args.cameraId)
      )
      .first();
    
    const timestamp = Date.now();
    const userMessage = {
      role: args.speaker,
      content: args.message,
      timestamp,
    };
    
    if (!memory) {
      // Create new memory
      await ctx.db.insert("agentMemory", {
        agentType: "vision",
        contextId: args.cameraId,
        memoryData: {
          conversationHistory: [userMessage],
          currentState: "listening",
        },
      });
    } else {
      // Update existing memory
      const history = [...memory.memoryData.conversationHistory, userMessage];
      
      // Add Kramtron's response if there is one
      if (args.response) {
        history.push({
          role: "assistant",
          content: args.response,
          timestamp: timestamp + 1,
        });
        
        // Log activity when Kramtron responds
        if (args.isWakeWord) {
          await ctx.runMutation(internal.activityLog.logActivity, {
            type: "voice_response",
            actor: "kramtron",
            title: "Kramtron Voice Response",
            description: `Responded to ${args.speaker}: "${args.message.substring(0, 100)}${args.message.length > 100 ? '...' : ''}"`,
            metadata: {
              cameraId: args.cameraId,
              message: args.message,
              response: args.response,
            },
          });
        }
      }
      
      await ctx.db.patch(memory._id, {
        memoryData: {
          conversationHistory: history.slice(-50), // Keep last 50 messages
          currentState: args.isWakeWord ? "responding" : "listening",
          lastAction: args.isWakeWord ? "voice_response" : undefined,
        },
      });
    }
    
    return null;
  },
});

/**
 * Process inventory order from voice conversation
 */
export const processInventoryOrder = internalMutation({
  args: {
    partNumber: v.string(),
    quantity: v.number(),
    reason: v.string(),
    isReplacement: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    partNumber: v.string(),
    previousStatus: v.string(),
    newStatus: v.string(),
    previousQuantity: v.number(),
    newQuantity: v.number(),
  }),
  handler: async (ctx, args) => {
    const isReplacement = args.isReplacement ?? false;
    console.log(`📦 Processing inventory ${isReplacement ? 'REPLACEMENT' : 'ORDER'}: ${args.partNumber} x${args.quantity}`);
    
    // Find the inventory item
    const item = await ctx.db
      .query("inventory")
      .withIndex("by_part_number", (q) => q.eq("partNumber", args.partNumber))
      .unique();
    
    if (!item) {
      console.error(`❌ Inventory item ${args.partNumber} not found in database`);
      throw new Error(`Inventory item ${args.partNumber} not found`);
    }
    
    const previousStatus = item.status;
    const previousQuantity = item.quantity;
    const timestamp = Date.now();
    
    console.log(`📊 Current item state:`, {
      partNumber: item.partNumber,
      name: item.name,
      currentQuantity: item.quantity,
      currentStatus: item.status,
      previousNotes: item.notes,
      isReplacement: isReplacement,
    });
    
    // If replacement: deduct the broken item from inventory first
    let newQuantity = item.quantity;
    if (isReplacement) {
      // Deduct the broken item (reduce quantity by 1)
      newQuantity = Math.max(0, item.quantity - 1);
      console.log(`🔧 Replacement: Deducting broken item. Quantity: ${item.quantity} → ${newQuantity}`);
    }
    
    // Mark as on order and update quantity
    await ctx.db.patch(item._id, {
      quantity: newQuantity,
      status: "on_order",
      lastOrdered: timestamp,
      notes: args.reason,
    });
    
    console.log(`✅ Successfully updated inventory:`, {
      partNumber: args.partNumber,
      previousStatus,
      newStatus: "on_order",
      previousQuantity,
      newQuantity,
      lastOrdered: new Date(timestamp).toISOString(),
      notes: args.reason,
      isReplacement: isReplacement,
    });
    
    // Verify the update
    const updatedItem = await ctx.db.get(item._id);
    if (!updatedItem) {
      throw new Error(`Failed to verify inventory update for ${args.partNumber}`);
    }
    
    console.log(`✅ Verified update - new status: ${updatedItem.status}, new quantity: ${updatedItem.quantity}`);
    
    // Log activity for inventory order/replacement
    await ctx.runMutation(internal.activityLog.logActivity, {
      type: isReplacement ? "inventory_replace" : "inventory_order",
      actor: "kramtron",
      title: isReplacement 
        ? `Replacement Ordered: ${item.name}`
        : `Inventory Order: ${item.name}`,
      description: `${isReplacement ? "Replacement" : "Order"} placed for ${args.quantity} unit(s) of ${item.name} (${args.partNumber}). ${isReplacement ? `Broken item deducted from inventory.` : ''}`,
      metadata: {
        partNumber: args.partNumber,
        partName: item.name,
        quantity: args.quantity,
      },
    });
    
    return {
      success: true,
      partNumber: args.partNumber,
      previousStatus,
      newStatus: "on_order",
      previousQuantity,
      newQuantity,
    };
  },
});

