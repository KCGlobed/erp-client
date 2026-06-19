import { Outlet, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { 
  Bell, Search,
  LayoutDashboard, Users, GraduationCap, 
  BookOpen, ClipboardList, CalendarDays, 
  Wallet, Settings, UserPlus, FileText 
} from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/erp/AppSidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

const SEARCHABLE_ROUTES = [
  { title: "Dashboard", path: "/", icon: LayoutDashboard, description: "Overview and metrics", keywords: ["home", "stats", "overview"] },
  { title: "Students", path: "/students", icon: GraduationCap, description: "Manage students and records", keywords: ["pupil", "learner", "class", "admission"] },
  { title: "Faculty", path: "/faculty", icon: Users, description: "Manage faculty and staff", keywords: ["teacher", "prof", "instructor"] },
  { title: "Admissions", path: "/admissions", icon: UserPlus, description: "Student admission forms and process", keywords: ["enroll", "new student", "registration"] },
  { title: "Courses", path: "/courses", icon: BookOpen, description: "Manage academic courses", keywords: ["subject", "classes", "syllabus"] },
  { title: "Attendance", path: "/attendance", icon: ClipboardList, description: "Track daily attendance", keywords: ["roll call", "present", "absent"] },
  { title: "Exams", path: "/exams", icon: FileText, description: "Manage examination schedules and results", keywords: ["test", "quiz", "grades"] },
  { title: "Timetable", path: "/timetable", icon: CalendarDays, description: "Weekly schedule and classes", keywords: ["schedule", "calendar", "time"] },
  { title: "Fees", path: "/fees", icon: Wallet, description: "Fee structures and payments", keywords: ["money", "billing", "payment"] },
  { title: "Settings", path: "/settings", icon: Settings, description: "Application configuration", keywords: ["config", "admin", "setup"] },
];

export function ErpLayout() {
  const navigate = useNavigate();

  // Search routing state
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter routes
  const filteredRoutes = searchQuery.trim() === ""
    ? []
    : SEARCHABLE_ROUTES.filter(route => {
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
    navigate({ to: path });
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (filteredRoutes.length > 0 ? (prev + 1) % filteredRoutes.length : -1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (filteredRoutes.length > 0 ? (prev - 1 + filteredRoutes.length) % filteredRoutes.length : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < filteredRoutes.length) {
        handleNavigate(filteredRoutes[selectedIndex].path);
      } else if (filteredRoutes.length > 0) {
        handleNavigate(filteredRoutes[0].path);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      e.currentTarget.blur();
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 sticky top-0 z-20 flex items-center gap-3 border-b bg-background/80 backdrop-blur px-4 md:px-6">
            <SidebarTrigger />
            <div className="relative flex-1 max-w-md focus:outline-none" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                name="search"
                autoComplete="off"
                placeholder="Search students, courses, faculty…"
                className="pl-9 bg-muted/50 border-transparent outline-hidden focus:outline-none"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
              />

              {/* Suggestions Dropdown */}
              {isOpen && searchQuery.trim() !== "" && (
                <div 
                  className="absolute top-full left-0 w-full mt-2 rounded-lg border shadow-xl z-50 overflow-hidden backdrop-blur-md bg-background/95 transition-all duration-200"
                  style={{
                    borderColor: 'var(--border)',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  {filteredRoutes.length > 0 ? (
                    <div className="py-1.5 max-h-72 overflow-y-auto">
                      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Suggestions
                      </div>
                      {filteredRoutes.map((route, index) => {
                        const Icon = route.icon;
                        const isSelected = index === selectedIndex;
                        return (
                          <div
                            key={route.path}
                            onClick={() => handleNavigate(route.path)}
                            className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                              isSelected 
                                ? 'bg-primary text-primary-foreground' 
                                : 'hover:bg-muted text-foreground'
                            }`}
                            onMouseEnter={() => setSelectedIndex(index)}
                          >
                            <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-medium leading-none">{route.title}</span>
                              <span className={`text-[10px] mt-0.5 truncate ${isSelected ? 'text-primary-foreground/85' : 'text-muted-foreground'}`}>
                                {route.description}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                      No matching pages found
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
              </Button>
              <div className="hidden md:flex items-center gap-2 pl-3 border-l">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                  AD
                </div>
                <div className="leading-tight">
                  <div className="text-xs font-medium">Admin User</div>
                  <div className="text-[10px] text-muted-foreground">Administrator</div>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
