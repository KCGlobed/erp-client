import { Outlet } from "@tanstack/react-router";
import { Bell, Search } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/erp/AppSidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

export function ErpLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 sticky top-0 z-20 flex items-center gap-3 border-b bg-background/80 backdrop-blur px-4 md:px-6">
            <SidebarTrigger />
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students, courses, faculty…"
                className="pl-9 bg-muted/50 border-transparent focus-visible:bg-background"
              />
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
