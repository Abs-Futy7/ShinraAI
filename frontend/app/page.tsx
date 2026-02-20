"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

import { getSupabaseClientSafe } from "@/lib/supabase";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import LandingCTA from "@/components/LandingCTA";
import LandingFooter from "@/components/LandingFooter";
import DarkVeil from "@/components/DarkVeil";
import PricingSection from "@/components/PricingSection";

export default function LandingPage() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClientSafe();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(Boolean(data.session));
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-primary-950/40 p-10 md:p-14 shadow-sm">
        <div className="absolute inset-0">
          <DarkVeil
            hueShift={0}
            noiseIntensity={0}
            scanlineIntensity={0}
            speed={0.5}
            scanlineFrequency={0}
            warpAmount={0}
            resolutionScale={1}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950/35 via-primary-950/15 to-primary-950/35" />

        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-100">ShinraAI</p>
          <h1 className="mt-3 font-serif text-5xl leading-tight text-white md:text-6xl">
            Agentic Editorial Pipeline for Product Teams
          </h1>
          <p className="mt-5 max-w-2xl text-base text-emerald-50/90">
            Turn PRDs into researched, cited, fact-checked, and polished publishable content.
            Sign in with Supabase Auth to keep run history private and user-scoped.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {signedIn ? (
              <Link
                href="/studio"
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700"
              >
                Continue to Studio
                <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link
                  href="/auth?mode=signup&next=%2Fstudio"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700"
                >
                  Sign Up
                </Link>
                <Link
                  href="/auth?mode=signin&next=%2Fstudio"
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-200/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:border-emerald-200/70 hover:bg-white/15"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
      <Features />
      <HowItWorks />
      <PricingSection signedIn={signedIn} />
      <LandingCTA signedIn={signedIn} />
      <LandingFooter />
    </div>
  );
}
