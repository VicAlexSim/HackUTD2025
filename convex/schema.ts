import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // Tickets (formerly Work Orders)
  tickets: defineTable({
    title: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("blocked")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    ),
    assignedTechnicianId: v.optional(v.id("technicians")),
    createdBy: v.string(), // "system" or "manual"
    metadata: v.optional(v.object({
      cameraId: v.optional(v.string()),
      detectedIssue: v.optional(v.string()),
      suggestedParts: v.optional(v.array(v.string())),
    })),
  })
    .index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_technician", ["assignedTechnicianId"]),

  // Technicians
  technicians: defineTable({
    name: v.string(),
    status: v.union(
      v.literal("available"),
      v.literal("busy"),
      v.literal("offline")
    ),
    currentTicketId: v.optional(v.id("tickets")),
    skills: v.array(v.string()),
    location: v.optional(v.string()),
  }).index("by_status", ["status"]),

  // Camera Feeds
  cameraFeeds: defineTable({
    name: v.string(),
    streamUrl: v.string(),
    location: v.string(),
    isActive: v.boolean(),
    assignedTechnicianId: v.optional(v.id("technicians")),
  }).index("by_active", ["isActive"]),

  // Vision Analysis Results
  visionAnalysis: defineTable({
    cameraId: v.id("cameraFeeds"),
    timestamp: v.number(),
    analysis: v.string(),
    detectedIssues: v.array(v.string()),
    confidence: v.number(),
    requiresAction: v.boolean(),
    actionTaken: v.optional(v.string()),
  }).index("by_camera", ["cameraId"]),

  // Agent Memory/State
  agentMemory: defineTable({
    agentType: v.union(
      v.literal("vision"),
      v.literal("supervisor"),
      v.literal("rag"),
      v.literal("coordinator")
    ),
    contextId: v.string(), // camera ID or ticket ID
    memoryData: v.object({
      conversationHistory: v.array(v.object({
        role: v.string(),
        content: v.string(),
        timestamp: v.number(),
      })),
      currentState: v.string(),
      lastAction: v.optional(v.string()),
    }),
  }).index("by_agent_and_context", ["agentType", "contextId"]),

  // Voice Interactions
  voiceInteractions: defineTable({
    technicianId: v.id("technicians"),
    message: v.string(),
    audioUrl: v.optional(v.id("_storage")),
    timestamp: v.number(),
    triggerReason: v.string(), // "safety", "error", "guidance", "critical"
    wasSpoken: v.boolean(),
  }).index("by_technician", ["technicianId"]),

  // SOPs and Documentation (for RAG)
  documents: defineTable({
    title: v.string(),
    content: v.string(),
    category: v.union(
      v.literal("sop"),
      v.literal("safety"),
      v.literal("troubleshooting"),
      v.literal("repair")
    ),
    tags: v.array(v.string()),
    embedding: v.optional(v.array(v.number())),
  })
    .index("by_category", ["category"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["category"],
    }),

  // ReAct Workflow Logs
  reactLogs: defineTable({
    ticketId: v.optional(v.id("tickets")),
    step: v.union(
      v.literal("reason"),
      v.literal("act"),
      v.literal("observe")
    ),
    content: v.string(),
    timestamp: v.number(),
    agentType: v.string(),
  }).index("by_ticket", ["ticketId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
