import { ChatWidget } from '../components/ChatWidget';

export const ChatPage = () => {
  const userId = "alana";

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Chat Interface - Full screen version */}
      <div className="flex-1 overflow-hidden">
        <ChatWidget userId={userId} fullScreen={true} />
      </div>
    </div>
  );
};
