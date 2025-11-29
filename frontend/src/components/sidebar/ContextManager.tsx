import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import type { Context, ContextCreate, ContextUpdate } from '../../types';

interface ContextManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ContextCreate | ContextUpdate) => Promise<void>;
  context?: Context | null;  // If provided, we're editing; otherwise creating
}

const PRESET_COLORS = [
  '#7C3AED', // Violet (WriteMind purple)
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
];

const PRESET_ICONS = [
  '💬', '📖', '🚀', '⚔️', '💡', '🎨', '🔬', '🎭',
  '🏰', '🌟', '🔥', '💎', '🌙', '☀️', '🌈', '⚡'
];

export const ContextManager: React.FC<ContextManagerProps> = ({
  isOpen,
  onClose,
  onSave,
  context,
}) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💬');
  const [color, setColor] = useState('#7C3AED');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!context;

  // Load existing context data when editing
  useEffect(() => {
    if (context) {
      setName(context.name);
      setIcon(context.icon);
      setColor(context.color);
      setDescription(context.description || '');
    } else {
      // Reset for new context
      setName('');
      setIcon('💬');
      setColor('#7C3AED');
      setDescription('');
    }
    setError('');
  }, [context, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Context name is required');
      return;
    }

    if (name.length > 100) {
      setError('Context name must be 100 characters or less');
      return;
    }

    if (description.length > 500) {
      setError('Description must be 500 characters or less');
      return;
    }

    setIsSaving(true);

    try {
      const data = isEditing
        ? { name: name.trim(), icon, color, description: description.trim() || undefined }
        : { name: name.trim(), icon, color, description: description.trim() || undefined };

      await onSave(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save context');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Context' : 'Create New Context'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSaving}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Context Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              placeholder="e.g., Romance Projects"
              maxLength={100}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">{name.length}/100 characters</p>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icon
            </label>
            <div className="grid grid-cols-8 gap-2">
              {PRESET_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`
                    w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all
                    ${icon === emoji 
                      ? 'bg-violet-100 ring-2 ring-violet-500 scale-110' 
                      : 'bg-gray-100 hover:bg-gray-200'
                    }
                  `}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="grid grid-cols-8 gap-2 mb-3">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => setColor(presetColor)}
                  className={`
                    w-10 h-10 rounded-lg transition-all relative
                    ${color === presetColor ? 'ring-2 ring-gray-900 ring-offset-2 scale-110' : 'hover:scale-105'}
                  `}
                  style={{ backgroundColor: presetColor }}
                >
                  {color === presetColor && (
                    <Check className="h-5 w-5 text-white absolute inset-0 m-auto drop-shadow" />
                  )}
                </button>
              ))}
            </div>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
              placeholder="Notes about this context..."
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{description.length}/500 characters</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSaving || !name.trim()}
          >
            {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Context'}
          </button>
        </div>
      </div>
    </div>
  );
};
