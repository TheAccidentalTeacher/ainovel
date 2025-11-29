export const CoversPage = () => {
  return (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="text-center p-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-violet-100 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-violet-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Cover Generator</h2>
        <p className="text-gray-600 mb-4">
          AI-powered book cover design coming soon
        </p>
        <div className="text-sm text-gray-500">
          Phase 2 Feature
        </div>
      </div>
    </div>
  );
};
