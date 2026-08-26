import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Menu, MessageSquareText, User, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/store/useAuthStore';
import { useMentorStore } from '@/store/useMentorStore';
import { Button, buttonVariants } from '@/components/common';
import { Logo } from './Logo';

const NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/courses', label: 'Catalog' },
  { to: '/assessments', label: 'Assessments' },
  { to: '/mentor', label: 'Mentor' },
];

function initials(name?: string) {
  if (!name) return '·';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'relative flex h-16 items-center text-sm transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-center after:transition-transform',
    isActive
      ? 'font-semibold text-text after:scale-x-100 after:bg-ion'
      : 'text-muted hover:text-text after:scale-x-0 after:bg-ion hover:after:scale-x-100',
  );
}

export function Header() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const openMentor = useMentorStore((s) => s.openMentor);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    setMenuOpen(false);
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-surface/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-6">
        <div className="flex h-full items-center gap-8">
          <Logo />
          {isAuthenticated && (
            <nav className="hidden h-full items-center gap-6 md:flex" aria-label="Primary">
              {NAV.map((item) => (
                <NavLink key={item.to} to={item.to} className={navLinkClass}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {isAuthenticated ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                className="hidden sm:inline-flex"
                onClick={() => openMentor({ contextType: 'GENERAL' })}
              >
                <MessageSquareText className="h-4 w-4 text-ion" aria-hidden />
                Ask Mentor
              </Button>

              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-line bg-surface-alt py-1 pl-1 pr-2 transition-colors hover:border-ion/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ion/40"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ion font-mono text-xs font-bold text-white">
                    {initials(user?.fullName)}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted" aria-hidden />
                </button>

                {menuOpen && (
                  <>
                    <button
                      className="fixed inset-0 z-10 cursor-default"
                      aria-hidden
                      tabIndex={-1}
                      onClick={() => setMenuOpen(false)}
                    />
                    <div
                      role="menu"
                      className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-card border border-line bg-surface shadow-panel"
                    >
                      <div className="border-b border-line px-4 py-3">
                        <p className="truncate text-sm font-semibold text-text">{user?.fullName}</p>
                        <p className="truncate text-xs text-muted">{user?.email}</p>
                      </div>
                      <Link
                        to="/dashboard"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-muted transition-colors hover:bg-surface-alt hover:text-text"
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/profile"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted transition-colors hover:bg-surface-alt hover:text-text"
                      >
                        <User className="h-4 w-4" aria-hidden />
                        Profile
                      </Link>
                      <button
                        role="menuitem"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 border-t border-line px-4 py-2.5 text-left text-sm text-muted transition-colors hover:bg-danger/5 hover:text-danger"
                      >
                        <LogOut className="h-4 w-4" aria-hidden />
                        Log out
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                className="rounded-full p-2 text-muted transition-colors hover:bg-surface-alt hover:text-text md:hidden"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Toggle navigation"
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={buttonVariants('ghost', 'sm')}>
                Log in
              </Link>
              <Link to="/register" className={buttonVariants('primary', 'sm')}>
                Sign up <span aria-hidden>→</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {isAuthenticated && mobileOpen && (
        <nav className="border-t border-line bg-surface px-5 py-3 md:hidden" aria-label="Mobile">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'block rounded-control px-3 py-2.5 text-sm transition-colors',
                  isActive ? 'bg-accent-tint font-semibold text-ion-deep' : 'text-muted hover:bg-surface-alt hover:text-text',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
