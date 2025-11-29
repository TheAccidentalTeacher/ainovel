import { type ReactNode } from 'react';
import { NavigationHeader } from '../components/navigation/NavigationHeader';

interface AppLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export const AppLayout = ({ children, showSidebar = false }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header - Always visible */}
      <NavigationHeader />

      {/* Main Content Area - Below header (64px offset) */}
      <div className="pt-16 h-screen flex">
        {/* Sidebar - Optional, for chat contexts/projects */}
        {showSidebar && (
          <aside className="w-[280px] bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
            {/* Sidebar content will go here in next step */}
            <div className="p-4">
              <div className="text-sm font-semibold text-gray-500 mb-2">CONTEXTS</div>
              <div className="space-y-1">
                <div className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer text-sm">
                  📖 Romance Projects
                </div>
                <div className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer text-sm">
                  🚀 Sci-Fi Projects
                </div>
              </div>

              <div className="text-sm font-semibold text-gray-500 mb-2 mt-6">PROJECTS</div>
              <div className="space-y-1">
                <div className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer text-sm">
                  Leviathan Rising
                </div>
              </div>

              <div className="text-sm font-semibold text-gray-500 mb-2 mt-6">CONVERSATIONS</div>
              <div className="space-y-1">
                <div className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer text-sm text-gray-600">
                  Today
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
    </div>
  );
};
