import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

// ==================== TYPE DEFINITIONS ====================

interface PremiseSession {
  session_id: string
  current_step: number
  status: string
  project_stub?: ProjectStub
  genre_profile?: GenreProfile
  tone_theme_profile?: ToneThemeProfile
  character_seeds?: CharacterSeeds
  plot_intent?: PlotIntent
  structure_targets?: StructureTargets
  constraints_profile?: ConstraintsProfile
  baseline_premise?: any
  premium_premise?: any
}

interface ProjectStub {
  title: string
  logline: string
}

interface GenreProfile {
  primary_genre: string
  secondary_genre?: string
  subgenres: string[]
  audience_rating: string
}

interface ToneThemeProfile {
  tone_adjectives: string[]
  darkness_level: number
  humor_level: number
  themes: string[]
  comparable_works: string[]
  heat_level?: string
}

interface CharacterSeed {
  name: string
  role: string
  brief_description: string
  goal?: string
  flaw?: string
  arc_notes?: string
}

interface CharacterSeeds {
  protagonist?: CharacterSeed
  antagonist?: CharacterSeed
  supporting_cast: CharacterSeed[]
}

interface PlotIntent {
  central_conflict: string
  stakes: string
  key_story_beats: string[]
  planned_twists: string[]
}

interface StructureTargets {
  target_word_count: number
  target_chapter_count?: number
  pov_style: string
  tense: string
  pacing_preference: string
}

interface ConstraintsProfile {
  content_warnings: string[]
  must_have_scenes: string[]
  must_avoid_elements: string[]
}

interface AIAssistResponse {
  suggestion: string
  alternatives: string[]
  tokens_used: number
}

const API_BASE = 'http://127.0.0.1:8000/api'

// ==================== MAIN COMPONENT ====================

export default function PremiseBuilderWizard() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiSuggestions, setAiSuggestions] = useState<AIAssistResponse | null>(null)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const [assistFieldType, setAssistFieldType] = useState<string | null>(null)
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([])

  // Form state for all steps
  const [projectTitle, setProjectTitle] = useState('')
  const [logline, setLogline] = useState('')
  
  const [primaryGenre, setPrimaryGenre] = useState('')
  const [secondaryGenre, setSecondaryGenre] = useState('')
  const [subgenres, setSubgenres] = useState<string[]>([])
  const [comedyElements, setComedyElements] = useState<string[]>([])
  const [audienceRating, setAudienceRating] = useState('general')
  
  const [toneAdjectives, setToneAdjectives] = useState<string[]>([])
  const [darknessLevel, setDarknessLevel] = useState(5)
  const [humorLevel, setHumorLevel] = useState(5)
  const [themes, setThemes] = useState<string[]>([])
  const [emotionalTone, setEmotionalTone] = useState('')
  const [coreValues, setCoreValues] = useState<string[]>([])
  const [centralQuestion, setCentralQuestion] = useState('')
  const [atmosphericElements, setAtmosphericElements] = useState<string[]>([])
  const [heatLevel, setHeatLevel] = useState('')
  
  const [protagonist, setProtagonist] = useState<CharacterSeed | null>(null)
  const [antagonist, setAntagonist] = useState<CharacterSeed | null>(null)
  const [supportingCast, setSupportingCast] = useState<CharacterSeed[]>([])
  
  const [centralConflict, setCentralConflict] = useState('')
  const [stakes, setStakes] = useState('')
  const [keyStoryBeats, setKeyStoryBeats] = useState<string[]>([])
  const [plannedTwists, setPlannedTwists] = useState<string[]>([])
  
  const [targetWordCount, setTargetWordCount] = useState(80000)
  const [targetChapterCount, setTargetChapterCount] = useState(25)
  const [povStyle, setPovStyle] = useState('third_person_limited')
  const [tense, setTense] = useState('past')
  const [pacingPreference, setPacingPreference] = useState('moderate')
  
  const [contentWarnings, setContentWarnings] = useState<string[]>([])
  const [mustHaveScenes, setMustHaveScenes] = useState<string[]>([])
  const [mustAvoidElements, setMustAvoidElements] = useState<string[]>([])
  
  const [baselinePremise, setBaselinePremise] = useState<string | null>(null)
  const [premiumPremise, setPremiumPremise] = useState<string | null>(null)

  // Fetch genres for dropdown
  const { data: genresData, isLoading: genresLoading, error: genresError } = useQuery({
    queryKey: ['genres'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/genres`)
      if (!response.ok) throw new Error('Failed to fetch genres')
      return response.json()
    }
  })

  // Debug: log genres data
  useEffect(() => {
    if (genresData) {
      console.log('Genres loaded:', genresData)
      console.log('Is array:', Array.isArray(genresData))
      console.log('Length:', genresData.length)
      console.log('First genre:', genresData[0])
    }
    if (genresError) {
      console.error('Genres error:', genresError)
    }
    if (genresLoading) {
      console.log('Loading genres...')
    }
  }, [genresData, genresError, genresLoading])

  const steps = [
    { number: 0, name: 'Project Info', icon: '📋' },
    { number: 1, name: 'Genre', icon: '🎭' },
    { number: 2, name: 'Tone & Themes', icon: '🎨' },
    { number: 3, name: 'Characters', icon: '👥' },
    { number: 4, name: 'Plot', icon: '📖' },
    { number: 5, name: 'Structure', icon: '🏗️' },
    { number: 6, name: 'Constraints', icon: '⚙️' },
    { number: 7, name: 'Baseline', icon: '📝' },
    { number: 8, name: 'Premium', icon: '✨' },
  ]

  // Load or create session on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const mode = searchParams.get('mode') || 'new' // 'new' | 'resume'
    console.log('🚦 [INIT] Wizard mode:', mode)

    const initSession = async () => {
      console.log('🚀 [INIT] Starting session initialization...')
      try {
        setIsLoading(true)
        setError(null)
        if (mode === 'resume') {
          // Resume last saved session if possible
          const savedSessionId = localStorage.getItem('premiseBuilderSessionId')
          console.log('💾 [INIT] [RESUME] Checking localStorage for saved session:', savedSessionId)

          if (savedSessionId) {
            console.log('🔄 [INIT] [RESUME] Found saved session, attempting to restore:', savedSessionId)
            const response = await fetch(`${API_BASE}/premise-builder/sessions/${savedSessionId}`)
            console.log('📡 [API] Session fetch response status:', response.status)

            if (response.ok) {
              const data = await response.json()
              console.log('✅ [INIT] Successfully loaded existing session:', data)

              const session = data.session
              console.log('🔧 [STATE] Restoring session state - ID:', session.id, 'Step:', session.current_step)

              if (session.project_stub) {
                console.log('📝 [STATE] Restoring project stub:', session.project_stub)
                setProjectTitle(session.project_stub.title || '')
                setLogline(session.project_stub.logline || '')
              }
              if (session.genre_profile) {
                console.log('🎭 [STATE] Restoring genre profile:', session.genre_profile)
                setPrimaryGenre(session.genre_profile.primary_genre || '')
                setSecondaryGenre(session.genre_profile.secondary_genre || '')
                setSubgenres(session.genre_profile.subgenres || [])
              }
              if (session.tone_theme_profile) {
                console.log('🎨 [STATE] Restoring tone/theme profile:', session.tone_theme_profile)
                setToneAdjectives(session.tone_theme_profile.tone_adjectives || [])
                setDarknessLevel(session.tone_theme_profile.darkness_level || 5)
                setHumorLevel(session.tone_theme_profile.humor_level || 5)
                setThemes(session.tone_theme_profile.themes || [])
                setEmotionalTone(session.tone_theme_profile.emotional_tone || '')
                setCoreValues(session.tone_theme_profile.core_values || [])
                setCentralQuestion(session.tone_theme_profile.central_question || '')
                setAtmosphericElements(session.tone_theme_profile.atmospheric_elements || [])
              }

              setSessionId(session.id)
              setCurrentStep(session.current_step)

              console.log('✅ [INIT] Session restoration complete')
              setIsLoading(false)
              return
            } else {
              console.log('⚠️ [INIT] [RESUME] Saved session not found (status:', response.status, '), falling back to new session')
              localStorage.removeItem('premiseBuilderSessionId')
            }
          } else {
            console.log('⚠️ [INIT] [RESUME] No saved sessionId found, falling back to new session')
          }
        } else {
          // Explicitly clear any old session when starting fresh
          console.log('🧹 [INIT] [NEW] Clearing any saved session and starting fresh')
          localStorage.removeItem('premiseBuilderSessionId')
        }

        // Create new session
        const url = `${API_BASE}/premise-builder/sessions`
        console.log('🆕 [INIT] Creating new session at:', url)
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current_step: 0 })
        })
        
        console.log('📡 [API] Session creation response status:', response.status)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ [API] Session creation error:', errorText)
          throw new Error(`Failed to create session: ${response.status} - ${errorText}`)
        }
        
        const data = await response.json()
        console.log('✅ [API] Session created successfully:', data)
        
        // The API returns { session: { id: "...", ... }, next_step: 1, ... }
        // The id is inside the session object (NOT session_id!)
        const sessionId = data.session?.id
        console.log('🆔 [INIT] Extracted session ID:', sessionId)
        
        if (!sessionId) {
          console.error('❌ [INIT] No session ID in response!')
          throw new Error('No session ID in response')
        }
        
        console.log('💾 [STATE] Setting session ID and saving to localStorage')
        setSessionId(sessionId)
        // Save to localStorage for recovery
        localStorage.setItem('premiseBuilderSessionId', sessionId)
        console.log('✅ [INIT] New session initialization complete')
      } catch (err) {
        console.error('❌ [INIT] Session initialization failed:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize session')
      } finally {
        setIsLoading(false)
      }
    }
    
    initSession()
  }, [])

  // Helper function to use AI suggestions in form fields
  const useSuggestion = (suggestions: string[], fieldType: string | null) => {
    console.log('📝 [SUGGEST] Using suggestions')
    console.log('  🏷️ Field type:', fieldType)
    console.log('  📋 Suggestions:', suggestions)
    
    if (!fieldType) {
      console.warn('⚠️ [SUGGEST] No field type specified')
      return
    }
    
    // Apply suggestions based on field type
    switch (fieldType) {
      case 'suggest_themes':
        setThemes(suggestions)
        break
      
      case 'suggest_emotional_tone':
        // Single value field - use first selected
        setEmotionalTone(suggestions[0] || '')
        break
      
      case 'suggest_core_values':
        setCoreValues(suggestions)
        break
      
      case 'suggest_central_question':
        // Single value field - use first selected
        setCentralQuestion(suggestions[0] || '')
        break
      
      case 'suggest_atmosphere':
        setAtmosphericElements(suggestions)
        break
      
      default:
        console.warn('Unknown field type:', fieldType)
    }
  }
  
  // Toggle a suggestion in the selection
  const toggleSuggestion = (suggestion: string) => {
    console.log('🎯 [UI] Toggle suggestion:', suggestion)
    setSelectedSuggestions(prev => {
      const isSelected = prev.includes(suggestion)
      const newSelection = isSelected 
        ? prev.filter(s => s !== suggestion)
        : [...prev, suggestion]
      console.log('  📊 Selection:', isSelected ? 'removed' : 'added')
      console.log('  📋 New selections:', newSelection)
      return newSelection
    })
  }
  
  // Helper to parse numbered or comma-separated lists
  const parseListSuggestion = (text: string): string[] => {
    // Remove numbered list markers (1., 2., etc.) and split by commas or newlines
    const cleaned = text
      .split(/\n|,/)
      .map(item => item.replace(/^\d+\.\s*/, '').trim())
      .filter(item => item.length > 0)
    return cleaned
  }
  
  // Helper to clean single-value suggestions
  const cleanSuggestion = (text: string): string => {
    // Remove quotes, numbered markers, and extra whitespace
    return text
      .replace(/^\d+\.\s*/, '')
      .replace(/^["']|["']$/g, '')
      .trim()
  }

  // AI Assistant function
  const requestAIAssist = async (assistType: string, context: Record<string, any>) => {
    console.log('🤖 [AI] AI Assist requested')
    console.log('  📋 Type:', assistType)
    console.log('  🔑 Session ID:', sessionId)
    console.log('  📦 Context:', context)
    
    if (!sessionId) {
      console.error('❌ [AI] No session ID! Cannot request AI assist')
      setError('Session not initialized. Please refresh the page.')
      return
    }
    
    try {
      console.log('⏳ [AI] Starting AI request...')
      setIsAiLoading(true)
      setError(null)
      setAssistFieldType(assistType)
      setSelectedSuggestions([])
      
      const url = `${API_BASE}/premise-builder/sessions/${sessionId}/ai`
      console.log('📡 [AI] Fetching from:', url)
      
      const requestBody = { action: assistType, context }
      console.log('📤 [AI] Request body:', requestBody)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      
      console.log('📡 [AI] Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [AI] Error response:', errorText)
        throw new Error(`AI assist failed: ${response.status} ${errorText}`)
      }
      
      const data = await response.json()
      console.log('✅ [AI] Suggestions received:', data)
      console.log('  📝 Main suggestion:', data.suggestion)
      console.log('  🔄 Alternatives count:', data.alternatives?.length || 0)
      setAiSuggestions(data)
    } catch (err) {
      console.error('❌ [AI] Request failed:', err)
      setError(err instanceof Error ? err.message : 'AI assist failed')
    } finally {
      console.log('⏹️ [AI] Request complete')
      setIsAiLoading(false)
    }
  }

  // Save current step
  const saveStep = async (stepData: any, nextStep: number) => {
    console.log('💾 [SAVE] Saving step...')
    console.log('  🔢 Current step:', currentStep)
    console.log('  ➡️ Next step:', nextStep)
    console.log('  📦 Step data:', stepData)
    
    if (!sessionId) {
      console.error('❌ [SAVE] No session ID!')
      return false
    }
    
    try {
      setIsLoading(true)
      setError(null)
      
      const url = `${API_BASE}/premise-builder/sessions/${sessionId}`
      const requestBody = {
        step: nextStep,
        data: stepData
      }
      console.log('📡 [SAVE] PATCH to:', url)
      console.log('📤 [SAVE] Request body:', requestBody)
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      
      console.log('📡 [SAVE] Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ [SAVE] Error:', errorData)
        throw new Error(errorData.detail || 'Failed to save step')
      }
      
      console.log('✅ [SAVE] Step saved successfully')
      console.log('🔧 [STATE] Advancing to step', nextStep)
      setCurrentStep(nextStep)
      setAiSuggestions(null) // Clear AI suggestions on step change
      return true
    } catch (err) {
      console.error('❌ [SAVE] Save failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to save')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Generate baseline premise (Step 7)
  const generateBaseline = async () => {
    if (!sessionId) return
    
    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE}/premise-builder/sessions/${sessionId}/baseline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      
      if (!response.ok) throw new Error('Failed to generate baseline')
      
      const data = await response.json()
      setBaselinePremise(data.baseline_premise.content)
      setCurrentStep(8)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate baseline')
    } finally {
      setIsLoading(false)
    }
  }

  // Generate premium premise (Step 8)
  const generatePremium = async () => {
    if (!sessionId) return
    
    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE}/premise-builder/sessions/${sessionId}/premium`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      
      if (!response.ok) throw new Error('Failed to generate premium')
      
      const data = await response.json()
      setPremiumPremise(data.premium_premise.content)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate premium')
    } finally {
      setIsLoading(false)
    }
  }

  // Complete session and create project
  const completeSession = async () => {
    if (!sessionId || !premiumPremise) return
    
    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE}/premise-builder/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accept_premise: true })
      })
      
      if (!response.ok) throw new Error('Failed to complete session')
      
      const data = await response.json()
      // Navigate to the new project
      navigate(`/projects/${data.project_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete')
    } finally {
      setIsLoading(false)
    }
  }

  // ==================== STEP RENDERERS ====================

  const renderStep0 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">What Genre(s) Are You Writing?</h2>
        <p className="text-gray-400">Pick your main genre, then AI can help brainstorm story ideas</p>
      </div>

      {genresError && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-400">
          Failed to load genres: {genresError instanceof Error ? genresError.message : 'Unknown error'}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Primary Genre <span className="text-red-400">*</span>
            </label>
            <select
              value={primaryGenre}
              onChange={(e) => setPrimaryGenre(e.target.value)}
              disabled={genresLoading}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <option value="">{genresLoading ? 'Loading genres...' : 'Select your main genre...'}</option>
              {genresData?.map((g: any) => (
                <option key={g.name} value={g.name}>{g.name}</option>
              ))}
            </select>
            {genresLoading && <p className="text-sm text-gray-500 mt-1">Loading {genresData?.length || 0} genres...</p>}
            {!genresLoading && genresData && <p className="text-xs text-gray-500 mt-1">{genresData.length} genres available</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Secondary Genre (Optional)
            </label>
            <select
              value={secondaryGenre}
              onChange={(e) => setSecondaryGenre(e.target.value)}
              disabled={genresLoading || !primaryGenre}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <option value="">None (single genre)</option>
              {genresData?.filter((g: any) => g.name !== primaryGenre).map((g: any) => (
                <option key={g.name} value={g.name}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>

        {primaryGenre && genresData && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Subgenres (Optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {genresData
                .find((g: any) => g.name === primaryGenre)
                ?.subgenres?.map((sub: string) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => {
                      if (subgenres.includes(sub)) {
                        setSubgenres(subgenres.filter(s => s !== sub))
                      } else {
                        setSubgenres([...subgenres, sub])
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      subgenres.includes(sub)
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
            </div>
            {subgenres.length > 0 && (
              <p className="text-sm text-gray-400 mt-2">
                Selected: {subgenres.join(', ')}
              </p>
            )}
          </div>
        )}

        {/* Comedy Elements Section */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Comedy Elements (Optional, max 3) 🎭
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Select up to 3 comedic styles to incorporate into story ideas
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              'Slapstick',
              'Witty Banter',
              'Situational Comedy',
              'Absurdism',
              'Satire',
              'Parody',
              'Dark Comedy',
              'Romantic Comedy',
              'Fish Out of Water',
              'Mistaken Identity',
              'Farce',
              'Deadpan Humor',
              'Physical Comedy',
              'Wordplay/Puns',
              'Irony',
              'Social Comedy',
              'Screwball Comedy',
              'Cringe Comedy',
              'Character Comedy',
              'Running Gags'
            ].map((element) => (
              <button
                key={element}
                type="button"
                onClick={() => {
                  if (comedyElements.includes(element)) {
                    setComedyElements(comedyElements.filter(e => e !== element))
                  } else if (comedyElements.length < 3) {
                    setComedyElements([...comedyElements, element])
                  }
                }}
                disabled={!comedyElements.includes(element) && comedyElements.length >= 3}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  comedyElements.includes(element)
                    ? 'bg-orange-600 text-white'
                    : comedyElements.length >= 3
                    ? 'bg-gray-900 text-gray-600 cursor-not-allowed'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
                title={!comedyElements.includes(element) && comedyElements.length >= 3 ? 'Maximum 3 elements' : ''}
              >
                {element}
              </button>
            ))}
          </div>
          {comedyElements.length > 0 && (
            <p className="text-sm text-gray-400 mt-2">
              Selected ({comedyElements.length}/3): {comedyElements.join(', ')}
            </p>
          )}
        </div>
      </div>

      {primaryGenre && (
        <>
          {/* AI Brainstorm Section - Only shows after genre selected */}
          <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-700 rounded-lg p-6 animate-fade-in">
            <div className="flex items-start gap-4">
              <span className="text-4xl">🤖</span>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">AI Story Brainstorming</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Based on <span className="text-blue-400 font-medium">{primaryGenre}</span>
                  {secondaryGenre && <span> + <span className="text-purple-400 font-medium">{secondaryGenre}</span></span>}, 
                  AI can generate story concepts, title ideas, and premise suggestions for you.
                </p>
                <textarea
                  rows={2}
                  placeholder={`Any specific elements? (e.g., "with aliens", "set in Amish country", "cozy mystery vibe") or leave blank for surprise`}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3"
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={async () => {
                      console.log('AI Brainstorm clicked!', { primaryGenre, secondaryGenre, comedyElements })
                      await requestAIAssist('brainstorm_concept', { 
                        primary_genre: primaryGenre, 
                        secondary_genre: secondaryGenre,
                        comedy_elements: comedyElements,
                        seed: 'Generate creative novel concept based on selected genres'
                      })
                    }}
                    disabled={isAiLoading}
                    className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-all font-medium flex items-center justify-center gap-2"
                  >
                    {isAiLoading ? (
                      <>
                        <span className="animate-spin">⏳</span> Generating...
                      </>
                    ) : (
                      <>
                        <span>✨</span> Generate Ideas
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={async () => {
                      console.log('Subgenre Mashup clicked!', { primaryGenre, subgenres, comedyElements })
                      await requestAIAssist('mashup_subgenres', { 
                        primary_genre: primaryGenre, 
                        subgenres: subgenres,
                        comedy_elements: comedyElements,
                        seed: `Create wild mashup concepts combining these ${primaryGenre} subgenres: ${subgenres.join(', ')}`
                      })
                    }}
                    disabled={isAiLoading || subgenres.length < 2}
                    className="px-4 py-3 bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-700 hover:to-orange-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-all font-medium flex items-center justify-center gap-2"
                    title={subgenres.length < 2 ? 'Select 2+ subgenres to mashup' : 'Mashup selected subgenres'}
                  >
                    {isAiLoading ? (
                      <>
                        <span className="animate-spin">⏳</span> Mashing...
                      </>
                    ) : (
                      <>
                        <span>🎭</span> Mashup Subgenres {subgenres.length > 0 && `(${subgenres.length})`}
                      </>
                    )}
                  </button>
                </div>
                
                {/* Show AI suggestions inline */}
                {aiSuggestions && (
                  <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                    <h4 className="font-semibold text-blue-400 mb-2">AI Suggestions:</h4>
                    <div className="text-gray-300 space-y-2">
                      {/* Main suggestion */}
                      <div className="p-3 bg-gray-800 rounded">
                        <p className="whitespace-pre-wrap">{aiSuggestions.suggestion}</p>
                        <button
                          onClick={() => {
                            setLogline(aiSuggestions.suggestion)
                            setAiSuggestions(null)
                          }}
                          className="mt-2 text-sm text-blue-400 hover:text-blue-300"
                        >
                          Use this idea →
                        </button>
                      </div>
                      
                      {/* Alternative suggestions */}
                      {aiSuggestions.alternatives && aiSuggestions.alternatives.length > 0 && (
                        <>
                          <p className="text-sm text-gray-400 mt-3">Alternative ideas:</p>
                          {aiSuggestions.alternatives.map((alt: string, idx: number) => (
                            <div key={idx} className="p-3 bg-gray-800 rounded">
                              <p className="whitespace-pre-wrap">{alt}</p>
                              <button
                                onClick={() => {
                                  setLogline(alt)
                                  setAiSuggestions(null)
                                }}
                                className="mt-2 text-sm text-blue-400 hover:text-blue-300"
                              >
                                Use this idea →
                              </button>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => setAiSuggestions(null)}
                      className="mt-3 text-sm text-gray-400 hover:text-gray-300"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Manual Entry Section */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-800 text-gray-400">Or skip AI and enter your own idea</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project Title <span className="text-gray-500">(optional - can be changed later)</span>
            </label>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="e.g., Starlight Over Paradise Valley (or leave blank)"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Story Concept / Logline <span className="text-gray-500">(rough idea is fine)</span>
            </label>
            <textarea
              rows={5}
              value={logline}
              onChange={(e) => setLogline(e.target.value)}
              placeholder={`Your ${primaryGenre}${secondaryGenre ? ` / ${secondaryGenre}` : ''} story concept...`}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            <p className="text-gray-500 text-sm mt-2">{logline.length} / 25,000 characters</p>
          </div>
        </>
      )}

      <div className="bg-amber-900/20 border border-amber-700 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h4 className="text-amber-300 font-medium mb-1">How This Works</h4>
            <p className="text-amber-200 text-sm">
              {!primaryGenre ? (
                <>Pick your genre first, then AI can generate targeted story ideas based on what you're writing. Or just enter your own concept!</>
              ) : (
                <>AI will suggest story concepts specifically for {primaryGenre}{secondaryGenre && ` / ${secondaryGenre}`}. You can use them as-is or let them spark your own ideas!</>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={() => navigate('/new')}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={async () => {
            // Validate logline length
            const currentLogline = logline || 'Developing story concept';
            if (currentLogline.length > 25000) {
              setError('Story concept must be 25000 characters or less');
              return;
            }
            
            // First save Step 0 (project stub)
            const step0Success = await saveStep({ 
              title: projectTitle || 'Untitled Project', 
              logline: currentLogline
            }, 0)
            
            // Then save Step 1 (genre profile) and advance to step 2
            if (step0Success) {
              const step1Success = await saveStep({
                primary_genre: primaryGenre,
                secondary_genre: secondaryGenre || undefined,
                subgenres: subgenres,
                audience_rating: 'general'
              }, 1)
              
              // Only advance to next screen if both saves succeeded
              if (step1Success) {
                setCurrentStep(2)
              }
            }
          }}
          disabled={!primaryGenre || isLoading}
          className="px-8 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
        >
          {isLoading ? 'Saving...' : 'Continue →'}
        </button>
      </div>
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Choose Your Genre</h2>
        <p className="text-gray-400">What kind of story are you telling?</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Primary Genre <span className="text-red-400">*</span>
          </label>
          <select
            value={primaryGenre}
            onChange={(e) => setPrimaryGenre(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select genre...</option>
            {genresData?.genres?.map((g: any) => (
              <option key={g.name} value={g.name}>{g.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Secondary Genre (Optional)
          </label>
          <select
            value={secondaryGenre}
            onChange={(e) => setSecondaryGenre(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">None</option>
            {genresData?.genres?.map((g: any) => (
              <option key={g.name} value={g.name}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Audience Rating</label>
        <select
          value={audienceRating}
          onChange={(e) => setAudienceRating(e.target.value)}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="general">General Audience</option>
          <option value="YA">Young Adult</option>
          <option value="adult">Adult</option>
        </select>
      </div>

      <button
        onClick={() => requestAIAssist('suggest_subgenres', { primary_genre: primaryGenre, logline })}
        disabled={!primaryGenre || isAiLoading}
        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <span>🤖</span> {isAiLoading ? 'AI Thinking...' : 'Get AI Genre Suggestions'}
      </button>

      <div className="flex justify-between pt-4">
        <button
          onClick={() => setCurrentStep(0)}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          ← Previous
        </button>
        <button
          onClick={() => saveStep({ 
            genre_profile: { 
              primary_genre: primaryGenre, 
              secondary_genre: secondaryGenre || undefined,
              subgenres, 
              audience_rating: audienceRating 
            } 
          }, 2)}
          disabled={!primaryGenre || isLoading}
          className="px-8 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
        >
          {isLoading ? 'Saving...' : 'Next Step →'}
        </button>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Tone & Themes</h2>
        <p className="text-gray-400">What's the emotional flavor of your story?</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Darkness Level: {darknessLevel}/10
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={darknessLevel}
            onChange={(e) => setDarknessLevel(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Lighthearted</span>
            <span>Grimdark</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Humor Level: {humorLevel}/10
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={humorLevel}
            onChange={(e) => setHumorLevel(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Serious</span>
            <span>Comedic</span>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-300">
            Major Themes (comma-separated)
          </label>
          <button
            onClick={() => requestAIAssist('suggest_themes', { primary_genre: primaryGenre, logline, darkness_level: darknessLevel, humor_level: humorLevel })}
            disabled={isAiLoading}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
          >
            🤖 AI Suggest
          </button>
        </div>
        <input
          type="text"
          value={themes.join(', ')}
          onChange={(e) => setThemes(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
          placeholder="e.g., redemption, found family, power corrupts, identity"
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-300">
            Emotional Journey <span className="text-gray-500 text-xs">(optional)</span>
          </label>
          <button
            onClick={() => requestAIAssist('suggest_emotional_tone', { primary_genre: primaryGenre, themes, darkness_level: darknessLevel })}
            disabled={isAiLoading}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
          >
            🤖 AI Suggest
          </button>
        </div>
        <input
          type="text"
          value={emotionalTone}
          onChange={(e) => setEmotionalTone(e.target.value)}
          placeholder="e.g., 'despair to hope', 'innocence to wisdom', 'isolation to belonging'"
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-300">
            Core Values (comma-separated, optional)
          </label>
          <button
            onClick={() => requestAIAssist('suggest_core_values', { primary_genre: primaryGenre, themes })}
            disabled={isAiLoading}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
          >
            🤖 AI Suggest
          </button>
        </div>
        <input
          type="text"
          value={coreValues.join(', ')}
          onChange={(e) => setCoreValues(e.target.value.split(',').map(v => v.trim()).filter(Boolean))}
          placeholder="e.g., justice, family, freedom, loyalty, truth"
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-300">
            Central Question <span className="text-gray-500 text-xs">(optional)</span>
          </label>
          <button
            onClick={() => requestAIAssist('suggest_central_question', { primary_genre: primaryGenre, themes, logline })}
            disabled={isAiLoading}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
          >
            🤖 AI Suggest
          </button>
        </div>
        <input
          type="text"
          value={centralQuestion}
          onChange={(e) => setCentralQuestion(e.target.value)}
          placeholder="e.g., 'What makes us human?', 'Can love conquer hate?', 'Is revenge ever justified?'"
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-300">
            Atmospheric Elements (comma-separated, optional)
          </label>
          <button
            onClick={() => requestAIAssist('suggest_atmosphere', { primary_genre: primaryGenre, darkness_level: darknessLevel, themes })}
            disabled={isAiLoading}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
          >
            🤖 AI Suggest
          </button>
        </div>
        <input
          type="text"
          value={atmosphericElements.join(', ')}
          onChange={(e) => setAtmosphericElements(e.target.value.split(',').map(a => a.trim()).filter(Boolean))}
          placeholder="e.g., claustrophobic, whimsical, foreboding, ethereal, gritty"
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={() => setCurrentStep(1)} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
          ← Previous
        </button>
        <button
          onClick={() => saveStep({ 
            tone_theme_profile: { 
              tone_adjectives: toneAdjectives, 
              darkness_level: darknessLevel, 
              humor_level: humorLevel, 
              themes,
              emotional_tone: emotionalTone || undefined,
              core_values: coreValues,
              central_question: centralQuestion || undefined,
              atmospheric_elements: atmosphericElements
            } 
          }, 3)}
          disabled={isLoading}
          className="px-8 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
        >
          {isLoading ? 'Saving...' : 'Next Step →'}
        </button>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Characters</h2>
        <p className="text-gray-400">Who's in your story?</p>
      </div>

      <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-3">Protagonist</h3>
        <input
          type="text"
          placeholder="Name"
          value={protagonist?.name || ''}
          onChange={(e) => setProtagonist({ ...(protagonist || { name: '', role: 'protagonist', brief_description: '' }), name: e.target.value })}
          className="w-full px-4 py-2 mb-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500"
        />
        <textarea
          placeholder="Brief description, goal, and flaw..."
          rows={3}
          value={protagonist?.brief_description || ''}
          onChange={(e) => setProtagonist({ ...(protagonist || { name: '', role: 'protagonist', brief_description: '' }), brief_description: e.target.value })}
          className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 resize-none"
        />
      </div>

      <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-3">Antagonist (Optional)</h3>
        <input
          type="text"
          placeholder="Name"
          value={antagonist?.name || ''}
          onChange={(e) => setAntagonist({ ...(antagonist || { name: '', role: 'antagonist', brief_description: '' }), name: e.target.value })}
          className="w-full px-4 py-2 mb-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500"
        />
        <textarea
          placeholder="What makes them oppose the protagonist?"
          rows={2}
          value={antagonist?.brief_description || ''}
          onChange={(e) => setAntagonist({ ...(antagonist || { name: '', role: 'antagonist', brief_description: '' }), brief_description: e.target.value })}
          className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 resize-none"
        />
      </div>

      <button
        onClick={() => requestAIAssist('expand_character', { character_seed: protagonist, genre: primaryGenre })}
        disabled={!protagonist?.name || isAiLoading}
        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <span>🤖</span> {isAiLoading ? 'AI Thinking...' : 'Expand Protagonist with AI'}
      </button>

      <div className="flex justify-between pt-4">
        <button onClick={() => setCurrentStep(2)} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
          ← Previous
        </button>
        <button
          onClick={() => saveStep({ 
            character_seeds: { 
              protagonist: protagonist || undefined, 
              antagonist: antagonist || undefined, 
              supporting_cast: supportingCast 
            } 
          }, 4)}
          disabled={!protagonist?.name || isLoading}
          className="px-8 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
        >
          {isLoading ? 'Saving...' : 'Next Step →'}
        </button>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Plot Intent</h2>
        <p className="text-gray-400">What's the core story?</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Central Conflict <span className="text-red-400">*</span>
        </label>
        <textarea
          rows={3}
          value={centralConflict}
          onChange={(e) => setCentralConflict(e.target.value)}
          placeholder="What's the main problem your protagonist must solve?"
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Stakes <span className="text-red-400">*</span>
        </label>
        <textarea
          rows={2}
          value={stakes}
          onChange={(e) => setStakes(e.target.value)}
          placeholder="What happens if they fail?"
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Key Story Beats (comma-separated)
        </label>
        <textarea
          rows={3}
          value={keyStoryBeats.join(', ')}
          onChange={(e) => setKeyStoryBeats(e.target.value.split(',').map(b => b.trim()).filter(Boolean))}
          placeholder="e.g., meet-cute, first challenge, betrayal, climax"
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
        />
      </div>

      <button
        onClick={() => requestAIAssist('suggest_plot_beats', { genre: primaryGenre, conflict: centralConflict, characters: { protagonist, antagonist } })}
        disabled={!centralConflict || isAiLoading}
        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <span>🤖</span> {isAiLoading ? 'AI Thinking...' : 'Get AI Plot Suggestions'}
      </button>

      <div className="flex justify-between pt-4">
        <button onClick={() => setCurrentStep(3)} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
          ← Previous
        </button>
        <button
          onClick={() => saveStep({ 
            plot_intent: { 
              central_conflict: centralConflict, 
              stakes, 
              key_story_beats: keyStoryBeats, 
              planned_twists: plannedTwists 
            } 
          }, 5)}
          disabled={!centralConflict || !stakes || isLoading}
          className="px-8 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
        >
          {isLoading ? 'Saving...' : 'Next Step →'}
        </button>
      </div>
    </div>
  )

  const renderStep5 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Structure</h2>
        <p className="text-gray-400">Technical specifications</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Target Word Count
          </label>
          <input
            type="number"
            value={targetWordCount}
            onChange={(e) => setTargetWordCount(Number(e.target.value))}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Target Chapter Count
          </label>
          <input
            type="number"
            value={targetChapterCount}
            onChange={(e) => setTargetChapterCount(Number(e.target.value))}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">POV Style</label>
          <select
            value={povStyle}
            onChange={(e) => setPovStyle(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="first_person_single">First Person (Single)</option>
            <option value="first_person_multi">First Person (Multiple)</option>
            <option value="third_person_limited">Third Person Limited</option>
            <option value="third_person_omniscient">Third Person Omniscient</option>
            <option value="alternating">Alternating</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Tense</label>
          <select
            value={tense}
            onChange={(e) => setTense(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="past">Past Tense</option>
            <option value="present">Present Tense</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Pacing Preference</label>
        <select
          value={pacingPreference}
          onChange={(e) => setPacingPreference(e.target.value)}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="fast">Fast (Action-packed)</option>
          <option value="moderate">Moderate (Balanced)</option>
          <option value="slow">Slow (Contemplative)</option>
        </select>
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={() => setCurrentStep(4)} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
          ← Previous
        </button>
        <button
          onClick={() => saveStep({ 
            structure_targets: { 
              target_word_count: targetWordCount, 
              target_chapter_count: targetChapterCount, 
              pov_style: povStyle, 
              tense, 
              pacing_preference: pacingPreference 
            } 
          }, 6)}
          disabled={isLoading}
          className="px-8 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
        >
          {isLoading ? 'Saving...' : 'Next Step →'}
        </button>
      </div>
    </div>
  )

  const renderStep6 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Constraints</h2>
        <p className="text-gray-400">Any must-haves or must-avoids?</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Content Warnings (comma-separated)
        </label>
        <input
          type="text"
          value={contentWarnings.join(', ')}
          onChange={(e) => setContentWarnings(e.target.value.split(',').map(w => w.trim()).filter(Boolean))}
          placeholder="e.g., violence, language"
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Must-Have Scenes (comma-separated)
        </label>
        <textarea
          rows={2}
          value={mustHaveScenes.join(', ')}
          onChange={(e) => setMustHaveScenes(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
          placeholder="e.g., banjo serenade scene, spaceship reveal"
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Must-Avoid Elements (comma-separated)
        </label>
        <input
          type="text"
          value={mustAvoidElements.join(', ')}
          onChange={(e) => setMustAvoidElements(e.target.value.split(',').map(e => e.trim()).filter(Boolean))}
          placeholder="e.g., love triangles, deus ex machina"
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={() => setCurrentStep(5)} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
          ← Previous
        </button>
        <button
          onClick={() => saveStep({ 
            constraints_profile: { 
              content_warnings: contentWarnings, 
              must_have_scenes: mustHaveScenes, 
              must_avoid_elements: mustAvoidElements 
            } 
          }, 7)}
          disabled={isLoading}
          className="px-8 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
        >
          {isLoading ? 'Saving...' : 'Generate Baseline →'}
        </button>
      </div>
    </div>
  )

  const renderStep7 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Baseline Premise</h2>
        <p className="text-gray-400">AI-generated synthesis using GPT-4o</p>
      </div>

      {!baselinePremise ? (
        <div className="text-center py-12">
          <button
            onClick={generateBaseline}
            disabled={isLoading}
            className="px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-all font-semibold text-lg"
          >
            {isLoading ? '⏳ Generating Baseline Premise...' : '✨ Generate Baseline Premise'}
          </button>
        </div>
      ) : (
        <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
          <div className="prose prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-gray-300">{baselinePremise}</pre>
          </div>
        </div>
      )}

      {baselinePremise && (
        <div className="flex justify-between pt-4">
          <button onClick={generateBaseline} disabled={isLoading} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
            🔄 Regenerate
          </button>
          <button
            onClick={() => setCurrentStep(8)}
            className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
          >
            Continue to Premium →
          </button>
        </div>
      )}
    </div>
  )

  const renderStep8 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Premium Premise</h2>
        <p className="text-gray-400">Enhanced version using Claude Sonnet 4.5</p>
      </div>

      {!premiumPremise ? (
        <div className="text-center py-12">
          <button
            onClick={generatePremium}
            disabled={isLoading}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-all font-semibold text-lg"
          >
            {isLoading ? '⏳ Generating Premium Premise...' : '✨ Generate Premium Premise'}
          </button>
        </div>
      ) : (
        <div className="bg-gray-900/50 p-6 rounded-lg border border-purple-700">
          <div className="prose prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-gray-300">{premiumPremise}</pre>
          </div>
        </div>
      )}

      {premiumPremise && (
        <div className="flex justify-between pt-4">
          <button onClick={generatePremium} disabled={isLoading} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
            🔄 Regenerate
          </button>
          <button
            onClick={completeSession}
            disabled={isLoading}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
          >
            {isLoading ? 'Creating Project...' : '✓ Accept & Create Project'}
          </button>
        </div>
      )}
    </div>
  )

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return renderStep0()
      case 1: return renderStep1()
      case 2: return renderStep2()
      case 3: return renderStep3()
      case 4: return renderStep4()
      case 5: return renderStep5()
      case 6: return renderStep6()
      case 7: return renderStep7()
      case 8: return renderStep8()
      default: return null
    }
  }

  // Show loading screen during initial session setup
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
          <p className="text-gray-400">Loading Premise Builder...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 px-8 py-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">Guided Premise Builder</h1>
                <p className="text-gray-400 text-sm">
                  Create your novel premise step-by-step with AI assistance
                  {sessionId && currentStep > 0 && (
                    <span className="ml-2 text-green-400">• Progress auto-saved</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {sessionId && currentStep > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('Start a fresh session? This will clear your current progress.')) {
                        localStorage.removeItem('premiseBuilderSessionId')
                        window.location.reload()
                      }
                    }}
                    className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Start Fresh
                  </button>
                )}
                <button
                  onClick={() => navigate('/new')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Exit Builder
                </button>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-colors ${
                        currentStep === step.number
                          ? 'bg-primary-600 text-white ring-4 ring-primary-600/30'
                          : currentStep > step.number
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {currentStep > step.number ? '✓' : step.icon}
                    </div>
                    <span className={`text-xs mt-2 ${currentStep === step.number ? 'text-white font-medium' : 'text-gray-500'}`}>
                      {step.name}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-2 mb-6 ${currentStep > step.number ? 'bg-green-600' : 'bg-gray-700'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-4xl mx-auto px-8 py-8">
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
            {error && (
              <div className="mb-6 bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-400">
                {error}
              </div>
            )}
            {renderStepContent()}
          </div>
        </div>
      </div>

      {/* AI Assistant Sidebar */}
      {aiSuggestions && (
        <div className="w-96 bg-gray-800 border-l border-gray-700 p-6 overflow-y-auto">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <span>🤖</span> AI Suggestions
            </h3>
            <p className="text-xs text-gray-500">Click items to select, then "Use Selected"</p>
          </div>

          <div className="space-y-2 mb-4">
            {/* Parse and display all suggestions as clickable boxes */}
            {(() => {
              const allSuggestions: string[] = []
              
              // Parse main suggestion
              const mainParsed = parseListSuggestion(aiSuggestions.suggestion)
              allSuggestions.push(...mainParsed)
              
              // Parse alternatives
              if (aiSuggestions.alternatives && aiSuggestions.alternatives.length > 0) {
                aiSuggestions.alternatives.forEach(alt => {
                  const altParsed = parseListSuggestion(alt)
                  allSuggestions.push(...altParsed)
                })
              }
              
              // Remove duplicates
              const uniqueSuggestions = Array.from(new Set(allSuggestions))
              
              return uniqueSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleSuggestion(suggestion)}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                    selectedSuggestions.includes(suggestion)
                      ? 'bg-primary-600/20 border-primary-500 text-white'
                      : 'bg-gray-900/50 border-gray-700 text-gray-300 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedSuggestions.includes(suggestion)
                        ? 'bg-primary-600 border-primary-500'
                        : 'border-gray-600'
                    }`}>
                      {selectedSuggestions.includes(suggestion) && (
                        <span className="text-white text-xs">✓</span>
                      )}
                    </div>
                    <span className="text-sm leading-relaxed">{suggestion}</span>
                  </div>
                </button>
              ))
            })()}
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-4 border-t border-gray-700">
            {selectedSuggestions.length > 0 && (
              <div className="bg-primary-900/30 border border-primary-700 rounded-lg p-3 mb-2">
                <p className="text-xs text-primary-300 mb-1">{selectedSuggestions.length} selected:</p>
                <p className="text-sm text-white">{selectedSuggestions.join(', ')}</p>
              </div>
            )}
            <button
              onClick={() => {
                if (selectedSuggestions.length > 0) {
                  useSuggestion(selectedSuggestions, assistFieldType)
                  setAiSuggestions(null)
                  setSelectedSuggestions([])
                  setAssistFieldType(null)
                }
              }}
              disabled={selectedSuggestions.length === 0}
              className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              Use Selected ({selectedSuggestions.length})
            </button>
            <button
              onClick={() => {
                setAiSuggestions(null)
                setAssistFieldType(null)
                setSelectedSuggestions([])
              }}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
