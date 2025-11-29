import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, BookOpen, Image, Bot, Settings } from 'lucide-react';
import { useState } from 'react';

export const NavigationHeader = () => {
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinkClass = (path: string) => {
    const active = isActive(path);
    return `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
      active
        ? 'bg-violet-100 text-violet-700'
        : 'text-gray-700 hover:bg-gray-100'
    }`;
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-50">
      {/* Logo + Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg flex items-center justify-center">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-semibold text-gray-900 leading-tight">
            WriteMind <span className="text-violet-600">Studios</span>
          </span>
          <span className="text-xs text-gray-500 leading-tight">Extend Your Creative Mind</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex items-center gap-2">
        <Link to="/" className={navLinkClass('/')}>
          <MessageCircle className="w-4 h-4" />
          <span>Chat</span>
        </Link>
        <Link to="/studio" className={navLinkClass('/studio')}>
          <BookOpen className="w-4 h-4" />
          <span>Novel Studio</span>
        </Link>
        <Link to="/covers" className={navLinkClass('/covers')}>
          <Image className="w-4 h-4" />
          <span>Covers</span>
        </Link>
        <Link to="/bots" className={navLinkClass('/bots')}>
          <Bot className="w-4 h-4" />
          <span>Bots</span>
        </Link>
      </nav>

      {/* Right Side: Settings + User */}
      <div className="flex items-center gap-3">
        <button
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">A</span>
            </div>
            <span className="font-medium text-sm">Alana</span>
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
                Profile
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
                Settings
              </button>
              <hr className="my-2 border-gray-200" />
              <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
