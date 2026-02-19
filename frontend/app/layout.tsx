import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import Link from "next/link";
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
      <body className="min-h-screen bg-paper text-ink font-sans selection:bg-primary/20 selection:text-primary-900 relative">

        <header className="fixed top-0 left-0 right-0 z-50 bg-paper/80 backdrop-blur-md border-b border-primary/10">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="font-serif font-semibold text-2xl text-primary-600 tracking-tight flex items-center gap-2">
               ShinraAI
            </Link>
            <div className="flex items-center gap-5">
              <Link href="/runs" className="text-xs font-semibold tracking-widest uppercase text-primary-500 hover:text-primary-700">
                Runs
              </Link>
              <Link href="/dashboard" className="text-xs font-semibold tracking-widest uppercase text-primary-500 hover:text-primary-700">
                Dashboard
              </Link>
              <span className="text-xs font-medium tracking-widest uppercase text-primary-400">Agentic Editorial Pipeline</span>
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-6 pt-24 pb-12">{children}</main>
      </body>
    </html>
  );
}
