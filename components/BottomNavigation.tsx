'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useNotifications } from '@/lib/notifications';

export default function BottomNavigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { addNotification } = useNotifications();
  const [isExecutionEnabled, setIsExecutionEnabled] = useState(false);

  const isActive = (path: string) => pathname === path;

  // Fetch execution status on component mount and when session changes
  useEffect(() => {
    if (session) {
      fetchExecutionStatus();
    }
  }, [session]);

  const fetchExecutionStatus = async () => {
    try {
      const response = await fetch('/api/accounts/profile');
      if (response.ok) {
        const data = await response.json();
        setIsExecutionEnabled(data.isExecutionEnabled);
      }
    } catch (error) {
      console.error('Failed to fetch execution status:', error);
    }
  };

  const toggleExecution = async () => {
    try {
      const response = await fetch('/api/accounts/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isExecutionEnabled: !isExecutionEnabled }),
      });

      if (response.ok) {
        setIsExecutionEnabled(!isExecutionEnabled);
        addNotification({
          type: 'success',
          title: 'Execution Status Updated',
          message: `Order execution has been ${!isExecutionEnabled ? 'enabled' : 'disabled'}.`,
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to update execution status.',
        });
      }
    } catch (error) {
      console.error('Failed to toggle execution:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update execution status.',
      });
    }
  };

  if (!session) {
    return null; // Don't show bottom nav for unauthenticated users
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex justify-around items-center py-2">
        {/* Home/Dashboard */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors duration-200 ${
            isActive('/') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
          }`}
        >
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs font-medium">Home</span>
        </Link>

        {/* My Accounts */}
        <Link
          href="/user"
          className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors duration-200 ${
            isActive('/user') ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
          }`}
        >
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span className="text-xs font-medium">Accounts</span>
        </Link>

        {/* Execution Toggle */}
        <button
          onClick={toggleExecution}
          className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors duration-200 ${
            isExecutionEnabled
              ? 'text-green-600 bg-green-50 hover:bg-green-100'
              : 'text-red-600 bg-red-50 hover:bg-red-100'
          }`}
          title={isExecutionEnabled ? 'Disable Order Execution' : 'Enable Order Execution'}
        >
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isExecutionEnabled ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
          <span className="text-xs font-medium">{isExecutionEnabled ? 'Active' : 'Inactive'}</span>
        </button>

        {/* Admin Panel */}
        <Link
          href="/admin"
          className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors duration-200 ${
            pathname.startsWith('/admin') || pathname === '/monitoring' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
          }`}
        >
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs font-medium">Admin</span>
        </Link>

        {/* Logout */}
        <button
          onClick={() => {
            const confirmed = window.confirm(
              'Are you sure you want to logout?\n\nYou will be redirected to the home page.'
            );
            if (confirmed) {
              signOut({ callbackUrl: '/' });
            }
          }}
          className="flex flex-col items-center justify-center py-2 px-3 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
        >
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="text-xs font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
}