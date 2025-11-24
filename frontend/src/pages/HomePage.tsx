import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PlusIcon } from '@heroicons/react/24/outline'
import apiClient from '../lib/api-client'
import type { Project } from '../types'

export default function HomePage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiClient.listProjects(),
  })

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

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Your Projects</h1>
          <p className="text-gray-400 mt-1">Manage and create AI-generated novels</p>
        </div>
        <Link
          to="/new"
          className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Project
        </Link>
      </div>

      {/* Projects Grid */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="block bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-primary-500 transition-colors"
            >
              <h3 className="text-xl font-semibold text-white mb-2">{project.title}</h3>
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
          ))}
        </div>
      )}
    </div>
  )
}
