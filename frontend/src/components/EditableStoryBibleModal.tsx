import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import type { StoryBible, Character, Setting } from '../types';

interface EditableStoryBibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyBible: StoryBible;
  projectId: string;
}

type TabType = 'characters' | 'settings' | 'themes' | 'plot';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api');

export default function EditableStoryBibleModal({ isOpen, onClose, storyBible, projectId }: EditableStoryBibleModalProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('characters');
  const [expandedCharacter, setExpandedCharacter] = useState<number | null>(null);
  const [expandedSetting, setExpandedSetting] = useState<number | null>(null);
  const [editedBible, setEditedBible] = useState<StoryBible>(JSON.parse(JSON.stringify(storyBible)));
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Reset edited bible when story bible prop changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setEditedBible(JSON.parse(JSON.stringify(storyBible)));
      setHasUnsavedChanges(false);
    }
  }, [isOpen, storyBible]);
  
  // AI Enhancement state
  const [selectedText, setSelectedText] = useState('');
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [showEnhanceMenu, setShowEnhanceMenu] = useState(false);
  const [currentTextarea, setCurrentTextarea] = useState<HTMLTextAreaElement | null>(null);
  const [customEnhancement, setCustomEnhancement] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: StoryBible) => {
      return apiClient.updateStoryBible(projectId, {
        characters: data.characters,
        settings: data.settings,
        themes: data.themes,
        humor_style: data.humor_style,
        tone_notes: data.tone_notes,
        genre_guidelines: data.genre_guidelines,
        main_plot_arc: data.main_plot_arc,
        subplots: data.subplots,
        key_milestones: data.key_milestones,
      });
    },
    onSuccess: async () => {
      setHasUnsavedChanges(false);
      await queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      alert('Story Bible saved successfully!');
    },
    onError: (error) => {
      console.error('Failed to save Story Bible:', error);
      alert('Failed to save Story Bible. Please try again.');
    }
  });

  // AI Enhancement
  const enhanceText = async (enhancementType: string, customInstruction?: string) => {
    if (!selectedText || !currentTextarea) return;
    
    setIsEnhancing(true);
    try {
      const enhancementPrompts: Record<string, string> = {
        expand: 'Expand this text with more vivid details and depth',
        simplify: 'Simplify and clarify this text while keeping its meaning',
        dramatize: 'Make this text more dramatic and emotionally compelling',
        descriptive: 'Add rich sensory details and descriptions',
        emotional: 'Enhance the emotional resonance of this text',
        concise: 'Make this more concise while keeping key information',
        funnier: 'Add wit, humor, and lighter tone to this text',
        custom: customInstruction || 'Enhance this text'
      };
      
      const prompt = enhancementPrompts[enhancementType] || 'Enhance this text';
      
      const response = await fetch(`${API_BASE}/projects/${projectId}/enhance-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: selectedText,
          instruction: prompt
        })
      });
      
      if (!response.ok) throw new Error('Enhancement failed');
      
      const data = await response.json();
      const enhanced = data.enhanced_text || data.result || selectedText;
      
      // Replace selected text with enhanced version
      const currentValue = currentTextarea.value;
      const before = currentValue.substring(0, selectionStart);
      const after = currentValue.substring(selectionEnd);
      const newValue = before + enhanced + after;
      
      currentTextarea.value = newValue;
      
      // Trigger change event to update state
      const event = new Event('input', { bubbles: true });
      currentTextarea.dispatchEvent(event);
      
      setShowEnhanceMenu(false);
      setSelectedText('');
      setShowCustomInput(false);
      setCustomEnhancement('');
    } catch (err) {
      console.error('Enhancement error:', err);
      alert('Failed to enhance text. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  };

  // Handle text selection
  const handleTextSelection = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const selected = target.value.substring(start, end);
    
    if (selected.length > 0) {
      setSelectedText(selected);
      setSelectionStart(start);
      setSelectionEnd(end);
      setCurrentTextarea(target);
      setShowEnhanceMenu(true);
    } else {
      setShowEnhanceMenu(false);
    }
  };

  // Update character field
  const updateCharacter = (index: number, field: keyof Character, value: any) => {
    const updated = { ...editedBible };
    (updated.characters[index] as any)[field] = value;
    setEditedBible(updated);
    setHasUnsavedChanges(true);
  };

  // Update setting field
  const updateSetting = (index: number, field: keyof Setting, value: any) => {
    const updated = { ...editedBible };
    (updated.settings[index] as any)[field] = value;
    setEditedBible(updated);
    setHasUnsavedChanges(true);
  };

  // Update top-level field
  const updateField = (field: keyof StoryBible, value: any) => {
    setEditedBible({ ...editedBible, [field]: value });
    setHasUnsavedChanges(true);
  };

  // Handle save
  const handleSave = () => {
    if (hasUnsavedChanges) {
      saveMutation.mutate(editedBible);
    }
  };

  // Handle close with unsaved changes warning
  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Close anyway?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: 'characters', label: 'Characters', count: editedBible.characters.length },
    { id: 'settings', label: 'Settings', count: editedBible.settings.length },
    { id: 'themes', label: 'Themes & Tone', count: editedBible.themes.length },
    { id: 'plot', label: 'Plot Structure', count: editedBible.subplots.length },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Story Bible
              {hasUnsavedChanges && <span className="text-yellow-400 text-sm">(Unsaved Changes)</span>}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Edit character profiles, settings, and themes • Select text for AI enhancement
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 relative">
          {/* AI Enhancement Menu */}
          {showEnhanceMenu && selectedText && (
            <div className="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-2 z-50" style={{ top: '120px', right: '40px' }}>
              <div className="text-xs text-gray-400 mb-2 px-2">
                ✨ AI Enhance ({selectedText.length} chars)
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => enhanceText('expand')}
                  disabled={isEnhancing}
                  className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded transition-colors text-left"
                >
                  📝 Expand with Detail
                </button>
                <button
                  onClick={() => enhanceText('descriptive')}
                  disabled={isEnhancing}
                  className="px-3 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded transition-colors text-left"
                >
                  🌟 Add Description
                </button>
                <button
                  onClick={() => enhanceText('emotional')}
                  disabled={isEnhancing}
                  className="px-3 py-2 text-sm bg-pink-600 hover:bg-pink-700 disabled:bg-gray-700 text-white rounded transition-colors text-left"
                >
                  💖 More Emotional
                </button>
                <button
                  onClick={() => enhanceText('dramatize')}
                  disabled={isEnhancing}
                  className="px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded transition-colors text-left"
                >
                  🎭 More Dramatic
                </button>
                <button
                  onClick={() => enhanceText('funnier')}
                  disabled={isEnhancing}
                  className="px-3 py-2 text-sm bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 text-white rounded transition-colors text-left"
                >
                  😄 Make Funnier
                </button>
                <button
                  onClick={() => enhanceText('concise')}
                  disabled={isEnhancing}
                  className="px-3 py-2 text-sm bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 text-white rounded transition-colors text-left"
                >
                  ✂️ Make Concise
                </button>
                <button
                  onClick={() => enhanceText('simplify')}
                  disabled={isEnhancing}
                  className="px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 text-white rounded transition-colors text-left"
                >
                  🔄 Simplify
                </button>
                
                {/* Custom Enhancement */}
                <div className="border-t border-gray-600 pt-1 mt-1">
                  {!showCustomInput ? (
                    <button
                      onClick={() => setShowCustomInput(true)}
                      disabled={isEnhancing}
                      className="w-full px-3 py-2 text-sm bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 text-white rounded transition-colors text-left"
                    >
                      ✍️ Custom Enhancement
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={customEnhancement}
                        onChange={(e) => setCustomEnhancement(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && customEnhancement.trim()) {
                            enhanceText('custom', customEnhancement);
                          }
                        }}
                        placeholder="e.g., Add more wit..."
                        className="w-full px-2 py-1 text-sm bg-gray-900 border border-gray-600 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        autoFocus
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            if (customEnhancement.trim()) {
                              enhanceText('custom', customEnhancement);
                            }
                          }}
                          disabled={isEnhancing || !customEnhancement.trim()}
                          className="flex-1 px-2 py-1 text-xs bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 text-white rounded transition-colors"
                        >
                          Apply
                        </button>
                        <button
                          onClick={() => {
                            setShowCustomInput(false);
                            setCustomEnhancement('');
                          }}
                          className="flex-1 px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => {
                    setShowEnhanceMenu(false);
                    setShowCustomInput(false);
                    setCustomEnhancement('');
                  }}
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

          {/* Characters Tab */}
          {activeTab === 'characters' && (
            <div className="space-y-4">
              {editedBible.characters.map((character, index) => (
                <div
                  key={index}
                  className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedCharacter(expandedCharacter === index ? null : index)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                        {character.name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <div className="text-white font-semibold">{character.name}</div>
                        {character.role && <div className="text-xs text-purple-400">{character.role}</div>}
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedCharacter === index ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {expandedCharacter === index && (
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-700">
                      <div>
                        <label className="text-xs text-purple-400 font-semibold">Physical Description</label>
                        <textarea
                          value={character.physical_description || ''}
                          onChange={(e) => updateCharacter(index, 'physical_description', e.target.value)}
                          onSelect={handleTextSelection}
                          className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs text-purple-400 font-semibold">Personality</label>
                        <textarea
                          value={character.personality || ''}
                          onChange={(e) => updateCharacter(index, 'personality', e.target.value)}
                          onSelect={handleTextSelection}
                          className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs text-purple-400 font-semibold">Backstory</label>
                        <textarea
                          value={character.backstory || ''}
                          onChange={(e) => updateCharacter(index, 'backstory', e.target.value)}
                          onSelect={handleTextSelection}
                          className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs text-purple-400 font-semibold">Goals & Motivations</label>
                        <textarea
                          value={character.goals || ''}
                          onChange={(e) => updateCharacter(index, 'goals', e.target.value)}
                          onSelect={handleTextSelection}
                          className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs text-purple-400 font-semibold">Character Arc</label>
                        <textarea
                          value={character.character_arc || ''}
                          onChange={(e) => updateCharacter(index, 'character_arc', e.target.value)}
                          onSelect={handleTextSelection}
                          className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs text-purple-400 font-semibold">Quirks & Mannerisms</label>
                        <textarea
                          value={character.quirks || ''}
                          onChange={(e) => updateCharacter(index, 'quirks', e.target.value)}
                          onSelect={handleTextSelection}
                          className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm min-h-[60px] focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              {editedBible.settings.map((setting, index) => (
                <div
                  key={index}
                  className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedSetting(expandedSetting === index ? null : index)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="text-white font-semibold">{setting.name}</div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedSetting === index ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {expandedSetting === index && (
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-700">
                      <div>
                        <label className="text-xs text-blue-400 font-semibold">Description</label>
                        <textarea
                          value={setting.description || ''}
                          onChange={(e) => updateSetting(index, 'description', e.target.value)}
                          onSelect={handleTextSelection}
                          className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs text-blue-400 font-semibold">Atmosphere & Mood</label>
                        <textarea
                          value={setting.atmosphere || ''}
                          onChange={(e) => updateSetting(index, 'atmosphere', e.target.value)}
                          onSelect={handleTextSelection}
                          className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm min-h-[60px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs text-blue-400 font-semibold">Story Significance</label>
                        <textarea
                          value={setting.significance || ''}
                          onChange={(e) => updateSetting(index, 'significance', e.target.value)}
                          onSelect={handleTextSelection}
                          className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm min-h-[60px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs text-blue-400 font-semibold">Special Features</label>
                        <textarea
                          value={setting.special_features || ''}
                          onChange={(e) => updateSetting(index, 'special_features', e.target.value)}
                          onSelect={handleTextSelection}
                          className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm min-h-[60px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Themes & Tone Tab */}
          {activeTab === 'themes' && (
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
                <label className="text-sm text-green-400 font-semibold mb-2 block">Humor Style</label>
                <textarea
                  value={editedBible.humor_style || ''}
                  onChange={(e) => updateField('humor_style', e.target.value)}
                  onSelect={handleTextSelection}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
                <label className="text-sm text-green-400 font-semibold mb-2 block">Tone Notes</label>
                <textarea
                  value={editedBible.tone_notes || ''}
                  onChange={(e) => updateField('tone_notes', e.target.value)}
                  onSelect={handleTextSelection}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
                <label className="text-sm text-green-400 font-semibold mb-2 block">Genre Guidelines</label>
                <textarea
                  value={editedBible.genre_guidelines || ''}
                  onChange={(e) => updateField('genre_guidelines', e.target.value)}
                  onSelect={handleTextSelection}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          )}

          {/* Plot Structure Tab */}
          {activeTab === 'plot' && (
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
                <label className="text-sm text-yellow-400 font-semibold mb-2 block">Main Plot Arc</label>
                <textarea
                  value={editedBible.main_plot_arc || ''}
                  onChange={(e) => updateField('main_plot_arc', e.target.value)}
                  onSelect={handleTextSelection}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm min-h-[200px] focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              
              <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
                <label className="text-sm text-yellow-400 font-semibold mb-3 block">Subplots</label>
                <div className="space-y-3">
                  {editedBible.subplots.map((subplot, index) => (
                    <div key={index}>
                      <label className="text-xs text-gray-400 mb-1 block">Subplot {index + 1}</label>
                      <textarea
                        value={subplot || ''}
                        onChange={(e) => {
                          const updated = [...editedBible.subplots];
                          updated[index] = e.target.value;
                          updateField('subplots', updated);
                        }}
                        onSelect={handleTextSelection}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <div className="text-xs text-gray-500">
            💡 Tip: Select any text in a field to see AI enhancement options
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || saveMutation.isPending}
              className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {saveMutation.isPending ? (
                <>⏳ Saving...</>
              ) : (
                <>💾 Save Changes</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
