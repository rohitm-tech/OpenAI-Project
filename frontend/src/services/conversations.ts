import api from './api';

export interface Message {
  role: 'user' | 'assistant' | 'developer';
  content: string;
  type: 'text' | 'image' | 'audio' | 'generated-image';
  metadata?: {
    imageUrl?: string;
    audioUrl?: string;
    fileId?: string;
  };
  timestamp?: Date;
}

export interface Conversation {
  _id: string;
  userId: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: string;
  updatedAt: string;
}

export const conversationService = {
  create: async (title?: string, model?: string) => {
    const response = await api.post<{ success: boolean; data: Conversation }>(
      '/conversations',
      { title, model }
    );
    return response.data;
  },

  getAll: async () => {
    const response = await api.get<{
      success: boolean;
      data: Conversation[];
    }>('/conversations');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: Conversation }>(
      `/conversations/${id}`
    );
    return response.data;
  },

  update: async (id: string, title: string) => {
    const response = await api.patch<{ success: boolean; data: Conversation }>(
      `/conversations/${id}`,
      { title }
    );
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<{ success: boolean; message: string }>(
      `/conversations/${id}`
    );
    return response.data;
  },

  addMessage: async (id: string, message: Omit<Message, 'timestamp'>) => {
    const response = await api.post<{ success: boolean; data: Conversation }>(
      `/conversations/${id}/messages`,
      message
    );
    return response.data;
  },

  addMessages: async (id: string, messages: Omit<Message, 'timestamp'>[]) => {
    const response = await api.post<{ success: boolean; data: Conversation }>(
      `/conversations/${id}/messages/batch`,
      { messages }
    );
    return response.data;
  },
};
