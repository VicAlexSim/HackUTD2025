import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  issues: defineTable({
    techId: v.id("users"),
    assetTag: v.optional(v.string()),
    errorCode: v.optional(v.string()),
    description: v.string(),
    location: v.string(),
    solution: v.optional(v.string()),
    imageStorageId: v.id("_storage"),
    similarIssues: v.optional(
      v.array(
        v.object({
          issueId: v.id("issues"),
          solution: v.string(),
          techId: v.id("users"),
        }),
      ),
    ),
    patternDetected: v.optional(v.boolean()),
    rootCauseAnalysis: v.optional(v.string()),
    troubleshootingGuide: v.optional(v.string()),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
    ),
    agenticTicketId: v.optional(v.string()),
    nextStepSuggestions: v.optional(v.array(v.string())),
  })
    .index("by_assetTag", ["assetTag"])
    .index("by_errorCode", ["errorCode"])
    .index("by_status", ["status"])
    .index("by_techId", ["techId"]),
  messages: defineTable({
    from: v.id("users"),
    to: v.id("users"),
    issueId: v.id("issues"),
    body: v.string(),
    transcribed: v.optional(v.boolean()),
    noiseFiltered: v.optional(v.boolean()),
  })
    .index("by_issueId", ["issueId"])
    .index("by_from", ["from"])
    .index("by_to", ["to"]),
  videoFeeds: defineTable({
    techId: v.id("users"),
    issueId: v.optional(v.id("issues")),
    frameStorageId: v.id("_storage"),
    detectedAssets: v.optional(v.array(v.string())),
    detectedComponents: v.optional(v.array(v.string())),
    currentActivity: v.optional(v.string()),
    isActive: v.boolean(),
  })
    .index("by_techId", ["techId"])
    .index("by_issueId", ["issueId"])
    .index("by_isActive", ["isActive"]),
  agenticTickets: defineTable({
    issueId: v.id("issues"),
    ticketId: v.string(),
    status: v.string(),
    priority: v.string(),
    assignedTech: v.id("users"),
    autoUpdates: v.array(
      v.object({
        timestamp: v.number(),
        update: v.string(),
        source: v.string(),
      }),
    ),
    suggestedActions: v.array(v.string()),
  }).index("by_issueId", ["issueId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
