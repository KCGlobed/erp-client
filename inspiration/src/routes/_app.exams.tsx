import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/erp/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Calendar } from "lucide-react";

export const Route = createFileRoute("/_app/exams")({
  head: () => ({
    meta: [
      { title: "Exams | EduERP" },
      { name: "description", content: "Examination schedule and results." },
    ],
  }),
  component: ExamsPage,
});

const exams = [
  { course: "CS-201 · DSA", date: "Jun 12, 2026", time: "10:00 AM", room: "Hall A", status: "Upcoming", progress: 0 },
  { course: "PH-105 · Quantum I", date: "Jun 14, 2026", time: "2:00 PM", room: "Hall B", status: "Upcoming", progress: 0 },
  { course: "MA-301 · Linear Algebra", date: "May 28, 2026", time: "10:00 AM", room: "Hall A", status: "Grading", progress: 70 },
  { course: "EN-110 · Modern Literature", date: "May 22, 2026", time: "11:00 AM", room: "Hall C", status: "Published", progress: 100 },
];

function ExamsPage() {
  return (
    <>
      <PageHeader
        breadcrumb={["Home", "Academics", "Exams"]}
        title="Examinations"
        description="Schedule, monitor grading and publish results."
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Schedule exam
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exams.map((e) => (
          <Card key={e.course} className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{e.course}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Calendar className="h-3 w-3" /> {e.date} · {e.time} · {e.room}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    e.status === "Published"
                      ? "border-primary/30 text-primary bg-primary/5"
                      : e.status === "Grading"
                      ? "border-amber-400/40 text-amber-700 bg-amber-50"
                      : "border-muted-foreground/30 text-muted-foreground bg-muted/30"
                  }
                >
                  {e.status}
                </Badge>
              </div>
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>Grading progress</span>
                  <span>{e.progress}%</span>
                </div>
                <Progress value={e.progress} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
