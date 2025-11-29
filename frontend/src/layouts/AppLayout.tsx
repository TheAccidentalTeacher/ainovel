import { type ReactNode, useState } from 'react';
import { NavigationHeader } from '../components/navigation/NavigationHeader';
import { ContextList } from '../components/sidebar/ContextList';
import { ContextManager } from '../components/sidebar/ContextManager';
import { 
  useContexts, 
  useCreateContext, 
  useUpdateContext, 
  useToggleContext, 
  useDeleteContext 
} from '../hooks/useContexts';
import type { Context } from '../types';

interface AppLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export const AppLayout = ({ children, showSidebar = false }: AppLayoutProps) => {
  const [isContextManagerOpen, setIsContextManagerOpen] = useState(false);
  const [editingContext, setEditingContext] = useState<Context | null>(null);

  // Queries and mutations
  const { data: contexts = [], isLoading: isLoadingContexts } = useContexts();
  const createContext = useCreateContext();
  const updateContext = useUpdateContext();
  const toggleContext = useToggleContext();
  const deleteContext = useDeleteContext();

  // Handlers
  const handleCreateContext = () => {
    setEditingContext(null);
    setIsContextManagerOpen(true);
  };

  const handleEditContext = (context: Context) => {
    setEditingContext(context);
    setIsContextManagerOpen(true);
  };

  const handleSaveContext = async (data: any) => {
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

              {/* PROJECTS Section - Placeholder */}
              <div className="mb-6">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Projects
                </div>
                <div className="space-y-1">
                  <div className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer text-sm text-gray-700">
                    Leviathan Rising
                  </div>
                  <p className="text-xs text-gray-400 px-2 py-2">
                    Link projects to chat in Step 2
                  </p>
                </div>
              </div>

              {/* CONVERSATIONS Section - Placeholder */}
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Conversations
                </div>
                <div className="space-y-1">
                  <div className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer text-sm text-gray-600">
                    Today
                  </div>
                  <p className="text-xs text-gray-400 px-2 py-2">
                    Conversation list coming in Step 2
                  </p>
                </div>
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
