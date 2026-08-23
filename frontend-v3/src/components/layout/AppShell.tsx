import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { MentorPanel, MentorLauncher } from '@/components/mentor';

/**
 * Layout for authenticated pages. Persistent header + the AI Mentor surface
 * (slide-out panel and its always-present launcher) on every protected page.
 */
export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-void">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <MentorLauncher />
      <MentorPanel />
    </div>
  );
}
