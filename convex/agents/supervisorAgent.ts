"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

export const generateSummary = internalAction({
  args: {
    ticketId: v.optional(v.id("tickets")),
  },
  handler: async (ctx, args) => {
    let context = "";
    
    if (args.ticketId) {
      // Get ticket details
      const ticket = await ctx.runQuery(internal.tickets.getTicketByIdInternal, {
        ticketId: args.ticketId,
      });
      
      // Get ReAct logs for this ticket
      const logs = await ctx.runQuery(internal.agents.ragQueries.getTicketLogs, {
        ticketId: args.ticketId,
      });
      
      context = `Ticket: ${ticket?.title}\nStatus: ${ticket?.status}\nPriority: ${ticket?.priority}\n\nActivity logs:\n${logs.map((l: any) => `[${l.step}] ${l.content}`).join('\n')}`;
    } else {
      // Get overall system status
      const tickets = await ctx.runQuery(internal.tickets.listTicketsInternal, {});
      const technicians = await ctx.runQuery(internal.technicians.listTechniciansInternal, {});
      
      context = `System Overview:\nTotal Tickets: ${tickets.length}\nActive Technicians: ${technicians.filter((t: any) => t.status !== 'offline').length}`;
    }

    // Generate summary using AI
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-nano-12b-v2-vl:free",
        messages: [
          {
            role: "system",
            content: "You are a supervisor agent. Provide concise summaries of maintenance operations, highlighting key issues and progress."
          },
          {
            role: "user",
            content: `Summarize the following:\n\n${context}`
          }
        ],
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  },
});


