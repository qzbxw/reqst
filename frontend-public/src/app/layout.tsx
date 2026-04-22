import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reqst | Crypto Payments Infrastructure",
  description: "Professional crypto processing with instant payouts directly to your wallets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
