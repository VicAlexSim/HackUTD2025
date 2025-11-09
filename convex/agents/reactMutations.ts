import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

export const logStep = internalMutation({
  args: {
    ticketId: v.optional(v.id("tickets")),
    step: v.union(v.literal("reason"), v.literal("act"), v.literal("observe")),
    content: v.string(),
    agentType: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("reactLogs", {
      ticketId: args.ticketId,
      step: args.step,
      content: args.content,
      timestamp: Date.now(),
      agentType: args.agentType,
    });
  },
});

export const storeLog = internalMutation({
  args: {
    ticketId: v.optional(v.id("tickets")),
    step: v.union(v.literal("reason"), v.literal("act"), v.literal("observe")),
    content: v.string(),
    agentType: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("reactLogs", {
      ticketId: args.ticketId,
      step: args.step,
      content: args.content,
      timestamp: Date.now(),
      agentType: args.agentType,
    });
  },
});

export const storeAnalysis = internalMutation({
  args: {
    cameraId: v.id("cameraFeeds"),
    analysis: v.string(),
    detectedIssues: v.array(v.string()),
    requiresAction: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("visionAnalysis", {
      cameraId: args.cameraId,
      timestamp: Date.now(),
      analysis: args.analysis,
      detectedIssues: args.detectedIssues,
      confidence: 0.85,
      requiresAction: args.requiresAction,
    });
  },
});

export const logVoiceInteraction = internalMutation({
  args: {
    technicianId: v.id("technicians"),
    message: v.string(),
    triggerReason: v.string(),
    wasSpoken: v.boolean(),
    audioUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("voiceInteractions", {
      technicianId: args.technicianId,
      message: args.message,
      timestamp: Date.now(),
      triggerReason: args.triggerReason,
      wasSpoken: args.wasSpoken,
    });
  },
});
