import { v } from "convex/values";
import { query } from "./_generated/server";

export const getTicketByIssue = query({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    const ticket = await ctx.db
      .query("agenticTickets")
      .withIndex("by_issueId", (q) => q.eq("issueId", args.issueId))
      .first();

    if (!ticket) return null;

    const tech = await ctx.db.get(ticket.assignedTech);
    return {
      ...ticket,
      techName: tech?.name ?? "Unknown",
    };
  },
});

export const getAllTickets = query({
  args: {},
  handler: async (ctx) => {
    const tickets = await ctx.db.query("agenticTickets").order("desc").collect();

    return Promise.all(
      tickets.map(async (ticket) => {
        const tech = await ctx.db.get(ticket.assignedTech);
        const issue = await ctx.db.get(ticket.issueId);
        return {
          ...ticket,
          techName: tech?.name ?? "Unknown",
          issueDescription: issue?.description ?? "N/A",
          issueLocation: issue?.location ?? "N/A",
        };
      })
    );
  },
});
