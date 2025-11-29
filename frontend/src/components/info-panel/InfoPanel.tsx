import { useEffect, useRef, useState } from 'react';
import { BookOpen, Users, Map, Target, TrendingUp, GripVertical } from 'lucide-react';
import type { Project, StoryBible, Outline } from '../../types';
import { useInfoPanel } from '../../hooks/useInfoPanel';

interface InfoPanelProps {
  project: Project | null;
  storyBible?: StoryBible;
  outline?: Outline;
  isVisible: boolean;
}

export const InfoPanel = ({ project, storyBible, outline, isVisible }: InfoPanelProps) => {
  const { width, setWidth } = useInfoPanel();
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle resize drag
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return;
      const rect = panelRef.current.getBoundingClientRect();
      const newWidth = rect.right - e.clientX;
      // Constrain between 300px and 600px
      const constrainedWidth = Math.max(300, Math.min(600, newWidth));
      setWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, setWidth]);

  // Change cursor when dragging
  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }, [isDragging]);

  if (!isVisible || !project) {
    return null;
  }

  const progress = project.total_chapters > 0 
    ? Math.round((project.completed_chapters / project.total_chapters) * 100) 
    : 0;

  return (
    <aside
      ref={panelRef}
      style={{ width: `${width}px` }}
      className="bg-white border-l border-gray-200 flex-shrink-0 overflow-y-auto transition-all duration-300 ease-in-out relative"
    >
      {/* Resize Handle */}
      <div
        onMouseDown={() => setIsDragging(true)}
        className="absolute left-0 top-0 bottom-0 w-1 hover:w-1.5 bg-transparent hover:bg-violet-400 cursor-ew-resize transition-all group"
        title="Drag to resize"
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical size={16} className="text-violet-600" />
        </div>
      </div>

      <div className="p-6 pl-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={20} className="text-violet-600" />
            <h2 className="text-lg font-semibold text-gray-900">Project Info</h2>
          </div>
          <p className="text-sm text-gray-500">Linked to chat context</p>
        </div>

        {/* Project Title & Genre */}
        <div className="mb-6 pb-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{project.title}</h3>
          {project.genre && (
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2 py-1 bg-violet-50 text-violet-700 rounded-md font-medium">
                {project.genre}
              </span>
              {project.subgenre && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                  {project.subgenre}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="mb-6 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-violet-600" />
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Progress</h4>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Chapters</span>
                <span className="font-medium text-gray-900">
                  {project.completed_chapters} / {project.total_chapters}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-violet-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Word Count</span>
              <span className="font-medium text-gray-900">
                {project.total_word_count.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Status</span>
              <span className={`font-medium capitalize ${
                project.status === 'completed' ? 'text-green-600' :
                project.status === 'generating' ? 'text-blue-600' :
                project.status === 'error' ? 'text-red-600' :
                'text-amber-600'
              }`}>
                {project.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Characters */}
        {storyBible && storyBible.characters.length > 0 && (
          <div className="mb-6 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Users size={16} className="text-violet-600" />
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Characters</h4>
            </div>
            <div className="space-y-3">
              {storyBible.characters.slice(0, 5).map((character, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-3">
                  <div className="font-medium text-gray-900 mb-1">{character.name}</div>
                  <div className="text-xs text-gray-500 mb-1 capitalize">{character.role}</div>
                  {character.age && (
                    <div className="text-xs text-gray-600">Age: {character.age}</div>
                  )}
                </div>
              ))}
              {storyBible.characters.length > 5 && (
                <div className="text-xs text-gray-500 text-center">
                  +{storyBible.characters.length - 5} more characters
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings/Locations */}
        {storyBible && storyBible.settings.length > 0 && (
          <div className="mb-6 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Map size={16} className="text-violet-600" />
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Settings</h4>
            </div>
            <div className="space-y-2">
              {storyBible.settings.slice(0, 4).map((setting, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-3">
                  <div className="font-medium text-gray-900 text-sm">{setting.name}</div>
                  {setting.description && (
                    <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {setting.description}
                    </div>
                  )}
                </div>
              ))}
              {storyBible.settings.length > 4 && (
                <div className="text-xs text-gray-500 text-center">
                  +{storyBible.settings.length - 4} more locations
                </div>
              )}
            </div>
          </div>
        )}

        {/* Themes */}
        {storyBible && storyBible.themes.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Target size={16} className="text-violet-600" />
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Themes</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {storyBible.themes.map((theme, idx) => (
                <span
                  key={idx}
                  className="text-xs px-3 py-1.5 bg-violet-50 text-violet-700 rounded-full font-medium"
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Outline Info */}
        {outline && (
          <div className="mb-6 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={16} className="text-violet-600" />
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Outline</h4>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Chapters</span>
                <span className="font-medium text-gray-900">{outline.chapters.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Target Words</span>
                <span className="font-medium text-gray-900">
                  {outline.total_target_words.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Empty state when no story bible */}
        {!storyBible && (
          <div className="text-center py-8 px-4">
            <div className="text-gray-400 mb-2">
              <BookOpen size={48} className="mx-auto" />
            </div>
            <p className="text-sm text-gray-500">
              No story bible data yet. Visit Novel Studio to add characters, settings, and themes.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
