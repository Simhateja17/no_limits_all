'use client';

import { Navbar } from './Navbar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ background: '#F9FAFB' }}
    >
      <Navbar />
      <main className="flex-1 w-full">
        {children}
      </main>
    </div>
  );
}
