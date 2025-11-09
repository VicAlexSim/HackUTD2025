import { v } from "convex/values";
import { internalAction, internalQuery, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";

export const assignTickets = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get pending tickets
    const pendingTickets = await ctx.runQuery(internal.agents.coordinatorAgent.getPendingTickets);
    
    // Get available technicians
    const availableTechs = await ctx.runQuery(internal.agents.coordinatorAgent.getAvailableTechnicians);
    
    if (pendingTickets.length === 0 || availableTechs.length === 0) {
      return { assigned: 0 };
    }

    // Sort tickets by priority
    const sortedTickets = pendingTickets.sort((a, b) => {
      const priorityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    let assignedCount = 0;

    // Assign tickets to technicians
    for (const ticket of sortedTickets) {
      if (availableTechs.length === 0) break;

      // Find best match based on skills
      const bestTech = findBestTechnician(availableTechs, ticket);
      
      if (bestTech) {
        await ctx.runMutation(internal.agents.coordinatorAgent.assignTicketInternal, {
          ticketId: ticket._id,
          technicianId: bestTech._id,
        });
        
        // Remove from available list
        const index = availableTechs.findIndex(t => t._id === bestTech._id);
        if (index > -1) {
          availableTechs.splice(index, 1);
        }
        
        assignedCount++;
      }
    }

    return { assigned: assignedCount };
  },
});

export const getPendingTickets = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("tickets")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
  },
});

export const getAvailableTechnicians = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("technicians")
      .withIndex("by_status", (q) => q.eq("status", "available"))
      .collect();
  },
});

export const assignTicketInternal = internalMutation({
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

function findBestTechnician(technicians: any[], ticket: any): any {
  if (technicians.length === 0) return null;
  
  // Simple matching: prefer technicians with relevant skills
  const ticketKeywords = (ticket.description + " " + ticket.title).toLowerCase();
  
  let bestMatch = technicians[0];
  let bestScore = 0;
  
  for (const tech of technicians) {
    let score = 0;
    for (const skill of tech.skills) {
      if (ticketKeywords.includes(skill.toLowerCase())) {
        score++;
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = tech;
    }
  }
  
  return bestMatch;
}
