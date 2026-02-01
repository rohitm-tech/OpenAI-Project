import api from './api';
import { config } from '../config';

export interface TextRequest {
  input: string | Array<{ role: string; content: any }>;
  instructions?: string;
  model?: string;
  conversationId?: string;
}

export interface ImageAnalyzeRequest {
  imageUrl: string;
  prompt: string;
  model?: string;
}

export interface ImageGenerateRequest {
  prompt: string;
  model?: string;
}

export interface TextToSpeechRequest {
  text: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  model?: string;
}

export const aiService = {
  generateText: async (data: TextRequest) => {
    const response = await api.post('/ai/text', data);
    return response.data;
  },

  generateTextStream: async (
    data: TextRequest,
    onChunk: (chunk: string) => void,
    onComplete?: (fullText: string) => void,
    onError?: (error: Error) => void
  ) => {
    try {
      const baseURL = api.defaults.baseURL || `${config.apiUrl}/api/v1`;
      const response = await fetch(`${baseURL}/ai/text/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Stream request failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (!reader) {
        throw new Error('No reader available');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'text' && data.delta) {
                fullText += data.delta;
                onChunk(data.delta);
              } else if (data.type === 'done') {
                if (onComplete) onComplete(fullText);
                return;
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (e) {
              // Ignore JSON parse errors
            }
          }
        }
      }
    } catch (error) {
      if (onError) {
        onError(error as Error);
      } else {
        throw error;
      }
    }
  },

  analyzeImage: async (data: ImageAnalyzeRequest) => {
    const response = await api.post('/ai/image/analyze', data);
    return response.data;
  },

  generateImage: async (data: ImageGenerateRequest) => {
    const response = await api.post('/ai/image/generate', data);
    return response.data;
  },

  textToSpeech: async (data: TextToSpeechRequest) => {
    const response = await api.post('/ai/audio/text-to-speech', data, {
      responseType: 'blob',
    });
    return response.data;
  },

  speechToText: async (audioFile: File) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    const response = await api.post('/ai/audio/speech-to-text', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
