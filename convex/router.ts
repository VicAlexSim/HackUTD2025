import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// Webhook endpoint for camera frame analysis (with caching & batching)
http.route({
  path: "/api/analyze-frame",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = await req.json();
    const { cameraId, frameData, priority } = body;

    if (!cameraId || !frameData) {
      return new Response(JSON.stringify({ error: "Missing cameraId or frameData" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      // Use the frame processor which handles caching, deduplication, and batching
      const result = await ctx.runAction(internal.agents.frameProcessor.submitFrame, {
        cameraId,
        frameData,
        priority: priority || 1,
      });

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      console.error("Frame analysis error:", error);
      
      // Provide helpful error messages
      let errorMessage = error.message || "Unknown error";
      let helpText = "";
      
      if (errorMessage.includes("OPENROUTER_API_KEY")) {
        helpText = "\n\nTo fix: Go to Convex Dashboard → Settings → Environment Variables → Add:\nOPENROUTER_API_KEY = sk-or-v1-YOUR_KEY_HERE";
      }
      
      return new Response(JSON.stringify({ 
        error: errorMessage,
        help: helpText,
        details: error.stack
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Coordinator trigger endpoint
http.route({
  path: "/api/assign-tickets",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const result = await ctx.runAction(internal.agents.coordinatorAgent.assignTickets, {});
      
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Manual batch processing trigger
http.route({
  path: "/api/process-batch",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = await req.json();
    const { cameraId } = body;

    if (!cameraId) {
      return new Response(JSON.stringify({ error: "Missing cameraId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const result = await ctx.runAction(internal.agents.frameProcessor.processBatch, {
        cameraId,
      });

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Cache statistics endpoint
http.route({
  path: "/api/cache-stats",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    try {
      const stats = await ctx.runQuery(internal.agents.frameProcessor.getCacheStats, {});

      return new Response(JSON.stringify(stats), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Test voice alert endpoint
http.route({
  path: "/api/test-voice",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = await req.json();
    const { technicianId, message } = body;

    if (!technicianId || !message) {
      return new Response(JSON.stringify({ error: "Missing technicianId or message" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const result = await ctx.runAction(internal.agents.voiceAgent.sendVoiceAlert, {
        technicianId,
        message,
        triggerReason: "critical",
      });

      return new Response(JSON.stringify({
        success: true,
        result,
        message: "Voice alert sent successfully!"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error: any) {
      return new Response(JSON.stringify({ 
        error: error.message,
        details: error.stack
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// System health check endpoint
http.route({
  path: "/api/health",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const checks = {
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: {
        openRouterConfigured: !!process.env.OPENROUTER_API_KEY,
        elevenLabsConfigured: !!process.env.ELEVENLABS_API_KEY,
      },
      endpoints: {
        analyzeFrame: "/api/analyze-frame (POST)",
        processBatch: "/api/process-batch (POST)",
        assignTickets: "/api/assign-tickets (POST)",
        cacheStats: "/api/cache-stats (GET)",
        testVoice: "/api/test-voice (POST)",
        health: "/api/health (GET)",
      },
      setup: [] as string[],
    };

    // Add setup warnings
    if (!checks.environment.openRouterConfigured) {
      checks.setup.push("⚠️  OPENROUTER_API_KEY not set - Vision AI will not work");
      checks.setup.push("   Fix: Dashboard → Settings → Environment Variables");
      checks.setup.push("   Add: OPENROUTER_API_KEY = sk-or-v1-YOUR_KEY");
    }

    if (!checks.environment.elevenLabsConfigured) {
      checks.setup.push("⚠️  ELEVENLABS_API_KEY not set - Voice alerts disabled");
      checks.setup.push("   This is optional for core functionality");
    }

    if (checks.setup.length === 0) {
      checks.setup.push("✅ All API keys configured!");
    }

    return new Response(JSON.stringify(checks, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
