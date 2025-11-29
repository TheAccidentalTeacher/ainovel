import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check } from 'lucide-react';
import type { Context } from '../../types';

interface ContextListProps {
  contexts: Context[];
  onActivate: (contextId: string) => void;
  onEdit: (context: Context) => void;
  onDelete: (contextId: string) => void;
  onCreate: () => void;
  isLoading?: boolean;
}

export const ContextList: React.FC<ContextListProps> = ({
  contexts,
  onActivate,
  onEdit,
  onDelete,
  onCreate,
  isLoading = false,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-gray-100 rounded-lg" />
        ))}
      </div>
    );
  }

  if (contexts.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-gray-500 mb-3">No contexts yet</p>
        <p className="text-xs text-gray-400 mb-4 px-4">
          Create your first context to organize your conversations
        </p>
        <button
          onClick={onCreate}
          className="inline-flex items-center px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Context
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {contexts.map((context) => (
        <div
          key={context._id}
          className={`
            group relative rounded-lg transition-all cursor-pointer
            ${context.is_active 
              ? 'bg-violet-50 border-2 border-violet-200' 
              : 'border-2 border-transparent hover:bg-gray-50'
            }
          `}
          onMouseEnter={() => setHoveredId(context._id)}
          onMouseLeave={() => setHoveredId(null)}
          onClick={() => !context.is_active && onActivate(context._id)}
        >
          <div className="flex items-center p-2 pr-3">
            {/* Icon with colored background */}
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mr-3"
              style={{ backgroundColor: `${context.color}20` }}
            >
              <span className="text-lg" role="img" aria-label={context.name}>
                {context.icon}
              </span>
            </div>

            {/* Context name and conversation count */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <p className={`
                  text-sm font-medium truncate
                  ${context.is_active ? 'text-violet-900' : 'text-gray-700'}
                `}>
                  {context.name}
                </p>
                {context.is_active && (
                  <Check className="h-4 w-4 text-violet-600 ml-2 flex-shrink-0" />
                )}
              </div>
              {context.conversation_count > 0 && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {context.conversation_count} conversation{context.conversation_count !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Hover actions */}
            {hoveredId === context._id && (
              <div className="flex items-center space-x-1 ml-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onEdit(context)}
                  className="p-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all"
                  title="Edit context name, icon, color, or description"
                >
                  <Edit2 className="h-3.5 w-3.5 text-gray-600" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${context.name}"?\n\nThis will remove the context but your conversations will be preserved.`)) {
                      onDelete(context._id);
                    }
                  }}
                  className="p-1.5 rounded-md hover:bg-red-50 hover:shadow-sm transition-all"
                  title="Delete this context (conversations stay safe)"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-600" />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Create new context button */}
      <button
        onClick={onCreate}
        className="w-full flex items-center justify-center p-2 mt-2 text-sm font-medium text-violet-600 hover:bg-violet-50 rounded-lg transition-colors border-2 border-dashed border-violet-200 hover:border-violet-300"
        title="Create a new mental mode for your AI - like Romance, Sci-Fi, Mystery, etc."
      >
        <Plus className="h-4 w-4 mr-2" />
        New Context
      </button>
    </div>
  );
};
