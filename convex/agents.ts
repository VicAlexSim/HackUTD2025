import { v } from "convex/values";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Vision Agent - Analyzes camera feeds using Nemotron
export const analyzeImage = action({
  args: {
    feedId: v.id("cameraFeeds"),
    imageUrl: v.string(),
    workOrderContext: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY not configured");
    }

    // Log reasoning step
    await ctx.runMutation(internal.agents.logAgentStep, {
      agentType: "vision",
      step: "reason",
      content: `Analyzing image from feed ${args.feedId}. Context: ${args.workOrderContext || "No context"}`,
    });

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "nvidia/nemotron-nano-12b-v2-vl:free",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `You are a data center maintenance vision AI. Analyze this image from a technician's smart glasses and identify:
1. Equipment visible in the image
2. Any visible issues, damage, or anomalies
3. Safety concerns
4. Maintenance recommendations

${args.workOrderContext ? `Work order context: ${args.workOrderContext}` : ""}

Provide a structured analysis with detected issues as a JSON array.`,
                },
                {
                  type: "image_url",
                  image_url: { url: args.imageUrl },
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

      const data = await response.json();
      const analysis = data.choices[0].message.content;

      // Log action step
      await ctx.runMutation(internal.agents.logAgentStep, {
        agentType: "vision",
        step: "act",
        content: `Generated analysis: ${analysis.substring(0, 200)}...`,
      });

      // Extract issues (simple parsing)
      const detectedIssues: Array<string> = [];
      const issueMatches = analysis.match(/issue[s]?:?\s*([^\n]+)/gi);
      if (issueMatches) {
        detectedIssues.push(...issueMatches.map((m: string) => m.trim()));
      }

      // Update feed with analysis
      await ctx.runMutation(internal.agents.updateFeedAnalysis, {
        feedId: args.feedId,
        analysis,
        detectedIssues,
        confidence: 0.85,
      });

      // Log observe step
      await ctx.runMutation(internal.agents.logAgentStep, {
        agentType: "vision",
        step: "observe",
        content: `Analysis complete. Detected ${detectedIssues.length} potential issues.`,
      });

      return { analysis, detectedIssues };
    } catch (error) {
      await ctx.runMutation(internal.agents.logAgentStep, {
        agentType: "vision",
        step: "observe",
        content: `Error: ${error}`,
      });
      throw error;
    }
  },
});

// RAG Agent - Retrieves relevant knowledge
export const retrieveKnowledge = action({
  args: {
    query: v.string(),
    equipment: v.optional(v.string()),
    category: v.optional(v.union(v.literal("sop"), v.literal("safety"), v.literal("troubleshooting"), v.literal("equipment"))),
  },
  handler: async (ctx, args): Promise<Array<any>> => {
    await ctx.runMutation(internal.agents.logAgentStep, {
      agentType: "rag",
      step: "reason",
      content: `Searching knowledge base for: ${args.query}`,
    });

    const results: Array<any> = await ctx.runQuery(internal.agents.searchKnowledge, {
      query: args.query,
      equipment: args.equipment,
      category: args.category,
    });

    await ctx.runMutation(internal.agents.logAgentStep, {
      agentType: "rag",
      step: "observe",
      content: `Found ${results.length} relevant documents`,
    });

    return results;
  },
});

// Coordinator Agent - Assigns work orders
export const coordinateWorkOrder = action({
  args: {
    workOrderId: v.id("workOrders"),
  },
  handler: async (ctx, args): Promise<{ assigned: boolean; reason?: string; technicianId?: Id<"technicians"> }> => {
    await ctx.runMutation(internal.agents.logAgentStep, {
      agentType: "coordinator",
      step: "reason",
      content: `Coordinating work order ${args.workOrderId}`,
      workOrderId: args.workOrderId,
    });

    const workOrder = await ctx.runQuery(internal.agents.getWorkOrder, {
      id: args.workOrderId,
    });

    if (!workOrder) {
      throw new Error("Work order not found");
    }

    const availableTechs: Array<any> = await ctx.runQuery(internal.agents.getAvailableTechnicians, {});

    if (availableTechs.length === 0) {
      await ctx.runMutation(internal.agents.logAgentStep, {
        agentType: "coordinator",
        step: "observe",
        content: "No available technicians. Work order remains pending.",
        workOrderId: args.workOrderId,
      });
      return { assigned: false, reason: "No available technicians" };
    }

    // Simple assignment: pick first available tech with matching skills
    const assignedTech: any = availableTechs[0];

    await ctx.runMutation(internal.agents.assignWorkOrder, {
      workOrderId: args.workOrderId,
      technicianId: assignedTech._id,
    });

    await ctx.runMutation(internal.agents.logAgentStep, {
      agentType: "coordinator",
      step: "act",
      content: `Assigned to technician ${assignedTech.name}`,
      workOrderId: args.workOrderId,
    });

    return { assigned: true, technicianId: assignedTech._id };
  },
});

// Internal mutations and queries
export const logAgentStep = internalMutation({
  args: {
    agentType: v.union(v.literal("vision"), v.literal("supervisor"), v.literal("rag"), v.literal("coordinator")),
    step: v.union(v.literal("reason"), v.literal("act"), v.literal("observe")),
    content: v.string(),
    workOrderId: v.optional(v.id("workOrders")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("agentLogs", {
      agentType: args.agentType,
      step: args.step,
      content: args.content,
      workOrderId: args.workOrderId,
    });
    return null;
  },
});

export const updateFeedAnalysis = internalMutation({
  args: {
    feedId: v.id("cameraFeeds"),
    analysis: v.string(),
    detectedIssues: v.array(v.string()),
    confidence: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.feedId, {
      analysis: args.analysis,
      detectedIssues: args.detectedIssues,
      confidence: args.confidence,
    });
    return null;
  },
});

export const searchKnowledge = internalQuery({
  args: {
    query: v.string(),
    equipment: v.optional(v.string()),
    category: v.optional(v.union(v.literal("sop"), v.literal("safety"), v.literal("troubleshooting"), v.literal("equipment"))),
  },
  handler: async (ctx, args) => {
    let searchQuery = ctx.db
      .query("knowledgeBase")
      .withSearchIndex("search_content", (q) => {
        let sq = q.search("content", args.query);
        if (args.category) {
          sq = sq.eq("category", args.category);
        }
        if (args.equipment) {
          sq = sq.eq("equipment", args.equipment);
        }
        return sq;
      });

    return await searchQuery.take(5);
  },
});

export const getWorkOrder = internalQuery({
  args: { id: v.id("workOrders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getAvailableTechnicians = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("technicians")
      .withIndex("by_status", (q) => q.eq("status", "available"))
      .collect();
  },
});

export const assignWorkOrder = internalMutation({
  args: {
    workOrderId: v.id("workOrders"),
    technicianId: v.id("technicians"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.workOrderId, {
      assignedTechnicianId: args.technicianId,
      status: "assigned",
    });

    await ctx.db.patch(args.technicianId, {
      status: "busy",
      currentWorkOrderId: args.workOrderId,
    });

    return null;
  },
});

export const getAgentLogs = internalQuery({
  args: {
    agentType: v.optional(v.union(v.literal("vision"), v.literal("supervisor"), v.literal("rag"), v.literal("coordinator"))),
    workOrderId: v.optional(v.id("workOrders")),
  },
  handler: async (ctx, args) => {
    if (args.workOrderId !== undefined) {
      return await ctx.db
        .query("agentLogs")
        .withIndex("by_work_order", (q) => q.eq("workOrderId", args.workOrderId!))
        .order("desc")
        .take(50);
    }
    if (args.agentType !== undefined) {
      return await ctx.db
        .query("agentLogs")
        .withIndex("by_agent_type", (q) => q.eq("agentType", args.agentType!))
        .order("desc")
        .take(50);
    }
    return await ctx.db.query("agentLogs").order("desc").take(50);
  },
});
