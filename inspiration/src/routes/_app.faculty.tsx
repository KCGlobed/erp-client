import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/erp/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Mail, Phone } from "lucide-react";

export const Route = createFileRoute("/_app/faculty")({
  head: () => ({
    meta: [
      { title: "Faculty | EduERP" },
      { name: "description", content: "Faculty directory and department assignments." },
    ],
  }),
  component: FacultyPage,
});

const faculty = [
  { name: "Dr. Priya Iyer", dept: "Computer Science", role: "Professor", courses: 4, email: "priya.iyer@edu.in", phone: "+91 98xxx" },
  { name: "Dr. Anil Rao", dept: "Physics", role: "Associate Professor", courses: 3, email: "anil.rao@edu.in", phone: "+91 97xxx" },
  { name: "Ms. Neha Kapoor", dept: "English", role: "Assistant Professor", courses: 5, email: "neha.k@edu.in", phone: "+91 96xxx" },
  { name: "Dr. Vikram Desai", dept: "Mathematics", role: "Head of Dept.", courses: 2, email: "vikram.d@edu.in", phone: "+91 95xxx" },
  { name: "Mr. Sameer Gupta", dept: "Commerce", role: "Lecturer", courses: 4, email: "sameer.g@edu.in", phone: "+91 94xxx" },
  { name: "Dr. Meera Nair", dept: "Biotechnology", role: "Professor", courses: 3, email: "meera.n@edu.in", phone: "+91 93xxx" },
];

function FacultyPage() {
  return (
    <>
      <PageHeader
        breadcrumb={["Home", "People", "Faculty"]}
        title="Faculty"
        description="Browse the academic team across departments."
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Add Faculty
          </Button>
        }
      />

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search faculty…" className="pl-9" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {faculty.map((f) => (
          <Card key={f.email} className="border-border/60 hover:border-primary/40 hover:shadow-md transition-all">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-semibold">
                  {f.name.split(" ").slice(-2).map((p) => p[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{f.name}</div>
                  <div className="text-xs text-muted-foreground">{f.role}</div>
                  <Badge variant="secondary" className="mt-2 bg-accent text-primary">
                    {f.dept}
                  </Badge>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border/60 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" /> {f.email}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" /> {f.phone}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">{f.courses} courses</span>
                  <Button variant="ghost" size="sm" className="text-primary h-7">
                    View profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
