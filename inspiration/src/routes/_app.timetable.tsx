import { createFileRoute } from "@tanstack/react-router";
import { Fragment } from "react";
import { PageHeader } from "@/components/erp/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_app/timetable")({
  head: () => ({
    meta: [
      { title: "Timetable | EduERP" },
      { name: "description", content: "Weekly class schedule." },
    ],
  }),
  component: TimetablePage,
});

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const slots = ["9:00", "10:00", "11:00", "12:00", "2:00", "3:00"];

type Cell = { course: string; room: string; color: string } | null;

const schedule: Record<string, Record<string, Cell>> = {
  Mon: {
    "9:00": { course: "CS-201", room: "A-101", color: "bg-primary text-primary-foreground" },
    "10:00": { course: "MA-301", room: "B-204", color: "bg-accent text-primary" },
    "11:00": null,
    "12:00": { course: "EN-110", room: "C-110", color: "bg-accent text-primary" },
    "2:00": { course: "PH-105", room: "Lab 2", color: "bg-primary text-primary-foreground" },
    "3:00": null,
  },
  Tue: {
    "9:00": null,
    "10:00": { course: "CS-201", room: "A-101", color: "bg-primary text-primary-foreground" },
    "11:00": { course: "CO-220", room: "D-301", color: "bg-accent text-primary" },
    "12:00": null,
    "2:00": { course: "BT-180", room: "Lab 4", color: "bg-accent text-primary" },
    "3:00": { course: "MA-301", room: "B-204", color: "bg-primary text-primary-foreground" },
  },
  Wed: {
    "9:00": { course: "PH-105", room: "Lab 2", color: "bg-accent text-primary" },
    "10:00": null,
    "11:00": { course: "CS-201", room: "A-101", color: "bg-primary text-primary-foreground" },
    "12:00": { course: "MA-301", room: "B-204", color: "bg-accent text-primary" },
    "2:00": null,
    "3:00": { course: "EN-110", room: "C-110", color: "bg-primary text-primary-foreground" },
  },
  Thu: {
    "9:00": { course: "CO-220", room: "D-301", color: "bg-accent text-primary" },
    "10:00": { course: "BT-180", room: "Lab 4", color: "bg-primary text-primary-foreground" },
    "11:00": null,
    "12:00": { course: "CS-201", room: "A-101", color: "bg-accent text-primary" },
    "2:00": { course: "MA-301", room: "B-204", color: "bg-primary text-primary-foreground" },
    "3:00": null,
  },
  Fri: {
    "9:00": { course: "EN-110", room: "C-110", color: "bg-primary text-primary-foreground" },
    "10:00": { course: "PH-105", room: "Lab 2", color: "bg-accent text-primary" },
    "11:00": { course: "CO-220", room: "D-301", color: "bg-primary text-primary-foreground" },
    "12:00": null,
    "2:00": null,
    "3:00": { course: "BT-180", room: "Lab 4", color: "bg-accent text-primary" },
  },
};

function TimetablePage() {
  return (
    <>
      <PageHeader
        breadcrumb={["Home", "Academics", "Timetable"]}
        title="Weekly timetable"
        description="Your class schedule for this week."
      />

      <Card className="border-border/60">
        <CardContent className="p-4 overflow-x-auto">
          <div className="grid grid-cols-[80px_repeat(5,1fr)] gap-2 min-w-[700px]">
            <div />
            {days.map((d) => (
              <div key={d} className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2">
                {d}
              </div>
            ))}
            {slots.map((slot) => (
              <Fragment key={slot}>
                <div className="text-xs text-muted-foreground font-medium pt-3">
                  {slot}
                </div>
                {days.map((d) => {
                  const cell = schedule[d][slot];
                  return (
                    <div key={`${d}-${slot}`} className="min-h-[64px]">
                      {cell ? (
                        <div className={`h-full rounded-lg p-2 ${cell.color}`}>
                          <div className="text-xs font-semibold">{cell.course}</div>
                          <div className="text-[10px] opacity-80 mt-0.5">{cell.room}</div>
                        </div>
                      ) : (
                        <div className="h-full rounded-lg border border-dashed border-border/60" />
                      )}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
