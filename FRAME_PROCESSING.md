# Frame Processing System Documentation

## Overview

The frame processing system provides intelligent batching, caching, and deduplication for video frame analysis. This reduces API costs, prevents redundant analysis, and ensures efficient use of compute resources.

## Architecture

```
Video Source → Frame Extraction → Frame Processor → Cache Check → Queue → Batch → Vision AI → ReAct Agents
                                         ↓
                                    Cache Hit (skip analysis)
```

### Key Components

1. **Frame Processor** (`convex/agents/frameProcessor.ts`)
   - Handles frame submission, deduplication, and batching
   - Manages cache lookups and storage
   - Orchestrates batch processing

2. **Frame Cache** (`frameCache` table)
   - Stores SHA-256 hashes of analyzed frames
   - Maps hashes to analysis results
   - Tracks cache hit counts
   - Expires after 24 hours (configurable)

3. **Frame Queue** (`frameQueue` table)
   - Queues frames for batch processing
   - Supports priority-based ordering
   - Tracks processing status

4. **Processing Batches** (`processingBatches` table)
   - Groups frames into batches of 5 (configurable)
   - Tracks batch processing status
   - Stores batch results

## Configuration

Edit `convex/agents/frameProcessor.ts` to adjust:

```typescript
const BATCH_SIZE = 5; // Process 5 frames at a time
const CACHE_EXPIRY_HOURS = 24; // Cache results for 24 hours
const SIMILARITY_THRESHOLD = 0.95; // Frames must be 95% different
```

## API Endpoints

### 1. Submit Frame for Analysis

**Endpoint:** `POST /api/analyze-frame`

**Request:**
```json
{
  "cameraId": "convex_camera_id",
  "frameData": "base64_encoded_image",
  "priority": 1
}
```

**Response (Cached):**
```json
{
  "cached": true,
  "analysisId": "analysis_id",
  "message": "Frame already analyzed (cache hit)"
}
```

**Response (Queued):**
```json
{
  "cached": false,
  "skipped": false,
  "queued": true,
  "queueId": "queue_id",
  "message": "Frame queued (3/5 in batch)"
}
```

**Response (Skipped - Too Similar):**
```json
{
  "cached": false,
  "skipped": true,
  "message": "Frame too similar to recent frames (skipped)"
}
```

### 2. Manual Batch Processing

**Endpoint:** `POST /api/process-batch`

**Request:**
```json
{
  "cameraId": "convex_camera_id"
}
```

**Response:**
```json
{
  "batchId": "batch_1234567890_abc123",
  "processed": 5,
  "failed": 0
}
```

### 3. Cache Statistics

**Endpoint:** `GET /api/cache-stats`

**Response:**
```json
{
  "cache": {
    "totalEntries": 142,
    "totalHits": 89,
    "hitRate": "38.53%"
  },
  "queue": {
    "pending": 3,
    "processing": 0,
    "completed": 156,
    "failed": 2,
    "total": 161
  },
  "batches": {
    "queued": 0,
    "processing": 0,
    "completed": 32,
    "total": 32
  }
}
```

## Frame Extraction Scripts

### Python Script

**Requirements:**
```bash
pip install opencv-python requests yt-dlp pillow
```

**Usage:**
```bash
# From local video
python scripts/extract-frames.py \
  --video path/to/video.mp4 \
  --camera-id k17abc123... \
  --api-url https://accurate-marlin-326.convex.site \
  --fps 0.5 \
  --priority 5

# From YouTube
python scripts/extract-frames.py \
  --youtube https://youtube.com/watch?v=dQw4w9WgXcQ \
  --camera-id k17abc123... \
  --api-url https://accurate-marlin-326.convex.site

# From webcam (live)
python scripts/extract-frames.py \
  --webcam \
  --camera-id k17abc123... \
  --api-url https://accurate-marlin-326.convex.site \
  --duration 300
```

### Node.js Script

**Requirements:**
```bash
npm install fluent-ffmpeg axios
# Also install ffmpeg: brew install ffmpeg (macOS) or apt install ffmpeg (Linux)
```

**Usage:**
```bash
# From local video
node scripts/extract-frames.js \
  --video path/to/video.mp4 \
  --camera-id k17abc123... \
  --api-url https://accurate-marlin-326.convex.site

# From YouTube (requires yt-dlp)
node scripts/extract-frames.js \
  --youtube https://youtube.com/watch?v=dQw4w9WgXcQ \
  --camera-id k17abc123... \
  --api-url https://accurate-marlin-326.convex.site
```

## How It Works

### 1. Frame Submission

When a frame is submitted:

1. **Hash Generation**: SHA-256 hash of frame data is created
2. **Cache Check**: System checks if frame was analyzed in last 24 hours
3. **Similarity Check**: Compares hash to recent frames (last 5 minutes)
4. **Queue**: If not cached/similar, adds to queue with priority
5. **Batch Trigger**: When queue reaches batch size (5), triggers processing

### 2. Deduplication

**Exact Duplicates:**
- Frames with identical SHA-256 hashes return cached results
- Increments cache hit counter
- Zero API calls made

**Similar Frames:**
- Frames >95% similar to recent frames are skipped
- Prevents analyzing near-identical frames (e.g., static scenes)
- Configurable similarity threshold

### 3. Batch Processing

When batch is triggered:

1. Retrieves pending frames (sorted by priority)
2. Creates batch job record
3. For each frame:
   - Calls Vision AI for analysis
   - Triggers ReAct workflow if issues detected
   - Caches result with frame hash
   - Updates frame status
4. Marks batch as complete

### 4. Automatic Cleanup

**Cron Job** (runs hourly):
- Deletes cache entries older than 24 hours
- Removes completed queue items older than 1 hour
- Prevents database bloat

## Performance Benefits

### Cost Savings

**Without Frame Processing:**
- 30 FPS video = 1,800 frames/minute = 108,000 frames/hour
- At $0.01/frame = **$1,080/hour** 💸

**With Frame Processing:**
- 0.5 FPS extraction = 30 frames/minute = 1,800 frames/hour
- 40% cache hit rate = 1,080 unique frames
- At $0.01/frame = **$10.80/hour** 💰
- **99% cost reduction!**

### Processing Efficiency

- **Batching**: Processes 5 frames together, reducing overhead
- **Priority Queue**: Critical frames processed first
- **Similarity Detection**: Skips redundant static scenes
- **Caching**: Instant results for repeated frames

## Database Schema

### Frame Cache
```typescript
frameCache: {
  cameraId: Id<"cameraFeeds">,
  frameHash: string,          // SHA-256 hash
  timestamp: number,          // When cached
  analysisId: Id<"visionAnalysis">,
  hitCount: number,           // Times this cache was hit
}
```

### Frame Queue
```typescript
frameQueue: {
  cameraId: Id<"cameraFeeds">,
  frameData: string,          // base64 encoded
  frameHash: string,
  timestamp: number,
  status: "pending" | "processing" | "completed" | "failed",
  batchId?: string,
  priority: number,           // Higher = process sooner
}
```

### Processing Batches
```typescript
processingBatches: {
  batchId: string,
  cameraId: Id<"cameraFeeds">,
  frameCount: number,
  status: "queued" | "processing" | "completed" | "failed",
  startedAt?: number,
  completedAt?: number,
  results?: Array<{
    frameHash: string,
    analysisId: Id<"visionAnalysis">,
    detectedIssues: number,
  }>,
}
```

## Integration Examples

### Python Integration

```python
import cv2
import base64
import requests

def analyze_video_stream(camera_id, api_url):
    cap = cv2.VideoCapture(0)  # Webcam
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        # Encode frame
        _, buffer = cv2.imencode('.jpg', frame)
        frame_b64 = base64.b64encode(buffer).decode('utf-8')
        
        # Send to API
        response = requests.post(f"{api_url}/api/analyze-frame", json={
            "cameraId": camera_id,
            "frameData": frame_b64,
            "priority": 5  # High priority
        })
        
        result = response.json()
        
        if result.get('cached'):
            print("Frame was cached (already analyzed)")
        elif result.get('queued'):
            print(f"Frame queued: {result.get('message')}")
        
        # Process at 0.5 FPS
        time.sleep(2)
```

### JavaScript Integration

```javascript
const axios = require('axios');
const fs = require('fs');

async function analyzeImage(cameraId, apiUrl, imagePath) {
  // Read and encode image
  const imageBuffer = fs.readFileSync(imagePath);
  const imageB64 = imageBuffer.toString('base64');
  
  // Send to API
  const response = await axios.post(`${apiUrl}/api/analyze-frame`, {
    cameraId,
    frameData: imageB64,
    priority: 1
  });
  
  const result = response.data;
  
  if (result.cached) {
    console.log('✅ Cache hit - instant result!');
  } else if (result.queued) {
    console.log(`📤 ${result.message}`);
  }
  
  return result;
}
```

## Monitoring

### Check Cache Performance

```bash
curl https://your-deployment.convex.site/api/cache-stats
```

### Trigger Manual Batch Processing

```bash
curl -X POST https://your-deployment.convex.site/api/process-batch \
  -H "Content-Type: application/json" \
  -d '{"cameraId": "k17abc123..."}'
```

## Troubleshooting

### Frames Not Processing

1. Check pending queue:
   ```bash
   curl https://your-deployment.convex.site/api/cache-stats
   ```

2. Manually trigger batch processing:
   ```bash
   curl -X POST https://your-deployment.convex.site/api/process-batch \
     -d '{"cameraId": "your_camera_id"}'
   ```

### High Cache Miss Rate

- Increase `SIMILARITY_THRESHOLD` in frameProcessor.ts
- Videos with lots of movement = lower cache hit rate (expected)
- Static scenes = higher cache hit rate

### Processing Too Slow

- Decrease `BATCH_SIZE` for faster processing
- Increase frame priority
- Check API rate limits

### Database Growing Too Large

- Decrease `CACHE_EXPIRY_HOURS`
- Run manual cleanup:
  ```typescript
  // In Convex dashboard
  await ctx.runMutation(internal.agents.frameProcessor.cleanupOldData, {})
  ```

## Best Practices

1. **Start with low FPS** (0.5 FPS = 1 frame every 2 seconds)
2. **Use priority levels** wisely (1=normal, 10=critical)
3. **Monitor cache stats** to tune similarity threshold
4. **Batch process during off-peak** hours
5. **Clean up old data** regularly (automatic via cron)

## Future Enhancements

- [ ] Perceptual hashing for better similarity detection
- [ ] Dynamic batch sizes based on load
- [ ] Multi-camera batch processing
- [ ] Frame compression before caching
- [ ] Real-time streaming support
- [ ] GPU-accelerated frame extraction
- [ ] Advanced caching strategies (LRU, LFU)

