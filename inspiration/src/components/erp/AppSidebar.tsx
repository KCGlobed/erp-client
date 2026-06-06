import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  CalendarDays,
  Wallet,
  Settings,
  UserPlus,
  FileText,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const groups = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "People",
    items: [
      { title: "Students", url: "/students", icon: GraduationCap },
      { title: "Faculty", url: "/faculty", icon: Users },
      { title: "Admissions", url: "/admissions", icon: UserPlus },
    ],
  },
  {
    label: "Academics",
    items: [
      { title: "Courses", url: "/courses", icon: BookOpen },
      { title: "Attendance", url: "/attendance", icon: ClipboardList },
      { title: "Exams", url: "/exams", icon: FileText },
      { title: "Timetable", url: "/timetable", icon: CalendarDays },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Fees", url: "/fees", icon: Wallet },
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (path: string) =>
    path === "/" ? currentPath === "/" : currentPath.startsWith(path);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border/40 px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold">
            E
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">EduERP</span>
              <span className="text-[11px] text-sidebar-foreground/70">Campus Suite</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            {!collapsed && (
              <SidebarGroupLabel className="text-sidebar-foreground/60 uppercase tracking-wider text-[10px]">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      className="data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                      <Link to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/40 p-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-accent-foreground text-xs font-semibold">
            AD
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-medium text-sidebar-foreground">Admin User</span>
              <span className="text-[10px] text-sidebar-foreground/70">admin@edu.in</span>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
