import React from 'react';
import { X, ExternalLink, FileText, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../types';

interface LinkedProjectCardProps {
  project: Project;
  onUnlink: () => void;
}

export const LinkedProjectCard: React.FC<LinkedProjectCardProps> = ({ project, onUnlink }) => {
  const navigate = useNavigate();

  // Calculate progress
  const progressPercentage = (project.target_word_count ?? 0) > 0
    ? Math.round(((project.current_word_count ?? 0) / (project.target_word_count ?? 1)) * 100)
    : 0;

  return (
    <div className="bg-gradient-to-r from-violet-50 to-purple-50 border-2 border-violet-200 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-violet-600 rounded-lg flex items-center justify-center">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{project.title}</h3>
            <p className="text-xs text-gray-600">{project.genre}</p>
          </div>
        </div>
        <button
          onClick={onUnlink}
          className="p-1 hover:bg-violet-100 rounded-md transition-colors"
          title="Unlink project"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>Progress</span>
          <span className="font-medium">{progressPercentage}%</span>
        </div>
        <div className="w-full bg-white rounded-full h-2">
          <div
            className="bg-gradient-to-r from-violet-600 to-purple-600 h-2 rounded-full transition-all"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
          <span>{(project.current_word_count ?? 0).toLocaleString()} words</span>
          <span>{(project.target_word_count ?? 0).toLocaleString()} target</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-white rounded-md p-2">
          <div className="flex items-center space-x-1 text-xs text-gray-500 mb-0.5">
            <FileText className="h-3 w-3" />
            <span>Chapters</span>
          </div>
          <p className="text-sm font-semibold text-gray-900">
            {project.current_chapter_count ?? 0} / {project.target_chapter_count ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-md p-2">
          <div className="flex items-center space-x-1 text-xs text-gray-500 mb-0.5">
            <Target className="h-3 w-3" />
            <span>Status</span>
          </div>
          <p className={`text-sm font-semibold ${
            project.status === 'completed' ? 'text-green-600' :
            project.status === 'generating' ? 'text-blue-600' :
            'text-gray-600'
          }`}>
            {project.status.replace('_', ' ')}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => navigate(`/studio/projects/${project.id}`)}
          className="flex-1 flex items-center justify-center px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-md text-xs font-medium text-gray-700 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
          Open in Studio
        </button>
        {project.status !== 'draft' && (
          <button
            onClick={() => navigate(`/studio/projects/${project.id}/outline`)}
            className="flex-1 flex items-center justify-center px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-md text-xs font-medium text-gray-700 transition-colors"
          >
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            View Outline
          </button>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-violet-200">
        <p className="text-xs text-gray-600 leading-relaxed">
          💡 <span className="font-medium">AI has context:</span> I can now help with character development, 
          plot questions, and chapter planning for this project.
        </p>
      </div>
    </div>
  );
};
