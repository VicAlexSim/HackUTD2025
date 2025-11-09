"use node";
import { v } from "convex/values";
import { internalAction, action } from "./_generated/server";
import { internal } from "./_generated/api";
import OpenAI from "openai";
import { Id } from "./_generated/dataModel";

// Simulated NVIDIA Nemotron client (using OpenAI as fallback for demo)
const nemotron = new OpenAI({
  baseURL: process.env.NVIDIA_NEMOTRON_BASE_URL || process.env.CONVEX_OPENAI_BASE_URL,
  apiKey: process.env.NVIDIA_NEMOTRON_API_KEY || process.env.CONVEX_OPENAI_API_KEY,
});

export const analyzeVideoFrame = internalAction({
  args: {
    frameStorageId: v.id("_storage"),
    techId: v.id("users"),
    issueId: v.optional(v.id("issues")),
  },
  handler: async (ctx, args) => {
    const frameUrl = await ctx.storage.getUrl(args.frameStorageId);
    if (!frameUrl) return null;

    const response = await nemotron.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are Nemotron, NVIDIA's multimodal AI analyzing data center equipment from technician POV glasses. Extract asset tags, component names, and current activity from the video frame.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: 'Analyze this POV frame from smart glasses in a loud data center. Identify: 1) Asset tags (e.g., "SRV-A123"), 2) Hardware components visible (e.g., "PSU", "Fan Module"), 3) Current technician activity. Return ONLY valid JSON: {"assets": ["tag1"], "components": ["comp1"], "activity": "description"}',
            },
            { type: "image_url", image_url: { url: frameUrl } },
          ],
        },
      ],
    });

    const content = response.choices[0].message.content;
    if (!content) return null;

    try {
      const parsed = JSON.parse(content);
      await ctx.runMutation(internal.nemotronMutations.updateVideoFeed, {
        techId: args.techId,
        frameStorageId: args.frameStorageId,
        issueId: args.issueId,
        detectedAssets: parsed.assets || [],
        detectedComponents: parsed.components || [],
        currentActivity: parsed.activity || "Unknown activity",
      });
      return parsed;
    } catch {
      return null;
    }
  },
});

export const createAgenticTicket = internalAction({
  args: {
    issueId: v.id("issues"),
    description: v.string(),
    location: v.string(),
    assetTag: v.optional(v.string()),
    techId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const ticketId = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const response = await nemotron.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an agentic AI assistant managing data center maintenance tickets. Analyze issues, determine priority (high/medium/low), and suggest specific actionable steps for technicians.",
        },
        {
          role: "user",
          content: `New data center issue reported:
Description: ${args.description}
Location: ${args.location}
Asset Tag: ${args.assetTag || "N/A"}

Determine priority and suggest 3-5 specific action steps. Return ONLY valid JSON: {"priority": "high", "actions": ["Step 1: ...", "Step 2: ..."]}`,
        },
      ],
    });

    const content = response.choices[0].message.content;
    let priority = "medium";
    const suggestedActions: Array<string> = [];

    try {
      const parsed = JSON.parse(content || "{}");
      priority = parsed.priority || "medium";
      suggestedActions.push(...(parsed.actions || []));
    } catch {}

    await ctx.runMutation(internal.nemotronMutations.insertAgenticTicket, {
      issueId: args.issueId,
      ticketId,
      status: "open",
      priority,
      assignedTech: args.techId,
      suggestedActions,
    });

    return { ticketId, priority, suggestedActions };
  },
});

export const updateTicketFromActivity = internalAction({
  args: {
    issueId: v.id("issues"),
    activity: v.string(),
    detectedComponents: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const response = await nemotron.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an agentic AI monitoring technician activity. Generate concise ticket updates based on observed actions.",
        },
        {
          role: "user",
          content: `Technician activity: ${args.activity}. Components: ${args.detectedComponents.join(", ")}. Generate a brief ticket update (1 sentence).`,
        },
      ],
    });

    const update = response.choices[0].message.content || "Activity detected";
    
    await ctx.runMutation(internal.nemotronMutations.addTicketUpdate, {
      issueId: args.issueId,
      update,
      source: "video_analysis",
    });

    return update;
  },
});

export const transcribeAndFilterNoise = action({
  args: {
    audioText: v.string(),
  },
  handler: async (ctx, args) => {
    // Simulate noise filtering and transcription enhancement
    const response = await nemotron.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are Nemotron's NLP module. Clean up noisy transcriptions from loud data center environments. Remove background noise artifacts, fix mishearings, and return clear text.",
        },
        {
          role: "user",
          content: `Raw transcription from noisy data center (90+ dB): "${args.audioText}". Clean it up and return only the clear message.`,
        },
      ],
    });

    return response.choices[0].message.content || args.audioText;
  },
});

export const retrieveSimilarSolutions = internalAction({
  args: {
    description: v.string(),
    assetTag: v.optional(v.string()),
    errorCode: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<string | null> => {
    const similarIssues = await ctx.runQuery(internal.issues.findSimilarIssues, {
      assetTag: args.assetTag,
      errorCode: args.errorCode,
      currentIssueId: "0" as any, // Placeholder for search
    });

    if (similarIssues.length === 0) return null;

    const response = await nemotron.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are Nemotron's knowledge retrieval system. Summarize relevant past solutions for technicians.",
        },
        {
          role: "user",
          content: `Current issue: ${args.description}. Past solutions: ${similarIssues.map((issue, index) => `${index + 1}. ${issue.solution} (by tech ${issue.techId})`).join("; ")}. Provide a 2-sentence summary of the most relevant approach.`,
        },
      ],
    });

    return response.choices[0].message.content;
  },
});
