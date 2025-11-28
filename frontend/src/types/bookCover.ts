// Book Cover Types

export interface ColorScheme {
  primary: string
  accent: string
  background?: string
  text?: string
  mood: string
}

export interface TypographyRecommendation {
  title_font: string
  author_font: string
  style: string
  hierarchy: string
}

export interface StoryAnalysis {
  project_id: string
  genre: string
  subgenre?: string
  tone: string
  themes: string[]
  setting?: string
  key_elements: string[]
  mood: string
}

export interface DesignBrief {
  id: string
  project_id: string
  genre: string
  subgenre?: string
  tone: string
  visual_approach: string
  color_scheme: ColorScheme
  imagery_style: string
  composition: string
  typography_recommendations: TypographyRecommendation
  reference_covers: string[]
  dalle_prompt: string
  created_at: string
}

export interface CoverIteration {
  id: string
  book_cover_id: string
  image_url: string
  prompt_used: string
  variation_number: number
  metadata?: {
    model?: string
    size?: string
    quality?: string
    revised_prompt?: string
  }
  user_rating?: number
  notes?: string
  created_at: string
}

export interface BookCover {
  id: string
  project_id: string
  design_brief_id?: string
  base_image_url?: string
  final_image_url?: string
  mockup_url?: string
  selected_font?: string
  genre?: string
  status: string
  version: number
  created_at: string
  updated_at: string
  iterations: CoverIteration[]
}

export interface ImageGenerationRequest {
  design_brief_id: string
  custom_prompt?: string
  num_variations?: number
  style?: 'vivid' | 'natural'
  quality?: 'standard' | 'hd'
}

export interface ImageGenerationResponse {
  book_cover_id: string
  iterations: CoverIteration[]
  status: string
  message?: string
}

export interface BookCoverListResponse {
  project_id: string
  covers: BookCover[]
  total: number
}

export interface BookCoverDetailResponse {
  cover: BookCover
  design_brief?: DesignBrief
  iterations: CoverIteration[]
}
