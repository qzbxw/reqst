import { LegalPage } from "@/components/LegalPageClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Reqst",
  description: "Privacy policy and data processing agreement for Reqst.",
  openGraph: {
    title: "Privacy Policy",
    description: "Reqst Privacy Policy",
  },
};

export default function Page() {
  return <LegalPage variant="privacy" />;
}
