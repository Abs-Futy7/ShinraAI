"use client";

import { motion } from "framer-motion";
import { Sparkles, FileSearch, ShieldCheck, Zap } from "lucide-react";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Research Agent",
    description: "Autonomous research capability that browses the web to find relevant, up-to-date information for your content."
  },
  {
    icon: ShieldCheck,
    title: "Verifiable Accuracy",
    description: "Every claim is backed by a live citation. We prioritize factual correctness and source transparency."
  },
  {
    icon: FileSearch,
    title: "Deep Context",
    description: "Upload your existing documents (PDF, TXT, MD) to provide context and ground the AI in your specific knowledge base."
  },
  {
    icon: Zap,
    title: "Model Agnostic",
    description: "Switch seamlessly between Gemini Pro for long-context reasoning and Groq/Llama for blazing fast generation."
  }
];

export default function Features() {
  return (
    <div className="py-24">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h2 className="font-serif text-3xl text-primary-900 mb-4">
          Why Choose Shinrai?
        </h2>
        <p className="text-gray-500">
          Built for engineers and product teams who need accuracy, not just fluency.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {FEATURES.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="bg-white/50 backdrop-blur-sm border border-sage-100 p-6 rounded-2xl hover:bg-white hover:shadow-lg hover:shadow-sage-200/50 hover:border-primary-100 transition-all duration-300 group"
          >
            <div className="w-12 h-12 bg-white rounded-xl border border-sage-100 flex items-center justify-center text-primary-600 mb-6 group-hover:scale-110 group-hover:bg-primary-50 group-hover:border-primary-100 transition-all duration-300 shadow-sm">
              <feature.icon size={24} />
            </div>
            
            <h3 className="font-serif text-lg text-primary-900 mb-3 group-hover:text-primary-700 transition-colors">
              {feature.title}
            </h3>
            
            <p className="text-sm text-gray-500 leading-relaxed">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
