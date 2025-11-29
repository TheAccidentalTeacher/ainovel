/**
 * FeatureTooltip Component
 * Reusable tooltip component with rich help content for sidebar features
 */

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface TooltipContent {
  title: string;
  subtitle: string;
  examples?: Array<{ icon: string; text: string }>;
  useCases?: Array<{ title: string; description: string }>;
  tips?: string[];
  crudNote?: boolean;
}

interface FeatureTooltipProps {
  content: TooltipContent;
}

/**
 * Rich tooltip modal with examples, use cases, and tips
 */
export const FeatureTooltip: React.FC<FeatureTooltipProps> = ({ content }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-violet-600 to-purple-600 text-white p-4 rounded-t-xl">
          <h3 className="text-lg font-bold">{content.title}</h3>
          <p className="text-sm text-violet-100 mt-1">{content.subtitle}</p>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Examples */}
          {content.examples && content.examples.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                ✨ Quick Examples:
              </h4>
              <div className="space-y-2">
                {content.examples.map((example, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg p-2"
                  >
                    <span className="text-lg">{example.icon}</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{example.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Use Cases */}
          {content.useCases && content.useCases.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                💡 Real-Life Use Cases:
              </h4>
              <div className="space-y-2">
                {content.useCases.map((useCase, idx) => (
                  <div key={idx} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                      {useCase.title}
                    </p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      {useCase.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pro Tips */}
          {content.tips && content.tips.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                🎯 Pro Tips:
              </h4>
              <ul className="space-y-1">
                {content.tips.map((tip, idx) => (
                  <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                    <span className="text-violet-600 dark:text-violet-400">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CRUD Note */}
          {content.crudNote && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-900 dark:text-amber-100">
                <span className="font-semibold">📝 What is CRUD?</span>
                <br />
                <span className="text-gray-700 dark:text-gray-300">
                  <strong>C</strong>reate, <strong>R</strong>ead, <strong>U</strong>pdate, <strong>D</strong>elete
                  {' - '}Basic actions you can perform. You can make new items, view them, edit them, or remove them!
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-xl">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            💡 Hover over any item for quick actions • Click to select • Right-click for more options
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Inline help icon button that shows tooltip on click
 */
interface HelpIconProps {
  content: TooltipContent;
  size?: number;
}

export const HelpIcon: React.FC<HelpIconProps> = ({ content, size = 14 }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowTooltip(true);
        }}
        className="text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
        title="Learn more"
      >
        <svg
          className={`w-${size / 4} h-${size / 4}`}
          style={{ width: `${size}px`, height: `${size}px` }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      {showTooltip && (
        <div onClick={() => setShowTooltip(false)}>
          <FeatureTooltip content={content} />
        </div>
      )}
    </>
  );
};
