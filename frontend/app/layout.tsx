import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import AppHeader from "@/components/AppHeader";
import "./globals.css";

const fraunces = Fraunces({ 
  subsets: ["latin"], 
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"]
});

const manrope = Manrope({ 
  subsets: ["latin"], 
  variable: "--font-manrope",
  display: "swap" 
});

export const metadata: Metadata = {
  title: "ShinraAI – PRD → Blog Agent Pipeline",
  description: "Automated, editorial-grade content generation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${manrope.variable}`}>
      <body className="min-h-screen overflow-x-hidden bg-paper text-ink font-sans selection:bg-primary/20 selection:text-primary-900 relative">
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute -top-28 right-[-100px] h-72 w-72 rounded-full bg-emerald-100/45 blur-3xl" />
          <div className="absolute -bottom-32 left-[-110px] h-72 w-72 rounded-full bg-cyan-100/40 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(16,185,129,0.08),transparent_36%),radial-gradient(circle_at_24%_82%,rgba(8,145,178,0.1),transparent_34%)]" />
        </div>
        <AppHeader />
        <main className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-12">{children}</main>
      </body>
    </html>
  );
}
