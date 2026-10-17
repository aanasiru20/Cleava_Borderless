import type { Metadata } from "next";
import "./globals.css";
import MobileFrame from "@/components/MobileFrame";

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
      <body className="min-h-screen bg-[#070d1a] antialiased">
        <MobileFrame>{children}</MobileFrame>
      </body>
    </html>
  );
}
