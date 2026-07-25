import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "YGO Manager",
  description: "Yu-Gi-Oh! collection and deck manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-slate-50 lg:flex">
          <Sidebar />

          <div className="min-w-0 flex-1">
            <MobileNav />
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
