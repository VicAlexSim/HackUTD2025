"use node";

import { v } from "convex/values";
import { internalAction, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";

export const sendVoiceAlert = internalAction({
  args: {
    technicianId: v.id("technicians"),
    message: v.string(),
    triggerReason: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if we should speak (avoid annoying technician)
    const shouldSpeak = await decideShouldSpeak(ctx, args.technicianId, args.triggerReason);
    
    if (!shouldSpeak) {
      // Log but don't speak
      await ctx.runMutation(internal.agents.reactMutations.logVoiceInteraction, {
        technicianId: args.technicianId,
        message: args.message,
        triggerReason: args.triggerReason,
        wasSpoken: false,
      });
      return { spoken: false, reason: "Low priority or too frequent" };
    }

    // Generate speech with ElevenLabs
    const audioUrl = await generateSpeech(args.message);
    
    // Store interaction
    await ctx.runMutation(internal.agents.reactMutations.logVoiceInteraction, {
      technicianId: args.technicianId,
      message: args.message,
      triggerReason: args.triggerReason,
      wasSpoken: true,
      audioUrl: audioUrl || undefined,
    });

    return { spoken: true, audioUrl };
  },
});

async function decideShouldSpeak(ctx: any, technicianId: string, triggerReason: string): Promise<boolean> {
  // Always speak for safety and critical issues
  if (triggerReason === "safety" || triggerReason === "critical") {
    return true;
  }
  
  // Check recent interactions to avoid annoying technician
  const recentInteractions = await ctx.runQuery(
    internal.agents.ragQueries.getRecentInteractions,
    { technicianId, minutes: 5 }
  );
  
  // Don't speak if we've spoken more than 2 times in last 5 minutes
  const spokenCount = recentInteractions.filter((i: any) => i.wasSpoken).length;
  if (spokenCount >= 2) {
    return false;
  }
  
  return true;
}

async function generateSpeech(message: string): Promise<string | null> {
  // Note: ElevenLabs API key should be set as environment variable
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    console.warn("ElevenLabs API key not set");
    return null;
  }

  try {
    const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM", {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: message,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!response.ok) {
      console.error("ElevenLabs API error:", await response.text());
      return null;
    }

    // In production, you'd upload this to Convex storage
    // For now, return a placeholder
    return "audio_generated";
  } catch (error) {
    console.error("Failed to generate speech:", error);
    return null;
  }
}



