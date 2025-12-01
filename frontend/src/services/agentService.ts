/**
 * Agent API Service
 * 
 * Handles all agent/bot-related API calls: list agents, chat with agents, debates.
 */

import axios from 'axios';
import { debug } from '../lib/debug';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api');
const API_BASE = `${API_BASE_URL}/agents`;

debug.info('Agent Service', 'Configuration', {
  API_BASE_URL,
  API_BASE,
  PROD: import.meta.env.PROD
});

export interface Agent {
  agent_id: string;
  name: string;
  short_name: string;
  role: string;
  personality_description: string;
  expertise: string[];
  debate_style: string;
}

export interface AgentChatRequest {
  agent_id: string;
  message: string;
  project_id?: string;
  context?: Record<string, any>;
  conversation_history?: Array<{ role: string; content: string }>;
}

export interface AgentChatResponse {
  agent_id: string;
  agent_name: string;
  response: string;
  timestamp: string;
  project_id?: string;
}

export interface DebateRequest {
  debate_topic: string;
  project_id?: string;
  context: Record<string, any>;
  participating_agents?: string[];
  rounds?: number;
}

export interface DebateArgument {
  agent_id: string;
  agent_name: string;
  vote: 'support' | 'oppose' | 'abstain';
  argument: string;
}

export interface DebateResponse {
  debate_id: string;
  debate_topic: string;
  participants: string[];
  arguments: DebateArgument[];
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

// Create axios instance for agents
const agentAxios = axios.create();

agentAxios.interceptors.request.use(
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

agentAxios.interceptors.response.use(
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

export const agentApi = {
  /**
   * List all available agents
   */
  async listAgents(): Promise<{ agents: Agent[]; count: number }> {
    debug.hook('agentApi', 'listAgents');
    const response = await agentAxios.get(`${API_BASE}/list`);
    return response.data;
  },

  /**
   * Chat with a specific agent
   */
  async chatWithAgent(request: AgentChatRequest): Promise<AgentChatResponse> {
    debug.hook('agentApi', 'chatWithAgent', { agent: request.agent_id, messageLength: request.message.length });
    const response = await agentAxios.post(`${API_BASE}/chat`, request);
    return response.data;
  },

  /**
   * Start a debate between multiple agents
   */
  async startDebate(request: DebateRequest): Promise<DebateResponse> {
    debug.hook('agentApi', 'startDebate', { topic: request.debate_topic, agents: request.participating_agents?.length });
    const response = await agentAxios.post(`${API_BASE}/debate`, request);
    return response.data;
  },

  /**
   * Get debate history for a project
   */
  async getProjectDebates(projectId: string, limit = 10): Promise<{ project_id: string; debates: DebateResponse[]; count: number }> {
    debug.hook('agentApi', 'getProjectDebates', { projectId, limit });
    const response = await agentAxios.get(`${API_BASE}/debates/${projectId}`, { params: { limit } });
    return response.data;
  },

  /**
   * Get agent memory summary
   */
  async getAgentMemory(agentId: string): Promise<Record<string, any>> {
    debug.hook('agentApi', 'getAgentMemory', { agentId });
    const response = await agentAxios.get(`${API_BASE}/memory/${agentId}`);
    return response.data;
  },

  /**
   * Reset agent memory
   */
  async resetAgentMemory(agentId: string, categories?: string[]): Promise<{ status: string; message: string; agent_id: string }> {
    debug.hook('agentApi', 'resetAgentMemory', { agentId, categories });
    const response = await agentAxios.post(`${API_BASE}/memory/reset`, { agent_id: agentId, categories });
    return response.data;
  },

  /**
   * Health check for agent system
   */
  async health(): Promise<{ status: string; agents_loaded: number; research_doc_loaded: boolean; timestamp: string }> {
    debug.hook('agentApi', 'health');
    const response = await agentAxios.get(`${API_BASE}/health`);
    return response.data;
  },
};
