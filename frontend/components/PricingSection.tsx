"use client";

import Link from "next/link";

type PricingSectionProps = {
  signedIn: boolean;
};

const plans = [
  {
    name: "Free (Trial)",
    price: "$0",
    priceBdt: "BDT 0",
    cadence: "/month",
    badge: "Trial",
    featured: false,
    items: [
      "3 runs per month",
      "No web research (or very limited)",
      "Basic blog output only",
    ],
  },
  {
    name: "Starter (Solo)",
    price: "$9",
    priceBdt: "BDT 999",
    cadence: "/month",
    badge: "Popular",
    featured: false,
    items: [
      "30 runs per month",
      "Token budget cap: 300k tokens/month",
      "Basic logs and export",
    ],
  },
  {
    name: "Pro (Creator)",
    price: "$19",
    priceBdt: "BDT 1,999",
    cadence: "/month",
    badge: "Best Value",
    featured: true,
    items: [
      "120 runs per month",
      "Token budget cap: 1M tokens/month",
      "Web research enabled",
      "Rubric quality gate + retry/rollback",
      "Full audit logs + dashboard",
    ],
  },
  
];

const addOns = [
  {
    name: "Run Pack 50",
    price: "$10",
    priceBdt: "BDT 1,000",
    details: "One-time top-up for extra usage.",
  },
  {
    name: "Run Pack 200",
    price: "$30",
    priceBdt: "BDT 3,000",
    details: "One-time top-up for power users.",
  },
];

export default function PricingSection({ signedIn }: PricingSectionProps) {
  const ctaHref = signedIn ? "/studio" : "/auth?mode=signup&next=%2Fstudio";
  const ctaLabel = signedIn ? "Go to Studio" : "Start Free";

  return (
    <section className="space-y-10 mb-20">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary-500">Pricing</p>
        <h2 className="mt-2 font-serif text-4xl text-primary-900 md:text-5xl">Plans Built Around Usage Caps</h2>
        <p className="mx-auto mt-4 max-w-3xl text-sm text-gray-600 md:text-base">
          Main pricing is subscription-based with run and token caps. This keeps usage predictable while aligning with
          token-based LLM costs.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`rounded-2xl border bg-white p-6 shadow-sm transition ${
              plan.featured
                ? "border-primary-400 ring-2 ring-primary-200/70"
                : "border-sage-100 hover:border-primary-200"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-serif text-2xl text-primary-900">{plan.name}</h3>
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                  plan.featured ? "bg-primary-100 text-primary-700" : "bg-sage-100 text-primary-600"
                }`}
              >
                {plan.badge}
              </span>
            </div>

            <div className="mt-4">
              <p className="font-serif text-4xl text-primary-900">{plan.price}</p>
              <p className="mt-1 text-xs text-gray-500">
                {plan.cadence} · {plan.priceBdt}
              </p>
            </div>

            <ul className="mt-5 space-y-2 text-sm text-gray-700">
              {plan.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-primary-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link
              href={ctaHref}
              className={`mt-6 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold ${
                plan.featured
                  ? "bg-primary-600 text-white hover:bg-primary-700"
                  : "border border-sage-200 bg-paper text-primary-700 hover:border-primary-300"
              }`}
            >
              {ctaLabel}
            </Link>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border border-sage-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="font-serif text-3xl text-primary-900">Credit Pack Add-ons</h3>
            <p className="mt-1 text-sm text-gray-600">
              For users who do not want subscriptions, offer one-time run top-ups.
            </p>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-500">One-time purchase</p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          {addOns.map((pack) => (
            <div key={pack.name} className="rounded-xl border border-sage-100 bg-paper p-5">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">{pack.name}</p>
              <p className="mt-2 font-serif text-3xl text-primary-900">{pack.price}</p>
              <p className="mt-1 text-xs text-gray-500">{pack.priceBdt}</p>
              <p className="mt-3 text-sm text-gray-700">{pack.details}</p>
            </div>
          ))}
        </div>
      </div>

      
    </section>
  );
}
