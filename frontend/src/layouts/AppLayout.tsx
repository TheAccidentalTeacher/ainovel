import { type ReactNode, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Menu, X } from 'lucide-react';
import { NavigationHeader } from '../components/navigation/NavigationHeader';
import { ContextList } from '../components/sidebar/ContextList';
import { ContextManager } from '../components/sidebar/ContextManager';
import { ProjectList } from '../components/sidebar/ProjectList';
import { ConversationList } from '../components/sidebar/ConversationList';
import { InfoPanel } from '../components/info-panel/InfoPanel';
import { 
  useContexts, 
  useCreateContext, 
  useUpdateContext, 
  useToggleContext, 
  useDeleteContext 
} from '../hooks/useContexts';
import { useLinkedProject } from '../hooks/useLinkedProject';
import { useCollapsedSections } from '../hooks/useCollapsedSections';
import apiClient from '../lib/api-client';
import type { Context, ContextCreate, ContextUpdate } from '../types';

interface AppLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export const AppLayout = ({ children, showSidebar = false }: AppLayoutProps) => {
  const [isContextManagerOpen, setIsContextManagerOpen] = useState(false);
  const [editingContext, setEditingContext] = useState<Context | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Collapsed sections state
  const { contexts: contextsCollapsed, projects: projectsCollapsed, conversations: conversationsCollapsed, toggleSection } = useCollapsedSections();

  // Queries and mutations
  const { data: contextsData, isLoading: isLoadingContexts, error: contextsError } = useContexts();
  const contexts: Context[] = contextsData || [];
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

  // Fetch linked project details for InfoPanel
  const { data: linkedProjectData } = useQuery({
    queryKey: ['project', linkedProjectId],
    queryFn: () => apiClient.getProject(linkedProjectId!),
    enabled: !!linkedProjectId,
    staleTime: 60000, // 1 minute
  });

  // Extract project details from response
  const linkedProject = linkedProjectData?.project || null;
  const storyBible = linkedProjectData?.story_bible || undefined;
  const outline = linkedProjectData?.outline || undefined;

  // Handlers
  const handleCreateContext = () => {
    setEditingContext(null);
    setIsContextManagerOpen(true);
  };

  const handleEditContext = (context: Context) => {
    setEditingContext(context);
    setIsContextManagerOpen(true);
  };

  const handleSaveContext = async (data: ContextCreate | ContextUpdate) => {
    if (editingContext) {
      // Update existing context - all fields optional for update
      await updateContext.mutateAsync({
        contextId: editingContext._id,
        data: data as ContextUpdate,
      });
    } else {
      // Create new context - name is required
      await createContext.mutateAsync(data as ContextCreate);
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

      {/* Mobile Hamburger Menu Button */}
      {showSidebar && (
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="md:hidden fixed bottom-6 left-6 z-50 bg-violet-600 text-white p-3 rounded-full shadow-lg hover:bg-violet-700 transition-colors"
          aria-label="Toggle sidebar"
        >
          {isMobileSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Main Content Area - Below header (64px offset) */}
      <div className="pt-16 h-screen flex">
        {/* Mobile Overlay */}
        {showSidebar && isMobileSidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Optional, for chat contexts/projects */}
        {showSidebar && (
          <aside className={`
            w-[280px] bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto
            md:static md:translate-x-0 md:z-auto
            fixed inset-y-0 left-0 z-40 pt-16
            transform transition-transform duration-300 ease-in-out
            ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <div className="p-4">
              {/* CONTEXTS Section */}
              <div className="mb-6">
                <button
                  onClick={() => toggleSection('contexts')}
                  className="w-full flex items-center justify-between mb-3 hover:bg-gray-50 rounded px-2 py-1 -mx-2 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Contexts
                    </div>
                    {contextsCollapsed ? (
                      <ChevronDown size={14} className="text-gray-400 group-hover:text-violet-600 transition-colors" />
                    ) : (
                      <ChevronUp size={14} className="text-gray-400 group-hover:text-violet-600 transition-colors" />
                    )}
                  </div>
                  <button
                    className="text-gray-400 hover:text-violet-600 transition-colors"
                    title="What are Contexts?"
                    onClick={(e) => {
                      e.stopPropagation();
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
                </button>
                <div className={`transition-all duration-200 ease-in-out overflow-hidden ${contextsCollapsed ? 'max-h-0' : 'max-h-[600px]'}`}>
                  <ContextList
                    contexts={contexts}
                    onActivate={handleToggleContext}
                    onEdit={handleEditContext}
                    onDelete={handleDeleteContext}
                    onCreate={handleCreateContext}
                    isLoading={isLoadingContexts}
                  />
                </div>
              </div>

              {/* PROJECTS Section */}
              <div className="mb-6">
                <button
                  onClick={() => toggleSection('projects')}
                  className="w-full flex items-center justify-between mb-3 hover:bg-gray-50 rounded px-2 py-1 -mx-2 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Projects
                    </div>
                    {projectsCollapsed ? (
                      <ChevronDown size={14} className="text-gray-400 group-hover:text-violet-600 transition-colors" />
                    ) : (
                      <ChevronUp size={14} className="text-gray-400 group-hover:text-violet-600 transition-colors" />
                    )}
                  </div>
                  <button
                    className="text-gray-400 hover:text-violet-600 transition-colors"
                    title="What is Project Linking?"
                    onClick={(e) => {
                      e.stopPropagation();
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
                </button>
                <div className={`transition-all duration-200 ease-in-out overflow-hidden ${projectsCollapsed ? 'max-h-0' : 'max-h-[600px]'}`}>
                  <ProjectList
                    projects={projects}
                    linkedProjectId={linkedProjectId}
                    onLinkProject={linkProject}
                    onUnlinkProject={unlinkProject}
                    isLoading={isLoadingProjects}
                  />
                </div>
              </div>

              {/* CONVERSATIONS Section */}
              <div>
                <button
                  onClick={() => toggleSection('conversations')}
                  className="w-full flex items-center justify-between mb-3 hover:bg-gray-50 rounded px-2 py-1 -mx-2 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Conversations
                    </div>
                    {conversationsCollapsed ? (
                      <ChevronDown size={14} className="text-gray-400 group-hover:text-violet-600 transition-colors" />
                    ) : (
                      <ChevronUp size={14} className="text-gray-400 group-hover:text-violet-600 transition-colors" />
                    )}
                  </div>
                  <button
                    className="text-gray-400 hover:text-violet-600 transition-colors"
                    title="Managing Your Chat History"
                    onClick={(e) => {
                      e.stopPropagation();
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
                </button>
                <div className={`transition-all duration-200 ease-in-out overflow-hidden ${conversationsCollapsed ? 'max-h-0' : 'max-h-[600px]'}`}>
                  <ConversationList
                    userId="default-user" // TODO: Get from auth context
                    projectId={linkedProjectId || undefined}
                  />
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>

        {/* Info Panel - Shows when project is linked (hidden on tablets and mobile) */}
        {showSidebar && (
          <div className="hidden lg:block">
            <InfoPanel
              project={linkedProject}
              storyBible={storyBible}
              outline={outline}
              isVisible={!!linkedProjectId}
            />
          </div>
        )}
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
