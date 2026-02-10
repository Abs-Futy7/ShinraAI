"use client";

import { useState } from "react";
import { PRD_TEMPLATES, type PrdTemplate } from "@/lib/templates";
import { Check, Copy, Eye, X, BookOpen, Clock, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-sage-100">
        <h3 className="text-lg font-serif font-medium text-primary-900 flex items-center gap-2">
          <BookOpen className="text-primary-500" size={20} />
          Curated Templates
        </h3>
        <span className="text-xs font-mono text-gray-400 bg-sage-50 px-2 py-1 rounded">
          {PRD_TEMPLATES.length} Available
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRD_TEMPLATES.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group relative bg-white border border-sage-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-300 flex flex-col h-full"
          >
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                 <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-2 py-1 rounded-sm border border-primary-100/50">
                    {template.category}
                 </span>
                 <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={12} />
                    <span>~{template.targetWords}w</span>
                 </div>
              </div>
              
              <h4 className="font-serif text-lg text-primary-900 mb-2 group-hover:text-primary-600 transition-colors">
                {template.title}
              </h4>
              
              <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">
                {template.description}
              </p>
            </div>

            <div className="flex gap-2 pt-4 border-t border-sage-50">
              <button
                onClick={() => handleCopy(template)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  copiedId === template.id
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow"
                )}
              >
                {copiedId === template.id ? (
                  <>
                    <Check size={14} /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Use
                  </>
                )}
              </button>
              <button
                onClick={() => handlePreview(template)}
                className="px-3 py-2 border border-sage-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-sage-50 hover:text-primary-700 transition-colors"
                title="Preview Template"
              >
                <Eye size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {selectedTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-primary-900/20 backdrop-blur-sm"
               onClick={closePreview}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col relative z-10 border border-sage-100 overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-sage-100 flex items-start justify-between bg-paper">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-2 py-1 rounded-sm border border-primary-100/50">
                        {selectedTemplate.category}
                    </span>
                  </div>
                  <h3 className="text-2xl font-serif text-primary-900">
                    {selectedTemplate.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                    {selectedTemplate.description}
                  </p>
                </div>
                <button
                  onClick={closePreview}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-sage-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-8 py-8 bg-paper/50">
                <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-sage-100">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
                    {selectedTemplate.content}
                  </pre>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-sage-100 bg-white flex justify-end gap-3">
                <button
                  onClick={closePreview}
                  className="px-5 py-2.5 border border-sage-200 text-gray-700 rounded-xl font-medium hover:bg-sage-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleCopy(selectedTemplate);
                    closePreview();
                  }}
                  className="px-5 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 shadow-md shadow-primary-900/10 transition-all flex items-center gap-2"
                >
                  <Copy size={16} /> Use This Template
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
