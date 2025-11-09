"use node";

import { v } from "convex/values";
import { internalAction, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";

export const analyzeFrame = internalAction({
  args: {
    cameraId: v.id("cameraFeeds"),
    frameData: v.string(), // base64 encoded image
  },
  handler: async (ctx, args): Promise<{ analysis: string; detectedIssues: string[]; requiresAction: boolean }> => {
    // Check if API key is configured
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("❌ OPENROUTER_API_KEY not set in environment variables");
      throw new Error("OPENROUTER_API_KEY not configured. Please add it in your Convex dashboard: Settings → Environment Variables");
    }

    // Get camera context and memory
    const memory = await ctx.runQuery(internal.agents.memory.getMemory, {
      agentType: "vision",
      contextId: args.cameraId,
    });

    // Call OpenRouter Nemotron for vision analysis
    const response: Response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-nano-12b-v2-vl:free",
        messages: [
          {
            role: "system",
            content: "You are a vision AI analyzing technician work. Identify safety issues, errors, equipment problems, and maintenance needs. Be concise and actionable."
          },
          ...(memory?.memoryData.conversationHistory || []),
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this frame from the maintenance camera. Look for: 1) Safety violations 2) Equipment issues 3) Technician errors 4) Parts that need replacement"
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${args.frameData}`
                }
              }
            ]
          }
        ],
      }),
    });

    const data: any = await response.json();
    const analysis: string = data.choices[0].message.content;

    // Parse analysis for issues
    const detectedIssues = extractIssues(analysis);
    const requiresAction = detectedIssues.length > 0;

    // Store analysis
    await ctx.runMutation(internal.agents.reactMutations.storeAnalysis, {
      cameraId: args.cameraId,
      analysis,
      detectedIssues,
      requiresAction,
    });

    // Update memory
    await ctx.runMutation(internal.agents.memory.updateMemory, {
      agentType: "vision",
      contextId: args.cameraId,
      newMessage: {
        role: "assistant",
        content: analysis,
        timestamp: Date.now(),
      },
    });

    // If critical issue detected, trigger ReAct workflow
    if (requiresAction && detectedIssues.some(issue => 
      issue.toLowerCase().includes("safety") || 
      issue.toLowerCase().includes("error") ||
      issue.toLowerCase().includes("broken")
    )) {
      await ctx.runAction(internal.agents.reactAgent.processIssue, {
        cameraId: args.cameraId,
        issues: detectedIssues,
        analysis,
      });
    }

    return { analysis, detectedIssues, requiresAction };
  },
});



function extractIssues(analysis: string): string[] {
  const issues: string[] = [];
  const lines = analysis.toLowerCase().split('\n');
  
  const keywords = ['safety', 'error', 'broken', 'damaged', 'incorrect', 'missing', 'leak', 'loose'];
  
  for (const line of lines) {
    if (keywords.some(keyword => line.includes(keyword))) {
      issues.push(line.trim());
    }
  }
  
  return issues;
}
