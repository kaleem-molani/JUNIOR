'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export default function Unauthorized() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    // Auto redirect to login if not authenticated, or home if authenticated
    const timer = setTimeout(() => {
      if (status === 'unauthenticated') {
        router.push('/login');
      } else {
        router.push('/');
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [router, status]);

  const getRedirectMessage = () => {
    if (status === 'unauthenticated') {
      return 'login page';
    }
    return 'home page';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        {/* Unauthorized Icon */}
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
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">401</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Unauthorized Access</h2>
        <p className="text-gray-600 mb-8">
          You don&apos;t have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>

        {/* Action Buttons */}
        <div className="space-y-4">
          {status === 'authenticated' ? (
            <Link
              href="/"
              className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition duration-200"
            >
              Go to Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition duration-200"
            >
              Sign In
            </Link>
          )}
          <button
            onClick={() => router.back()}
            className="inline-block w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition duration-200"
          >
            Go Back
          </button>
        </div>

        {/* Auto redirect notice */}
        <p className="text-sm text-gray-500 mt-6">
          You will be redirected to the {getRedirectMessage()} in 8 seconds...
        </p>
      </div>
    </div>
  );
}