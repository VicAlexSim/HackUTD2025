"use node";

import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import crypto from "crypto";

/**
 * Configuration for frame processing
 */
const BATCH_SIZE = 5; // Process 5 frames at a time
const CACHE_EXPIRY_HOURS = 24; // Cache results for 24 hours
const SIMILARITY_THRESHOLD = 0.95; // Frames must be 95% different to analyze

/**
 * Main entry point: Submit a frame for analysis
 * This handles deduplication and queueing
 */
export const submitFrame = internalAction({
  args: {
    cameraId: v.id("cameraFeeds"),
    frameData: v.string(), // base64 encoded
    priority: v.optional(v.number()), // Higher = process sooner (default: 1)
  },
  handler: async (ctx, args) => {
    // Hash the frame for deduplication
    const frameHash = hashFrame(args.frameData);
    
    // Check if we have a cached result
    const cached = await ctx.runQuery(internal.agents.frameProcessor.checkCache, {
      cameraId: args.cameraId,
      frameHash,
    });

    if (cached) {
      // Cache hit! Update hit count and return cached result
      await ctx.runMutation(internal.agents.frameProcessor.incrementCacheHit, {
        cacheId: cached._id,
      });

      return {
        cached: true,
        analysisId: cached.analysisId,
        message: "Frame already analyzed (cache hit)",
      };
    }

    // Check if frame is similar to recently processed frames
    const recentFrames = await ctx.runQuery(internal.agents.frameProcessor.getRecentFrames, {
      cameraId: args.cameraId,
      limit: 10,
    });

    const isTooSimilar = recentFrames.some((frame) => 
      calculateSimilarity(frame.frameHash, frameHash) > SIMILARITY_THRESHOLD
    );

    if (isTooSimilar) {
      return {
        cached: false,
        skipped: true,
        message: "Frame too similar to recent frames (skipped)",
      };
    }

    // Add to queue for batch processing
    const queueId = await ctx.runMutation(internal.agents.frameProcessor.enqueueFrame, {
      cameraId: args.cameraId,
      frameData: args.frameData,
      frameHash,
      priority: args.priority || 1,
    });

    // Check if we should trigger batch processing
    const pendingCount = await ctx.runQuery(internal.agents.frameProcessor.getPendingCount, {
      cameraId: args.cameraId,
    });

    if (pendingCount >= BATCH_SIZE) {
      // Trigger batch processing
      await ctx.runAction(internal.agents.frameProcessor.processBatch, {
        cameraId: args.cameraId,
      });
    }

    return {
      cached: false,
      skipped: false,
      queued: true,
      queueId,
      message: `Frame queued (${pendingCount + 1}/${BATCH_SIZE} in batch)`,
    };
  },
});

/**
 * Process a batch of frames
 */
export const processBatch = internalAction({
  args: {
    cameraId: v.id("cameraFeeds"),
  },
  handler: async (ctx, args) => {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get pending frames (sorted by priority)
    const frames = await ctx.runQuery(internal.agents.frameProcessor.getPendingFrames, {
      cameraId: args.cameraId,
      limit: BATCH_SIZE,
    });

    if (frames.length === 0) {
      return { message: "No pending frames to process" };
    }

    // Create batch job
    await ctx.runMutation(internal.agents.frameProcessor.createBatch, {
      batchId,
      cameraId: args.cameraId,
      frameCount: frames.length,
      frameIds: frames.map((f) => f._id),
    });

    const results: Array<any> = [];

    // Process each frame
    for (const frame of frames) {
      try {
        // Mark as processing
        await ctx.runMutation(internal.agents.frameProcessor.updateFrameStatus, {
          frameId: frame._id,
          status: "processing",
          batchId,
        });

        // Analyze frame using vision agent
        const analysis = await ctx.runAction(internal.agents.visionAgent.analyzeFrame, {
          cameraId: args.cameraId,
          frameData: frame.frameData,
        });

        // Get the analysis ID (it was stored by visionAgent)
        const analysisRecord = await ctx.runQuery(internal.agents.frameProcessor.getLatestAnalysis, {
          cameraId: args.cameraId,
        });

        if (analysisRecord) {
          // Cache the result
          await ctx.runMutation(internal.agents.frameProcessor.cacheResult, {
            cameraId: args.cameraId,
            frameHash: frame.frameHash,
            analysisId: analysisRecord._id,
          });

          results.push({
            frameHash: frame.frameHash,
            analysisId: analysisRecord._id,
            detectedIssues: analysis.detectedIssues.length,
          });
        }

        // Mark as completed
        await ctx.runMutation(internal.agents.frameProcessor.updateFrameStatus, {
          frameId: frame._id,
          status: "completed",
          batchId,
        });

      } catch (error: any) {
        console.error(`Error processing frame ${frame._id}:`, error);
        
        await ctx.runMutation(internal.agents.frameProcessor.updateFrameStatus, {
          frameId: frame._id,
          status: "failed",
          batchId,
        });
      }
    }

    // Mark batch as completed
    await ctx.runMutation(internal.agents.frameProcessor.completeBatch, {
      batchId,
      results,
    });

    return {
      batchId,
      processed: results.length,
      failed: frames.length - results.length,
    };
  },
});

/**
 * Check if frame is cached
 */
export const checkCache = internalQuery({
  args: {
    cameraId: v.id("cameraFeeds"),
    frameHash: v.string(),
  },
  handler: async (ctx, args) => {
    const cutoff = Date.now() - (CACHE_EXPIRY_HOURS * 60 * 60 * 1000);

    const cached = await ctx.db
      .query("frameCache")
      .withIndex("by_camera_and_hash", (q) => 
        q.eq("cameraId", args.cameraId).eq("frameHash", args.frameHash)
      )
      .filter((q) => q.gte(q.field("timestamp"), cutoff))
      .first();

    return cached;
  },
});

/**
 * Get recent frames for similarity checking
 */
export const getRecentFrames = internalQuery({
  args: {
    cameraId: v.id("cameraFeeds"),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const recentTime = Date.now() - (5 * 60 * 1000); // Last 5 minutes

    return await ctx.db
      .query("frameQueue")
      .withIndex("by_camera_and_status", (q) => 
        q.eq("cameraId", args.cameraId).eq("status", "completed")
      )
      .filter((q) => q.gte(q.field("timestamp"), recentTime))
      .order("desc")
      .take(args.limit);
  },
});

/**
 * Get pending frames count
 */
export const getPendingCount = internalQuery({
  args: {
    cameraId: v.id("cameraFeeds"),
  },
  handler: async (ctx, args) => {
    const pending = await ctx.db
      .query("frameQueue")
      .withIndex("by_camera_and_status", (q) => 
        q.eq("cameraId", args.cameraId).eq("status", "pending")
      )
      .collect();

    return pending.length;
  },
});

/**
 * Get pending frames (sorted by priority)
 */
export const getPendingFrames = internalQuery({
  args: {
    cameraId: v.id("cameraFeeds"),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const frames = await ctx.db
      .query("frameQueue")
      .withIndex("by_camera_and_status", (q) => 
        q.eq("cameraId", args.cameraId).eq("status", "pending")
      )
      .collect();

    // Sort by priority (higher first)
    return frames.sort((a, b) => b.priority - a.priority).slice(0, args.limit);
  },
});

/**
 * Get latest analysis for a camera
 */
export const getLatestAnalysis = internalQuery({
  args: {
    cameraId: v.id("cameraFeeds"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("visionAnalysis")
      .withIndex("by_camera", (q) => q.eq("cameraId", args.cameraId))
      .order("desc")
      .first();
  },
});

/**
 * Enqueue a frame for processing
 */
export const enqueueFrame = internalMutation({
  args: {
    cameraId: v.id("cameraFeeds"),
    frameData: v.string(),
    frameHash: v.string(),
    priority: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("frameQueue", {
      cameraId: args.cameraId,
      frameData: args.frameData,
      frameHash: args.frameHash,
      timestamp: Date.now(),
      status: "pending",
      priority: args.priority,
    });
  },
});

/**
 * Update frame status
 */
export const updateFrameStatus = internalMutation({
  args: {
    frameId: v.id("frameQueue"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    batchId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.frameId, {
      status: args.status,
      ...(args.batchId && { batchId: args.batchId }),
    });
  },
});

/**
 * Cache analysis result
 */
export const cacheResult = internalMutation({
  args: {
    cameraId: v.id("cameraFeeds"),
    frameHash: v.string(),
    analysisId: v.id("visionAnalysis"),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("frameCache", {
      cameraId: args.cameraId,
      frameHash: args.frameHash,
      timestamp: Date.now(),
      analysisId: args.analysisId,
      hitCount: 0,
    });
  },
});

/**
 * Increment cache hit counter
 */
export const incrementCacheHit = internalMutation({
  args: {
    cacheId: v.id("frameCache"),
  },
  handler: async (ctx, args) => {
    const cached = await ctx.db.get(args.cacheId);
    if (cached) {
      await ctx.db.patch(args.cacheId, {
        hitCount: cached.hitCount + 1,
      });
    }
  },
});

/**
 * Create batch job
 */
export const createBatch = internalMutation({
  args: {
    batchId: v.string(),
    cameraId: v.id("cameraFeeds"),
    frameCount: v.number(),
    frameIds: v.array(v.id("frameQueue")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("processingBatches", {
      batchId: args.batchId,
      cameraId: args.cameraId,
      frameCount: args.frameCount,
      status: "processing",
      startedAt: Date.now(),
    });
  },
});

/**
 * Complete batch job
 */
export const completeBatch = internalMutation({
  args: {
    batchId: v.string(),
    results: v.array(v.object({
      frameHash: v.string(),
      analysisId: v.id("visionAnalysis"),
      detectedIssues: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const batch = await ctx.db
      .query("processingBatches")
      .withIndex("by_status", (q) => q.eq("status", "processing"))
      .filter((q) => q.eq(q.field("batchId"), args.batchId))
      .first();

    if (batch) {
      await ctx.db.patch(batch._id, {
        status: "completed",
        completedAt: Date.now(),
        results: args.results,
      });
    }
  },
});

/**
 * Get cache statistics
 */
export const getCacheStats = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Total cache entries
    const allCache = await ctx.db.query("frameCache").collect();
    const totalCacheEntries = allCache.length;
    const totalCacheHits = allCache.reduce((sum, entry) => sum + entry.hitCount, 0);

    // Queue statistics
    const allFrames = await ctx.db.query("frameQueue").collect();
    const pendingFrames = allFrames.filter(f => f.status === "pending").length;
    const processingFrames = allFrames.filter(f => f.status === "processing").length;
    const completedFrames = allFrames.filter(f => f.status === "completed").length;
    const failedFrames = allFrames.filter(f => f.status === "failed").length;

    // Batch statistics
    const allBatches = await ctx.db.query("processingBatches").collect();
    const queuedBatches = allBatches.filter(b => b.status === "queued").length;
    const processingBatches = allBatches.filter(b => b.status === "processing").length;
    const completedBatches = allBatches.filter(b => b.status === "completed").length;

    // Calculate cache hit rate
    const totalFrames = allFrames.length + totalCacheHits;
    const cacheHitRate = totalFrames > 0 ? (totalCacheHits / totalFrames) * 100 : 0;

    return {
      cache: {
        totalEntries: totalCacheEntries,
        totalHits: totalCacheHits,
        hitRate: `${cacheHitRate.toFixed(2)}%`,
      },
      queue: {
        pending: pendingFrames,
        processing: processingFrames,
        completed: completedFrames,
        failed: failedFrames,
        total: allFrames.length,
      },
      batches: {
        queued: queuedBatches,
        processing: processingBatches,
        completed: completedBatches,
        total: allBatches.length,
      },
    };
  },
});

/**
 * Cleanup old cache entries and completed frames
 */
export const cleanupOldData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoffTime = Date.now() - (CACHE_EXPIRY_HOURS * 60 * 60 * 1000);

    // Delete old cache entries
    const oldCache = await ctx.db
      .query("frameCache")
      .withIndex("by_timestamp")
      .filter((q) => q.lt(q.field("timestamp"), cutoffTime))
      .collect();

    for (const entry of oldCache) {
      await ctx.db.delete(entry._id);
    }

    // Delete completed frames older than 1 hour
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const oldFrames = await ctx.db
      .query("frameQueue")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .filter((q) => q.lt(q.field("timestamp"), oneHourAgo))
      .collect();

    for (const frame of oldFrames) {
      await ctx.db.delete(frame._id);
    }

    return {
      deletedCacheEntries: oldCache.length,
      deletedFrames: oldFrames.length,
    };
  },
});

/**
 * Utility: Hash a frame for deduplication
 */
function hashFrame(frameData: string): string {
  return crypto.createHash("sha256").update(frameData).digest("hex");
}

/**
 * Utility: Calculate similarity between two frame hashes
 * This is a simple implementation - for production you might want perceptual hashing
 */
function calculateSimilarity(hash1: string, hash2: string): number {
  if (hash1 === hash2) return 1.0;
  
  let matches = 0;
  const length = Math.min(hash1.length, hash2.length);
  
  for (let i = 0; i < length; i++) {
    if (hash1[i] === hash2[i]) matches++;
  }
  
  return matches / length;
}

