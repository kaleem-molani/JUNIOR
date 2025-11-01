'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useNotifications } from '@/lib/notifications';

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { addNotification } = useNotifications();
  const [isExecutionEnabled, setIsExecutionEnabled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

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
    const action = isExecutionEnabled ? 'disable' : 'enable';
    const confirmed = window.confirm(
      `Are you sure you want to ${action} order execution?\n\nThis will ${action} automatic order placement for all your trading signals.`
    );

    if (!confirmed) return;

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

  const handleLogout = () => {
    const confirmed = window.confirm(
      'Are you sure you want to logout?\n\nYou will be redirected to the home page.'
    );
    if (confirmed) {
      signOut({ callbackUrl: '/' });
    }
  };

  const getPageTitle = () => {
    switch (pathname) {
      case '/': return 'Dashboard';
      case '/user': return 'My Accounts';
      case '/admin': return 'Admin Panel';
      case '/login': return 'Login';
      case '/register': return 'Register';
      default: return 'JUNIOR';
    }
  };

  const isAdmin = session?.user.role === 'admin' || session?.user.role === 'super_admin';

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <div className="bg-blue-600 text-white p-2 rounded-lg group-hover:bg-blue-700 transition-colors">
                <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-2 sm:ml-3">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">JUNIOR</h1>
                <p className="text-xs text-gray-500 hidden sm:block">{getPageTitle()}</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {session ? (
              <>
                {/* Execution Status Indicator - Only for non-super-admin users */}
                {session.user.role !== 'super_admin' && (
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${isExecutionEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm font-medium text-gray-700">
                      {isExecutionEnabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex items-center space-x-2">
                  {/* My Accounts - Only for non-super-admin users */}
                  {session.user.role !== 'super_admin' && (
                    <Link
                      href="/user"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                        pathname === '/user'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      My Accounts
                    </Link>
                  )}

                  {isAdmin && (
                    <div className="relative">
                      <button
                        onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center ${
                          pathname.startsWith('/admin')
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        Admin
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {isAdminMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                          <Link
                            href="/admin"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsAdminMenuOpen(false)}
                          >
                            Dashboard
                          </Link>
                          <Link
                            href="/admin/accounts"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsAdminMenuOpen(false)}
                          >
                            Accounts
                          </Link>
                          <Link
                            href="/admin/signals"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsAdminMenuOpen(false)}
                          >
                            Signals
                          </Link>
                          <Link
                            href="/monitoring"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsAdminMenuOpen(false)}
                          >
                            Monitoring
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md transition-colors duration-200"
                  >
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {session.user.email?.charAt(0).toUpperCase()}
                    </div>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                      <div className="px-4 py-2 text-sm text-gray-500 border-b">
                        {session.user.email}
                      </div>
                      <button
                        onClick={toggleExecution}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {isExecutionEnabled ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          )}
                        </svg>
                        {isExecutionEnabled ? 'Disable' : 'Enable'} Execution
                      </button>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-blue-600 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Toggle mobile menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-3">
              {session ? (
                <>
                  {/* Mobile User Info */}
                  <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 rounded-md">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {session.user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{session.user.email?.split('@')[0] || 'User'}</p>
                      <p className="text-xs text-gray-500">{session.user.email}</p>
                    </div>
                  </div>

                  {/* Mobile Execution Status - Only for non-super-admin users */}
                  {session.user.role !== 'super_admin' && (
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md">
                      <span className="text-sm font-medium text-gray-700">Execution Status</span>
                      <button
                        onClick={() => {
                          toggleExecution();
                          setIsMobileMenuOpen(false);
                        }}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          isExecutionEnabled
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full mr-2 ${isExecutionEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        {isExecutionEnabled ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  )}

                  {/* Mobile Navigation Links */}
                  {/* My Accounts - Only for non-super-admin users */}
                  {session.user.role !== 'super_admin' && (
                    <Link
                      href="/user"
                      className={`block px-3 py-3 rounded-md text-sm font-medium transition-colors duration-200 ${
                        pathname === '/user' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      📊 My Accounts
                    </Link>
                  )}

                  {isAdmin && (
                    <>
                      <Link
                        href="/admin"
                        className={`block px-3 py-3 rounded-md text-sm font-medium transition-colors duration-200 ${
                          pathname === '/admin' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        ⚙️ Admin Dashboard
                      </Link>
                      <Link
                        href="/admin/accounts"
                        className="block px-3 py-3 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        👥 Manage Accounts
                      </Link>
                      <Link
                        href="/admin/signals"
                        className="block px-3 py-3 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        📡 Signal History
                      </Link>
                    </>
                  )}

                  <div className="border-t border-gray-200 pt-3">
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full bg-red-600 text-white px-4 py-3 rounded-md text-sm font-medium hover:bg-red-700 transition-colors duration-200"
                    >
                      🚪 Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block text-gray-700 hover:text-blue-600 px-3 py-3 rounded-md text-sm font-medium transition-colors duration-200 text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    🔐 Login
                  </Link>
                  <Link
                    href="/register"
                    className="block bg-blue-600 text-white px-4 py-3 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200 text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    🚀 Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}