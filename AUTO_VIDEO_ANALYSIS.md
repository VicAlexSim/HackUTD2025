# Automatic Video Analysis System

## Overview

Your system now supports **automatic frame analysis** for technician cameras. When cameras are marked for auto-analysis, the system will automatically capture and analyze frames at configured intervals.

## 🚀 How It Works

```
Every Minute (Cron Job)
    ↓
Check Active Cameras
    ↓
Camera needs frame? → YES
    ↓
Capture Frame → Frame Processor → Vision AI → Agents
    ↓                                           ↓
Cache/Batch                              ReAct Workflow
                                              ↓
                                        Auto-Actions
```

## 🎯 Setup Methods

### Method 1: External Frame Pusher (Recommended for Production)

For real camera streams (RTSP, smart glasses, etc.), use an external service to push frames:

**Step 1: Enable Auto-Analysis in Dashboard**

```typescript
// In your frontend or via Convex dashboard
await convex.mutation(api.cameras.toggleAutoAnalysis, {
  cameraId: "k17...",
  enabled: true,
  intervalSeconds: 30, // Capture every 30 seconds
});
```

**Step 2: Set Up Frame Pusher**

Run this script on a server that can access the camera stream:

```bash
# Install dependencies
pip install opencv-python requests

# Run continuous monitor
python scripts/livestream-monitor.py \
  --source rtsp://camera-ip:554/stream \
  --camera-id "k17ey5jcw89s6brn397x4gbp757v2bky" \
  --api-url "https://accurate-marlin-326.convex.site" \
  --interval 30 \
  --priority 5
```

This will:
- ✅ Capture frames every 30 seconds
- ✅ Send to your frame processing API
- ✅ Trigger agents automatically
- ✅ Handle caching and deduplication

### Method 2: Webhook Integration (For Smart Glasses/IoT Devices)

If you have smart glasses or IoT cameras, configure them to POST frames directly:

```bash
# Camera/Device Configuration
POST https://accurate-marlin-326.convex.site/api/analyze-frame
Content-Type: application/json

{
  "cameraId": "k17ey5jcw89s6brn397x4gbp757v2bky",
  "frameData": "<base64_encoded_jpeg>",
  "priority": 5
}
```

### Method 3: Manual Testing (For Demo)

For testing and demos:

```bash
# Send frames manually from video
python scripts/extract-frames.py \
  --video datacenter-work.mp4 \
  --camera-id "k17..." \
  --api-url "https://accurate-marlin-326.convex.site" \
  --fps 0.5
```

## 📊 Configuration

### Per-Camera Settings

Each camera has three auto-analysis settings:

1. **`autoAnalyze`** (boolean) - Enable/disable automatic analysis
2. **`analyzeIntervalSeconds`** (number) - Seconds between captures (default: 30)
3. **`lastAnalyzedAt`** (timestamp) - Track when last analyzed

### Recommended Intervals

| Use Case | Interval | Reason |
|----------|----------|--------|
| Critical Safety Monitoring | 10s | Catch issues quickly |
| General Work Monitoring | 30s | Balance cost/coverage |
| Low-Activity Areas | 60s | Reduce costs |
| Demo/Testing | 5-10s | Show real-time capabilities |

### Cost Considerations

**Example Calculation:**

- **Interval:** 30 seconds
- **Hours:** 8 hours (work shift)
- **Frames:** (8 × 60 × 60) / 30 = 960 frames/day
- **Cache Hit Rate:** 40% (typical)
- **Actual API calls:** 960 × 0.6 = 576 calls/day
- **Cost:** 576 × $0.01 = **$5.76/camera/day**

**With shorter 10s interval:** $17.28/camera/day
**With longer 60s interval:** $2.88/camera/day

## 🎛️ Dashboard Controls

### Enable Auto-Analysis

```typescript
// In your React component
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

function CameraControls({ cameraId }) {
  const toggleAuto = useMutation(api.cameras.toggleAutoAnalysis);

  return (
    <button onClick={() => toggleAuto({
      cameraId,
      enabled: true,
      intervalSeconds: 30
    })}>
      Enable Auto-Analysis
    </button>
  );
}
```

### Change Interval

```typescript
const updateInterval = useMutation(api.cameras.updateAnalysisInterval);

<select onChange={(e) => updateInterval({
  cameraId,
  intervalSeconds: parseInt(e.target.value)
})}>
  <option value="10">10 seconds (high frequency)</option>
  <option value="30">30 seconds (recommended)</option>
  <option value="60">60 seconds (cost effective)</option>
</select>
```

## 🔄 How the Agents Trigger

Once a frame is analyzed, agents trigger automatically based on detected content:

### 1. Vision Agent Detects Issues

Keywords that trigger ReAct workflow:
- "safety"
- "error"
- "broken"
- "damaged"
- "incorrect"
- "missing"

### 2. ReAct Agent Reasons

```typescript
// From reactAgent.ts
REASON → Analyze severity (low/medium/high/critical)
ACT → Create ticket OR send voice alert OR both
OBSERVE → Log outcome
```

### 3. Coordinator Agent Assigns

If ticket created:
- Find available technicians
- Match skills
- Auto-assign

### 4. Voice Agent Alerts

If critical issue:
- Check frequency limits (max 2/5min)
- Send voice alert to technician

## 📈 Monitoring

### Check Auto-Analysis Status

```bash
# Via Convex Dashboard
# Go to: Data → cameraFeeds table
# Look for columns:
#   - autoAnalyze: true/false
#   - analyzeIntervalSeconds: number
#   - lastAnalyzedAt: timestamp
```

### View Cron Job Logs

```bash
# Convex Dashboard → Functions → Scheduled
# Look for: "auto-capture camera frames"
# Check logs for:
#   - "Found X cameras to process"
#   - "Processing camera: [name]"
#   - "Auto-capture complete: X success, Y errors"
```

### Monitor Agent Activity

```bash
# Check these tables for automatic activity:
visionAnalysis - New entries every interval
reactLogs - When issues detected
tickets - Auto-generated tickets
voiceInteractions - Critical alerts sent
```

## 🧪 Testing the Full Flow

### Step 1: Enable Auto-Analysis

```javascript
// In Convex dashboard or via mutation
await convex.mutation(api.cameras.toggleAutoAnalysis, {
  cameraId: "YOUR_CAMERA_ID",
  enabled: true,
  intervalSeconds: 30
});
```

### Step 2: Run Frame Pusher

```bash
# Start livestream monitor
python scripts/livestream-monitor.py \
  --source 0 \
  --camera-id "YOUR_CAMERA_ID" \
  --api-url "YOUR_CONVEX_URL" \
  --interval 30
```

### Step 3: Verify Automatic Processing

Check your dashboard:

1. **Camera Feeds** - `lastAnalyzedAt` updates every 30s
2. **Vision Analysis** - New entries appear automatically
3. **Agent Activity** - See ReAct workflow when issues detected
4. **Tickets** - Auto-created when safety issues found

## 🎬 Production Deployment

### For Real Technician Cameras

1. **Smart Glasses Integration:**
   - Configure glasses to POST frames to `/api/analyze-frame`
   - Set appropriate interval (30s recommended)
   - Use priority=8 for active work

2. **RTSP Camera Streams:**
   - Deploy `livestream-monitor.py` on a server
   - Configure to run as systemd service
   - Monitor multiple cameras simultaneously

3. **IoT Wearable Devices:**
   - Use webhook integration
   - Implement local buffering
   - Send frames during connectivity windows

### Example Systemd Service

```ini
# /etc/systemd/system/techni cian-camera-monitor.service
[Unit]
Description=Technician Camera Auto-Monitor
After=network.target

[Service]
Type=simple
User=camera-user
WorkingDirectory=/opt/camera-monitor
ExecStart=/usr/bin/python3 livestream-monitor.py \
  --source rtsp://camera1:554/stream \
  --camera-id k17... \
  --api-url https://your-deployment.convex.site \
  --interval 30
Restart=always

[Install]
WantedBy=multi-user.target
```

## 🔧 Troubleshooting

### Cron Not Running

```bash
# Check Convex dashboard → Functions → Scheduled
# Verify "auto-capture camera frames" appears
# Check for errors in logs
```

### No Frames Being Captured

1. Verify `autoAnalyze` is true
2. Check `isActive` is true
3. Verify `analyzeIntervalSeconds` is set
4. Check if external frame pusher is running

### Agents Not Triggering

1. Check if Vision AI detected issues
2. Look for keywords: "safety", "error", "broken"
3. Verify `OPENROUTER_API_KEY` is set
4. Check `reactLogs` table for errors

## 📋 Summary

**Automatic video analysis** is now enabled! Here's what happens:

1. ✅ **Cron job runs every minute** checking for cameras due for capture
2. ✅ **External services push frames** via your livestream monitor
3. ✅ **Frame processor handles** caching and deduplication automatically
4. ✅ **Vision AI analyzes** frames for issues
5. ✅ **Agents trigger automatically** when issues detected
6. ✅ **Tickets created** and **technicians assigned** without human intervention

Your system is now **fully autonomous** for monitoring technician work! 🎉

