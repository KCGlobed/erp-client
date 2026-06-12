import { useState, useRef, useEffect } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { 
  Bell, Search, Menu,
  LayoutDashboard, GraduationCap, BookOpen, 
  ClipboardList, CalendarDays, Wallet, Settings, 
  Users, Shield, FileText, UserCircle 
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { Sidebar } from './Sidebar';

const SEARCHABLE_ROUTES = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard, description: "Overview and metrics", keywords: ["home", "stats", "overview"] },
  { title: "Students", path: "/students", icon: GraduationCap, description: "Manage students and records", keywords: ["pupil", "learner", "class", "admission"], reqRoles: ['SUPER_ADMIN', 'ADMIN', 'FACULTY'] },
  { title: "Courses", path: "/courses", icon: BookOpen, description: "Manage academic courses", keywords: ["subject", "classes", "syllabus"] },
  { title: "Cohorts", path: "/cohorts", icon: GraduationCap, description: "Student cohorts and batches", keywords: ["group", "batch", "class"], reqRoles: ['SUPER_ADMIN', 'ADMIN'] },
  { title: "Attendance", path: "/attendance", icon: ClipboardList, description: "Track daily attendance", keywords: ["roll call", "present", "absent"] },
  { title: "Exams", path: "/exams", icon: FileText, description: "Manage examination schedules and results", keywords: ["test", "quiz", "grades"] },
  { title: "Timetable", path: "/timetable", icon: CalendarDays, description: "Weekly schedule and classes", keywords: ["schedule", "calendar", "time"] },
  { title: "Fees", path: "/fees", icon: Wallet, description: "Fee structures and payments", keywords: ["money", "billing", "payment"] },
  { title: "Settings", path: "/settings", icon: Settings, description: "Application configuration", keywords: ["config", "admin", "setup"] },
  { title: "Users", path: "/users", icon: Users, description: "System users and administration", keywords: ["people", "accounts", "admin"], reqRoles: ['SUPER_ADMIN', 'ADMIN'] },
  { title: "Roles", path: "/roles", icon: Shield, description: "Access control roles", keywords: ["security", "groups", "permissions"], reqRoles: ['SUPER_ADMIN'] },
  { title: "Permissions", path: "/permissions", icon: FileText, description: "Granular access permissions", keywords: ["security", "rights", "access"], reqRoles: ['SUPER_ADMIN'] },
  { title: "System Logs", path: "/logs", icon: FileText, description: "Audit logs and system activity", keywords: ["history", "events", "audit"], reqRoles: ['SUPER_ADMIN', 'ADMIN'] },
  { title: "My Profile", path: "/profile", icon: UserCircle, description: "Faculty user profile", keywords: ["me", "account", "settings"], reqRoles: ['FACULTY', 'STUDENT'] },
];

export function DashboardLayout() {
  const { accessToken, user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  // Search routing state
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  const initials = `${user?.firstName?.[0] || 'A'}${user?.lastName?.[0] || 'D'}`.toUpperCase();

  // Filter routes by user roles
  const allowedRoutes = SEARCHABLE_ROUTES.filter(route => 
    !route.reqRoles || route.reqRoles.some(role => (user?.roles || []).includes(role))
  );

  // Get matching routes
  const filteredRoutes = searchQuery.trim() === ''
    ? []
    : allowedRoutes.filter(route => {
        const q = searchQuery.toLowerCase();
        return (
          route.title.toLowerCase().includes(q) ||
          route.path.toLowerCase().includes(q) ||
          route.description.toLowerCase().includes(q) ||
          route.keywords.some(k => k.toLowerCase().includes(q))
        );
      });

  // Reset selectedIndex when filtered list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  const handleNavigate = (path: string) => {
    navigate(path);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (filteredRoutes.length > 0 ? (prev + 1) % filteredRoutes.length : -1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (filteredRoutes.length > 0 ? (prev - 1 + filteredRoutes.length) % filteredRoutes.length : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < filteredRoutes.length) {
        handleNavigate(filteredRoutes[selectedIndex].path);
      } else if (filteredRoutes.length > 0) {
        handleNavigate(filteredRoutes[0].path);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      e.currentTarget.blur();
    }
  };

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
          <div className="relative flex-1 max-w-md" ref={searchRef}>
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
              style={{ color: 'var(--muted-foreground)' }}
            />
            <input
              type="text"
              placeholder="Search students, courses, faculty…"
              className="w-full h-9 pl-9 pr-4 rounded-md text-sm outline-none transition-colors"
              style={{
                backgroundColor: isFocused ? 'var(--background)' : 'var(--muted)',
                border: '1px solid',
                borderColor: isFocused ? 'var(--ring)' : 'transparent',
                color: 'var(--foreground)',
              }}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => {
                setIsOpen(true);
                setIsFocused(true);
              }}
              onBlur={() => {
                setIsFocused(false);
              }}
              onKeyDown={handleKeyDown}
            />

            {/* Suggestions Dropdown */}
            {isOpen && searchQuery.trim() !== '' && (
              <div 
                className="absolute top-full left-0 w-full mt-1.5 rounded-lg border shadow-xl z-50 overflow-hidden backdrop-blur-md transition-all duration-200"
                style={{
                  backgroundColor: 'var(--popover)',
                  borderColor: 'var(--border)',
                  color: 'var(--popover-foreground)',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                }}
              >
                {filteredRoutes.length > 0 ? (
                  <div className="py-1.5 max-h-72 overflow-y-auto">
                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                      Suggestions
                    </div>
                    {filteredRoutes.map((route, index) => {
                      const Icon = route.icon;
                      const isSelected = index === selectedIndex;
                      return (
                        <div
                          key={route.path}
                          onClick={() => handleNavigate(route.path)}
                          className="flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors"
                          style={{
                            backgroundColor: isSelected ? 'var(--accent)' : 'transparent',
                            color: isSelected ? 'var(--accent-foreground)' : 'var(--foreground)',
                          }}
                          onMouseEnter={() => setSelectedIndex(index)}
                        >
                          <Icon className="h-4 w-4 shrink-0" style={{ color: isSelected ? 'var(--accent-foreground)' : 'var(--muted-foreground)' }} />
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium leading-none">{route.title}</span>
                            <span 
                              className="text-[10px] mt-0.5 truncate" 
                              style={{ color: isSelected ? 'var(--accent-foreground)' : 'var(--muted-foreground)' }}
                            >
                              {route.description}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    No matching pages found
                  </div>
                )}
              </div>
            )}
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
            onClick={() => navigate('/profile')}
              className="hidden md:flex items-center gap-2 pl-3 cursor-pointer"
              style={{ borderLeft: '1px solid var(--border)' }}
            >
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold"
                style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
              >
                {initials}
              </div>
              <div
              
              className="leading-tight">
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
