import { type ReactNode, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NavigationHeader } from '../components/navigation/NavigationHeader';
import { ContextList } from '../components/sidebar/ContextList';
import { ContextManager } from '../components/sidebar/ContextManager';
import { ProjectList } from '../components/sidebar/ProjectList';
import { ConversationList } from '../components/sidebar/ConversationList';
import { 
  useContexts, 
  useCreateContext, 
  useUpdateContext, 
  useToggleContext, 
  useDeleteContext 
} from '../hooks/useContexts';
import { useLinkedProject } from '../hooks/useLinkedProject';
import apiClient from '../lib/api-client';
import type { Context, Project } from '../types';

interface AppLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export const AppLayout = ({ children, showSidebar = false }: AppLayoutProps) => {
  const [isContextManagerOpen, setIsContextManagerOpen] = useState(false);
  const [editingContext, setEditingContext] = useState<Context | null>(null);

  // Queries and mutations
  const { data: contexts = [], isLoading: isLoadingContexts, error: contextsError } = useContexts();
  const createContext = useCreateContext();
  const updateContext = useUpdateContext();
  const toggleContext = useToggleContext();
  const deleteContext = useDeleteContext();
  
  // Log context errors for debugging
  if (contextsError) {
    console.error('Failed to load contexts:', contextsError);
  }

  // Project linking state
  const { linkedProjectId, linkProject, unlinkProject } = useLinkedProject();
  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiClient.listProjects(),
    staleTime: 60000, // 1 minute
  });
  
  // Extract projects array from response
  const projects = (projectsData as any)?.projects || [];

  // Handlers
  const handleCreateContext = () => {
    setEditingContext(null);
    setIsContextManagerOpen(true);
  };

  const handleEditContext = (context: Context) => {
    setEditingContext(context);
    setIsContextManagerOpen(true);
  };

  const handleSaveContext = async (data: { name: string; icon?: string; color?: string; description?: string }) => {
    if (editingContext) {
      // Update existing context
      await updateContext.mutateAsync({
        contextId: editingContext._id,
        data,
      });
    } else {
      // Create new context
      await createContext.mutateAsync(data);
    }
  };

  const handleToggleContext = async (contextId: string) => {
    await toggleContext.mutateAsync(contextId);
  };

  const handleDeleteContext = async (contextId: string) => {
    await deleteContext.mutateAsync(contextId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header - Always visible */}
      <NavigationHeader />

      {/* Main Content Area - Below header (64px offset) */}
      <div className="pt-16 h-screen flex">
        {/* Sidebar - Optional, for chat contexts/projects */}
        {showSidebar && (
          <aside className="w-[280px] bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
            <div className="p-4">
              {/* CONTEXTS Section */}
              <div className="mb-6">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Contexts
                </div>
                <ContextList
                  contexts={contexts}
                  onActivate={handleToggleContext}
                  onEdit={handleEditContext}
                  onDelete={handleDeleteContext}
                  onCreate={handleCreateContext}
                  isLoading={isLoadingContexts}
                />
              </div>

              {/* PROJECTS Section */}
              <div className="mb-6">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Projects
                </div>
                <ProjectList
                  projects={projects}
                  linkedProjectId={linkedProjectId}
                  onLinkProject={linkProject}
                  onUnlinkProject={unlinkProject}
                  isLoading={isLoadingProjects}
                />
              </div>

              {/* CONVERSATIONS Section */}
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Conversations
                </div>
                <ConversationList
                  userId="default-user" // TODO: Get from auth context
                  projectId={linkedProjectId || undefined}
                />
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Context Manager Modal */}
      <ContextManager
        isOpen={isContextManagerOpen}
        onClose={() => setIsContextManagerOpen(false)}
        onSave={handleSaveContext}
        context={editingContext}
      />
    </div>
  );
};
