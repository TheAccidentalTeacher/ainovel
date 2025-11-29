/**
 * ChatInterface Component - Full-Screen Chat for Home Page
 * 
 * Simplified wrapper around ChatWidget that removes floating styles
 * and renders full-screen for the new WriteMind Studios chat page.
 */

import { ChatWidget } from './ChatWidget';

interface ChatInterfaceProps {
  userId: string;
  projectId?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ userId, projectId }) => {
  return (
    <div className="h-full w-full">
      <ChatWidget userId={userId} projectId={projectId} fullScreen={true} />
    </div>
  );
};
