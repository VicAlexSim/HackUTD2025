"use node";

import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";

/**
 * Use Nemotron to automatically assign a ticket to the best available technician
 */
export const assignTicketWithAI = internalAction({
  args: {
    ticketId: v.id("tickets"),
  },
  handler: async (ctx: any, args: any): Promise<{ technicianId: any; technicianName: string; reasoning: string } | null> => {
    // Get ticket details
    const ticket: any = await ctx.runQuery(internal.tickets.getTicketByIdInternal, {
      ticketId: args.ticketId,
    });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    // If ticket is already assigned, skip (basic assignment already happened)
    if (ticket.assignedTechnicianId) {
      console.log(`ℹ️  Ticket ${args.ticketId} already assigned to technician, skipping AI assignment`);
      return null;
    }

    // Get all available technicians
    const technicians: any[] = await ctx.runQuery(internal.technicians.listTechniciansInternal, {});
    
    // Filter to only available technicians
    let availableTechnicians: any[] = technicians.filter(
      (tech: any) => tech.status === "available" && !tech.currentTicketId
    );
    
    // Prioritize technicians that are assigned to cameras
    const cameras: any[] = await ctx.runQuery(internal.cameras.listCamerasInternal, {});
    const cameraTechnicianIds = new Set(
      cameras
        .map((c: any) => c.assignedTechnicianId)
        .filter((id: any): id is any => id !== undefined)
    );
    
    // Sort: technicians with cameras first
    availableTechnicians.sort((a: any, b: any) => {
      const aHasCamera = cameraTechnicianIds.has(a._id);
      const bHasCamera = cameraTechnicianIds.has(b._id);
      if (aHasCamera && !bHasCamera) return -1;
      if (!aHasCamera && bHasCamera) return 1;
      return 0;
    });

    if (availableTechnicians.length === 0) {
      console.log("⚠️  No available technicians found for ticket assignment");
      return null;
    }

    // Use Nemotron to match ticket with best technician
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.warn("⚠️  OpenRouter API key not set, using simple skill matching");
      // Fallback to simple skill matching
      return await simpleSkillMatch(ctx, args.ticketId, ticket, availableTechnicians);
    }

    // Build prompt for Nemotron
    const techniciansList = availableTechnicians.map((tech: any, idx: number) => {
      return `${idx + 1}. ${tech.name}
   - Skills: ${tech.skills.join(", ")}
   - Location: ${tech.location || "Not specified"}
   - Status: ${tech.status}`;
    }).join("\n\n");

    const prompt = `You are Kramtron, an AI assistant for data center operations. Your task is to assign a ticket to the best available technician.

TICKET DETAILS:
Title: ${ticket.title}
Description: ${ticket.description}
Priority: ${ticket.priority}
${ticket.metadata?.detectedIssue ? `Detected Issue: ${ticket.metadata.detectedIssue}` : ""}
${ticket.metadata?.suggestedParts ? `Suggested Parts: ${ticket.metadata.suggestedParts.join(", ")}` : ""}

AVAILABLE TECHNICIANS:
${techniciansList}

Analyze the ticket requirements and match it with the most qualified available technician. Consider:
1. Skills match (most important)
2. Location proximity (if relevant)
3. Current workload (all listed are available)

Respond with ONLY a JSON object in this exact format:
{
  "technicianIndex": <number 1-N>,
  "reasoning": "<brief explanation of why this technician is the best match>"
}

Example response:
{
  "technicianIndex": 2,
  "reasoning": "John has expertise in networking and server maintenance, which matches the ticket requirements for network switch replacement."
}`;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://kramhtron.ai",
          "X-Title": "Kramhtron AI",
        },
        body: JSON.stringify({
          model: "nvidia/llama-3.1-nemotron-70b-instruct",
          messages: [
            {
              role: "system",
              content: "You are Kramtron, an AI assistant for data center operations. Always respond with valid JSON only.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 200,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Nemotron API error: ${response.status} - ${errorText}`);
        // Fallback to simple skill matching
        return await simpleSkillMatch(ctx, args.ticketId, ticket, availableTechnicians);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || "";

      // Parse JSON response
      let assignment;
      try {
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          assignment = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        console.error("❌ Failed to parse Nemotron response:", content);
        // Fallback to simple skill matching
        return await simpleSkillMatch(ctx, args.ticketId, ticket, availableTechnicians);
      }

      const technicianIndex = assignment.technicianIndex - 1; // Convert to 0-based index
      
      if (technicianIndex < 0 || technicianIndex >= availableTechnicians.length) {
        console.error(`❌ Invalid technician index: ${technicianIndex}`);
        return await simpleSkillMatch(ctx, args.ticketId, ticket, availableTechnicians);
      }

      const selectedTechnician = availableTechnicians[technicianIndex];
      const reasoning = assignment.reasoning || "AI-selected based on skills and availability";

      console.log(`✅ Nemotron selected: ${selectedTechnician.name} - ${reasoning}`);

      // Assign the ticket
      await ctx.runMutation(internal.tickets.assignTicketInternal, {
        ticketId: args.ticketId,
        technicianId: selectedTechnician._id,
        reasoning: reasoning,
      });

      return {
        technicianId: selectedTechnician._id,
        technicianName: selectedTechnician.name,
        reasoning: reasoning,
      };
    } catch (error: any) {
      console.error("❌ Error in AI ticket assignment:", error);
      // Fallback to simple skill matching
      return await simpleSkillMatch(ctx, args.ticketId, ticket, availableTechnicians);
    }
  },
});

/**
 * Simple fallback: match based on skills in ticket description
 */
async function simpleSkillMatch(
  ctx: any,
  ticketId: any,
  ticket: any,
  availableTechnicians: any[]
): Promise<{ technicianId: any; technicianName: string; reasoning: string } | null> {
  const description = `${ticket.title} ${ticket.description}`.toLowerCase();
  
  // Score each technician based on skill matches
  let bestMatch: { tech: any; score: number } | null = null;
  
  for (const tech of availableTechnicians) {
    let score = 0;
    
    // Check if any of the technician's skills appear in the ticket description
    for (const skill of tech.skills) {
      if (description.includes(skill.toLowerCase())) {
        score += 10;
      }
    }
    
    // Bonus for location match if ticket has location info
    if (ticket.metadata?.cameraId && tech.location) {
      // Could add location matching logic here
      score += 2;
    }
    
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { tech, score };
    }
  }
  
  if (bestMatch && bestMatch.score > 0) {
    const selectedTech = bestMatch.tech;
    await ctx.runMutation(internal.tickets.assignTicketInternal, {
      ticketId,
      technicianId: selectedTech._id,
      reasoning: `Matched based on skills: ${selectedTech.skills.join(", ")}`,
    });
    
    return {
      technicianId: selectedTech._id,
      technicianName: selectedTech.name,
      reasoning: `Matched based on skills: ${selectedTech.skills.join(", ")}`,
    };
  }
  
  // If no skill match, assign to first available technician
  if (availableTechnicians.length > 0) {
    const selectedTech = availableTechnicians[0];
    await ctx.runMutation(internal.tickets.assignTicketInternal, {
      ticketId,
      technicianId: selectedTech._id,
      reasoning: "Assigned to first available technician (no skill match found)",
    });
    
    return {
      technicianId: selectedTech._id,
      technicianName: selectedTech.name,
      reasoning: "Assigned to first available technician",
    };
  }
  
  return null;
}

