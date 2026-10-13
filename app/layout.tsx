import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Cleva Borderless",
  description: "Save in $, Spend Borderless, Get Paid Globally",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-900 min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
