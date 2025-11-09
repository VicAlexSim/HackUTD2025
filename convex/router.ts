import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// Webhook endpoint for camera frame analysis
http.route({
  path: "/api/analyze-frame",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = await req.json();
    const { cameraId, frameData } = body;

    if (!cameraId || !frameData) {
      return new Response(JSON.stringify({ error: "Missing cameraId or frameData" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const result = await ctx.runAction(internal.agents.visionAgent.analyzeFrame, {
        cameraId,
        frameData,
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

export default http;
