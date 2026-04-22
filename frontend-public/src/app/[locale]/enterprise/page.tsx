import { PlanPage } from "@/components/PlanPageClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reqst Enterprise | Custom Infrastructure",
  description: "High throughput, expanded API limits, and priority support for large-scale systems.",
  openGraph: {
    title: "Reqst Enterprise",
    description: "Enterprise scale direct-to-wallet infrastructure.",
  },
};

export default function Page() {
  return <PlanPage variant="enterprise" />;
}
