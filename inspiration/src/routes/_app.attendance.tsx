import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/erp/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance | EduERP" },
      { name: "description", content: "Mark and review daily attendance." },
    ],
  }),
  component: AttendancePage,
});

const roster = [
  "Aarav Mehta", "Isha Verma", "Rohan Khanna", "Sneha Pillai", "Kabir Singh",
  "Diya Sharma", "Aryan Joshi", "Riya Kapoor", "Vivaan Shah", "Anaya Reddy",
];

function AttendancePage() {
  const [present, setPresent] = useState<Record<string, boolean>>(
    Object.fromEntries(roster.map((n) => [n, true])),
  );

  const total = roster.length;
  const presentCount = Object.values(present).filter(Boolean).length;

  return (
    <>
      <PageHeader
        breadcrumb={["Home", "Academics", "Attendance"]}
        title="Daily attendance"
        description="Mark attendance for today's lecture."
        actions={
          <Button onClick={() => toast.success("Attendance saved")}>Save attendance</Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Date</div>
            <div className="font-semibold mt-1">Mon, Jun 1 2026</div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4 space-y-1">
            <div className="text-xs text-muted-foreground">Course</div>
            <Select defaultValue="cs-201">
              <SelectTrigger className="h-8 border-0 px-0 font-semibold focus:ring-0 shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cs-201">CS-201 · DSA</SelectItem>
                <SelectItem value="ph-105">PH-105 · Quantum I</SelectItem>
                <SelectItem value="ma-301">MA-301 · Linear Algebra</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Present</div>
            <div className="font-semibold mt-1 text-primary">{presentCount} / {total}</div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Attendance %</div>
            <div className="font-semibold mt-1">{Math.round((presentCount / total) * 100)}%</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Class roster</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {roster.map((name, i) => (
            <div key={name} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-6">{i + 1}.</span>
                <div className="h-8 w-8 rounded-full bg-accent text-primary text-xs font-medium flex items-center justify-center">
                  {name.split(" ").map((p) => p[0]).join("")}
                </div>
                <span className="text-sm font-medium">{name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={
                    present[name]
                      ? "border-primary/30 text-primary bg-primary/5"
                      : "border-destructive/30 text-destructive bg-destructive/5"
                  }
                >
                  {present[name] ? "Present" : "Absent"}
                </Badge>
                <Checkbox
                  checked={present[name]}
                  onCheckedChange={(v:any) => setPresent({ ...present, [name]: Boolean(v) })}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
