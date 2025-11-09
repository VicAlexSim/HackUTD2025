import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getIssues = query({
  args: {},
  handler: async (ctx) => {
    const issues = await ctx.db.query("issues").order("desc").collect();

    const techIds = new Set<Id<"users">>();
    issues.forEach((issue) => {
      techIds.add(issue.techId);
      if (issue.similarIssues) {
        issue.similarIssues.forEach((similar) => {
          techIds.add(similar.techId);
        });
      }
    });

    const techIdArray = Array.from(techIds);
    const techs = await Promise.all(techIdArray.map((id) => ctx.db.get(id)));

    const techMap = new Map<Id<"users">, string>();
    techs.forEach((tech) => {
      if (tech) {
        techMap.set(tech._id, tech.name ?? "Unknown");
      }
    });

    const issuesWithDetails = await Promise.all(
      issues.map(async (issue) => {
        const imageUrl = await ctx.storage.getUrl(issue.imageStorageId);
        const similarIssuesWithTech = issue.similarIssues?.map((similar) => ({
          ...similar,
          techName: techMap.get(similar.techId) ?? "Unknown",
        }));

        return {
          ...issue,
          techName: techMap.get(issue.techId) ?? "Unknown",
          imageUrl: imageUrl ?? undefined,
          similarIssues: similarIssuesWithTech,
        };
      }),
    );

    return issuesWithDetails;
  },
});

export const getIssueById = query({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);
    if (!issue) return null;

    const tech = await ctx.db.get(issue.techId);
    const imageUrl = await ctx.storage.getUrl(issue.imageStorageId);

    return {
      ...issue,
      techName: tech?.name ?? "Unknown",
      imageUrl: imageUrl ?? undefined,
    };
  },
});

export const addSolution = mutation({
  args: {
    issueId: v.id("issues"),
    solution: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw new Error("Issue not found");
    }
    if (issue.techId !== userId) {
      throw new Error("Not authorized to add a solution to this issue");
    }
    await ctx.db.patch(args.issueId, {
      solution: args.solution,
      status: "resolved",
    });
  },
});

export const updateIssueStatus = mutation({
  args: {
    issueId: v.id("issues"),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const issue = await ctx.db.get(args.issueId);
    if (!issue) {
      throw new Error("Issue not found");
    }
    if (issue.techId !== userId) {
      throw new Error("Not authorized to update this issue");
    }
    await ctx.db.patch(args.issueId, { status: args.status });
  },
});

export const insertIssue = internalMutation({
  args: {
    techId: v.id("users"),
    assetTag: v.optional(v.string()),
    errorCode: v.optional(v.string()),
    description: v.string(),
    location: v.string(),
    imageStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("issues", {
      techId: args.techId,
      assetTag: args.assetTag,
      errorCode: args.errorCode,
      description: args.description,
      location: args.location,
      imageStorageId: args.imageStorageId,
      status: "open",
    });
  },
});

export const findSimilarIssues = internalQuery({
  args: {
    assetTag: v.optional(v.string()),
    errorCode: v.optional(v.string()),
    currentIssueId: v.id("issues"),
  },
  handler: async (ctx, args) => {
    const similarIssues: Array<Doc<"issues">> = [];
    
    if (args.assetTag) {
      const byAssetTag = await ctx.db
        .query("issues")
        .withIndex("by_assetTag", (q) => q.eq("assetTag", args.assetTag!))
        .filter((q) => q.neq(q.field("_id"), args.currentIssueId))
        .filter((q) => q.neq(q.field("solution"), undefined))
        .collect();
      similarIssues.push(...byAssetTag);
    }
    
    if (args.errorCode && similarIssues.length === 0) {
      const byErrorCode = await ctx.db
        .query("issues")
        .withIndex("by_errorCode", (q) => q.eq("errorCode", args.errorCode!))
        .filter((q) => q.neq(q.field("_id"), args.currentIssueId))
        .filter((q) => q.neq(q.field("solution"), undefined))
        .collect();
      similarIssues.push(...byErrorCode);
    }
    
    return similarIssues;
  },
});

export const updateIssueWithSimilar = internalMutation({
  args: {
    issueId: v.id("issues"),
    similarIssues: v.array(
      v.object({
        issueId: v.id("issues"),
        solution: v.string(),
        techId: v.id("users"),
      }),
    ),
    solutionSummary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const issue = await ctx.db.get(args.issueId);
    if (!issue) return;

    const updatedDescription = args.solutionSummary
      ? `${issue.description}\n\n**AI Summary of Similar Issues:**\n${args.solutionSummary}`
      : issue.description;

    await ctx.db.patch(args.issueId, {
      similarIssues: args.similarIssues,
      description: updatedDescription,
    });
  },
});

export const countRecentSimilarIssues = internalQuery({
  args: {
    assetTag: v.optional(v.string()),
    errorCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const oneHourAgo = Date.now() - 1000 * 60 * 60;
    const issues: Array<Doc<"issues">> = [];
    
    if (args.assetTag) {
      const byAssetTag = await ctx.db
        .query("issues")
        .withIndex("by_assetTag", (q) => q.eq("assetTag", args.assetTag!))
        .filter((q) => q.gt(q.field("_creationTime"), oneHourAgo))
        .collect();
      issues.push(...byAssetTag);
    }
    
    if (args.errorCode && issues.length === 0) {
      const byErrorCode = await ctx.db
        .query("issues")
        .withIndex("by_errorCode", (q) => q.eq("errorCode", args.errorCode!))
        .filter((q) => q.gt(q.field("_creationTime"), oneHourAgo))
        .collect();
      issues.push(...byErrorCode);
    }
    
    return issues;
  },
});

export const flagPattern = internalMutation({
  args: {
    issueIds: v.array(v.id("issues")),
  },
  handler: async (ctx, args) => {
    for (const issueId of args.issueIds) {
      await ctx.db.patch(issueId, { patternDetected: true });
    }
  },
});

export const addRootCauseAnalysis = internalMutation({
  args: {
    issueId: v.id("issues"),
    analysis: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.issueId, { rootCauseAnalysis: args.analysis });
  },
});

export const addTroubleshootingGuide = internalMutation({
  args: {
    issueId: v.id("issues"),
    guide: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.issueId, { troubleshootingGuide: args.guide });
  },
});
