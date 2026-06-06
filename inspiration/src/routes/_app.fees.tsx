import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/erp/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_app/fees")({
  head: () => ({
    meta: [
      { title: "Fees | EduERP" },
      { name: "description", content: "Fees collection and outstanding dues." },
    ],
  }),
  component: FeesPage,
});

const summary = [
  { label: "Total billed", value: "₹58.2L" },
  { label: "Collected", value: "₹42.6L" },
  { label: "Outstanding", value: "₹15.6L" },
  { label: "Defaulters", value: "84" },
];

const ledger = [
  { id: "INV-10241", student: "Aarav Mehta", program: "B.Tech CSE", amount: "₹62,000", due: "Jun 30", status: "Paid" },
  { id: "INV-10242", student: "Isha Verma", program: "B.Sc Physics", amount: "₹48,000", due: "Jun 30", status: "Pending" },
  { id: "INV-10243", student: "Rohan Khanna", program: "MBA", amount: "₹1,20,000", due: "Jun 30", status: "Pending" },
  { id: "INV-10244", student: "Sneha Pillai", program: "B.Com (H)", amount: "₹38,000", due: "May 30", status: "Overdue" },
  { id: "INV-10245", student: "Kabir Singh", program: "B.Tech ECE", amount: "₹62,000", due: "Jun 30", status: "Paid" },
];

function FeesPage() {
  return (
    <>
      <PageHeader
        breadcrumb={["Home", "Operations", "Fees"]}
        title="Fees & collections"
        description="Track invoices, payments and outstanding dues."
        actions={<Button>Generate invoice</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {summary.map((s) => (
          <Card key={s.label} className="border-border/60">
            <CardContent className="p-5">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="text-2xl font-semibold tracking-tight mt-1">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">Recent invoices</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Invoice</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledger.map((l) => (
                <TableRow key={l.id} className="hover:bg-accent/30">
                  <TableCell className="font-mono text-xs">{l.id}</TableCell>
                  <TableCell className="text-sm font-medium">{l.student}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{l.program}</TableCell>
                  <TableCell className="text-sm font-semibold">{l.amount}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{l.due}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        l.status === "Paid"
                          ? "border-primary/30 text-primary bg-primary/5"
                          : l.status === "Pending"
                          ? "border-amber-400/40 text-amber-700 bg-amber-50"
                          : "border-destructive/30 text-destructive bg-destructive/5"
                      }
                    >
                      {l.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
