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
      console.warn('[BulkGeneration] Already generating');
      return;
    }

    console.log('[BulkGeneration] Starting bulk generation:', projectId);

    // Reset state
    setState({
      isGenerating: true,
      currentChapter: null,
      currentTitle: null,
      completedChapters: 0,
      totalChapters: 0,
      totalWords: 0,
      errors: [],
      skippedChapters: [],
    });

    const url = `http://127.0.0.1:8000/api/projects/bulk/${projectId}/generate-all`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data: BulkGenerationEvent = JSON.parse(event.data);
        console.log('[BulkGeneration] Event:', data);

        switch (data.event) {
          case 'chapter_started':
            setState(prev => ({
              ...prev,
              currentChapter: data.chapter_index ?? null,
              currentTitle: data.title ?? null,
            }));
            break;

          case 'chapter_complete':
            setState(prev => ({
              ...prev,
              completedChapters: prev.completedChapters + 1,
              totalWords: prev.totalWords + (data.word_count ?? 0),
            }));
            break;

          case 'chapter_skipped':
            setState(prev => ({
              ...prev,
              skippedChapters: [...prev.skippedChapters, data.chapter_index ?? 0],
              completedChapters: prev.completedChapters + 1,
            }));
            break;

          case 'error':
            setState(prev => ({
              ...prev,
              errors: [...prev.errors, {
                chapter: data.chapter_index ?? 0,
                message: data.error ?? 'Unknown error',
              }],
            }));
            break;

          case 'complete':
            setState(prev => ({
              ...prev,
              isGenerating: false,
              totalChapters: data.total_chapters ?? 0,
              currentChapter: null,
              currentTitle: null,
            }));
            eventSource.close();
            eventSourceRef.current = null;
            console.log('[BulkGeneration] Complete!', data);
            break;

          case 'fatal_error':
            setState(prev => ({
              ...prev,
              isGenerating: false,
              errors: [...prev.errors, {
                chapter: 0,
                message: `Fatal: ${data.error ?? 'Unknown error'}`,
              }],
            }));
            eventSource.close();
            eventSourceRef.current = null;
            console.error('[BulkGeneration] Fatal error:', data.error);
            break;
        }
      } catch (error) {
        console.error('[BulkGeneration] Parse error:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('[BulkGeneration] EventSource error:', error);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        errors: [...prev.errors, {
          chapter: prev.currentChapter ?? 0,
          message: 'Connection error',
        }],
      }));
      eventSource.close();
      eventSourceRef.current = null;
    };
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
