import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // Work orders and maintenance tasks
  workOrders: defineTable({
    title: v.string(),
    description: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    status: v.union(v.literal("pending"), v.literal("assigned"), v.literal("in_progress"), v.literal("completed"), v.literal("blocked")),
    assignedTechnicianId: v.optional(v.string()),
    location: v.string(),
    equipment: v.string(),
    createdBy: v.string(),
    completedAt: v.optional(v.number()),
  }).index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_technician", ["assignedTechnicianId"]),

  // Camera feed snapshots from smart glasses
  cameraFeeds: defineTable({
    technicianId: v.string(),
    imageStorageId: v.id("_storage"),
    workOrderId: v.optional(v.id("workOrders")),
    analysis: v.optional(v.string()),
    detectedIssues: v.optional(v.array(v.string())),
    confidence: v.optional(v.number()),
  }).index("by_technician", ["technicianId"])
    .index("by_work_order", ["workOrderId"]),

  // Agent reasoning logs (ReAct workflow)
  agentLogs: defineTable({
    agentType: v.union(v.literal("vision"), v.literal("supervisor"), v.literal("rag"), v.literal("coordinator")),
    workOrderId: v.optional(v.id("workOrders")),
    step: v.union(v.literal("reason"), v.literal("act"), v.literal("observe")),
    content: v.string(),
    metadata: v.optional(v.any()),
  }).index("by_agent_type", ["agentType"])
    .index("by_work_order", ["workOrderId"]),

  // Knowledge base for RAG
  knowledgeBase: defineTable({
    title: v.string(),
    content: v.string(),
    category: v.union(v.literal("sop"), v.literal("safety"), v.literal("troubleshooting"), v.literal("equipment")),
    tags: v.array(v.string()),
    equipment: v.optional(v.string()),
  }).index("by_category", ["category"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["category", "equipment"],
    }),

  // Technician profiles
  technicians: defineTable({
    name: v.string(),
    status: v.union(v.literal("available"), v.literal("busy"), v.literal("offline")),
    currentLocation: v.optional(v.string()),
    currentWorkOrderId: v.optional(v.id("workOrders")),
    skills: v.array(v.string()),
    isOnline: v.boolean(),
  }).index("by_status", ["status"]),

  // Agent coordination state
  agentState: defineTable({
    key: v.string(),
    value: v.any(),
    updatedBy: v.string(),
  }).index("by_key", ["key"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
