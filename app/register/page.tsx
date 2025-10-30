'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useNotifications } from '../../lib/notifications';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { addNotification } = useNotifications();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      addNotification({
        type: 'error',
        title: 'Password Mismatch',
        message: 'Passwords do not match. Please try again.',
      });
      return;
    }

    if (password.length < 6) {
      addNotification({
        type: 'warning',
        title: 'Password Too Short',
        message: 'Password must be at least 6 characters long.',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Registration Successful',
          message: 'Your account has been created. Please login to continue.',
        });
        router.push('/login');
      } else {
        const data = await response.json();
        addNotification({
          type: 'error',
          title: 'Registration Failed',
          message: data.error || 'Failed to create account. Please try again.',
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Network Error',
        message: 'Unable to connect to server. Please check your connection.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8 pb-20 md:pb-0">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 sm:py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 text-base sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 sm:py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 text-base sm:text-sm"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 sm:py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 text-base sm:text-sm"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !email || !password || !confirmPassword}
              className="group relative w-full flex justify-center py-3 sm:py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </div>

          <div className="text-center">
            <Link href="/login" className="text-indigo-600 hover:text-indigo-500 text-sm sm:text-base font-medium">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}