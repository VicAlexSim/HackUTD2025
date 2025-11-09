import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * List all inventory items
 */
export const listInventory = query({
  args: {
    category: v.optional(v.union(
      v.literal("servers"),
      v.literal("networking"),
      v.literal("storage"),
      v.literal("power"),
      v.literal("cooling"),
      v.literal("cables"),
      v.literal("other")
    )),
  },
  returns: v.array(v.object({
    _id: v.id("inventory"),
    _creationTime: v.number(),
    partNumber: v.string(),
    name: v.string(),
    category: v.string(),
    quantity: v.number(),
    minQuantity: v.number(),
    location: v.string(),
    status: v.string(),
    lastOrdered: v.optional(v.number()),
    notes: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    let items;
    
    if (args.category) {
      // TypeScript knows args.category is defined here
      const category = args.category;
      items = await ctx.db
        .query("inventory")
        .withIndex("by_category", (q) => q.eq("category", category))
        .collect();
    } else {
      items = await ctx.db.query("inventory").collect();
    }
    
    // Update status based on quantity, but preserve "on_order" status
    return items.map(item => {
      // If status is "on_order", always preserve it regardless of quantity
      if (item.status === "on_order") {
        return { ...item, status: "on_order" };
      }
      
      // Otherwise, calculate status based on quantity
      const calculatedStatus = item.quantity === 0 ? "out_of_stock" :
                                item.quantity <= item.minQuantity ? "low_stock" :
                                "in_stock";
      
      return { ...item, status: calculatedStatus };
    });
  },
});

/**
 * Update inventory quantity (used when ordering or using parts)
 */
export const updateInventoryQuantity = mutation({
  args: {
    partNumber: v.string(),
    quantityChange: v.number(), // Positive for adding, negative for using
    reason: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Find item by part number
    const item = await ctx.db
      .query("inventory")
      .withIndex("by_part_number", (q) => q.eq("partNumber", args.partNumber))
      .first();
    
    if (!item) {
      throw new Error(`Part ${args.partNumber} not found in inventory`);
    }
    
    const newQuantity = Math.max(0, item.quantity + args.quantityChange);
    const newStatus = newQuantity === 0 ? "out_of_stock" :
                      newQuantity <= item.minQuantity ? "low_stock" :
                      "in_stock";
    
    await ctx.db.patch(item._id, {
      quantity: newQuantity,
      status: newStatus,
      notes: `${args.reason} (${args.quantityChange > 0 ? '+' : ''}${args.quantityChange})`,
    });
    
    console.log(`📦 Inventory updated: ${item.name} ${args.quantityChange > 0 ? '+' : ''}${args.quantityChange} = ${newQuantity}`);
    
    return null;
  },
});

/**
 * Order a part (mark as on_order and update quantity when received)
 */
export const orderPart = mutation({
  args: {
    partNumber: v.string(),
    quantity: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const item = await ctx.db
      .query("inventory")
      .withIndex("by_part_number", (q) => q.eq("partNumber", args.partNumber))
      .first();
    
    if (!item) {
      throw new Error(`Part ${args.partNumber} not found in inventory`);
    }
    
    await ctx.db.patch(item._id, {
      status: "on_order",
      lastOrdered: Date.now(),
      notes: `Ordered ${args.quantity} units`,
    });
    
    console.log(`📦 Order placed: ${item.name} x${args.quantity}`);
    
    return null;
  },
});

/**
 * Seed initial inventory data
 */
export const seedInventory = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Check if inventory already exists
    const existing = await ctx.db.query("inventory").first();
    if (existing) {
      console.log("Inventory already seeded");
      return null;
    }
    
    const mockInventory = [
      // Servers
      { partNumber: "SVR-001", name: "Dell PowerEdge R750", category: "servers" as const, quantity: 5, minQuantity: 2, location: "Bay 1, Rack A" },
      { partNumber: "SVR-002", name: "HP ProLiant DL380 Gen10", category: "servers" as const, quantity: 3, minQuantity: 1, location: "Bay 1, Rack B" },
      { partNumber: "SVR-003", name: "Server RAM 32GB DDR4", category: "servers" as const, quantity: 20, minQuantity: 5, location: "Bay 1, Shelf C" },
      { partNumber: "SVR-004", name: "Server CPU Intel Xeon", category: "servers" as const, quantity: 8, minQuantity: 2, location: "Bay 1, Shelf D" },
      
      // Networking
      { partNumber: "NET-001", name: "Cisco Catalyst 9300 Switch", category: "networking" as const, quantity: 4, minQuantity: 1, location: "Bay 2, Rack A" },
      { partNumber: "NET-002", name: "Ubiquiti UniFi Switch 48", category: "networking" as const, quantity: 6, minQuantity: 2, location: "Bay 2, Rack B" },
      { partNumber: "NET-003", name: "SFP+ 10G Transceiver", category: "networking" as const, quantity: 25, minQuantity: 10, location: "Bay 2, Shelf A" },
      { partNumber: "NET-004", name: "Cat6 Ethernet Cable 10ft", category: "cables" as const, quantity: 50, minQuantity: 20, location: "Bay 2, Shelf B" },
      
      // Storage
      { partNumber: "STG-001", name: "Samsung 870 EVO 2TB SSD", category: "storage" as const, quantity: 15, minQuantity: 5, location: "Bay 3, Shelf A" },
      { partNumber: "STG-002", name: "WD Gold 8TB HDD", category: "storage" as const, quantity: 10, minQuantity: 3, location: "Bay 3, Shelf B" },
      { partNumber: "STG-003", name: "NVMe M.2 1TB Drive", category: "storage" as const, quantity: 12, minQuantity: 4, location: "Bay 3, Shelf C" },
      
      // Power
      { partNumber: "PWR-001", name: "APC Smart-UPS 3000VA", category: "power" as const, quantity: 2, minQuantity: 1, location: "Bay 4, Floor" },
      { partNumber: "PWR-002", name: "PDU Power Strip 20A", category: "power" as const, quantity: 8, minQuantity: 3, location: "Bay 4, Rack A" },
      { partNumber: "PWR-003", name: "Server Power Supply 750W", category: "power" as const, quantity: 10, minQuantity: 3, location: "Bay 4, Shelf A" },
      
      // Cooling
      { partNumber: "COOL-001", name: "Server Fan 80mm", category: "cooling" as const, quantity: 30, minQuantity: 10, location: "Bay 5, Shelf A" },
      { partNumber: "COOL-002", name: "Thermal Paste Tube", category: "cooling" as const, quantity: 15, minQuantity: 5, location: "Bay 5, Shelf B" },
      
      // Cables
      { partNumber: "CBL-001", name: "Fiber Optic Cable LC-LC", category: "cables" as const, quantity: 40, minQuantity: 15, location: "Bay 2, Shelf C" },
      { partNumber: "CBL-002", name: "HDMI Cable 6ft", category: "cables" as const, quantity: 20, minQuantity: 8, location: "Bay 2, Shelf D" },
      { partNumber: "CBL-003", name: "Power Cable C13-C14", category: "cables" as const, quantity: 60, minQuantity: 20, location: "Bay 4, Shelf B" },
    ];
    
    for (const item of mockInventory) {
      const status = item.quantity === 0 ? "out_of_stock" :
                     item.quantity <= item.minQuantity ? "low_stock" :
                     "in_stock";
      
      await ctx.db.insert("inventory", {
        ...item,
        status,
      });
    }
    
    console.log(`✅ Seeded ${mockInventory.length} inventory items`);
    return null;
  },
});

