export interface Genre {
  id: string;
  name: string;
  subgenres: string[];
  description?: string;
  order: number;
}

export interface AIConfig {
  provider: 'openai' | 'anthropic';
  model_name: string;
  temperature: number;
  max_tokens: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop_sequences?: string[];
  outline_template: string;
  chapter_template: string;
  summary_template: string;
  summarization_threshold: number;
  context_window_chapters: number;
}

export interface Character {
  id?: string;
  name: string;
  aliases?: string[];
  age?: string;
  physical_description: string;
  personality: string;
  backstory: string;
  goals: string;
  character_arc: string;
  relationships: Record<string, string>;
  quirks: string;
  role: string;
}

export interface Setting {
  id?: string;
  name: string;
  description: string;
  atmosphere: string;
  significance: string;
  special_features: string;
}

export interface StoryBible {
  id?: string;
  project_id: string;
  characters: Character[];
  settings: Setting[];
  themes: string[];
  humor_style: string;
  tone_notes: string;
  genre_guidelines: string;
  main_plot_arc: string;
  subplots: string[];
  key_milestones: string[];
  version?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ChapterOutline {
  chapter_index: number;
  title: string;
  // Structured context (~200 words)
  opening_scene: string;
  characters_present: string[];
  locations: string[];
  plot_events: string[];
  character_development: string;
  subplots_advanced: string;
  closing_scene: string;
  tone_notes: string[];
  // Prose summary (~300 words)
  summary_prose: string;
  target_word_count: number;
  notes?: string;
}

export interface Outline {
  id: string;
  project_id: string;
  chapters: ChapterOutline[];
  total_target_words: number;
  ai_config: AIConfig;
  generation_metadata: Record<string, any>;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface Premise {
  id: string;
  project_id: string;
  genre: string;
  subgenre?: string;
  target_word_count: number;
  target_chapter_count: number;
  content: string;
  word_count: number;
  created_at: string;
  updated_at: string;
}

export type ProjectStatus = 'draft' | 'outline_ready' | 'generating' | 'paused' | 'completed' | 'error';

export interface Project {
  id: string;
  user_id?: string;
  title: string;
  status: ProjectStatus;
  premise_id?: string;
  story_bible_id?: string;
  outline_id?: string;
  genre?: string;
  subgenre?: string;
  total_chapters: number;
  completed_chapters: number;
  total_word_count: number;
  ai_config: AIConfig;
  created_at: string;
  updated_at: string;
  generation_started_at?: string;
  generation_completed_at?: string;
}

export interface ProjectResponse {
  project: Project;
  premise?: Premise;
  story_bible?: StoryBible;
  outline?: Outline;
}

export type ChapterStatus = 'pending' | 'generating' | 'completed' | 'error';

export interface Chapter {
  id: string;
  project_id: string;
  chapter_index: number;
  title: string;
  content: string;
  word_count: number;
  status: ChapterStatus;
  error_message?: string;
  ai_config: AIConfig;
  generation_metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}
