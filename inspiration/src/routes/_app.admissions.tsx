import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/erp/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/admissions")({
  head: () => ({
    meta: [
      { title: "Admissions | EduERP" },
      { name: "description", content: "Submit and review new admission applications." },
    ],
  }),
  component: AdmissionsPage,
});

function AdmissionsPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Application submitted for review");
    setSubmitted(true);
  };

  return (
    <>
      <PageHeader
        breadcrumb={["Home", "People", "Admissions"]}
        title="New Admission"
        description="Capture applicant details, academic history and program preference."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader>
            <CardTitle>Applicant details</CardTitle>
            <CardDescription>All fields marked with * are required.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <section className="space-y-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Personal
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>First name *</Label>
                    <Input placeholder="First name" required />
                  </div>
                  <div className="grid gap-2">
                    <Label>Last name *</Label>
                    <Input placeholder="Last name" required />
                  </div>
                  <div className="grid gap-2">
                    <Label>Date of birth *</Label>
                    <Input type="date" required />
                  </div>
                  <div className="grid gap-2">
                    <Label>Gender</Label>
                    <RadioGroup defaultValue="female" className="flex gap-4 pt-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="male" id="g-m" />
                        <Label htmlFor="g-m" className="font-normal">Male</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="female" id="g-f" />
                        <Label htmlFor="g-f" className="font-normal">Female</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="other" id="g-o" />
                        <Label htmlFor="g-o" className="font-normal">Other</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Contact
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Email *</Label>
                    <Input type="email" placeholder="applicant@example.com" required />
                  </div>
                  <div className="grid gap-2">
                    <Label>Phone *</Label>
                    <Input placeholder="+91 ..." required />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Address</Label>
                  <Textarea rows={2} placeholder="Street, city, state, PIN" />
                </div>
              </section>

              <section className="space-y-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Academic
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Program *</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="btech-cse">B.Tech CSE</SelectItem>
                        <SelectItem value="btech-ece">B.Tech ECE</SelectItem>
                        <SelectItem value="bsc-phy">B.Sc Physics</SelectItem>
                        <SelectItem value="mba">MBA</SelectItem>
                        <SelectItem value="bcom">B.Com (H)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Previous board / university</Label>
                    <Input placeholder="e.g. CBSE, Delhi University" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Last qualification %</Label>
                    <Input type="number" placeholder="0 - 100" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Year of passing</Label>
                    <Input type="number" placeholder="2026" />
                  </div>
                </div>
              </section>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline">Save draft</Button>
                <Button type="submit">Submit application</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/60 bg-gradient-to-br from-primary to-[oklch(0.5_0.22_330)] text-primary-foreground">
            <CardContent className="p-6">
              <FileText className="h-6 w-6 mb-3 opacity-90" />
              <div className="font-semibold text-lg leading-tight">Admission cycle 2026</div>
              <p className="text-sm opacity-90 mt-2">
                Applications close on July 15. Verification typically takes 3–5 working days after submission.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Application progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Personal details", done: true },
                { label: "Contact information", done: true },
                { label: "Academic history", done: submitted },
                { label: "Document upload", done: false },
                { label: "Verification", done: false },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3 text-sm">
                  <div
                    className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${
                      s.done
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground border"
                    }`}
                  >
                    {s.done ? <Check className="h-3 w-3" /> : ""}
                  </div>
                  <span className={s.done ? "text-foreground" : "text-muted-foreground"}>
                    {s.label}
                  </span>
                  {s.done && (
                    <Badge variant="secondary" className="ml-auto bg-accent text-primary text-[10px]">
                      Done
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
