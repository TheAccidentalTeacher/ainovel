import { useState, useCallback, useRef } from 'react';

export interface BulkGenerationEvent {
  event: 'chapter_started' | 'chapter_progress' | 'chapter_complete' | 'chapter_skipped' | 'summary_complete' | 'summary_error' | 'error' | 'fatal_error' | 'complete';
  chapter_index?: number;
  title?: string;
  word_count?: number;
  chapter_id?: string;
  summary_id?: string;
  reason?: string;
  error?: string;
  total_chapters?: number;
  total_words?: number;
}

export interface BulkGenerationState {
  isGenerating: boolean;
  currentChapter: number | null;
  currentTitle: string | null;
  completedChapters: number;
  totalChapters: number;
  totalWords: number;
  errors: Array<{ chapter: number; message: string }>;
  skippedChapters: number[];
}

export function useBulkGeneration() {
  const [state, setState] = useState<BulkGenerationState>({
    isGenerating: false,
    currentChapter: null,
    currentTitle: null,
    completedChapters: 0,
    totalChapters: 0,
    totalWords: 0,
    errors: [],
    skippedChapters: [],
  });

  const eventSourceRef = useRef<EventSource | null>(null);

  const startBulkGeneration = useCallback((projectId: string) => {
    if (state.isGenerating) {
      console.warn('[BulkGeneration] ⚠️ Already generating, ignoring request');
      return;
    }

    console.log('[BulkGeneration] 🚀 Starting bulk generation for project:', projectId);
    console.log('[BulkGeneration] 📊 Initial state:', state);

    // Reset state
    const initialState = {
      isGenerating: true,
      currentChapter: null,
      currentTitle: null,
      completedChapters: 0,
      totalChapters: 0,
      totalWords: 0,
      errors: [],
      skippedChapters: [],
    };
    console.log('[BulkGeneration] 🔄 Resetting state to:', initialState);
    setState(initialState);

    const url = `/api/projects/bulk/${projectId}/generate-all`;
    console.log('[BulkGeneration] 🌐 Opening SSE connection to:', url);
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;
    console.log('[BulkGeneration] ✅ EventSource created, readyState:', eventSource.readyState);

    eventSource.onmessage = (event) => {
      console.log('[BulkGeneration] 📨 Raw SSE message received:', event.data);
      try {
        const data: BulkGenerationEvent = JSON.parse(event.data);
        console.log('[BulkGeneration] 📦 Parsed event:', data.event, data);

        switch (data.event) {
          case 'chapter_started':
            console.log(`[BulkGeneration] ▶️ Chapter ${data.chapter_index} started: "${data.title}"`);
            setState(prev => {
              const newState = {
                ...prev,
                currentChapter: data.chapter_index ?? null,
                currentTitle: data.title ?? null,
              };
              console.log('[BulkGeneration] 📊 State updated (chapter_started):', newState);
              return newState;
            });
            break;

          case 'chapter_complete':
            console.log(`[BulkGeneration] ✅ Chapter ${data.chapter_index} complete! Words: ${data.word_count}, ID: ${data.chapter_id}`);
            setState(prev => {
              const newState = {
                ...prev,
                completedChapters: prev.completedChapters + 1,
                totalWords: prev.totalWords + (data.word_count ?? 0),
              };
              console.log('[BulkGeneration] 📊 State updated (chapter_complete):', { completedChapters: newState.completedChapters, totalWords: newState.totalWords });
              return newState;
            });
            break;

          case 'chapter_skipped':
            console.log(`[BulkGeneration] ⏭️ Chapter ${data.chapter_index} skipped: ${data.reason}`);
            setState(prev => ({
              ...prev,
              skippedChapters: [...prev.skippedChapters, data.chapter_index ?? 0],
              completedChapters: prev.completedChapters + 1,
            }));
            break;

          case 'error':
            console.error(`[BulkGeneration] ❌ Error on chapter ${data.chapter_index}:`, data.error);
            setState(prev => ({
              ...prev,
              errors: [...prev.errors, {
                chapter: data.chapter_index ?? 0,
                message: data.error ?? 'Unknown error',
              }],
            }));
            break;

          case 'complete':
            console.log('[BulkGeneration] 🎉 BULK GENERATION COMPLETE!', data);
            console.log('[BulkGeneration] 📊 Final stats:', { total_chapters: data.total_chapters, total_words: data.total_words });
            setState(prev => {
              const finalState = {
                ...prev,
                isGenerating: false,
                totalChapters: data.total_chapters ?? 0,
                currentChapter: null,
                currentTitle: null,
              };
              console.log('[BulkGeneration] 📊 Final state:', finalState);
              return finalState;
            });
            console.log('[BulkGeneration] 🔌 Closing EventSource');
            eventSource.close();
            eventSourceRef.current = null;
            break;

          case 'fatal_error':
            console.error('[BulkGeneration] 💀 FATAL ERROR:', data.error);
            setState(prev => ({
              ...prev,
              isGenerating: false,
              errors: [...prev.errors, {
                chapter: 0,
                message: `Fatal: ${data.error ?? 'Unknown error'}`,
              }],
            }));
            console.log('[BulkGeneration] 🔌 Closing EventSource due to fatal error');
            eventSource.close();
            eventSourceRef.current = null;
            break;
        }
      } catch (error) {
        console.error('[BulkGeneration] 🚨 JSON parse error:', error);
        console.error('[BulkGeneration] 🚨 Raw data that failed to parse:', event.data);
      }
    };

    eventSource.onerror = (error) => {
      console.error('[BulkGeneration] 🔥 EventSource error event:', error);
      console.error('[BulkGeneration] 🔥 EventSource readyState:', eventSource.readyState);
      console.error('[BulkGeneration] 🔥 EventSource url:', eventSource.url);
      setState(prev => {
        const errorState = {
          ...prev,
          isGenerating: false,
          errors: [...prev.errors, {
            chapter: prev.currentChapter ?? 0,
            message: 'Connection error - check backend logs',
          }],
        };
        console.log('[BulkGeneration] 📊 Error state:', errorState);
        return errorState;
      });
      console.log('[BulkGeneration] 🔌 Closing EventSource due to error');
      eventSource.close();
      eventSourceRef.current = null;
    };

    console.log('[BulkGeneration] 🎬 Bulk generation setup complete, waiting for events...');
  }, [state.isGenerating]);

  const stopBulkGeneration = useCallback(() => {
    console.log('[BulkGeneration] Stopping');
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setState(prev => ({
      ...prev,
      isGenerating: false,
      currentChapter: null,
      currentTitle: null,
    }));
  }, []);

  return {
    ...state,
    startBulkGeneration,
    stopBulkGeneration,
  };
}
