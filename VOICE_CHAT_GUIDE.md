# 🎤 Kramtron Voice Chat System

## Overview
Voice-activated AI assistant that responds to "Hey Kramtron" wake word, powered by NVIDIA Nemotron and ElevenLabs.

## Features

### ✅ Implemented
1. **Wake Word Detection** - "Hey Kramtron" activates the AI
2. **Real-time Speech Recognition** - Uses Web Speech API (Chrome/Edge)
3. **Voice Responses** - Text-to-Speech using browser's built-in speech synthesis
4. **Context-Aware** - Knows about:
   - Current camera location
   - Recent vision analysis
   - Active tickets
   - Conversation history
5. **Dual Speaker Support** - Technician and Engineer can both talk
6. **Smart Responses** - Nemotron provides technical guidance

### 🔄 How It Works

```
1. User says: "Hey Kramtron, what should I check on this equipment?"
   ↓
2. Web Speech API transcribes speech
   ↓
3. Wake word detected → Extract prompt
   ↓
4. Nemotron processes with context:
   - Camera location
   - Recent analysis
   - Active tickets
   - Conversation history
   ↓
5. Response generated (kept short for voice)
   ↓
6. ElevenLabs converts to speech
   ↓
7. Audio plays automatically
```

## Usage

### In Camera Feed View:
1. Click on any camera feed to open the call view
2. Voice chat panel appears in **bottom left corner**
3. Click the **microphone button** to start listening
4. Say **"Hey Kramtron"** followed by your question
5. Kramtron will respond with voice and text

### Example Commands:
- "Hey Kramtron, what should I check on this equipment?"
- "Hey Kramtron, how do I fix this error?"
- "Hey Kramtron, what's the safety procedure here?"
- "Hey Kramtron, what tickets are active?"

## Browser Support

### ✅ Fully Supported:
- **Chrome** (Desktop & Android)
- **Edge** (Desktop)
- **Safari** (iOS 14.5+)

### ⚠️ Limited Support:
- **Firefox** - No Web Speech API support
- **Safari** (Desktop) - Limited speech recognition

## Configuration

### Required Environment Variables:
```bash
# Already set ✅
OPENROUTER_API_KEY=sk-or-v1-...  # For Nemotron
ELEVENLABS_API_KEY=sk_...        # For voice generation
```

### Optional Enhancements:
For production, replace browser speech APIs with:
- **Speech-to-Text**: OpenAI Whisper, Google Speech-to-Text
- **Text-to-Speech**: ElevenLabs API (more natural voices)

## Technical Details

### Files Created:
1. `convex/agents/voiceChat.ts` - Backend voice processing
2. `src/VoiceChat.tsx` - Frontend voice chat UI

### Key Functions:
- `processVoiceInput` - Main entry point for voice processing
- `detectWakeWord` - Checks for "Hey Kramtron"
- `getNemotronResponse` - Gets AI response with context
- `generateSpeech` - Converts text to speech

### Context Provided to Nemotron:
```typescript
{
  cameraName: "JoeDoe's Feed",
  location: "Data Center Bay 3",
  recentAnalysis: "Equipment appears normal...",
  activeTickets: [
    { title: "Check cooling system", priority: "high" }
  ],
  conversationHistory: [...last 10 messages]
}
```

## UI Features

### Voice Chat Panel:
- **Status Indicator** - Green pulse when listening
- **Message History** - Shows conversation
- **Live Transcript** - See what's being heard
- **Mic Toggle** - Start/stop listening
- **Auto-scroll** - Latest messages always visible

### Styling:
- Glass morphism effect
- Blue gradient header
- Responsive design
- Positioned bottom-left (doesn't block video)

## Tips for Best Results

### 🎯 Do:
- Speak clearly and at normal pace
- Wait for Kramtron to finish before speaking again
- Use specific questions
- Keep questions focused on current work

### ❌ Don't:
- Speak too fast or mumble
- Ask multiple questions at once
- Expect responses about unrelated topics
- Use in noisy environments (affects recognition)

## Future Enhancements

### Planned:
- [ ] Server-side speech recognition (more accurate)
- [ ] Multi-language support
- [ ] Custom wake word training
- [ ] Voice commands (e.g., "Create ticket", "Show SOPs")
- [ ] Emotion detection in voice
- [ ] Background noise filtering

### Advanced Features:
- [ ] Voice authentication
- [ ] Real-time translation
- [ ] Voice-controlled camera navigation
- [ ] Hands-free operation mode

## Troubleshooting

### "Speech recognition not supported"
- **Solution**: Use Chrome or Edge browser

### Wake word not detected
- **Solution**: Speak clearly, try "Hey Kramtron" variations

### No audio response
- **Solution**: Check browser audio permissions

### Kramtron not responding
- **Solution**: Check console for API errors, verify env variables

## Demo Script

```
1. Open camera feed
2. Click microphone button
3. Say: "Hey Kramtron, what should I check first?"
4. Kramtron responds with guidance
5. Say: "Hey Kramtron, what are my active tickets?"
6. Kramtron lists current tickets
7. Continue conversation naturally
```

---

**Built with:**
- 🤖 NVIDIA Nemotron (AI responses)
- 🎤 Web Speech API (voice input)
- 🔊 ElevenLabs (voice output)
- ⚛️ React + Convex (real-time sync)

