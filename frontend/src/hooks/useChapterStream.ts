import { useState, useCallback, useRef } from 'react';

interface StreamState {
  content: string;
  isStreaming: boolean;
  error: string | null;
  wordCount: number;
  chapterId: string | null;
}

export function useChapterStream() {
  const [streamState, setStreamState] = useState<StreamState>({
    content: '',
    isStreaming: false,
    error: null,
    wordCount: 0,
    chapterId: null,
  });

  const eventSourceRef = useRef<EventSource | null>(null);

  const startStream = useCallback((projectId: string, chapterIndex: number) => {
    // Reset state
    setStreamState({
      content: '',
      isStreaming: true,
      error: null,
      wordCount: 0,
      chapterId: null,
    });

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    const url = `${API_BASE_URL}/projects/${projectId}/chapters/${chapterIndex}/generate-stream`;

    console.log('[ChapterStream] Starting stream:', url);

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      // Regular data chunks
      setStreamState((prev) => ({
        ...prev,
        content: prev.content + event.data,
        wordCount: (prev.content + event.data).split(/\s+/).filter(Boolean).length,
      }));
    };

    eventSource.addEventListener('done', (event) => {
      console.log('[ChapterStream] Stream complete:', event.data);
      const metadata = JSON.parse(event.data);
      setStreamState((prev) => ({
        ...prev,
        isStreaming: false,
        chapterId: metadata.id,
        wordCount: metadata.word_count,
      }));
      eventSource.close();
      eventSourceRef.current = null;
    });

    eventSource.addEventListener('error', (event: any) => {
      console.error('[ChapterStream] Stream error:', event);
      const errorData = event.data ? JSON.parse(event.data) : { error: 'Stream connection failed' };
      setStreamState((prev) => ({
        ...prev,
        isStreaming: false,
        error: errorData.error || 'Unknown error occurred',
      }));
      eventSource.close();
      eventSourceRef.current = null;
    });

    eventSource.onerror = () => {
      console.error('[ChapterStream] EventSource error');
      setStreamState((prev) => ({
        ...prev,
        isStreaming: false,
        error: 'Connection error - stream interrupted',
      }));
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, []);

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('[ChapterStream] Stopping stream');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setStreamState((prev) => ({
        ...prev,
        isStreaming: false,
      }));
    }
  }, []);

  return {
    ...streamState,
    startStream,
    stopStream,
  };
}
