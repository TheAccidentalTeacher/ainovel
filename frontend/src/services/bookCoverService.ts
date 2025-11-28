import axios from 'axios'
import type {
  StoryAnalysis,
  DesignBrief,
  ImageGenerationRequest,
  ImageGenerationResponse,
  BookCover,
  BookCoverListResponse,
  BookCoverDetailResponse
} from '../types/bookCover'

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

class BookCoverService {
  private baseUrl = `${API_BASE}/book-covers`

  async checkHealth(): Promise<{ status: string; feature: string; version: string }> {
    const response = await axios.get(`${this.baseUrl}/health`)
    return response.data
  }

  async analyzeStory(projectId: string): Promise<StoryAnalysis> {
    const response = await axios.post(`${this.baseUrl}/analyze-story`, {
      project_id: projectId
    })
    return response.data
  }

  async generateBrief(
    projectId: string,
    storyAnalysis?: StoryAnalysis
  ): Promise<DesignBrief> {
    const response = await axios.post(`${this.baseUrl}/generate-brief`, {
      project_id: projectId,
      story_analysis: storyAnalysis
    })
    return response.data
  }

  async generateImage(
    request: ImageGenerationRequest
  ): Promise<ImageGenerationResponse> {
    const response = await axios.post(`${this.baseUrl}/generate-image`, request)
    return response.data
  }

  // Alias for generateImage that handles the brief ID extraction
  async generateImages(
    designBriefId: string,
    options?: {
      num_variations?: number
      style?: 'vivid' | 'natural'
      quality?: 'standard' | 'hd'
    }
  ): Promise<ImageGenerationResponse> {
    const response = await axios.post(`${this.baseUrl}/generate-image`, {
      design_brief_id: designBriefId,
      num_variations: options?.num_variations || 3,
      style: options?.style || 'vivid',
      quality: options?.quality || 'standard'
    })
    return response.data
  }

  async listProjectCovers(projectId: string): Promise<BookCoverListResponse> {
    const response = await axios.get(`${this.baseUrl}/project/${projectId}`)
    return response.data
  }

  async getCoverDetails(coverId: string): Promise<BookCoverDetailResponse> {
    const response = await axios.get(`${this.baseUrl}/${coverId}`)
    return response.data
  }

  async deleteCover(coverId: string): Promise<{ success: boolean; message: string }> {
    const response = await axios.delete(`${this.baseUrl}/${coverId}`)
    return response.data
  }

  async addTypography(
    bookCoverId: string,
    titleText: string,
    authorText: string,
    options?: {
      titleFont?: string
      authorFont?: string
      titleColor?: string
      authorColor?: string
      autoPosition?: boolean
    }
  ): Promise<{ book_cover_id: string; final_image_url: string; status: string }> {
    const response = await axios.post(`${this.baseUrl}/add-typography`, {
      book_cover_id: bookCoverId,
      title_text: titleText,
      author_text: authorText,
      ...options
    })
    return response.data
  }

  async exportCover(
    bookCoverId: string,
    format: 'ebook' | 'print_front' | 'social_square' | 'social_story' | 'thumbnail',
    options?: {
      customWidth?: number
      customHeight?: number
      dpi?: number
    }
  ): Promise<{ file_url: string; file_size_bytes: number; dimensions: { width: number; height: number } }> {
    const response = await axios.post(`${this.baseUrl}/export`, {
      book_cover_id: bookCoverId,
      format,
      ...options
    })
    return response.data
  }

  async analyzeManuscript(manuscriptText: string): Promise<{
    genre: string
    subgenre?: string
    tone: string
    themes: string[]
    setting?: string
    key_elements: string[]
    mood: string
  }> {
    const response = await axios.post(`${this.baseUrl}/analyze-manuscript`, {
      manuscript_text: manuscriptText
    })
    return response.data
  }

  async autoPopulate(
    projectId: string,
    options?: {
      genreOverride?: string
      useExistingAnalysis?: boolean
    }
  ): Promise<{
    project_id: string
    title_text: string
    author_text: string
    title_alternatives: string[]
    author_alternatives: string[]
    genre_detected: string
    subgenre_detected?: string
    mood_keywords: string[]
    color_recommendations: {
      primary: string
      accent: string
      background: string
      rationale: string
    }
    typography_suggestions: {
      title_style: string
      author_style: string
      rationale: string
    }
    visual_approach: string
    key_visual_elements: string[]
    target_market: string
    comparable_titles: string[]
    marketing_angle: string
    technical_presets: {
      image_style: string
      image_quality: string
      color_scheme: {
        primary: string
        accent: string
        background: string
      }
      typography: {
        title_font: string
        author_font: string
        title_weight: string
      }
      visual_keywords: string[]
    }
    source: string
  }> {
    console.log('🔧 [SERVICE] autoPopulate() called')
    console.log('🔧 [SERVICE] API Base URL:', API_BASE)
    console.log('🔧 [SERVICE] Full endpoint:', `${this.baseUrl}/auto-populate/${projectId}`)
    console.log('🔧 [SERVICE] Request body:', {
      genre_override: options?.genreOverride,
      use_existing_analysis: options?.useExistingAnalysis ?? true
    })
    
    try {
      console.log('🌐 [SERVICE] Sending POST request to backend...')
      const response = await axios.post(`${this.baseUrl}/auto-populate/${projectId}`, {
        genre_override: options?.genreOverride,
        use_existing_analysis: options?.useExistingAnalysis ?? true
      })
      
      console.log('✅ [SERVICE] Response received!')
      console.log('📊 [SERVICE] Status code:', response.status)
      console.log('📊 [SERVICE] Status text:', response.statusText)
      console.log('📦 [SERVICE] Response headers:', response.headers)
      console.log('📦 [SERVICE] Response data:', response.data)
      
      return response.data
    } catch (error) {
      console.error('❌ [SERVICE] Error in autoPopulate()')
      if (axios.isAxiosError(error)) {
        console.error('🚨 [SERVICE] Axios error details:', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseData: error.response?.data,
          requestUrl: error.config?.url,
          requestMethod: error.config?.method,
          requestHeaders: error.config?.headers,
          requestData: error.config?.data
        })
      } else {
        console.error('🚨 [SERVICE] Non-axios error:', error)
      }
      throw error
    }
  }
}

export const bookCoverService = new BookCoverService()
