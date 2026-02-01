'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Image, Mic, Loader2, Square, Sparkles } from 'lucide-react';
import { aiService, TextRequest } from '@/services/ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'image' | 'audio';
  isLoading?: boolean;
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

    const userMessage: Message = {
      role: 'user',
      content: input,
      type: 'text',
    };

    setMessages((prev) => [...prev, userMessage]);
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
        input: userMessage.content,
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
        (fullText) => {
          setIsStreaming(false);
          setIsLoading(false);
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

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
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-p:leading-relaxed prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
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
                ) : (
                  <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t bg-muted/30 backdrop-blur-sm p-4">
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
              placeholder="Type your message or ask about the image..."
              className="w-full min-h-[60px] max-h-[200px] p-4 border-2 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary/50 bg-background shadow-sm transition-all"
              disabled={isLoading}
            />
            {isRecording && (
              <div className="absolute bottom-2 left-4 flex items-center gap-2 text-destructive text-sm font-medium">
                <div className="h-2 w-2 bg-destructive rounded-full animate-pulse" />
                Recording...
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="flex flex-col gap-2">
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                title="Upload Image"
                onClick={handleImageUpload}
                disabled={isLoading}
                className="h-10 w-10 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-300 transition-all"
              >
                <Image className="h-4 w-4" />
              </Button>
              <Button
                variant={isRecording ? 'destructive' : 'outline'}
                size="icon"
                title={isRecording ? 'Stop Recording' : 'Voice Input'}
                onClick={handleVoiceInput}
                disabled={isLoading}
                className={`h-10 w-10 transition-all ${
                  isRecording 
                    ? 'animate-pulse shadow-lg shadow-destructive/50' 
                    : 'hover:bg-green-50 dark:hover:bg-green-950/20 hover:border-green-300'
                }`}
              >
                {isRecording ? (
                  <Square className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
