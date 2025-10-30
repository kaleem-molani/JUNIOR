'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Header from '../components/Header';

interface DashboardStats {
  totalAccounts: number;
  activeAccounts: number;
  totalSignals: number;
  recentSignals: number;
}

interface UserProfile {
  name?: string;
  email: string;
  role: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (session) {
      fetchDashboardStats();
      fetchUserProfile();
    }
  }, [session]);

  const fetchDashboardStats = async () => {
    try {
      const accountsRes = await fetch('/api/accounts');

      if (accountsRes.ok) {
        const accounts = await accountsRes.json();
        const totalAccounts = accounts.length;
        const activeAccounts = accounts.filter((acc: { isActive: boolean }) => acc.isActive).length;

        setStats({
          totalAccounts,
          activeAccounts,
          totalSignals: 0, // TODO: Implement signals stats
          recentSignals: 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/accounts/profile');
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-20 md:pb-0">
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {session ? (
          // Authenticated User Dashboard
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back, {userProfile?.name || session.user.email}!
              </h2>
              <p className="text-gray-600">
                Role: <span className="font-medium capitalize">{session.user.role}</span>
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="bg-blue-500 rounded-full p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Trading Accounts</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalAccounts || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="bg-green-500 rounded-full p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Accounts</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.activeAccounts || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="bg-purple-500 rounded-full p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Signals Sent</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalSignals || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="bg-orange-500 rounded-full p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Recent Activity</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.recentSignals || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/user"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="bg-blue-500 rounded-full p-2 mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Manage Accounts</p>
                    <p className="text-sm text-gray-600">Add or configure trading accounts</p>
                  </div>
                </Link>

                {session.user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="bg-red-500 rounded-full p-2 mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Broadcast Signals</p>
                      <p className="text-sm text-gray-600">Send trading signals to users</p>
                    </div>
                  </Link>
                )}

                <div className="flex items-center p-4 border border-gray-200 rounded-lg">
                  <div className="bg-gray-500 rounded-full p-2 mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">View Reports</p>
                    <p className="text-sm text-gray-600">Coming soon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Landing Page for Non-Authenticated Users
          <div className="text-center">
            <div className="mb-12">
              <h1 className="text-5xl font-bold text-gray-900 mb-4">
                Automated Trading Made <span className="text-blue-600">Simple</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Connect your trading accounts, receive real-time signals, and execute trades automatically across multiple brokers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="bg-blue-500 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Signals</h3>
                <p className="text-gray-600">Receive instant trading signals from expert analysts and execute trades automatically.</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="bg-green-500 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Multi-Broker Support</h3>
                <p className="text-gray-600">Connect accounts from multiple brokers and manage all your trading in one place.</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="bg-purple-500 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure & Reliable</h3>
                <p className="text-gray-600">Bank-level security with encrypted data and secure API connections to brokers.</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Get Started Today</h2>
              <p className="text-gray-600 mb-6">Join thousands of traders automating their strategies.</p>
              <Link
                href="/register"
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 inline-block text-center"
              >
                Create Free Account
              </Link>
              <p className="text-sm text-gray-500 mt-4">
                Already have an account? <Link href="/login" className="text-blue-600 hover:text-blue-700">Sign in</Link>
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}