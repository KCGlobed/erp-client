import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/erp/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  Users,
  BookOpen,
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
} from "lucide-react";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Dashboard | EduERP" },
      { name: "description", content: "Campus-wide ERP dashboard for students, faculty and admin." },
    ],
  }),
  component: Dashboard,
});

const stats = [
  { label: "Total Students", value: "4,820", change: "+8.2%", up: true, icon: GraduationCap },
  { label: "Faculty Members", value: "312", change: "+1.4%", up: true, icon: Users },
  { label: "Active Courses", value: "186", change: "+12", up: true, icon: BookOpen },
  { label: "Fees Collected", value: "₹42.6L", change: "-3.1%", up: false, icon: Wallet },
];

const recentAdmissions = [
  { name: "Aarav Mehta", program: "B.Tech CSE", date: "2026-05-28", status: "Verified" },
  { name: "Isha Verma", program: "B.Sc Physics", date: "2026-05-27", status: "Pending" },
  { name: "Rohan Khanna", program: "MBA", date: "2026-05-26", status: "Verified" },
  { name: "Sneha Pillai", program: "B.Com (H)", date: "2026-05-25", status: "Rejected" },
  { name: "Kabir Singh", program: "B.Tech ECE", date: "2026-05-25", status: "Verified" },
];

const upcoming = [
  { title: "Semester End Examinations", date: "Jun 12", tag: "Exam" },
  { title: "Faculty Council Meeting", date: "Jun 14", tag: "Meeting" },
  { title: "Annual Sports Day", date: "Jun 18", tag: "Event" },
  { title: "Fees Submission Deadline", date: "Jun 30", tag: "Finance" },
];

function Dashboard() {
  return (
    <>
      <PageHeader
        breadcrumb={["Home", "Dashboard"]}
        title="Welcome back, Admin"
        description="Here's what is happening across your campus today."
        actions={
          <>
            <Button variant="outline">Export</Button>
            <Button>New Report</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
                <Badge
                  variant="secondary"
                  className={
                    s.up
                      ? "bg-primary/10 text-primary hover:bg-primary/10"
                      : "bg-destructive/10 text-destructive hover:bg-destructive/10"
                  }
                >
                  {s.up ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {s.change}
                </Badge>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-semibold tracking-tight">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Admissions</CardTitle>
              <CardDescription>Latest applications across all programs</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-primary">
              View all <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {recentAdmissions.map((a) => (
                <div key={a.name} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-accent text-primary font-medium flex items-center justify-center text-xs">
                      {a.name.split(" ").map((p) => p[0]).join("")}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{a.name}</div>
                      <div className="text-xs text-muted-foreground">{a.program}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground hidden sm:inline">{a.date}</span>
                    <Badge
                      variant="outline"
                      className={
                        a.status === "Verified"
                          ? "border-primary/30 text-primary bg-primary/5"
                          : a.status === "Pending"
                          ? "border-amber-400/40 text-amber-700 bg-amber-50"
                          : "border-destructive/30 text-destructive bg-destructive/5"
                      }
                    >
                      {a.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Upcoming</CardTitle>
            <CardDescription>Calendar highlights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.map((u) => (
              <div
                key={u.title}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:border-primary/40 hover:bg-accent/40 transition-colors"
              >
                <div className="h-12 w-12 rounded-md bg-primary text-primary-foreground flex flex-col items-center justify-center leading-tight">
                  <span className="text-[10px] uppercase opacity-80">{u.date.split(" ")[0]}</span>
                  <span className="text-sm font-semibold">{u.date.split(" ")[1]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{u.title}</div>
                  <div className="text-[11px] text-muted-foreground">{u.tag}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
