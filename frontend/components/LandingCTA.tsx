"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

type LandingCTAProps = {
  signedIn: boolean;
};

export default function LandingCTA({ signedIn }: LandingCTAProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-primary-900/40 p-10 text-white shadow-sm md:p-12">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/cta.png')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/75" />
      <div className="absolute inset-0 bg-black/25" />
      <div className="absolute -right-20 -top-16 h-72 w-72 rounded-full bg-fuchsia-400/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-16 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />

      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-100/90">Ready to Start</p>
        <h2 className="mt-3 max-w-3xl font-serif text-4xl leading-tight text-white md:text-5xl">
          Interested in shipping your next editorial workflow faster?
        </h2>
        <p className="mt-4 max-w-2xl text-sm text-emerald-50/90 md:text-base">
          Launch a complete PRD-to-blog run with citations, quality gates, and metrics in one guided flow.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {signedIn ? (
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-primary-800 hover:bg-emerald-50"
            >
              Continue to Studio
              <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link
                href="/auth?mode=signup&next=%2Fstudio"
                className="inline-flex items-center rounded-lg bg-white px-5 py-3 text-sm font-semibold text-primary-800 hover:bg-emerald-50"
              >
                Create Account
              </Link>
              <Link
                href="/auth?mode=signin&next=%2Fstudio"
                className="inline-flex items-center rounded-lg border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
