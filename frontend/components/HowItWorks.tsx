"use client";

import { motion } from "framer-motion";
import { FileText, Search, PenTool, CheckCircle2 } from "lucide-react";

const STEPS = [
  {
    icon: FileText,
    title: "Input Requirements",
    description: "Paste your PRD or upload a document to set the context."
  },
  {
    icon: Search,
    title: "AI Research",
    description: "Shinrai browses the web to gather facts and validate claims."
  },
  {
    icon: PenTool,
    title: "Drafting",
    description: "Content is generated with your specific tone and audience in mind."
  },
  {
    icon: CheckCircle2,
    title: "Review & Refine",
    description: "Verify sources in the timeline and export your final content."
  }
];

export default function HowItWorks() {
  return (
    <div className="py-24 border-t border-sage-100/50">
      <div className="text-center max-w-2xl mx-auto mb-20">
        <h2 className="font-serif text-3xl text-primary-900 mb-4">
          How It Works
        </h2>
        <p className="text-gray-500">
          From raw requirements to polished, fact-checked content in minutes.
        </p>
      </div>

      <div className="relative">
        {/* Connecting Line (Desktop) */}
        <div className="hidden lg:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-sage-200 to-transparent" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {STEPS.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              className="relative flex flex-col items-center text-center group"
            >
              <div className="w-24 h-24 bg-white rounded-full border-4 border-paper shadow-xl shadow-sage-200/50 flex items-center justify-center text-primary-600 mb-8 relative z-10 group-hover:border-primary-100 group-hover:scale-105 transition-all duration-300">
                <step.icon size={32} strokeWidth={1.5} />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold border-4 border-paper">
                  {index + 1}
                </div>
              </div>
              
              <h3 className="font-serif text-xl text-primary-900 mb-3">
                {step.title}
              </h3>
              
              <p className="text-sm text-gray-500 leading-relaxed max-w-[200px]">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
