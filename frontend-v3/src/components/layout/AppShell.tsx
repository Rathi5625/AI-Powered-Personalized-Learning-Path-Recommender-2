import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { MentorPanel, MentorLauncher } from '@/components/mentor';

/** Layout for authenticated pages with a persistent reference-style shell. */
export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-void text-text">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <MentorLauncher />
      <MentorPanel />
    </div>
  );
}
