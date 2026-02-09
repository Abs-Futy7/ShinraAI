import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shinrai – PRD → Blog Agent Pipeline",
  description: "CrewAI + Groq multi-agent orchestration for transforming PRDs into polished blog posts",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b bg-white">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="font-bold text-xl text-brand-700 tracking-tight">
              ⚡ Shinrai
            </a>
            <span className="text-xs text-gray-400">CrewAI + Groq Agent Pipeline</span>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
