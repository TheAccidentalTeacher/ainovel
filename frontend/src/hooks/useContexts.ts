import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/api-client';
import type { Context, ContextCreate, ContextUpdate } from '../types';
import { debug } from '../lib/debug';

const CONTEXTS_QUERY_KEY = ['contexts'];

/**
 * Hook for fetching all contexts
 */
export const useContexts = () => {
  debug.hook('useContexts', 'Initializing query');
  
  return useQuery<Context[]>({
    queryKey: CONTEXTS_QUERY_KEY,
    queryFn: async () => {
      debug.hook('useContexts', 'Fetching contexts');
      try {
        const data = await apiClient.getContexts();
        debug.success('useContexts', `Fetched ${data?.length || 0} contexts`);
        return data;
      } catch (error) {
        debug.error('useContexts', error);
        throw error;
      }
    },
    staleTime: 30000, // Consider fresh for 30 seconds
    retry: 1, // Only retry once
  });
};

/**
 * Hook for creating a new context
 */
export const useCreateContext = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ContextCreate) => apiClient.createContext(data),
    onSuccess: () => {
      // Invalidate and refetch contexts
      queryClient.invalidateQueries({ queryKey: CONTEXTS_QUERY_KEY });
    },
  });
};

/**
 * Hook for updating an existing context
 */
export const useUpdateContext = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ contextId, data }: { contextId: string; data: ContextUpdate }) =>
      apiClient.updateContext(contextId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTEXTS_QUERY_KEY });
    },
  });
};

/**
 * Hook for toggling context active state
 */
export const useToggleContext = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contextId: string) => apiClient.toggleContext(contextId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTEXTS_QUERY_KEY });
    },
  });
};

/**
 * Hook for deleting a context
 */
export const useDeleteContext = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contextId: string) => apiClient.deleteContext(contextId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTEXTS_QUERY_KEY });
    },
  });
};

/**
 * Hook to get the currently active context
 */
export const useActiveContext = () => {
  const { data: contexts } = useContexts();
  return contexts?.find((ctx: Context) => ctx.is_active) || null;
};
