import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Bell, Search, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { Sidebar } from './Sidebar';

export function DashboardLayout() {
  const { accessToken, user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  const initials = `${user?.firstName?.[0] || 'A'}${user?.lastName?.[0] || 'D'}`.toUpperCase();

  return (
    <div className="min-h-screen flex w-full" style={{ backgroundColor: 'var(--muted)' }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header — matches ErpLayout.tsx exactly */}
        <header
          className="h-16 sticky top-0 z-20 flex items-center gap-3 px-4 md:px-6"
          style={{
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'oklch(1 0 0 / 0.8)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {/* Hamburger toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:opacity-80 cursor-pointer"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
              style={{ color: 'var(--muted-foreground)' }}
            />
            <input
              type="text"
              placeholder="Search students, courses, faculty…"
              className="w-full h-9 pl-9 pr-4 rounded-md text-sm outline-none transition-colors"
              style={{
                backgroundColor: 'var(--muted)',
                border: '1px solid transparent',
                color: 'var(--foreground)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--background)';
                e.currentTarget.style.borderColor = 'var(--ring)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--muted)';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            />
          </div>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2">
            {/* Bell */}
            <button
              className="relative flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:opacity-80 cursor-pointer"
              style={{ color: 'var(--muted-foreground)' }}
            >
              <Bell className="h-4 w-4" />
              <span
                className="absolute top-2 right-2 h-2 w-2 rounded-full"
                style={{ backgroundColor: 'var(--primary)' }}
              />
            </button>

            {/* User profile */}
            <div
              className="hidden md:flex items-center gap-2 pl-3"
              style={{ borderLeft: '1px solid var(--border)' }}
            >
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold"
                style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
              >
                {initials}
              </div>
              <div className="leading-tight">
                <div className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                  {user?.roles?.[0] || 'User'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
