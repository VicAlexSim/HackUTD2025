import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";

export const createTechnician = mutation({
  args: {
    name: v.string(),
    skills: v.array(v.string()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const technicianId = await ctx.db.insert("technicians", {
      name: args.name,
      status: "available",
      skills: args.skills,
      location: args.location,
    });
    return technicianId;
  },
});

export const updateTechnicianStatus = mutation({
  args: {
    technicianId: v.id("technicians"),
    status: v.union(
      v.literal("available"),
      v.literal("busy"),
      v.literal("offline")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.technicianId, {
      status: args.status,
    });
  },
});

export const listTechnicians = query({
  args: {},
  handler: async (ctx) => {
    const technicians = await ctx.db.query("technicians").collect();
    
    // Enrich with current ticket data
    const enrichedTechnicians = await Promise.all(
      technicians.map(async (tech) => {
        if (tech.currentTicketId) {
          const ticket = await ctx.db.get(tech.currentTicketId);
          return { ...tech, currentTicket: ticket };
        }
        return { ...tech, currentTicket: null };
      })
    );
    
    return enrichedTechnicians;
  },
});

export const getAvailableTechnicians = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("technicians")
      .withIndex("by_status", (q) => q.eq("status", "available"))
      .collect();
  },
});

export const listTechniciansInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("technicians").collect();
  },
});

export const deleteTechnician = mutation({
  args: { technicianId: v.id("technicians") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.technicianId);
  },
});

export const getVoiceInteractions = query({
  args: { technicianId: v.id("technicians") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("voiceInteractions")
      .withIndex("by_technician", (q) => q.eq("technicianId", args.technicianId))
      .order("desc")
      .take(10);
  },
});
