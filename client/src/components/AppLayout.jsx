import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, PawPrint, CalendarDays, Search, Users, Store,
  Settings, LogOut, Menu, X, ClipboardList, Star, ShieldCheck, BellRing,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import NotificationBell from './NotificationBell';
import { Avatar } from './ui';

const NAV = {
  owner: [
    { to: '/owner', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/owner/pets', label: 'My pets', icon: PawPrint },
    { to: '/owner/reminders', label: 'Reminders', icon: BellRing },
    { to: '/owner/services', label: 'Find services', icon: Search },
    { to: '/owner/bookings', label: 'My bookings', icon: CalendarDays },
    { to: '/settings', label: 'Account', icon: Settings },
  ],
  provider: [
    { to: '/provider', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/provider/profile', label: 'Business profile', icon: Store },
    { to: '/provider/services', label: 'Services', icon: ClipboardList },
    { to: '/provider/bookings', label: 'Bookings', icon: CalendarDays },
    { to: '/provider/reviews', label: 'Reviews', icon: Star },
    { to: '/settings', label: 'Account', icon: Settings },
  ],
  admin: [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/providers', label: 'Provider approvals', icon: ShieldCheck },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/services', label: 'Services', icon: ClipboardList },
    { to: '/admin/bookings', label: 'Bookings', icon: CalendarDays },
    { to: '/settings', label: 'Account', icon: Settings },
  ],
};

const ROLE_LABEL = { owner: 'Pet owner', provider: 'Service provider', admin: 'Administrator' };

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const links = NAV[user?.role] || [];

  const signOut = () => {
    logout();
    navigate('/login');
  };

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 p-4">
      <div className="mb-4 px-1">
        <Link to="/" onClick={() => setOpen(false)}>
          <Logo />
        </Link>
      </div>
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={() => setOpen(false)}
          className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" />
          {label}
        </NavLink>
      ))}
      <div className="mt-auto border-t border-line pt-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar name={user?.name} src={user?.avatar} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-semibold">{user?.name}</p>
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-muted">{ROLE_LABEL[user?.role]}</p>
          </div>
        </div>
        <button type="button" onClick={signOut} className="nav-link w-full">
          <LogOut className="h-[18px] w-[18px]" />
          Sign out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-line bg-surface lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-72 max-w-[85vw] animate-fade-up bg-surface shadow-lift">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-canvas/85 px-4 py-3 backdrop-blur sm:px-6">
          <button
            type="button"
            className="rounded-xl border border-line bg-surface p-2.5 text-muted lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Open menu"
          >
            {open ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
          </button>
          <div className="hidden lg:block">
            <p className="text-[13.5px] text-muted">
              Welcome back, <span className="font-semibold text-ink">{user?.name?.split(' ')[0]}</span>
            </p>
          </div>
          <div className="lg:hidden">
            <Logo compact />
          </div>
          <NotificationBell />
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>

        <footer className="border-t border-line px-4 py-5 text-center text-[12.5px] text-muted sm:px-6">
          Milo &amp; Tails · Pet care and service management
        </footer>
      </div>
    </div>
  );
}
