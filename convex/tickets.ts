import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

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
    
    // Log ticket creation activity
    await ctx.runMutation(internal.activityLog.logActivity, {
      type: "ticket_created",
      actor: args.createdBy === "system" ? "kramtron" : "user",
      title: `Ticket Created: ${args.title}`,
      description: `Priority: ${args.priority.toUpperCase()}. ${args.description.substring(0, 200)}${args.description.length > 200 ? '...' : ''}`,
      metadata: {
        ticketId: ticketId.toString(),
      },
    });
    
    // Automatically assign ticket immediately (synchronous basic assignment)
    try {
      const assignmentResult = await ctx.runMutation(internal.tickets.autoAssignTicketBasic, {
        ticketId,
      });
      if (assignmentResult.success) {
        console.log(`✅ Ticket ${ticketId} immediately assigned to ${assignmentResult.technicianName}`);
      } else {
        console.log(`⚠️  Ticket ${ticketId} could not be assigned: ${assignmentResult.reason}`);
      }
    } catch (error) {
      console.error("❌ Failed to assign ticket:", error);
    }
    
    // Optionally enhance assignment with Nemotron AI (async, runs in background)
    try {
      await ctx.scheduler.runAfter(1000, internal.agents.ticketAssignment.assignTicketWithAI, {
        ticketId,
      });
      console.log(`✅ Scheduled AI-enhanced ticket assignment for ticket ${ticketId}`);
    } catch (error) {
      console.error("❌ Failed to schedule AI assignment (non-critical):", error);
      // Non-critical - basic assignment already happened
    }
    
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

export const assignTicketInternal = internalMutation({
  args: {
    ticketId: v.id("tickets"),
    technicianId: v.id("technicians"),
    reasoning: v.string(),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    const technician = await ctx.db.get(args.technicianId);
    
    if (!ticket || !technician) {
      throw new Error("Ticket or technician not found");
    }
    
    await ctx.db.patch(args.ticketId, {
      assignedTechnicianId: args.technicianId,
      status: "in_progress",
    });
    
    await ctx.db.patch(args.technicianId, {
      currentTicketId: args.ticketId,
      status: "busy",
    });
    
    // Log activity
    await ctx.runMutation(internal.activityLog.logActivity, {
      type: "ticket_updated",
      actor: "kramtron",
      title: `Ticket Assigned: ${ticket.title}`,
      description: `Automatically assigned to ${technician.name}. ${args.reasoning}`,
      metadata: {
        ticketId: args.ticketId.toString(),
      },
    });
    
    return { success: true, technicianName: technician.name };
  },
});

/**
 * Basic ticket assignment (synchronous, no AI) - used as fallback
 */
export const autoAssignTicketBasic = internalMutation({
  args: {
    ticketId: v.id("tickets"),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      throw new Error("Ticket not found");
    }

    // Get available technicians - prioritize those assigned to cameras
    const technicians = await ctx.db
      .query("technicians")
      .withIndex("by_status", (q) => q.eq("status", "available"))
      .collect();

    // Filter to only those without current tickets
    let availableTechnicians = technicians.filter((tech) => !tech.currentTicketId);
    
    // Prioritize technicians that are assigned to cameras
    // Check which technicians are linked to cameras
    const cameras = await ctx.db.query("cameraFeeds").collect();
    const cameraTechnicianIds = new Set(
      cameras
        .map(c => c.assignedTechnicianId)
        .filter((id): id is NonNullable<typeof id> => id !== undefined)
    );
    
    // Sort: technicians with cameras first
    availableTechnicians.sort((a, b) => {
      const aHasCamera = cameraTechnicianIds.has(a._id);
      const bHasCamera = cameraTechnicianIds.has(b._id);
      if (aHasCamera && !bHasCamera) return -1;
      if (!aHasCamera && bHasCamera) return 1;
      return 0;
    });

    if (availableTechnicians.length === 0) {
      console.log("⚠️  No available technicians for ticket assignment");
      return { success: false, reason: "No available technicians" };
    }

    // Simple skill matching
    const description = `${ticket.title} ${ticket.description}`.toLowerCase();
    let bestMatch: { tech: typeof availableTechnicians[0]; score: number } | null = null;

    for (const tech of availableTechnicians) {
      let score = 0;
      for (const skill of tech.skills) {
        if (description.includes(skill.toLowerCase())) {
          score += 10;
        }
      }
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { tech, score };
      }
    }

    const selectedTech = bestMatch && bestMatch.score > 0 ? bestMatch.tech : availableTechnicians[0];
    const reasoning = bestMatch && bestMatch.score > 0
      ? `Matched based on skills: ${selectedTech.skills.join(", ")}`
      : "Assigned to first available technician";

    // Assign the ticket
    await ctx.db.patch(args.ticketId, {
      assignedTechnicianId: selectedTech._id,
      status: "in_progress",
    });

    await ctx.db.patch(selectedTech._id, {
      currentTicketId: args.ticketId,
      status: "busy",
    });

    // Log activity
    await ctx.runMutation(internal.activityLog.logActivity, {
      type: "ticket_updated",
      actor: "kramtron",
      title: `Ticket Assigned: ${ticket.title}`,
      description: `Automatically assigned to ${selectedTech.name}. ${reasoning}`,
      metadata: {
        ticketId: args.ticketId.toString(),
      },
    });

    console.log(`✅ Ticket ${args.ticketId} assigned to ${selectedTech.name}: ${reasoning}`);
    return { success: true, technicianName: selectedTech.name, reasoning };
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
    const ticketId = await ctx.db.insert("tickets", {
      title: args.title,
      description: args.description,
      status: "pending" as const,
      priority: args.priority as any,
      createdBy: args.createdBy,
      metadata: args.metadata,
    });
    
    // Log ticket creation activity
    await ctx.runMutation(internal.activityLog.logActivity, {
      type: "ticket_created",
      actor: args.createdBy === "system" ? "kramtron" : "user",
      title: `Ticket Created: ${args.title}`,
      description: `Priority: ${args.priority.toUpperCase()}. ${args.description.substring(0, 200)}${args.description.length > 200 ? '...' : ''}`,
      metadata: {
        ticketId: ticketId.toString(),
      },
    });
    
    // Automatically assign ticket immediately (synchronous basic assignment)
    try {
      const assignmentResult = await ctx.runMutation(internal.tickets.autoAssignTicketBasic, {
        ticketId,
      });
      if (assignmentResult.success) {
        console.log(`✅ Ticket ${ticketId} immediately assigned to ${assignmentResult.technicianName}`);
      } else {
        console.log(`⚠️  Ticket ${ticketId} could not be assigned: ${assignmentResult.reason}`);
      }
    } catch (error) {
      console.error("❌ Failed to assign ticket:", error);
    }
    
    // Optionally enhance assignment with Nemotron AI (async, runs in background)
    try {
      await ctx.scheduler.runAfter(1000, internal.agents.ticketAssignment.assignTicketWithAI, {
        ticketId,
      });
      console.log(`✅ Scheduled AI-enhanced ticket assignment for ticket ${ticketId}`);
    } catch (error) {
      console.error("❌ Failed to schedule AI assignment (non-critical):", error);
      // Non-critical - basic assignment already happened
    }
    
    return ticketId;
  },
});

export const deleteTicket = mutation({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.ticketId);
  },
});
