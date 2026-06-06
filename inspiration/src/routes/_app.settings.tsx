import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/erp/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings | EduERP" },
      { name: "description", content: "Institution and account settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <>
      <PageHeader
        breadcrumb={["Home", "Operations", "Settings"]}
        title="Settings"
        description="Manage institution profile, preferences and notifications."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader>
            <CardTitle>Institution profile</CardTitle>
            <CardDescription>Displayed across documents and student portals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Institution name</Label>
                <Input defaultValue="EduERP University" />
              </div>
              <div className="grid gap-2">
                <Label>Established year</Label>
                <Input defaultValue="1998" />
              </div>
              <div className="grid gap-2">
                <Label>Contact email</Label>
                <Input defaultValue="contact@edu.in" />
              </div>
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input defaultValue="+91 11 1234 5678" />
              </div>
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">Email notifications</div>
                  <div className="text-xs text-muted-foreground">Send fee reminders to students automatically.</div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">SMS alerts</div>
                  <div className="text-xs text-muted-foreground">Send absent alerts to parents on the same day.</div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">Weekend reports</div>
                  <div className="text-xs text-muted-foreground">Email a weekly attendance summary every Saturday.</div>
                </div>
                <Switch />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => toast.success("Settings saved")}>Save changes</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle>Brand</CardTitle>
            <CardDescription>Theme preview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-24 rounded-lg bg-gradient-to-br from-primary to-[oklch(0.5_0.22_330)] flex items-center justify-center text-primary-foreground font-semibold text-lg">
              EduERP
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="h-10 rounded bg-primary" />
              <div className="h-10 rounded bg-accent" />
              <div className="h-10 rounded bg-muted" />
              <div className="h-10 rounded bg-background border" />
            </div>
            <p className="text-xs text-muted-foreground">
              Primary <span className="font-mono">#890081</span> · Surface white
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
