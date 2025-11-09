import { v } from "convex/values";
import { mutation, query, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

export const createCamera = mutation({
  args: {
    name: v.string(),
    streamUrl: v.string(),
    location: v.string(),
    engineerAvailable: v.optional(v.boolean()), // Optional: defaults based on camera name
  },
  handler: async (ctx, args) => {
    // Determine mode based on name or explicit argument
    // "John Doe's Feed" = Live Call (engineer available)
    // "John Doe2's Feed" = AI Assistant (engineer unavailable)
    const engineerAvailable = args.engineerAvailable ?? !args.name.toLowerCase().includes('2');
    
    // Extract technician name from camera name (e.g., "John Doe" from "John Doe's Feed")
    const technicianName = args.name.replace(/'s Feed$/i, '').replace(/\d+$/, '').trim();
    
    // Create or update technician from camera
    const technicianId: any = await ctx.runMutation(internal.cameras.syncTechnicianFromCamera, {
      technicianName,
      location: args.location,
      cameraName: args.name,
    });
    
    const cameraId = await ctx.db.insert("cameraFeeds", {
      name: args.name,
      streamUrl: args.streamUrl,
      location: args.location,
      isActive: true,
      engineerAvailable: engineerAvailable,
      mode: engineerAvailable ? "live_call" : "ai_assistant",
      assignedTechnicianId: technicianId,
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

export const listCamerasInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("cameraFeeds").collect();
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

export const updateCamera = mutation({
  args: {
    cameraId: v.id("cameraFeeds"),
    name: v.string(),
    streamUrl: v.string(),
    location: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Extract technician name from camera name
    const technicianName = args.name.replace(/'s Feed$/i, '').replace(/\d+$/, '').trim();
    
    // Sync technician from camera
    const technicianId = await ctx.runMutation(internal.cameras.syncTechnicianFromCamera, {
      technicianName,
      location: args.location,
      cameraName: args.name,
    });
    
    await ctx.db.patch(args.cameraId, {
      name: args.name,
      streamUrl: args.streamUrl,
      location: args.location,
      assignedTechnicianId: technicianId,
    });
    return null;
  },
});

export const deleteCamera = mutation({
  args: { cameraId: v.id("cameraFeeds") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.cameraId);
  },
});

export const toggleEngineerAvailability = mutation({
  args: {
    cameraId: v.id("cameraFeeds"),
    engineerAvailable: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.cameraId, {
      engineerAvailable: args.engineerAvailable,
      mode: args.engineerAvailable ? "live_call" : "ai_assistant",
    });
    return null;
  },
});

/**
 * Fix existing cameras to set engineerAvailable based on their names
 * Run this once to update all cameras
 */
export const fixCameraModes = mutation({
  args: {},
  returns: v.object({
    updated: v.number(),
    cameras: v.array(v.object({
      name: v.string(),
      mode: v.string(),
      engineerAvailable: v.boolean(),
    })),
  }),
  handler: async (ctx) => {
    const cameras = await ctx.db.query("cameraFeeds").collect();
    const results = [];
    
    for (const camera of cameras) {
      // Determine mode based on name
      // Names with "2" (like "John Doe2's Feed") = AI Assistant Mode
      // Others (like "John Doe's Feed") = Live Call Mode
      const engineerAvailable = !camera.name.toLowerCase().includes('2');
      
      await ctx.db.patch(camera._id, {
        engineerAvailable: engineerAvailable,
        mode: engineerAvailable ? "live_call" : "ai_assistant",
      });
      
      results.push({
        name: camera.name,
        mode: engineerAvailable ? "live_call" : "ai_assistant",
        engineerAvailable: engineerAvailable,
      });
    }
    
    return {
      updated: cameras.length,
      cameras: results,
    };
  },
});

/**
 * Sync all existing cameras to create/update technicians
 * Run this once to set up technicians from existing cameras
 */
export const syncAllCamerasToTechnicians = mutation({
  args: {},
  returns: v.object({
    synced: v.number(),
    technicians: v.array(v.object({
      name: v.string(),
      skills: v.array(v.string()),
      location: v.string(),
    })),
  }),
  handler: async (ctx) => {
    const cameras = await ctx.db.query("cameraFeeds").collect();
    const results = [];
    
    for (const camera of cameras) {
      // Extract technician name from camera name
      const technicianName = camera.name.replace(/'s Feed$/i, '').replace(/\d+$/, '').trim();
      
      // Sync technician from camera
      const technicianId: any = await ctx.runMutation(internal.cameras.syncTechnicianFromCamera, {
        technicianName,
        location: camera.location,
        cameraName: camera.name,
      });
      
      // Update camera to link to technician
      await ctx.db.patch(camera._id, {
        assignedTechnicianId: technicianId,
      });
      
      // Get technician details for response
      const technician: any = await ctx.db.get(technicianId);
      if (technician && technician.name) {
        results.push({
          name: technician.name,
          skills: technician.skills || [],
          location: technician.location || camera.location,
        });
      }
    }
    
    return {
      synced: cameras.length,
      technicians: results,
    };
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

export const toggleAutoAnalysis = mutation({
  args: {
    cameraId: v.id("cameraFeeds"),
    enabled: v.boolean(),
    intervalSeconds: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.enabled) {
      await ctx.db.patch(args.cameraId, {
        autoAnalyze: true,
        analyzeIntervalSeconds: args.intervalSeconds || 30,
        lastAnalyzedAt: 0,
      });
    } else {
      await ctx.db.patch(args.cameraId, {
        autoAnalyze: false,
      });
    }
  },
});

export const updateAnalysisInterval = mutation({
  args: {
    cameraId: v.id("cameraFeeds"),
    intervalSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.cameraId, {
      analyzeIntervalSeconds: args.intervalSeconds,
    });
  },
});

/**
 * Sync technician from camera - creates or updates technician with skills based on location
 */
export const syncTechnicianFromCamera = internalMutation({
  args: {
    technicianName: v.string(),
    location: v.string(),
    cameraName: v.string(),
  },
  handler: async (ctx, args) => {
    // Find existing technician by name
    const existingTechnicians = await ctx.db.query("technicians").collect();
    let technician = existingTechnicians.find((t: any) => t.name === args.technicianName);
    
    // Determine skills based on location and camera type
    const skills = determineSkillsFromLocation(args.location, args.cameraName);
    
    if (technician) {
      // Update existing technician
      await ctx.db.patch(technician._id, {
        location: args.location,
        skills: skills, // Update skills
        status: technician.status === "offline" ? "available" : technician.status, // Set to available if offline
      });
      return technician._id;
    } else {
      // Create new technician
      const technicianId = await ctx.db.insert("technicians", {
        name: args.technicianName,
        status: "available",
        skills: skills,
        location: args.location,
      });
      return technicianId;
    }
  },
});

/**
 * Determine technician skills based on location and camera name
 */
function determineSkillsFromLocation(location: string, cameraName: string): string[] {
  const locationLower = location.toLowerCase();
  const cameraLower = cameraName.toLowerCase();
  const skills: string[] = [];
  
  // Base skills for all technicians
  skills.push("troubleshooting", "maintenance", "repair");
  
  // Location-based skills
  if (locationLower.includes("server") || locationLower.includes("rack")) {
    skills.push("servers", "hardware", "networking");
  }
  if (locationLower.includes("network") || locationLower.includes("switch")) {
    skills.push("networking", "routing", "switching");
  }
  if (locationLower.includes("power") || locationLower.includes("ups") || locationLower.includes("pdu")) {
    skills.push("power", "electrical", "ups");
  }
  if (locationLower.includes("cooling") || locationLower.includes("hvac")) {
    skills.push("cooling", "hvac", "thermal");
  }
  if (locationLower.includes("storage") || locationLower.includes("san")) {
    skills.push("storage", "san", "backup");
  }
  
  // Camera name-based skills (if it mentions specific equipment)
  if (cameraLower.includes("network") || cameraLower.includes("switch")) {
    skills.push("networking", "cisco", "switching");
  }
  if (cameraLower.includes("server") || cameraLower.includes("dell") || cameraLower.includes("hp")) {
    skills.push("servers", "hardware", "dell", "hp");
  }
  if (cameraLower.includes("storage") || cameraLower.includes("hdd") || cameraLower.includes("ssd")) {
    skills.push("storage", "hdd", "ssd", "raid");
  }
  if (cameraLower.includes("power") || cameraLower.includes("ups")) {
    skills.push("power", "ups", "electrical");
  }
  
  // Remove duplicates and return
  return Array.from(new Set(skills));
}
