import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    category: v.union(v.literal("sop"), v.literal("safety"), v.literal("troubleshooting"), v.literal("equipment")),
    tags: v.array(v.string()),
    equipment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("knowledgeBase", {
      title: args.title,
      content: args.content,
      category: args.category,
      tags: args.tags,
      equipment: args.equipment,
    });
  },
});

export const search = query({
  args: {
    query: v.string(),
    category: v.optional(v.union(v.literal("sop"), v.literal("safety"), v.literal("troubleshooting"), v.literal("equipment"))),
    equipment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let searchQuery = ctx.db
      .query("knowledgeBase")
      .withSearchIndex("search_content", (q) => {
        let sq = q.search("content", args.query);
        if (args.category) {
          sq = sq.eq("category", args.category);
        }
        if (args.equipment) {
          sq = sq.eq("equipment", args.equipment);
        }
        return sq;
      });

    return await searchQuery.take(10);
  },
});

export const list = query({
  args: {
    category: v.optional(v.union(v.literal("sop"), v.literal("safety"), v.literal("troubleshooting"), v.literal("equipment"))),
  },
  handler: async (ctx, args) => {
    if (args.category !== undefined) {
      return await ctx.db
        .query("knowledgeBase")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect();
    }
    return await ctx.db.query("knowledgeBase").collect();
  },
});
