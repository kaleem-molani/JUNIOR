'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        {/* Error Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Oops!</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Something went wrong</h2>
        <p className="text-gray-600 mb-8">
          We encountered an unexpected error. Our team has been notified and is working to fix this issue.
        </p>

        {/* Error Details (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-sm font-medium text-red-800 mb-2">Error Details:</h3>
            <p className="text-xs text-red-700 font-mono break-all">
              {error.message}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={reset}
            className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition duration-200"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="inline-block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition duration-200"
          >
            Go Home
          </Link>
        </div>

        {/* Support Info */}
        <p className="text-sm text-gray-500 mt-6">
          If this problem persists, please contact our support team.
        </p>
      </div>
    </div>
  );
}