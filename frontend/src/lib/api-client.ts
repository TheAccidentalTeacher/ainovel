import axios, { type AxiosInstance } from 'axios';
import type { Character, Setting, StoryBible, AIConfig } from '../types';
import { debug } from './debug';

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  max_tokens: number;
  description?: string;
}

// In production, API is served from same origin at /api
// In development, VITE_API_URL can override (or use Vite proxy)
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api');

class APIClient {
  private client: AxiosInstance;

  constructor() {
    debug.info('APIClient', 'Initializing with baseURL', API_BASE_URL);
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 600000, // 10 minutes for AI operations (large outlines with 40+ chapters can take 5+ minutes)
    });

    // Request interceptor with enhanced debugging
    this.client.interceptors.request.use(
      (config) => {
        const startTime = Date.now();
        (config as any).__startTime = startTime;
        
        debug.apiRequest(
          config.method || 'GET',
          config.url || '',
          config.data,
          config
        );
        return config;
      },
      (error) => {
        debug.apiError('REQUEST', 'Failed to send', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor with enhanced debugging
    this.client.interceptors.response.use(
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
        debug.apiError(
          error.config?.method || 'UNKNOWN',
          error.config?.url || 'UNKNOWN',
          error
        );
        return Promise.reject(error);
      }
    );
  }

  // Health check
  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }

  // Genres
  async getGenres() {
    const response = await this.client.get('/genres');
    return response.data;
  }

  // Projects
  async createProject(data: {
    title?: string;
    genre: string;
    subgenre?: string;
    target_word_count: number;
    target_chapter_count: number;
    premise: string;
  }) {
    const response = await this.client.post('/projects', data);
    return response.data;
  }

  async listProjects(page = 1, pageSize = 20, statusFilter?: string) {
    const params: any = { page, page_size: pageSize };
    if (statusFilter) params.status_filter = statusFilter;
    const response = await this.client.get('/projects', { params });
    return response.data;
  }

  async getProject(projectId: string) {
    const response = await this.client.get(`/projects/${projectId}`);
    return response.data;
  }

  async deleteProject(projectId: string) {
    await this.client.delete(`/projects/${projectId}`);
  }

  // Outlines
  async generateOutline(projectId: string, aiConfig?: any) {
    const response = await this.client.post(`/projects/${projectId}/generate-outline`, {
      project_id: projectId,
      ai_config: aiConfig,
    });
    return response.data;
  }

  async deleteOutline(projectId: string, outlineId: string) {
    await this.client.delete(`/projects/${projectId}/outlines/${outlineId}`);
  }

  async updateOutline(projectId: string, outlineId: string, chapters: any[]) {
    const response = await this.client.put(`/projects/${projectId}/outlines/${outlineId}`, {
      chapters,
    });
    return response.data;
  }

  // Generation
  async startGeneration(projectId: string, outlineId: string, aiConfig?: any) {
    const response = await this.client.post(`/projects/${projectId}/generate`, {
      project_id: projectId,
      outline_id: outlineId,
      ai_config: aiConfig,
    });
    return response.data;
  }

  async generateChapter(projectId: string, chapterIndex: number) {
    const response = await this.client.post(`/projects/${projectId}/chapters/${chapterIndex}/generate`);
    return response.data;
  }

  async getChapters(projectId: string) {
    const response = await this.client.get(`/projects/${projectId}/chapters`);
    return response.data;
  }

  async getChapter(projectId: string, chapterIndex: number) {
    const response = await this.client.get(`/projects/${projectId}/chapters/${chapterIndex}`);
    return response.data;
  }

  async deleteAllChapters(projectId: string) {
    await this.client.delete(`/projects/${projectId}/chapters`);
  }

  async deleteChapter(projectId: string, chapterIndex: number) {
    await this.client.delete(`/projects/${projectId}/chapters/${chapterIndex}`);
  }

  // Story Bible
  async generateStoryBible(projectId: string, aiConfig?: Partial<AIConfig>) {
    const response = await this.client.post(`/projects/${projectId}/generate-story-bible`, 
      aiConfig || {}
    );
    return response.data as { story_bible: StoryBible };
  }

  async getStoryBible(projectId: string) {
    const response = await this.client.get(`/projects/${projectId}/story-bible`);
    return response.data as { story_bible: StoryBible };
  }

  async updateStoryBible(projectId: string, data: {
    characters: Character[];
    settings: Setting[];
    themes: string[];
    humor_style: string;
    tone_notes: string;
    genre_guidelines: string;
    main_plot_arc: string;
    subplots: string[];
    key_milestones: string[];
  }) {
    const response = await this.client.put(`/projects/${projectId}/story-bible`, data);
    return response.data as { story_bible: StoryBible };
  }

  async deleteStoryBible(projectId: string) {
    await this.client.delete(`/projects/${projectId}/story-bible`);
  }

  // === Context Management ===
  
  async getContexts() {
    const response = await this.client.get('/contexts');
    return response.data;
  }

  async createContext(data: { name: string; icon?: string; color?: string; description?: string }) {
    const response = await this.client.post('/contexts', data);
    return response.data;
  }

  async updateContext(contextId: string, data: { name?: string; icon?: string; color?: string; description?: string }) {
    const response = await this.client.patch(`/contexts/${contextId}`, data);
    return response.data;
  }

  async toggleContext(contextId: string) {
    const response = await this.client.post(`/contexts/${contextId}/toggle`);
    return response.data;
  }

  async deleteContext(contextId: string) {
    await this.client.delete(`/contexts/${contextId}`);
  }
}

const apiClient = new APIClient();
export default apiClient;
