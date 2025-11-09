import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createDocument = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    category: v.union(
      v.literal("sop"),
      v.literal("safety"),
      v.literal("troubleshooting"),
      v.literal("repair")
    ),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const docId = await ctx.db.insert("documents", {
      title: args.title,
      content: args.content,
      category: args.category,
      tags: args.tags,
    });
    return docId;
  },
});

export const listDocuments = query({
  args: {
    category: v.optional(v.union(
      v.literal("sop"),
      v.literal("safety"),
      v.literal("troubleshooting"),
      v.literal("repair")
    )),
  },
  handler: async (ctx, args) => {
    if (args.category) {
      const category = args.category;
      return await ctx.db
        .query("documents")
        .withIndex("by_category", (q) => q.eq("category", category))
        .collect();
    }
    
    return await ctx.db.query("documents").collect();
  },
});

export const deleteDocument = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.documentId);
  },
});
