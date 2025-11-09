import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";

export const createCamera = mutation({
  args: {
    name: v.string(),
    streamUrl: v.string(),
    location: v.string(),
  },
  handler: async (ctx, args) => {
    const cameraId = await ctx.db.insert("cameraFeeds", {
      name: args.name,
      streamUrl: args.streamUrl,
      location: args.location,
      isActive: true,
    });
    return cameraId;
  },
});

export const listCameras = query({
  args: {
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.activeOnly) {
      return await ctx.db
        .query("cameraFeeds")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();
    }
    
    return await ctx.db.query("cameraFeeds").collect();
  },
});

export const getCameraById = internalQuery({
  args: {
    cameraId: v.id("cameraFeeds"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.cameraId);
  },
});

export const assignCameraToTechnician = mutation({
  args: {
    cameraId: v.id("cameraFeeds"),
    technicianId: v.id("technicians"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.cameraId, {
      assignedTechnicianId: args.technicianId,
    });
  },
});

export const toggleCameraActive = mutation({
  args: {
    cameraId: v.id("cameraFeeds"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.cameraId, {
      isActive: args.isActive,
    });
  },
});

export const deleteCamera = mutation({
  args: { cameraId: v.id("cameraFeeds") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.cameraId);
  },
});

export const getVisionAnalysis = query({
  args: { cameraId: v.id("cameraFeeds") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("visionAnalysis")
      .withIndex("by_camera", (q) => q.eq("cameraId", args.cameraId))
      .order("desc")
      .take(10);
  },
});
