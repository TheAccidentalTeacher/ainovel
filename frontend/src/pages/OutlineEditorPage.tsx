import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import { useState, useEffect } from 'react';
import type { ChapterOutline } from '../types';

export default function OutlineEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [chapters, setChapters] = useState<ChapterOutline[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch project data
  const { data, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => apiClient.getProject(id!),
    enabled: !!id,
  });

  // Set chapters when data loads
  useEffect(() => {
    if (data?.outline?.chapters) {
      setChapters(data.outline.chapters);
    }
  }, [data]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: () => apiClient.updateOutline(id!, data.outline.id, chapters),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      setHasChanges(false);
    },
  });

  const updateChapter = (index: number, field: keyof ChapterOutline, value: string | number | string[]) => {
    setChapters(prev => prev.map((ch, i) => 
      i === index ? { ...ch, [field]: value } : ch
    ));
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-white">Loading outline...</div>
      </div>
    );
  }

  if (!data?.outline) {
    return (
      <div className="p-8">
        <div className="text-red-400">No outline found</div>
        <button
          onClick={() => navigate(`/projects/${id}`)}
          className="mt-4 text-blue-400 hover:text-blue-300"
        >
          ← Back to Project
        </button>
      </div>
    );
  }

  const { project } = data;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`/projects/${id}`)}
          className="text-blue-400 hover:text-blue-300 mb-4 flex items-center"
        >
          ← Back to Project
        </button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Edit Outline</h1>
            <p className="text-gray-400">{project.title}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => saveMutation.mutate()}
              disabled={!hasChanges || saveMutation.isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveMutation.isPending ? 'Saving...' : hasChanges ? 'Save Changes' : 'Saved'}
            </button>
            <button
              onClick={() => navigate(`/projects/${id}`)}
              className="px-6 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Chapter List */}
      <div className="space-y-6">
        {chapters.map((chapter, index) => (
          <div key={chapter.chapter_index} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            {/* Chapter Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="text-blue-400 font-bold text-lg min-w-[80px]">
                Chapter {chapter.chapter_index}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={chapter.title}
                  onChange={(e) => updateChapter(index, 'title', e.target.value)}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none font-semibold"
                  placeholder="Chapter Title"
                />
              </div>
            </div>

            {/* Opening Scene */}
            <div className="mb-4">
              <label className="text-blue-400 text-sm mb-2 block font-semibold">Opening Scene</label>
              <textarea
                value={chapter.opening_scene || ''}
                onChange={(e) => updateChapter(index, 'opening_scene', e.target.value)}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none min-h-[80px]"
                placeholder="Where/when the chapter opens (50-100 words)..."
              />
            </div>

            {/* Characters & Locations */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-purple-400 text-sm mb-2 block font-semibold">Characters Present</label>
                <input
                  type="text"
                  value={(chapter.characters_present || []).join(', ')}
                  onChange={(e) => updateChapter(index, 'characters_present', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="Character names (comma separated)..."
                />
              </div>
              <div>
                <label className="text-green-400 text-sm mb-2 block font-semibold">Locations</label>
                <input
                  type="text"
                  value={(chapter.locations || []).join(', ')}
                  onChange={(e) => updateChapter(index, 'locations', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="Location names (comma separated)..."
                />
              </div>
            </div>

            {/* Plot Events */}
            <div className="mb-4">
              <label className="text-yellow-400 text-sm mb-2 block font-semibold">Plot Events</label>
              <textarea
                value={(chapter.plot_events || []).join('\n')}
                onChange={(e) => updateChapter(index, 'plot_events', e.target.value.split('\n').filter(Boolean))}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none min-h-[100px]"
                placeholder="Key events (one per line)..."
              />
            </div>

            {/* Character Development */}
            <div className="mb-4">
              <label className="text-pink-400 text-sm mb-2 block font-semibold">Character Development</label>
              <textarea
                value={chapter.character_development || ''}
                onChange={(e) => updateChapter(index, 'character_development', e.target.value)}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none min-h-[80px]"
                placeholder="Emotional beats and relationship changes..."
              />
            </div>

            {/* Subplots Advanced */}
            <div className="mb-4">
              <label className="text-cyan-400 text-sm mb-2 block font-semibold">Subplots Advanced</label>
              <textarea
                value={chapter.subplots_advanced || ''}
                onChange={(e) => updateChapter(index, 'subplots_advanced', e.target.value)}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none min-h-[60px]"
                placeholder="B-story progress (optional)..."
              />
            </div>

            {/* Closing Scene */}
            <div className="mb-4">
              <label className="text-orange-400 text-sm mb-2 block font-semibold">Closing Scene</label>
              <textarea
                value={chapter.closing_scene || ''}
                onChange={(e) => updateChapter(index, 'closing_scene', e.target.value)}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none min-h-[80px]"
                placeholder="How the chapter ends, cliffhanger or transition..."
              />
            </div>

            {/* Tone Notes */}
            <div className="mb-4">
              <label className="text-indigo-400 text-sm mb-2 block font-semibold">Tone Notes</label>
              <input
                type="text"
                value={(chapter.tone_notes || []).join(', ')}
                onChange={(e) => updateChapter(index, 'tone_notes', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="Mood tags: humor, tension, romance, etc. (comma separated)..."
              />
            </div>

            {/* Summary Prose */}
            <div className="mb-4 pt-4 border-t border-gray-700">
              <label className="text-gray-400 text-sm mb-2 block font-semibold">Narrative Summary</label>
              <textarea
                value={chapter.summary_prose || ''}
                onChange={(e) => updateChapter(index, 'summary_prose', e.target.value)}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none min-h-[120px]"
                placeholder="Overall narrative summary (~300 words)..."
              />
            </div>

            {/* Target Word Count */}
            <div className="mb-4">
              <label className="text-gray-400 text-sm mb-2 block font-semibold">Target Words</label>
              <input
                type="number"
                value={chapter.target_word_count}
                onChange={(e) => updateChapter(index, 'target_word_count', parseInt(e.target.value) || 0)}
                className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none w-32"
                min="100"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-gray-400 text-sm">Total Chapters</div>
            <div className="text-2xl font-bold text-white">{chapters.length}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Target Word Count</div>
            <div className="text-2xl font-bold text-white">
              {chapters.reduce((sum, ch) => sum + ch.target_word_count, 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Avg. Chapter Length</div>
            <div className="text-2xl font-bold text-white">
              {Math.round(chapters.reduce((sum, ch) => sum + ch.target_word_count, 0) / chapters.length).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {saveMutation.isError && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-500 rounded text-red-400">
          Error saving outline: {(saveMutation.error as Error).message}
        </div>
      )}
    </div>
  );
}
