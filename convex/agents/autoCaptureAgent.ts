"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

/**
 * Auto-Capture Agent
 * 
 * Automatically captures frames from active camera feeds and sends them
 * for analysis. This runs on a schedule (every minute) and checks which
 * cameras are due for frame capture.
 */

/**
 * Main scheduled function - captures frames from all cameras that need it
 * This is called by the cron job every minute
 */
export const captureFramesFromActiveCameras = internalAction({
  args: {},
  handler: async (ctx): Promise<{ processed: number; success: number; errors: number } | { processed: number; message: string }> => {
    console.log("🎥 Auto-capture: Checking active cameras...");

    // Get cameras that need frame capture
    const camerasToProcess = await ctx.runQuery(internal.agents.autoCaptureQueries.getCamerasNeedingCapture);

    if (camerasToProcess.length === 0) {
      console.log("   No cameras need processing");
      return { processed: 0, message: "No active cameras" };
    }

    console.log(`   Found ${camerasToProcess.length} cameras to process`);

    let successCount = 0;
    let errorCount = 0;

    // Process each camera
    for (const camera of camerasToProcess) {
      try {
        console.log(`   Processing camera: ${camera.name} (${camera._id})`);
        
        await captureFrameFromCamera(ctx, camera);
        
        // Update last analyzed timestamp
        await ctx.runMutation(internal.agents.autoCaptureQueries.updateLastAnalyzed, {
          cameraId: camera._id,
        });

        successCount++;
      } catch (error: any) {
        console.error(`   Error processing camera ${camera.name}:`, error.message);
        errorCount++;
      }
    }

    console.log(`✅ Auto-capture complete: ${successCount} success, ${errorCount} errors`);

    return {
      processed: camerasToProcess.length,
      success: successCount,
      errors: errorCount,
    };
  },
});

/**
 * Capture a single frame from a camera and send for analysis
 */
async function captureFrameFromCamera(ctx: any, camera: any) {
  const { streamUrl, _id: cameraId } = camera;

  // Check if it's a YouTube URL or other video source
  if (streamUrl.includes('youtube.com') || streamUrl.includes('youtu.be')) {
    // For YouTube URLs, we can't directly capture frames
    // Instead, log that manual frame extraction is needed
    console.log(`   ⚠️  Camera ${camera.name} uses YouTube URL - requires manual frame extraction`);
    return;
  }

  // For actual video streams (RTSP, HTTP, etc.), we'd use opencv or similar
  // For now, we'll generate a placeholder/test frame to demonstrate the flow
  
  // In production, you would:
  // 1. Use opencv to capture frame from RTSP stream
  // 2. Encode as base64
  // 3. Send to frame processor

  // For demo purposes, create a test notification
  console.log(`   📸 Would capture frame from: ${streamUrl}`);
  
  // You could uncomment this to test with actual frame data:
  /*
  const testFrame = await generateTestFrame(camera);
  
  await ctx.runAction(internal.agents.frameProcessor.submitFrame, {
    cameraId,
    frameData: testFrame,
    priority: 5,
  });
  */
}

/**
 * Helper function to generate a test frame (for demo purposes)
 * In production, this would be replaced with actual frame capture
 */
function generateTestFrame(camera: any): string {
  // This would be replaced with actual frame data from video capture
  // For now, return empty string to indicate no frame available
  return "";
}

