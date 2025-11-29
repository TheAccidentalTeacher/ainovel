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
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Contexts
                  </div>
                  <button
                    className="text-gray-400 hover:text-violet-600 transition-colors"
                    title="What are Contexts?"
                    onClick={() => {
                      alert(
                        '🎯 CONTEXTS: Organize Your AI Conversations\n\n' +
                        'Think of contexts as "mental modes" for your AI assistant.\n\n' +
                        '✨ Real-Life Examples:\n' +
                        '• 📖 Romance Writing - AI focuses on emotional depth, relationship dynamics\n' +
                        '• 🚀 Sci-Fi World Building - AI emphasizes technical accuracy, future tech\n' +
                        '• 🕵️ Mystery Plotting - AI helps with clues, red herrings, plot twists\n' +
                        '• ✍️ Character Development - AI dives deep into psychology, motivations\n\n' +
                        '💡 Pro Tips:\n' +
                        '• Only ONE context can be active at a time\n' +
                        '• Use custom icons & colors to make them memorable\n' +
                        '• Switch contexts to change how the AI responds\n\n' +
                        '🎨 Best Practice: Create a context for each genre or writing phase!\n\n' +
                        'NOTE: CRUD = Create, Read, Update, Delete (you can make/edit/remove contexts)'
                      );
                    }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
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
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Projects
                  </div>
                  <button
                    className="text-gray-400 hover:text-violet-600 transition-colors"
                    title="What is Project Linking?"
                    onClick={() => {
                      alert(
                        '🔗 PROJECT LINKING: Give AI Full Context About Your Novel\n\n' +
                        'Link a project to chat and the AI becomes your smart co-author who knows EVERYTHING about your story!\n\n' +
                        '✨ What the AI Sees When Linked:\n' +
                        '• All your characters (names, traits, relationships)\n' +
                        '• Complete plot outline and story structure\n' +
                        '• World-building details and settings\n' +
                        '• Current chapter progress and word count\n' +
                        '• Story themes and genre conventions\n\n' +
                        '💡 Real-Life Use Cases:\n' +
                        '• "Rewrite Chapter 3 to foreshadow Elena\'s betrayal"\n' +
                        '• "Is this dialogue consistent with Marcus\'s personality?"\n' +
                        '• "Suggest 3 ways to raise the stakes in Act 2"\n' +
                        '• "Check if this scene contradicts my outline"\n\n' +
                        '🎯 Pro Tips:\n' +
                        '• Link = AI has your story bible in mind\n' +
                        '• Unlink = General writing chat (no project context)\n' +
                        '• Progress bar shows your writing momentum!\n\n' +
                        'Think of it as giving the AI your entire manuscript folder! 📚'
                      );
                    }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
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
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Conversations
                  </div>
                  <button
                    className="text-gray-400 hover:text-violet-600 transition-colors"
                    title="Managing Your Chat History"
                    onClick={() => {
                      alert(
                        '💬 CONVERSATIONS: Your AI Chat History\n\n' +
                        'Every chat is auto-saved and organized by date. Think of it like your text message history with a super-smart writing buddy!\n\n' +
                        '📅 Date Groups:\n' +
                        '• Today - Fresh conversations\n' +
                        '• Yesterday - Recent chats\n' +
                        '• Last 7 Days - This week\'s work\n' +
                        '• Older - Your archive\n\n' +
                        '✨ Quick Actions:\n' +
                        '• Click any conversation to continue it\n' +
                        '• Hover to see Rename & Delete buttons\n' +
                        '• "New Chat" starts fresh (good for new topics)\n\n' +
                        '💡 Real-Life Workflow:\n' +
                        '1. Link your novel project\n' +
                        '2. Name conversation "Chapter 5 Revisions"\n' +
                        '3. Keep all related feedback in one thread\n' +
                        '4. Switch to "Character Arcs" for different topic\n\n' +
                        '🎯 Pro Tips:\n' +
                        '• Rename conversations to find them later\n' +
                        '• Keep brainstorming separate from editing chats\n' +
                        '• Message count shows how deep you went\n\n' +
                        'Your conversations never expire - come back anytime! 🕐'
                      );
                    }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
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
