import { PlanPage } from "@/components/PlanPageClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reqst Developer | API & Webhooks",
  description: "Professional API v1 Beta and Webhook notifications for high-load projects.",
  openGraph: {
    title: "Reqst Developer",
    description: "API and Webhooks for direct-to-wallet processing.",
  },
};

export default function Page() {
  return <PlanPage variant="dev" />;
}
