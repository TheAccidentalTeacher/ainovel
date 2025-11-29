import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import StoryBibleModal from '../components/StoryBibleModal';
import { useChapterStream } from '../hooks/useChapterStream';
import { useBulkGeneration } from '../hooks/useBulkGeneration';
import type { ChapterOutline, Chapter } from '../types';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isStoryBibleModalOpen, setIsStoryBibleModalOpen] = useState(false);
  const [streamingChapterIndex, setStreamingChapterIndex] = useState<number | null>(null);
  const [viewingChapter, setViewingChapter] = useState<Chapter | null>(null);
  const [showBulkProgress, setShowBulkProgress] = useState(false);
  const { content: streamContent, isStreaming, error: streamError, wordCount: streamWordCount, chapterId, startStream, stopStream } = useChapterStream();
  const bulkGeneration = useBulkGeneration();
  const lastCompletedChapters = useRef(0);

  // Fetch project data
  const { data, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: () => apiClient.getProject(id!),
    enabled: !!id,
  });

  // Generate Story Bible mutation
  const generateStoryBibleMutation = useMutation({
    mutationFn: () => {
      console.log('[ProjectDetail] 📖 Generating Story Bible for project:', id);
      return apiClient.generateStoryBible(id!);
    },
    onSuccess: (data) => {
      console.log('[ProjectDetail] ✅ Story Bible generated:', data);
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
    onError: (error) => {
      console.error('[ProjectDetail] ❌ Story Bible generation failed:', error);
    },
  });

  // Generate outline mutation
  const generateOutlineMutation = useMutation({
    mutationFn: () => {
      console.log('[ProjectDetail] 📝 Generating outline for project:', id);
      return apiClient.generateOutline(id!);
    },
    onSuccess: (data) => {
      console.log('[ProjectDetail] ✅ Outline generated:', data);
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
    onError: (error) => {
      console.error('[ProjectDetail] ❌ Outline generation failed:', error);
    },
  });

  // Delete outline mutation
  const deleteOutlineMutation = useMutation({
    mutationFn: (outlineId: string) => apiClient.deleteOutline(id!, outlineId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['project', id] });
      await queryClient.refetchQueries({ queryKey: ['project', id] });
    },
    onError: (error) => {
      console.error('Failed to delete outline:', error);
      alert('Failed to delete outline. Please try again.');
    },
  });

  // Fetch chapters
  const { data: chapters } = useQuery({
    queryKey: ['chapters', id],
    queryFn: () => apiClient.getChapters(id!),
    enabled: !!id && !!data?.outline,
  });

  // When streaming completes (chapterId populated), refresh chapters
  useEffect(() => {
    if (chapterId && !isStreaming && streamingChapterIndex !== null) {
      console.log('[ProjectDetail] Stream complete, refreshing chapters');
      queryClient.invalidateQueries({ queryKey: ['chapters', id] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      // Close modal after a brief delay
      setTimeout(() => {
        setStreamingChapterIndex(null);
      }, 2000);
    }
  }, [chapterId, isStreaming, streamingChapterIndex, queryClient, id]);

  // Refresh chapters when bulk generation progresses
  useEffect(() => {
    if (bulkGeneration.completedChapters > lastCompletedChapters.current) {
      console.log('[ProjectDetail] Bulk generation progress, refreshing chapters');
      queryClient.invalidateQueries({ queryKey: ['chapters', id] });
      lastCompletedChapters.current = bulkGeneration.completedChapters;
    }
  }, [bulkGeneration.completedChapters, queryClient, id]);

  // Generate chapter mutation
  const generateChapterMutation = useMutation({
    mutationFn: (chapterIndex: number) => {
      console.log('[ProjectDetail] 📄 Generating chapter:', chapterIndex, 'for project:', id);
      return apiClient.generateChapter(id!, chapterIndex);
    },
    onSuccess: (data, chapterIndex) => {
      console.log('[ProjectDetail] ✅ Chapter', chapterIndex, 'generated:', data);
      queryClient.invalidateQueries({ queryKey: ['chapters', id] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
    onError: (error, chapterIndex) => {
      console.error('[ProjectDetail] ❌ Chapter', chapterIndex, 'generation failed:', error);
    },
  });

  // Regenerate all chapters mutation
  const regenerateAllChaptersMutation = useMutation({
    mutationFn: async () => {
      console.log('[ProjectDetail] 🗑️ Deleting all chapters for project:', id);
      const result = await apiClient.deleteAllChapters(id!);
      console.log('[ProjectDetail] ✅ All chapters deleted:', result);
      return result;
    },
    onSuccess: () => {
      console.log('[ProjectDetail] 🎬 Starting bulk generation after deletion...');
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['chapters', id] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      // Start bulk generation
      console.log('[ProjectDetail] 📊 Setting showBulkProgress to true');
      setShowBulkProgress(true);
      console.log('[ProjectDetail] 🚀 Calling bulkGeneration.startBulkGeneration...');
      bulkGeneration.startBulkGeneration(id!);
    },
    onError: (error) => {
      console.error('[ProjectDetail] ❌ Regenerate all chapters failed:', error);
    },
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-white">Loading project...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="text-red-400">Error loading project</div>
        <button
          onClick={() => navigate('/projects')}
          className="mt-4 text-blue-400 hover:text-blue-300"
        >
          ← Back to Projects
        </button>
      </div>
    );
  }

  const { project, premise, story_bible, outline } = data;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/projects')}
          className="text-blue-400 hover:text-blue-300 mb-4 flex items-center"
        >
          ← Back to Projects
        </button>
        <h1 className="text-3xl font-bold text-white mb-2">{project.title}</h1>
        <div className="flex gap-4 text-sm text-gray-400">
          <span>{project.genre} • {project.subgenre}</span>
          <span>•</span>
          <span>{project.total_chapters} chapters planned</span>
          <span>•</span>
          <span className="capitalize">{project.status.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Premise Section */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Premise</h2>
        {premise ? (
          <div className="prose prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-gray-300 font-sans text-sm leading-relaxed">
              {premise.content}
            </pre>
            <div className="mt-4 text-sm text-gray-400">
              {premise.word_count} words
            </div>
          </div>
        ) : (
          <p className="text-gray-400">No premise available</p>
        )}
      </div>

      {/* Story Bible Section */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Story Bible</h2>
          {!story_bible && (
            <button
              onClick={() => generateStoryBibleMutation.mutate()}
              disabled={generateStoryBibleMutation.isPending}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generateStoryBibleMutation.isPending ? 'Generating...' : 'Generate Story Bible'}
            </button>
          )}
        </div>

        {generateStoryBibleMutation.isPending && (
          <div className="text-center py-8">
            <div className="text-purple-400 mb-2">Extracting characters, settings, and themes from premise...</div>
            <div className="text-gray-400 text-sm">This may take 30-60 seconds</div>
          </div>
        )}

        {generateStoryBibleMutation.isError && (
          <div className="text-red-400 p-4 bg-red-900/20 rounded">
            Error generating Story Bible: {(generateStoryBibleMutation.error as Error).message}
          </div>
        )}

        {story_bible ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-700/50 rounded p-3">
                <div className="text-gray-400 mb-1">Characters</div>
                <div className="text-white font-semibold">{story_bible.characters.length}</div>
              </div>
              <div className="bg-gray-700/50 rounded p-3">
                <div className="text-gray-400 mb-1">Settings</div>
                <div className="text-white font-semibold">{story_bible.settings.length}</div>
              </div>
              <div className="bg-gray-700/50 rounded p-3">
                <div className="text-gray-400 mb-1">Themes</div>
                <div className="text-white font-semibold">{story_bible.themes.length}</div>
              </div>
              <div className="bg-gray-700/50 rounded p-3">
                <div className="text-gray-400 mb-1">Subplots</div>
                <div className="text-white font-semibold">{story_bible.subplots.length}</div>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              Story Bible v{story_bible.version || 1} created to maintain consistency across your novel
            </div>

            <div className="mt-6 flex justify-end">
              <button
                className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                onClick={() => setIsStoryBibleModalOpen(true)}
              >
                View/Edit Story Bible →
              </button>
            </div>
          </div>
        ) : !generateStoryBibleMutation.isPending && (
          <p className="text-gray-400 text-center py-8">
            No Story Bible yet. Generate one to extract characters, settings, and themes from your premise.
            <br />
            <span className="text-sm">This helps maintain consistency when generating your outline and chapters.</span>
          </p>
        )}
      </div>

      {/* Outline Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Outline</h2>
          {!outline && (
            <button
              onClick={() => generateOutlineMutation.mutate()}
              disabled={generateOutlineMutation.isPending || !story_bible}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!story_bible ? 'Generate Story Bible first' : ''}
            >
              {generateOutlineMutation.isPending ? 'Generating...' : 'Generate Outline'}
            </button>
          )}
        </div>

        {generateOutlineMutation.isPending && (
          <div className="text-center py-8">
            <div className="text-blue-400 mb-2">Generating outline with Claude Sonnet...</div>
            <div className="text-gray-400 text-sm">This may take 30-60 seconds</div>
          </div>
        )}

        {generateOutlineMutation.isError && (
          <div className="text-red-400 p-4 bg-red-900/20 rounded">
            Error generating outline: {(generateOutlineMutation.error as Error).message}
          </div>
        )}

        {outline ? (
          <div className="space-y-4">
            {outline.chapters.map((chapter: ChapterOutline) => (
              <div key={chapter.chapter_index} className="border border-gray-700 rounded p-4 space-y-3">
                <h3 className="text-white font-semibold text-lg">
                  Chapter {chapter.chapter_index}: {chapter.title}
                </h3>
                
                {/* Opening Scene */}
                {chapter.opening_scene && (
                  <div>
                    <h4 className="text-blue-400 text-sm font-semibold mb-1">Opening Scene</h4>
                    <p className="text-gray-300 text-sm">{chapter.opening_scene}</p>
                  </div>
                )}
                
                {/* Characters & Locations */}
                <div className="flex gap-6 text-xs">
                  {chapter.characters_present && chapter.characters_present.length > 0 && (
                    <div>
                      <span className="text-purple-400 font-semibold">Characters:</span>{' '}
                      <span className="text-gray-300">{chapter.characters_present.join(', ')}</span>
                    </div>
                  )}
                  {chapter.locations && chapter.locations.length > 0 && (
                    <div>
                      <span className="text-green-400 font-semibold">Locations:</span>{' '}
                      <span className="text-gray-300">{chapter.locations.join(', ')}</span>
                    </div>
                  )}
                </div>
                
                {/* Plot Events */}
                {chapter.plot_events && chapter.plot_events.length > 0 && (
                  <div>
                    <h4 className="text-yellow-400 text-sm font-semibold mb-1">Key Events</h4>
                    <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                      {chapter.plot_events.map((event, idx) => (
                        <li key={idx}>{event}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Character Development */}
                {chapter.character_development && (
                  <div>
                    <h4 className="text-pink-400 text-sm font-semibold mb-1">Character Development</h4>
                    <p className="text-gray-300 text-sm">{chapter.character_development}</p>
                  </div>
                )}
                
                {/* Subplots */}
                {chapter.subplots_advanced && (
                  <div>
                    <h4 className="text-cyan-400 text-sm font-semibold mb-1">Subplots Advanced</h4>
                    <p className="text-gray-300 text-sm">{chapter.subplots_advanced}</p>
                  </div>
                )}
                
                {/* Closing Scene */}
                {chapter.closing_scene && (
                  <div>
                    <h4 className="text-orange-400 text-sm font-semibold mb-1">Closing Scene</h4>
                    <p className="text-gray-300 text-sm">{chapter.closing_scene}</p>
                  </div>
                )}
                
                {/* Tone Notes */}
                {chapter.tone_notes && chapter.tone_notes.length > 0 && (
                  <div>
                    <span className="text-indigo-400 font-semibold text-xs">Tone:</span>{' '}
                    <span className="text-gray-400 text-xs">{chapter.tone_notes.join(', ')}</span>
                  </div>
                )}
                
                {/* Summary Prose */}
                {chapter.summary_prose && (
                  <div className="pt-2 border-t border-gray-700">
                    <h4 className="text-gray-400 text-sm font-semibold mb-1">Narrative Summary</h4>
                    <p className="text-gray-300 text-sm">{chapter.summary_prose}</p>
                  </div>
                )}
                
                <div className="text-gray-500 text-xs pt-2 border-t border-gray-800">
                  Target: {chapter.target_word_count} words
                </div>
              </div>
            ))}
            <div className="mt-6 flex justify-between items-center">
              <button
                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this outline? This cannot be undone.')) {
                    deleteOutlineMutation.mutate(outline.id);
                  }
                }}
                disabled={deleteOutlineMutation.isPending}
              >
                {deleteOutlineMutation.isPending ? 'Deleting...' : 'Delete Outline'}
              </button>
              <button
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={() => navigate(`/projects/${id}/outline`)}
              >
                Edit Outline →
              </button>
            </div>
          </div>
        ) : !generateOutlineMutation.isPending && (
          <p className="text-gray-400 text-center py-8">
            {!story_bible ? (
              <>
                Generate a Story Bible first to ensure consistent characters, settings, and themes.
                <br />
                <span className="text-sm">Then you'll be able to create your outline.</span>
              </>
            ) : (
              'No outline generated yet. Click "Generate Outline" to create a chapter-by-chapter plan.'
            )}
          </p>
        )}
      </div>

      {/* Chapters Section */}
      {outline && (
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Generated Chapters</h2>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400">
                {chapters?.length || 0} of {outline.chapters.length} chapters generated
              </div>
              {chapters && chapters.length > 0 && (
                <>
                  <button
                    onClick={() => {
                      const url = `/api/projects/export/${id}/manuscript.docx`;
                      window.open(url, '_blank');
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
                  >
                    Download DOCX
                  </button>
                  <button
                    onClick={() => {
                      const url = `/api/projects/export/${id}/manuscript.md`;
                      window.open(url, '_blank');
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
                  >
                    Download MD
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/projects/export/${id}/manuscript-text`);
                        if (!response.ok) throw new Error('Failed to fetch manuscript');
                        const data = await response.json();
                        navigate('/cover-designer', { 
                          state: { 
                            manuscriptText: data.text,
                            projectTitle: data.title,
                            projectId: data.project_id
                          } 
                        });
                      } catch (err) {
                        console.error('Error loading manuscript:', err);
                        alert('Failed to load manuscript for cover designer');
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
                  >
                    Generate Book Cover
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(
                        `⚠️ WARNING: This will permanently delete all ${chapters.length} generated chapters and regenerate them from scratch.\n\nThis cannot be undone. Are you sure you want to continue?`
                      )) {
                        regenerateAllChaptersMutation.mutate();
                      }
                    }}
                    disabled={regenerateAllChaptersMutation.isPending || bulkGeneration.isGenerating || isStreaming}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    Regenerate All Chapters
                  </button>
                </>
              )}
              {(chapters?.length || 0) < outline.chapters.length && (
                <button
                  onClick={() => {
                    setShowBulkProgress(true);
                    bulkGeneration.startBulkGeneration(id!);
                  }}
                  disabled={bulkGeneration.isGenerating || isStreaming}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  Generate All Chapters
                </button>
              )}
            </div>
          </div>

          {generateChapterMutation.isPending && (
            <div className="bg-blue-900/20 p-4 rounded mb-4">
              <div className="text-blue-400 mb-2">Generating chapter with Claude Sonnet...</div>
              <div className="text-gray-400 text-sm">This may take 60-120 seconds for long chapters</div>
            </div>
          )}

          {generateChapterMutation.isError && (
            <div className="text-red-400 p-4 bg-red-900/20 rounded mb-4">
              Error generating chapter: {(generateChapterMutation.error as Error).message}
            </div>
          )}

          <div className="space-y-3">
            {outline.chapters.map((chapter: ChapterOutline) => {
              const generatedChapter = chapters?.find((ch: Chapter) => ch.chapter_index === chapter.chapter_index);
              const isThisChapterStreaming = streamingChapterIndex === chapter.chapter_index && isStreaming;
              
              return (
                <div 
                  key={chapter.chapter_index} 
                  className="flex items-center justify-between bg-gray-900 rounded p-4"
                >
                  <div className="flex-1">
                    <div className="text-white font-medium">
                      Chapter {chapter.chapter_index}: {chapter.title}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {generatedChapter ? (
                        <span className="text-green-400">
                          ✓ Generated ({generatedChapter.word_count} words)
                        </span>
                      ) : isThisChapterStreaming ? (
                        <span className="text-yellow-400 animate-pulse">
                          Generating... {streamWordCount} words
                        </span>
                      ) : (
                        <span>Target: {chapter.target_word_count} words</span>
                      )}
                    </div>
                  </div>
                  {!generatedChapter && !isThisChapterStreaming && (
                    <button
                      onClick={() => {
                        setStreamingChapterIndex(chapter.chapter_index);
                        startStream(id!, chapter.chapter_index);
                      }}
                      disabled={isStreaming}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Generate (Live)
                    </button>
                  )}
                  {isThisChapterStreaming && (
                    <button
                      onClick={() => {
                        stopStream();
                        setStreamingChapterIndex(null);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Stop
                    </button>
                  )}
                  {generatedChapter && (
                    <button
                      onClick={() => setViewingChapter(generatedChapter)}
                      className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                    >
                      View
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Streaming Modal */}
      {isStreaming && streamingChapterIndex !== null && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Chapter {streamingChapterIndex}: {outline.chapters[streamingChapterIndex].title}
                </h2>
                <div className="text-sm text-gray-400 mt-1">
                  {streamWordCount} words generated • Target: {outline.chapters[streamingChapterIndex].target_word_count} words
                </div>
              </div>
              <button
                onClick={() => {
                  if (window.confirm('Stop generation? (Progress will be lost)')) {
                    stopStream();
                    setStreamingChapterIndex(null);
                  }
                }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {/* Streaming Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {streamError ? (
                <div className="text-red-400 bg-red-900/20 p-4 rounded">
                  Error: {streamError}
                </div>
              ) : (
                <div className="prose prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-gray-200 leading-relaxed">
                    {streamContent}
                    <span className="inline-block w-2 h-5 bg-blue-400 animate-pulse ml-1"></span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-700 flex justify-between items-center">
              <div className="text-sm text-gray-400">
                <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></span>
                Streaming live from Claude Sonnet 4.5
              </div>
              <button
                onClick={() => {
                  if (window.confirm('Stop generation?')) {
                    stopStream();
                    setStreamingChapterIndex(null);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Stop Generation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Story Bible Modal */}
      {story_bible && (
        <StoryBibleModal
          isOpen={isStoryBibleModalOpen}
          onClose={() => setIsStoryBibleModalOpen(false)}
          storyBible={story_bible}
        />
      )}

      {/* Chapter Viewer Modal */}
      {viewingChapter && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Chapter {viewingChapter.chapter_index}: {viewingChapter.title}
                </h2>
                <div className="text-sm text-gray-400 mt-1">
                  {viewingChapter.word_count} words
                </div>
              </div>
              <button
                onClick={() => setViewingChapter(null)}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-invert max-w-none">
                <div className="text-gray-200 whitespace-pre-wrap leading-relaxed text-base">
                  {viewingChapter.content}
                </div>
              </div>
            </div>
            <div className="border-t border-gray-700 p-4 flex justify-between items-center">
              <div className="text-sm text-gray-400">
                Generated: {new Date(viewingChapter.created_at).toLocaleString()}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(viewingChapter.content);
                  alert('Chapter copied to clipboard!');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Generation Progress Modal */}
      {showBulkProgress && bulkGeneration.isGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-2xl w-full flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-white">Generating All Chapters</h2>
                <div className="text-sm text-gray-400 mt-1">
                  {bulkGeneration.completedChapters} of {bulkGeneration.totalChapters || outline?.chapters.length || 0} completed
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Overall Progress</span>
                  <span className="text-white font-semibold">
                    {Math.round((bulkGeneration.completedChapters / (bulkGeneration.totalChapters || outline?.chapters.length || 1)) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-purple-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(bulkGeneration.completedChapters / (bulkGeneration.totalChapters || outline?.chapters.length || 1)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Current Chapter */}
              {bulkGeneration.currentChapter !== null && (
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                  <div className="text-purple-400 font-semibold mb-1">
                    Currently Generating
                  </div>
                  <div className="text-white text-lg">
                    Chapter {bulkGeneration.currentChapter}: {bulkGeneration.currentTitle}
                  </div>
                  <div className="text-sm text-gray-400 mt-2 flex items-center">
                    <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></span>
                    Streaming from Claude Sonnet 4.5...
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-gray-400 text-xs mb-1">Completed</div>
                  <div className="text-white text-xl font-bold">{bulkGeneration.completedChapters}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-gray-400 text-xs mb-1">Total Words</div>
                  <div className="text-white text-xl font-bold">{bulkGeneration.totalWords.toLocaleString()}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-gray-400 text-xs mb-1">Skipped</div>
                  <div className="text-white text-xl font-bold">{bulkGeneration.skippedChapters.length}</div>
                </div>
              </div>

              {/* Errors */}
              {bulkGeneration.errors.length > 0 && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <div className="text-red-400 font-semibold mb-2">Errors</div>
                  <div className="space-y-1">
                    {bulkGeneration.errors.map((error, idx) => (
                      <div key={idx} className="text-sm text-gray-300">
                        Chapter {error.chapter}: {error.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-700 p-4 flex justify-end">
              <button
                onClick={() => {
                  if (window.confirm('Stop bulk generation? Already generated chapters will be saved.')) {
                    bulkGeneration.stopBulkGeneration();
                    setShowBulkProgress(false);
                  }
                }}
                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Stop Generation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Generation Complete */}
      {showBulkProgress && !bulkGeneration.isGenerating && bulkGeneration.completedChapters > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg max-w-xl w-full p-6">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-white mb-2">Generation Complete!</h2>
              <p className="text-gray-400 mb-6">
                Successfully generated {bulkGeneration.completedChapters} chapters
                {bulkGeneration.skippedChapters.length > 0 && ` (${bulkGeneration.skippedChapters.length} skipped)`}
              </p>
              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <div className="text-3xl font-bold text-purple-400 mb-1">
                  {bulkGeneration.totalWords.toLocaleString()}
                </div>
                <div className="text-gray-400 text-sm">Total Words Generated</div>
              </div>
              {bulkGeneration.errors.length > 0 && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6 text-left">
                  <div className="text-red-400 font-semibold mb-2">Errors Encountered</div>
                  <div className="space-y-1">
                    {bulkGeneration.errors.map((error, idx) => (
                      <div key={idx} className="text-sm text-gray-300">
                        Chapter {error.chapter}: {error.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={() => setShowBulkProgress(false)}
                className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
