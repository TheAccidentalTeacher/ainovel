import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import apiClient from '../lib/apiClient'
import type { Genre } from '../types'

export default function NewProjectPage() {
  const navigate = useNavigate()
  const [showManualForm, setShowManualForm] = useState(false)
  const [hasSavedSession, setHasSavedSession] = useState(false)

  // Check for saved premise builder session
  useEffect(() => {
    const savedSessionId = localStorage.getItem('premiseBuilderSessionId')
    setHasSavedSession(!!savedSessionId)
  }, [])
  const [formData, setFormData] = useState({
    title: '',
    genre: '',
    subgenre: '',
    targetWordCount: 50000,
    targetChapterCount: 20,
    premise: '',
  })

  // Load genres
  const { data: genres = [], isLoading: genresLoading, error: genresError } = useQuery<Genre[]>({
    queryKey: ['genres'],
    queryFn: () => apiClient.getGenres(),
  })

  // Calculate word count (derived state, no effect needed)
  const wordCount = formData.premise.trim().split(/\s+/).filter(w => w.length > 0).length

  // Create project mutation
  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof apiClient.createProject>[0]) => apiClient.createProject(data),
    onSuccess: (response: { project: { id: string } }) => {
      navigate(`/projects/${response.project.id}`)
    },
  })

  const selectedGenre = genres.find(g => g.id === formData.genre)
  const isValid = formData.genre && formData.premise.length >= 10 && wordCount <= 5000

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    createMutation.mutate({
      title: formData.title || undefined,
      genre: formData.genre,
      subgenre: formData.subgenre || undefined,
      target_word_count: formData.targetWordCount,
      target_chapter_count: formData.targetChapterCount,
      premise: formData.premise,
    })
  }

  const getWordCountColor = () => {
    if (wordCount > 5000) return 'text-red-400'
    if (wordCount > 4000) return 'text-yellow-400'
    return 'text-gray-400'
  }

  if (genresLoading) {
    return <div className="p-8 text-center text-gray-400">Loading genres...</div>
  }

  if (genresError) {
    return <div className="p-8 text-center text-red-400">Error loading genres: {(genresError as Error).message}</div>
  }

  // Show choice screen first
  if (!showManualForm) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Create New Project</h1>
        <p className="text-gray-400 mb-8">Choose how you'd like to create your novel premise</p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Guided Builder Option */}
          <div className="bg-gradient-to-br from-primary-600/20 to-primary-800/20 border-2 border-primary-500/50 rounded-xl p-6 hover:border-primary-400 transition-colors cursor-pointer group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center text-2xl">
                ✨
              </div>
              <span className="text-xs font-semibold text-primary-400 bg-primary-900/50 px-2 py-1 rounded">RECOMMENDED</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Guided Premise Builder</h2>
            <p className="text-gray-400 text-sm mb-4">
              Step-by-step wizard with AI assistance at each stage. Perfect for writers who want help developing their story.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="text-sm text-gray-300 flex items-center">
                <span className="text-primary-400 mr-2">✓</span>
                8-step guided process
              </li>
              <li className="text-sm text-gray-300 flex items-center">
                <span className="text-primary-400 mr-2">✓</span>
                AI suggestions for characters, plot, themes
              </li>
              <li className="text-sm text-gray-300 flex items-center">
                <span className="text-primary-400 mr-2">✓</span>
                Premium AI-generated premise
              </li>
              <li className="text-sm text-gray-300 flex items-center">
                <span className="text-primary-400 mr-2">✓</span>
                Autosave & resume anytime
              </li>
            </ul>
            <button
              onClick={() => navigate('/premise-builder/new')}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors group-hover:shadow-lg group-hover:shadow-primary-500/50"
            >
              Start Guided Builder
            </button>
          </div>

          {/* Manual Entry Option */}
          <div className="bg-gray-800/50 border-2 border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors cursor-pointer group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center text-2xl">
                📝
              </div>
              <span className="text-xs font-semibold text-gray-500 bg-gray-800 px-2 py-1 rounded">ADVANCED</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Manual Entry</h2>
            <p className="text-gray-400 text-sm mb-4">
              Write your complete premise directly. Best for writers who already have a detailed story ready.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="text-sm text-gray-300 flex items-center">
                <span className="text-gray-500 mr-2">✓</span>
                Quick single-page form
              </li>
              <li className="text-sm text-gray-300 flex items-center">
                <span className="text-gray-500 mr-2">✓</span>
                Full creative control
              </li>
              <li className="text-sm text-gray-300 flex items-center">
                <span className="text-gray-500 mr-2">✓</span>
                No AI assistance needed
              </li>
              <li className="text-sm text-gray-300 flex items-center">
                <span className="text-gray-500 mr-2">✓</span>
                Faster for prepared writers
              </li>
            </ul>
            <button
              onClick={() => setShowManualForm(true)}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Use Manual Entry
            </button>
          </div>
        </div>

        {/* Resume Saved Session Option */}
        {hasSavedSession && (
          <div className="mt-6">
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💾</span>
                  <div>
                    <h3 className="text-blue-300 font-medium">Resume Previous Session</h3>
                    <p className="text-blue-200 text-sm">You have an unfinished guided premise builder session</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/premise-builder/new?mode=resume')}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Resume
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            ← Back to Projects
          </button>
        </div>
      </div>
    )
  }

  // Show manual form
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <button
        onClick={() => setShowManualForm(false)}
        className="text-gray-400 hover:text-white transition-colors text-sm mb-4 flex items-center"
      >
        ← Back to Options
      </button>
      <h1 className="text-3xl font-bold text-white mb-2">Create New Project</h1>
      <p className="text-gray-400 mb-8">Enter your novel premise and settings to begin</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Project Title (Optional)
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="My Novel"
          />
        </div>

        {/* Genre Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Genre <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.genre}
              onChange={(e) => setFormData({ ...formData, genre: e.target.value, subgenre: '' })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Select Genre</option>
              {genres.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Subgenre
            </label>
            <select
              value={formData.subgenre}
              onChange={(e) => setFormData({ ...formData, subgenre: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={!selectedGenre}
            >
              <option value="">Select Subgenre</option>
              {selectedGenre?.subgenres.map((subgenre) => (
                <option key={subgenre} value={subgenre}>
                  {subgenre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Word Count & Chapter Count */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Target Word Count
            </label>
            <input
              type="number"
              value={formData.targetWordCount}
              onChange={(e) => setFormData({ ...formData, targetWordCount: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              min={1000}
              max={250000}
              required
            />
            <p className="text-xs text-gray-500 mt-1">1,000 - 250,000 words</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Target Chapter Count
            </label>
            <input
              type="number"
              value={formData.targetChapterCount}
              onChange={(e) => setFormData({ ...formData, targetChapterCount: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              min={1}
              max={100}
              required
            />
            <p className="text-xs text-gray-500 mt-1">1 - 100 chapters</p>
          </div>
        </div>

        {/* Premise */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-300">
              Premise <span className="text-red-400">*</span>
            </label>
            <span className={`text-sm font-medium ${getWordCountColor()}`}>
              {wordCount} / 5000 words
              {wordCount > 5000 && <span className="ml-2 text-red-400">⚠ Exceeds limit</span>}
            </span>
          </div>
          <textarea
            value={formData.premise}
            onChange={(e) => setFormData({ ...formData, premise: e.target.value })}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500 h-64 resize-none font-mono text-sm"
            placeholder="Describe your novel in detail. Include characters, setting, plot, themes, and any specific details you want the AI to incorporate. The more detail you provide (up to 5000 words), the better the AI can generate your outline."
            required
          />
          <p className="text-xs text-gray-500 mt-2">
            Provide as much detail as possible. Include character backgrounds, plot arcs, themes, setting details, and any specific scenes or elements you envision.
          </p>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValid || createMutation.isPending}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Project & Generate Outline'}
          </button>
        </div>

        {createMutation.isError && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
            <p className="text-red-400">Error creating project: {(createMutation.error as Error).message}</p>
          </div>
        )}
      </form>
    </div>
  )
}
