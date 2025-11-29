/**
 * Chat API Service
 * 
 * Handles all chat-related API calls: conversations, messages, streaming.
 */

import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/chat';

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

export const chatApi = {
  /**
   * Create a new conversation
   */
  async createConversation(request: CreateConversationRequest): Promise<ConversationResponse> {
    const response = await axios.post(`${API_BASE}/conversations`, request);
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
    const params: any = { user_id: userId, limit, offset };
    if (projectId) params.project_id = projectId;
    
    const response = await axios.get(`${API_BASE}/conversations`, { params });
    return response.data;
  },

  /**
   * Get a conversation with full message history
   */
  async getConversation(conversationId: string): Promise<ConversationResponse> {
    const response = await axios.get(`${API_BASE}/conversations/${conversationId}`);
    return response.data;
  },

  /**
   * Rename a conversation
   */
  async renameConversation(
    conversationId: string,
    request: RenameConversationRequest
  ): Promise<ConversationResponse> {
    const response = await axios.patch(`${API_BASE}/conversations/${conversationId}`, request);
    return response.data;
  },

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    await axios.delete(`${API_BASE}/conversations/${conversationId}`);
  },

  /**
   * Send message (streaming handled separately via fetch in component)
   * This method is for non-streaming context if needed
   */
  async sendMessage(conversationId: string, request: SendMessageRequest): Promise<void> {
    // Note: Actual streaming implementation is in ChatWidget component using fetch API
    // This method exists for potential non-streaming use cases
    await axios.post(`${API_BASE}/conversations/${conversationId}/messages`, request);
  },

  /**
   * Get available AI models
   */
  async getAvailableModels(): Promise<{ models: Array<{ id: string; name: string; provider: string; max_tokens: number }> }> {
    const response = await axios.get(`${API_BASE}/models`);
    return response.data;
  },
};
