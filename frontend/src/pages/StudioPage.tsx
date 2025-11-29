import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { BookOpen, Plus, Home } from 'lucide-react';
import HomePage from './HomePage';
import NewProjectPage from './NewProjectPage';
import PremiseBuilderWizard from './PremiseBuilderWizard';
import ProjectDetailPage from './ProjectDetailPage';
import OutlineEditorPage from './OutlineEditorPage';
import BookCoverDesigner from './BookCoverDesigner';
import StandaloneBookCoverDesigner from './StandaloneBookCoverDesigner';

/**
 * StudioPage wraps the existing Novel Generator functionality
 * Uses AppLayout with WriteMind Studios header + internal Studio sidebar
 */
export const StudioPage = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    const fullPath = `/studio${path}`;
    return location.pathname === fullPath;
  };

  return (
    <AppLayout showSidebar={false}>
      <div className="flex h-full bg-gray-900">
        {/* Studio Internal Sidebar */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex-shrink-0">
          <div className="flex flex-col h-full">
            {/* Studio Logo */}
            <div className="flex items-center h-16 px-6 border-b border-gray-700">
              <BookOpen className="h-6 w-6 text-violet-500" />
              <span className="ml-3 text-lg font-semibold text-white">Novel Studio</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              <Link
                to="/studio"
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive('/')
                    ? 'bg-violet-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Home className="h-5 w-5 mr-3" />
                <span className="font-medium">Projects</span>
              </Link>

              <Link
                to="/studio/new"
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive('/new')
                    ? 'bg-violet-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <Plus className="h-5 w-5 mr-3" />
                <span className="font-medium">New Project</span>
              </Link>
            </nav>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-700">
              <p className="text-xs text-gray-400">Novel Studio</p>
              <p className="text-xs text-gray-500 mt-1">v0.1.0</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/new" element={<NewProjectPage />} />
            <Route path="/premise-builder/new" element={<PremiseBuilderWizard />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/projects/:id/outline" element={<OutlineEditorPage />} />
            <Route path="/projects/:id/cover-designer" element={<BookCoverDesigner />} />
            <Route path="/cover-designer" element={<StandaloneBookCoverDesigner />} />
          </Routes>
        </div>
      </div>
    </AppLayout>
  );
};
