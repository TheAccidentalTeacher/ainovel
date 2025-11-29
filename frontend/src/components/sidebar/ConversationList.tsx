import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Edit2, Trash2, Check, XCircle, Plus } from 'lucide-react';
import { chatApi, type Conversation } from '../../services/chatService';
import { useConversation } from '../../hooks/useConversation';

interface ConversationListProps {
  userId: string;
  projectId?: string;
}

interface ConversationGroup {
  label: 'Today' | 'Yesterday' | 'Last 7 Days' | 'Older';
  conversations: Conversation[];
}

/**
 * Group conversations by date
 */
const groupConversationsByDate = (conversations: Conversation[]): ConversationGroup[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const groups: ConversationGroup[] = [
    { label: 'Today', conversations: [] },
    { label: 'Yesterday', conversations: [] },
    { label: 'Last 7 Days', conversations: [] },
    { label: 'Older', conversations: [] },
  ];

  conversations.forEach((conv) => {
    const convDate = new Date(conv.updated_at);
    
    if (convDate >= today) {
      groups[0].conversations.push(conv);
    } else if (convDate >= yesterday) {
      groups[1].conversations.push(conv);
    } else if (convDate >= lastWeek) {
      groups[2].conversations.push(conv);
    } else {
      groups[3].conversations.push(conv);
    }
  });

  // Filter out empty groups
  return groups.filter(group => group.conversations.length > 0);
};

/**
 * ConversationList Component
 * Displays conversations grouped by date with rename/delete actions
 */
export const ConversationList: React.FC<ConversationListProps> = ({ userId, projectId }) => {
  const queryClient = useQueryClient();
  const { conversationId, setConversationId, clearConversation } = useConversation();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');

  // Fetch conversations
  const { data: conversationsData, isLoading } = useQuery({
    queryKey: ['conversations', userId, projectId],
    queryFn: () => chatApi.listConversations(userId, projectId, 50, 0),
    staleTime: 30000, // 30 seconds
  });

  // Rename mutation
  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      chatApi.renameConversation(id, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', userId, projectId] });
      setRenamingId(null);
      setRenameTitle('');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => chatApi.deleteConversation(id),
    onSuccess: (_data, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['conversations', userId, projectId] });
      // If deleted the active conversation, clear it
      if (conversationId === deletedId) {
        clearConversation();
      }
    },
  });

  // Create new conversation handler
  const handleNewConversation = () => {
    clearConversation();
  };

  // Handle rename submit
  const handleRenameSubmit = (id: string) => {
    if (renameTitle.trim()) {
      renameMutation.mutate({ id, title: renameTitle.trim() });
    }
  };

  // Handle delete with confirmation
  const handleDelete = (conv: Conversation) => {
    if (confirm(`Delete "${conv.title}"? This cannot be undone.`)) {
      deleteMutation.mutate(conv.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  const conversations = conversationsData?.conversations || [];
  const groups = groupConversationsByDate(conversations);

  if (conversations.length === 0) {
    return (
      <div className="text-center py-6">
        <MessageCircle size={32} className="mx-auto text-gray-400 mb-2" />
        <p className="text-sm font-semibold text-gray-700 mb-2">No conversations yet</p>
        <p className="text-xs text-gray-600 mb-3 px-2">
          Start chatting and your conversations will appear here, organized by date
        </p>
        <div className="bg-amber-50 rounded-lg p-3 mb-3 mx-2 text-left">
          <p className="text-xs font-semibold text-amber-900 mb-2">
            💬 Pro Tip:
          </p>
          <p className="text-xs text-gray-700">
            Name conversations like \"Chapter 5 Edit\" or \"Character Brainstorm\" to find them easily later!
          </p>
        </div>
        <button
          onClick={handleNewConversation}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* New Conversation Button */}
      <button
        onClick={handleNewConversation}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors"
      >
        <Plus size={16} />
        New Chat
      </button>

      {/* Grouped Conversations */}
      {groups.map((group) => (
        <div key={group.label}>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {group.label}
          </div>
          <div className="space-y-1">
            {group.conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group relative rounded-lg transition-colors ${
                  conv.id === conversationId
                    ? 'bg-violet-50 border border-violet-200'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                {renamingId === conv.id ? (
                  // Rename Mode
                  <div className="flex items-center gap-1 p-2">
                    <input
                      type="text"
                      value={renameTitle}
                      onChange={(e) => setRenameTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRenameSubmit(conv.id);
                        } else if (e.key === 'Escape') {
                          setRenamingId(null);
                          setRenameTitle('');
                        }
                      }}
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      autoFocus
                    />
                    <button
                      onClick={() => handleRenameSubmit(conv.id)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                      title="Save"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setRenamingId(null);
                        setRenameTitle('');
                      }}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Cancel"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                ) : (
                  // Normal Display Mode
                  <>
                    <button
                      onClick={() => setConversationId(conv.id)}
                      className="w-full text-left px-3 py-2"
                    >
                      <div className="flex items-start gap-2 pr-16">
                        <MessageCircle
                          size={14}
                          className={
                            conv.id === conversationId
                              ? 'text-violet-600 mt-0.5 flex-shrink-0'
                              : 'text-gray-400 mt-0.5 flex-shrink-0'
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <div
                            className={`text-sm font-medium truncate ${
                              conv.id === conversationId
                                ? 'text-violet-900'
                                : 'text-gray-900'
                            }`}
                          >
                            {conv.title || 'New Conversation'}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            <span>
                              {new Date(conv.updated_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            <span>•</span>
                            <span>{conv.message_count || 0} msgs</span>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Action Buttons (show on hover) */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingId(conv.id);
                          setRenameTitle(conv.title || 'New Conversation');
                        }}
                        className="p-1.5 text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded transition-colors"
                        title="Rename"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(conv);
                        }}
                        className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Total Count */}
      <div className="pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
};
