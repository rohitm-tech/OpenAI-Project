'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Image, Mic, Loader2, Square, Sparkles, Wand2, Volume2, VolumeX } from 'lucide-react';
import { aiService, TextRequest } from '@/services/ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'image' | 'audio' | 'generated-image';
  isLoading?: boolean;
  imageUrl?: string;
}

interface ChatInterfaceProps {
  conversationId?: string;
  onNewConversation?: () => void;
}

export default function ChatInterface({
  conversationId,
  onNewConversation,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [generateImageMode, setGenerateImageMode] = useState(false);
  const [isRealtimeMode, setIsRealtimeMode] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const realtimeConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Check if we're in image generation mode
    if (generateImageMode) {
      await handleGenerateImage();
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: input,
      type: 'text',
    };

    setMessages((prev) => [...prev, userMessage]);
    const prompt = input;
    setInput('');
    setIsLoading(true);
    setIsStreaming(true);

    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      type: 'text',
      isLoading: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const request: TextRequest = {
        input: prompt,
        conversationId,
      };

      await aiService.generateTextStream(
        request,
        (chunk) => {
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === 'assistant') {
              lastMessage.content += chunk;
              lastMessage.isLoading = false;
            }
            return newMessages;
          });
        },
        async (fullText) => {
          setIsStreaming(false);
          setIsLoading(false);
          
          // Automatically speak the response if audio is enabled
          if (audioEnabled && fullText && fullText.trim()) {
            // Small delay to ensure message is displayed first
            setTimeout(async () => {
              await speakText(fullText);
            }, 500);
          }
        },
        (error) => {
          console.error('Stream error:', error);
          setIsStreaming(false);
          setIsLoading(false);
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            lastMessage.content = `Error: ${error.message}`;
            lastMessage.isLoading = false;
            return newMessages;
          });
        }
      );
    } catch (error: any) {
      console.error('Error sending message:', error);
      setIsStreaming(false);
      setIsLoading(false);
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        lastMessage.content = `Error: ${error.message}`;
        lastMessage.isLoading = false;
        return newMessages;
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleGenerateImage = async () => {
    if (!input.trim() || isLoading) return;

    const prompt = input.trim();
    const userMessage: Message = {
      role: 'user',
      content: `Generate an image: ${prompt}`,
      type: 'text',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      type: 'generated-image',
      isLoading: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await aiService.generateImage({
        prompt,
      });

      const imageUrl = response.data?.imageUrl || response.imageUrl || '';
      const revisedPrompt = response.data?.revisedPrompt || response.revisedPrompt || prompt;

      setMessages((prev) => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        lastMessage.content = revisedPrompt;
        lastMessage.imageUrl = imageUrl;
        lastMessage.isLoading = false;
        return newMessages;
      });
    } catch (error: any) {
      console.error('Error generating image:', error);
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        lastMessage.content = `Error: ${error.response?.data?.error || error.message || 'Failed to generate image'}`;
        lastMessage.type = 'text';
        lastMessage.isLoading = false;
        return newMessages;
      });
    } finally {
      setIsLoading(false);
      setGenerateImageMode(false);
    }
  };

  const handleGenerateImageClick = () => {
    setGenerateImageMode(true);
    inputRef.current?.focus();
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size should be less than 10MB');
      return;
    }

    // Convert to base64 for preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload image and analyze
    try {
      setIsLoading(true);
      
      // Convert file to base64 for API
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // For now, we'll use a data URL approach
      // In production, you'd upload to a storage service first
      const imageDataUrl = `data:${file.type};base64,${base64Image}`;

      const userMessage: Message = {
        role: 'user',
        content: `[Image uploaded: ${file.name}]`,
        type: 'image',
      };

      setMessages((prev) => [...prev, userMessage]);

      // Analyze image with a prompt
      const prompt = input.trim() || 'What do you see in this image? Describe it in detail.';
      
      const response = await aiService.analyzeImage({
        imageUrl: imageDataUrl,
        prompt,
      });

      // Backend returns { success: true, data: { text, output, id } }
      const analysisText = response.data?.text || response.text || 'Unable to analyze image';

      const assistantMessage: Message = {
        role: 'assistant',
        content: analysisText,
        type: 'text',
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setSelectedImage(null);
      setInput('');
    } catch (error: any) {
      console.error('Error analyzing image:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error analyzing image: ${error.response?.data?.error || error.message || 'Failed to analyze image. Please make sure you have access to vision models (gpt-4o, gpt-4-turbo, or gpt-4-vision-preview).'}`,
        type: 'text',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleVoiceInput = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    // Check if browser supports Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + (prev ? ' ' : '') + transcript);
        setIsRecording(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        alert('Speech recognition error. Please try again.');
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } else {
      // Fallback: Use MediaRecorder API for audio recording
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
          };

          mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
            
            try {
              setIsLoading(true);
              const response = await aiService.speechToText(audioFile);
              setInput((prev) => prev + (prev ? ' ' : '') + response.text);
            } catch (error: any) {
              console.error('Error transcribing audio:', error);
              alert('Error transcribing audio. Please try again.');
            } finally {
              setIsLoading(false);
              stream.getTracks().forEach((track) => track.stop());
            }
          };

          mediaRecorder.start();
          setIsRecording(true);
        })
        .catch((error) => {
          console.error('Error accessing microphone:', error);
          alert('Microphone access denied. Please enable microphone permissions.');
        });
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    
    setIsRecording(false);
  };

  const speakText = async (text: string) => {
    try {
      setIsPlayingAudio(true);
      
      // Clean up any existing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Remove markdown formatting for cleaner speech
      const cleanText = text
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/`[^`]+`/g, '') // Remove inline code
        .replace(/#{1,6}\s+/g, '') // Remove headers
        .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
        .replace(/\*([^*]+)\*/g, '$1') // Remove italic
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove links
        .trim();

      if (!cleanText) {
        setIsPlayingAudio(false);
        return;
      }

      // Generate audio
      const audioBlob = await aiService.textToSpeech({
        text: cleanText,
        voice: 'alloy',
        model: 'tts-1',
      });

      // Create audio URL and play
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setIsPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      await audio.play();
    } catch (error: any) {
      console.error('Error speaking text:', error);
      setIsPlayingAudio(false);
    }
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlayingAudio(false);
    }
  };

  const toggleRealtimeMode = async () => {
    if (isRealtimeMode) {
      // Disconnect
      await disconnectRealtime();
      setIsRealtimeMode(false);
    } else {
      // Connect
      try {
        await connectRealtime();
        setIsRealtimeMode(true);
      } catch (error: any) {
        console.error('Error connecting to realtime:', error);
        alert(`Failed to connect: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const connectRealtime = async () => {
    let ws: WebSocket | null = null;
    let pc: RTCPeerConnection | null = null;
    let keepAliveInterval: NodeJS.Timeout | null = null;
    
    try {
      // Get client secret from backend
      const response = await aiService.createRealtimeClientSecret({
        voice: 'alloy',
        instructions: 'You are a helpful assistant. Be conversational and natural.',
      });

      const clientSecret = response.data?.clientSecret;
      if (!clientSecret) {
        throw new Error('Failed to get client secret');
      }

      // Initialize WebSocket connection FIRST for events
      // Note: Browsers don't support custom headers in WebSocket, so we pass client secret in URL
      const wsUrl = `wss://api.openai.com/v1/realtime?model=gpt-realtime&client_secret=${encodeURIComponent(clientSecret)}`;
      ws = new WebSocket(wsUrl);
      
      // Wait for WebSocket to open
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
        }, 10000);

        ws!.onopen = () => {
          clearTimeout(timeout);
          console.log('Realtime WebSocket connected');
          resolve();
        };

        ws!.onerror = (error) => {
          clearTimeout(timeout);
          console.error('WebSocket connection error:', error);
          reject(new Error('WebSocket connection failed'));
        };
      });

      // Configure session immediately after connection
      try {
        ws.send(
          JSON.stringify({
            type: 'session.update',
            session: {
              type: 'realtime',
              instructions: 'You are a helpful assistant. Be conversational and natural.',
              audio: {
                output: { voice: 'alloy' },
              },
            },
          })
        );
        console.log('Session update sent');
      } catch (error) {
        console.error('Error sending session update:', error);
      }

      // Get user media (microphone)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      localStreamRef.current = stream;

      // Create RTCPeerConnection
      pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });
      realtimeConnectionRef.current = pc;

      // Add local audio track
      stream.getTracks().forEach((track) => {
        pc!.addTrack(track, stream);
      });

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log('RTC connection state:', pc!.connectionState);
        if (pc!.connectionState === 'failed') {
          console.warn('RTC connection failed');
        } else if (pc!.connectionState === 'disconnected') {
          console.warn('RTC connection disconnected');
        }
      };

      // Handle ICE connection state
      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc!.iceConnectionState);
        if (pc!.iceConnectionState === 'failed') {
          console.warn('ICE connection failed');
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('ICE candidate generated');
        } else {
          console.log('ICE gathering complete');
        }
      };

      // Handle remote audio
      pc.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind);
        const [remoteStream] = event.streams;
        remoteStreamRef.current = remoteStream;
        
        // Play remote audio
        const audio = new Audio();
        audio.srcObject = remoteStream;
        audio.autoplay = true;
        audio.play().catch((error) => {
          console.error('Error playing remote audio:', error);
        });
      };

      // Create offer with proper constraints
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });
      await pc.setLocalDescription(offer);

      // Send SDP to OpenAI Realtime API
      const sdpResponse = await fetch('https://api.openai.com/v1/realtime/calls', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${clientSecret}`,
          'Content-Type': 'application/sdp',
        },
        body: offer.sdp,
      });

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        console.error('SDP response error:', sdpResponse.status, errorText);
        throw new Error(`Failed to establish RTC connection: ${sdpResponse.status}`);
      }

      const answerSdp = await sdpResponse.text();
      const answer = { type: 'answer' as RTCSdpType, sdp: answerSdp };
      await pc.setRemoteDescription(answer);
      console.log('RTC connection established');

      // WebSocket handlers (already set up above, but add message handlers)

      // Set up WebSocket message handlers
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Only log important events to reduce console noise
          if (data.type !== 'input_audio_buffer.speech_started' && 
              data.type !== 'input_audio_buffer.speech_stopped' &&
              data.type !== 'response.audio_transcript.delta') {
            console.log('Realtime event:', data.type);
          }

          // Handle error events
          if (data.type === 'error') {
            console.error('Realtime API error:', data.error);
            // Log the error but don't disconnect - some errors are recoverable
            if (data.error?.message) {
              console.error('Error details:', data.error.message);
            }
            // Don't return - continue processing
          }

          // Handle session events
          if (data.type === 'session.created' || data.type === 'session.updated') {
            console.log('Session ready:', data.type);
          }

          // Handle different event types
          if (data.type === 'response.output_text.delta') {
            // Text output (optional, for display)
            const text = data.delta;
            if (text) {
              setMessages((prev) => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.role === 'assistant') {
                  lastMessage.content += text;
                } else {
                  newMessages.push({
                    role: 'assistant',
                    content: text,
                    type: 'text',
                  });
                }
                return newMessages;
              });
            }
          } else if (data.type === 'response.output_audio.delta') {
            // Audio is handled by WebRTC
          } else if (data.type === 'conversation.item.added') {
            // New conversation item
            if (data.item?.type === 'message' && data.item.role === 'assistant') {
              setMessages((prev) => [
                ...prev,
                {
                  role: 'assistant',
                  content: data.item.content?.[0]?.text || '',
                  type: 'text',
                },
              ]);
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error, event.data);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error event:', error);
        // Don't automatically disconnect - let onclose handle it
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason, event.wasClean);
        
        // Clear keepalive interval
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
          keepAliveInterval = null;
        }
        
        // Only disconnect if it wasn't intentional (code 1000) or user-initiated
        if (event.code !== 1000 && isRealtimeMode) {
          console.warn('Unexpected WebSocket close, disconnecting...');
          setIsRealtimeMode(false);
          // Clean up resources
          setTimeout(() => {
            disconnectRealtime();
          }, 100);
        }
      };

      // Add keepalive to prevent connection timeout
      keepAliveInterval = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          try {
            // Send a ping or session update to keep connection alive
            ws.send(JSON.stringify({ type: 'session.update', session: {} }));
          } catch (error) {
            console.error('Error sending keepalive:', error);
          }
        }
      }, 30000); // Every 30 seconds

      // Store WebSocket and interval references in the PC object for cleanup
      (pc as any).ws = ws;
      (pc as any).keepAliveInterval = keepAliveInterval;
    } catch (error: any) {
      console.error('Error connecting to realtime:', error);
      throw error;
    }
  };

  const disconnectRealtime = async () => {
    try {
      // Clear keepalive interval
      if (realtimeConnectionRef.current && (realtimeConnectionRef.current as any).keepAliveInterval) {
        clearInterval((realtimeConnectionRef.current as any).keepAliveInterval);
        (realtimeConnectionRef.current as any).keepAliveInterval = null;
      }

      // Close WebSocket gracefully
      if (realtimeConnectionRef.current && (realtimeConnectionRef.current as any).ws) {
        const ws = (realtimeConnectionRef.current as any).ws;
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close(1000, 'User disconnected');
        }
        (realtimeConnectionRef.current as any).ws = null;
      }

      // Close RTCPeerConnection
      if (realtimeConnectionRef.current) {
        realtimeConnectionRef.current.close();
        realtimeConnectionRef.current = null;
      }

      // Stop local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
        localStreamRef.current = null;
      }

      // Stop remote stream
      if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
        remoteStreamRef.current = null;
      }
    } catch (error) {
      console.error('Error disconnecting realtime:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (isRealtimeMode) {
        disconnectRealtime();
      }
    };
  }, [isRealtimeMode]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground mt-12 md:mt-16">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <p className="text-xl md:text-2xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Start a conversation
            </p>
            <p className="text-sm md:text-base max-w-md mx-auto">
              Ask me anything, and I'll help you with text, images, or voice interactions.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-6 text-xs">
              <span className="px-3 py-1 rounded-full bg-muted border">💬 Text Chat</span>
              <span className="px-3 py-1 rounded-full bg-muted border">🖼️ Image Analysis</span>
              <span className="px-3 py-1 rounded-full bg-muted border">✨ Generate Images</span>
              <span className="px-3 py-1 rounded-full bg-muted border">🎤 Voice Input</span>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            } animate-in fade-in slide-in-from-bottom-4 duration-300`}
          >
            <Card
              className={`max-w-[85%] md:max-w-[75%] ${
                message.role === 'user'
                  ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-lg border-primary/20'
                  : 'bg-card border-2 shadow-md hover:shadow-lg transition-shadow'
              }`}
            >
              <CardContent className="p-4 md:p-5">
                {message.isLoading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                ) : message.role === 'assistant' ? (
                  <div className="space-y-2">
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-p:leading-relaxed prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                    {message.content && !message.isLoading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => speakText(message.content)}
                        disabled={isPlayingAudio}
                      >
                        {isPlayingAudio ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Speaking...
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-3 w-3 mr-1" />
                            Speak
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                ) : message.type === 'image' ? (
                  <div className="space-y-3">
                    {selectedImage && message.content.includes('[Image uploaded') && (
                      <div className="relative group">
                        <img
                          src={selectedImage}
                          alt="Uploaded"
                          className="max-w-full h-auto rounded-lg shadow-lg border-2 border-primary/20 transition-transform group-hover:scale-[1.02]"
                        />
                        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                          Image
                        </div>
                      </div>
                    )}
                    <p className="text-sm opacity-90 font-medium">{message.content}</p>
                  </div>
                ) : message.type === 'generated-image' ? (
                  <div className="space-y-3">
                    {message.imageUrl ? (
                      <div className="relative group">
                        <img
                          src={message.imageUrl}
                          alt={message.content || 'Generated image'}
                          className="max-w-full h-auto rounded-lg shadow-lg border-2 border-primary/20 transition-transform group-hover:scale-[1.02]"
                        />
                        <div className="absolute top-2 right-2 bg-gradient-to-r from-purple-500/90 to-pink-500/90 text-white text-xs px-2 py-1 rounded backdrop-blur-sm font-medium">
                          ✨ Generated
                        </div>
                      </div>
                    ) : null}
                    {message.content && (
                      <p className="text-sm text-muted-foreground italic">
                        Prompt: {message.content}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t bg-muted/30 backdrop-blur-sm">
        {/* Toolbar */}
        <div className="px-4 pt-3 pb-2 flex items-center gap-2 flex-wrap border-b">
          <Button
            variant={audioEnabled ? 'default' : 'outline'}
            size="sm"
            title={audioEnabled ? 'Disable Audio Output' : 'Enable Audio Output'}
            onClick={toggleAudio}
            disabled={isLoading}
            className={`text-xs transition-all ${
              audioEnabled
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : ''
            }`}
          >
            {audioEnabled ? (
              <>
                <Volume2 className="h-3 w-3 mr-1.5" />
                Audio On
              </>
            ) : (
              <>
                <VolumeX className="h-3 w-3 mr-1.5" />
                Audio Off
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            title="Upload Image"
            onClick={handleImageUpload}
            disabled={isLoading}
            className="text-xs"
          >
            <Image className="h-3 w-3 mr-1.5" />
            Upload Image
          </Button>
          <Button
            variant={generateImageMode ? 'default' : 'outline'}
            size="sm"
            title={generateImageMode ? 'Click Send to generate image' : 'Generate Image'}
            onClick={handleGenerateImageClick}
            disabled={isLoading}
            className={`text-xs ${generateImageMode ? 'bg-pink-500 hover:bg-pink-600 text-white' : ''}`}
          >
            <Wand2 className="h-3 w-3 mr-1.5" />
            {generateImageMode ? 'Generate Image ✓' : 'Generate Image'}
          </Button>
          <Button
            variant={isRecording ? 'destructive' : 'outline'}
            size="sm"
            title={isRecording ? 'Stop Recording' : 'Voice Input'}
            onClick={handleVoiceInput}
            disabled={isLoading || isRealtimeMode}
            className={`text-xs transition-all ${
              isRecording 
                ? 'animate-pulse' 
                : ''
            }`}
          >
            {isRecording ? (
              <>
                <Square className="h-3 w-3 mr-1.5" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="h-3 w-3 mr-1.5" />
                Voice Input
              </>
            )}
          </Button>
          <Button
            variant={isRealtimeMode ? 'default' : 'outline'}
            size="sm"
            title={isRealtimeMode ? 'Disconnect Speech-to-Speech' : 'Enable Speech-to-Speech'}
            onClick={toggleRealtimeMode}
            disabled={isLoading || isRecording}
            className={`text-xs transition-all ${
              isRealtimeMode
                ? 'bg-orange-500 hover:bg-orange-600 text-white animate-pulse'
                : ''
            }`}
          >
            {isRealtimeMode ? (
              <>
                <Square className="h-3 w-3 mr-1.5" />
                Speech Mode
              </>
            ) : (
              <>
                <Mic className="h-3 w-3 mr-1.5" />
                Speech-to-Speech
              </>
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Input Area */}
        <div className="p-4">
          {selectedImage && (
            <div className="mb-3 relative inline-block group">
              <div className="relative">
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="max-w-[200px] h-auto rounded-lg border-2 border-primary/30 shadow-md transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setSelectedImage(null)}
                  >
                    ×
                  </Button>
                </div>
              </div>
              <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full shadow-lg">
                Ready
              </div>
            </div>
          )}
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={generateImageMode ? "Describe the image you want to generate..." : "Type your message..."}
                className="w-full min-h-[60px] max-h-[200px] p-4 border-2 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary/50 bg-background shadow-sm transition-all"
                disabled={isLoading}
              />
              {generateImageMode && (
                <div className="absolute top-2 right-2 bg-pink-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg">
                  ✨ Image Mode
                </div>
              )}
              {isRecording && (
                <div className="absolute bottom-2 left-4 flex items-center gap-2 text-destructive text-sm font-medium">
                  <div className="h-2 w-2 bg-destructive rounded-full animate-pulse" />
                  Recording...
                </div>
              )}
            </div>
            <Button
              onClick={handleSend}
              disabled={(!input.trim() && !selectedImage) || isLoading}
              size="icon"
              className="h-11 w-11 shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
