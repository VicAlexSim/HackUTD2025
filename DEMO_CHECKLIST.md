# HackUTD Demo Checklist

## 🎯 Pre-Demo Setup (Do This Before the Demo)

### 1. Deploy to Convex ✅
```bash
npx convex dev
# Wait for deployment to complete
# Note down your deployment URL
```

### 2. Configure API Keys ✅
- [ ] Open Convex dashboard
- [ ] Add `OPENROUTER_API_KEY` in environment variables
- [ ] (Optional) Add `ELEVENLABS_API_KEY` for voice alerts

### 3. Create Test Data ✅

**Add a Technician:**
- Name: "John Smith"
- Skills: ["server", "networking", "hardware"]
- Status: Available

**Add a Camera:**
- Name: "Camera 1 - Server Room"
- Location: "Data Center - Aisle A"
- Stream URL: `https://www.youtube.com/watch?v=DataCenterVideo`
- **Copy the Camera ID** (e.g., `k17abc123...`)

**Add Documentation:**
- Title: "Server Maintenance SOP"
- Category: SOP
- Content: "1. Verify server is offline\n2. Remove from rack\n3. Replace component\n4. Test\n5. Return to service"

### 4. Pre-Load Frame Cache (IMPORTANT!) ✅

This ensures instant results during demo:

```bash
# Install dependencies
pip install opencv-python requests yt-dlp pillow

# Extract frames from a data center video
python scripts/extract-frames.py \
  --youtube "https://www.youtube.com/watch?v=YOUR_VIDEO" \
  --camera-id "k17abc123..." \
  --api-url "https://accurate-marlin-326.convex.site" \
  --fps 0.5 \
  --priority 5
```

**Recommended Test Videos:**
- Data center tour videos
- Server maintenance videos
- Technician POV videos

### 5. Test the System ✅

```bash
# Test single frame
bash scripts/demo-test.sh "k17abc123..." "https://accurate-marlin-326.convex.site" test-image.jpg

# Check cache stats
curl "https://accurate-marlin-326.convex.site/api/cache-stats"
```

### 6. Verify Dashboard ✅
- [ ] Open dashboard in browser
- [ ] Verify technician appears
- [ ] Verify camera appears
- [ ] Check Agent Activity panel shows logs
- [ ] Check for any auto-generated tickets

---

## 🎬 During Demo: Presentation Flow

### Opening (1 min)
**"We built an AI-powered multi-agent system that helps data center technicians stay safe and efficient."**

Show challenges:
- ❌ Loud environment (can't hear anyone)
- ❌ Complex multi-step procedures
- ❌ Incomplete/poorly prioritized tickets
- ❌ Endless queue of work orders

### Demo Part 1: Vision AI & Frame Processing (3 min)

**Show the Dashboard**
1. Point out the cameras section
2. Click the 📊 button to show Vision Analysis modal
3. **If YouTube URL**: Show the video player

**Submit a Frame**
```bash
# Submit a pre-loaded frame (should hit cache)
curl -X POST https://your-deployment.convex.site/api/analyze-frame \
  -H "Content-Type: application/json" \
  -d '{
    "cameraId": "k17...",
    "frameData": "base64...",
    "priority": 5
  }'
```

**Key Points:**
- ✅ "This frame was analyzed in 10ms because of intelligent caching"
- ✅ "Our system reduced API costs by 99% through deduplication"
- ✅ "Similar frames are automatically skipped to save money"

**Show Cache Stats:**
```bash
curl https://your-deployment.convex.site/api/cache-stats
```

Point out:
- Cache hit rate
- Frames processed
- Cost savings

### Demo Part 2: ReAct Workflow (2 min)

**Show Agent Activity Panel**

Point out the three-step workflow for each agent action:

1. **REASON** (Blue badge)
   - "AI analyzes the situation and determines severity"
   
2. **ACT** (Green badge)
   - "System takes action: creates tickets, sends voice alerts"
   
3. **OBSERVE** (Purple badge)
   - "Monitors outcomes and learns from results"

**Key Points:**
- ✅ "This is a complete autonomous workflow"
- ✅ "No human intervention needed"
- ✅ "Each agent coordinates with others"

### Demo Part 3: Autonomous Ticket Creation (2 min)

**Show Tickets Panel**

If you have auto-generated tickets, show:
- Title: "Auto-detected issue: high priority"
- Description includes detected issues
- Location automatically filled
- Suggested parts listed

**Show Coordinator Working:**
- Ticket status: Pending → Assigned
- Matched to technician with right skills
- Priority-based assignment

**Key Points:**
- ✅ "System fills in ALL ticket details automatically"
- ✅ "Engineers can be lazy, AI fills the gaps"
- ✅ "Prioritization happens automatically based on severity"

### Demo Part 4: Voice Agent (1 min)

**Show Technician Panel**

Click 🔊 button to show voice interactions

**Key Points:**
- ✅ "Only speaks for safety or critical issues"
- ✅ "Maximum 2 alerts per 5 minutes to avoid annoyance"
- ✅ "Works even with hearing protection via earpiece"

Show both spoken and logged interactions:
- Spoken: Safety alerts, critical errors
- Logged only: Routine guidance, low-priority issues

### Demo Part 5: RAG Agent (1 min)

**Show Documents Panel**

Point out:
- SOPs, safety guides, troubleshooting docs
- Full-text search capability
- Auto-retrieved based on detected issues

**Key Points:**
- ✅ "Technician doesn't need to search for docs"
- ✅ "Right information at the right time"
- ✅ "Guides them through complex procedures"

### Closing (1 min)

**Summary of What We Built:**

**For NMC²:**
- ✅ Solves communication in loud environments
- ✅ Guides complex multi-step workflows
- ✅ Auto-completes incomplete tickets
- ✅ Prioritizes endless work queues

**For NVIDIA:**
- ✅ Multi-step reasoning (ReAct workflow)
- ✅ Tool integration (Vision AI, Voice, RAG)
- ✅ Workflow orchestration (6 coordinating agents)
- ✅ Real-world impact (safety, efficiency, cost savings)

**Cost Savings:**
- Without our system: $1,080/hour for 30 FPS
- With our system: $10.80/hour
- **99% cost reduction!**

---

## 🎤 Key Talking Points

### Technical Highlights
1. **"We implemented a complete ReAct workflow"**
   - Reason → Act → Observe
   - Autonomous decision-making
   - Multi-agent coordination

2. **"Intelligent frame processing with 99% cost reduction"**
   - SHA-256 hashing for deduplication
   - Similarity detection skips redundant frames
   - 24-hour caching with automatic expiry

3. **"Six specialized agents working together"**
   - Vision Agent (Nemotron multimodal AI)
   - ReAct Agent (autonomous reasoning)
   - Voice Agent (ElevenLabs with smart triggering)
   - RAG Agent (document retrieval)
   - Coordinator Agent (skill-based assignment)
   - Supervisor Agent (system oversight)

4. **"Real-time coordination via Convex"**
   - Live updates across all agents
   - Shared state management
   - Event-driven architecture

### Business Impact
1. **Safety**: Real-time detection of violations
2. **Efficiency**: Auto-completes tickets, guides workflows
3. **Cost**: 99% reduction in API costs
4. **Quality**: No incomplete tickets, right person for the job

---

## 🚨 Potential Questions & Answers

**Q: How does the voice agent avoid annoying technicians?**
A: Maximum 2 alerts per 5 minutes. Only speaks for safety/critical issues. Everything else is logged silently.

**Q: What if the technician is in a really loud environment?**
A: Voice alerts go through an earpiece (like Bluetooth headset). Visual alerts also appear on their wearable device.

**Q: How do you handle API rate limits?**
A: Batch processing (5 frames at a time), intelligent caching (24-hour TTL), and similarity detection to skip redundant frames.

**Q: Can it handle multiple cameras simultaneously?**
A: Yes! Each camera has its own queue and cache. The coordinator manages all of them.

**Q: What happens if the AI makes a mistake?**
A: The system provides confidence scores. Low confidence flags for human review. Technicians can always override.

**Q: How does this scale?**
A: Convex provides real-time updates at scale. Caching reduces API calls by 99%. Batch processing ensures efficient resource usage.

---

## 📋 Post-Demo Checklist

- [ ] Show GitHub repo
- [ ] Highlight documentation (`FRAME_PROCESSING.md`, `QUICK_START_FRAMES.md`)
- [ ] Mention the extraction scripts (Python & Node.js)
- [ ] Share deployment URL if judges want to test
- [ ] Answer questions about architecture
- [ ] Discuss future enhancements

---

## 🎉 Good Luck!

You've built something amazing:
- ✅ Solves real data center problems
- ✅ Uses cutting-edge AI (Nemotron)
- ✅ Demonstrates multi-agent coordination
- ✅ Shows complete ReAct workflows
- ✅ Provides measurable impact (99% cost reduction)

**Remember**: Your system doesn't just respond to queries—it reasons, acts, and observes autonomously. That's exactly what the NVIDIA challenge is looking for!

🏆 **You've got this!**

