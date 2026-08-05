import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "YGO Manager | Master Duel Deck & Collection Manager",
  description: "Yu-Gi-Oh! collection management, deck builder, and card usage tracker inspired by Master Duel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="min-h-screen bg-[#090c15] text-slate-100 antialiased selection:bg-amber-500/30 selection:text-amber-200">
        <div className="min-h-screen lg:flex">
          <Sidebar />

          <div className="min-w-0 flex-1 flex flex-col">
            <MobileNav />
            <div className="flex-1">{children}</div>
          </div>
        </div>
      </body>
    </html>
  );
}
