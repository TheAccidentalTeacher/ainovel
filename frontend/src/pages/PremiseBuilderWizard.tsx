import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

// ==================== COMEDY ELEMENT DEFINITIONS ====================

const COMEDY_ELEMENTS = {
  'Slapstick': {
    definition: 'Physical, exaggerated comedy with pratfalls, collisions, and visual gags',
    examples: ['Character slips on banana peel during important moment', 'Chain reaction of physical mishaps', 'Comedic fight sequences with exaggerated movements']
  },
  'Witty Banter': {
    definition: 'Quick, clever exchanges of dialogue with wordplay and verbal sparring',
    examples: ['Rapid-fire quips between rivals', 'Flirtatious verbal dueling', 'Sarcastic comebacks that reveal character intelligence']
  },
  'Situational Comedy': {
    definition: 'Humor arising from awkward, ironic, or absurd situations',
    examples: ['Wrong person overhears private conversation', 'Character stuck in compromising position', 'Misunderstanding escalates into chaos']
  },
  'Absurdism': {
    definition: 'Illogical, nonsensical events that defy normal reality',
    examples: ['Animal behaves like human bureaucrat', 'Impossible coincidences stack up', 'Surreal logic drives plot forward']
  },
  'Satire': {
    definition: 'Humor used to criticize or expose flaws in society, institutions, or human nature',
    examples: ['Church committee meeting devolves into petty politics', 'Exaggerated portrayal of cultural stereotypes', 'Social customs taken to ridiculous extremes']
  },
  'Parody': {
    definition: 'Humorous imitation of specific works, genres, or styles',
    examples: ['Biblical epic reimagined as buddy cop movie', 'Romance novel tropes deliberately overplayed', 'Genre conventions inverted for comic effect']
  },
  'Dark Comedy': {
    definition: 'Humor derived from morbid, taboo, or disturbing subjects',
    examples: ['Characters joke during crisis', 'Gallows humor in dire situations', 'Inappropriate levity amid tragedy']
  },
  'Romantic Comedy': {
    definition: 'Comedy centered on romantic misunderstandings and relationship mishaps',
    examples: ['Mistaken assumptions about relationship status', 'Awkward first date disasters', 'Love triangle miscommunications']
  },
  'Fish Out of Water': {
    definition: 'Comedy from character struggling in unfamiliar environment',
    examples: ['City slicker navigating farm life', 'Time traveler misunderstanding modern customs', 'Outsider violating cultural norms innocently']
  },
  'Mistaken Identity': {
    definition: 'Confusion and chaos from characters being misidentified',
    examples: ['Twin swap leads to complications', 'Character impersonates authority figure', 'Wrong person receives important message']
  },
  'Farce': {
    definition: 'Fast-paced comedy with improbable situations, exaggeration, and physical humor',
    examples: ['Increasingly complex web of lies', 'Characters hiding in closets/under beds', 'Perfectly timed entrances and exits']
  },
  'Deadpan Humor': {
    definition: 'Comedy delivered with serious expression, without showing amusement',
    examples: ['Character describes absurdity matter-of-factly', 'Dry observations on chaotic situations', 'Understated reactions to outrageous events']
  },
  'Physical Comedy': {
    definition: 'Humor based on body movements, facial expressions, and physical actions',
    examples: ['Exaggerated double-takes and reactions', 'Comedic timing in physical movements', 'Visual gags without dialogue']
  },
  'Wordplay/Puns': {
    definition: 'Humor from clever use of language, double meanings, and word games',
    examples: ['Character names with humorous double meanings', 'Puns based on religious terminology', 'Malapropisms and misheard phrases']
  },
  'Irony': {
    definition: 'Humor from contrast between expectation and reality',
    examples: ['Self-righteous character revealed as hypocrite', 'Character\'s plan backfires spectacularly', 'Opposite of intended outcome occurs']
  },
  'Social Comedy': {
    definition: 'Humor from social interactions, class differences, and cultural clashes',
    examples: ['Awkward social gatherings', 'Etiquette violations causing embarrassment', 'Cultural misunderstandings']
  },
  'Screwball Comedy': {
    definition: 'Fast-paced, witty, eccentric comedy with strong romantic elements',
    examples: ['Zany situations spiraling out of control', 'Battle-of-sexes banter', 'Eccentric characters driving plot chaos']
  },
  'Cringe Comedy': {
    definition: 'Uncomfortable humor from embarrassing or socially awkward situations',
    examples: ['Character unknowingly humiliates self', 'Public faux pas witnessed by all', 'Secondhand embarrassment moments']
  },
  'Character Comedy': {
    definition: 'Humor arising from character\'s personality, quirks, or behavior patterns',
    examples: ['Obsessive character\'s rituals cause problems', 'Personality clash between opposites', 'Character\'s flaw creates recurring comedy']
  },
  'Running Gags': {
    definition: 'Repeated joke or humorous element throughout the story',
    examples: ['Character always interrupted at same moment', 'Catchphrase in various contexts', 'Recurring mishap with escalating consequences']
  }
} as const

// ==================== DARKNESS/HUMOR LEVEL DEFINITIONS ====================

const DARKNESS_LEVELS: Record<number, { label: string; description: string; aiGuidance: string }> = {
  1: {
    label: 'Pure Lighthearted',
    description: 'No real stakes or danger. Everything works out perfectly.',
    aiGuidance: 'Conflicts resolve easily, minimal tension, feel-good throughout'
  },
  2: {
    label: 'Mostly Cheerful',
    description: 'Minor obstacles and light conflicts. Optimistic tone.',
    aiGuidance: 'Small challenges that build character, gentle emotional beats'
  },
  3: {
    label: 'Lightly Serious',
    description: 'Some real problems but nothing too heavy. Hopeful overall.',
    aiGuidance: 'Meaningful conflicts with low real danger, uplifting resolution'
  },
  4: {
    label: 'Gentle Drama',
    description: 'Personal struggles and emotional challenges. Some tension.',
    aiGuidance: 'Emotional depth without trauma, relationships tested but not broken'
  },
  5: {
    label: 'Balanced',
    description: 'Equal mix of light and dark. Real stakes with hope.',
    aiGuidance: 'Authentic challenges, earned victories, bittersweet moments possible'
  },
  6: {
    label: 'Moderately Dark',
    description: 'Significant challenges and losses. Some characters may suffer.',
    aiGuidance: 'Real consequences, difficult choices, some pain but not overwhelming'
  },
  7: {
    label: 'Notably Dark',
    description: 'Heavy themes, moral complexity, characters face real danger.',
    aiGuidance: 'Trauma possible, morally gray situations, victories come with cost'
  },
  8: {
    label: 'Very Dark',
    description: 'Grim situations, significant suffering, high body count possible.',
    aiGuidance: 'Brutal realism, characters broken and changed, hope is fragile'
  },
  9: {
    label: 'Grimdark',
    description: 'Bleak worldview, pervasive suffering, minimal hope.',
    aiGuidance: 'Nihilistic elements, pyrrhic victories, goodness is rare and costly'
  },
  10: {
    label: 'Maximum Darkness',
    description: 'Relentlessly grim. No one escapes unscathed. Hope may be absent.',
    aiGuidance: 'Unflinching brutality, systemic evil, survival is the only victory'
  }
}

const HUMOR_LEVELS: Record<number, { label: string; description: string; aiGuidance: string }> = {
  1: {
    label: 'Deadly Serious',
    description: 'No humor whatsoever. Grave and solemn throughout.',
    aiGuidance: 'Zero comedic relief, tension never breaks, characters don\'t joke'
  },
  2: {
    label: 'Mostly Serious',
    description: 'Rare light moments but predominantly earnest.',
    aiGuidance: 'Occasional wry observation, but humor is fleeting and dry'
  },
  3: {
    label: 'Lightly Earnest',
    description: 'Sincere tone with subtle wit occasionally.',
    aiGuidance: 'Understated humor, characters may smile but rarely laugh'
  },
  4: {
    label: 'Gentle Humor',
    description: 'Warm, mild humor. Comfortable chuckles.',
    aiGuidance: 'Situational comedy, gentle teasing, wholesome funny moments'
  },
  5: {
    label: 'Balanced',
    description: 'Healthy mix of serious and funny. Natural humor.',
    aiGuidance: 'Comedy emerges organically from character/situation, not forced'
  },
  6: {
    label: 'Moderately Funny',
    description: 'Frequent humor. Characters crack jokes regularly.',
    aiGuidance: 'Witty banter, comedic subplots, laugh-out-loud moments'
  },
  7: {
    label: 'Very Humorous',
    description: 'Comedy is central. Most scenes have funny elements.',
    aiGuidance: 'Running gags, comedic set pieces, even serious moments have levity'
  },
  8: {
    label: 'Predominantly Comedy',
    description: 'Humor drives the story. Serious moments are rare.',
    aiGuidance: 'Constant jokes, physical comedy, characters are comedic archetypes'
  },
  9: {
    label: 'Farcical',
    description: 'Over-the-top comedy. Ridiculous situations everywhere.',
    aiGuidance: 'Absurd scenarios, slapstick dominates, reality takes a backseat'
  },
  10: {
    label: 'Pure Comedy',
    description: 'Non-stop hilarity. Every scene is a comedic setup.',
    aiGuidance: 'Maximalist humor, no sincere moments, everything is a punchline'
  }
}

// ==================== SUBGENRE DEFINITIONS ====================

const SUBGENRE_DEFINITIONS: Record<string, string> = {
  // Christian subgenres
  'Christian Romance': 'Faith-centered love stories emphasizing spiritual growth alongside romantic development',
  'Christian Historical Fiction': 'Stories set in past eras that explore faith within historical contexts',
  'Christian Contemporary': 'Modern-day stories addressing current issues through a Christian worldview',
  'Christian Suspense/Thriller': 'High-stakes mysteries or thrillers with faith-based themes and moral dilemmas',
  'Christian Fantasy': 'Imaginative worlds with allegorical or explicit Christian themes and symbolism',
  'Christian Science Fiction': 'Speculative fiction exploring faith, ethics, and theology in futuristic or alternate settings',
  'Amish Fiction': 'Stories set in Amish communities exploring simple living, faith, and cultural tensions',
  'Biblical Fiction': 'Fictionalized retellings or expansions of biblical narratives and characters',
  'Christian Mystery': 'Whodunit stories where faith and moral reasoning guide the investigation',
  'Inspirational Fiction': 'Uplifting stories demonstrating hope, redemption, and spiritual transformation',
  
  // Romance subgenres
  'Contemporary Romance': 'Modern-day love stories with current social contexts and realistic settings',
  'Historical Romance': 'Romantic stories set in past eras with period-appropriate customs and conflicts',
  'Paranormal Romance': 'Love stories featuring supernatural elements like vampires, werewolves, or magic',
  'Romantic Suspense': 'Romance intertwined with mystery, danger, and thriller elements',
  'Fantasy Romance': 'Love stories in magical worlds with mythical creatures and supernatural powers',
  'Science Fiction Romance': 'Romantic relationships explored in futuristic, space, or alternate reality settings',
  'Erotic Romance': 'Sexually explicit romantic stories with detailed intimate scenes',
  'Sweet/Clean Romance': 'G-rated romance focusing on emotional connection without explicit content',
  'LGBTQ+ Romance': 'Love stories centered on LGBTQ+ characters and relationships',
  'Sports Romance': 'Romance featuring athletes or set in competitive sports worlds',
  'Billionaire Romance': 'Love stories with wealthy, powerful protagonists and luxury settings',
  'Enemies to Lovers': 'Romance arising from initial antagonism or rivalry between characters',
  'Second Chance Romance': 'Former lovers reuniting and rebuilding their relationship',
  'Fake Relationship': 'Romance developing from pretend dating or marriage of convenience',
  
  // Mystery subgenres
  'Cozy Mystery': 'Lighthearted whodunits in small towns with amateur sleuths and minimal violence',
  'Hard-Boiled': 'Gritty crime fiction with cynical detectives in corrupt urban settings',
  'Police Procedural': 'Realistic crime-solving following law enforcement methods and protocols',
  'Amateur Detective': 'Non-professionals solving crimes through curiosity and cleverness',
  'Historical Mystery': 'Mysteries set in past eras with period-appropriate investigation methods',
  'Paranormal Mystery': 'Supernatural elements aid or complicate the mystery investigation',
  
  // Thriller subgenres
  'Psychological Thriller': 'Mind-games and manipulation creating suspense through mental tension',
  'Legal Thriller': 'Courtroom drama and legal maneuvering drive the high-stakes plot',
  'Medical Thriller': 'Healthcare settings with disease outbreaks, medical conspiracies, or ethical dilemmas',
  'Techno-Thriller': 'Technology, cybersecurity, or scientific advances create the primary threat',
  'Spy Thriller': 'Espionage, covert operations, and international intrigue',
  'Action Thriller': 'Fast-paced physical confrontations, chases, and explosive set-pieces',
  
  // Fantasy subgenres
  'Epic Fantasy': 'Grand-scale adventures with world-threatening stakes and complex magic systems',
  'Urban Fantasy': 'Magic and mythical creatures exist secretly in modern cities',
  'High Fantasy': 'Entirely invented worlds with unique rules, races, and magical systems',
  'Dark Fantasy': 'Fantasy with horror elements, morally ambiguous characters, and grim tone',
  'Sword and Sorcery': 'Adventure-focused fantasy with combat, magic, and heroic protagonists',
  'Portal Fantasy': 'Characters travel from real world to magical realm',
  'Fairy Tale Retelling': 'Classic fairy tales reimagined with new twists or perspectives',
  
  // Science Fiction subgenres
  'Space Opera': 'Grand adventures across galaxies with interstellar politics and epic battles',
  'Cyberpunk': 'High-tech dystopias with hackers, corporate control, and urban decay',
  'Dystopian': 'Oppressive future societies exploring themes of control, rebellion, and survival',
  'Time Travel': 'Stories exploring paradoxes and consequences of moving through time',
  'First Contact': 'Humanity\'s initial encounter with alien civilizations',
  'Military Sci-Fi': 'Space or future warfare with military culture and combat tactics',
  'Hard Science Fiction': 'Scientifically accurate speculation grounded in real physics and technology',
  'Post-Apocalyptic': 'Survival and rebuilding after civilization-ending catastrophe',
  
  // Horror subgenres
  'Gothic Horror': 'Atmospheric dread in old buildings with family secrets and supernatural elements',
  'Psychological Horror': 'Terror from mental instability, paranoia, and questioning reality',
  'Cosmic Horror': 'Incomprehensible entities and existential dread beyond human understanding',
  'Supernatural Horror': 'Ghosts, demons, or otherworldly entities causing fear',
  'Body Horror': 'Physical transformation, mutation, or violation of the human form',
  'Survival Horror': 'Life-or-death situations with scarce resources and constant threat'
}

// ==================== TYPE DEFINITIONS ====================

// interface PremiseSession {
//   session_id: string
//   current_step: number
//   status: string
//   project_stub?: ProjectStub
//   genre_profile?: GenreProfile
//   tone_theme_profile?: ToneThemeProfile
//   character_seeds?: CharacterSeeds
//   plot_intent?: PlotIntent
//   structure_targets?: StructureTargets
//   constraints_profile?: ConstraintsProfile
//   baseline_premise?: any
//   premium_premise?: any
// }

export interface ProjectStub {
  title: string
  folder?: string
  logline: string
}

export interface GenreProfile {
  primary_genre: string
  secondary_genre?: string
  subgenres: string[]
  audience_rating: string
}

export interface ToneThemeProfile {
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

export interface CharacterSeeds {
  protagonist?: CharacterSeed
  antagonist?: CharacterSeed
  supporting_cast: CharacterSeed[]
}

export interface PlotIntent {
  primary_conflict: string
  conflict_types: string[]
  stakes: string
  stakes_layers: string[]
  inciting_incident?: string
  first_plot_point?: string
  midpoint_shift?: string
  second_plot_point?: string
  climax_confrontation?: string
  resolution?: string
  key_story_beats: string[]
  emotional_beats: string[]
  ending_vibe: string
  final_image?: string
  romantic_subplot?: string
  secondary_subplot?: string
  thematic_subplot?: string
  additional_subplots: string[]
  major_twists: string[]
  red_herrings: string[]
  tension_escalation?: string
  pacing_notes?: string
}

export interface StructureTargets {
  target_word_count: number
  target_chapter_count?: number
  pov_style: string
  tense: string
  pacing_preference: string
}

export interface ConstraintsProfile {
  tropes_to_include?: string[]
  tropes_to_avoid?: string[]
  content_warnings?: string[]
  content_restrictions?: string[]
  must_have_scenes?: string[]
  faith_elements?: string
  cultural_considerations?: string
}

interface AIAssistResponse {
  suggestion: string
  alternatives: string[]
  tokens_used: number
}

const API_BASE = '/api'

interface SaveStepOptions {
  suppressAdvance?: boolean
}

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
  const [folder, setFolder] = useState('')
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
  const [atmosphericElementsInput, setAtmosphericElementsInput] = useState('')
  const [heatLevel] = useState('')
  
  const [protagonist, setProtagonist] = useState<CharacterSeed | null>(null)
  const [antagonist, setAntagonist] = useState<CharacterSeed | null>(null)
  const [supportingCast, setSupportingCast] = useState<CharacterSeed[]>([])
  const [suggestedCharacters, setSuggestedCharacters] = useState<CharacterSeed[]>([])
  const [expandingCharacter, setExpandingCharacter] = useState<string | null>(null)
  
  // Plot Step 4 - Comprehensive Plot Structure
  const [primaryConflict, setPrimaryConflict] = useState('')
  const [conflictTypes, setConflictTypes] = useState<string[]>([])
  const [stakes, setStakes] = useState('')
  const [stakesLayers, setStakesLayers] = useState<string[]>([])
  const [incitingIncident, setIncitingIncident] = useState('')
  const [firstPlotPoint, setFirstPlotPoint] = useState('')
  const [midpointShift, setMidpointShift] = useState('')
  const [secondPlotPoint, setSecondPlotPoint] = useState('')
  const [climaxConfrontation, setClimaxConfrontation] = useState('')
  const [resolution, setResolution] = useState('')
  const [keyStoryBeats, setKeyStoryBeats] = useState<string[]>([])
  const [emotionalBeats, setEmotionalBeats] = useState<string[]>([])
  const [endingVibe, setEndingVibe] = useState('hopeful')
  const [finalImage, setFinalImage] = useState('')
  const [romanticSubplot, setRomanticSubplot] = useState('')
  const [secondarySubplot, setSecondarySubplot] = useState('')
  const [thematicSubplot, setThematicSubplot] = useState('')
  const [additionalSubplots, setAdditionalSubplots] = useState<string[]>([])
  const [majorTwists, setMajorTwists] = useState<string[]>([])
  const [redHerrings, setRedHerrings] = useState<string[]>([])
  const [tensionEscalation, setTensionEscalation] = useState('')
  const [pacingNotes, setPacingNotes] = useState('')
  const [isGeneratingPlot, setIsGeneratingPlot] = useState(false)
  
  const [targetWordCount, setTargetWordCount] = useState(80000)
  const [targetChapterCount, setTargetChapterCount] = useState(25)
  const [povStyle, setPovStyle] = useState('third_person_limited')
  const [tense, setTense] = useState('past')
  const [pacingPreference, setPacingPreference] = useState('moderate')
  
  const [contentWarnings, setContentWarnings] = useState<string[]>([])
  const [mustHaveScenes, setMustHaveScenes] = useState<string[]>([])
  const [tropesToInclude, setTropesToInclude] = useState<string[]>([])
  const [tropesToAvoid, setTropesToAvoid] = useState<string[]>([])
  const [contentRestrictions, setContentRestrictions] = useState<string[]>([])
  const [faithElements, setFaithElements] = useState('')
  const [culturalConsiderations, setCulturalConsiderations] = useState('')
  
  const [baselinePremise, setBaselinePremise] = useState<string | null>(null)
  const [premiumPremise, setPremiumPremise] = useState<string | null>(null)
  
  // Premise editing states
  const [isEditingBaseline, setIsEditingBaseline] = useState(false)
  const [baselinePremiseEdit, setBaselinePremiseEdit] = useState('')
  const [selectedText, setSelectedText] = useState('')
  const [selectionStart, setSelectionStart] = useState(0)
  const [selectionEnd, setSelectionEnd] = useState(0)
  const [showEnhanceMenu, setShowEnhanceMenu] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)

  // Fetch genres for dropdown
  const { data: genresData, isLoading: genresLoading, error: genresError } = useQuery({
    queryKey: ['genres'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/genres`)
      if (!response.ok) throw new Error('Failed to fetch genres')
      return response.json()
    }
  })

  const availableGenres: any[] = Array.isArray(genresData)
    ? genresData
    : (Array.isArray((genresData as any)?.genres) ? (genresData as any).genres : [])
  const totalGenres = availableGenres.length

  // Debug: log genres data
  useEffect(() => {
    if (genresData) {
      console.log('Genres loaded:', genresData)
      console.log('Is array:', Array.isArray(genresData))
      const debugLength = Array.isArray(genresData)
        ? genresData.length
        : Array.isArray((genresData as any)?.genres)
          ? (genresData as any).genres.length
          : 0
      console.log('Length:', debugLength)
      const debugFirst = Array.isArray(genresData)
        ? genresData[0]
        : Array.isArray((genresData as any)?.genres)
          ? (genresData as any).genres[0]
          : undefined
      console.log('First genre:', debugFirst)
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
    const savedSessionId = localStorage.getItem('premiseBuilderSessionId')
    
    // Default to 'resume' if there's a saved session, otherwise 'new'
    const mode = searchParams.get('mode') || (savedSessionId ? 'resume' : 'new')
    console.log('🚦 [INIT] Wizard mode:', mode, '(saved session:', savedSessionId, ')')

    const initSession = async () => {
      console.log('🚀 [INIT] Starting session initialization...')
      try {
        setIsLoading(true)
        setError(null)
        if (mode === 'resume' && savedSessionId) {
          // Resume last saved session if possible
          console.log('💾 [INIT] [RESUME] Checking localStorage for saved session:', savedSessionId)

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
                setFolder(session.project_stub.folder || '')
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
                const atmos = session.tone_theme_profile.atmospheric_elements || [];
                setAtmosphericElements(atmos);
                setAtmosphericElementsInput(atmos.join(', '));
              }
              if (session.character_seeds) {
                console.log('👥 [STATE] Restoring character seeds:', session.character_seeds)
                if (session.character_seeds.protagonist) setProtagonist(session.character_seeds.protagonist)
                if (session.character_seeds.antagonist) setAntagonist(session.character_seeds.antagonist)
                if (session.character_seeds.supporting_cast) setSupportingCast(session.character_seeds.supporting_cast)
              }
              if (session.plot_intent) {
                console.log('📖 [STATE] Restoring plot intent:', session.plot_intent)
                setPrimaryConflict(session.plot_intent.primary_conflict || '')
                setConflictTypes(session.plot_intent.conflict_types || [])
                setStakes(session.plot_intent.stakes || '')
                setStakesLayers(session.plot_intent.stakes_layers || [])
                setIncitingIncident(session.plot_intent.inciting_incident || '')
                setFirstPlotPoint(session.plot_intent.first_plot_point || '')
                setMidpointShift(session.plot_intent.midpoint_shift || '')
                setSecondPlotPoint(session.plot_intent.second_plot_point || '')
                setClimaxConfrontation(session.plot_intent.climax_confrontation || '')
                setResolution(session.plot_intent.resolution || '')
                setKeyStoryBeats(session.plot_intent.key_story_beats || [])
                setEmotionalBeats(session.plot_intent.emotional_beats || [])
                setEndingVibe(session.plot_intent.ending_vibe || 'hopeful')
                setFinalImage(session.plot_intent.final_image || '')
                setRomanticSubplot(session.plot_intent.romantic_subplot || '')
                setSecondarySubplot(session.plot_intent.secondary_subplot || '')
                setThematicSubplot(session.plot_intent.thematic_subplot || '')
                setAdditionalSubplots(session.plot_intent.additional_subplots || [])
                setMajorTwists(session.plot_intent.major_twists || [])
                setRedHerrings(session.plot_intent.red_herrings || [])
                setTensionEscalation(session.plot_intent.tension_escalation || '')
                setPacingNotes(session.plot_intent.pacing_notes || '')
              }
              if (session.structure_targets) {
                console.log('📐 [STATE] Restoring structure targets:', session.structure_targets)
                setTargetWordCount(session.structure_targets.target_word_count || 80000)
                setTargetChapterCount(session.structure_targets.target_chapter_count || 30)
                setPovStyle(session.structure_targets.pov_style || 'third_person_limited')
                setTense(session.structure_targets.tense_style || 'past')
                setPacingPreference(session.structure_targets.pacing_preference || 'moderate')
              }
              if (session.constraints_profile) {
                console.log('🚧 [STATE] Restoring constraints:', session.constraints_profile)
                setTropesToInclude(session.constraints_profile.tropes_to_include || [])
                setTropesToAvoid(session.constraints_profile.tropes_to_avoid || [])
                setContentWarnings(session.constraints_profile.content_warnings || [])
                setContentRestrictions(session.constraints_profile.content_restrictions || [])
                setMustHaveScenes(session.constraints_profile.must_have_scenes || [])
                setFaithElements(session.constraints_profile.faith_elements || '')
                setCulturalConsiderations(session.constraints_profile.cultural_considerations || '')
              }

              setSessionId(session.id)
              setCurrentStep(session.current_step)

              console.log('✅ [INIT] Session restoration complete - Step:', session.current_step)
              setIsLoading(false)
              return // Exit early - session restored successfully
            } else {
              console.log('⚠️ [INIT] [RESUME] Saved session not found (status:', response.status, '), falling back to new session')
              localStorage.removeItem('premiseBuilderSessionId')
            }
        } else if (mode === 'new') {
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
        setAtmosphericElementsInput(suggestions.join(', '))
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
    // First, check if it's a numbered list (1., 2., 3., etc.)
    const numberedListPattern = /^\d+\.\s*/gm
    const hasNumberedList = numberedListPattern.test(text)
    
    if (hasNumberedList) {
      // Split by numbered list markers
      const items = text
        .split(/(?=\d+\.\s)/)
        .map(item => item.replace(/^\d+\.\s*/, '').trim())
        .filter(item => item.length > 0)
      return items
    }
    
    // Otherwise, split by double newlines (paragraph breaks) or bullet points
    const items = text
      .split(/\n\n+|(?=^[-*•]\s)/gm)
      .map(item => item.replace(/^[-*•]\s*/, '').trim())
      .filter(item => item.length > 0)
    
    // If we still have only one item and it's very long, don't split it
    if (items.length === 1) {
      return items
    }
    
    return items
  }
  
  // Helper to clean single-value suggestions
  // const cleanSuggestion = (text: string): string => {
  //   // Remove quotes, numbered markers, and extra whitespace
  //   return text
  //     .replace(/^\d+\.\s*/, '')
  //     .replace(/^["']|["']$/g, '')
  //     .trim()
  // }

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
  const saveStep = async (stepNumber: number, stepData: any, options: SaveStepOptions = {}) => {
    console.log('💾 [SAVE] Saving step...')
    console.log('  🔢 Current UI step:', currentStep)
    console.log('  🗂️ Step being persisted:', stepNumber)
    console.log('  📦 Step payload:', stepData)
    
    if (!sessionId) {
      console.error('❌ [SAVE] No session ID!')
      return false
    }
    
    try {
      setIsLoading(true)
      setError(null)
      
      const url = `${API_BASE}/premise-builder/sessions/${sessionId}`
      const requestBody = {
        step: stepNumber,
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
      
      const responseData = await response.json()
      console.log('✅ [SAVE] Step saved successfully:', responseData)
      if (!options.suppressAdvance) {
        console.log('🔧 [STATE] Advancing to next step', responseData.next_step)
        setCurrentStep(responseData.next_step)
      } else {
        console.log('⏸️ [SAVE] Advance suppressed for chained save')
      }
      setAiSuggestions(null)
      setError(null)
      return responseData
    } catch (err) {
      console.error('❌ [SAVE] Save failed:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to save'
      setError(errorMessage)
      alert(`Error saving step: ${errorMessage}\n\nPlease try again or go back to the previous step.`)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Generate baseline premise (Step 7)
  const generateBaseline = async () => {
    console.log('🎬 generateBaseline called')
    console.log('📋 Session ID:', sessionId)
    
    if (!sessionId) {
      console.log('❌ No session ID, aborting')
      return
    }
    
    try {
      setIsLoading(true)
      console.log('📡 Sending request to:', `${API_BASE}/premise-builder/sessions/${sessionId}/baseline`)
      
      const response = await fetch(`${API_BASE}/premise-builder/sessions/${sessionId}/baseline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      
      console.log('📬 Response status:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.log('❌ Response error:', errorText)
        throw new Error('Failed to generate baseline')
      }
      
      const data = await response.json()
      console.log('📦 Response data:', data)
      
      // Backend returns { session: { baseline_premise: { content: "..." } } }
      const content = data.session?.baseline_premise?.content
      console.log('📝 Extracted content length:', content?.length || 0)
      
      if (content) {
        setBaselinePremise(content)
        // Stay on step 7 to review baseline - user clicks "Continue to Premium" button to advance
        console.log('✅ Baseline premise set successfully!')
      } else {
        console.log('❌ No content in response')
        throw new Error('No baseline premise generated')
      }
    } catch (err) {
      console.log('❌ Error caught:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate baseline')
    } finally {
      setIsLoading(false)
      console.log('🏁 generateBaseline complete')
    }
  }

  // Enhance selected text in baseline premise
  const enhanceBaselineText = async (enhancementType: string) => {
    if (!sessionId || !selectedText) return
    
    try {
      setIsEnhancing(true)
      setShowEnhanceMenu(false)
      
      const enhancementPrompts: Record<string, string> = {
        expand: 'Expand this text with more vivid details and depth',
        funnier: 'Make this text funnier and more comedic',
        dramatic: 'Make this text more dramatic and impactful',
        concise: 'Make this text more concise while keeping the key points',
        descriptive: 'Add more sensory and descriptive details',
        emotional: 'Enhance the emotional resonance of this text',
        rewrite: 'Rewrite this text in a fresh way while keeping the same meaning'
      }
      
      const prompt = enhancementPrompts[enhancementType] || 'Enhance this text'
      
      const response = await fetch(`${API_BASE}/premise-builder/sessions/${sessionId}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enhance_text',
          context: { text_to_enhance: selectedText, instruction: prompt },
          user_input: ''
        })
      })
      
      if (!response.ok) throw new Error('Enhancement failed')
      
      const data = await response.json()
      const enhanced = data.suggestion || selectedText
      
      // Replace selected text with enhanced version
      const before = baselinePremiseEdit.substring(0, selectionStart)
      const after = baselinePremiseEdit.substring(selectionEnd)
      const newText = before + enhanced + after
      
      setBaselinePremiseEdit(newText)
      setBaselinePremise(newText)
      setSelectedText('')
      setShowEnhanceMenu(false)
    } catch (err) {
      console.error('Enhancement error:', err)
      alert('Failed to enhance text. Please try again.')
    } finally {
      setIsEnhancing(false)
    }
  }

  // Save baseline premise edits
  const saveBaselinePremise = async () => {
    if (!sessionId) return
    
    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE}/premise-builder/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 7,
          data: { baseline_premise: { content: baselinePremiseEdit } }
        })
      })
      
      if (!response.ok) throw new Error('Failed to save')
      
      setBaselinePremise(baselinePremiseEdit)
      setIsEditingBaseline(false)
    } catch (err) {
      console.error('Save error:', err)
      alert('Failed to save changes')
    } finally {
      setIsLoading(false)
    }
  }

  // Generate premium premise (Step 8)
  const generatePremium = async () => {
    console.log('🎬 generatePremium called')
    console.log('📋 Session ID:', sessionId)
    
    if (!sessionId) {
      console.log('❌ No session ID, aborting')
      return
    }
    
    try {
      setIsLoading(true)
      console.log('📡 Sending request to:', `${API_BASE}/premise-builder/sessions/${sessionId}/premium`)
      
      const response = await fetch(`${API_BASE}/premise-builder/sessions/${sessionId}/premium`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      
      console.log('📬 Response status:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.log('❌ Response error:', errorText)
        throw new Error('Failed to generate premium')
      }
      
      const data = await response.json()
      console.log('📦 Response data:', data)
      
      // Backend returns { session: { premium_premise: { content: "..." } } }
      const content = data.session?.premium_premise?.content
      console.log('📝 Extracted content length:', content?.length || 0)
      
      if (content) {
        setPremiumPremise(content)
        console.log('✅ Premium premise set successfully!')
      } else {
        console.log('❌ No content in response')
        throw new Error('No premium premise generated')
      }
    } catch (err) {
      console.log('❌ Error caught:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate premium')
    } finally {
      setIsLoading(false)
      console.log('🏁 generatePremium complete')
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
        body: JSON.stringify({ accept_premium_premise: true })
      })
      
      if (!response.ok) throw new Error('Failed to complete session')
      
      const data = await response.json()
      // Navigate to the new project
      navigate(`/studio/projects/${data.project_id}`)
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
              {availableGenres.map((g: any) => (
                <option key={g.name} value={g.name}>{g.name}</option>
              ))}
            </select>
            {genresLoading && <p className="text-sm text-gray-500 mt-1">Loading {totalGenres} genres...</p>}
            {!genresLoading && totalGenres > 0 && <p className="text-xs text-gray-500 mt-1">{totalGenres} genres available</p>}
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
              {availableGenres.filter((g: any) => g.name !== primaryGenre).map((g: any) => (
                <option key={g.name} value={g.name}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>

        {primaryGenre && totalGenres > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Subgenres (Optional)
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Hover over any subgenre for its definition
            </p>
            <div className="flex flex-wrap gap-2">
              {availableGenres
                .find((g: any) => g.name === primaryGenre)
                ?.subgenres?.map((sub: string) => {
                  const definition = SUBGENRE_DEFINITIONS[sub] || 'No definition available'
                  return (
                    <div key={sub} className="group relative">
                      <button
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
                      
                      {/* Tooltip */}
                      <div className="absolute z-50 left-0 top-full mt-2 w-80 p-3 bg-gray-900 border border-blue-600 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
                        <div className="text-blue-400 font-semibold text-sm mb-2">{sub}</div>
                        <div className="text-gray-300 text-xs">{definition}</div>
                      </div>
                    </div>
                  )
                })}
            </div>
            {subgenres.length > 0 && (
              <p className="text-sm text-gray-400 mt-2">
                Selected: {subgenres.join(', ')}
              </p>
            )}
          </div>
        )}

        {/* Comedy Elements Section - ENHANCED with visible info */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Comedy Elements (Optional, max 3) 🎭
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Select up to 3 comedic styles. Hover for definition and examples that AI will use.
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(COMEDY_ELEMENTS).map((element) => {
              const info = COMEDY_ELEMENTS[element as keyof typeof COMEDY_ELEMENTS]
              const isSelected = comedyElements.includes(element)
              const isDisabled = !isSelected && comedyElements.length >= 3
              
              return (
                <div key={element} className="group relative">
                  <button
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setComedyElements(comedyElements.filter(e => e !== element))
                      } else if (comedyElements.length < 3) {
                        setComedyElements([...comedyElements, element])
                      }
                    }}
                    disabled={isDisabled}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      isSelected
                        ? 'bg-orange-600 text-white'
                        : isDisabled
                        ? 'bg-gray-900 text-gray-600 cursor-not-allowed'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {element}
                  </button>
                  
                  {/* Rich Tooltip */}
                  <div className="absolute z-50 left-0 top-full mt-2 w-96 p-4 bg-gray-900 border border-orange-600 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
                    <div className="text-orange-400 font-semibold text-sm mb-2">{element}</div>
                    <div className="text-gray-300 text-xs mb-3">{info.definition}</div>
                    <div className="border-t border-gray-700 pt-2">
                      <div className="text-gray-400 text-xs font-semibold mb-1">AI will use examples like:</div>
                      <ul className="text-gray-400 text-xs space-y-1">
                        {info.examples.map((example: string, idx: number) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-orange-500 mr-1">•</span>
                            <span>{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Selected Elements with Visible Definitions */}
          {comedyElements.length > 0 && (
            <div className="mt-4 p-4 bg-gradient-to-r from-orange-900/20 to-yellow-900/20 border border-orange-700 rounded-lg">
              <div className="text-sm font-semibold text-orange-400 mb-3">
                Selected Comedy Styles ({comedyElements.length}/3):
              </div>
              <div className="space-y-3">
                {comedyElements.map((element: string) => {
                  const info = COMEDY_ELEMENTS[element as keyof typeof COMEDY_ELEMENTS]
                  return (
                    <div key={element} className="text-xs">
                      <div className="font-semibold text-orange-300 mb-1">🎭 {element}</div>
                      <div className="text-gray-400 mb-2">{info.definition}</div>
                      <div className="text-gray-500 text-xs ml-3">
                        Examples: {info.examples.slice(0, 2).join(' • ')}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
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
                
                <div className="flex gap-3 mb-3">
                  <button
                    onClick={async () => {
                      // DEBUG: Show exact prompt that will be sent to AI
                      const context = {
                        primary_genre: primaryGenre,
                        secondary_genre: secondaryGenre,
                        comedy_elements: comedyElements,
                        subgenres: subgenres,
                        seed: 'Debug prompt inspection'
                      }
                      
                      try {
                        const response = await fetch(`${API_BASE}/premise-builder/sessions/${sessionId}/ai/debug`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'brainstorm_concept', context })
                        })
                        const data = await response.json()
                        
                        // Show in a modal/alert so user can read the full prompt
                        const promptPreview = `🔍 EXACT PROMPT BEING SENT TO AI:\n\n${data.full_prompt}\n\n` +
                          `📊 CONTEXT DATA:\n` +
                          `- Comedy Elements: ${JSON.stringify(data.comedy_elements_in_context)}\n` +
                          `- Subgenres: ${JSON.stringify(data.subgenres_in_context)}\n` +
                          `- Prompt Length: ${data.prompt_length} characters`
                        
                        alert(promptPreview)
                        console.log('🔍 DEBUG PROMPT DATA:', data)
                      } catch (err) {
                        console.error('Debug failed:', err)
                        alert('Debug failed - check console')
                      }
                    }}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm font-medium"
                    title="See exactly what prompt is sent to AI with your selections"
                  >
                    🔍 Debug Prompt
                  </button>
                </div>
                
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
              Folder / Series <span className="text-gray-500">(optional - organize your projects)</span>
            </label>
            <input
              type="text"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              placeholder="e.g., My Fantasy Series, Published Works, Drafts (or leave blank)"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-gray-500 text-sm mt-2">💡 Group related projects together on your home page</p>
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
            const currentLogline = logline || 'Developing story concept'
            if (currentLogline.length > 25000) {
              setError('Story concept must be 25000 characters or less')
              return
            }
            
            const step0Response = await saveStep(
              0,
              {
                title: projectTitle || 'Untitled Project',
                folder: folder || undefined,
                logline: currentLogline
              },
              { suppressAdvance: true }
            )
            
            if (step0Response) {
              await saveStep(1, {
                primary_genre: primaryGenre,
                secondary_genre: secondaryGenre || undefined,
                subgenres,
                audience_rating: audienceRating
              })
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
            {availableGenres.map((g: any) => (
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
            {availableGenres.map((g: any) => (
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
          onClick={() => saveStep(1, {
            primary_genre: primaryGenre,
            secondary_genre: secondaryGenre || undefined,
            subgenres,
            audience_rating: audienceRating
          })}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Darkness Level Slider */}
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Darkness Level: {darknessLevel}/10
          </label>
          
          {/* Current Selection Display */}
          <div className="mb-4 p-3 bg-gradient-to-r from-purple-900/30 to-gray-900/30 border border-purple-700 rounded-lg">
            <div className="text-purple-400 font-semibold text-sm mb-1">
              {DARKNESS_LEVELS[darknessLevel].label}
            </div>
            <div className="text-gray-300 text-xs mb-2">
              {DARKNESS_LEVELS[darknessLevel].description}
            </div>
            <div className="text-gray-400 text-xs">
              <span className="text-purple-500">AI will generate:</span> {DARKNESS_LEVELS[darknessLevel].aiGuidance}
            </div>
          </div>
          
          <input
            type="range"
            min="1"
            max="10"
            value={darknessLevel}
            onChange={(e) => setDarknessLevel(Number(e.target.value))}
            className="w-full accent-purple-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>😊 Lighthearted</span>
            <span>💀 Grimdark</span>
          </div>
          
          {/* Quick Reference */}
          <details className="mt-3">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
              See all levels
            </summary>
            <div className="mt-2 space-y-1 text-xs max-h-48 overflow-y-auto">
              {Object.entries(DARKNESS_LEVELS).map(([level, info]) => (
                <div 
                  key={level}
                  className={`p-2 rounded ${Number(level) === darknessLevel ? 'bg-purple-900/30 border border-purple-700' : 'bg-gray-900/30'}`}
                >
                  <span className="text-purple-400 font-semibold">{level}.</span> {info.label}: {info.description}
                </div>
              ))}
            </div>
          </details>
        </div>

        {/* Humor Level Slider */}
        <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Humor Level: {humorLevel}/10
          </label>
          
          {/* Current Selection Display */}
          <div className="mb-4 p-3 bg-gradient-to-r from-yellow-900/30 to-gray-900/30 border border-yellow-700 rounded-lg">
            <div className="text-yellow-400 font-semibold text-sm mb-1">
              {HUMOR_LEVELS[humorLevel].label}
            </div>
            <div className="text-gray-300 text-xs mb-2">
              {HUMOR_LEVELS[humorLevel].description}
            </div>
            <div className="text-gray-400 text-xs">
              <span className="text-yellow-500">AI will generate:</span> {HUMOR_LEVELS[humorLevel].aiGuidance}
            </div>
          </div>
          
          <input
            type="range"
            min="1"
            max="10"
            value={humorLevel}
            onChange={(e) => setHumorLevel(Number(e.target.value))}
            className="w-full accent-yellow-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>😐 Serious</span>
            <span>🤣 Comedic</span>
          </div>
          
          {/* Quick Reference */}
          <details className="mt-3">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
              See all levels
            </summary>
            <div className="mt-2 space-y-1 text-xs max-h-48 overflow-y-auto">
              {Object.entries(HUMOR_LEVELS).map(([level, info]) => (
                <div 
                  key={level}
                  className={`p-2 rounded ${Number(level) === humorLevel ? 'bg-yellow-900/30 border border-yellow-700' : 'bg-gray-900/30'}`}
                >
                  <span className="text-yellow-400 font-semibold">{level}.</span> {info.label}: {info.description}
                </div>
              ))}
            </div>
          </details>
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
        <textarea
          value={atmosphericElementsInput}
          onChange={(e) => {
            // Store the raw input value for display
            setAtmosphericElementsInput(e.target.value);
            // Parse into array for saving (will be done properly on blur/save)
            const parsed = e.target.value.split(',').map(a => a.trim()).filter(a => a.length > 0);
            setAtmosphericElements(parsed);
          }}
          placeholder="e.g., claustrophobic, whimsical, foreboding, ethereal, gritty"
          rows={2}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
        />
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={() => setCurrentStep(1)} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
          ← Previous
        </button>
        <button
          onClick={() => saveStep(2, {
            tone_adjectives: toneAdjectives,
            darkness_level: darknessLevel,
            humor_level: humorLevel,
            themes,
            emotional_tone: emotionalTone || undefined,
            core_values: coreValues,
            central_question: centralQuestion || undefined,
            atmospheric_elements: atmosphericElements,
            heat_level: heatLevel || undefined
          })}
          disabled={isLoading}
          className="px-8 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
        >
          {isLoading ? 'Saving...' : 'Next Step →'}
        </button>
      </div>
    </div>
  )

  const generateCharacterSuggestions = async () => {
    if (!sessionId) return
    
    try {
      setIsAiLoading(true)
      const context = {
        primary_genre: primaryGenre,
        logline,
        themes,
        tone_adjectives: toneAdjectives
      }
      
      const response = await fetch(`${API_BASE}/premise-builder/sessions/${sessionId}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suggest_characters', context })
      })
      
      if (!response.ok) throw new Error('Failed to generate character suggestions')
      
      const data = await response.json()
      const chars = parseListSuggestion(data.suggestion).map((desc, idx) => {
        const lines = desc.split('\n').filter(l => l.trim())
        const nameLine = lines[0] || `Character ${idx + 1}`
        const name = nameLine.replace(/^.*?:\s*/, '').replace(/\(.*?\)/, '').trim()
        const role = nameLine.toLowerCase().includes('protagonist') ? 'protagonist' 
          : nameLine.toLowerCase().includes('antagonist') ? 'antagonist' 
          : 'supporting'
        return {
          name,
          role,
          brief_description: lines.slice(1).join(' ').trim() || desc
        }
      })
      setSuggestedCharacters(chars)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate characters')
    } finally {
      setIsAiLoading(false)
    }
  }

  const selectCharacter = (char: CharacterSeed) => {
    if (char.role === 'protagonist') {
      setProtagonist(char)
    } else if (char.role === 'antagonist') {
      setAntagonist(char)
    } else {
      setSupportingCast(prev => [...prev, char])
    }
  }

  const expandCharacter = async (char: CharacterSeed, role: 'protagonist' | 'antagonist' | 'supporting') => {
    setExpandingCharacter(role)
    try {
      setIsAiLoading(true)
      const context = {
        character_seed: char,
        genre: primaryGenre,
        logline,
        themes
      }
      
      const response = await fetch(`${API_BASE}/premise-builder/sessions/${sessionId}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'expand_character', context, user_input: char.brief_description })
      })
      
      if (!response.ok) throw new Error('Failed to expand character')
      
      const data = await response.json()
      const expanded = { ...char, brief_description: data.suggestion }
      
      if (role === 'protagonist') setProtagonist(expanded)
      else if (role === 'antagonist') setAntagonist(expanded)
      else {
        setSupportingCast(prev => prev.map(c => c.name === char.name ? expanded : c))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to expand character')
    } finally {
      setIsAiLoading(false)
      setExpandingCharacter(null)
    }
  }

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Characters</h2>
        <p className="text-gray-400">Who's in your story?</p>
      </div>

      {/* Generate Characters Button */}
      {suggestedCharacters.length === 0 && (
        <div className="text-center py-8 bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-700/50">
          <p className="text-gray-300 mb-4">
            {protagonist ? 'Want to add more characters? Generate additional character ideas!' : 'Let AI generate character suggestions based on your story so far!'}
          </p>
          <button
            onClick={generateCharacterSuggestions}
            disabled={isAiLoading}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-lg font-semibold transition-all"
          >
            {isAiLoading ? '⏳ Generating Characters...' : '✨ Generate Character Ideas'}
          </button>
        </div>
      )}

      {/* Suggested Characters Pool */}
      {suggestedCharacters.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">💡 AI Suggested Characters</h3>
            <div className="flex gap-2">
              <button
                onClick={generateCharacterSuggestions}
                disabled={isAiLoading}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white rounded-lg transition-colors text-sm"
              >
                🔄 Different Ideas
              </button>
              <button
                onClick={() => setSuggestedCharacters([])}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
              >
                Done Selecting
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto pr-2">
            {suggestedCharacters.map((char, idx) => (
              <div key={idx} className="bg-gray-900/70 p-4 rounded-lg border border-gray-700 hover:border-primary-500 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white mb-1 flex items-center gap-2">
                      {char.name} 
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        char.role === 'protagonist' ? 'bg-green-900/50 text-green-300' :
                        char.role === 'antagonist' ? 'bg-red-900/50 text-red-300' :
                        'bg-blue-900/50 text-blue-300'
                      }`}>
                        {char.role}
                      </span>
                    </h4>
                    <p className="text-sm text-gray-400 line-clamp-2">{char.brief_description}</p>
                  </div>
                  <button
                    onClick={() => selectCharacter(char)}
                    className="flex-shrink-0 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm transition-colors font-medium"
                  >
                    Add →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Characters Section */}
      {(protagonist || antagonist || supportingCast.length > 0) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">📝 Your Characters</h3>
            {!protagonist && (
              <p className="text-sm text-amber-400">⚠️ Need at least a protagonist to continue</p>
            )}
          </div>

          {/* Protagonist Card */}
          {protagonist && (
            <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 p-5 rounded-lg border-2 border-green-700/50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-green-300 flex items-center gap-2">
                  ⭐ Protagonist
                </h4>
                <button
                  onClick={() => setProtagonist(null)}
                  className="text-sm text-gray-400 hover:text-white px-3 py-1 rounded hover:bg-gray-700"
                >
                  ✕ Remove
                </button>
              </div>
              <input
                type="text"
                placeholder="Name"
                value={protagonist.name}
                onChange={(e) => setProtagonist({ ...protagonist, name: e.target.value })}
                className="w-full px-4 py-2 mb-3 bg-gray-900/80 border border-gray-700 rounded-lg text-white placeholder-gray-500 font-medium"
              />
              <textarea
                placeholder="Description, personality, goals, flaws, backstory..."
                rows={5}
                value={protagonist.brief_description}
                onChange={(e) => setProtagonist({ ...protagonist, brief_description: e.target.value })}
                className="w-full px-4 py-2 mb-3 bg-gray-900/80 border border-gray-700 rounded-lg text-white placeholder-gray-500 resize-none"
              />
              <button
                onClick={() => expandCharacter(protagonist, 'protagonist')}
                disabled={isAiLoading || expandingCharacter === 'protagonist'}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg text-sm transition-colors font-medium"
              >
                {expandingCharacter === 'protagonist' ? '⏳ AI Expanding...' : '🤖 AI Expand Details (appearance, backstory, etc.)'}
              </button>
            </div>
          )}

          {/* Antagonist Card */}
          {antagonist && (
            <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 p-5 rounded-lg border-2 border-red-700/50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-red-300 flex items-center gap-2">
                  💀 Antagonist
                </h4>
                <button
                  onClick={() => setAntagonist(null)}
                  className="text-sm text-gray-400 hover:text-white px-3 py-1 rounded hover:bg-gray-700"
                >
                  ✕ Remove
                </button>
              </div>
              <input
                type="text"
                placeholder="Name"
                value={antagonist.name}
                onChange={(e) => setAntagonist({ ...antagonist, name: e.target.value })}
                className="w-full px-4 py-2 mb-3 bg-gray-900/80 border border-gray-700 rounded-lg text-white placeholder-gray-500 font-medium"
              />
              <textarea
                placeholder="Description, motivations, methods, what makes them formidable..."
                rows={4}
                value={antagonist.brief_description}
                onChange={(e) => setAntagonist({ ...antagonist, brief_description: e.target.value })}
                className="w-full px-4 py-2 mb-3 bg-gray-900/80 border border-gray-700 rounded-lg text-white placeholder-gray-500 resize-none"
              />
              <button
                onClick={() => expandCharacter(antagonist, 'antagonist')}
                disabled={isAiLoading || expandingCharacter === 'antagonist'}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg text-sm transition-colors font-medium"
              >
                {expandingCharacter === 'antagonist' ? '⏳ AI Expanding...' : '🤖 AI Expand Details'}
              </button>
            </div>
          )}

          {/* Supporting Characters */}
          {supportingCast.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-blue-300">👥 Supporting Characters</h4>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {supportingCast.map((char, idx) => (
                  <div key={idx} className="bg-gray-900/70 p-4 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <input
                        type="text"
                        value={char.name}
                        onChange={(e) => setSupportingCast(prev => prev.map((c, i) => i === idx ? { ...c, name: e.target.value } : c))}
                        className="flex-1 px-3 py-1 bg-gray-900 border border-gray-700 rounded text-white font-medium"
                      />
                      <button
                        onClick={() => setSupportingCast(prev => prev.filter((_, i) => i !== idx))}
                        className="ml-3 text-sm text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-700"
                      >
                        ✕
                      </button>
                    </div>
                    <textarea
                      value={char.brief_description}
                      onChange={(e) => setSupportingCast(prev => prev.map((c, i) => i === idx ? { ...c, brief_description: e.target.value } : c))}
                      rows={3}
                      className="w-full px-3 py-2 mb-2 bg-gray-900 border border-gray-700 rounded text-white text-sm resize-none"
                      placeholder="Description, role in story..."
                    />
                    <button
                      onClick={() => expandCharacter(char, 'supporting')}
                      disabled={isAiLoading}
                      className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded text-sm transition-colors"
                    >
                      {isAiLoading ? '⏳ Expanding...' : '🤖 AI Expand'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button onClick={() => setCurrentStep(2)} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
          ← Previous
        </button>
        <button
          onClick={() => {
            const supportingCastPayload = supportingCast
              .filter(member => member.name?.trim())
              .map(member => ({
                ...member,
                role: member.role || 'supporting'
              }))
            saveStep(3, {
              protagonist: protagonist || undefined,
              antagonist: antagonist || undefined,
              supporting_cast: supportingCastPayload
            })
          }}
          disabled={!protagonist?.name || isLoading}
          className="px-8 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
        >
          {isLoading ? 'Saving...' : 'Next Step →'}
        </button>
      </div>
    </div>
  )

  // AI-powered full plot generation
  const generateFullPlot = async () => {
    try {
      console.log('🎬 [PLOT] Starting full plot generation...')
      setIsGeneratingPlot(true)
      setError(null)
      
      // 🔥 CRITICAL FIX: Save any existing plot edits to session FIRST
      // This ensures AI pulls user's manual edits when generating
      // ONLY save if user has actually entered something (avoid validation errors on first generation)
      const hasPlotData = primaryConflict || stakes || incitingIncident || firstPlotPoint || 
                         midpointShift || secondPlotPoint || climaxConfrontation || resolution;
      
      if (hasPlotData) {
        console.log('💾 [PLOT] Auto-saving current plot state before generation...')
        const currentPlotData = {
          primary_conflict: primaryConflict || undefined,
          conflict_types: conflictTypes,
          stakes: stakes || undefined,
          stakes_layers: stakesLayers,
          inciting_incident: incitingIncident || undefined,
          first_plot_point: firstPlotPoint || undefined,
          midpoint_shift: midpointShift || undefined,
          second_plot_point: secondPlotPoint || undefined,
          climax_confrontation: climaxConfrontation || undefined,
          resolution: resolution || undefined,
          key_story_beats: keyStoryBeats,
          emotional_beats: emotionalBeats,
          ending_vibe: endingVibe || undefined,
          final_image: finalImage || undefined,
          romantic_subplot: romanticSubplot || undefined,
          secondary_subplot: secondarySubplot || undefined,
          thematic_subplot: thematicSubplot || undefined,
          additional_subplots: additionalSubplots,
          major_twists: majorTwists,
          red_herrings: redHerrings,
          tension_escalation: tensionEscalation || undefined,
          pacing_notes: pacingNotes || undefined
        }
        
        // Save current state without advancing step
        await saveStep(4, currentPlotData, { suppressAdvance: true })
        console.log('✅ [PLOT] Current edits saved to session')
      } else {
        console.log('⏭️ [PLOT] No manual edits to save, proceeding directly to generation')
      }
      
      const response = await fetch(`${API_BASE}/premise-builder/sessions/${sessionId}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_full_plot',
          context: {},
          user_input: ''
        })
      })

      console.log('📡 [PLOT] Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [PLOT] Error response:', errorText)
        throw new Error(`Failed to generate plot: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('✅ [PLOT] AI Response received, length:', data.suggestion?.length || 0)
      console.log('📝 [PLOT] Full response:', data.suggestion)
      
      const suggestion = data.suggestion || ''
      
      if (!suggestion) {
        console.warn('⚠️ [PLOT] Empty suggestion received')
        throw new Error('AI returned empty response')
      }
      
      // Parse the structured response - split by **HEADER:** format
      const sections = suggestion.split(/\*\*([A-Z\s]+):\*\*/g).filter(Boolean)
      console.log('📦 [PLOT] Parsed sections count:', sections.length)
      
      // Process pairs: [header, content, header, content, ...]
      for (let i = 0; i < sections.length; i += 2) {
        const header = sections[i]?.trim().toUpperCase() || ''
        const content = sections[i + 1]?.trim() || ''
        
        console.log(`🔍 [PLOT] Processing: ${header} (${content.length} chars)`)
        
        if (!content) continue
        
        if (header.includes('PRIMARY CONFLICT')) {
          setPrimaryConflict(content)
        }
        else if (header.includes('CONFLICT TYPES')) {
          // Parse bullet points or comma-separated list
          const types = content.split(/\n|,/).map((s: string) => s.replace(/^[-*•]\s*/, '').trim()).filter(Boolean)
          setConflictTypes(types)
        }
        else if (header.includes('STAKES') && !header.includes('LAYERS')) {
          setStakes(content)
        }
        else if (header.includes('STAKES LAYERS')) {
          const layers = content.split(/\n|,/).map((s: string) => s.replace(/^[-*•]\s*/, '').trim()).filter(Boolean)
          setStakesLayers(layers)
        }
        else if (header.includes('INCITING INCIDENT')) {
          setIncitingIncident(content)
        }
        else if (header.includes('FIRST PLOT POINT')) {
          setFirstPlotPoint(content)
        }
        else if (header.includes('MIDPOINT')) {
          setMidpointShift(content)
        }
        else if (header.includes('SECOND PLOT POINT')) {
          setSecondPlotPoint(content)
        }
        else if (header.includes('CLIMAX')) {
          setClimaxConfrontation(content)
        }
        else if (header.includes('RESOLUTION')) {
          setResolution(content)
        }
        else if (header.includes('KEY STORY BEATS')) {
          const beats = content.split('\n').filter((l: string) => l.trim()).map((l: string) => l.replace(/^[-*•]\s*/, '').trim())
          setKeyStoryBeats(beats)
        }
        else if (header.includes('EMOTIONAL BEATS')) {
          const beats = content.split('\n').filter((l: string) => l.trim()).map((l: string) => l.replace(/^[-*•]\s*/, '').trim())
          setEmotionalBeats(beats)
        }
        else if (header.includes('ROMANTIC SUBPLOT')) {
          setRomanticSubplot(content)
        }
        else if (header.includes('SECONDARY SUBPLOT')) {
          setSecondarySubplot(content)
        }
        else if (header.includes('THEMATIC SUBPLOT')) {
          setThematicSubplot(content)
        }
        else if (header.includes('ADDITIONAL SUBPLOTS')) {
          const subplots = content.split('\n').filter((l: string) => l.trim()).map((l: string) => l.replace(/^[-*•]\s*/, '').trim())
          setAdditionalSubplots(subplots)
        }
        else if (header.includes('TWISTS') || header.includes('TWIST')) {
          const twists = content.split('\n').filter((l: string) => l.trim()).map((l: string) => l.replace(/^[-*•]\s*/, '').trim())
          setMajorTwists(twists)
        }
        else if (header.includes('RED HERRINGS')) {
          const herrings = content.split('\n').filter((l: string) => l.trim()).map((l: string) => l.replace(/^[-*•]\s*/, '').trim())
          setRedHerrings(herrings)
        }
        else if (header.includes('ENDING VIBE')) {
          const vibe = content.toLowerCase().split(/\n/)[0].trim()
          setEndingVibe(vibe)
        }
        else if (header.includes('FINAL IMAGE')) {
          setFinalImage(content)
        }
        else if (header.includes('TENSION')) {
          setTensionEscalation(content)
        }
        else if (header.includes('PACING')) {
          setPacingNotes(content)
        }
      }
      
      console.log('✨ [PLOT] Plot generation complete!')
      console.log('📊 [PLOT] Primary Conflict:', primaryConflict?.substring(0, 50))
    } catch (err) {
      console.error('❌ [PLOT] Plot generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate plot. Please try again.')
    } finally {
      setIsGeneratingPlot(false)
      console.log('🏁 [PLOT] Generation finished, loading state:', false)
    }
  }

  // Expand individual plot element
  const expandPlotElement = async (elementName: string, currentValue: string, setter: (value: string) => void) => {
    try {
      setIsAiLoading(true)
      const response = await fetch(`${API_BASE}/premise-builder/sessions/${sessionId}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'expand_plot_element',
          context: { element_name: elementName },
          user_input: currentValue
        })
      })

      if (!response.ok) throw new Error('Failed to expand element')
      
      const data = await response.json()
      setter(data.suggestion || currentValue)
    } catch (err) {
      console.error('Element expansion error:', err)
    } finally {
      setIsAiLoading(false)
    }
  }

  const renderStep4 = () => {
    // Dropdown options
    const conflictTypeOptions = ['Internal', 'Interpersonal', 'Societal', 'Environmental', 'Supernatural', 'Technological', 'Moral/Ethical']
    const stakesLayerOptions = ['Personal', 'Relational', 'Professional', 'Community', 'Global', 'Existential']
    const endingVibeOptions = ['Triumph', 'Hopeful', 'Bittersweet', 'Tragic', 'Open/Ambiguous', 'Uplifting', 'Dark']

    return (
      <div className="space-y-8 max-h-[calc(100vh-300px)] overflow-y-auto pr-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Plot Structure</h2>
          <p className="text-gray-400">Build your story's narrative arc</p>
        </div>

        {/* AI Generate All Button */}
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-6 rounded-lg border border-blue-700/50">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">🤖 AI Plot Generator</h3>
              <p className="text-gray-400 text-sm mb-2">
                Let AI generate a complete plot structure based on your genre, themes, and characters. 
                You can then refine, expand, or modify any element.
              </p>
              <p className="text-blue-300 text-xs mb-4">
                💾 Your current edits will be saved automatically before generation
              </p>
              <button
                onClick={generateFullPlot}
                disabled={isGeneratingPlot || !primaryGenre}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-all font-medium flex items-center gap-2"
              >
                <span className="text-xl">✨</span>
                {isGeneratingPlot ? 'Saving & Generating Plot...' : 'Generate Complete Plot Structure'}
              </button>
            </div>
          </div>
        </div>

        {/* Core Conflict Section */}
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            ⚔️ Core Conflict & Stakes
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Primary Conflict <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              <textarea
                rows={3}
                value={primaryConflict}
                onChange={(e) => setPrimaryConflict(e.target.value)}
                placeholder="What's the central problem your protagonist must solve?"
                className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
              <button
                onClick={() => expandPlotElement('primary conflict', primaryConflict, setPrimaryConflict)}
                disabled={!primaryConflict || isAiLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm whitespace-nowrap self-start"
                title="Expand with AI"
              >
                🤖 Expand
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Conflict Types (multi-select)
            </label>
            <div className="flex flex-wrap gap-2">
              {conflictTypeOptions.map(type => (
                <button
                  key={type}
                  onClick={() => {
                    setConflictTypes(prev => 
                      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                    )
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    conflictTypes.includes(type)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Stakes <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              <textarea
                rows={3}
                value={stakes}
                onChange={(e) => setStakes(e.target.value)}
                placeholder="What's at risk if the protagonist fails?"
                className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
              <button
                onClick={() => expandPlotElement('stakes', stakes, setStakes)}
                disabled={!stakes || isAiLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm whitespace-nowrap self-start"
                title="Expand with AI"
              >
                🤖 Expand
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Stakes Layers (multi-select)
            </label>
            <div className="flex flex-wrap gap-2">
              {stakesLayerOptions.map(layer => (
                <button
                  key={layer}
                  onClick={() => {
                    setStakesLayers(prev => 
                      prev.includes(layer) ? prev.filter(l => l !== layer) : [...prev, layer]
                    )
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    stakesLayers.includes(layer)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {layer}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Three-Act Structure */}
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            📐 Three-Act Structure
          </h3>
          
          {[
            { label: 'Inciting Incident', value: incitingIncident, setter: setIncitingIncident, placeholder: 'What event kicks off the story?', icon: '🎬' },
            { label: 'First Plot Point', value: firstPlotPoint, setter: setFirstPlotPoint, placeholder: 'Point of no return / entering the new world', icon: '🚪' },
            { label: 'Midpoint Shift', value: midpointShift, setter: setMidpointShift, placeholder: 'Major revelation or reversal that changes everything', icon: '🔄' },
            { label: 'Second Plot Point', value: secondPlotPoint, setter: setSecondPlotPoint, placeholder: 'All is lost moment / dark night of the soul', icon: '🌑' },
            { label: 'Climax Confrontation', value: climaxConfrontation, setter: setClimaxConfrontation, placeholder: 'Final showdown', icon: '⚡' },
            { label: 'Resolution', value: resolution, setter: setResolution, placeholder: 'How conflicts resolve and loose ends tie up', icon: '🎯' }
          ].map(({ label, value, setter, placeholder, icon }) => (
            <div key={label}>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {icon} {label}
              </label>
              <div className="flex gap-2">
                <textarea
                  rows={2}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm"
                />
                <button
                  onClick={() => expandPlotElement(label.toLowerCase(), value, setter)}
                  disabled={!value || isAiLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm whitespace-nowrap self-start"
                  title="Expand with AI"
                >
                  🤖
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Story & Emotional Beats */}
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            💫 Story Beats & Moments
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Key Story Beats
            </label>
            <textarea
              rows={4}
              value={keyStoryBeats.join('\n')}
              onChange={(e) => setKeyStoryBeats(e.target.value.split('\n').map(b => b.trim()).filter(Boolean))}
              placeholder="Enter major plot points (one per line)&#10;- Opening hook&#10;- First encounter&#10;- Major setback&#10;- etc."
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Emotional Beats
            </label>
            <textarea
              rows={3}
              value={emotionalBeats.join('\n')}
              onChange={(e) => setEmotionalBeats(e.target.value.split('\n').map(b => b.trim()).filter(Boolean))}
              placeholder="Enter key emotional moments (one per line)&#10;- Loss of loved one&#10;- Moment of triumph&#10;- etc."
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm"
            />
          </div>
        </div>

        {/* Subplots */}
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            🧵 Subplots & Threads
          </h3>
          
          {[
            { label: 'Romantic Subplot', value: romanticSubplot, setter: setRomanticSubplot, placeholder: 'Romance thread if applicable', icon: '💕' },
            { label: 'Secondary Subplot', value: secondarySubplot, setter: setSecondarySubplot, placeholder: 'B-story or secondary character arc', icon: '📖' },
            { label: 'Thematic Subplot', value: thematicSubplot, setter: setThematicSubplot, placeholder: 'Philosophical or thematic exploration thread', icon: '🎭' }
          ].map(({ label, value, setter, placeholder, icon }) => (
            <div key={label}>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {icon} {label}
              </label>
              <div className="flex gap-2">
                <textarea
                  rows={2}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm"
                />
                <button
                  onClick={() => expandPlotElement(label.toLowerCase(), value, setter)}
                  disabled={!value || isAiLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm whitespace-nowrap self-start"
                  title="Expand with AI"
                >
                  🤖
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Twists & Surprises */}
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            🎲 Twists & Surprises
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Major Twists
            </label>
            <textarea
              rows={3}
              value={majorTwists.join('\n')}
              onChange={(e) => setMajorTwists(e.target.value.split('\n').map(t => t.trim()).filter(Boolean))}
              placeholder="Enter plot twists and revelations (one per line)"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Red Herrings
            </label>
            <textarea
              rows={2}
              value={redHerrings.join('\n')}
              onChange={(e) => setRedHerrings(e.target.value.split('\n').map(r => r.trim()).filter(Boolean))}
              placeholder="Enter misdirections and false leads (one per line)"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm"
            />
          </div>
        </div>

        {/* Ending & Pacing */}
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            🎬 Ending & Pacing
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Ending Vibe <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {endingVibeOptions.map(vibe => (
                <button
                  key={vibe}
                  onClick={() => setEndingVibe(vibe.toLowerCase())}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    endingVibe === vibe.toLowerCase()
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {vibe}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Final Image
            </label>
            <textarea
              rows={2}
              value={finalImage}
              onChange={(e) => setFinalImage(e.target.value)}
              placeholder="The last scene/moment that closes the story"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tension Escalation Strategy
            </label>
            <textarea
              rows={2}
              value={tensionEscalation}
              onChange={(e) => setTensionEscalation(e.target.value)}
              placeholder="How does tension build throughout the story?"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Pacing Notes
            </label>
            <textarea
              rows={2}
              value={pacingNotes}
              onChange={(e) => setPacingNotes(e.target.value)}
              placeholder="Pacing strategy and rhythm considerations"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm"
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t border-gray-700">
          <button 
            onClick={() => setCurrentStep(3)} 
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            ← Previous
          </button>
          <button
            onClick={() => saveStep(4, {
              primary_conflict: primaryConflict,
              conflict_types: conflictTypes,
              stakes,
              stakes_layers: stakesLayers,
              inciting_incident: incitingIncident || undefined,
              first_plot_point: firstPlotPoint || undefined,
              midpoint_shift: midpointShift || undefined,
              second_plot_point: secondPlotPoint || undefined,
              climax_confrontation: climaxConfrontation || undefined,
              resolution: resolution || undefined,
              key_story_beats: keyStoryBeats,
              emotional_beats: emotionalBeats,
              ending_vibe: endingVibe,
              final_image: finalImage || undefined,
              romantic_subplot: romanticSubplot || undefined,
              secondary_subplot: secondarySubplot || undefined,
              thematic_subplot: thematicSubplot || undefined,
              additional_subplots: additionalSubplots,
              major_twists: majorTwists,
              red_herrings: redHerrings,
              tension_escalation: tensionEscalation || undefined,
              pacing_notes: pacingNotes || undefined
            })}
            disabled={!primaryConflict || !stakes || isLoading}
            className="px-8 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
          >
            {isLoading ? 'Saving...' : 'Next Step →'}
          </button>
        </div>
      </div>
    )
  }

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
          onClick={() => saveStep(5, {
            target_word_count: targetWordCount,
            target_chapter_count: targetChapterCount,
            pov_style: povStyle,
            tense_style: tense,
            pacing_preference: pacingPreference
          })}
          disabled={isLoading}
          className="px-8 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
        >
          {isLoading ? 'Saving...' : 'Next Step →'}
        </button>
      </div>
    </div>
  )

  const renderStep6 = () => {
    // Tone-aware suggestions based on darkness and humor levels
    const getToneBasedGuidance = () => {
      const guidance: { recommend: string[]; avoid: string[]; warnings: string[] } = {
        recommend: [],
        avoid: [],
        warnings: []
      }

      // Darkness level guidance
      if (darknessLevel >= 8) {
        guidance.avoid.push('happy endings guaranteed', 'comic relief sidekicks', 'everyone survives', 'love conquers all')
        guidance.recommend.push('morally gray characters', 'pyrrhic victories', 'character death', 'traumatic backstories')
        guidance.warnings.push('graphic violence', 'character death', 'psychological trauma', 'dark themes')
      } else if (darknessLevel >= 6) {
        guidance.avoid.push('plot armor', 'convenient solutions', 'perfect heroes')
        guidance.recommend.push('difficult moral choices', 'consequences matter', 'realistic conflict')
        guidance.warnings.push('violence', 'mature themes')
      } else if (darknessLevel <= 3) {
        guidance.avoid.push('graphic violence', 'character death', 'torture scenes', 'nihilism')
        guidance.recommend.push('found family', 'redemption arcs', 'hope prevails', 'friendship conquers')
      }

      // Humor level guidance
      if (humorLevel >= 8) {
        guidance.avoid.push('grimdark tone', 'prolonged suffering', 'tragic endings', 'serious drama')
        guidance.recommend.push('witty banter', 'comedic timing', 'running gags', 'absurd situations')
      } else if (humorLevel >= 6) {
        guidance.recommend.push('comic relief', 'playful dialogue', 'humorous asides')
      } else if (humorLevel <= 2) {
        guidance.avoid.push('slapstick', 'jokes during serious moments', 'comedic characters', 'puns')
        guidance.recommend.push('grave tone', 'solemn atmosphere', 'earnest dialogue')
      }

      // Combined guidance
      if (darknessLevel >= 8 && humorLevel >= 8) {
        guidance.recommend.push('dark comedy', 'gallows humor', 'satire', 'absurdist horror')
      } else if (darknessLevel <= 3 && humorLevel <= 3) {
        guidance.recommend.push('gentle drama', 'heartfelt moments', 'sincere relationships')
      }

      return guidance
    }

    const toneGuidance = getToneBasedGuidance()

    // Common tropes by category
    const COMMON_TROPES = {
      'Romance': [
        'enemies to lovers',
        'forced proximity',
        'fake relationship',
        'second chance romance',
        'forbidden love',
        'love triangle',
        'soulmates',
        'slow burn',
        'instalove',
        'friends to lovers'
      ],
      'Character Archetypes': [
        'chosen one',
        'reluctant hero',
        'antihero',
        'mentor dies',
        'tragic villain',
        'comic relief sidekick',
        'morally gray protagonist',
        'found family',
        'lone wolf',
        'team dynamics'
      ],
      'Plot Devices': [
        'deus ex machina',
        'red herring',
        'MacGuffin',
        'Chekhov\'s gun',
        'twist ending',
        'prophecy',
        'ticking clock',
        'race against time',
        'heist setup',
        'tournament arc'
      ],
      'Conflict': [
        'betrayal by ally',
        'secret identity revealed',
        'the world is at stake',
        'personal vs greater good',
        'revenge quest',
        'redemption arc',
        'tragic sacrifice',
        'no one is safe',
        'pyrrhic victory',
        'bittersweet ending'
      ],
      'Setting Elements': [
        'small town secrets',
        'dystopian society',
        'hidden magical world',
        'post-apocalyptic',
        'space opera',
        'medieval fantasy',
        'noir city',
        'isolated location',
        'manor mystery',
        'parallel worlds'
      ]
    }

    const toggleTrope = (trope: string, list: string[], setList: (val: string[]) => void) => {
      if (list.includes(trope)) {
        setList(list.filter(t => t !== trope))
      } else {
        setList([...list, trope])
      }
    }

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Constraints & Boundaries</h2>
          <p className="text-gray-400">Define your creative boundaries and must-have elements</p>
        </div>

        {/* Tone-Based Guidance Card */}
        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-purple-300 mb-3 flex items-center gap-2">
            <span>📊</span> Tone-Based Recommendations
          </h3>
          <div className="text-sm text-gray-300 mb-4">
            Based on your <span className="text-purple-400 font-medium">Darkness {darknessLevel}</span> and{' '}
            <span className="text-blue-400 font-medium">Humor {humorLevel}</span> settings:
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {toneGuidance.recommend.length > 0 && (
              <div className="bg-gray-900/40 rounded-lg p-4">
                <div className="text-green-400 font-medium mb-3 flex items-center gap-1">
                  <span>✓</span> Consider Including:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {toneGuidance.recommend.map(item => (
                    <span
                      key={item}
                      onClick={() => toggleTrope(item, tropesToInclude, setTropesToInclude)}
                      className={`px-2 py-1 text-xs rounded cursor-pointer transition-all ${
                        tropesToInclude.includes(item)
                          ? 'bg-green-600 text-white'
                          : 'bg-green-900/30 text-green-300 hover:bg-green-800/40'
                      }`}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {toneGuidance.avoid.length > 0 && (
              <div className="bg-gray-900/40 rounded-lg p-4">
                <div className="text-red-400 font-medium mb-3 flex items-center gap-1">
                  <span>✗</span> Consider Avoiding:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {toneGuidance.avoid.map(item => (
                    <span
                      key={item}
                      onClick={() => toggleTrope(item, tropesToAvoid, setTropesToAvoid)}
                      className={`px-2 py-1 text-xs rounded cursor-pointer transition-all ${
                        tropesToAvoid.includes(item)
                          ? 'bg-red-600 text-white'
                          : 'bg-red-900/30 text-red-300 hover:bg-red-800/40'
                      }`}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {toneGuidance.warnings.length > 0 && (
              <div className="bg-gray-900/40 rounded-lg p-4">
                <div className="text-yellow-400 font-medium mb-3 flex items-center gap-1">
                  <span>⚠</span> Likely Warnings:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {toneGuidance.warnings.map(item => (
                    <span
                      key={item}
                      onClick={() => {
                        if (!contentWarnings.includes(item)) {
                          setContentWarnings([...contentWarnings, item])
                        }
                      }}
                      className={`px-2 py-1 text-xs rounded cursor-pointer transition-all ${
                        contentWarnings.includes(item)
                          ? 'bg-yellow-600 text-white'
                          : 'bg-yellow-900/30 text-yellow-300 hover:bg-yellow-800/40'
                      }`}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tropes Section - Combined Include/Avoid in side-by-side cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tropes to Include */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <span className="text-green-400">✓</span> Tropes to Include
            </h3>
            <p className="text-xs text-gray-500 mb-4">Click badges to select, or add custom below</p>
          
            <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
              {Object.entries(COMMON_TROPES).map(([category, tropes]) => (
                <div key={category} className="bg-gray-900/30 rounded-lg p-3">
                  <div className="text-xs font-semibold text-gray-400 mb-2">{category}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {tropes.map(trope => (
                      <button
                        key={trope}
                        onClick={() => toggleTrope(trope, tropesToInclude, setTropesToInclude)}
                        className={`px-2.5 py-1 text-xs rounded-full transition-all ${
                          tropesToInclude.includes(trope)
                            ? 'bg-green-600 text-white ring-2 ring-green-400'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {trope}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <input
                type="text"
                placeholder="Add custom tropes (press Enter)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    const newTropes = e.currentTarget.value.split(',').map(t => t.trim()).filter(Boolean)
                    setTropesToInclude([...tropesToInclude, ...newTropes.filter(t => !tropesToInclude.includes(t))])
                    e.currentTarget.value = ''
                  }
                }}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
              {tropesToInclude.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="text-xs text-gray-400 mb-2">Selected ({tropesToInclude.length}):</div>
                  <div className="flex flex-wrap gap-1.5">
                    {tropesToInclude.map(trope => (
                      <span
                        key={trope}
                        className="px-2.5 py-1 bg-green-600 text-white text-xs rounded-full flex items-center gap-1.5"
                      >
                        {trope}
                        <button
                          onClick={() => setTropesToInclude(tropesToInclude.filter(t => t !== trope))}
                          className="hover:text-red-300 text-sm font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tropes to Avoid */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <span className="text-red-400">✗</span> Tropes to Avoid
            </h3>
            <p className="text-xs text-gray-500 mb-4">Click badges to select, or add custom below</p>
            
            <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
              {Object.entries(COMMON_TROPES).map(([category, tropes]) => (
                <div key={category} className="bg-gray-900/30 rounded-lg p-3">
                  <div className="text-xs font-semibold text-gray-400 mb-2">{category}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {tropes.map(trope => (
                      <button
                        key={trope}
                        onClick={() => toggleTrope(trope, tropesToAvoid, setTropesToAvoid)}
                        className={`px-2.5 py-1 text-xs rounded-full transition-all ${
                          tropesToAvoid.includes(trope)
                            ? 'bg-red-600 text-white ring-2 ring-red-400'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {trope}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <input
                type="text"
                placeholder="Add custom tropes to avoid (press Enter)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    const newTropes = e.currentTarget.value.split(',').map(t => t.trim()).filter(Boolean)
                    setTropesToAvoid([...tropesToAvoid, ...newTropes.filter(t => !tropesToAvoid.includes(t))])
                    e.currentTarget.value = ''
                  }
                }}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />
              {tropesToAvoid.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="text-xs text-gray-400 mb-2">Avoiding ({tropesToAvoid.length}):</div>
                  <div className="flex flex-wrap gap-1.5">
                    {tropesToAvoid.map(trope => (
                      <span
                        key={trope}
                        className="px-2.5 py-1 bg-red-600 text-white text-xs rounded-full flex items-center gap-1.5"
                      >
                        {trope}
                        <button
                          onClick={() => setTropesToAvoid(tropesToAvoid.filter(t => t !== trope))}
                          className="hover:text-red-300 text-sm font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Guidelines - Combined warnings/restrictions/scenes */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>🛡️</span> Content Guidelines
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Content Warnings */}
            <div>
              <label className="block text-sm font-medium text-yellow-400 mb-2 flex items-center gap-1">
                <span>⚠</span> Content Warnings
              </label>
              <p className="text-xs text-gray-500 mb-2">What sensitive content should readers expect?</p>
              <input
                type="text"
                placeholder="Type and press Enter (e.g., violence, language)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    const newWarnings = e.currentTarget.value.split(',').map(w => w.trim()).filter(Boolean)
                    setContentWarnings([...contentWarnings, ...newWarnings.filter(w => !contentWarnings.includes(w))])
                    e.currentTarget.value = ''
                  }
                }}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
              />
              {contentWarnings.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {contentWarnings.map(warning => (
                    <span
                      key={warning}
                      className="px-2.5 py-1 bg-yellow-600/20 border border-yellow-600/40 text-yellow-300 text-xs rounded flex items-center gap-1.5"
                    >
                      ⚠ {warning}
                      <button
                        onClick={() => setContentWarnings(contentWarnings.filter(w => w !== warning))}
                        className="hover:text-red-300 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Content Restrictions */}
            <div>
              <label className="block text-sm font-medium text-red-400 mb-2 flex items-center gap-1">
                <span>🚫</span> Content Restrictions
              </label>
              <p className="text-xs text-gray-500 mb-2">What must NOT appear in your story?</p>
              <input
                type="text"
                placeholder="Type and press Enter (e.g., no graphic torture)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    const newRestrictions = e.currentTarget.value.split(',').map(r => r.trim()).filter(Boolean)
                    setContentRestrictions([...contentRestrictions, ...newRestrictions.filter(r => !contentRestrictions.includes(r))])
                    e.currentTarget.value = ''
                  }
                }}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />
              {contentRestrictions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {contentRestrictions.map(restriction => (
                    <span
                      key={restriction}
                      className="px-2.5 py-1 bg-red-600/20 border border-red-600/40 text-red-300 text-xs rounded flex items-center gap-1.5"
                    >
                      ✗ {restriction}
                      <button
                        onClick={() => setContentRestrictions(contentRestrictions.filter(r => r !== restriction))}
                        className="hover:text-red-300 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Must-Have Scenes */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <span className="text-blue-400">✨</span> Must-Have Scenes & Moments
          </h3>
          <p className="text-xs text-gray-500 mb-3">Specific scenes you want to include in your story</p>
          <textarea
            rows={3}
            placeholder="e.g., dramatic rooftop confrontation, tender reconciliation scene, epic battle sequence"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && e.currentTarget.value.trim()) {
                e.preventDefault()
                const newScenes = e.currentTarget.value.split(',').map(s => s.trim()).filter(Boolean)
                setMustHaveScenes([...mustHaveScenes, ...newScenes.filter(s => !mustHaveScenes.includes(s))])
                e.currentTarget.value = ''
              }
            }}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
          />
          <div className="text-xs text-gray-500 mt-1">Press Enter to add, Shift+Enter for new line</div>
          {mustHaveScenes.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {mustHaveScenes.map((scene, idx) => (
                <div
                  key={idx}
                  className="px-3 py-2 bg-blue-600/20 border border-blue-600/40 text-blue-300 text-sm rounded flex items-start gap-2"
                >
                  <span className="text-blue-400">✨</span>
                  <span className="flex-1">{scene}</span>
                  <button
                    onClick={() => setMustHaveScenes(mustHaveScenes.filter((_, i) => i !== idx))}
                    className="hover:text-red-300 font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Additional Considerations */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-purple-400">📝</span> Additional Considerations
          </h3>

          {/* Faith Elements - Conditional */}
          {(primaryGenre === 'Christian' || primaryGenre === 'Inspirational') && (
            <div className="mb-6 pb-6 border-b border-gray-700">
              <label className="block text-sm font-medium text-purple-300 mb-2 flex items-center gap-1">
                <span>✝️</span> Faith Elements
              </label>
              <p className="text-xs text-gray-500 mb-2">How should faith be portrayed?</p>
              <textarea
                rows={3}
                value={faithElements}
                onChange={(e) => setFaithElements(e.target.value)}
                placeholder="e.g., Reformed Baptist theology, focus on grace and redemption, scripture references, prayer scenes, no prosperity gospel"
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
              />
              <div className="text-xs text-gray-500 mt-1">
                Theological framework, denominational preferences, or faith expression guidelines
              </div>
            </div>
          )}

          {/* Cultural Considerations */}
          <div>
            <label className="block text-sm font-medium text-purple-300 mb-2 flex items-center gap-1">
              <span>🌍</span> Cultural Considerations
            </label>
            <p className="text-xs text-gray-500 mb-2">Cultural authenticity, representation, and sensitivity</p>
            <textarea
              rows={3}
              value={culturalConsiderations}
              onChange={(e) => setCulturalConsiderations(e.target.value)}
              placeholder="e.g., authentic Korean cultural details, avoid stereotypes, sensitivity readers for specific topics, respectful portrayal"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
            />
            <div className="text-xs text-gray-500 mt-1">
              Cultural accuracy requirements, representation goals, or topics requiring sensitivity
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <button onClick={() => setCurrentStep(5)} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
            ← Previous
          </button>
          <button
            onClick={() => saveStep(6, {
              tropes_to_include: tropesToInclude,
              tropes_to_avoid: tropesToAvoid,
              content_warnings: contentWarnings,
              content_restrictions: contentRestrictions,
              must_have_scenes: mustHaveScenes,
              faith_elements: faithElements,
              cultural_considerations: culturalConsiderations
            })}
            disabled={isLoading}
            className="px-8 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
          >
            {isLoading ? 'Saving...' : 'Generate Baseline →'}
          </button>
        </div>
      </div>
    )
  }

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
        <div className="relative">
          {/* Edit/View Toggle */}
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => {
                setIsEditingBaseline(!isEditingBaseline)
                if (!isEditingBaseline) {
                  setBaselinePremiseEdit(baselinePremise)
                }
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {isEditingBaseline ? '👁️ Preview' : '✏️ Edit'}
            </button>
            
            {isEditingBaseline && (
              <button
                onClick={saveBaselinePremise}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded-lg transition-colors"
              >
                💾 Save Changes
              </button>
            )}
          </div>

          {isEditingBaseline ? (
            <div className="relative">
              <textarea
                value={baselinePremiseEdit}
                onChange={(e) => setBaselinePremiseEdit(e.target.value)}
                onSelect={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  const start = target.selectionStart
                  const end = target.selectionEnd
                  const selected = target.value.substring(start, end)
                  
                  if (selected.length > 0) {
                    setSelectedText(selected)
                    setSelectionStart(start)
                    setSelectionEnd(end)
                    setShowEnhanceMenu(true)
                  } else {
                    setShowEnhanceMenu(false)
                  }
                }}
                className="w-full min-h-[400px] px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              
              {/* Enhancement Menu */}
              {showEnhanceMenu && selectedText && (
                <div className="absolute top-2 right-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-2 z-10">
                  <div className="text-xs text-gray-400 mb-2 px-2">
                    Enhance Selection ({selectedText.length} chars)
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => enhanceBaselineText('expand')}
                      disabled={isEnhancing}
                      className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded transition-colors text-left"
                    >
                      📝 Expand with Detail
                    </button>
                    <button
                      onClick={() => enhanceBaselineText('funnier')}
                      disabled={isEnhancing}
                      className="px-3 py-2 text-sm bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 text-white rounded transition-colors text-left"
                    >
                      😄 Make Funnier
                    </button>
                    <button
                      onClick={() => enhanceBaselineText('dramatic')}
                      disabled={isEnhancing}
                      className="px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded transition-colors text-left"
                    >
                      🎭 More Dramatic
                    </button>
                    <button
                      onClick={() => enhanceBaselineText('descriptive')}
                      disabled={isEnhancing}
                      className="px-3 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded transition-colors text-left"
                    >
                      🌟 Add Description
                    </button>
                    <button
                      onClick={() => enhanceBaselineText('emotional')}
                      disabled={isEnhancing}
                      className="px-3 py-2 text-sm bg-pink-600 hover:bg-pink-700 disabled:bg-gray-700 text-white rounded transition-colors text-left"
                    >
                      💖 More Emotional
                    </button>
                    <button
                      onClick={() => enhanceBaselineText('concise')}
                      disabled={isEnhancing}
                      className="px-3 py-2 text-sm bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 text-white rounded transition-colors text-left"
                    >
                      ✂️ Make Concise
                    </button>
                    <button
                      onClick={() => enhanceBaselineText('rewrite')}
                      disabled={isEnhancing}
                      className="px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 text-white rounded transition-colors text-left"
                    >
                      🔄 Rewrite Fresh
                    </button>
                    <button
                      onClick={() => setShowEnhanceMenu(false)}
                      className="px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors text-left"
                    >
                      ✕ Cancel
                    </button>
                  </div>
                  {isEnhancing && (
                    <div className="mt-2 text-xs text-center text-gray-400">
                      ⏳ Enhancing...
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
              <div className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-gray-300 leading-relaxed">{baselinePremise}</pre>
              </div>
            </div>
          )}
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
                  <>
                    <button
                      onClick={() => {
                        const previewUrl = `/api/premise-builder/sessions/${sessionId}/preview`
                        window.open(previewUrl, '_blank', 'width=1000,height=800')
                      }}
                      className="px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2"
                      title="Open live preview of your story plan"
                    >
                      <span>📖</span>
                      <span>Preview</span>
                    </button>
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
                  </>
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
