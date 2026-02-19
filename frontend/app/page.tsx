"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRun } from "@/lib/api";
import { setRunName } from "@/lib/runNames";
import TemplateLibrary from "@/components/TemplateLibrary";
import FileUpload from "@/components/FileUpload";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Search, Type, Users, FileText, Settings2, Globe, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const TONES = ["professional", "friendly", "playful", "academic", "casual"];

const MODEL_PROVIDERS = {
  groq: {
    name: "Groq",
    models: [
      { id: "groq/llama-3.1-8b-instant", name: "Llama 3.1 8B (Fast, Low Tokens)", recommended: true },
      { id: "groq/llama-3.3-70b-versatile", name: "Llama 3.3 70B (Best Quality)" },
      { id: "groq/meta-llama/llama-4-scout-17b-16e-instruct", name: "Llama 4 Scout 17B" },
    ],
    supportsWebSearch: false,
  },
  gemini: {
    name: "Google Gemini",
    models: [
      { id: "gemini/gemini-2.5-flash", name: "Gemini 2.5 Flash (Fast, Low Cost)", recommended: true },
      { id: "gemini/gemini-1.5-flash", name: "Gemini 1.5 Flash" },
      { id: "gemini/gemini-1.5-pro", name: "Gemini 1.5 Pro (Best Quality)" },
    ],
    supportsWebSearch: true,
  },
};

export default function Home() {
  const router = useRouter();
  const [runName, setRunNameInput] = useState("");
  const [prd, setPrd] = useState("");
  const [tone, setTone] = useState("professional");
  const [audience, setAudience] = useState("engineers");
  const [wordCount, setWordCount] = useState(800);
  const [modelProvider, setModelProvider] = useState<"groq" | "gemini">("groq");
  const [modelName, setModelName] = useState(MODEL_PROVIDERS.groq.models[0].id);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTemplates, setShowTemplates] = useState(true);
  const [showUpload, setShowUpload] = useState(true);
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);

  const handleProviderChange = (provider: "groq" | "gemini") => {
    setModelProvider(provider);
    setModelName(MODEL_PROVIDERS[provider].models[0].id);
    if (provider === "groq") {
      setUseWebSearch(false);
    }
  };

  const handleTemplateSelect = (content: string) => {
    setPrd(content);
    setShowTemplates(false);
    setUploadedFilename(null);
    setTimeout(() => {
      document.querySelector('textarea')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleFileUpload = (text: string, filename: string) => {
    setPrd(text);
    setUploadedFilename(filename);
    setShowUpload(false);
    setTimeout(() => {
      document.querySelector('textarea')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleSubmit = async () => {
    if (!prd.trim()) {
      setError("Please paste a PRD first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { run_id } = await createRun({
        prd,
        tone,
        audience,
        word_count: wordCount,
        use_web_search: useWebSearch,
        model_provider: modelProvider,
        model_name: modelName,
      });
      if (runName.trim()) {
        setRunName(run_id, runName);
      }
      router.push(`/runs/${run_id}`);
    } catch (e: any) {
      setError(e.message || "Failed to create run");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-8xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="mb-16 text-center"
      >
        <span className="inline-block mb-4 px-3 py-1 rounded-full bg-sage-100 text-primary-800 text-xs font-bold uppercase tracking-widest border border-sage-200">
          Editorial Agent Pipeline
        </span>
        <h1 className="font-serif text-5xl md:text-6xl text-primary-900 mb-6 leading-tight tracking-tight">
          Turn Requirements into <span className="italic text-primary-600">Stories.</span>
        </h1>
        <p className="font-sans text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Orchestrate a team of AI agents to transform your technical PRD into a polished, publish-ready blog post.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Main PRD Input Section - Takes up 2 columns */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="lg:col-span-2 bg-white rounded-2xl shadow-xl shadow-sage-200/50 border border-sage-100 p-8 md:p-10 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 to-primary-600" />
          
          {/* PRD Input */}
          <div className="mb-8">
            <label className="flex items-center gap-2 text-sm font-bold text-primary-800 uppercase tracking-wider mb-3">
              Run Name (Optional)
            </label>
            <input
              value={runName}
              onChange={(e) => setRunNameInput(e.target.value)}
              placeholder="e.g. Dark Mode Launch Blog"
              maxLength={80}
              className="w-full bg-paper border border-sage-200 rounded-lg px-4 py-3 text-sm text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors mb-5"
            />

            <label className="flex items-center justify-between font-serif text-xl text-primary-900 mb-4">
              <span>Product Requirements</span>
              {uploadedFilename && (
                <span className="flex items-center gap-2 text-xs font-sans font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  <CheckCircle2 size={12} />
                  Loaded: {uploadedFilename}
                </span>
              )}
            </label>
            <div className="relative group">
              <textarea
                rows={12}
                value={prd}
                onChange={(e) => {
                  setPrd(e.target.value);
                  setUploadedFilename(null);
                }}
                placeholder="Paste your PRD content here..."
                className="w-full bg-paper border-2 border-sage-200 rounded-xl px-5 py-4 text-sm font-mono text-gray-700 focus:ring-0 focus:border-primary-500 outline-none resize-y transition-all placeholder:text-gray-400 leading-relaxed"
              />
              <div className="absolute bottom-4 right-4 text-xs text-gray-400 pointer-events-none font-medium">
                Writing Assistant Ready
              </div>
            </div>
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div className="space-y-6">
               <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-primary-800 uppercase tracking-wider mb-3">
                    <Type size={16} /> Tone of Voice
                  </label>
                  <div className="relative">
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full appearance-none bg-paper border border-sage-200 rounded-lg px-4 py-3 text-sm text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
                    >
                      {TONES.map((t) => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </div>
               </div>

               <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-primary-800 uppercase tracking-wider mb-3">
                    <Users size={16} /> Target Audience
                  </label>
                  <input
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="e.g. Senior Engineers"
                    className="w-full bg-paper border border-sage-200 rounded-lg px-4 py-3 text-sm text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
                  />
               </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-primary-800 uppercase tracking-wider mb-3">
                  <Sparkles size={16} /> AI Provider
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(MODEL_PROVIDERS).map(([key, provider]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleProviderChange(key as "groq" | "gemini")}
                      className={cn(
                        "px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 border",
                        modelProvider === key
                          ? "bg-primary-600 text-white border-primary-600 shadow-md transform scale-[1.02]"
                          : "bg-paper text-gray-600 border-sage-200 hover:border-primary-300 hover:bg-white"
                      )}
                    >
                      {provider.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-primary-800 uppercase tracking-wider mb-3">
                  <Settings2 size={16} /> Model Route
                </label>
                <div className="relative">
                  <select
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="w-full appearance-none bg-paper border border-sage-200 rounded-lg px-4 py-3 text-sm text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
                  >
                    {MODEL_PROVIDERS[modelProvider].models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-10 p-6 bg-sage-50 rounded-xl border border-sage-100">
            <label className="flex items-center justify-between text-sm font-bold text-primary-800 uppercase tracking-wider mb-4">
              <span>Word Count Target</span>
              <span className="text-primary-600 font-mono text-base">{wordCount} words</span>
            </label>
            <input
              type="range"
              min={200}
              max={3000}
              step={100}
              value={wordCount}
              onChange={(e) => setWordCount(Number(e.target.value))}
              className="w-full h-2 bg-sage-200 rounded-lg appearance-none cursor-pointer accent-primary-600 hover:accent-primary-500 transition-all"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2 font-mono">
              <span>Short (200)</span>
              <span>Long Form (3000)</span>
            </div>
          </div>

          <div className="flex items-start gap-3 mb-10 p-4 rounded-lg bg-orange-50 border border-orange-100/50">
             <div className={`mt-0.5 ${modelProvider === "groq" ? "opacity-30" : "text-primary-600"}`}>
               <Globe size={18} />
             </div>
             <div className="flex-1">
              <label className={cn(
                "flex items-center gap-3 text-sm font-medium cursor-pointer transition-colors",
                modelProvider === "groq" ? "text-gray-400 cursor-not-allowed" : "text-primary-900"
              )}>
                <input
                  type="checkbox"
                  checked={useWebSearch}
                  onChange={(e) => setUseWebSearch(e.target.checked)}
                  disabled={modelProvider === "groq"}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                />
                Enable Research Agent (Web Search)
              </label>
              <p className="text-xs text-gray-500 mt-1 pl-7">
                 {modelProvider === "groq" 
                   ? "Web search requires Gemini function calling capabilities." 
                   : "Allows the researcher to fact-check and find live citations via SerperDev."}
              </p>
             </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-center gap-2"
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-70 disabled:cursor-not-allowed text-white text-lg font-serif tracking-wide py-4 px-6 rounded-xl shadow-lg shadow-primary-900/10 hover:shadow-primary-900/20 transition-all duration-300 transform active:scale-[0.99] flex items-center justify-center gap-3 group"
          >
            {loading ? (
               <>
                 <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 Initializing Agents...
               </>
            ) : (
               <>
                 Start Editorial Pipeline <ArrowRight className="group-hover:translate-x-1 transition-transform" />
               </>
            )}
          </button>
        </motion.div>

        {/* File Upload Section - Takes up 1 column */}
        <div className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(6,104,57,0.05)] border border-sage-100 p-8 hover:border-primary-200 transition-colors duration-300 h-full"
          >
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="w-full flex items-center justify-between text-left mb-6 group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-sage-50 text-primary-700 rounded-lg group-hover:bg-primary-50 transition-colors">
                   <Settings2 size={24} />
                </div>
                <div>
                  <h2 className="font-serif text-xl text-primary-900">
                    Upload Document
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    PDF, TXT, or Markdown supported
                  </p>
                </div>
              </div>
            </button>
            
            <AnimatePresence>
              {showUpload && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-2 border-t border-sage-100">
                    <FileUpload onTextExtracted={handleFileUpload} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Template Library Section - Bottom Row */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(6,104,57,0.05)] border border-sage-100 p-8 hover:border-primary-200 transition-colors duration-300 mb-12"
      >
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="w-full flex items-center justify-between text-left mb-6 group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-sage-50 text-primary-700 rounded-lg group-hover:bg-primary-50 transition-colors">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="font-serif text-xl text-primary-900">
                Load a Template
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Start with a pre-structured example
              </p>
            </div>
          </div>
        </button>
        
        <AnimatePresence>
          {showTemplates && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2 border-t border-sage-100">
                <TemplateLibrary onSelectTemplate={handleTemplateSelect} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* New Sections */}
      <Features />
      <HowItWorks />
    </div>
  );
}
