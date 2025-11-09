import { v } from "convex/values";
import { internalQuery } from "../_generated/server";

export const getTicketLogs = internalQuery({
  args: {
    ticketId: v.id("tickets"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reactLogs")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .order("desc")
      .take(20);
  },
});

export const getRecentInteractions = internalQuery({
  args: {
    technicianId: v.id("technicians"),
    minutes: v.number(),
  },
  handler: async (ctx, args) => {
    const cutoff = Date.now() - (args.minutes * 60 * 1000);
    const interactions = await ctx.db
      .query("voiceInteractions")
      .withIndex("by_technician", (q) => q.eq("technicianId", args.technicianId))
      .filter((q) => q.gte(q.field("timestamp"), cutoff))
      .collect();
    return interactions;
  },
});

export const searchDocuments = internalQuery({
  args: {
    query: v.string(),
    category: v.optional(v.union(
      v.literal("sop"),
      v.literal("safety"),
      v.literal("troubleshooting"),
      v.literal("repair")
    )),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    let searchQuery = ctx.db
      .query("documents")
      .withSearchIndex("search_content", (q) => {
        let search = q.search("content", args.query);
        if (args.category) {
          const category = args.category;
          search = search.eq("category", category);
        }
        return search;
      });

    const results = await searchQuery.take(args.limit);
    return results;
  },
});
