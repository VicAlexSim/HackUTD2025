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
    autoAnalyze: v.optional(v.boolean()), // Enable automatic frame analysis
    analyzeIntervalSeconds: v.optional(v.number()), // Seconds between captures (default: 30)
    lastAnalyzedAt: v.optional(v.number()), // Timestamp of last analysis
  }).index("by_active", ["isActive"])
    .index("by_auto_analyze", ["autoAnalyze", "isActive"]),

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

  // Frame Cache for deduplication and caching
  frameCache: defineTable({
    cameraId: v.id("cameraFeeds"),
    frameHash: v.string(), // SHA-256 hash of frame data
    timestamp: v.number(),
    analysisId: v.optional(v.id("visionAnalysis")), // Reference to cached analysis
    hitCount: v.number(), // Track cache hits
  })
    .index("by_camera_and_hash", ["cameraId", "frameHash"])
    .index("by_timestamp", ["timestamp"]),

  // Frame Queue for batch processing
  frameQueue: defineTable({
    cameraId: v.id("cameraFeeds"),
    frameData: v.string(), // base64 encoded
    frameHash: v.string(),
    timestamp: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    batchId: v.optional(v.string()), // Group frames into batches
    priority: v.number(), // Higher priority = process sooner
  })
    .index("by_status", ["status"])
    .index("by_camera_and_status", ["cameraId", "status"])
    .index("by_batch", ["batchId"]),

  // Batch Processing Jobs
  processingBatches: defineTable({
    batchId: v.string(),
    cameraId: v.id("cameraFeeds"),
    frameCount: v.number(),
    status: v.union(
      v.literal("queued"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    results: v.optional(v.array(v.object({
      frameHash: v.string(),
      analysisId: v.id("visionAnalysis"),
      detectedIssues: v.number(),
    }))),
  })
    .index("by_status", ["status"])
    .index("by_camera", ["cameraId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
