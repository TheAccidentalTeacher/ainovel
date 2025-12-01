/**
 * Chat Widget Component
 * 
 * Phase 1: Floating chat button + expandable panel with AI conversation.
 * Features:
 * - Floating button (bottom-right)
 * - Expandable chat panel (400px x 600px)
 * - Real-time streaming responses (SSE)
 * - Auto-save every message
 * - Auto-scroll to bottom
 * - Loading states & error handling
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, MessageCircle, Send, Loader2, Plus, Search, Image, Newspaper, Globe, HelpCircle, Info, Zap, Clock, BookOpen, Bot, Users, Sparkles } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi, type ConversationResponse } from '../services/chatService';
import { agentApi, type Agent } from '../services/agentService';
import { SearchFeatureTour } from './SearchFeatureTour';
import { useConversation } from '../hooks/useConversation';

interface Message {
  id: string;
  conversation_id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  token_count?: number;
  model?: string;
  search_type?: string;
  agent_id?: string;
  agent_name?: string;
}

interface ChatWidgetProps {
  userId: string;
  projectId?: string;
  fullScreen?: boolean;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ userId, projectId, fullScreen = false }) => {
  const [isOpen, setIsOpen] = useState(fullScreen ? true : false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  // Use global conversation state
  const { conversationId, setConversationId, clearConversation } = useConversation();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [width, setWidth] = useState(400); // Default width
  const [isResizing, setIsResizing] = useState(false);
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4-20250514');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [showSearchHelp, setShowSearchHelp] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{
    title: string;
    url: string;
    content: string;
    score?: number;
  }>>([]);
  const [searchImages, setSearchImages] = useState<Array<{ url: string; description?: string }>>([]);
  const [searchAnswer, setSearchAnswer] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchTour, setShowSearchTour] = useState(false);
  const [searchType, setSearchType] = useState<string>('');
  const [botMode, setBotMode] = useState<'standard' | 'agent' | 'debate'>('standard');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [showBotSelector, setShowBotSelector] = useState(false);
  const [debateAgents, setDebateAgents] = useState<string[]>([]);

  // Show tour when web search is first enabled
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('search_tour_seen');
    if (webSearchEnabled && !hasSeenTour && !showSearchTour) {
      setShowSearchTour(true);
    }
  }, [webSearchEnabled, showSearchTour]);

  const handleCloseTour = () => {
    setShowSearchTour(false);
    localStorage.setItem('search_tour_seen', 'true');
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch available models
  const { data: modelsData } = useQuery({
    queryKey: ['chat-models'],
    queryFn: () => chatApi.getAvailableModels(),
  });

  // Fetch available agents
  const { data: agentsData } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentApi.listAgents(),
    enabled: isOpen, // Only fetch when chat is open
  });

  // Create conversation on open if none exists
  const createConversationMutation = useMutation({
    mutationFn: () => chatApi.createConversation({ user_id: userId, project_id: projectId }),
    onSuccess: (data: ConversationResponse) => {
      setConversationId(data.conversation.id);
      setMessages(data.messages as Message[]);
    },
  });



  // Load conversation history
  const { data: conversationData } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => chatApi.getConversation(conversationId!),
    enabled: !!conversationId,
  });

  // Update messages when conversation loads
  useEffect(() => {
    if (conversationData) {
      setMessages(conversationData.messages as Message[]);
    }
  }, [conversationData]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Create conversation when opening for first time
  useEffect(() => {
    if (isOpen && !conversationId) {
      createConversationMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, conversationId]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Handle horizontal resize (drag left edge)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return;
      
      const panelRect = panelRef.current.getBoundingClientRect();
      const newWidth = panelRect.right - e.clientX;
      
      // Min width: 320px, Max width: 800px
      if (newWidth >= 320 && newWidth <= 800) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleSendMessage = async () => {
    if (!input.trim() || !conversationId || isStreaming) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message optimistically
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId || undefined,
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
      token_count: 0,
    };
    setMessages(prev => [...prev, tempUserMessage]);

    setIsStreaming(true);
    setStreamingContent('');
    setSearchResults([]);
    setSearchAnswer('');
    if (webSearchEnabled) {
      setIsSearching(true);
    }

    // Use dynamic API URL for production/development compatibility
    const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api');

    try {
      // AGENT MODE: Chat with specific agent
      if (botMode === 'agent' && selectedAgentId) {
        const response = await agentApi.chatWithAgent({
          agent_id: selectedAgentId,
          message: userMessage,
          project_id: projectId,
          conversation_history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        });

        const assistantMessage: Message = {
          id: `agent-${Date.now()}`,
          conversation_id: conversationId || undefined,
          role: 'assistant',
          content: response.response,
          timestamp: response.timestamp,
          token_count: 0,
          agent_id: response.agent_id,
          agent_name: response.agent_name,
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        setIsStreaming(false);
        queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
        return;
      }

      // DEBATE MODE: Multi-agent debate
      if (botMode === 'debate' && debateAgents.length > 0) {
        const debateResponse = await agentApi.startDebate({
          debate_topic: userMessage,
          project_id: projectId,
          context: {
            genre: 'general',
            conversation_context: messages.slice(-5).map(m => m.content).join('\n'),
          },
          participating_agents: debateAgents,
          rounds: 1,
        });

        // Format debate as message
        let debateContent = `🗳️ **Debate Results**\n\n`;
        debateContent += `**Topic:** ${debateResponse.debate_topic}\n\n`;
        debateContent += `**Participants:** ${debateResponse.participants.join(', ')}\n\n`;
        
        debateResponse.arguments.forEach(arg => {
          debateContent += `**${arg.agent_name}** (${arg.vote}):\n${arg.argument}\n\n`;
        });
        
        debateContent += `**Winner:** ${debateResponse.vote_tally.winner}\n`;
        debateContent += `**Vote:** Support: ${debateResponse.vote_tally.support}, Oppose: ${debateResponse.vote_tally.oppose}, Abstain: ${debateResponse.vote_tally.abstain}\n\n`;
        debateContent += `**Synthesis:**\n${debateResponse.synthesis}`;

        const assistantMessage: Message = {
          id: `debate-${Date.now()}`,
          conversation_id: conversationId || undefined,
          role: 'assistant',
          content: debateContent,
          timestamp: debateResponse.timestamp,
          token_count: 0,
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        setIsStreaming(false);
        queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
        return;
      }

      // STANDARD MODE: Regular streaming chat
      const response = await fetch(
        `${API_BASE_URL}/chat/conversations/${conversationId}/messages?model=${selectedModel}&web_search=${webSearchEnabled}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: userMessage }),
        }
      );

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.search_type) {
                setSearchType(data.search_type);
              }
              
              if (data.search_results) {
                setSearchResults(data.search_results);
                setIsSearching(false);
              }
              
              if (data.search_images) {
                setSearchImages(data.search_images);
              }
              
              if (data.search_answer) {
                setSearchAnswer(data.search_answer);
              }
              
              if (data.content) {
                fullResponse += data.content;
                setStreamingContent(fullResponse);
              }
              
              if (data.done) {
                // Add complete assistant message
                const assistantMessage: Message = {
                  id: `assistant-${Date.now()}`,
                  conversation_id: conversationId || undefined,
                  role: 'assistant',
                  content: fullResponse,
                  timestamp: new Date().toISOString(),
                  token_count: 0,
                  search_type: searchType || undefined,
                };
                setMessages(prev => [...prev, assistantMessage]);
                setStreamingContent('');
                
                // Refresh conversation
                queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
              }
              
              if (data.error) {
                console.error('Stream error:', data.error);
              }
            } catch {
              // Ignore JSON parse errors for partial chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in message stream:', error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(),
        conversation_id: conversationId || undefined,
        role: 'assistant', 
        content: 'Sorry, there was an error processing your message.',
        timestamp: new Date().toISOString(),
        token_count: 0,
      }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Search Feature Tour Modal */}
      {showSearchTour && <SearchFeatureTour onClose={handleCloseTour} />}

      {/* Floating Button - Only show if not fullScreen */}
      {!fullScreen && !isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all z-50"
          aria-label="Open chat"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          style={fullScreen ? {} : { width: `${width}px` }}
          className={fullScreen 
            ? "h-full w-full bg-white dark:bg-gray-800 flex flex-col" 
            : "fixed bottom-6 right-6 h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200 dark:border-gray-700"
          }
        >
          {/* Resize Handle (left edge) - Only in widget mode */}
          {!fullScreen && (
            <div
              onMouseDown={() => setIsResizing(true)}
              className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500 hover:w-1.5 transition-all z-10"
              style={{ marginLeft: '-2px' }}
            />
          )}
          
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageCircle size={20} className={fullScreen ? "text-violet-600" : "text-blue-600"} />
                <h3 className="font-semibold text-gray-900 dark:text-white">Writing Assistant</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    clearConversation();
                    setMessages([]);
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label="New conversation"
                  title="New chat"
                >
                  <Plus size={20} />
                </button>
                {/* Close button - Only in widget mode */}
                {!fullScreen && (
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label="Close chat"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>
            
            {/* Model Selector */}
            <div className="space-y-2">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={isStreaming}
                className="w-full text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
              >
                {modelsData?.models.map((model: { id: string; name: string; description?: string }) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              
              {/* Model Description */}
              {(() => {
                const model = modelsData?.models.find((m: any) => m.id === selectedModel);
                return model && 'description' in model && model.description ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {model.description as string}
                  </p>
                ) : null;
              })()}
              
              {/* Bot Mode Selector */}
              <div className="flex gap-2">
                <button
                  onClick={() => setBotMode('standard')}
                  disabled={isStreaming}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                    botMode === 'standard'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  } disabled:opacity-50`}
                  title="Standard AI chat"
                >
                  <MessageCircle size={14} />
                  <span>Standard</span>
                </button>
                <button
                  onClick={() => {
                    setBotMode('agent');
                    setShowBotSelector(true);
                  }}
                  disabled={isStreaming || !agentsData?.agents?.length}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                    botMode === 'agent'
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  } disabled:opacity-50`}
                  title="Chat with specialist bot"
                >
                  <Bot size={14} />
                  <span>Agent</span>
                </button>
                <button
                  onClick={() => {
                    setBotMode('debate');
                    setShowBotSelector(true);
                  }}
                  disabled={isStreaming || !agentsData?.agents?.length}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                    botMode === 'debate'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  } disabled:opacity-50`}
                  title="Multi-bot debate mode"
                >
                  <Users size={14} />
                  <span>Debate</span>
                </button>
              </div>

              {/* Active Agent Display */}
              {botMode === 'agent' && selectedAgentId && agentsData?.agents && (
                <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 dark:bg-violet-900/20 rounded-md"}
                  <Bot size={14} className="text-violet-600" />
                  <span className="text-xs font-medium text-violet-700 dark:text-violet-300">
                    {agentsData.agents.find((a: Agent) => a.agent_id === selectedAgentId)?.name || 'Unknown Agent'}
                  </span>
                  <button
                    onClick={() => setShowBotSelector(true)}
                    className="ml-auto text-xs text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Active Debate Agents Display */}
              {botMode === 'debate' && debateAgents.length > 0 && agentsData?.agents && (
                <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-md"}
                  <Users size={14} className="text-purple-600" />
                  <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                    {debateAgents.length} agents in debate
                  </span>
                  <button
                    onClick={() => setShowBotSelector(true)}
                    className="ml-auto text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Web Search Toggle with Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={webSearchEnabled}
                      onChange={(e) => setWebSearchEnabled(e.target.checked)}
                      disabled={isStreaming}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-600 disabled:opacity-50"
                    />
                    <Search size={14} className="text-blue-600" />
                    <span className="font-medium">Web Search</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowExamples(!showExamples)}
                      className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                      title="See example queries"
                    >
                      <BookOpen size={16} />
                    </button>
                    <button
                      onClick={() => setShowSearchHelp(!showSearchHelp)}
                      className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                      title="Learn about web search"
                    >
                      <HelpCircle size={16} />
                    </button>
                  </div>
                </div>

                {/* Web Search Status Indicator */}
                {webSearchEnabled && (
                  <div className="flex items-center gap-2 px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                    <Zap size={12} className="text-blue-600" />
                    <span className="text-blue-700 dark:text-blue-300">
                      Smart search active - AI will search the web automatically
                    </span>
                  </div>
                )}

                {/* Help Popup */}
                {showSearchHelp && (
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-xs space-y-2">
                    <div className="flex items-start gap-2">
                      <Info size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                          🔍 Intelligent Web Search
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-2">
                          The AI automatically searches the internet to give you accurate, up-to-date information for your writing.
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5 pl-6">
                      <div className="flex items-start gap-2">
                        <Newspaper size={12} className="text-purple-600 mt-0.5" />
                        <div>
                          <span className="font-medium text-purple-900 dark:text-purple-200">News Search:</span>
                          <span className="text-gray-600 dark:text-gray-400 ml-1">
                            Say "recent" or "latest" to get current articles
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <Image size={12} className="text-green-600 mt-0.5" />
                        <div>
                          <span className="font-medium text-green-900 dark:text-green-200">Visual Search:</span>
                          <span className="text-gray-600 dark:text-gray-400 ml-1">
                            Ask for "photos" or "images" to get visual references
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <Globe size={12} className="text-blue-600 mt-0.5" />
                        <div>
                          <span className="font-medium text-blue-900 dark:text-blue-200">Deep Research:</span>
                          <span className="text-gray-600 dark:text-gray-400 ml-1">
                            Use "detailed" or "research" for comprehensive info
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                      <p className="text-gray-600 dark:text-gray-400 italic">
                        💡 Tip: The AI automatically chooses the best search type based on your question!
                      </p>
                    </div>
                  </div>
                )}

                {/* Examples Popup */}
                {showExamples && (
                  <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800 text-xs space-y-2.5">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen size={14} className="text-purple-600" />
                      <p className="font-semibold text-purple-900 dark:text-purple-100">
                        ✨ Example Queries for Novel Writing
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="bg-white dark:bg-gray-800 p-2 rounded border border-purple-100 dark:border-purple-900">
                        <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                          📚 Historical Research
                        </p>
                        <div className="space-y-1 text-gray-600 dark:text-gray-400">
                          <p>• "What was daily life like in Victorian London?"</p>
                          <p>• "Show me photos of 1920s Paris cafés"</p>
                          <p>• "Detailed research on Medieval sword fighting"</p>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-gray-800 p-2 rounded border border-purple-100 dark:border-purple-900">
                        <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                          👤 Character Development
                        </p>
                        <div className="space-y-1 text-gray-600 dark:text-gray-400">
                          <p>• "Photos of women in their 30s with dark hair"</p>
                          <p>• "What does a forensic pathologist do daily?"</p>
                          <p>• "Latest trends in artificial intelligence" (for tech characters)</p>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-gray-800 p-2 rounded border border-purple-100 dark:border-purple-900">
                        <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                          🎬 Scene Accuracy
                        </p>
                        <div className="space-y-1 text-gray-600 dark:text-gray-400">
                          <p>• "How do police investigate cybercrime?"</p>
                          <p>• "Describe a modern hospital operating room"</p>
                          <p>• "Recent news about FBI investigations" (for thrillers)</p>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-gray-800 p-2 rounded border border-purple-100 dark:border-purple-900">
                        <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                          🌍 World Building
                        </p>
                        <div className="space-y-1 text-gray-600 dark:text-gray-400">
                          <p>• "Show me images of Japanese temples"</p>
                          <p>• "What are the streets of Mumbai like?"</p>
                          <p>• "Current space exploration technology" (for sci-fi)</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-purple-200 dark:border-purple-800 flex items-start gap-2">
                      <Clock size={12} className="text-purple-600 mt-0.5" />
                      <p className="text-gray-600 dark:text-gray-400 italic">
                        Search takes 2-5 seconds but gives you accurate, sourced information!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !streamingContent && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <MessageCircle size={48} className="mx-auto mb-2 opacity-50" />
                <p className="mb-4">Start a conversation with your AI writing assistant</p>
                {webSearchEnabled && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                    <Search size={16} className="text-blue-600" />
                    <span className="text-blue-700 dark:text-blue-300">Web search is active</span>
                  </div>
                )}
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] md:max-w-[70%] lg:max-w-[60%] rounded-lg px-3 py-2 md:px-4 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  {/* Agent Badge */}
                  {message.role === 'assistant' && message.agent_name && (
                    <div className="flex items-center gap-1 mb-2 text-xs px-2 py-1 rounded bg-violet-100 dark:bg-violet-900/30 w-fit">
                      <Bot size={12} className="text-violet-700 dark:text-violet-300" />
                      <span className="text-violet-700 dark:text-violet-300 font-medium">
                        {message.agent_name}
                      </span>
                    </div>
                  )}
                  {/* Search Type Badge */}
                  {message.role === 'assistant' && message.search_type && (
                    <div className="flex items-center gap-1 mb-2 text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 w-fit">
                      {message.search_type === 'news' && <Newspaper size={12} className="text-blue-700" />}
                      {message.search_type === 'images' && <Image size={12} className="text-blue-700" />}
                      {message.search_type === 'research' && <BookOpen size={12} className="text-blue-700" />}
                      {message.search_type === 'standard' && <Globe size={12} className="text-blue-700" />}
                      <span className="text-blue-700 dark:text-blue-300 font-medium">
                        Searched: {message.search_type.charAt(0).toUpperCase() + message.search_type.slice(1)}
                      </span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                </div>
              </div>
            ))}

            {/* Searching Indicator */}
            {isSearching && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
                    <Search size={16} className="animate-pulse" />
                    <span className="text-sm font-medium">Searching the web...</span>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Finding accurate, up-to-date information for your query
                  </p>
                </div>
              </div>
            )}

            {/* Search Results Display */}
            {searchResults.length > 0 && (
              <div className="flex justify-start">
                <div className="max-w-[85%] space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-2">
                    <Globe size={14} className="text-green-600" />
                    <span className="font-medium">Found {searchResults.length} sources</span>
                  </div>
                  
                  {searchAnswer && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-2">
                      <div className="flex items-start gap-2">
                        <Zap size={14} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-green-900 dark:text-green-100 mb-1">Quick Answer:</p>
                          <p className="text-xs text-gray-700 dark:text-gray-300">{searchAnswer}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Image Results */}
                  {searchImages.length > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 mb-2">
                        <Image size={12} className="text-purple-600" />
                        <span className="font-medium">Images ({searchImages.length})</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {searchImages.slice(0, 4).map((img, idx) => (
                          <div key={idx} className="relative rounded overflow-hidden border border-gray-200 dark:border-gray-700">
                            <img
                              src={img.url}
                              alt={img.description || 'Search result image'}
                              className="w-full h-24 object-cover hover:scale-105 transition-transform cursor-pointer"
                              onClick={() => window.open(img.url, '_blank')}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23ccc"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23666" font-size="12"%3EImage unavailable%3C/text%3E%3C/svg%3E';
                              }}
                            />
                            {img.description && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5 truncate">
                                {img.description}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <details className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <summary className="px-3 py-2 cursor-pointer text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                      📚 View sources ({searchResults.length})
                    </summary>
                    <div className="px-3 py-2 space-y-2 max-h-64 overflow-y-auto">
                      {searchResults.map((result, idx) => (
                        <div key={idx} className="text-xs border-l-2 border-blue-400 pl-2 py-1">
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            {result.title}
                          </a>
                          <p className="text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {result.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              </div>
            )}

            {/* Streaming Response */}
            {streamingContent && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">
                  <p className="whitespace-pre-wrap break-words">{streamingContent}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 md:p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                disabled={isStreaming}
                className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm md:text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 min-h-[60px] md:min-h-[80px] max-h-[120px]"
                rows={2}
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isStreaming}
                className="self-end px-3 py-2 md:px-4 min-h-[44px] min-w-[44px] bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isStreaming ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      )}

      {/* Bot Selector Modal */}
      {showBotSelector && agentsData?.agents && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {botMode === 'agent' ? 'Select an Agent' : 'Select Debate Agents'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {botMode === 'agent' 
                      ? 'Choose a specialist to chat with' 
                      : 'Select multiple agents to participate in the debate'}
                  </p>
                </div>
                <button
                  onClick={() => setShowBotSelector(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Agent List */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {agentsData.agents.map((agent: Agent) => (
                  <div
                    key={agent.agent_id}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      botMode === 'agent'
                        ? selectedAgentId === agent.agent_id
                          ? 'border-violet-600 bg-violet-50 dark:bg-violet-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-violet-400 dark:hover:border-violet-600'
                        : debateAgents.includes(agent.agent_id)
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600'
                    }`}
                    onClick={() => {
                      if (botMode === 'agent') {
                        setSelectedAgentId(agent.agent_id);
                      } else {
                        setDebateAgents(prev =>
                          prev.includes(agent.agent_id)
                            ? prev.filter(id => id !== agent.agent_id)
                            : [...prev, agent.agent_id]
                        );
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        botMode === 'agent' && selectedAgentId === agent.agent_id
                          ? 'bg-violet-600'
                          : botMode === 'debate' && debateAgents.includes(agent.agent_id)
                          ? 'bg-purple-600'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}>
                        <Bot size={20} className={
                          (botMode === 'agent' && selectedAgentId === agent.agent_id) ||
                          (botMode === 'debate' && debateAgents.includes(agent.agent_id))
                            ? 'text-white'
                            : 'text-gray-600 dark:text-gray-400'
                        } />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {agent.name}
                          </h4>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            {agent.short_name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {agent.personality_description}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {agent.expertise.slice(0, 3).map((exp, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                            >
                              {exp}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              {botMode === 'debate' && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Selected: {debateAgents.length} agent(s) {debateAgents.length < 2 && '(minimum 2 required)'}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBotSelector(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (botMode === 'agent' && !selectedAgentId) return;
                    if (botMode === 'debate' && debateAgents.length < 2) return;
                    setShowBotSelector(false);
                  }}
                  disabled={
                    (botMode === 'agent' && !selectedAgentId) ||
                    (botMode === 'debate' && debateAgents.length < 2)
                  }
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    botMode === 'agent'
                      ? 'bg-violet-600 hover:bg-violet-700 text-white'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {botMode === 'agent' ? 'Chat with Agent' : 'Start Debate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
