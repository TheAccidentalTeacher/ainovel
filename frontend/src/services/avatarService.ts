/**
 * Avatar API Service
 * 
 * Handles all avatar-related API calls: list avatars, chat with avatars, Creative Board consultations.
 */

import axios from 'axios';
import { debug } from '../lib/debug';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api');
const API_BASE = `${API_BASE_URL}/avatars`;

debug.info('Avatar Service', 'Configuration', {
  API_BASE_URL,
  API_BASE,
  PROD: import.meta.env.PROD
});

export interface Avatar {
  avatar_id: string;
  name: string;
  short_name: string;
  role: string;
  personality_description: string;
  emoji: string;
  expertise: string[];
  creative_board_style: string;
}

export interface AvatarChatRequest {
  avatar_id: string;
  message: string;
  project_id?: string;
  context?: Record<string, any>;
  conversation_history?: Array<{ role: string; content: string }>;
}

export interface AvatarChatResponse {
  avatar_id: string;
  avatar_name: string;
  response: string;
  timestamp: string;
  project_id?: string;
}

export interface CreativeBoardRequest {
  consultation_topic: string;
  project_id?: string;
  context: Record<string, any>;
  participating_avatars?: string[];
  rounds?: number;
}

export interface CreativeBoardContribution {
  avatar_id: string;
  avatar_name: string;
  vote: 'support' | 'oppose' | 'abstain';
  argument: string;
}

export interface CreativeBoardResponse {
  consultation_id: string;
  consultation_topic: string;
  participants: string[];
  contributions: CreativeBoardContribution[];
  vote_tally: {
    support: number;
    oppose: number;
    abstain: number;
    winner: string;
  };
  synthesis: string;
  research_citations: Array<{
    source: string;
    line_number: number;
    content: string;
  }>;
  timestamp: string;
}

// Create axios instance for avatars
const avatarAxios = axios.create();

avatarAxios.interceptors.request.use(
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

avatarAxios.interceptors.response.use(
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

export const avatarApi = {
  /**
   * List all available avatars
   */
  async listAvatars(): Promise<{ avatars: Avatar[]; count: number }> {
    debug.hook('avatarApi', 'listAvatars');
    const response = await avatarAxios.get(`${API_BASE}/list`);
    return response.data;
  },

  /**
   * Chat with a specific avatar
   */
  async chatWithAvatar(request: AvatarChatRequest): Promise<AvatarChatResponse> {
    debug.hook('avatarApi', 'chatWithAvatar', { avatar: request.avatar_id, messageLength: request.message.length });
    const response = await avatarAxios.post(`${API_BASE}/chat`, request);
    return response.data;
  },

  /**
   * Start a Creative Board consultation with multiple avatars
   */
  async startCreativeBoardConsultation(request: CreativeBoardRequest): Promise<CreativeBoardResponse> {
    debug.hook('avatarApi', 'startCreativeBoardConsultation', { topic: request.consultation_topic, avatars: request.participating_avatars?.length });
    const response = await avatarAxios.post(`${API_BASE}/creative-board`, request);
    return response.data;
  },

  /**
   * Get Creative Board consultation history for a project
   */
  async getProjectCreativeBoardSessions(projectId: string, limit = 10): Promise<{ project_id: string; consultations: CreativeBoardResponse[]; count: number }> {
    debug.hook('avatarApi', 'getProjectCreativeBoardSessions', { projectId, limit });
    const response = await avatarAxios.get(`${API_BASE}/creative-board-sessions/${projectId}`, { params: { limit } });
    return response.data;
  },

  /**
   * Get avatar brain (knowledge base) summary
   */
  async getAvatarBrain(avatarId: string): Promise<Record<string, any>> {
    debug.hook('avatarApi', 'getAvatarBrain', { avatarId });
    const response = await avatarAxios.get(`${API_BASE}/brain/${avatarId}`);
    return response.data;
  },

  /**
   * Reset avatar brain (knowledge base)
   */
  async resetAvatarBrain(avatarId: string, categories?: string[]): Promise<{ status: string; message: string; avatar_id: string }> {
    debug.hook('avatarApi', 'resetAvatarBrain', { avatarId, categories });
    const response = await avatarAxios.post(`${API_BASE}/brain/reset`, { avatar_id: avatarId, categories });
    return response.data;
  },

  /**
   * Health check for avatar system
   */
  async health(): Promise<{ status: string; avatars_loaded: number; research_doc_loaded: boolean; timestamp: string }> {
    debug.hook('avatarApi', 'health');
    const response = await avatarAxios.get(`${API_BASE}/health`);
    return response.data;
  },
};
