import { createFileRoute } from "@tanstack/react-router";
import { ErpLayout } from "@/components/erp/ErpLayout";

export const Route = createFileRoute("/_app")({
  component: ErpLayout,
});
