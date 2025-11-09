import { useState, useRef, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { FiMic, FiSend, FiMessageSquare, FiUser, FiTool, FiCpu } from "react-icons/fi";
import InventoryNotification from "./InventoryNotification";

interface LiveCallChatProps {
  cameraId: Id<"cameraFeeds">;
  onInventoryOrder?: (order: { partNumber: string; partName: string; quantity: number; currentStock: number }) => void;
}

interface Message {
  speaker: "technician" | "engineer" | "kramtron";
  content: string;
  timestamp: number;
  isQuestion?: boolean;
}

export function LiveCallChat({ cameraId, onInventoryOrder }: LiveCallChatProps) {
  const [transcript, setTranscript] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [showAskKramtron, setShowAskKramtron] = useState(false);
  const [kramtronQuestion, setKramtronQuestion] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [inventoryOrder, setInventoryOrder] = useState<{
    partNumber: string;
    partName: string;
    quantity: number;
    currentStock: number;
  } | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const processVoiceInput = useAction(api.agents.voiceChat.processVoiceInput);
  
  // Always listening - no toggle needed

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Web Speech API for continuous listening
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        console.log('🎤 Speech recognition started - listening for conversation...');
      };
      
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
        
        // Show live transcript
        setTranscript(interimTranscript);
        
        // When we get final transcript, add to messages and analyze
        if (finalTranscript) {
          console.log('📝 Captured:', finalTranscript.trim());
          
          const newMessage: Message = {
            speaker: "technician", // Generic "Speaker" for both technician and engineer
            content: finalTranscript.trim(),
            timestamp: Date.now(),
          };
          
          setMessages(prev => {
            const updated = [...prev, newMessage];
            // Automatically get Kramtron's response
            getKramtronResponse(finalTranscript.trim());
            return updated;
          });
          
          // Clear transcript after adding to messages
          setTimeout(() => setTranscript(''), 100);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('❌ Speech recognition error:', event.error);
        
        if (event.error === 'not-allowed') {
          alert('🎤 Microphone access denied. Please allow microphone access in your browser settings and refresh the page.');
        } else if (event.error === 'no-speech') {
          console.log('⚠️  No speech detected, continuing to listen...');
        } else {
          console.error('Speech recognition error details:', event);
        }
      };
      
      recognition.onend = () => {
        console.log('🔄 Speech recognition ended, restarting...');
        // Always restart - continuously listening
        try {
          recognition.start();
        } catch (error) {
          console.error('Error restarting recognition:', error);
        }
      };
      
      recognitionRef.current = recognition;
      
      // Auto-start listening when component mounts
      console.log('🚀 Starting speech recognition...');
      try {
        recognition.start();
      } catch (error) {
        console.error('❌ Failed to start speech recognition:', error);
        alert('Failed to start speech recognition. Please make sure you are using Chrome or Edge browser.');
      }
    } else {
      console.error('❌ Speech recognition not supported in this browser');
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
    }
    
    return () => {
      if (recognitionRef.current) {
        console.log('🛑 Stopping speech recognition...');
        recognitionRef.current.stop();
      }
    };
  }, []); // Empty dependency array - only run once on mount


  const getKramtronResponse = async (userMessage: string) => {
    console.log('🤖 Getting Kramtron response for:', userMessage);
    setIsProcessing(true);
    
    try {
      // Get conversation history for context
      const conversationHistory = messages.slice(-5).map(m => `${m.speaker}: ${m.content}`).join('\n');
      
      // Call Nemotron to get response
      const audioData = btoa(userMessage);
      const result = await processVoiceInput({
        cameraId,
        speaker: "engineer",
        audioData,
      });
      
      const response = result.response || "I'm analyzing that. Can you provide more details?";
      
      console.log('✅ Kramtron responded:', response);
      
      // Check if an inventory order was placed
      if (result.inventoryOrder) {
        console.log('📦 Inventory order detected:', result.inventoryOrder);
        setInventoryOrder(result.inventoryOrder);
        if (onInventoryOrder) {
          onInventoryOrder(result.inventoryOrder);
        }
      }
      
      // Add Kramtron's response to messages
      const kramtronMessage: Message = {
        speaker: "kramtron",
        content: response,
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, kramtronMessage]);
      
      // Ask Nemotron to generate follow-up questions
      await generateAISuggestedQuestions(userMessage, response);
      
      // NO AUDIO PLAYBACK in Live Call Mode - responses are text-only in the chat
      
    } catch (error) {
      console.error('❌ Error getting Kramtron response:', error);
      
      // Fallback response
      const fallbackResponse = "I'm here to help. Can you tell me more about what you're working on?";
      const kramtronMessage: Message = {
        speaker: "kramtron",
        content: fallbackResponse,
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, kramtronMessage]);
      // NO AUDIO in Live Call Mode - text-only responses
    } finally {
      setIsProcessing(false);
    }
  };

  const generateAISuggestedQuestions = async (userMessage: string, kramtronResponse: string) => {
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
        speaker: "engineer",
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


  const askKramtron = async (question: string) => {
    setIsProcessing(true);
    
    try {
      // Add user question to chat
      const questionMessage: Message = {
        speaker: "engineer", // Whoever asked the question
        content: question,
        timestamp: Date.now(),
        isQuestion: true,
      };
      setMessages(prev => [...prev, questionMessage]);
      
      // Call Nemotron via Convex backend
      const audioData = btoa(question); // Simple encoding for now
      const result = await processVoiceInput({
        cameraId,
        speaker: "engineer",
        audioData,
      });
      
      const response = result.response || getMockKramtronResponse(question, messages);
      
      const responseMessage: Message = {
        speaker: "kramtron",
        content: response,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, responseMessage]);
      
      // NO AUDIO in Live Call Mode - text-only responses
      
      setKramtronQuestion('');
      setShowAskKramtron(false);
    } catch (error) {
      console.error('Error asking Kramtron:', error);
      
      // Fallback to mock response
      const response = getMockKramtronResponse(question, messages);
      const responseMessage: Message = {
        speaker: "kramtron",
        content: response,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, responseMessage]);
      // NO AUDIO in Live Call Mode - text-only responses
      
      setKramtronQuestion('');
      setShowAskKramtron(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const getMockKramtronResponse = (question: string, context: Message[]): string => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('error') || lowerQuestion.includes('code')) {
      return "Check the display panel for the error code. Common codes are E01 (power issue), E02 (sensor fault), and E03 (overheating). Let me know what you see.";
    } else if (lowerQuestion.includes('procedure') || lowerQuestion.includes('sop')) {
      return "For this equipment, follow SOP-2847: First, verify power connections. Second, check all safety switches. Third, inspect for visible damage. Would you like me to pull up the full procedure?";
    } else if (lowerQuestion.includes('part') || lowerQuestion.includes('replacement')) {
      return "Based on the symptoms, you might need part #A-2847. It's in stock in Bay 3, Shelf B. The replacement takes about 15 minutes following SOP-3012.";
    } else if (lowerQuestion.includes('safety')) {
      return "Safety first! Make sure to: 1) Lock out/tag out power source, 2) Wear PPE (gloves, safety glasses), 3) Ensure proper ventilation. Do not proceed until all safety measures are in place.";
    } else if (lowerQuestion.includes('next') || lowerQuestion.includes('step')) {
      return "Based on your conversation, the next step is to verify the power connections and check if all circuit breakers are in the correct position. Let me know what you find.";
    } else {
      return "I'm analyzing the situation. Can you provide more details about what you're seeing? This will help me give you more specific guidance.";
    }
  };

  return (
    <div className="absolute top-20 right-8 bottom-8 z-20 w-96 bg-black/95 backdrop-blur-sm rounded-xl border border-white/20 shadow-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          <span className="text-white font-semibold text-sm">Live Call Transcript</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-blue-200">
          <FiMic className="animate-pulse" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/90">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">
            <FiMic className="text-4xl mb-3 mx-auto animate-pulse text-blue-400" />
            <p className="mb-2">Listening to conversation...</p>
            <p className="text-xs">Kramtron is analyzing and ready to help</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.speaker === 'kramtron' ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-lg text-sm ${
                msg.speaker === 'kramtron'
                  ? 'bg-blue-600/90 text-white border border-blue-400/50 shadow-lg'
                  : 'bg-gray-600/90 text-white border border-gray-400/50 shadow-lg'
              } ${msg.isQuestion ? 'ring-2 ring-yellow-400/70' : ''}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold flex items-center gap-1">
                  {msg.speaker === 'kramtron' ? (
                    <>
                      <FiCpu className="text-blue-300" /> Kramtron
                    </>
                  ) : (
                    <>
                      <FiUser className="text-gray-300" /> Speaker
                    </>
                  )}
                </span>
                {msg.isQuestion && <FiMessageSquare className="text-xs text-yellow-400" />}
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
        
        <div ref={messagesEndRef} />
      </div>

      {/* Current Transcript */}
      {transcript && (
        <div className="border-t border-white/10 p-3 bg-gray-900/90">
          <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
            <FiMic className="animate-pulse" /> Listening...
          </p>
          <p className="text-sm text-white">{transcript}</p>
        </div>
      )}

      {/* Suggested Questions from Kramtron */}
      {suggestedQuestions.length > 0 && (
        <div className="border-t border-white/10 p-3 bg-gray-900/90">
          <p className="text-xs font-semibold text-blue-300 mb-2 flex items-center gap-1">
            <FiCpu className="text-blue-400" /> Kramtron suggests asking:
          </p>
          <div className="space-y-1">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => askKramtron(q)}
                className="w-full text-left text-xs text-white bg-blue-600/80 hover:bg-blue-600 p-2 rounded transition-colors border border-blue-400/50 shadow-md"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Ask Kramtron Button/Input */}
      <div className="border-t border-white/10 p-3 bg-gray-900/90">
        {!showAskKramtron ? (
          <button
            onClick={() => setShowAskKramtron(true)}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg hover:shadow-glow transition-all font-semibold text-sm flex items-center justify-center gap-2 shadow-md"
          >
            <FiMessageSquare />
            Ask Kramtron a Question
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={kramtronQuestion}
              onChange={(e) => setKramtronQuestion(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && kramtronQuestion && askKramtron(kramtronQuestion)}
              placeholder="Type your question..."
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 outline-none"
              autoFocus
            />
            <button
              onClick={() => kramtronQuestion && askKramtron(kramtronQuestion)}
              disabled={!kramtronQuestion}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <FiSend />
            </button>
          </div>
        )}
      </div>
      
      {/* Inventory Order Notification */}
      <InventoryNotification 
        order={inventoryOrder} 
        onClose={() => setInventoryOrder(null)} 
      />
    </div>
  );
}

