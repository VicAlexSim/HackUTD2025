import { useState, useRef, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { FiMic, FiMicOff, FiMessageCircle, FiUser, FiCpu, FiZap, FiSend, FiMessageSquare } from "react-icons/fi";
import InventoryNotification from "./InventoryNotification";

interface VoiceChatProps {
  cameraId: Id<"cameraFeeds">;
  speaker: "technician" | "engineer";
  onInventoryOrder?: (order: { partNumber: string; partName: string; quantity: number; currentStock: number }) => void;
}

// Determine if this is AI mode (technician talking to Kramtron) or live call mode
const isAIMode = (speaker: "technician" | "engineer") => speaker === "technician";

export function VoiceChat({ cameraId, speaker, onInventoryOrder }: VoiceChatProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [messages, setMessages] = useState<Array<{
    role: string;
    content: string;
    timestamp: number;
  }>>([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    "What should I check first?",
    "How do I troubleshoot this?",
    "What are the safety precautions?"
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inventoryOrder, setInventoryOrder] = useState<{
    partNumber: string;
    partName: string;
    quantity: number;
    currentStock: number;
  } | null>(null);
  const aiMode = isAIMode(speaker);
  
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const processVoiceInput = useAction(api.agents.voiceChat.processVoiceInput);

  // Initialize Web Speech API
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false; // Changed to false - stops after one phrase
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscript(finalTranscript || interimTranscript);
        
        // When final transcript is received, process it
        if (finalTranscript) {
          handleVoiceInput(finalTranscript.trim());
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      setTranscript('');
    }
  };

  const handleVoiceInput = async (text: string) => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    setTranscript(''); // Clear transcript immediately
    
    try {
      // Add user message to chat
      const userMessage = {
        role: speaker,
        content: text,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, userMessage]);
      
      console.log('🎤 Sending voice input to Kramtron:', text);
      
      // Call the real Convex action
      const audioData = btoa(text); // Encode text as base64
      const result = await processVoiceInput({
        cameraId,
        speaker,
        audioData,
      });
      
      console.log('✅ Kramtron responded:', result);
      
      if (result.response) {
        const assistantMessage = {
          role: 'assistant',
          content: result.response,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Check if an inventory order was placed
        if (result.inventoryOrder) {
          console.log('📦 Inventory order detected:', result.inventoryOrder);
          setInventoryOrder(result.inventoryOrder);
          if (onInventoryOrder) {
            onInventoryOrder(result.inventoryOrder);
          }
        }
        
        // Generate dynamic suggested questions based on the conversation
        await generateSuggestedQuestions(text, result.response);
        
        // Play audio response with ElevenLabs if available
        if (result.audioUrl) {
          console.log('🔊 Playing ElevenLabs audio with Rachel\'s voice');
          playAudioFromUrl(result.audioUrl);
        } else {
          console.warn('⚠️  ElevenLabs audio not available - showing text only');
          // Audio failed but text response is still shown
          // User can see the response and suggested questions
        }
      }
    } catch (error) {
      console.error('❌ Error processing voice input:', error);
      
      // Show error message
      const errorMessage = {
        role: 'system',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudioFromUrl = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error);
        // If audio playback fails, we already have the text response displayed
      });
    }
  };

  const generateSuggestedQuestions = async (userMessage: string, kramtronResponse: string) => {
    try {
      console.log('💡 Asking Nemotron to generate follow-up questions...');
      
      // Create a prompt for Nemotron to generate follow-up questions
      const prompt = `Based on this conversation:
User: "${userMessage}"
Kramtron: "${kramtronResponse}"

Generate 3 relevant follow-up questions that the user might want to ask next. Return ONLY the questions, one per line, without numbers or bullets.`;
      
      const audioData = btoa(prompt);
      const result = await processVoiceInput({
        cameraId,
        speaker: "technician",
        audioData,
      });
      
      if (result.response) {
        // Parse the response into individual questions
        const questions = result.response
          .split('\n')
          .map(q => q.trim())
          .filter(q => q.length > 0 && q.includes('?'))
          .slice(0, 3);
        
        console.log('✅ AI generated questions:', questions);
        
        if (questions.length > 0) {
          setSuggestedQuestions(questions);
        } else {
          // Fallback to simple questions
          setSuggestedQuestions([
            "Can you explain more?",
            "What should I do next?",
            "Are there any other considerations?"
          ]);
        }
      }
    } catch (error) {
      console.error('❌ Error generating AI suggestions:', error);
      // Use simple fallback questions
      setSuggestedQuestions([
        "Can you explain more?",
        "What should I do next?",
        "Are there any other considerations?"
      ]);
    }
  };

  const askQuestion = async (question: string) => {
    await handleVoiceInput(question);
  };

  return (
    <div className="absolute top-20 right-8 bottom-8 z-20 w-96 bg-black/95 backdrop-blur-sm rounded-xl border border-white/20 shadow-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span className="text-white font-semibold text-sm">AI Assistant</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-blue-200">
          <FiCpu className="animate-pulse" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/90">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">
            <FiMic className="text-4xl mb-3 mx-auto animate-pulse text-blue-400" />
            <p className="mb-2">Click the mic to ask Kramtron</p>
            <p className="text-xs">Get instant help with troubleshooting</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-lg text-sm ${
                msg.role === 'assistant'
                  ? 'bg-blue-600/90 text-white border border-blue-400/50 shadow-lg'
                  : 'bg-gray-600/90 text-white border border-gray-400/50 shadow-lg'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold flex items-center gap-1">
                  {msg.role === 'assistant' ? (
                    <>
                      <FiCpu className="text-blue-300" /> Kramtron
                    </>
                  ) : (
                    <>
                      <FiUser className="text-gray-300" /> Technician
                    </>
                  )}
                </span>
              </div>
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-blue-600/90 text-white border border-blue-400/50 p-3 rounded-lg text-sm shadow-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                <span>Kramtron is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Questions */}
      {suggestedQuestions.length > 0 && !isProcessing && (
        <div className="p-4 border-t border-white/10 bg-black/50">
          <div className="flex items-center gap-2 mb-2">
            <FiZap className="text-blue-400 text-sm" />
            <p className="text-xs text-gray-400">Suggested Questions:</p>
          </div>
          <div className="space-y-2">
            {suggestedQuestions.map((question, idx) => (
              <button
                key={idx}
                onClick={() => askQuestion(question)}
                className="w-full text-left px-3 py-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-400/40 rounded-lg text-gray-300 hover:text-white transition-all"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Voice Input Controls */}
      <div className="p-4 border-t border-white/10 bg-black/70">
        {isListening && transcript && (
          <div className="mb-3 p-2 bg-white/5 rounded border border-white/10">
            <p className="text-xs text-gray-400 mb-1">Listening...</p>
            <p className="text-sm text-white">{transcript}</p>
          </div>
        )}
        
        <button
          onClick={toggleListening}
          disabled={isProcessing}
          className={`w-full py-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : isProcessing
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:shadow-blue-500/50 hover:shadow-xl'
          }`}
        >
          {isListening ? (
            <>
              <FiMicOff /> Stop Listening
            </>
          ) : isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
              Processing...
            </>
          ) : (
            <>
              <FiMic /> Ask Kramtron
            </>
          )}
        </button>
        
        <p className="text-xs text-gray-500 text-center mt-2">
          {isListening ? 'Speak your question now' : 'Click to start voice input'}
        </p>
      </div>

      {/* Hidden audio element for ElevenLabs playback */}
      <audio ref={audioRef} style={{ display: 'none' }} />
      
      {/* Inventory Order Notification */}
      <InventoryNotification 
        order={inventoryOrder} 
        onClose={() => setInventoryOrder(null)} 
      />
    </div>
  );
}

