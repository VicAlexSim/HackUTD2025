"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

export const processIssue = internalAction({
  args: {
    cameraId: v.id("cameraFeeds"),
    issues: v.array(v.string()),
    analysis: v.string(),
  },
  handler: async (ctx, args) => {
    // REASON: Analyze the issue and determine action
    const reasoning = await reason(args.issues, args.analysis);
    
    await ctx.runMutation(internal.agents.reactMutations.logStep, {
      step: "reason",
      content: reasoning,
      agentType: "react",
    });

    // ACT: Take appropriate action
    const action = await act(ctx, reasoning, args.cameraId);
    
    await ctx.runMutation(internal.agents.reactMutations.logStep, {
      step: "act",
      content: JSON.stringify(action),
      agentType: "react",
    });

    // OBSERVE: Check the result
    const observation = await observe(ctx, action);
    
    await ctx.runMutation(internal.agents.reactMutations.logStep, {
      step: "observe",
      content: observation,
      agentType: "react",
    });

    return { reasoning, action, observation };
  },
});

async function reason(issues: string[], analysis: string): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
          content: "You are a reasoning agent. Analyze issues and determine: 1) Severity (low/medium/high/critical) 2) Required action (create_ticket/voice_alert/both/none) 3) Suggested parts if needed 4) Whether to speak to technician"
        },
        {
          role: "user",
          content: `Issues detected: ${issues.join(', ')}\n\nFull analysis: ${analysis}\n\nProvide reasoning in JSON format: {severity, action, suggestedParts, shouldSpeak, speakReason}`
        }
      ],
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

async function act(ctx: any, reasoning: string, cameraId: string): Promise<any> {
  try {
    const reasoningData = JSON.parse(reasoning);
    const actions: any = { ticketCreated: false, voiceAlertSent: false };

    // Create ticket if needed
    if (reasoningData.action.includes("create_ticket") || reasoningData.action.includes("both")) {
      const camera = await ctx.runQuery(internal.cameras.getCameraById, { cameraId });
      
      const ticketId = await ctx.runMutation(internal.tickets.createTicketInternal, {
        title: `Auto-detected issue: ${reasoningData.severity} priority`,
        description: `Vision AI detected issues at ${camera?.location || 'unknown location'}. Suggested parts: ${reasoningData.suggestedParts?.join(', ') || 'none'}`,
        priority: reasoningData.severity,
        createdBy: "system",
        metadata: {
          cameraId,
          detectedIssue: reasoning,
          suggestedParts: reasoningData.suggestedParts || [],
        },
      });
      
      actions.ticketCreated = true;
      actions.ticketId = ticketId;
    }

    // Send voice alert if needed
    if (reasoningData.shouldSpeak && (reasoningData.action.includes("voice_alert") || reasoningData.action.includes("both"))) {
      const camera = await ctx.runQuery(internal.cameras.getCameraById, { cameraId });
      
      if (camera?.assignedTechnicianId) {
        await ctx.runAction(internal.agents.voiceAgent.sendVoiceAlert, {
          technicianId: camera.assignedTechnicianId,
          message: generateVoiceMessage(reasoningData),
          triggerReason: reasoningData.speakReason || "critical",
        });
        actions.voiceAlertSent = true;
      }
    }

    return actions;
  } catch (e) {
    return { error: "Failed to parse reasoning", ticketCreated: false, voiceAlertSent: false };
  }
}

async function observe(ctx: any, action: any): Promise<string> {
  if (action.error) {
    return `Action failed: ${action.error}`;
  }
  
  const observations: string[] = [];
  
  if (action.ticketCreated) {
    observations.push(`Ticket ${action.ticketId} created successfully`);
  }
  
  if (action.voiceAlertSent) {
    observations.push("Voice alert sent to technician");
  }
  
  if (observations.length === 0) {
    observations.push("No action required");
  }
  
  return observations.join(". ");
}

function generateVoiceMessage(reasoningData: any): string {
  const messages: Record<string, string> = {
    safety: "Safety alert: Please stop and review your current procedure.",
    error: "I've detected a potential error in your work. Please double-check your last step.",
    critical: "Critical issue detected. Please pause and assess the situation.",
  };
  
  return messages[reasoningData.speakReason] || "Please review your current task.";
}
