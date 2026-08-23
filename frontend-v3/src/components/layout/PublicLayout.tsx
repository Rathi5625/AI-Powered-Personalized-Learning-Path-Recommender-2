import { Outlet } from 'react-router-dom';
import { Header } from './Header';

/** Layout for public pages (landing + auth). Persistent header, no mentor surface. */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-void">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
