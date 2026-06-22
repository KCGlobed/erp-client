import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  // ClipboardList,
  CalendarDays,
  // Wallet,
  // Settings,
  FileText,
  LogOut,
  Shield,
  ChevronDown,
  UserCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuthStore } from '../../store/useAuthStore';
import { cn } from '../ui/Button';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  reqRoles?: string[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export function Sidebar({ collapsed }: SidebarProps) {
  const { user, clearAuth } = useAuthStore();
  const location = useLocation();
  const Navigate = useNavigate();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Overview: true,
    People: true,
    Academics: true,
    Operations: true,
    System: true,
  });

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const toggleGroup = (groupLabel: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupLabel]: !prev[groupLabel],
    }));
  };

  const groups: NavGroup[] = [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      label: "People",
      items: [
        { title: "Students", url: "/students", icon: GraduationCap, reqRoles: ['SUPER_ADMIN', 'ADMIN', 'FACULTY'] },
      ],
    },
    {
      label: "Academics",
      items: [
        { title: "Courses", url: "/courses", icon: BookOpen },
        { title: "Cohorts", url: "/cohorts", icon: GraduationCap, reqRoles: ['SUPER_ADMIN', 'ADMIN'] },
        // { title: "Attendance", url: "/attendance", icon: ClipboardList, reqRoles: ['FACULTY'] },
        { title: "Exams", url: "/exams", icon: FileText, reqRoles: ['SUPER_ADMIN', 'ADMIN', 'FACULTY'] },
        { title: "Timetable", url: "/timetable", icon: CalendarDays },
        { title: "Events", url: "/events", icon: CalendarDays, reqRoles: ['SUPER_ADMIN']}
      ],
    },
    // {
    //   label: "Operations",
    //   items: [
    //     { title: "Fees", url: "/fees", icon: Wallet },
    //     { title: "Settings", url: "/settings", icon: Settings },
    //   ],
    // },
    {
      label: "System",
      items: [
        { title: "Users", url: "/users", icon: Users, reqRoles: ['SUPER_ADMIN', 'ADMIN'] },
        { title: "Roles", url: "/roles", icon: Shield, reqRoles: ['SUPER_ADMIN'] },
        { title: "Permissions", url: "/permissions", icon: FileText, reqRoles: ['SUPER_ADMIN'] },
        { title: "System Logs", url: "/logs", icon: FileText, reqRoles: ['SUPER_ADMIN', 'ADMIN'] },
      ],
    },
    {
      label: "Account",
      items: [
        { title: "My Profile", url: "/profile", icon: UserCircle, reqRoles: ['FACULTY', 'STUDENT'] },
      ],
    },
  ];

  const initials = `${user?.firstName?.[0] || 'A'}${user?.lastName?.[0] || 'D'}`.toUpperCase();

  return (
    <div
      className={cn(
        "flex h-screen flex-col transition-all duration-200 ease-linear sticky top-0 shrink-0 overflow-hidden",
        collapsed ? "w-[4rem]" : "w-64"
      )}
      style={{ backgroundColor: 'var(--sidebar)', color: 'var(--sidebar-foreground)' }}
    >
      {/* Header */}
      <div
        className="flex h-16 shrink-0 items-center px-4 py-5"
        style={{ borderBottom: '1px solid var(--sidebar-border)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
            style={{ backgroundColor: 'var(--sidebar-primary)', color: 'var(--sidebar-primary-foreground)' }}
          >
            E
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold" style={{ color: 'var(--sidebar-foreground)' }}>EduERP</span>
              <span className="text-[11px] opacity-70" style={{ color: 'var(--sidebar-foreground)' }}>Campus Suite</span>
            </div>
          )}
        </div>
      </div>

      {/* Nav Content */}
      <div className="flex flex-1 flex-col overflow-y-auto px-2 py-3 gap-1">
        {groups.map((group) => {
          const visibleItems = group.items.filter(item =>
            !item.reqRoles || item.reqRoles.some(role => (user?.roles || []).includes(role))
          );

          if (visibleItems.length === 0) return null;

          const isExpanded = collapsed || expandedGroups[group.label] !== false;

          return (
            <div key={group.label} className="relative flex w-full min-w-0 flex-col p-2">
              {!collapsed ? (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex h-8 shrink-0 items-center justify-between rounded-md px-2 text-xs font-medium uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity mb-1 w-full text-left cursor-pointer"
                  style={{ color: 'var(--sidebar-foreground)' }}
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform duration-200",
                      !isExpanded && "-rotate-90"
                    )}
                  />
                </button>
              ) : null}
              {isExpanded && (
                <ul className="flex w-full min-w-0 flex-col gap-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.url);
                    return (
                      <li key={item.title} className="relative">
                        <NavLink
                          to={item.url}
                          title={collapsed ? item.title : undefined}
                          className={cn(
                            "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-sm font-medium outline-none transition-colors cursor-pointer",
                            collapsed && "justify-center"
                          )}
                          style={
                            active
                              ? { backgroundColor: 'var(--sidebar-primary)', color: 'var(--sidebar-primary-foreground)' }
                              : { color: 'var(--sidebar-foreground)' }
                          }
                          onMouseEnter={(e) => {
                            if (!active) {
                              (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--sidebar-accent)';
                              (e.currentTarget as HTMLElement).style.color = 'var(--sidebar-accent-foreground)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!active) {
                              (e.currentTarget as HTMLElement).style.backgroundColor = '';
                              (e.currentTarget as HTMLElement).style.color = 'var(--sidebar-foreground)';
                            }
                          }}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="flex shrink-0 items-center p-3"
        style={{ borderTop: '1px solid var(--sidebar-border)' }}
      >
        {!collapsed ? (
          <div className="flex w-full items-center gap-3">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
              style={{ backgroundColor: 'var(--sidebar-accent)', color: 'var(--sidebar-accent-foreground)' }}
            >
              {initials}
            </div>
            <div className="flex flex-col flex-1 leading-tight overflow-hidden">
              <span className="text-xs font-medium truncate" style={{ color: 'var(--sidebar-foreground)' }}>
                {user?.firstName || 'Admin'} {user?.lastName || 'User'}
              </span>
              <span className="text-[10px] opacity-70 truncate" style={{ color: 'var(--sidebar-foreground)' }}>
                {user?.email || 'admin@edu.in'}
              </span>
            </div>
            <button
              onClick={() => {
                clearAuth()
                Navigate('/login')
              }}
              title="Sign Out"
              className="p-1.5 rounded-md transition-colors opacity-70 hover:opacity-100 cursor-pointer"
              style={{ color: 'var(--sidebar-foreground)' }}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex w-full justify-center">
            <button
              onClick={() => {
                clearAuth()
                Navigate('/login')
              }}
              title="Sign Out"
              className="flex h-8 w-8 items-center justify-center rounded-md transition-colors opacity-70 hover:opacity-100 cursor-pointer"
              style={{ color: 'var(--sidebar-foreground)' }}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
