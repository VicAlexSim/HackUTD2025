# Quick Start: Frame Processing

## 🚀 Getting Started in 5 Minutes

### Step 1: Get Your Camera ID

1. Open your Convex dashboard
2. Navigate to the Camera Feeds section
3. Copy the camera ID (looks like `k17abc123...`)

### Step 2: Choose Your Method

#### Option A: Python (Recommended for YouTube)

```bash
# Install dependencies
pip install opencv-python requests yt-dlp pillow

# Run extraction
python scripts/extract-frames.py \
  --youtube "https://www.youtube.com/watch?v=mGlkbcGF8DI" \
  --camera-id "k17abc123..." \
  --api-url "https://accurate-marlin-326.convex.site" \
  --fps 0.5 \
  --priority 5
```

#### Option B: Node.js (Good for local videos)

```bash
# Install dependencies
npm install fluent-ffmpeg axios
brew install ffmpeg  # macOS
# or: apt install ffmpeg  # Linux

# Run extraction
node scripts/extract-frames.js \
  --video "datacenter-footage.mp4" \
  --camera-id "k17abc123..." \
  --api-url "https://accurate-marlin-326.convex.site" \
  --fps 0.5
```

#### Option C: cURL (Manual testing)

```bash
# Convert image to base64 (macOS/Linux)
IMAGE_B64=$(base64 -i test-image.jpg)

# Send to API
curl -X POST "https://accurate-marlin-326.convex.site/api/analyze-frame" \
  -H "Content-Type: application/json" \
  -d "{
    \"cameraId\": \"k17abc123...\",
    \"frameData\": \"$IMAGE_B64\",
    \"priority\": 5
  }"
```

### Step 3: Monitor Progress

```bash
# Check cache stats
curl "https://accurate-marlin-326.convex.site/api/cache-stats"

# View in dashboard
# Go to: Agent Activity Panel → See ReAct workflow logs
```

### Step 4: Watch the Magic! ✨

As frames are processed:
- 🤖 **Vision Agent** analyzes each frame
- 🧠 **ReAct Agent** reasons about detected issues
- 🎫 **Tickets** are automatically created for problems
- 🔊 **Voice alerts** notify technicians (if critical)
- 📊 **Dashboard** updates in real-time

## Example Outputs

### Cache Hit (Instant Result)
```json
{
  "cached": true,
  "analysisId": "j5xyz789...",
  "message": "Frame already analyzed (cache hit)"
}
```
⚡ **Response time: ~10ms**

### Frame Queued
```json
{
  "cached": false,
  "queued": true,
  "queueId": "j5queue123...",
  "message": "Frame queued (4/5 in batch)"
}
```
📤 **Will be processed when batch is full**

### Frame Skipped (Too Similar)
```json
{
  "skipped": true,
  "message": "Frame too similar to recent frames (skipped)"
}
```
⏭️ **Saves API costs!**

## Recommended Settings

### For Demo/Testing
```bash
--fps 1.0           # 1 frame per second
--priority 10       # Highest priority
```

### For Production Use
```bash
--fps 0.5           # 1 frame every 2 seconds
--priority 5        # Medium-high priority
```

### For Cost Optimization
```bash
--fps 0.2           # 1 frame every 5 seconds
--priority 1        # Normal priority
```

## Sample Videos for Testing

1. **Data Center Tour**
   - YouTube: Search "data center tour technician POV"
   - Good for: Safety gear detection, equipment identification

2. **Server Maintenance**
   - YouTube: Search "server rack maintenance gopro"
   - Good for: Technician error detection, part identification

3. **Safety Training**
   - YouTube: Search "data center safety procedures"
   - Good for: Safety violation detection

## Monitoring Dashboard

Your Convex dashboard will show:

- **Agent Activity**: ReAct workflow logs (Reason → Act → Observe)
- **Vision Analysis**: Detected issues per frame
- **Tickets**: Auto-generated work orders
- **Voice Interactions**: Alerts sent to technicians
- **Cache Stats**: Hit rate, queue depth, batch status

## Tips for Best Results

1. **Start Small**: Test with 30 seconds of video first
2. **Use Priority**: Set priority=10 for demo, priority=1 for bulk processing
3. **Monitor Cache**: Check `/api/cache-stats` regularly
4. **Batch Processing**: Let frames queue up for efficiency
5. **Static Scenes**: System auto-skips similar frames

## Troubleshooting

### "No frames being processed"
- Check queue: `curl .../api/cache-stats`
- Trigger batch: `curl -X POST .../api/process-batch -d '{"cameraId":"..."}'`

### "Everything is cached"
- Good! That means you're re-uploading same frames
- Try new video or different time range

### "Too slow"
- Reduce FPS (try 0.2 instead of 0.5)
- Increase batch size in `frameProcessor.ts`
- Check API rate limits

## Next Steps

1. ✅ Extract frames from your video
2. ✅ View analysis in dashboard
3. ✅ Check auto-generated tickets
4. ✅ Monitor voice interactions
5. ✅ Show off to judges! 🏆

Need help? Check `FRAME_PROCESSING.md` for detailed docs.

