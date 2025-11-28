import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  Upload, 
  FileText, 
  Sparkles, 
  Image as ImageIcon, 
  Type, 
  Download,
  Loader2,
  Check,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { bookCoverService } from '../services/bookCoverService'
import type { 
  StoryAnalysis, 
  DesignBrief, 
  CoverIteration
} from '../types/bookCover'

type Step = 'upload' | 'analysis' | 'brief' | 'image' | 'typography' | 'export'

interface StepConfig {
  id: Step
  title: string
  description: string
  icon: React.ReactNode
}

const STEPS: StepConfig[] = [
  {
    id: 'upload',
    title: 'Upload Manuscript',
    description: 'Upload your book file for analysis',
    icon: <Upload className="w-5 h-5" />
  },
  {
    id: 'analysis',
    title: 'Story Analysis',
    description: 'AI extracts design requirements',
    icon: <Sparkles className="w-5 h-5" />
  },
  {
    id: 'brief',
    title: 'Design Brief',
    description: 'Professional design specifications',
    icon: <FileText className="w-5 h-5" />
  },
  {
    id: 'image',
    title: 'Generate Images',
    description: 'Create cover variations',
    icon: <ImageIcon className="w-5 h-5" />
  },
  {
    id: 'typography',
    title: 'Add Typography',
    description: 'Add title and author text',
    icon: <Type className="w-5 h-5" />
  },
  {
    id: 'export',
    title: 'Export',
    description: 'Download print-ready files',
    icon: <Download className="w-5 h-5" />
  }
]

export default function StandaloneBookCoverDesigner() {
  const navigate = useNavigate()
  const location = useLocation()
  const [currentStep, setCurrentStep] = useState<Step>('upload')
  const [error, setError] = useState<string | null>(null)
  
  // Upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [manuscriptText, setManuscriptText] = useState<string>('')
  const [preloadedSource, setPreloadedSource] = useState<string | null>(null)
  
  // Project metadata
  const [bookTitle, setBookTitle] = useState('')
  const [authorName, setAuthorName] = useState('')
  
  // Analysis state
  const [analysis, setAnalysis] = useState<StoryAnalysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  
  // Brief state
  const [brief, setBrief] = useState<DesignBrief | null>(null)
  const [generatingBrief, setGeneratingBrief] = useState(false)
  
  // Image state
  const [iterations, setIterations] = useState<CoverIteration[]>([])
  const [selectedIteration, setSelectedIteration] = useState<string | null>(null)
  const [generatingImages, setGeneratingImages] = useState(false)
  
  // Typography state
  const [titleText, setTitleText] = useState('')
  const [authorText, setAuthorText] = useState('')
  const [titleFont, setTitleFont] = useState('Cinzel')
  const [authorFont, setAuthorFont] = useState('Open Sans')
  
  // Final cover state
  const [finalCover, setFinalCover] = useState<string | null>(null)
  const [applyingTypography, setApplyingTypography] = useState(false)

  // Get current step index
  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep)

  // Check for pre-loaded manuscript text from automatic workflow
  useEffect(() => {
    const state = location.state as { 
      manuscriptText?: string
      projectTitle?: string
      projectId?: string
    } | null

    if (state?.manuscriptText) {
      setManuscriptText(state.manuscriptText)
      setPreloadedSource(state.projectTitle || 'Generated Project')
      if (state.projectTitle) {
        setBookTitle(state.projectTitle)
      }
      // Skip upload step and go directly to analysis
      setCurrentStep('analysis')
    }
  }, [location.state])

  // File upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadedFile(file)
    setUploading(true)
    setError(null)

    try {
      // Read file content
      const text = await readFileContent(file)
      setManuscriptText(text)
      
      console.log('📄 File uploaded:', file.name)
      console.log('📝 Extracted text length:', text.length)
      
      // Auto-advance to analysis step
      setCurrentStep('analysis')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file')
      console.error('Error reading file:', err)
    } finally {
      setUploading(false)
    }
  }

  // Read file content based on type
  const readFileContent = async (file: File): Promise<string> => {
    const fileType = file.name.split('.').pop()?.toLowerCase()

    if (fileType === 'txt' || fileType === 'md') {
      return await file.text()
    } else if (fileType === 'docx') {
      // For .docx files, we'd need a library like mammoth.js
      // For now, return error
      throw new Error('DOCX support coming soon. Please use .txt or .md files for now.')
    } else {
      throw new Error('Unsupported file type. Please upload .txt, .md, or .docx files.')
    }
  }

  // Run analysis
  const handleAnalyze = async () => {
    if (!manuscriptText) {
      setError('No manuscript text available')
      return
    }

    setAnalyzing(true)
    setError(null)

    try {
      // Create temporary project for analysis
      const result = await bookCoverService.analyzeManuscript(manuscriptText)
      
      setAnalysis({
        project_id: 'standalone',
        genre: result.genre,
        subgenre: result.subgenre,
        tone: result.tone,
        themes: result.themes,
        setting: result.setting,
        key_elements: result.key_elements,
        mood: result.mood
      })

      console.log('✅ Analysis complete:', result)
      setCurrentStep('brief')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
      console.error('Analysis error:', err)
    } finally {
      setAnalyzing(false)
    }
  }

  // Generate design brief
  const handleGenerateBrief = async () => {
    if (!analysis) {
      setError('No analysis available')
      return
    }

    setGeneratingBrief(true)
    setError(null)

    try {
      const result = await bookCoverService.generateBrief('standalone', analysis)
      setBrief(result)
      
      console.log('✅ Brief generated successfully - user can review before proceeding')
      // DO NOT auto-navigate - let user review the brief and click Next manually
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Brief generation failed')
      console.error('Brief generation error:', err)
    } finally {
      setGeneratingBrief(false)
    }
  }

  // Generate images
  const handleGenerateImages = async () => {
    if (!brief) {
      setError('No design brief available')
      return
    }

    setGeneratingImages(true)
    setError(null)

    try {
      const result = await bookCoverService.generateImages(brief.id, {
        num_variations: 3,
        style: 'vivid',
        quality: 'standard'
      })

      setIterations(result.iterations)
      if (result.iterations.length > 0) {
        setSelectedIteration(result.iterations[0].id)
      }

      console.log('✅ Images generated:', result.iterations.length)
      setCurrentStep('typography')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image generation failed')
      console.error('Image generation error:', err)
    } finally {
      setGeneratingImages(false)
    }
  }

  // Apply typography
  const handleApplyTypography = async () => {
    if (!selectedIteration) {
      setError('No image selected')
      return
    }

    setApplyingTypography(true)
    setError(null)

    try {
      const result = await bookCoverService.addTypography(
        selectedIteration,
        titleText || bookTitle,
        authorText || authorName,
        {
          titleFont: titleFont,
          authorFont: authorFont
        }
      )

      setFinalCover(result.final_image_url)
      console.log('✅ Typography applied')
      setCurrentStep('export')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Typography application failed')
      console.error('Typography error:', err)
    } finally {
      setApplyingTypography(false)
    }
  }

  // Navigation
  const canGoNext = () => {
    switch (currentStep) {
      case 'upload': return (uploadedFile !== null || preloadedSource !== null) && manuscriptText.length > 0
      case 'analysis': return analysis !== null
      case 'brief': return analysis !== null // Allow proceeding if analysis exists (brief generation coming soon)
      case 'image': return iterations.length > 0 && selectedIteration !== null
      case 'typography': return titleText.length > 0 && authorText.length > 0
      case 'export': return finalCover !== null
      default: return false
    }
  }

  const handleNext = async () => {
    // First, handle any required actions for the current step
    switch (currentStep) {
      case 'upload':
        // Upload step - can proceed if we have manuscript text
        if (manuscriptText) {
          setCurrentStep('analysis')
        }
        return
      case 'analysis':
        // If no analysis yet, run it first
        if (!analysis) {
          await handleAnalyze()
          return // handleAnalyze will advance to 'brief' on success
        }
        // If analysis exists, advance to brief
        setCurrentStep('brief')
        return
      case 'brief':
        // If no brief yet, generate it first
        if (!brief) {
          await handleGenerateBrief()
          return // Stay on brief step to let user review
        }
        // If brief exists, advance to image generation
        setCurrentStep('image')
        return
      case 'image':
        // If no images yet, generate them first
        if (iterations.length === 0) {
          await handleGenerateImages()
          return // handleGenerateImages will advance on success
        }
        // If images exist, advance to typography
        setCurrentStep('typography')
        return
      case 'typography':
        await handleApplyTypography()
        return
    }
  }

  const handlePrevious = () => {
    const prevIndex = Math.max(0, currentStepIndex - 1)
    setCurrentStep(STEPS[prevIndex].id)
  }

  const isProcessing = uploading || analyzing || generatingBrief || generatingImages || applyingTypography

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2 mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Book Cover Designer
          </h1>
          <p className="text-gray-600">
            Create professional print-ready book covers with AI
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      index <= currentStepIndex
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step.icon}
                  </div>
                  <div className="hidden sm:block">
                    <div className="font-medium text-sm">{step.title}</div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 bg-gray-200 mx-4">
                    <div
                      className={`h-full ${
                        index < currentStepIndex ? 'bg-purple-600' : 'bg-gray-200'
                      }`}
                      style={{
                        width: index < currentStepIndex ? '100%' : '0%',
                        transition: 'width 0.3s'
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Upload Step */}
          {currentStep === 'upload' && (
            <div className="max-w-2xl mx-auto text-center">
              <Upload className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Upload Your Manuscript</h2>
              <p className="text-gray-600 mb-6">
                Upload your completed book in .txt or .md format
              </p>

              <div className="mb-6">
                <label className="block text-left mb-2 font-medium">Book Title</label>
                <input
                  type="text"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="Enter your book title"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div className="mb-6">
                <label className="block text-left mb-2 font-medium">Author Name</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Enter author name"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-purple-500 transition-colors">
                <input
                  type="file"
                  accept=".txt,.md,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  {uploading ? (
                    <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
                  ) : (
                    <FileText className="w-12 h-12 text-gray-400 mb-4" />
                  )}
                  <span className="text-lg font-medium text-gray-700 mb-2">
                    {uploadedFile ? uploadedFile.name : 'Click to upload file'}
                  </span>
                  <span className="text-sm text-gray-500">
                    Supports: .txt, .md (.docx coming soon)
                  </span>
                </label>
              </div>

              {manuscriptText && (
                <div className="mt-6 text-left">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <Check className="w-5 h-5 text-green-600 inline mr-2" />
                    <span className="font-medium text-green-800">
                      File loaded: {manuscriptText.length.toLocaleString()} characters
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analysis Step */}
          {currentStep === 'analysis' && (
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">Story Analysis</h2>
              
              {preloadedSource && (
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">Manuscript Loaded</p>
                      <p className="text-sm text-blue-700">From project: {preloadedSource}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        {manuscriptText.length.toLocaleString()} characters loaded automatically
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {!analysis ? (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                  <p className="text-gray-600 mb-6">
                    Click "Analyze" to extract design requirements from your manuscript
                  </p>
                  <button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 mx-auto"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Analyze Manuscript
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Genre</h3>
                    <p>{analysis.genre}</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Tone</h3>
                    <p>{analysis.tone}</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Themes</h3>
                    <p>{analysis.themes.join(', ')}</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Key Visual Elements</h3>
                    <p>{analysis.key_elements.join(', ')}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Brief Step */}
          {currentStep === 'brief' && (
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">Design Brief</h2>
              
              {/* Show Generate Brief button if no brief yet */}
              {!brief && !generatingBrief && (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                  <p className="text-gray-600 mb-6">
                    Generate a professional design brief with color schemes, typography, and AI image prompt
                  </p>
                  <button
                    onClick={handleGenerateBrief}
                    disabled={!analysis}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 mx-auto"
                  >
                    <Sparkles className="w-5 h-5" />
                    Generate Design Brief
                  </button>
                </div>
              )}

              {/* Show loading state */}
              {generatingBrief && (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Generating professional design brief...</p>
                </div>
              )}

              {/* Show the actual brief content */}
              {brief && !generatingBrief && (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <Check className="w-5 h-5 text-green-600 inline mr-2" />
                    <span className="font-medium text-green-800">Design Brief Generated</span>
                  </div>

                  {/* Color Scheme */}
                  {brief.color_scheme && (
                    <div className="bg-white border rounded-lg p-6">
                      <h3 className="font-bold text-lg mb-4">Color Scheme</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {brief.color_scheme.primary && (
                          <div className="text-center">
                            <div 
                              className="w-16 h-16 rounded-lg mx-auto mb-2 border-2 border-gray-300"
                              style={{ backgroundColor: brief.color_scheme.primary || '#CCCCCC' }}
                            />
                            <p className="text-sm font-medium">Primary</p>
                            <p className="text-xs text-gray-500">{brief.color_scheme.primary || 'N/A'}</p>
                          </div>
                        )}
                        {brief.color_scheme.accent && (
                          <div className="text-center">
                            <div 
                              className="w-16 h-16 rounded-lg mx-auto mb-2 border-2 border-gray-300"
                              style={{ backgroundColor: brief.color_scheme.accent || '#CCCCCC' }}
                            />
                            <p className="text-sm font-medium">Accent</p>
                            <p className="text-xs text-gray-500">{brief.color_scheme.accent || 'N/A'}</p>
                          </div>
                        )}
                        {brief.color_scheme.background && (
                          <div className="text-center">
                            <div 
                              className="w-16 h-16 rounded-lg mx-auto mb-2 border-2 border-gray-300"
                              style={{ backgroundColor: brief.color_scheme.background || '#CCCCCC' }}
                            />
                            <p className="text-sm font-medium">Background</p>
                            <p className="text-xs text-gray-500">{brief.color_scheme.background || 'N/A'}</p>
                          </div>
                        )}
                        {brief.color_scheme.text && (
                          <div className="text-center">
                            <div 
                              className="w-16 h-16 rounded-lg mx-auto mb-2 border-2 border-gray-300"
                              style={{ backgroundColor: brief.color_scheme.text || '#CCCCCC' }}
                            />
                            <p className="text-sm font-medium">Text</p>
                            <p className="text-xs text-gray-500">{brief.color_scheme.text || 'N/A'}</p>
                          </div>
                        )}
                      </div>
                      {brief.color_scheme.mood && (
                        <p className="mt-4 text-gray-600 italic">{brief.color_scheme.mood}</p>
                      )}
                    </div>
                  )}

                  {/* Typography */}
                  {brief.typography_recommendations && (
                    <div className="bg-white border rounded-lg p-6">
                      <h3 className="font-bold text-lg mb-4">Typography Recommendations</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {brief.typography_recommendations.title_font && (
                          <div>
                            <h4 className="font-semibold text-gray-700">Title Font</h4>
                            <p className="text-gray-900">{brief.typography_recommendations.title_font}</p>
                          </div>
                        )}
                        {brief.typography_recommendations.author_font && (
                          <div>
                            <h4 className="font-semibold text-gray-700">Author Font</h4>
                            <p className="text-gray-900">{brief.typography_recommendations.author_font}</p>
                          </div>
                        )}
                        {brief.typography_recommendations.style && (
                          <div className="md:col-span-2">
                            <h4 className="font-semibold text-gray-700">Style</h4>
                            <p className="text-gray-900">{brief.typography_recommendations.style}</p>
                          </div>
                        )}
                        {brief.typography_recommendations.hierarchy && (
                          <div className="md:col-span-2">
                            <h4 className="font-semibold text-gray-700">Hierarchy</h4>
                            <p className="text-gray-900">{brief.typography_recommendations.hierarchy}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Composition */}
                  {brief.composition && (
                    <div className="bg-white border rounded-lg p-6">
                      <h3 className="font-bold text-lg mb-4">Composition</h3>
                      <p className="text-gray-900">{brief.composition}</p>
                    </div>
                  )}

                  {/* Visual Approach & Imagery Style */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {brief.visual_approach && (
                      <div className="bg-white border rounded-lg p-6">
                        <h3 className="font-bold text-lg mb-4">Visual Approach</h3>
                        <p className="text-gray-900">{brief.visual_approach}</p>
                      </div>
                    )}
                    {brief.imagery_style && (
                      <div className="bg-white border rounded-lg p-6">
                        <h3 className="font-bold text-lg mb-4">Imagery Style</h3>
                        <p className="text-gray-900">{brief.imagery_style}</p>
                      </div>
                    )}
                  </div>

                  {/* DALL-E Prompt */}
                  {brief.dalle_prompt && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                      <h3 className="font-bold text-lg mb-4">AI Image Prompt</h3>
                      <p className="text-gray-800 whitespace-pre-wrap">{brief.dalle_prompt}</p>
                    </div>
                  )}

                  <div className="text-center pt-4">
                    <p className="text-gray-600">
                      Review the design brief above, then click <strong>Next</strong> to generate cover images.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Image Generation Step */}
          {currentStep === 'image' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">Generate Cover Images</h2>
              
              {/* Show generate button if no images yet */}
              {iterations.length === 0 && !generatingImages && (
                <div className="text-center py-8">
                  <ImageIcon className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                  <p className="text-gray-600 mb-6">
                    Generate AI cover images using DALL-E 3 based on your design brief
                  </p>
                  <button
                    onClick={handleGenerateImages}
                    disabled={!brief}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 mx-auto"
                  >
                    <Sparkles className="w-5 h-5" />
                    Generate Cover Images
                  </button>
                  {brief?.dalle_prompt && (
                    <div className="mt-6 text-left bg-gray-50 rounded-lg p-4 max-w-2xl mx-auto">
                      <h4 className="font-semibold text-gray-700 mb-2">Prompt to be used:</h4>
                      <p className="text-sm text-gray-600">{brief.dalle_prompt}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Show loading state */}
              {generatingImages && (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Generating cover images with DALL-E 3...</p>
                  <p className="text-sm text-gray-500 mt-2">This may take 30-60 seconds</p>
                </div>
              )}

              {/* Show generated images */}
              {iterations.length > 0 && !generatingImages && (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <Check className="w-5 h-5 text-green-600 inline mr-2" />
                    <span className="font-medium text-green-800">
                      {iterations.length} cover variation{iterations.length > 1 ? 's' : ''} generated
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {iterations.map((iteration, index) => (
                      <div 
                        key={iteration.id}
                        className={`relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                          selectedIteration === iteration.id 
                            ? 'border-purple-600 ring-2 ring-purple-200' 
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                        onClick={() => setSelectedIteration(iteration.id)}
                      >
                        <img 
                          src={iteration.image_url} 
                          alt={`Cover variation ${index + 1}`}
                          className="w-full aspect-[2/3] object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                          #{index + 1}
                        </div>
                        {selectedIteration === iteration.id && (
                          <div className="absolute top-2 right-2 bg-purple-600 text-white p-1 rounded-full">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="text-center pt-4">
                    <p className="text-gray-600">
                      Select a cover and click <strong>Next</strong> to add typography.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Typography Step - Placeholder */}
          {currentStep === 'typography' && (
            <div className="max-w-4xl mx-auto text-center py-12">
              <Type className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Add Typography</h2>
              <p className="text-gray-600">Typography editing coming soon...</p>
              {selectedIteration && iterations.find(i => i.id === selectedIteration) && (
                <div className="mt-6">
                  <img 
                    src={iterations.find(i => i.id === selectedIteration)?.image_url}
                    alt="Selected cover"
                    className="max-w-sm mx-auto rounded-lg shadow-lg"
                  />
                </div>
              )}
            </div>
          )}

          {/* Export Step - Placeholder */}
          {currentStep === 'export' && (
            <div className="max-w-4xl mx-auto text-center py-12">
              <Download className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Export Your Cover</h2>
              <p className="text-gray-600">Export functionality coming soon...</p>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStepIndex === 0 || isProcessing}
            className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={!canGoNext() || isProcessing || currentStep === 'export'}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
