import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/erp/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Plus } from "lucide-react";

export const Route = createFileRoute("/_app/courses")({
  head: () => ({
    meta: [
      { title: "Courses | EduERP" },
      { name: "description", content: "Course catalogue and assignments." },
    ],
  }),
  component: CoursesPage,
});

const courses = [
  { code: "CS-201", title: "Data Structures & Algorithms", dept: "Computer Science", faculty: "Dr. Priya Iyer", credits: 4, students: 86 },
  { code: "PH-105", title: "Quantum Mechanics I", dept: "Physics", faculty: "Dr. Anil Rao", credits: 3, students: 42 },
  { code: "EN-110", title: "Modern Literature", dept: "English", faculty: "Ms. Neha Kapoor", credits: 3, students: 58 },
  { code: "MA-301", title: "Linear Algebra", dept: "Mathematics", faculty: "Dr. Vikram Desai", credits: 4, students: 71 },
  { code: "CO-220", title: "Financial Accounting", dept: "Commerce", faculty: "Mr. Sameer Gupta", credits: 3, students: 95 },
  { code: "BT-180", title: "Cell Biology", dept: "Biotechnology", faculty: "Dr. Meera Nair", credits: 4, students: 38 },
];

function CoursesPage() {
  return (
    <>
      <PageHeader
        breadcrumb={["Home", "Academics", "Courses"]}
        title="Course catalogue"
        description="All active courses this semester."
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" /> New course
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {courses.map((c) => (
          <Card key={c.code} className="border-border/60 hover:border-primary/40 hover:shadow-md transition-all overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-primary to-[oklch(0.5_0.22_330)]" />
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <Badge variant="outline" className="font-mono text-[10px] border-primary/30 text-primary">
                  {c.code}
                </Badge>
                <span className="text-xs text-muted-foreground">{c.credits} credits</span>
              </div>
              <h3 className="mt-3 font-semibold leading-tight">{c.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{c.dept}</p>
              <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <div className="h-7 w-7 rounded-full bg-accent text-primary flex items-center justify-center font-medium">
                    {c.faculty.split(" ").slice(-1)[0][0]}
                  </div>
                  <span className="text-muted-foreground truncate">{c.faculty}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" /> {c.students}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
