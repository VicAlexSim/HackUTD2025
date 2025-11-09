"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

/**
 * Process voice input and respond with Nemotron
 */
export const processVoiceInput = action({
  args: {
    cameraId: v.id("cameraFeeds"),
    audioData: v.string(), // base64 encoded audio
    speaker: v.union(v.literal("technician"), v.literal("engineer")),
  },
  returns: v.union(
    v.object({
      transcription: v.string(),
      isWakeWord: v.literal(false),
    }),
    v.object({
      transcription: v.string(),
      isWakeWord: v.literal(true),
      response: v.string(),
      audioUrl: v.optional(v.string()), // Optional - may be empty for Live Call Mode if ElevenLabs fails
      inventoryOrder: v.optional(v.object({
        partNumber: v.string(),
        partName: v.string(),
        quantity: v.number(),
        currentStock: v.number(),
      })),
    })
  ),
  handler: async (ctx, args): Promise<
    | { transcription: string; isWakeWord: false }
    | { transcription: string; isWakeWord: true; response: string; audioUrl?: string; inventoryOrder?: { partNumber: string; partName: string; quantity: number; currentStock: number } }
  > => {
    // Step 1: Decode the question from base64 (simple encoding from frontend)
    const transcription = Buffer.from(args.audioData, 'base64').toString('utf-8');
    
    // Step 2: Determine if this is a direct question or needs wake word detection
    // - Engineer speaker (Live Call Mode): Always direct questions, no wake word needed
    // - Technician speaker (AI Assistant Mode): Also direct questions when using "Ask Kramtron" button
    // Both modes use direct questions now - wake word detection is not used
    const isDirectQuestion = true; // All questions are direct now
    const isWakeWord = true; // Always respond
    
    // Step 3: Use the full transcription as the prompt
    const prompt = transcription;
    
    // Step 4: Get conversation context
    const context = await ctx.runQuery(internal.agents.voiceChatQueries.getConversationContext, {
      cameraId: args.cameraId,
    });
    
    // Step 5: Get camera/technician context
    const cameraContext = await ctx.runQuery(internal.agents.voiceChatQueries.getCameraContext, {
      cameraId: args.cameraId,
    });
    
    // Step 6: Call Nemotron for response
    console.log("🤖 Calling Nemotron with prompt:", prompt);
    const response = await getNemotronResponse(prompt, context, cameraContext);
    console.log("✅ Nemotron response:", response);
    
    // Step 6.5: Check if the conversation mentions ordering parts
    const inventoryOrder = await detectInventoryOrder(transcription, response);
    let inventoryOrderInfo;
    
    // Step 6.6: Check if the conversation mentions issues that need tickets
    const issueDetected = await detectIssue(transcription, response);
    let ticketCreated = false;
    
    if (inventoryOrder) {
      console.log("📦 Inventory order detected:", inventoryOrder);
      
      // First, try to get the exact part number
      let item = await ctx.runQuery(internal.agents.voiceChatQueries.getInventoryItem, {
        partNumber: inventoryOrder.partNumber,
      });
      
      // If exact part number doesn't exist, try to find a similar part by description
      if (!item) {
        console.log(`⚠️  Part number ${inventoryOrder.partNumber} not found, searching by description...`);
        const searchDescription = `${transcription} ${response}`;
        item = await ctx.runQuery(internal.agents.voiceChatQueries.searchInventoryByDescription, {
          description: searchDescription,
        });
        
        if (item) {
          console.log(`✅ Found similar part: ${item.partNumber} (${item.name})`);
          // Update the part number to the found one
          inventoryOrder.partNumber = item.partNumber;
        } else {
          console.log(`❌ Could not find matching part for: ${inventoryOrder.partNumber}`);
        }
      }
      
      // Only process the order if we found a valid part
      if (item) {
        console.log(`✅ Processing order for: ${item.partNumber} (${item.name})`);
        
        // Update inventory in database
        try {
          // Use the isReplacement flag from detectInventoryOrder
          const isReplacement = inventoryOrder.isReplacement;
          
          const reasonPrefix = isReplacement ? "Replacement ordered" : "Ordered";
          const reason = `${reasonPrefix} via voice: ${transcription}`;
          
          console.log(`📝 Order type: ${isReplacement ? "REPLACEMENT (will deduct broken item)" : "NEW ORDER"}`);
          
          const updateResult = await ctx.runMutation(internal.agents.voiceChatMutations.processInventoryOrder, {
            partNumber: item.partNumber,
            quantity: inventoryOrder.quantity,
            reason: reason,
            isReplacement: isReplacement,
          });
          
          console.log("✅ Database update successful:", updateResult);
          
          // Refresh item data to get latest status - wait a moment for database to sync
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const updatedItem = await ctx.runQuery(internal.agents.voiceChatQueries.getInventoryItem, {
            partNumber: item.partNumber,
          });
          
          if (updatedItem) {
            // Verify the status was actually updated
            if (updatedItem.status !== "on_order") {
              console.error(`❌ Status verification failed! Expected "on_order", got "${updatedItem.status}"`);
              throw new Error(`Status update verification failed: expected "on_order", got "${updatedItem.status}"`);
            }
            
            console.log(`✅ Status verified: ${updatedItem.status} (correctly set to "on_order")`);
            
            // Get inventory info for notification
            inventoryOrderInfo = {
              partNumber: updatedItem.partNumber,
              partName: updatedItem.name,
              quantity: inventoryOrder.quantity,
              currentStock: updatedItem.quantity,
            };
            
            console.log("📦 Inventory order info prepared for notification:", inventoryOrderInfo);
            console.log(`📊 Final status in database: ${updatedItem.status}`);
            console.log(`📊 Inventory page will automatically update via reactive query`);
          } else {
            console.error("❌ Failed to retrieve updated item from database");
            throw new Error("Failed to retrieve updated item from database");
          }
        } catch (error: any) {
          console.error("❌ Failed to update inventory in database:", error);
          // Still show notification with current item data even if update failed
          inventoryOrderInfo = {
            partNumber: item.partNumber,
            partName: item.name,
            quantity: inventoryOrder.quantity,
            currentStock: item.quantity,
          };
        }
      } else {
        console.warn("⚠️  Order detected but no matching part found - notification will not be shown");
      }
    }
    
    // Step 6.7: Create ticket if issue detected
    if (issueDetected) {
      console.log("🎫 Issue detected, creating ticket...");
      try {
        // Use Nemotron to generate ticket details
        const ticketDetails = await generateTicketDetails(transcription, response, cameraContext);
        
        if (ticketDetails) {
          const ticketId = await ctx.runMutation(internal.tickets.createTicketInternal, {
            title: ticketDetails.title,
            description: ticketDetails.description,
            priority: ticketDetails.priority,
            createdBy: "kramtron",
            metadata: {
              cameraId: args.cameraId.toString(),
              detectedIssue: transcription,
              suggestedParts: ticketDetails.suggestedParts || [],
            },
          });
          
          console.log(`✅ Ticket created: ${ticketId} - "${ticketDetails.title}"`);
          ticketCreated = true;
        }
      } catch (error: any) {
        console.error("❌ Failed to create ticket:", error);
        // Continue even if ticket creation fails
      }
    }
    
    // Step 7: Convert response to speech with ElevenLabs
    // Try to generate audio, but continue even if it fails (show text response)
    let audioUrl: string | undefined;
    try {
      audioUrl = await generateSpeech(response);
      console.log("✅ ElevenLabs audio generated successfully");
    } catch (error: any) {
      console.error("❌ ElevenLabs failed:", error.message);
      console.warn("⚠️  Continuing without audio - text response will still be shown");
      // Continue without audio - the text response is more important
      audioUrl = undefined;
    }
    
    // Step 8: Log the interaction
    await ctx.runMutation(internal.agents.voiceChatMutations.logConversation, {
      cameraId: args.cameraId,
      speaker: args.speaker,
      message: transcription,
      isWakeWord: true,
      response,
      audioUrl: audioUrl || undefined,
    });
    
    return {
      transcription,
      isWakeWord: true,
      response,
      audioUrl: audioUrl || undefined,
      inventoryOrder: inventoryOrderInfo,
    };
  },
});

/**
 * Transcribe audio to text
 */
async function transcribeAudio(audioData: string): Promise<string> {
  // For now, return a placeholder
  // In production, you would use:
  // - ElevenLabs Speech-to-Text
  // - OpenAI Whisper API
  // - Google Speech-to-Text
  // - Azure Speech Services
  
  // Placeholder implementation
  console.log("Audio transcription requested (length:", audioData.length, ")");
  return "Hey Kramtron, what should I check on this equipment?";
}

/**
 * Detect wake word "Hey Kramtron"
 */
function detectWakeWord(transcription: string): boolean {
  const normalized = transcription.toLowerCase().trim();
  const wakeWords = [
    "hey kramtron",
    "hey kramhtron", 
    "hey cramtron",
    "hey kramtron",
    "kramtron",
  ];
  
  return wakeWords.some(wake => normalized.includes(wake));
}

/**
 * Extract prompt after wake word
 */
function extractPrompt(transcription: string): string {
  const normalized = transcription.toLowerCase();
  const wakeWords = ["hey kramtron", "hey kramhtron", "kramtron"];
  
  for (const wake of wakeWords) {
    const index = normalized.indexOf(wake);
    if (index !== -1) {
      // Extract everything after the wake word
      return transcription.substring(index + wake.length).trim();
    }
  }
  
  return transcription;
}

/**
 * Get response from Nemotron
 */
async function getNemotronResponse(
  prompt: string, 
  context: Array<{ role: string; content: string; timestamp: number }>,
  cameraContext: {
    cameraName: string;
    location: string;
    recentAnalysis?: string;
    activeTickets: Array<{ title: string; description: string; priority: string }>;
  }
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return "I'm sorry, I'm not configured properly. Please contact support.";
  }
  
  // Build system prompt with context - VERY CONCISE for voice
  const systemPrompt = `You are Kramtron, a helpful AI assistant for data center technicians.

CRITICAL RULES:
1. Answer questions directly and concisely
2. Maximum 2 sentences per response
3. No testing scenarios, no procedures unless asked
4. Just answer what was asked
5. Use simple, clear language

INVENTORY ORDERING:
- When a technician asks to order parts, acknowledge it and mention the part number
- Example: "I'll order that SRV-DL380G10 server for you right away."
- Part numbers follow format: XXX-XXXXXX (e.g., SRV-DL380G10, NET-CS9300, PWR-UPS-APC3000)

INVENTORY REPLACEMENTS:
- When a technician says something is broken, faulty, or needs replacement, acknowledge it
- Example: "I'll order a replacement for that broken SRV-DL380G10 server. The broken unit will be deducted from inventory."
- The system will automatically deduct the broken item and order a new one

Context:
- Camera: ${cameraContext.cameraName}
- Location: ${cameraContext.location}

Example:
Q: "what is 1 + 2"
A: "1 plus 2 equals 3."

Q: "how do I check the power supply"
A: "First, verify the circuit breaker is on. Then check the power cable connections are secure."

Q: "can you order a Dell PowerEdge server, part number SRV-DL380G10"
A: "I'll order that SRV-DL380G10 server for you right away."

Q: "the SRV-DL380G10 server is broken and needs replacement"
A: "I'll order a replacement SRV-DL380G10 server. The broken unit will be deducted from inventory."`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://kramhtron.ai", // Optional: for OpenRouter analytics
        "X-Title": "Kramhtron.ai", // Optional: for OpenRouter analytics
      },
      body: JSON.stringify({
        model: "nvidia/llama-3.1-nemotron-70b-instruct", // Using the working model
        messages: [
          { role: "system", content: systemPrompt },
          ...context.map(c => ({ role: c.role === "assistant" ? "assistant" : "user", content: c.content })),
          { role: "user", content: prompt },
        ],
        max_tokens: 50, // Very short responses for voice (2 sentences max)
        temperature: 0.3, // Lower temperature for more focused responses
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ OpenRouter API error:", errorText);
      return "I'm having trouble connecting right now. Please try again.";
    }
    
    const data: any = await response.json();
    
    // Check if response has the expected structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("❌ Unexpected API response structure:", JSON.stringify(data));
      return "I received an unexpected response. Please try again.";
    }
    
    console.log("✅ Nemotron response generated successfully");
    return data.choices[0].message.content;
  } catch (error) {
    console.error("❌ Nemotron API error:", error);
    return "I'm having trouble processing that right now. Please try again.";
  }
}

/**
 * Generate speech from text using ElevenLabs REST API with Rachel's voice
 * ALWAYS uses ElevenLabs - no fallbacks!
 */
async function generateSpeech(text: string): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    const errorMsg = "❌ CRITICAL: ElevenLabs API key not set! Check ELEVENLABS_API_KEY environment variable.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    // Rachel's voice ID
    const RACHEL_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";
    
    console.log("🎤 Generating speech with ElevenLabs Rachel voice...");
    console.log("📊 Using your HackUTD2025 API key");
    
    // Use REST API directly instead of SDK
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${RACHEL_VOICE_ID}`, {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      const errorMsg = `❌ ElevenLabs API error (${response.status}): ${errorText}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    console.log("✅ Audio response received from ElevenLabs");
    
    // Convert response to buffer
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);
    
    // Convert to base64 data URL for direct playback in browser
    const base64Audio = audioBuffer.toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
    
    console.log("✅ ElevenLabs audio generated successfully with Rachel's voice!");
    console.log(`📏 Audio size: ${audioBuffer.length} bytes`);
    return audioUrl;
  } catch (error: any) {
    const errorMsg = `❌ Failed to generate ElevenLabs speech: ${error.message}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}

/**
 * Detect if the conversation mentions ordering inventory parts
 */
async function detectInventoryOrder(
  userMessage: string,
  aiResponse: string
): Promise<{ partNumber: string; quantity: number; isReplacement: boolean } | null> {
  const combined = `${userMessage} ${aiResponse}`.toLowerCase();
  
  console.log("🔍 Checking for inventory order in:", combined);
  
  // Replacement phrases (broken, faulty, needs replacement)
  const replacementPhrases = [
    "broken",
    "faulty",
    "failed",
    "needs replacement",
    "needs to be replaced",
    "replace",
    "replacement",
    "get replaced",
    "is broken",
    "is faulty",
    "is failed",
    "stopped working",
    "not working",
    "malfunctioning",
    "defective",
  ];
  
  // Regular order phrases
  const orderPhrases = [
    "order",
    "need",
    "get me",
    "can you order",
    "please order",
    "we need",
    "get a",
    "buy",
    "purchase",
    "place an order",
    "get a new",
    "need a new",
  ];
  
  // Check if it's a replacement (broken/faulty item)
  const isReplacement = replacementPhrases.some(phrase => combined.includes(phrase));
  
  // Check if any order phrase is mentioned
  const hasOrderPhrase = orderPhrases.some(phrase => combined.includes(phrase)) || isReplacement;
  
  if (!hasOrderPhrase) {
    console.log("❌ No order phrase detected");
    return null;
  }
  
  if (isReplacement) {
    console.log("🔧 Replacement detected (broken/faulty item)");
  } else {
    console.log("✅ Order phrase detected, searching for part number...");
  }
  
  // Common part number patterns - more flexible
  const partPatterns = [
    // Explicit part number mention
    /(?:part|part number|part#|p\/n)\s*[:#]?\s*([A-Z]{3}-[A-Z0-9]+)/gi,
    // Direct part number format (3 letters, dash, alphanumeric)
    /\b([A-Z]{3}-[A-Z0-9]+)\b/gi,
  ];
  
  for (const pattern of partPatterns) {
    const matches = Array.from(combined.matchAll(pattern));
    console.log(`🔍 Pattern matches found: ${matches.length}`);
    
    for (const match of matches) {
      const partNumber = match[1].toUpperCase();
      console.log(`📦 Found potential part number: ${partNumber}`);
      
      // Try to extract quantity
      const quantityMatch = combined.match(/(\d+)\s*(?:units?|pieces?|of)?/i);
      const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
      
      console.log(`📦 Detected ${isReplacement ? 'replacement' : 'order'}: ${partNumber} x${quantity}`);
      return { partNumber, quantity, isReplacement };
    }
  }
  
  console.log("❌ No part number pattern found in conversation");
  return null;
}

/**
 * Detect if the conversation mentions an issue that needs a ticket
 */
async function detectIssue(
  userMessage: string,
  aiResponse: string
): Promise<boolean> {
  const combined = `${userMessage} ${aiResponse}`.toLowerCase();
  
  console.log("🔍 Checking for issues that need tickets in:", combined);
  
  // Issue keywords that indicate a problem
  const issuePhrases = [
    "not working",
    "broken",
    "faulty",
    "failed",
    "issue",
    "problem",
    "error",
    "malfunction",
    "down",
    "offline",
    "needs repair",
    "needs replacement",
    "stopped working",
    "won't start",
    "can't connect",
    "overheating",
    "no power",
    "no signal",
    "critical",
    "urgent",
    "emergency",
    "needs attention",
    "needs to be fixed",
    "needs to be replaced",
    "order",
    "need to order",
    "can you order",
    "please order",
  ];
  
  // Check if any issue phrase is mentioned
  const hasIssue = issuePhrases.some(phrase => combined.includes(phrase));
  
  if (hasIssue) {
    console.log("✅ Issue detected - ticket will be created");
    return true;
  }
  
  console.log("❌ No issue detected");
  return false;
}

/**
 * Use Nemotron to generate ticket details from the conversation
 */
async function generateTicketDetails(
  userMessage: string,
  aiResponse: string,
  cameraContext: {
    cameraName: string;
    location: string;
    recentAnalysis?: string;
    activeTickets: Array<{ title: string; description: string; priority: string }>;
  }
): Promise<{ title: string; description: string; priority: "low" | "medium" | "high" | "critical"; suggestedParts?: string[] } | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("❌ OpenRouter API key not set");
    return null;
  }
  
  const prompt = `You are Kramtron, an AI assistant for data center operations. Based on the conversation below, create a ticket with appropriate details.

CONVERSATION:
User: ${userMessage}
Kramtron: ${aiResponse}

CONTEXT:
- Camera: ${cameraContext.cameraName}
- Location: ${cameraContext.location}

INSTRUCTIONS:
1. Create a concise title (max 50 characters) describing the issue
2. Write a clear description (2-3 sentences) explaining the problem
3. Determine priority: "low", "medium", "high", or "critical"
   - Critical: System down, safety issues, data loss risk
   - High: Major functionality broken, affecting operations
   - Medium: Minor issues, can wait
   - Low: Cosmetic issues, non-urgent
4. If parts are mentioned, extract part numbers (format: XXX-XXXXXX)

Respond ONLY with a JSON object in this exact format:
{
  "title": "Brief issue title",
  "description": "Detailed description of the issue",
  "priority": "high",
  "suggestedParts": ["SRV-DL380G10", "NET-CS9300"]
}

If no parts are mentioned, use empty array for suggestedParts: []`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "nvidia/llama-3.1-nemotron-70b-instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ OpenRouter API error:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    const nemotronResponse = data.choices[0].message.content;
    console.log("🤖 Nemotron ticket generation response:", nemotronResponse);

    // Parse JSON response
    const jsonMatch = nemotronResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("❌ Could not parse JSON from Nemotron response");
      return null;
    }

    const ticketDetails = JSON.parse(jsonMatch[0]);
    
    // Validate and return
    if (ticketDetails.title && ticketDetails.description && ticketDetails.priority) {
      // Ensure priority is valid
      const validPriorities = ["low", "medium", "high", "critical"];
      const priority = validPriorities.includes(ticketDetails.priority) 
        ? ticketDetails.priority 
        : "medium";
      
      return {
        title: ticketDetails.title.substring(0, 100), // Limit title length
        description: ticketDetails.description.substring(0, 500), // Limit description length
        priority: priority as "low" | "medium" | "high" | "critical",
        suggestedParts: ticketDetails.suggestedParts || [],
      };
    }
    
    console.error("❌ Invalid ticket details from Nemotron");
    return null;
  } catch (error: any) {
    console.error("❌ Error generating ticket details:", error);
    return null;
  }
}

