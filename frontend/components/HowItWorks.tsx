"use client";

import { motion } from "framer-motion";
import { LogIn, FileText, Search, RefreshCw, BarChart3, Share2 } from "lucide-react";

const STEPS = [
  {
    icon: LogIn,
    stage: "Access",
    title: "Authenticate",
    description: "Sign in with Supabase Auth. Every run is tied to your user and protected by ownership checks."
  },
  {
    icon: FileText,
    stage: "Input",
    title: "Create a Run",
    description: "In Studio, submit PRD, tone, audience, model route, and optional web-search settings."
  },
  {
    icon: Search,
    stage: "Execute",
    title: "Pipeline A Executes",
    description: "Research -> Writer -> Fact-Checker loop -> Style Polisher execute with per-step timeline logs."
  },
  {
    icon: RefreshCw,
    stage: "Gate",
    title: "Quality Gate Applies",
    description: "Rubric scoring checks clarity, correctness, and completeness. Failed outputs can rollback and retry."
  },
  {
    icon: BarChart3,
    stage: "Observe",
    title: "Monitor Reliability",
    description: "Use /runs for per-run detail and /dashboard for aggregate token, latency, and quality metrics."
  },
  {
    icon: Share2,
    stage: "Deliver",
    title: "Ship and Extend",
    description: "Export the final blog, then optionally run LinkedIn pack and image generation downstream."
  }
];

export default function HowItWorks() {
  return (
    <section className="relative px-2 py-16 md:py-20">
      <div className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-500">Workflow</p>
          <h2 className="mt-3 font-serif text-4xl text-primary-900 md:text-5xl">How It Works</h2>
          <p className="mt-4 text-sm text-gray-600 md:text-base">
            A structured, inspectable pipeline from authenticated input to publish-ready output.
          </p>
        </div>

        <div className="relative mt-14">
          <div className="pointer-events-none absolute left-0 right-0 top-11 hidden h-px bg-gradient-to-r from-transparent via-sage-300/90 to-transparent lg:block" />
          <div className="pointer-events-none absolute left-0 right-0 top-[25.25rem] hidden h-px bg-gradient-to-r from-transparent via-sage-300/90 to-transparent lg:block" />
          <div className="pointer-events-none absolute left-1/2 top-11 hidden h-[22.4rem] w-px -translate-x-1/2 bg-gradient-to-b from-sage-300/80 via-sage-300/30 to-sage-300/80 lg:block" />

          <div className="grid grid-cols-1 gap-y-12 gap-x-5 md:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((step, index) => (
              <motion.article
                key={index}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.07, duration: 0.4 }}
                className="group relative flex flex-col items-center text-center"
              >
                <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full border border-sage-200 bg-white text-primary-600 shadow-[0_12px_24px_-16px_rgba(6,104,57,0.45)] transition duration-300 group-hover:-translate-y-1 group-hover:border-primary-200 group-hover:shadow-[0_16px_28px_-14px_rgba(6,104,57,0.52)]">
                  <step.icon size={28} strokeWidth={1.8} />
                  <span className="absolute -right-2 -top-2 inline-flex min-w-8 items-center justify-center rounded-full bg-primary-600 px-2 py-1 text-[11px] font-bold text-white">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-500">{step.stage}</p>
                <h3 className="mt-2 font-serif text-4xl leading-[1.15] text-primary-900">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-[20rem] text-sm leading-8 text-gray-600">{step.description}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
