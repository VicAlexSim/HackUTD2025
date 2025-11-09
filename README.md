# Technician Vision AI - Multi-Agent Maintenance System

A sophisticated multi-agent system for maintenance operations featuring:

## Core Features

### 🎥 Vision Agents
- Multi-camera feed support with Nemotron multimodal reasoning
- Real-time frame analysis for safety violations, equipment issues, and technician errors
- Contextual memory for each camera feed

### 🎯 Supervisor Agent
- Monitors all feeds and summarizes task progress
- Updates tickets automatically based on observations
- Provides system-wide oversight

### 📚 RAG Agent
- Retrieves relevant SOPs, safety docs, and repair guides
- Dynamic document search based on detected issues
- Context-aware guidance generation

### 🎛️ Coordinator Agent
- Prioritizes tickets based on urgency and technician availability
- Intelligent routing based on skills and location
- Automatic assignment optimization

### 🔊 Voice Guidance (ElevenLabs)
- Natural, low-frequency verbal feedback
- ReAct-based decision making to avoid annoyance
- Focuses on safety alerts and critical corrections

### 🤖 Autonomous Actions
- Automatic ticket creation when errors detected
- Part reordering workflows
- Self-healing system responses

## Architecture

### Agent Types
1. **Vision Agent** - Analyzes camera frames using Nemotron
2. **ReAct Agent** - Implements Reason→Act→Observe workflow
3. **Voice Agent** - Manages ElevenLabs TTS with smart triggering
4. **RAG Agent** - Retrieves documentation dynamically
5. **Coordinator Agent** - Assigns and prioritizes work
6. **Supervisor Agent** - Monitors and summarizes operations

### Data Models
- **Tickets** - Work orders with priority, status, and metadata
- **Technicians** - Skills, status, and current assignments
- **Camera Feeds** - Stream URLs and active monitoring
- **Vision Analysis** - AI-detected issues and confidence scores
- **Agent Memory** - Shared state and conversation history
- **Documents** - SOPs, safety guides, troubleshooting steps

## API Endpoints

### `/api/analyze-frame` (POST)
Send camera frames for vision analysis:
```json
{
  "cameraId": "camera_id",
  "frameData": "base64_encoded_image"
}
```

### `/api/assign-tickets` (POST)
Trigger coordinator to assign pending tickets to available technicians.

## Environment Variables

Required:
- `OPENROUTER_API_KEY` - For Nemotron vision analysis
- `ELEVENLABS_API_KEY` - For voice synthesis (optional)

## Usage

1. **Add Technicians** - Create technician profiles with skills
2. **Add Cameras** - Register camera feeds with stream URLs (YouTube URLs work!)
3. **Add Documentation** - Upload SOPs and safety guides
4. **Monitor Dashboard** - View tickets, technicians, and camera status

### Camera Integration

**Important**: The system does NOT automatically analyze video streams. You need to:

1. Extract frames from your video source (using ffmpeg, OpenCV, or similar)
2. Convert frames to base64
3. Send them to the API endpoint

Example with curl:
```bash
curl -X POST https://accurate-marlin-326.convex.site/api/analyze-frame \
  -H "Content-Type: application/json" \
  -d '{
    "cameraId": "your_camera_id_here",
    "frameData": "base64_encoded_image_data"
  }'
```

**YouTube Videos**: You can add YouTube URLs as camera feeds. The video will play in the Vision Analysis modal, but you still need to extract and send frames manually for AI analysis.

### Automatic Ticket Creation

When the vision agent detects critical issues:
1. **Reason** - AI analyzes severity and required action
2. **Act** - Creates ticket and/or sends voice alert
3. **Observe** - Logs outcome and updates system state

## ReAct Workflow

The system uses a ReAct loop for autonomous decision-making:

1. **REASON**: Analyze detected issues and determine severity
2. **ACT**: Create tickets, send voice alerts, or request assistance
3. **OBSERVE**: Monitor outcomes and adjust future actions

## Voice Guidance Rules

Voice alerts are triggered only when:
- Safety violations detected
- Critical errors observed
- Less than 2 alerts in past 5 minutes (to avoid annoyance)

## Scalability

The modular design allows easy addition of:
- New camera feeds (just add to database)
- Additional agent types (extend agent framework)
- Custom workflows (modify ReAct logic)
- New voice channels (add to voice agent)

## Development

Built with:
- **Convex** - Realtime database and backend
- **React** - Frontend dashboard
- **OpenRouter** - Nemotron vision AI
- **ElevenLabs** - Text-to-speech
- **TypeScript** - Type-safe development
