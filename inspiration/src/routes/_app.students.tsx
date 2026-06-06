import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/erp/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Download,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  CalendarIcon,
  CheckCircle2,
  XCircle,
  ClipboardCheck,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/students")({
  head: () => ({
    meta: [
      { title: "Students | EduERP" },
      { name: "description", content: "Manage student records and mark attendance date-wise." },
    ],
  }),
  component: StudentsPage,
});

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  program: string;
  year: string;
  section: string;
  city: string;
  dob: string;
  guardian: string;
  avatar: string;
  status: "Active" | "On Leave" | "Graduated";
}

const initialStudents: Student[] = [
  { id: "STU-2024-001", name: "Aarav Mehta", email: "aarav.m@edu.in", phone: "+91 98201 23456", program: "B.Tech CSE", year: "2nd", section: "A", city: "Mumbai", dob: "2004-03-12", guardian: "Rajeev Mehta", avatar: "https://i.pravatar.cc/200?img=12", status: "Active" },
  { id: "STU-2024-002", name: "Isha Verma", email: "isha.v@edu.in", phone: "+91 99876 11220", program: "B.Sc Physics", year: "1st", section: "B", city: "Pune", dob: "2005-07-22", guardian: "Sunita Verma", avatar: "https://i.pravatar.cc/200?img=47", status: "Active" },
  { id: "STU-2024-003", name: "Rohan Khanna", email: "rohan.k@edu.in", phone: "+91 90123 55780", program: "MBA", year: "1st", section: "A", city: "Delhi", dob: "2001-11-04", guardian: "Vikram Khanna", avatar: "https://i.pravatar.cc/200?img=33", status: "Active" },
  { id: "STU-2023-088", name: "Sneha Pillai", email: "sneha.p@edu.in", phone: "+91 98450 67891", program: "B.Com (H)", year: "3rd", section: "C", city: "Kochi", dob: "2003-01-30", guardian: "Anand Pillai", avatar: "https://i.pravatar.cc/200?img=45", status: "On Leave" },
  { id: "STU-2024-004", name: "Kabir Singh", email: "kabir.s@edu.in", phone: "+91 99100 22334", program: "B.Tech ECE", year: "2nd", section: "B", city: "Chandigarh", dob: "2004-09-18", guardian: "Manjit Singh", avatar: "https://i.pravatar.cc/200?img=15", status: "Active" },
  { id: "STU-2022-145", name: "Diya Sharma", email: "diya.s@edu.in", phone: "+91 90876 54321", program: "B.A English", year: "4th", section: "A", city: "Jaipur", dob: "2002-05-10", guardian: "Meera Sharma", avatar: "https://i.pravatar.cc/200?img=48", status: "Graduated" },
  { id: "STU-2024-005", name: "Aryan Joshi", email: "aryan.j@edu.in", phone: "+91 98765 43219", program: "B.Tech CSE", year: "1st", section: "A", city: "Bengaluru", dob: "2005-12-02", guardian: "Sanjay Joshi", avatar: "https://i.pravatar.cc/200?img=8", status: "Active" },
  { id: "STU-2024-006", name: "Anaya Reddy", email: "anaya.r@edu.in", phone: "+91 97045 66012", program: "B.Sc Physics", year: "2nd", section: "B", city: "Hyderabad", dob: "2004-04-25", guardian: "Lakshmi Reddy", avatar: "https://i.pravatar.cc/200?img=49", status: "Active" },
];

type AttendanceMap = Record<string, Record<string, "present" | "absent">>;
// shape: { "STU-2024-001": { "2026-06-04": "present" } }

function StudentsPage() {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [attendance, setAttendance] = useState<AttendanceMap>({});
  const [attDate, setAttDate] = useState<Date>(new Date());
  const [attOpen, setAttOpen] = useState(false);
  const [attStudent, setAttStudent] = useState<Student | null>(null);

  const [form, setForm] = useState({
    name: "", email: "", program: "", year: "", phone: "", address: "",
  });

  const filtered = useMemo(
    () =>
      students.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.email.toLowerCase().includes(query.toLowerCase()) ||
          s.id.toLowerCase().includes(query.toLowerCase()) ||
          s.program.toLowerCase().includes(query.toLowerCase()),
      ),
    [students, query],
  );

  const dateKey = format(attDate, "yyyy-MM-dd");

  const getMark = (studentId: string) => attendance[studentId]?.[dateKey];

  const setMark = (studentId: string, value: "present" | "absent") => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [dateKey]: value },
    }));
  };

  const presentCount = filtered.filter((s) => getMark(s.id) === "present").length;
  const absentCount = filtered.filter((s) => getMark(s.id) === "absent").length;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.program || !form.year) {
      toast.error("Please fill all required fields");
      return;
    }
    const newStudent: Student = {
      id: `STU-2026-${String(students.length + 1).padStart(3, "0")}`,
      name: form.name,
      email: form.email,
      phone: form.phone || "—",
      program: form.program,
      year: form.year,
      section: "A",
      city: form.address || "—",
      dob: "—",
      guardian: "—",
      avatar: `https://i.pravatar.cc/200?u=${encodeURIComponent(form.email)}`,
      status: "Active",
    };
    setStudents([newStudent, ...students]);
    toast.success(`${form.name} added successfully`);
    setForm({ name: "", email: "", program: "", year: "", phone: "", address: "" });
    setOpen(false);
  };

  const openAttendanceFor = (s: Student) => {
    setAttStudent(s);
    setAttOpen(true);
  };

  const studentHistory = attStudent
    ? Object.entries(attendance[attStudent.id] || {}).sort((a, b) => (a[0] < b[0] ? 1 : -1))
    : [];

  return (
    <>
      <PageHeader
        breadcrumb={["Home", "People", "Students"]}
        title="Students"
        description="Browse student profiles and mark attendance for any date."
        actions={
          <>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> Add Student
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                  <DialogTitle>Enroll new student</DialogTitle>
                  <DialogDescription>
                    A student ID will be generated automatically.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate} className="grid gap-4 py-2">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Full name *</Label>
                      <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Aarav Mehta" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@edu.in" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Program *</Label>
                      <Select value={form.program} onValueChange={(v) => setForm({ ...form, program: v })}>
                        <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="B.Tech CSE">B.Tech CSE</SelectItem>
                          <SelectItem value="B.Tech ECE">B.Tech ECE</SelectItem>
                          <SelectItem value="B.Sc Physics">B.Sc Physics</SelectItem>
                          <SelectItem value="B.Com (H)">B.Com (H)</SelectItem>
                          <SelectItem value="MBA">MBA</SelectItem>
                          <SelectItem value="B.A English">B.A English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Year *</Label>
                      <Select value={form.year} onValueChange={(v) => setForm({ ...form, year: v })}>
                        <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1st">1st year</SelectItem>
                          <SelectItem value="2nd">2nd year</SelectItem>
                          <SelectItem value="3rd">3rd year</SelectItem>
                          <SelectItem value="4th">4th year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 ..." />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">City / Address</Label>
                    <Textarea id="address" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit">Create student</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      {/* Attendance toolbar */}
      <Card className="border-border/60 mb-6 overflow-hidden">
        <div className="h-1 w-full bg-[var(--gradient-primary)]" />
        <CardContent className="p-4 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">Attendance for</div>
              <div className="text-xs text-muted-foreground">Pick a date and mark each student</div>
            </div>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="lg:ml-4 justify-start font-normal">
                <CalendarIcon className="h-4 w-4 mr-2 text-primary" />
                {format(attDate, "EEEE, MMM d, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={attDate}
                onSelect={(d) => d && setAttDate(d)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-2 lg:ml-auto">
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Present {presentCount}
            </Badge>
            <Badge variant="outline" className="border-destructive/30 text-destructive bg-destructive/5">
              <XCircle className="h-3 w-3 mr-1" /> Absent {absentCount}
            </Badge>
            <Button
              size="sm"
              onClick={() => {
                const updates: AttendanceMap = { ...attendance };
                filtered.forEach((s) => {
                  updates[s.id] = { ...(updates[s.id] || {}), [dateKey]: "present" };
                });
                setAttendance(updates);
                toast.success("All marked present");
              }}
            >
              Mark all present
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search students by name, email, ID or program…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 bg-background"
        />
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
        {filtered.map((s) => {
          const mark = getMark(s.id);
          return (
            <Card
              key={s.id}
              className="border-border/60 overflow-hidden group hover:shadow-[var(--shadow-elegant)] transition-all duration-300"
            >
              <div className="h-20 bg-[var(--gradient-primary)] relative">
                <Badge
                  variant="outline"
                  className={cn(
                    "absolute top-3 right-3 bg-white/95 backdrop-blur",
                    s.status === "Active" && "border-primary/30 text-primary",
                    s.status === "On Leave" && "border-amber-400/40 text-amber-700",
                    s.status === "Graduated" && "border-muted-foreground/30 text-muted-foreground",
                  )}
                >
                  {s.status}
                </Badge>
              </div>

              <CardContent className="px-5 pb-5 -mt-10">
                <div className="flex items-end justify-between">
                  <img
                    src={s.avatar}
                    alt={s.name}
                    className="h-20 w-20 rounded-2xl border-4 border-background object-cover bg-muted shadow-[var(--shadow-soft)]"
                  />
                  {mark && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "mb-1",
                        mark === "present"
                          ? "border-primary/30 text-primary bg-primary/5"
                          : "border-destructive/30 text-destructive bg-destructive/5",
                      )}
                    >
                      {mark === "present" ? "Present" : "Absent"} · {format(attDate, "MMM d")}
                    </Badge>
                  )}
                </div>

                <div className="mt-3">
                  <h3 className="font-semibold text-base leading-tight">{s.name}</h3>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">{s.id}</p>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GraduationCap className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">
                      {s.program} · Year {s.year} · Sec {s.section}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">{s.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">{s.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">{s.city} · Guardian: {s.guardian}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={mark === "present" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setMark(s.id, "present")}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Present
                  </Button>
                  <Button
                    size="sm"
                    variant={mark === "absent" ? "default" : "outline"}
                    className={cn(
                      "flex-1",
                      mark === "absent" && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                    )}
                    onClick={() => setMark(s.id, "absent")}
                  >
                    <XCircle className="h-4 w-4 mr-1" /> Absent
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openAttendanceFor(s)}>
                    History
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <Card className="col-span-full border-dashed">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No students match your search.
            </CardContent>
          </Card>
        )}
      </div>

      {/* History dialog */}
      <Dialog open={attOpen} onOpenChange={setAttOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{attStudent?.name} · Attendance history</DialogTitle>
            <DialogDescription>{attStudent?.id} · {attStudent?.program}</DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto divide-y">
            {studentHistory.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No attendance marked yet.
              </p>
            )}
            {studentHistory.map(([date, value]) => (
              <div key={date} className="flex items-center justify-between py-3">
                <div className="text-sm font-medium">
                  {format(new Date(date), "EEE, MMM d, yyyy")}
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    value === "present"
                      ? "border-primary/30 text-primary bg-primary/5"
                      : "border-destructive/30 text-destructive bg-destructive/5",
                  )}
                >
                  {value === "present" ? "Present" : "Absent"}
                </Badge>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
