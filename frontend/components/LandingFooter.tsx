import Link from "next/link";

export default function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden px-7 py-8 text-primary-900 md:px-10 md:py-10">
      
      <div className="relative">
        <div className="flex flex-col items-start justify-between gap-6 pb-7 md:flex-row md:items-end">
          <div className="max-w-md">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-500">Contact</p>
            <p className="mt-3 text-lg leading-snug text-primary-900">
              Interested in working together, trying the platform, or learning more?
            </p>
            <p className="mt-5 text-xs text-primary-700/80">
              Contact: <span className="text-primary-900">hello@shinraai.dev</span>
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-wider text-primary-700 md:justify-end">
            <Link href="/studio" className="transition hover:text-primary-900">
              Studio
            </Link>
            <Link href="/runs" className="transition hover:text-primary-900">
              Runs
            </Link>
            <Link href="/dashboard" className="transition hover:text-primary-900">
              Dashboard
            </Link>
            <Link href="/auth?mode=signin" className="transition hover:text-primary-900">
              Auth
            </Link>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-serif text-5xl tracking-tight text-primary-900 md:text-6xl">ShinraAI</p>
            <p className="mt-2 text-sm text-primary-700">Agentic Editorial Platform</p>
          </div>
          <div className="text-[11px] text-primary-600">
            Copyright {year} ShinraAI. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
