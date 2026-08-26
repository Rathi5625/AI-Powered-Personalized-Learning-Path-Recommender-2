import { Outlet } from 'react-router-dom';
import { Header } from './Header';

/** Layout for public pages (landing + auth). */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-void text-text">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
