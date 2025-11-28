import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusIcon, TrashIcon, FolderIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import apiClient from '../lib/apiClient'
import type { Project } from '../types'

export default function HomePage() {
  const [hasSavedSession, setHasSavedSession] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiClient.listProjects(),
  })

  const deleteMutation = useMutation({
    mutationFn: (projectId: string) => apiClient.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setDeletingId(null)
    },
    onError: (error) => {
      console.error('Failed to delete project:', error)
      alert('Failed to delete project. Please try again.')
      setDeletingId(null)
    }
  })

  // Check for saved premise builder session
  useEffect(() => {
    const savedSessionId = localStorage.getItem('premiseBuilderSessionId')
    setHasSavedSession(!!savedSessionId)
  }, [])

  const handleDelete = async (projectId: string, projectTitle: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (confirm(`Are you sure you want to delete "${projectTitle}"? This cannot be undone.`)) {
      setDeletingId(projectId)
      deleteMutation.mutate(projectId)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <p className="text-red-400">Error loading projects. Please try again.</p>
        </div>
      </div>
    )
  }

  const projects: Project[] = data?.projects || []
  
  // Group projects by folder
  const projectsByFolder = projects.reduce((acc, project) => {
    const folder = project.folder || 'Uncategorized'
    if (!acc[folder]) acc[folder] = []
    acc[folder].push(project)
    return acc
  }, {} as Record<string, Project[]>)

  const folders = Object.keys(projectsByFolder).sort()

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Your Projects</h1>
          <p className="text-gray-400 mt-1">Manage and create AI-generated novels</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/cover-designer"
            className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <span className="mr-2">🎨</span>
            Book Cover Designer
          </Link>
          {hasSavedSession && (
            <Link
              to="/premise-builder/new?mode=resume"
              className="inline-flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors border border-gray-600"
            >
              <span className="mr-2">📋</span>
              Resume Last Session
            </Link>
          )}
          <Link
            to="/new"
            className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Project
          </Link>
        </div>
      </div>

      {/* Projects by Folder */}
      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg mb-4">No projects yet</p>
          <Link
            to="/new"
            className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Your First Project
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {folders.map((folder) => (
            <div key={folder}>
              {/* Folder Header */}
              <div className="flex items-center gap-2 mb-4">
                <FolderIcon className="h-5 w-5 text-primary-400" />
                <h2 className="text-xl font-semibold text-white">{folder}</h2>
                <span className="text-sm text-gray-500">({projectsByFolder[folder].length})</span>
              </div>

              {/* Projects Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projectsByFolder[folder].map((project) => (
                  <div
                    key={project.id}
                    className="relative bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-primary-500 transition-colors group"
                  >
                    <Link to={`/projects/${project.id}`} className="block">
                      <h3 className="text-xl font-semibold text-white mb-2 pr-8">{project.title}</h3>
                      <div className="space-y-2 text-sm text-gray-400">
                        <p>
                          <span className="text-gray-500">Genre:</span> {project.genre || 'Not set'}
                        </p>
                        <p>
                          <span className="text-gray-500">Progress:</span> {project.completed_chapters} / {project.total_chapters} chapters
                        </p>
                        <p>
                          <span className="text-gray-500">Words:</span> {project.total_word_count.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          Created: {formatDate(project.created_at)}
                        </p>
                        {project.updated_at !== project.created_at && (
                          <p className="text-xs text-gray-500">
                            Updated: {formatDate(project.updated_at)}
                          </p>
                        )}
                        <div className="pt-2">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            project.status === 'completed' ? 'bg-green-900/30 text-green-400' :
                            project.status === 'generating' ? 'bg-blue-900/30 text-blue-400' :
                            project.status === 'error' ? 'bg-red-900/30 text-red-400' :
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {project.status}
                          </span>
                        </div>
                      </div>
                    </Link>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleDelete(project.id, project.title, e)}
                      disabled={deletingId === project.id}
                      className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      title="Delete project"
                    >
                      {deletingId === project.id ? (
                        <div className="animate-spin h-5 w-5 border-2 border-red-400 border-t-transparent rounded-full"></div>
                      ) : (
                        <TrashIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
