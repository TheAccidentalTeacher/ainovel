/**
 * Chat API Service
 * 
 * Handles all chat-related API calls: conversations, messages, streaming.
 */

import axios from 'axios';
import { debug } from '../lib/debug';

// In production, API is served from same origin at /api
// In development, use VITE_API_URL or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api');
const API_BASE = `${API_BASE_URL}/chat`;

// Log chat service configuration
debug.info('Chat Service', 'Configuration', {
  API_BASE_URL,
  API_BASE,
  PROD: import.meta.env.PROD
});

export interface Conversation {
  id: string;
  user_id: string;
  project_id?: string;
  bot_id?: string;
  title: string;
  message_count: number;
  total_tokens: number;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  token_count: number;
  model?: string;
}

export interface ConversationResponse {
  conversation: Conversation;
  messages: Message[];
}

export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
}

export interface CreateConversationRequest {
  user_id: string;
  project_id?: string;
  bot_id?: string;
  title?: string;
}

export interface SendMessageRequest {
  content: string;
}

export interface RenameConversationRequest {
  title: string;
}

// Create axios instance for chat with interceptors
const chatAxios = axios.create();

chatAxios.interceptors.request.use(
  (config) => {
    const startTime = Date.now();
    (config as any).__startTime = startTime;
    debug.apiRequest(config.method || 'GET', config.url || '', config.data, config);
    return config;
  },
  (error) => {
    debug.apiError('REQUEST', 'Failed', error);
    return Promise.reject(error);
  }
);

chatAxios.interceptors.response.use(
  (response) => {
    const duration = (response.config as any).__startTime 
      ? Date.now() - (response.config as any).__startTime 
      : undefined;
    debug.apiResponse(
      response.config.method || 'GET',
      response.config.url || '',
      response.status,
      response.data,
      duration
    );
    return response;
  },
  (error) => {
    debug.apiError(error.config?.method || 'UNKNOWN', error.config?.url || 'UNKNOWN', error);
    return Promise.reject(error);
  }
);

export const chatApi = {
  /**
   * Create a new conversation
   */
  async createConversation(request: CreateConversationRequest): Promise<ConversationResponse> {
    debug.hook('chatApi', 'createConversation', request);
    const response = await chatAxios.post(`${API_BASE}/conversations`, request);
    return response.data;
  },

  /**
   * List conversations for a user
   */
  async listConversations(
    userId: string,
    projectId?: string,
    limit = 50,
    offset = 0
  ): Promise<ConversationListResponse> {
    debug.hook('chatApi', 'listConversations', { userId, projectId, limit, offset });
    const params: Record<string, string | number> = { user_id: userId, limit, offset };
    if (projectId) params.project_id = projectId;
    
    const response = await chatAxios.get(`${API_BASE}/conversations`, { params });
    return response.data;
  },

  /**
   * Get a conversation with full message history
   */
  async getConversation(conversationId: string): Promise<ConversationResponse> {
    debug.hook('chatApi', 'getConversation', { conversationId });
    const response = await chatAxios.get(`${API_BASE}/conversations/${conversationId}`);
    return response.data;
  },

  /**
   * Rename a conversation
   */
  async renameConversation(
    conversationId: string,
    request: RenameConversationRequest
  ): Promise<ConversationResponse> {
    debug.hook('chatApi', 'renameConversation', { conversationId, title: request.title });
    const response = await chatAxios.patch(`${API_BASE}/conversations/${conversationId}`, request);
    return response.data;
  },

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    debug.hook('chatApi', 'deleteConversation', { conversationId });
    await chatAxios.delete(`${API_BASE}/conversations/${conversationId}`);
  },

  /**
   * Send message (streaming handled separately via fetch in component)
   * This method is for non-streaming context if needed
   */
  async sendMessage(conversationId: string, request: SendMessageRequest): Promise<void> {
    debug.hook('chatApi', 'sendMessage', { conversationId, contentLength: request.content.length });
    // Note: Actual streaming implementation is in ChatWidget component using fetch API
    // This method exists for potential non-streaming use cases
    await chatAxios.post(`${API_BASE}/conversations/${conversationId}/messages`, request);
  },

  /**
   * Get available AI models
   */
  async getAvailableModels(): Promise<{ models: Array<{ id: string; name: string; provider: string; max_tokens: number }> }> {
    debug.hook('chatApi', 'getAvailableModels');
    const response = await chatAxios.get(`${API_BASE}/models`);
    return response.data;
  },
};
