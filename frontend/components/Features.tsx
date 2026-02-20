"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  ShieldCheck,
  Gauge,
  Database,
  RefreshCw,
  Share2,
} from "lucide-react";

const FEATURES = [
  {
    icon: Sparkles,
    label: "Pipeline",
    title: "End-to-End Agent Pipeline",
    description:
      "Researcher, Writer, Fact-Checker, Style Polisher, and Rubric Grader run as a coordinated workflow instead of a single prompt."
  },
  {
    icon: ShieldCheck,
    label: "Security",
    title: "Auth + Ownership",
    description:
      "Supabase Auth secures access. Runs are tied to a user and protected by ownership checks and RLS policies."
  },
  {
    icon: RefreshCw,
    label: "Quality",
    title: "Quality Gate + Rollback",
    description:
      "Rubric scoring enforces clarity, correctness, and completeness. Failed runs can automatically retry from earlier stages."
  },
  {
    icon: Gauge,
    label: "Observability",
    title: "Operational Visibility",
    description:
      "Track status, logs, token usage, latency, durations, and rubric outcomes across the runs and dashboard surfaces."
  },
  {
    icon: Database,
    label: "Storage",
    title: "Dual Persistence",
    description:
      "Local JSON run state keeps iteration simple while Supabase Postgres stores analytics-grade run, step, and LLM call records."
  },
  {
    icon: Share2,
    label: "Distribution",
    title: "Publishing Extensions",
    description:
      "After the core blog pipeline, generate LinkedIn pack artifacts and optional images from the same run context."
  }
];

export default function Features() {
  return (
    <section className="relative overflow-hidden px-6 py-16 shadow-sm md:px-10 md:py-20">
      

      <div className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary-500">Core Capabilities</p>
          <h2 className="mt-3 font-serif text-4xl text-primary-900 md:text-5xl">
            Built for Traceable Content Ops
          </h2>
          <p className="mt-4 text-sm text-gray-600 md:text-base">
            Clear ownership, measurable quality, and auditable execution from prompt input to final output.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <motion.article
              key={index}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.45 }}
              className="group relative rounded-2xl border border-sage-100 bg-white p-6 shadow-[0_10px_30px_-16px_rgba(6,104,57,0.26)] transition duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-[0_16px_35px_-16px_rgba(6,104,57,0.32)]"
            >
              <div className="absolute left-0 right-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-emerald-400/80 via-primary-500/80 to-cyan-400/80 opacity-0 transition group-hover:opacity-100" />

              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-sage-100 bg-sage-50 text-primary-600 transition duration-300 group-hover:border-primary-200 group-hover:bg-primary-50">
                  <feature.icon size={21} />
                </div>
                <span className="rounded-full bg-sage-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-600">
                  {feature.label}
                </span>
              </div>

              <h3 className="mt-5 font-serif text-2xl text-primary-900">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-gray-600">{feature.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
