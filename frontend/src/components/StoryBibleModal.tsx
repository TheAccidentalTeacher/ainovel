import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import type { StoryBible, Character, Setting } from '../types';

interface StoryBibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyBible: StoryBible;
  projectId: string;
  onSave?: (updatedStoryBible: StoryBible) => Promise<void>;
}

type TabType = 'characters' | 'settings' | 'themes' | 'plot';

export default function StoryBibleModal({ isOpen, onClose, storyBible, projectId, onSave }: StoryBibleModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('characters');
  const [expandedCharacter, setExpandedCharacter] = useState<number | null>(null);
  const [expandedSetting, setExpandedSetting] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBible, setEditedBible] = useState<StoryBible>(storyBible);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // AI Enhancement state
  const [selectedText, setSelectedText] = useState('');
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [showEnhanceMenu, setShowEnhanceMenu] = useState(false);
  const [enhanceMenuPosition, setEnhanceMenuPosition] = useState({ top: 0, left: 0 });
  const [currentField, setCurrentField] = useState<{ type: string; index: number; field: string } | null>(null);
  const [customEnhancement, setCustomEnhancement] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // AI Enhancement mutation
  const enhanceMutation = useMutation({
    mutationFn: async ({ text, instruction }: { text: string; instruction: string }) => {
      return apiClient.enhanceText(text, instruction);
    },
    onSuccess: (data) => {
      const enhanced = data.enhanced_text || selectedText;
      if (currentField) {
        applyEnhancement(enhanced);
      }
      setShowEnhanceMenu(false);
      setSelectedText('');
      setShowCustomInput(false);
      setCustomEnhancement('');
    }
  });

  if (!isOpen) return null;

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: 'characters', label: 'Characters', count: storyBible.characters.length },
    { id: 'settings', label: 'Settings', count: storyBible.settings.length },
    { id: 'themes', label: 'Themes & Tone', count: storyBible.themes.length },
    { id: 'plot', label: 'Plot Structure', count: storyBible.subplots.length },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Story Bible</h2>
            <p className="text-sm text-gray-400 mt-1">
              Character profiles, settings, and themes for consistency
            </p>
          </div>
          <button
            onClick={onClose}
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
        <div className="flex-1 overflow-y-auto p-6">
          {/* Characters Tab */}
          {activeTab === 'characters' && (
            <div className="space-y-4">
              {storyBible.characters.map((character, index) => (
                <div
                  key={index}
                  style={{ backgroundColor: '#1f2937', borderColor: '#4b5563' }}
                  className="rounded-lg border overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedCharacter(expandedCharacter === index ? null : index)}
                    style={{ backgroundColor: expandedCharacter === index ? '#374151' : '#1f2937' }}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                        {character.name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <div style={{ color: '#ffffff' }} className="font-semibold">{character.name}</div>
                        {character.aliases && character.aliases.length > 0 && (
                          <div style={{ color: '#d1d5db' }} className="text-xs">
                            aka {character.aliases.join(', ')}
                          </div>
                        )}
                        {character.age && (
                          <div style={{ color: '#d1d5db' }} className="text-xs">Age: {character.age}</div>
                        )}
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
                    <div className="px-4 pb-4 space-y-3 text-sm bg-gray-750">
                      {character.role && (
                        <div>
                          <div className="text-purple-400 font-semibold mb-1">Role</div>
                          <div className="text-gray-200">{character.role}</div>
                        </div>
                      )}
                      {character.physical_description && (
                        <div>
                          <div className="text-purple-400 font-semibold mb-1">Physical Description</div>
                          <div className="text-gray-200">{character.physical_description}</div>
                        </div>
                      )}
                      {character.personality && (
                        <div>
                          <div className="text-purple-400 font-semibold mb-1">Personality</div>
                          <div className="text-gray-200">{character.personality}</div>
                        </div>
                      )}
                      {character.backstory && (
                        <div>
                          <div className="text-purple-400 font-semibold mb-1">Backstory</div>
                          <div className="text-gray-200">{character.backstory}</div>
                        </div>
                      )}
                      {character.goals && (
                        <div>
                          <div className="text-purple-400 font-semibold mb-1">Goals & Motivations</div>
                          <div className="text-gray-200">{character.goals}</div>
                        </div>
                      )}
                      {character.character_arc && (
                        <div>
                          <div className="text-purple-400 font-semibold mb-1">Character Arc</div>
                          <div className="text-gray-200">{character.character_arc}</div>
                        </div>
                      )}
                      {character.quirks && (
                        <div>
                          <div className="text-purple-400 font-semibold mb-1">Quirks & Mannerisms</div>
                          <div className="text-gray-200">{character.quirks}</div>
                        </div>
                      )}
                      {character.relationships && Object.keys(character.relationships).length > 0 && (
                        <div>
                          <div className="text-purple-400 font-semibold mb-1">Relationships</div>
                          <div className="space-y-1">
                            {Object.entries(character.relationships).map(([name, relationship]) => (
                              <div key={name} className="text-gray-200">
                                <span className="text-purple-300">{name}:</span> {relationship}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              {storyBible.settings.map((setting, index) => (
                <div
                  key={index}
                  style={{ backgroundColor: '#1f2937', borderColor: '#4b5563' }}
                  className="rounded-lg border overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedSetting(expandedSetting === index ? null : index)}
                    style={{ backgroundColor: expandedSetting === index ? '#374151' : '#1f2937' }}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <div style={{ color: '#ffffff' }} className="font-semibold">{setting.name}</div>
                      </div>
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
                    <div className="px-4 pb-4 space-y-3 text-sm bg-gray-750">
                      {setting.description && (
                        <div>
                          <div className="text-blue-400 font-semibold mb-1">Description</div>
                          <div className="text-gray-200">{setting.description}</div>
                        </div>
                      )}
                      {setting.atmosphere && (
                        <div>
                          <div className="text-blue-400 font-semibold mb-1">Atmosphere & Mood</div>
                          <div className="text-gray-200">{setting.atmosphere}</div>
                        </div>
                      )}
                      {setting.significance && (
                        <div>
                          <div className="text-blue-400 font-semibold mb-1">Story Significance</div>
                          <div className="text-gray-200">{setting.significance}</div>
                        </div>
                      )}
                      {setting.special_features && (
                        <div>
                          <div className="text-blue-400 font-semibold mb-1">Special Features</div>
                          <div className="text-gray-200">{setting.special_features}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Themes & Tone Tab */}
          {activeTab === 'themes' && (
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Major Themes</h3>
                <div className="flex flex-wrap gap-2">
                  {storyBible.themes.map((theme, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-600 bg-opacity-20 text-green-400 rounded-full text-sm border border-green-600"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>

              {storyBible.humor_style && (
                <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Humor Style</h3>
                  <p className="text-gray-200 text-sm">{storyBible.humor_style}</p>
                </div>
              )}

              {storyBible.tone_notes && (
                <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Tone Notes</h3>
                  <p className="text-gray-200 text-sm whitespace-pre-line">{storyBible.tone_notes}</p>
                </div>
              )}

              {storyBible.genre_guidelines && (
                <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Genre Guidelines</h3>
                  <p className="text-gray-200 text-sm whitespace-pre-line">{storyBible.genre_guidelines}</p>
                </div>
              )}
            </div>
          )}

          {/* Plot Structure Tab */}
          {activeTab === 'plot' && (
            <div className="space-y-6">
              {storyBible.main_plot_arc && (
                <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Main Plot Arc</h3>
                  <p className="text-gray-200 text-sm whitespace-pre-line">{storyBible.main_plot_arc}</p>
                </div>
              )}

              {storyBible.subplots && storyBible.subplots.length > 0 && (
                <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Subplots</h3>
                  <div className="space-y-3">
                    {storyBible.subplots.map((subplot, index) => (
                      <div key={index} className="border-l-4 border-yellow-600 pl-3">
                        <div className="text-yellow-400 font-medium text-sm">Subplot {index + 1}</div>
                        <p className="text-gray-200 text-sm mt-1">{subplot}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {storyBible.key_milestones && storyBible.key_milestones.length > 0 && (
                <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Key Milestones</h3>
                  <div className="space-y-2">
                    {storyBible.key_milestones.map((milestone, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <p className="text-gray-200 text-sm">{milestone}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <div className="text-xs text-gray-500">
            Story Bible v{storyBible.version || 1}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Close
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              title="Story Bible is currently view-only. Editing coming soon!"
            >
              Close
            </button>
          </div>
          <div className="text-xs text-amber-400 mt-2">
            📝 Note: Story Bible editing is in development. If you need changes, regenerate or contact support.
          </div>
        </div>
      </div>
    </div>
  );
}
