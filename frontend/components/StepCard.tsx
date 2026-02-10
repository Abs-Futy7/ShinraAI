"use client";

import { useState } from "react";

interface Props {
  step: number;
  title: string;
  status: "pending" | "active" | "done";
  children?: React.ReactNode;
  onFeedback?: () => void;
  canEdit?: boolean;
}

const statusStyles: Record<string, { dot: string; border: string; bg: string }> = {
  pending: { dot: "bg-gray-300", border: "border-gray-200", bg: "bg-white" },
  active:  { dot: "bg-blue-500 animate-pulse", border: "border-blue-200", bg: "bg-blue-50" },
  done:    { dot: "bg-green-500", border: "border-green-700 border-2", bg: "bg-white" },
};

export default function StepCard({ step, title, status, children, onFeedback, canEdit = false }: Props) {
  const [open, setOpen] = useState(status === "done");
  const s = statusStyles[status];
  
  const showFeedbackButton = status === "done" && onFeedback && canEdit;

  return (
    <div className={`border ${s.border} rounded-lg ${s.bg} overflow-hidden`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <span className={`w-3 h-3 rounded-full ${s.dot} flex-shrink-0`} />
        <span className="font-bold text-md text-gray-800">
          Step {step}: {title} Agent
        </span>
        <span className="ml-auto text-sm text-gray-400">
          {status === "active" ? "Running…" : status === "done" ? "Complete" : "Waiting"}
        </span>
        {showFeedbackButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFeedback();
            }}
            className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-gray-700 rounded text-xs font-medium transition flex items-center gap-1"
          >
            ✏️ Edit
          </button>
        )}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && children && (
        <div className="px-4 pb-4 pt-0">{children}</div>
      )}
    </div>
  );
}
