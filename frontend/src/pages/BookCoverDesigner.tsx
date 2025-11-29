import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Image as ImageIcon, 
  Type, 
  Download,
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react'
import { bookCoverService } from '../services/bookCoverService'
import type { 
  StoryAnalysis, 
  DesignBrief, 
  CoverIteration,
  BookCover
} from '../types/bookCover'

type Step = 'analysis' | 'brief' | 'image' | 'typography' | 'export'

interface StepConfig {
  id: Step
  title: string
  description: string
  icon: React.ReactNode
}

const STEPS: StepConfig[] = [
  {
    id: 'analysis',
    title: 'Story Analysis',
    description: 'Extract design requirements from your story',
    icon: <Sparkles className="w-5 h-5" />
  },
  {
    id: 'brief',
    title: 'Design Brief',
    description: 'AI-generated professional design specifications',
    icon: <Sparkles className="w-5 h-5" />
  },
  {
    id: 'image',
    title: 'Generate Images',
    description: 'Create cover variations with DALL-E 3',
    icon: <ImageIcon className="w-5 h-5" />
  },
  {
    id: 'typography',
    title: 'Add Typography',
    description: 'Overlay title and author text',
    icon: <Type className="w-5 h-5" />
  },
  {
    id: 'export',
    title: 'Export',
    description: 'Download print-ready and ebook formats',
    icon: <Download className="w-5 h-5" />
  }
]

export default function BookCoverDesigner() {
  const { id: projectId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [currentStep, setCurrentStep] = useState<Step>('analysis')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Data from each step
  const [analysis, setAnalysis] = useState<StoryAnalysis | null>(null)
  const [designBrief, setDesignBrief] = useState<DesignBrief | null>(null)
  const [coverIterations, setCoverIterations] = useState<CoverIteration[]>([])
  const [selectedIteration, setSelectedIteration] = useState<CoverIteration | null>(null)
  const [bookCover, setBookCover] = useState<BookCover | null>(null)
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null)
  const [titleText, setTitleText] = useState('')
  const [authorText, setAuthorText] = useState('')
  const [exportedFiles, setExportedFiles] = useState<Record<string, string>>({})
  const [autoPopulating, setAutoPopulating] = useState(false)
  const [autoPopulateData, setAutoPopulateData] = useState<any>(null)

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep)
  const canGoNext = currentStepIndex < STEPS.length - 1
  const canGoPrevious = currentStepIndex > 0

  // Component mount logging
  useEffect(() => {
    console.log('═══════════════════════════════════════════════════════')
    console.log('🎨 BOOK COVER DESIGNER - Component Mounted')
    console.log('═══════════════════════════════════════════════════════')
    console.log('📋 Environment:', {
      apiUrl: import.meta.env.VITE_API_URL || '',
      mode: import.meta.env.MODE,
      dev: import.meta.env.DEV,
      prod: import.meta.env.PROD
    })
    console.log('📌 Project ID:', projectId)
    console.log('📊 Initial State:', {
      currentStep,
      hasAnalysis: !!analysis,
      hasDesignBrief: !!designBrief,
      coverIterations: coverIterations.length,
      loading,
      error
    })
    console.log('═══════════════════════════════════════════════════════')
  }, [])

  // Auto-start analysis when component mounts
  useEffect(() => {
    console.log('🔄 [EFFECT] Project ID changed or component ready')
    console.log('🔄 [EFFECT] Checking if auto-analysis should start...')
    console.log('🔄 [EFFECT] Conditions:', {
      hasProjectId: !!projectId,
      hasAnalysis: !!analysis,
      isLoading: loading
    })
    
    if (projectId && !analysis && !loading) {
      console.log('✅ [EFFECT] Conditions met - starting auto-analysis')
      handleAnalyzeStory()
    } else {
      console.log('⏸️ [EFFECT] Conditions not met - skipping auto-analysis')
    }
  }, [projectId])

  const handleAnalyzeStory = async () => {
    console.log('📖 [ANALYZE] Starting story analysis')
    console.log('📖 [ANALYZE] Project ID:', projectId)
    
    if (!projectId) {
      console.error('❌ [ANALYZE] No project ID - aborting')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      console.log('🌐 [ANALYZE] Calling analyzeStory API...')
      const result = await bookCoverService.analyzeStory(projectId)
      console.log('✅ [ANALYZE] Analysis complete:', result)
      setAnalysis(result)
    } catch (err) {
      console.error('❌ [ANALYZE] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to analyze story')
    } finally {
      setLoading(false)
      console.log('🏁 [ANALYZE] Analysis flow complete')
    }
  }

  const handleAutoPopulate = async () => {
    console.log('🚀 [AUTO-POPULATE] Button clicked - Starting auto-populate flow')
    console.log('📋 [AUTO-POPULATE] Project ID:', projectId)
    console.log('📊 [AUTO-POPULATE] Existing analysis:', analysis ? 'Available' : 'Not available')
    
    if (!projectId) {
      console.error('❌ [AUTO-POPULATE] No project ID - aborting')
      return
    }
    
    console.log('⏳ [AUTO-POPULATE] Setting loading state to true')
    setAutoPopulating(true)
    setError(null)
    
    try {
      console.log('🌐 [AUTO-POPULATE] Calling bookCoverService.autoPopulate()...')
      console.log('📤 [AUTO-POPULATE] Request payload:', {
        projectId,
        options: { useExistingAnalysis: !!analysis }
      })
      
      const result = await bookCoverService.autoPopulate(projectId, {
        useExistingAnalysis: !!analysis
      })
      
      console.log('✅ [AUTO-POPULATE] API call successful!')
      console.log('📥 [AUTO-POPULATE] Response data:', result)
      console.log('📝 [AUTO-POPULATE] Generated title:', result.title_text)
      console.log('👤 [AUTO-POPULATE] Generated author:', result.author_text)
      console.log('🎭 [AUTO-POPULATE] Detected genre:', result.genre_detected)
      console.log('🎨 [AUTO-POPULATE] Color recommendations:', result.color_recommendations)
      console.log('🔤 [AUTO-POPULATE] Typography suggestions:', result.typography_suggestions)
      
      setAutoPopulateData(result)
      console.log('💾 [AUTO-POPULATE] Saved data to state')
      
      // Pre-fill title and author
      setTitleText(result.title_text)
      setAuthorText(result.author_text)
      console.log('📝 [AUTO-POPULATE] Pre-filled title and author fields')
      
      // IMPORTANT: Create properly structured StoryAnalysis from auto-populate data for generateBrief
      // Note: key_visual_elements are design elements (not story themes), so we use mood_keywords as themes
      const structuredAnalysis: StoryAnalysis = {
        project_id: projectId,
        genre: result.genre_detected || 'General Fiction',
        subgenre: result.subgenre_detected || undefined,
        tone: result.mood_keywords?.[0] || 'engaging',
        themes: result.mood_keywords || ['engaging', 'compelling'],  // Use mood_keywords as themes (story themes)
        setting: undefined,
        key_elements: result.key_visual_elements || ['text', 'color'],  // Visual elements (not story themes)
        mood: result.mood_keywords?.join(', ') || 'engaging, compelling'
      }
      setAnalysis(structuredAnalysis)
      console.log('🧠 [AUTO-POPULATE] Created structured analysis for brief generation:', structuredAnalysis)
      console.log('🔍 [AUTO-POPULATE] Analysis validation:', {
        hasProjectId: !!structuredAnalysis.project_id,
        hasGenre: !!structuredAnalysis.genre,
        hasTone: !!structuredAnalysis.tone,
        hasThemes: Array.isArray(structuredAnalysis.themes) && structuredAnalysis.themes.length > 0,
        hasKeyElements: Array.isArray(structuredAnalysis.key_elements) && structuredAnalysis.key_elements.length > 0,
        hasMood: !!structuredAnalysis.mood,
        themesContent: structuredAnalysis.themes,
        keyElementsContent: structuredAnalysis.key_elements
      })
      
      // Show success message
      const message = `Auto-populated with AI-generated suggestions!\n\nTitle: "${result.title_text}"\nAuthor: "${result.author_text}"\nGenre: ${result.genre_detected}\n\nYou can edit these or choose from alternatives.`
      alert(message)
      console.log('✨ [AUTO-POPULATE] Success message displayed to user')
    } catch (err) {
      console.error('❌ [AUTO-POPULATE] Error occurred:', err)
      console.error('❌ [AUTO-POPULATE] Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        fullError: err
      })
      setError(err instanceof Error ? err.message : 'Failed to auto-populate data')
      console.log('🚨 [AUTO-POPULATE] Error state set for UI display')
    } finally {
      console.log('🏁 [AUTO-POPULATE] Setting loading state to false')
      setAutoPopulating(false)
      console.log('✅ [AUTO-POPULATE] Auto-populate flow complete')
    }
  }

  const handleGenerateBrief = async () => {
    console.log('🔥🔥🔥 BRIEF GENERATION TRIGGERED - WHO CALLED ME?')
    console.log('🔥 Call stack:', new Error().stack)
    console.log('📝 [BRIEF] Starting design brief generation')
    console.log('📝 [BRIEF] Project ID:', projectId)
    console.log('📝 [BRIEF] Has analysis:', !!analysis)
    console.log('📝 [BRIEF] Analysis object:', analysis)
    
    if (!projectId) {
      console.error('❌ [BRIEF] No project ID - aborting')
      return
    }
    
    if (!analysis) {
      console.warn('⚠️ [BRIEF] No analysis available - will use backend analysis')
    } else {
      console.log('✅ [BRIEF] Analysis validation:', {
        hasProjectId: !!analysis.project_id,
        hasGenre: !!analysis.genre,
        hasTone: !!analysis.tone,
        hasThemes: Array.isArray(analysis.themes),
        hasKeyElements: Array.isArray(analysis.key_elements),
        hasMood: !!analysis.mood,
        projectIdMatch: analysis.project_id === projectId
      })
    }
    
    setLoading(true)
    setError(null)
    
    try {
      console.log('🌐 [BRIEF] Calling generateBrief API...')
      console.log('📤 [BRIEF] Payload:', { project_id: projectId, story_analysis: analysis })
      const result = await bookCoverService.generateBrief(projectId, analysis || undefined)
      console.log('✅ [BRIEF] Design brief generated:', result)
      setDesignBrief(result)
      // Don't auto-advance - let user review the brief
      console.log('📋 [BRIEF] Brief ready for review - user can click Next to proceed')
    } catch (err) {
      console.error('❌ [BRIEF] Error:', err)
      if (axios.isAxiosError(err)) {
        console.error('🚨 [BRIEF] Axios error details:', {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          config: err.config
        })
      }
      setError(err instanceof Error ? err.message : 'Failed to generate design brief')
    } finally {
      setLoading(false)
      console.log('🏁 [BRIEF] Brief generation flow complete')
    }
  }

  const handleGenerateImages = async (numVariations: number = 3) => {
    if (!designBrief) return
    
    setLoading(true)
    setError(null)
    
    try {
      const result = await bookCoverService.generateImage({
        design_brief_id: designBrief.id,
        num_variations: numVariations,
        style: 'vivid',
        quality: 'hd'
      })
      
      setCoverIterations(result.iterations)
      setBookCover(result as any)
      if (result.iterations.length > 0) {
        setSelectedIteration(result.iterations[0])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate images')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTypography = async () => {
    if (!bookCover || !titleText || !authorText) return
    
    setLoading(true)
    setError(null)
    
    try {
      const result = await bookCoverService.addTypography(
        bookCover.id,
        titleText,
        authorText,
        { autoPosition: true }
      )
      setFinalImageUrl(result.final_image_url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add typography')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: 'ebook' | 'print_front' | 'social_square' | 'social_story' | 'thumbnail') => {
    if (!bookCover) return
    
    setLoading(true)
    setError(null)
    
    try {
      const result = await bookCoverService.exportCover(bookCover.id, format)
      setExportedFiles(prev => ({ ...prev, [format]: result.file_url }))
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to export ${format}`)
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    console.log('🎯🎯🎯 NEW CODE RUNNING - handleNext called')
    console.log('🎯 Current step:', currentStep)
    console.log('🎯 Next step will be:', STEPS[currentStepIndex + 1]?.id)
    console.log('🎯 NO AUTO-GENERATION CODE HERE')
    
    if (canGoNext) {
      const nextStep = STEPS[currentStepIndex + 1].id
      
      // Simply navigate - no auto-triggering
      setCurrentStep(nextStep)
      console.log('🎯 Navigated to:', nextStep)
    }
  }

  const handlePrevious = () => {
    if (canGoPrevious) {
      setCurrentStep(STEPS[currentStepIndex - 1].id)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'analysis':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Story Analysis</h3>
                
                {/* Auto-Populate Button */}
                <button
                  onClick={handleAutoPopulate}
                  disabled={autoPopulating || loading}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                >
                  {autoPopulating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm font-medium">Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm font-medium">Auto-Populate</span>
                    </>
                  )}
                </button>
              </div>
              
              {/* Auto-populate info banner */}
              {!autoPopulating && !autoPopulateData && !loading && (
                <div className="mb-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-purple-900">✨ AI-Powered Quick Start</p>
                      <p className="text-sm text-purple-700 mt-1">
                        Click "Auto-Populate" to instantly generate a professional book title, author name, 
                        and complete design recommendations based on your story. You can edit or choose from alternatives!
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Success message after auto-populate */}
              {autoPopulateData && !autoPopulating && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-900">AI Suggestions Applied!</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-green-700">
                          <span className="font-medium">Title:</span> "{autoPopulateData.title_text}"
                        </p>
                        <p className="text-sm text-green-700">
                          <span className="font-medium">Author:</span> {autoPopulateData.author_text}
                        </p>
                        <p className="text-sm text-green-700">
                          <span className="font-medium">Genre:</span> {autoPopulateData.genre_detected}
                        </p>
                      </div>
                      <p className="text-xs text-green-600 mt-2">
                        See typography step for title/author text, or click Auto-Populate again for new suggestions
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600">Analyzing your story...</span>
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Analysis Failed</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                    <button
                      onClick={handleAnalyzeStory}
                      className="mt-3 text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
              
              {analysis && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Genre</label>
                      <p className="mt-1 text-base text-gray-900">{analysis.genre}</p>
                    </div>
                    {analysis.subgenre && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Subgenre</label>
                        <p className="mt-1 text-base text-gray-900">{analysis.subgenre}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-700">Tone</label>
                      <p className="mt-1 text-base text-gray-900">{analysis.tone}</p>
                    </div>
                    {analysis.setting && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Setting</label>
                        <p className="mt-1 text-base text-gray-900">{analysis.setting}</p>
                      </div>
                    )}
                  </div>
                  
                  {analysis.themes && analysis.themes.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Themes</label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {analysis.themes.map((theme, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                          >
                            {theme}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {analysis.key_elements && analysis.key_elements.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Key Visual Elements</label>
                      <ul className="mt-2 space-y-1">
                        {analysis.key_elements.map((element, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-start">
                            <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                            {element}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {analysis.mood && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Mood</label>
                      <p className="mt-1 text-sm text-gray-600">{analysis.mood}</p>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={handleAnalyzeStory}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Re-analyze Story
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      
      case 'brief':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">AI-Generated Design Brief</h3>
              
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600">Generating professional design brief...</span>
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Brief Generation Failed</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                    <button
                      onClick={handleGenerateBrief}
                      className="mt-3 text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
              
              {!loading && !error && !designBrief && (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 mx-auto text-blue-600 mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Generate Design Brief</h4>
                  <p className="text-sm text-gray-600 mb-6">
                    Click below to create professional design specifications based on your story analysis
                  </p>
                  <button
                    onClick={handleGenerateBrief}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center mx-auto"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Design Brief
                  </button>
                </div>
              )}
              
              {designBrief && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Visual Approach</label>
                      <p className="mt-1 text-base text-gray-900 capitalize">{designBrief.visual_approach}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Imagery Style</label>
                      <p className="mt-1 text-base text-gray-900">{designBrief.imagery_style}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Color Scheme</label>
                    <div className="mt-2 flex gap-4">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-12 h-12 rounded border border-gray-300"
                          style={{ backgroundColor: designBrief.color_scheme.primary }}
                        />
                        <div>
                          <p className="text-xs font-medium text-gray-700">Primary</p>
                          <p className="text-xs text-gray-500">{designBrief.color_scheme.primary}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-12 h-12 rounded border border-gray-300"
                          style={{ backgroundColor: designBrief.color_scheme.accent }}
                        />
                        <div>
                          <p className="text-xs font-medium text-gray-700">Accent</p>
                          <p className="text-xs text-gray-500">{designBrief.color_scheme.accent}</p>
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 italic">{designBrief.color_scheme.mood}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Typography Recommendations</label>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Title Font:</span>
                        <span className="text-sm font-medium text-gray-900">{designBrief.typography_recommendations.title_font}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Author Font:</span>
                        <span className="text-sm font-medium text-gray-900">{designBrief.typography_recommendations.author_font}</span>
                      </div>
                      <p className="text-sm text-gray-600 pt-2">{designBrief.typography_recommendations.style}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Composition Guidelines</label>
                    <p className="mt-1 text-sm text-gray-600">{designBrief.composition}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">DALL-E Prompt</label>
                    <div className="mt-2 bg-gray-50 rounded-lg p-4 font-mono text-xs text-gray-700">
                      {designBrief.dalle_prompt}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      
      case 'image':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Generated Cover Variations</h3>
                {coverIterations.length > 0 && (
                  <button
                    onClick={() => handleGenerateImages(3)}
                    disabled={loading}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
                  >
                    Generate More
                  </button>
                )}
              </div>
              
              {loading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
                  <p className="text-gray-600">Generating cover variations with DALL-E 3...</p>
                  <p className="text-sm text-gray-500 mt-1">This may take 30-60 seconds</p>
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Image Generation Failed</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                    <button
                      onClick={() => handleGenerateImages(3)}
                      className="mt-3 text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
              
              {coverIterations.length === 0 && !loading && !error && (
                <div className="text-center py-12">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">No images generated yet</p>
                  <button
                    onClick={() => handleGenerateImages(3)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Generate 3 Variations
                  </button>
                </div>
              )}
              
              {coverIterations.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {coverIterations.map((iteration) => (
                    <div
                      key={iteration.id}
                      className={`relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                        selectedIteration?.id === iteration.id
                          ? 'border-blue-600 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedIteration(iteration)}
                    >
                      <img
                        src={iteration.image_url}
                        alt={`Cover variation ${iteration.variation_number}`}
                        className="w-full aspect-[5/8] object-cover"
                      />
                      <div className="absolute top-2 right-2 bg-white rounded-full px-2 py-1 text-xs font-medium">
                        #{iteration.variation_number}
                      </div>
                      {selectedIteration?.id === iteration.id && (
                        <div className="absolute inset-0 bg-blue-600 bg-opacity-10 flex items-center justify-center">
                          <div className="bg-blue-600 rounded-full p-2">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {selectedIteration && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Variation Details</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Variation:</span>
                      <span className="font-medium">#{selectedIteration.variation_number}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Model:</span>
                      <span className="font-medium">{selectedIteration.metadata?.model || 'DALL-E 3'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Quality:</span>
                      <span className="font-medium">{selectedIteration.metadata?.quality || 'HD'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      
      case 'typography':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Add Typography</h3>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Form Section */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Book Title
                    </label>
                    <input
                      type="text"
                      value={titleText}
                      onChange={(e) => setTitleText(e.target.value)}
                      placeholder="Enter your book title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Author Name
                    </label>
                    <input
                      type="text"
                      value={authorText}
                      onChange={(e) => setAuthorText(e.target.value)}
                      placeholder="Enter author name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  {designBrief && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 mb-2">Recommended Fonts:</p>
                      <div className="space-y-1 text-sm text-blue-700">
                        <p>Title: {designBrief.typography_recommendations.title_font}</p>
                        <p>Author: {designBrief.typography_recommendations.author_font}</p>
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={handleAddTypography}
                    disabled={!titleText || !authorText || loading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Applying Typography...
                      </>
                    ) : (
                      <>
                        <Type className="w-4 h-4 mr-2" />
                        Apply Typography
                      </>
                    )}
                  </button>
                  
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}
                </div>
                
                {/* Preview Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preview
                  </label>
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    {finalImageUrl ? (
                      <img
                        src={finalImageUrl}
                        alt="Cover with typography"
                        className="w-full h-auto"
                      />
                    ) : selectedIteration ? (
                      <img
                        src={selectedIteration.image_url}
                        alt="Selected cover"
                        className="w-full h-auto"
                      />
                    ) : (
                      <div className="aspect-[5/8] flex items-center justify-center bg-gray-100">
                        <Type className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'export':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Export Your Cover</h3>
              
              {!finalImageUrl && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Please add typography first to export the final cover.
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ebook Format */}
                <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors">
                  <h4 className="font-medium text-gray-900 mb-2">Amazon KDP Ebook</h4>
                  <p className="text-sm text-gray-600 mb-3">1600 × 2560px, 300 DPI</p>
                  <button
                    onClick={() => handleExport('ebook')}
                    disabled={loading || !finalImageUrl}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
                  >
                    {exportedFiles.ebook ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Downloaded
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Export Ebook
                      </>
                    )}
                  </button>
                  {exportedFiles.ebook && (
                    <a
                      href={exportedFiles.ebook}
                      download="cover_ebook.jpg"
                      className="block mt-2 text-center text-sm text-blue-600 hover:text-blue-700"
                    >
                      Download Again
                    </a>
                  )}
                </div>
                
                {/* Print Format */}
                <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors">
                  <h4 className="font-medium text-gray-900 mb-2">Print Cover (6×9\")</h4>
                  <p className="text-sm text-gray-600 mb-3">1800 × 2700px, 300 DPI</p>
                  <button
                    onClick={() => handleExport('print_front')}
                    disabled={loading || !finalImageUrl}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
                  >
                    {exportedFiles.print_front ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Downloaded
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Export Print
                      </>
                    )}
                  </button>
                  {exportedFiles.print_front && (
                    <a
                      href={exportedFiles.print_front}
                      download="cover_print.jpg"
                      className="block mt-2 text-center text-sm text-blue-600 hover:text-blue-700"
                    >
                      Download Again
                    </a>
                  )}
                </div>
                
                {/* Social Square */}
                <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors">
                  <h4 className="font-medium text-gray-900 mb-2">Instagram Square</h4>
                  <p className="text-sm text-gray-600 mb-3">1080 × 1080px</p>
                  <button
                    onClick={() => handleExport('social_square')}
                    disabled={loading || !finalImageUrl}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
                  >
                    {exportedFiles.social_square ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Downloaded
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Export Social
                      </>
                    )}
                  </button>
                  {exportedFiles.social_square && (
                    <a
                      href={exportedFiles.social_square}
                      download="cover_social_square.jpg"
                      className="block mt-2 text-center text-sm text-blue-600 hover:text-blue-700"
                    >
                      Download Again
                    </a>
                  )}
                </div>
                
                {/* Thumbnail */}
                <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors">
                  <h4 className="font-medium text-gray-900 mb-2">Website Thumbnail</h4>
                  <p className="text-sm text-gray-600 mb-3">400 × 640px</p>
                  <button
                    onClick={() => handleExport('thumbnail')}
                    disabled={loading || !finalImageUrl}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
                  >
                    {exportedFiles.thumbnail ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Downloaded
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Export Thumbnail
                      </>
                    )}
                  </button>
                  {exportedFiles.thumbnail && (
                    <a
                      href={exportedFiles.thumbnail}
                      download="cover_thumbnail.jpg"
                      className="block mt-2 text-center text-sm text-blue-600 hover:text-blue-700"
                    >
                      Download Again
                    </a>
                  )}
                </div>
              </div>
              
              {loading && (
                <div className="mt-6 flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                  <span className="text-gray-600">Exporting...</span>
                </div>
              )}
              
              {error && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            className="text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back to Project
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Book Cover Designer</h1>
          <p className="text-gray-600 mt-2">
            Create a professional book cover for your novel with AI assistance
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      currentStepIndex === idx
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : currentStepIndex > idx
                        ? 'border-green-600 bg-green-600 text-white'
                        : 'border-gray-300 bg-white text-gray-400'
                    }`}
                  >
                    {currentStepIndex > idx ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`text-sm font-medium ${
                      currentStepIndex === idx ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 max-w-[120px]">
                      {step.description}
                    </p>
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-4 ${
                    currentStepIndex > idx ? 'bg-green-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={!canGoNext || (currentStep === 'analysis' && !analysis) || (currentStep === 'brief' && !designBrief)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  )
}
