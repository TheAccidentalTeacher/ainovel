import React, { useState } from 'react';
import { Link as LinkIcon, ExternalLink, FileText, Link2Off } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../../types';

interface ProjectListProps {
  projects: Project[];
  linkedProjectId: string | null;
  onLinkProject: (projectId: string) => void;
  onUnlinkProject: () => void;
  isLoading?: boolean;
}

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  linkedProjectId,
  onLinkProject,
  onUnlinkProject,
  isLoading = false,
}) => {
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-lg" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-gray-500 mb-3">No projects yet</p>
        <p className="text-xs text-gray-400 mb-4 px-4">
          Create a project in Novel Studio
        </p>
        <button
          onClick={() => navigate('/studio/new')}
          className="inline-flex items-center px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Go to Studio
        </button>
      </div>
    );
  }

  const recentProjects = projects.slice(0, 5);

  return (
    <div className="space-y-1">
      {recentProjects.map((project) => {
        const isLinked = linkedProjectId === project.id;
        const isExpanded = expandedProjectId === project.id;

        return (
          <div key={project.id} className="relative">
            <div
              className={`
                group rounded-lg transition-all cursor-pointer
                ${isLinked 
                  ? 'bg-violet-50 border-2 border-violet-200' 
                  : 'border-2 border-transparent hover:bg-gray-50'
                }
              `}
              onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
            >
              <div className="flex items-center p-2 pr-3">
                {/* Project info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <p className={`
                      text-sm font-medium truncate
                      ${isLinked ? 'text-violet-900' : 'text-gray-700'}
                    `}>
                      {project.title}
                    </p>
                    {isLinked && (
                      <Link2Off 
                        className="h-4 w-4 text-violet-600 ml-2 flex-shrink-0" 
                        title="Linked to chat"
                      />
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-xs text-gray-500">{project.genre}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className={`
                      text-xs px-1.5 py-0.5 rounded
                      ${project.status === 'complete' ? 'bg-green-100 text-green-700' :
                        project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'}
                    `}>
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Quick action indicator */}
                <div className="ml-2">
                  <button
                    className="p-1 rounded-md hover:bg-white hover:shadow-sm transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedProjectId(isExpanded ? null : project.id);
                    }}
                  >
                    <FileText className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions Menu */}
            {isExpanded && (
              <div className="mt-1 ml-2 p-2 bg-white border border-gray-200 rounded-lg shadow-lg space-y-1">
                <button
                  onClick={() => {
                    navigate(`/studio/projects/${project.id}`);
                    setExpandedProjectId(null);
                  }}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <ExternalLink className="h-4 w-4 mr-2 text-gray-400" />
                  Open in Studio
                </button>

                {isLinked ? (
                  <button
                    onClick={() => {
                      onUnlinkProject();
                      setExpandedProjectId(null);
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Link2Off className="h-4 w-4 mr-2" />
                    Unlink from Chat
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onLinkProject(project.id);
                      setExpandedProjectId(null);
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm text-violet-600 hover:bg-violet-50 rounded-md transition-colors"
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Link to Chat
                  </button>
                )}

                {project.status !== 'draft' && (
                  <button
                    onClick={() => {
                      navigate(`/studio/projects/${project.id}/outline`);
                      setExpandedProjectId(null);
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <FileText className="h-4 w-4 mr-2 text-gray-400" />
                    View Outline
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {projects.length > 5 && (
        <button
          onClick={() => navigate('/studio')}
          className="w-full text-xs text-violet-600 hover:text-violet-700 py-2 text-center"
        >
          View all {projects.length} projects →
        </button>
      )}
    </div>
  );
};
