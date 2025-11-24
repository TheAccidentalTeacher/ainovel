import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface ProjectStub {
  title: string
  logline: string
}

export default function PremiseBuilderPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Step 0: Project Info
  const [projectTitle, setProjectTitle] = useState('')
  const [logline, setLogline] = useState('')
  const [titleError, setTitleError] = useState('')
  const [loglineError, setLoglineError] = useState('')

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

  // Create session on mount
  useEffect(() => {
    const createSession = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('http://127.0.0.1:8000/api/premise-builder/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current_step: 0 })
        })
        
        if (!response.ok) throw new Error('Failed to create session')
        
        const data = await response.json()
        setSessionId(data.session_id)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create session')
      } finally {
        setIsLoading(false)
      }
    }
    
    createSession()
  }, [])

  // Validate Step 0
  const validateStep0 = (): boolean => {
    let valid = true
    
    if (!projectTitle.trim()) {
      setTitleError('Title is required')
      valid = false
    } else if (projectTitle.length < 3) {
      setTitleError('Title must be at least 3 characters')
      valid = false
    } else {
      setTitleError('')
    }
    
    if (!logline.trim()) {
      setLoglineError('Logline is required')
      valid = false
    } else if (logline.length < 20) {
      setLoglineError('Logline should be at least 20 characters')
      valid = false
    } else {
      setLoglineError('')
    }
    
    return valid
  }

  // Save Step 0 and advance
  const handleStep0Next = async () => {
    if (!validateStep0() || !sessionId) return
    
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`http://127.0.0.1:8000/api/premise-builder/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_stub: {
            title: projectTitle,
            logline: logline
          },
          current_step: 1
        })
      })
      
      if (!response.ok) throw new Error('Failed to save project info')
      
      setCurrentStep(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Let's Start with the Basics</h2>
              <p className="text-gray-400">What's your novel called, and what's it about?</p>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-400">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                Project Title <span className="text-red-400">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={projectTitle}
                onChange={(e) => {
                  setProjectTitle(e.target.value)
                  if (titleError) setTitleError('')
                }}
                placeholder="e.g., Starlight Over Paradise Valley"
                className={`w-full px-4 py-3 bg-gray-900 border ${
                  titleError ? 'border-red-500' : 'border-gray-700'
                } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500`}
              />
              {titleError && <p className="text-red-400 text-sm mt-1">{titleError}</p>}
            </div>

            <div>
              <label htmlFor="logline" className="block text-sm font-medium text-gray-300 mb-2">
                One-Sentence Logline <span className="text-red-400">*</span>
              </label>
              <textarea
                id="logline"
                rows={3}
                value={logline}
                onChange={(e) => {
                  setLogline(e.target.value)
                  if (loglineError) setLoglineError('')
                }}
                placeholder="e.g., A three-legged Amish banjo player falls for a mysterious woman from the stars, forcing a secret alien colony to choose between their hidden past and cosmic destiny."
                className={`w-full px-4 py-3 bg-gray-900 border ${
                  loglineError ? 'border-red-500' : 'border-gray-700'
                } rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none`}
              />
              {loglineError && <p className="text-red-400 text-sm mt-1">{loglineError}</p>}
              <p className="text-gray-500 text-sm mt-2">
                {logline.length} characters • A great logline captures your story's core conflict
              </p>
            </div>

            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <h4 className="text-blue-300 font-medium mb-1">Pro Tip</h4>
                  <p className="text-blue-200 text-sm">
                    Your logline should answer: Who is the protagonist? What do they want? What stands in their way?
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
                onClick={handleStep0Next}
                disabled={isLoading}
                className="px-8 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                {isLoading ? 'Saving...' : 'Next Step →'}
              </button>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🚧</div>
            <h2 className="text-2xl font-bold text-white mb-3">Step {currentStep} Coming Soon!</h2>
            <p className="text-gray-400 mb-6">This step is under construction</p>
            <button
              onClick={handlePrevious}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              ← Previous Step
            </button>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Guided Premise Builder</h1>
              <p className="text-gray-400 text-sm">Create your novel premise step-by-step with AI assistance</p>
            </div>
            <button
              onClick={() => navigate('/new')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Exit Builder
            </button>
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

      {/* Content Area */}
      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
          {renderStepContent()}
        </div>
      </div>
    </div>
  )
}
