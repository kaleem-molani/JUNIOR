'use client';

import { SessionProvider } from 'next-auth/react';
import { NotificationProvider } from '../lib/notifications';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </SessionProvider>
  );
}