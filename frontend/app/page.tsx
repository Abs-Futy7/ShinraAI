"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRun, executeRun } from "@/lib/api";
import TemplateLibrary from "@/components/TemplateLibrary";
import FileUpload from "@/components/FileUpload";

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
    // Disable web search if switching to Groq
    if (provider === "groq") {
      setUseWebSearch(false);
    }
  };

  const handleTemplateSelect = (content: string) => {
    setPrd(content);
    setShowTemplates(false);
    setUploadedFilename(null);
    // Scroll to PRD textarea
    setTimeout(() => {
      document.querySelector('textarea')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleFileUpload = (text: string, filename: string) => {
    setPrd(text);
    setUploadedFilename(filename);
    setShowUpload(false);
    // Scroll to PRD textarea
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
      // Navigate immediately, execute from the run page
      router.push(`/runs/${run_id}`);
    } catch (e: any) {
      setError(e.message || "Failed to create run");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">PRD → Blog Post</h1>
        <p className="text-gray-500">
          Paste your Product Requirements Document below. Our 4-agent pipeline
          (Researcher → Writer → Fact-Checker → Style Editor) will produce a
          publish-ready blog post with citations.
        </p>
      </div>

      {/* Template Library Section */}
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="w-full flex items-center justify-between text-left mb-4"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📚</span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Try a Sample PRD Template
              </h2>
              <p className="text-sm text-gray-600">
                Quick start with pre-built examples (100-1000 words)
              </p>
            </div>
          </div>
          <svg
            className={`w-6 h-6 text-gray-500 transition-transform ${
              showTemplates ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showTemplates && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <TemplateLibrary onSelectTemplate={handleTemplateSelect} />
          </div>
        )}
      </div>

      {/* File Upload Section */}
      <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="w-full flex items-center justify-between text-left mb-4"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📤</span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Upload PRD File
              </h2>
              <p className="text-sm text-gray-600">
                Upload a PDF, TXT, Markdown, or Image file to extract text (OCR supported)
              </p>
            </div>
          </div>
          <svg
            className={`w-6 h-6 text-gray-500 transition-transform ${
              showUpload ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showUpload && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <FileUpload onTextExtracted={handleFileUpload} />
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto space-y-5">
        {/* PRD Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Requirements Document *
            {uploadedFilename && (
              <span className="ml-2 text-xs text-green-600 font-normal">
                ✓ Loaded from: {uploadedFilename}
              </span>
            )}
          </label>
          <textarea
            rows={10}
            value={prd}
            onChange={(e) => {
              setPrd(e.target.value);
              setUploadedFilename(null);
            }}
            placeholder="Paste your PRD here…"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-y"
          />
        </div>

        {/* Options row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              {TONES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
            <input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. engineers, students, business"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Model Configuration */}
        <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <span>🤖</span> AI Model Configuration
          </h3>
          
          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Provider</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(MODEL_PROVIDERS).map(([key, provider]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleProviderChange(key as "groq" | "gemini")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    modelProvider === key
                      ? "bg-brand-600 text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {provider.name}
                  {!provider.supportsWebSearch && (
                    <span className="ml-1 text-xs opacity-75">(No Web Search)</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Model</label>
            <select
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              {MODEL_PROVIDERS[modelProvider].models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} {model.recommended ? "⭐ Recommended" : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              💡 {modelProvider === "groq" ? "Free tier: 8B model recommended for low token usage" : "Free tier: Flash models recommended for low token usage"}
            </p>
          </div>
        </div>

        {/* Word count */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Word Count: {wordCount}
          </label>
          <input
            type="range"
            min={200}
            max={3000}
            step={100}
            value={wordCount}
            onChange={(e) => setWordCount(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>200</span><span>3000</span>
          </div>
        </div>

        {/* Web search toggle */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={useWebSearch}
              onChange={(e) => setUseWebSearch(e.target.checked)}
              disabled={modelProvider === "groq"}
              className="rounded disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className={modelProvider === "groq" ? "text-gray-400" : ""}>
              Enable web search via SerperDevTool
            </span>
          </label>
          <div className="ml-6 text-xs space-y-1">
            {modelProvider === "groq" ? (
              <p className="text-amber-600">
                ⚠️ Web search requires Gemini models (Groq doesn&apos;t support function calling)
              </p>
            ) : (
              <>
                <p className="text-blue-600">
                  ✓ Available with Gemini models
                </p>
                <p className="text-gray-500">
                  Requires SERPER_API_KEY in backend .env
                </p>
              </>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium rounded-lg py-3 transition"
        >
          {loading ? "Creating run…" : "⚡ Run Agents"}
        </button>
      </div>
    </div>
  );
}
