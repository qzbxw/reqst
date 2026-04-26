import type { Metadata } from "next";
import "./tailwind.css";
import "./globals.css";

const publicSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.PUBLIC_APP_URL || "https://reqst.xyz").replace(/\/+$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(publicSiteUrl),
  title: {
    default: "Reqst | Crypto Payments Infrastructure",
    template: "%s | Reqst"
  },
  description: "Professional crypto processing with instant payouts directly to your wallets. Non-custodial, fixed fees, and support for major networks like TON, Solana, and TRON.",
  openGraph: {
    type: "website",
    siteName: "Reqst",
    title: "Reqst | Crypto Payments Infrastructure",
    description: "Professional crypto processing with instant payouts directly to your wallets.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Reqst - Crypto Payments Infrastructure",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Reqst | Crypto Payments Infrastructure",
    description: "Professional crypto processing with instant payouts directly to your wallets.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
