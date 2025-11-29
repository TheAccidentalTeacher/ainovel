import { useQuery } from '@tanstack/react-query';
import { ChatInterface } from '../components/ChatInterface';
import { LinkedProjectCard } from '../components/LinkedProjectCard';
import { useLinkedProject } from '../hooks/useLinkedProject';
import apiClient from '../lib/api-client';
import type { Project } from '../types';

export const ChatPage = () => {
  const userId = "alana";
  const { linkedProjectId, unlinkProject } = useLinkedProject();

  // Fetch linked project details if one is linked
  const { data: linkedProject } = useQuery<Project>({
    queryKey: ['project', linkedProjectId],
    queryFn: () => apiClient.getProject(linkedProjectId!),
    enabled: !!linkedProjectId,
  });

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Linked Project Card - Shows at top when project is linked */}
      {linkedProject && (
        <div className="flex-shrink-0 p-4 border-b border-gray-200">
          <LinkedProjectCard 
            project={linkedProject} 
            onUnlink={unlinkProject} 
          />
        </div>
      )}

      {/* Chat Interface - Takes remaining space */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface userId={userId} projectId={linkedProjectId || undefined} />
      </div>
    </div>
  );
};
