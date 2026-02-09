"use client";

import { useState } from "react";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: string) => void;
  stageName: string;
  stageTitle: string;
  submitting: boolean;
}

export default function FeedbackModal({
  isOpen,
  onClose,
  onSubmit,
  stageName,
  stageTitle,
  submitting,
}: FeedbackModalProps) {
  const [feedback, setFeedback] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (feedback.trim()) {
      onSubmit(feedback);
      setFeedback("");
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setFeedback("");
      onClose();
    }
  };

  const rerunInfo: Record<string, string> = {
    researcher: "This will re-run: Researcher → Writer → Fact-Checker → Style Editor",
    writer: "This will re-run: Writer → Fact-Checker → Style Editor",
    fact_checker: "This will re-run: Fact-Checker → Style Editor",
    style_editor: "This will re-run: Style Editor only",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Give Feedback: {stageTitle}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {rerunInfo[stageName]}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 flex-1 overflow-y-auto">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What would you like to improve or change?
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={`Example: "Please add more details about pricing comparison" or "The tone feels too formal, make it more casual"`}
            className="w-full h-40 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
            disabled={submitting}
          />
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-blue-900 mb-1">💡 Tips for effective feedback:</h4>
            <ul className="text-xs text-blue-700 space-y-1 list-disc pl-5">
              <li>Be specific about what you want changed</li>
              <li>Mention specific sections or points if applicable</li>
              <li>Explain why something doesn't work for you</li>
              <li>Suggest alternatives or improvements</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            ⏱️ Re-running may take 1-3 minutes
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={submitting}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!feedback.trim() || submitting}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Submitting...
                </>
              ) : (
                <>
                  🔄 Submit & Re-run
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
