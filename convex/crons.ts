import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Cleanup old frame cache and queue data every hour
 * This prevents the database from growing indefinitely
 */
crons.interval(
  "cleanup frame data",
  { hours: 1 }, // Run every hour
  internal.agents.frameProcessor.cleanupOldData,
  {}
);

/**
 * Auto-capture frames from active cameras every minute
 * This enables automatic monitoring of technician work
 */
crons.interval(
  "auto-capture camera frames",
  { minutes: 1 }, // Run every minute
  internal.agents.autoCaptureAgent.captureFramesFromActiveCameras,
  {}
);

export default crons;

