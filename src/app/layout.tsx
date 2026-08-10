import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastContainer } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { createClient } from '@/lib/supabase/server';
import './globals.css';

export const metadata: Metadata = {
  title: 'Custom Widgets - Next.js',
  description: 'Embeddable custom widgets by BuiltByShah',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {user ? (
          <div className="flex min-h-screen bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]">
            <Sidebar />
            <main className="ml-16 flex-1">
              <ErrorBoundary scope="admin-shell">{children}</ErrorBoundary>
            </main>
          </div>
        ) : (
          <>{children}</>
        )}
        <ToastContainer />
        <ConfirmDialog />
      </body>
    </html>
  );
}
