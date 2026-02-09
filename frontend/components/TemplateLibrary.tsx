"use client";

import { useState } from "react";
import { PRD_TEMPLATES, type PrdTemplate } from "@/lib/templates";

interface TemplateLibraryProps {
  onSelectTemplate: (content: string) => void;
}

export default function TemplateLibrary({ onSelectTemplate }: TemplateLibraryProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<PrdTemplate | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (template: PrdTemplate) => {
    onSelectTemplate(template.content);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePreview = (template: PrdTemplate) => {
    setSelectedTemplate(template);
  };

  const closePreview = () => {
    setSelectedTemplate(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          📚 Template Library
        </h3>
        <span className="text-sm text-gray-500">
          {PRD_TEMPLATES.length} templates available
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PRD_TEMPLATES.map((template) => (
          <div
            key={template.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
                  {template.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                    {template.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    ~{template.targetWords} words
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {template.description}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(template)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                  copiedId === template.id
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {copiedId === template.id ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Use Template
                  </>
                )}
              </button>
              <button
                onClick={() => handlePreview(template)}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition"
                title="Preview"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedTemplate.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                    {selectedTemplate.category}
                  </span>
                  <span className="text-sm text-gray-500">
                    Target: ~{selectedTemplate.targetWords} words
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {selectedTemplate.description}
                </p>
              </div>
              <button
                onClick={closePreview}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono bg-gray-50 p-4 rounded-lg border border-gray-200">
                {selectedTemplate.content}
              </pre>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closePreview}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleCopy(selectedTemplate);
                  closePreview();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Use This Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
