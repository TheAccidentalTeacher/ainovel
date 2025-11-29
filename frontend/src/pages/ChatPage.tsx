import { ChatInterface } from '../components/ChatInterface';

export const ChatPage = () => {
  const userId = "alana";

  return (
    <div className="h-full bg-white">
      <ChatInterface userId={userId} />
    </div>
  );
};
