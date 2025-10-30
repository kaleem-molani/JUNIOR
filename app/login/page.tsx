'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useNotifications } from '../../lib/notifications';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addNotification } = useNotifications();

  useEffect(() => {
    const msg = searchParams.get('message');
    if (msg) {
      addNotification({
        type: 'success',
        title: 'Success',
        message: msg,
      });
    }
  }, [searchParams, addNotification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      addNotification({
        type: 'error',
        title: 'Login Failed',
        message: 'Invalid email or password. Please try again.',
      });
    } else {
      addNotification({
        type: 'success',
        title: 'Login Successful',
        message: 'Welcome back! Redirecting to dashboard...',
      });
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8 pb-20 md:pb-0">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
            Sign in to Trading App
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
                className="appearance-none rounded-none relative block w-full px-3 py-3 sm:py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 text-base sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 sm:py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              disabled={!email || !password}
            >
              Sign in
            </button>
          </div>

          <div className="text-center">
            <Link href="/register" className="text-indigo-600 hover:text-indigo-500 text-sm sm:text-base font-medium">
              Don&apos;t have an account? Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}