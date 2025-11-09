# NVIDIA Nemotron DataCenter AI Platform

## Overview

This application demonstrates an AI-powered collaboration platform for data center technicians using **NVIDIA Nemotron's multimodal AI capabilities** (simulated with OpenAI for demo purposes). The platform addresses key challenges in data center operations:

- **Loud, hot environments** (90+ dB noise levels)
- **Communication barriers** between technicians
- **Manual, inconsistent ticketing** (Jira)
- **Repetitive BAU tasks** and complex maintenance workflows

## Key Features

### 1. 🎯 Supervisor Dashboard
- **Dual POV Video Feeds**: Real-time monitoring of multiple technicians wearing smart glasses (simulating Meta Ray-Bans)
- **Live Activity Detection**: AI analyzes video frames to detect:
  - Asset tags (e.g., "SRV-A123", "RACK-B12")
  - Hardware components (PSU, Fan Modules, Network Cards)
  - Current technician activity (e.g., "Replacing power supply")
- **Agentic Ticket System**: AI-powered ticket management with:
  - Automatic priority assignment (high/medium/low)
  - Real-time auto-updates based on video analysis
  - Suggested action steps for technicians

### 2. 🤖 Agentic AI Ticketing
- **Automatic Ticket Creation**: When an issue is reported, Nemotron AI:
  - Analyzes the problem description and equipment photo
  - Extracts asset tags and error codes using computer vision
  - Creates a structured ticket with priority and action steps
  - Links to similar past issues for knowledge sharing
- **Real-Time Updates**: As technicians work, the system:
  - Monitors video feeds for activity changes
  - Automatically updates tickets (e.g., "Tech A replacing PSU in Rack 12B")
  - Tracks progress without manual input

### 3. 📹 Smart Glasses POV Analysis
- **Multimodal Vision AI**: Analyzes frames from technician glasses to:
  - Identify equipment and asset tags
  - Detect what components are being worked on
  - Understand the current maintenance activity
- **Context-Aware Assistance**: Provides real-time guidance based on what the technician is looking at

### 4. 💬 Noise-Filtered Communication
- **NLP-Powered Transcription**: Cleans up voice messages in loud environments (90+ dB)
- **Text-Based Chat**: Enables clear communication despite noise
- **Collaborative Problem-Solving**: Connect with technicians who solved similar issues

### 5. 🔍 Knowledge Base Retrieval
- **Similar Issue Detection**: AI finds past issues with matching:
  - Asset tags
  - Error codes
  - Problem descriptions
- **Solution Summarization**: Nemotron summarizes relevant past solutions
- **Expert Connection**: Direct chat with technicians who solved similar problems

### 6. 📊 Pattern Detection & Root Cause Analysis
- **Recurring Issue Alerts**: Flags when multiple similar issues occur within an hour
- **AI Root Cause Analysis**: Nemotron analyzes patterns to identify:
  - Environmental factors (cooling, power)
  - Hardware batch issues
  - Configuration problems
- **Proactive Recommendations**: Suggests preventive actions for operations teams

## Technology Stack

- **Frontend**: React + TypeScript + TailwindCSS
- **Backend**: Convex (real-time database & functions)
- **AI**: NVIDIA Nemotron (simulated with OpenAI GPT-4o-mini)
  - Multimodal vision analysis
  - NLP for noise filtering
  - Agentic workflow automation
- **Authentication**: Convex Auth

## How It Works

### Technician Workflow
1. **Report Issue**: Upload equipment photo, describe problem, specify location
2. **AI Analysis**: Nemotron extracts asset tags, error codes, and creates ticket
3. **Get Guidance**: Receive AI-generated troubleshooting steps
4. **Collaborate**: Chat with other techs who solved similar issues
5. **Update Status**: Add solution when resolved

### Supervisor Workflow
1. **Monitor Feeds**: View live POV from all active technicians
2. **Track Tickets**: See AI-managed tickets with auto-updates
3. **Detect Patterns**: Get alerts for recurring issues
4. **Review Analysis**: Read AI root cause analysis for systemic problems

### Simulated Smart Glasses
- Upload POV frames to simulate camera glasses
- AI analyzes frames for asset tags, components, and activity
- Results appear in real-time on supervisor dashboard

## Demo Features

### Example Scenarios

**Scenario 1: PSU Failure**
- Tech reports PSU failure with photo
- AI detects asset tag "SRV-A123" and error code "ERR-PSU-01"
- System finds 2 similar issues from last week
- Suggests: "Check power controller reset" (solved by Tech B)
- Auto-creates ticket with priority: HIGH

**Scenario 2: Pattern Detection**
- 3 similar cooling fan failures in 1 hour
- AI flags pattern across Rack 12
- Root cause analysis: "Likely HVAC zone issue affecting Rack 12 cooling"
- Recommends: "Check HVAC Zone B, inspect air flow, review temperature logs"

**Scenario 3: Noisy Environment Communication**
- Tech A needs help from Tech B
- Voice message: "HEY *LOUD FAN NOISE* CAN YOU *BEEP* HELP WITH *WHIRR* SERVER?"
- AI filters to: "Hey, can you help with the server?"
- Clear text message delivered to Tech B

## Setup Instructions

1. **Sign In**: Create an account with username/password
2. **Switch Views**: Toggle between Technician and Supervisor modes
3. **Report Issues**: Use the issue form to create tickets
4. **Simulate POV**: Upload images as "smart glasses" frames in Supervisor view
5. **Collaborate**: Use chat to connect with other technicians

## Future Enhancements

- **Real NVIDIA Nemotron Integration**: Replace OpenAI with actual Nemotron API
- **Live Video Streaming**: Real-time video instead of frame uploads
- **Voice Commands**: Hands-free operation for technicians
- **AR Overlays**: Display AI suggestions directly in smart glasses
- **Predictive Maintenance**: ML models to predict failures before they occur
- **Integration with Real Jira**: Sync with existing ticketing systems

## Northmark Challenge Alignment

This prototype addresses all key pain points:

✅ **Loud, hot environments**: Noise-filtered communication  
✅ **Communication barriers**: Real-time chat + AI transcription  
✅ **Manual ticketing**: Agentic AI automation  
✅ **Repetitive tasks**: AI-guided troubleshooting  
✅ **Knowledge silos**: Automatic similar issue retrieval  
✅ **Coordination**: Supervisor dashboard with live monitoring  

## Notes

- This is a **prototype demonstration** using OpenAI as a Nemotron simulator
- For production, integrate with actual NVIDIA Nemotron API endpoints
- Smart glasses simulation uses static image uploads (real implementation would use live video streams)
- All AI features are functional and demonstrate the intended capabilities
