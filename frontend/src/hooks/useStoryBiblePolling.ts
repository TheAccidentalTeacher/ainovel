import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook to poll for Story Bible completion during generation
 * Automatically refreshes the project data when Story Bible is detected
 */
export function useStoryBiblePolling(
  projectId: string | undefined,
  isGenerating: boolean,
  onComplete?: () => void
) {
  const queryClient = useQueryClient();
  const pollIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pollCountRef = useRef<number>(0);

  useEffect(() => {
    if (!projectId || !isGenerating) {
      // Clear polling when not generating
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
        pollCountRef.current = 0;
      }
      return;
    }

    // Start polling when generation begins
    console.log('[StoryBiblePolling] Starting poll for project:', projectId);
    startTimeRef.current = Date.now();
    pollCountRef.current = 0;

    // Poll every 3 seconds
    pollIntervalRef.current = setInterval(async () => {
      pollCountRef.current += 1;
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      
      console.log(`[StoryBiblePolling] Poll #${pollCountRef.current} (${elapsed}s elapsed)`);

      try {
        // Refetch project data
        await queryClient.invalidateQueries({ queryKey: ['project', projectId] });
        
        // Check if Story Bible exists now
        const projectData = queryClient.getQueryData(['project', projectId]) as any;
        if (projectData?.story_bible) {
          console.log('[StoryBiblePolling] ✅ Story Bible detected! Stopping poll.');
          
          // Clear interval
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          
          // Call completion callback
          if (onComplete) {
            onComplete();
          }
        }
      } catch (error) {
        console.error('[StoryBiblePolling] Poll error:', error);
      }

      // Safety: Stop after 45 polls (135 seconds)
      if (pollCountRef.current >= 45) {
        console.warn('[StoryBiblePolling] ⚠️ Max polls reached, stopping');
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    }, 3000);

    // Cleanup on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [projectId, isGenerating, queryClient, onComplete]);

  return {
    pollCount: pollCountRef.current,
    elapsedTime: startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0,
  };
}
