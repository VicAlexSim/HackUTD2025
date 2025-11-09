import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createTicket = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    createdBy: v.string(),
    metadata: v.optional(v.object({
      cameraId: v.optional(v.string()),
      detectedIssue: v.optional(v.string()),
      suggestedParts: v.optional(v.array(v.string())),
    })),
  },
  handler: async (ctx, args) => {
    const ticketId = await ctx.db.insert("tickets", {
      title: args.title,
      description: args.description,
      status: "pending",
      priority: args.priority,
      createdBy: args.createdBy,
      metadata: args.metadata,
    });
    return ticketId;
  },
});

export const updateTicketStatus = mutation({
  args: {
    ticketId: v.id("tickets"),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("blocked")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ticketId, {
      status: args.status,
    });
  },
});

export const assignTicket = mutation({
  args: {
    ticketId: v.id("tickets"),
    technicianId: v.id("technicians"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ticketId, {
      assignedTechnicianId: args.technicianId,
      status: "in_progress",
    });
    
    await ctx.db.patch(args.technicianId, {
      currentTicketId: args.ticketId,
      status: "busy",
    });
  },
});

export const listTickets = query({
  args: {
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("blocked")
    )),
  },
  handler: async (ctx, args) => {
    let tickets;
    
    if (args.status) {
      const status = args.status;
      tickets = await ctx.db
        .query("tickets")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .collect();
    } else {
      tickets = await ctx.db.query("tickets").order("desc").collect();
    }
    
    // Enrich with technician data
    const enrichedTickets = await Promise.all(
      tickets.map(async (ticket) => {
        if (ticket.assignedTechnicianId) {
          const technician = await ctx.db.get(ticket.assignedTechnicianId);
          return { ...ticket, technician };
        }
        return { ...ticket, technician: null };
      })
    );
    
    return enrichedTickets;
  },
});

export const getTicketById = query({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.ticketId);
  },
});

export const getTicketByIdInternal = internalQuery({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.ticketId);
  },
});

export const listTicketsInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tickets").order("desc").collect();
  },
});

export const createTicketInternal = internalMutation({
  args: {
    title: v.string(),
    description: v.string(),
    priority: v.string(),
    createdBy: v.string(),
    metadata: v.optional(v.object({
      cameraId: v.optional(v.string()),
      detectedIssue: v.optional(v.string()),
      suggestedParts: v.optional(v.array(v.string())),
    })),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tickets", {
      title: args.title,
      description: args.description,
      status: "pending" as const,
      priority: args.priority as any,
      createdBy: args.createdBy,
      metadata: args.metadata,
    });
  },
});
