'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Image, Mic, Loader2, Square, Sparkles, Wand2, Volume2, VolumeX, Phone, Copy, Check, User, Bot, Download } from 'lucide-react';
import { aiService, TextRequest } from '@/services/ai';
import { conversationService } from '@/services/conversations';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'image' | 'audio' | 'generated-image';
  isLoading?: boolean;
  imageUrl?: string;
  metadata?: {
    imageUrl?: string;
  };
}

interface ChatInterfaceProps {
  conversationId?: string;
  onNewConversation?: () => void;
  onConversationUpdated?: () => void;
}

export default function ChatInterface({
  conversationId,
  onNewConversation,
  onConversationUpdated,
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
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
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

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadImage = (imageUrl: string, filename: string = 'generated-image.png') => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation when conversationId changes
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  const loadConversation = async (id: string) => {
    try {
      const response = await conversationService.getById(id);
      if (response.success && response.data.messages) {
        const loadedMessages: Message[] = response.data.messages.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          type: (msg.type as 'text' | 'image' | 'audio' | 'generated-image') || 'text',
          imageUrl: msg.metadata?.imageUrl,
        }));
        setMessages(loadedMessages);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const saveMessages = useCallback(async (newMessages: { role: string; content: string; type: string; metadata?: any }[]) => {
    if (!conversationId) return;
    
    try {
      await conversationService.addMessages(conversationId, newMessages as any);
      onConversationUpdated?.();
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  }, [conversationId, onConversationUpdated]);

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    // Check if we have a selected image to analyze
    if (selectedImage) {
      await handleImageAnalysis();
      return;
    }

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
          
          // Save messages to conversation
          await saveMessages([
            { role: 'user', content: prompt, type: 'text' },
            { role: 'assistant', content: fullText, type: 'text' },
          ]);
          
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
      
      // Save messages to conversation
      await saveMessages([
        { role: 'user', content: `Generate an image: ${prompt}`, type: 'text' },
        { role: 'assistant', content: revisedPrompt, type: 'generated-image', metadata: { imageUrl } },
      ]);
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

    // Convert to base64 for preview only - don't analyze yet
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageAnalysis = async () => {
    if (!selectedImage) return;

    try {
      setIsLoading(true);

      const imageDataUrl = selectedImage;

      const userMessage: Message = {
        role: 'user',
        content: input.trim() || '[Image uploaded]',
        type: 'image',
        imageUrl: imageDataUrl,
      };

      setMessages((prev) => [...prev, userMessage]);
      const prompt = input.trim() || 'What do you see in this image? Describe it in detail.';
      setInput('');
      setSelectedImage(null);

      // Analyze image with the prompt
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
      
      // Save messages to conversation
      await saveMessages([
        { role: 'user', content: prompt, type: 'image', metadata: { imageUrl: imageDataUrl } },
        { role: 'assistant', content: analysisText, type: 'text' },
      ]);
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

      // Session is already configured via client secret - no additional update needed
      console.log('WebSocket ready, proceeding to WebRTC setup');

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
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
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
            className={`group flex gap-3 ${
              message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            } animate-in fade-in slide-in-from-bottom-2 duration-200`}
          >
            {/* Avatar */}
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {message.role === 'user' ? (
                <User className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </div>

            {/* Message Content */}
            <div
              className={`flex-1 max-w-[85%] md:max-w-[75%] ${
                message.role === 'user' ? 'flex flex-col items-end' : ''
              }`}
            >
              {message.isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              ) : message.type === 'image' ? (
                <div className="space-y-2">
                  {message.imageUrl && (
                    <div className="relative rounded-lg overflow-hidden">
                      <img
                        src={message.imageUrl}
                        alt="Uploaded"
                        className="max-w-[300px] h-auto rounded-lg"
                      />
                    </div>
                  )}
                  {message.content && message.content !== '[Image uploaded]' && (
                    <p className={`text-sm ${message.role === 'user' ? 'text-right' : ''}`}>
                      {message.content}
                    </p>
                  )}
                </div>
              ) : message.type === 'generated-image' ? (
                <div className="space-y-2">
                  {message.imageUrl && (
                    <div className="relative rounded-lg overflow-hidden group/img">
                      <img
                        src={message.imageUrl}
                        alt={message.content || 'Generated image'}
                        className="max-w-[400px] h-auto rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8"
                          onClick={() => downloadImage(message.imageUrl!, `generated-${index}.png`)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  )}
                  {message.content && (
                    <p className="text-xs text-muted-foreground">
                      {message.content}
                    </p>
                  )}
                </div>
              ) : (
                <div
                  className={`rounded-2xl px-4 py-2.5 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-code:bg-background/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-background/50 prose-pre:p-3 prose-pre:rounded-lg">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              )}

              {/* Action buttons - show on hover */}
              {!message.isLoading && message.content && (
                <div
                  className={`flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                    message.role === 'user' ? 'flex-row-reverse' : ''
                  }`}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => copyToClipboard(message.content, index)}
                    title="Copy"
                  >
                    {copiedIndex === index ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  {message.role === 'assistant' && message.type === 'text' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => speakText(message.content)}
                      disabled={isPlayingAudio}
                      title="Speak"
                    >
                      {isPlayingAudio ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Volume2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t bg-background shrink-0">
        {/* Input Area */}
        <div className="p-4">
          {selectedImage && (
            <div className="mb-3 relative inline-block">
              <div className="relative">
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="max-w-[150px] h-auto rounded-lg border border-border"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => setSelectedImage(null)}
                >
                  ×
                </Button>
              </div>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={generateImageMode ? "Describe the image..." : "Type your message..."}
                className="w-full min-h-[52px] max-h-[200px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-ring bg-background text-sm"
                style={{ 
                  paddingBottom: isRecording ? '36px' : '28px',
                  paddingRight: '60px',
                  boxSizing: 'border-box'
                }}
                disabled={isLoading || isRealtimeMode}
              />
              {generateImageMode && (
                <div className="absolute top-2 right-2 text-xs text-muted-foreground">
                  Image Mode
                </div>
              )}
              {isRecording && (
                <div className="absolute bottom-[28px] left-3 flex items-center gap-1.5 text-destructive text-xs">
                  <div className="h-1.5 w-1.5 bg-destructive rounded-full animate-pulse" />
                  Recording
                </div>
              )}
              {/* Tool buttons in second row inside input box */}
              <div className="absolute bottom-2 left-2 flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Upload Image"
              onClick={handleImageUpload}
              disabled={isLoading || isRealtimeMode}
            >
              <Image className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${generateImageMode ? 'bg-primary/10 text-primary' : ''}`}
              title="Generate Image"
              onClick={handleGenerateImageClick}
              disabled={isLoading || isRealtimeMode}
            >
              <Wand2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${audioEnabled ? 'bg-primary/10 text-primary' : ''}`}
              title={audioEnabled ? 'Audio On' : 'Audio Off'}
              onClick={toggleAudio}
              disabled={isLoading || isRealtimeMode}
            >
              {audioEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
            {!isRealtimeMode && (
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 ${isRecording ? 'text-destructive' : ''}`}
                title={isRecording ? 'Stop Recording' : 'Voice Input'}
                onClick={handleVoiceInput}
                disabled={isLoading}
              >
                {isRecording ? (
                  <Square className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${isRealtimeMode ? 'bg-orange-500/10 text-orange-600' : ''}`}
              title={isRealtimeMode ? 'Disconnect Speech-to-Speech' : 'Speech-to-Speech'}
              onClick={toggleRealtimeMode}
              disabled={isLoading || isRecording}
            >
              <Phone className="h-4 w-4" />
            </Button>
              </div>
              {/* Send button inside input box */}
              <Button
                onClick={handleSend}
                disabled={(!input.trim() && !selectedImage) || isLoading || isRealtimeMode}
                size="icon"
                className="absolute top-2 right-2 h-[28px] w-[28px] rounded-lg"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
