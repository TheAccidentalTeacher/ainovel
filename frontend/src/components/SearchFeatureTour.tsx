import React from 'react';
import { Search, Newspaper, Image, Globe, Zap, BookOpen, Clock, Info } from 'lucide-react';

interface SearchFeatureTourProps {
  onClose: () => void;
}

export const SearchFeatureTour: React.FC<SearchFeatureTourProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center gap-3 mb-2">
            <Search size={32} />
            <h2 className="text-2xl font-bold">Welcome to Intelligent Web Search! 🎉</h2>
          </div>
          <p className="text-blue-100">
            Your AI assistant can now search the internet to give you accurate, sourced information for your writing.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* How it works */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Zap size={20} className="text-yellow-500" />
              How It Works
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              The AI automatically detects what type of search you need based on your question. No special commands required—just ask naturally!
            </p>
          </div>

          {/* Search Types */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Newspaper size={20} className="text-blue-600" />
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">News Search</h4>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                Get recent articles with publish dates
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                Triggered by: "recent", "latest", "news", "current"
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <Image size={20} className="text-green-600" />
                <h4 className="font-semibold text-green-900 dark:text-green-100">Image Search</h4>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                Find photos with AI descriptions
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                Triggered by: "photos", "images", "show me", "look like"
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <Globe size={20} className="text-purple-600" />
                <h4 className="font-semibold text-purple-900 dark:text-purple-100">Deep Research</h4>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                Get comprehensive, detailed information
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                Triggered by: "research", "detailed", "explain", "how does"
              </p>
            </div>
          </div>

          {/* Example Queries */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <BookOpen size={20} className="text-purple-600" />
              Try These Example Queries
            </h3>
            <div className="space-y-3">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  📚 For Historical Novels:
                </p>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
                  <li>"What was daily life like in Victorian London?"</li>
                  <li>"Show me photos of 1920s Paris cafés"</li>
                  <li>"Detailed research on Medieval sword fighting techniques"</li>
                </ul>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  🕵️ For Thrillers & Mysteries:
                </p>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
                  <li>"How do police investigate cybercrime?"</li>
                  <li>"Recent news about FBI investigations"</li>
                  <li>"What does a forensic pathologist do?"</li>
                </ul>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  👤 For Character Development:
                </p>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
                  <li>"Photos of women in their 30s with Mediterranean features"</li>
                  <li>"Latest trends in artificial intelligence" (for tech characters)</li>
                  <li>"What is it like to be a surgeon?" (for medical characters)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Important Info */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-2">
              <Info size={18} className="text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                  What to Expect:
                </p>
                <ul className="text-yellow-800 dark:text-yellow-200 space-y-1">
                  <li className="flex items-center gap-2">
                    <Clock size={14} />
                    <span>Searches take 2-5 seconds but provide accurate, sourced information</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Globe size={14} />
                    <span>You'll see sources and can click links to read more</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap size={14} />
                    <span>The AI gets a "Quick Answer" summary to enhance its response</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-b-xl border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              💡 Tip: Click the <BookOpen size={14} className="inline" /> icon anytime to see more examples
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Got it, let's try!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
