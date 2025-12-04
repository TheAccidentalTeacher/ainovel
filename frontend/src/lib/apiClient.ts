import axios, { type AxiosInstance } from 'axios';
import type { Character, Setting, StoryBible, AIConfig } from '../types';

// API Base URL Configuration
// Production: Uses Railway backend URL from .env.production
// Development: Uses localhost or Vite proxy
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api');

class APIClient {
  private client: AxiosInstance;

  constructor() {
    console.log('[APIClient] Initializing with baseURL:', API_BASE_URL);
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 600000, // 10 minutes for AI operations (large outlines with 40+ chapters can take 5+ minutes)
    });

    // Request interceptor for debugging
    this.client.interceptors.request.use(
      (config) => {
        console.log('[APIClient] Request:', config.method?.toUpperCase(), config.url, config.data);
        return config;
      },
      (error) => {
        console.error('[APIClient] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for debugging
    this.client.interceptors.response.use(
      (response) => {
        console.log('[APIClient] Response:', response.status, response.config.url, response.data);
        return response;
      },
      (error) => {
        console.error('[APIClient] Response error:', {
          message: error.message,
          code: error.code,
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          fullURL: error.config?.baseURL + error.config?.url,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers
        });
        console.error('[APIClient] Full error object:', error);
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
}

const apiClient = new APIClient();
export default apiClient;
