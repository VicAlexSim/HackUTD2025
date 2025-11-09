import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";

/**
 * Queries and Mutations for Auto-Capture Agent
 * (Separated from autoCaptureAgent.ts because that file uses "use node")
 */

/**
 * Get cameras that need frame capture based on their interval
 */
export const getCamerasNeedingCapture = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Get all cameras with auto-analyze enabled
    const activeCameras = await ctx.db
      .query("cameraFeeds")
      .withIndex("by_auto_analyze", (q) => 
        q.eq("autoAnalyze", true).eq("isActive", true)
      )
      .collect();

    // Filter cameras that are due for capture
    const camerasNeedingCapture = activeCameras.filter(camera => {
      const interval = (camera.analyzeIntervalSeconds || 30) * 1000; // Default 30 seconds
      const lastAnalyzed = camera.lastAnalyzedAt || 0;
      const timeSinceLastCapture = now - lastAnalyzed;

      return timeSinceLastCapture >= interval;
    });

    return camerasNeedingCapture;
  },
});

/**
 * Update the last analyzed timestamp for a camera
 */
export const updateLastAnalyzed = internalMutation({
  args: {
    cameraId: v.id("cameraFeeds"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.cameraId, {
      lastAnalyzedAt: Date.now(),
    });
  },
});

/**
 * Enable auto-analysis for a camera
 */
export const enableAutoAnalysis = internalMutation({
  args: {
    cameraId: v.id("cameraFeeds"),
    intervalSeconds: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.cameraId, {
      autoAnalyze: true,
      analyzeIntervalSeconds: args.intervalSeconds || 30,
      lastAnalyzedAt: 0, // Reset to trigger immediate capture
    });
  },
});

/**
 * Disable auto-analysis for a camera
 */
export const disableAutoAnalysis = internalMutation({
  args: {
    cameraId: v.id("cameraFeeds"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.cameraId, {
      autoAnalyze: false,
    });
  },
});

