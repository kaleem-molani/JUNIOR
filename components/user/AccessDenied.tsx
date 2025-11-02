import Link from 'next/link';

interface AccessDeniedProps {
  reason: 'no-session' | 'super-admin' | 'admin' | 'inactive';
}

export default function AccessDenied({ reason }: AccessDeniedProps) {
  if (reason === 'no-session') {
    return <div>Access denied. Please login first.</div>;
  }

  if (reason === 'super-admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0h-2m-6-8v8a2 2 0 002 2h8a2 2 0 002-2v-8a2 2 0 00-2-2H6a2 2 0 00-2 2z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            Super administrators do not have access to trading account functionality.
            Please use the admin panel for user management.
          </p>
          <Link
            href="/admin"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Admin Panel
          </Link>
        </div>
      </div>
    );
  }

  if (reason === 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0h-2m-6-8v8a2 2 0 002 2h8a2 2 0 002-2v-8a2 2 0 00-2-2H6a2 2 0 00-2 2z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            Administrators do not have access to trading account functionality.
            Please use the admin panel for user management.
          </p>
          <Link
            href="/admin"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Admin Panel
          </Link>
        </div>
      </div>
    );
  }

  if (reason === 'inactive') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Pending Approval</h2>
          <p className="text-gray-600 mb-6">
            Your account is currently inactive and awaiting administrator approval.
            You will be able to access trading features once approved.
          </p>
          <div className="text-sm text-gray-500">
            Please contact the administrator if you have any questions.
          </div>
        </div>
      </div>
    );
  }

  return null;
}