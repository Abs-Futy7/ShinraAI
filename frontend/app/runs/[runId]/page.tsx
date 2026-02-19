"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getRun, executeRun, downloadPdf, triggerPdfDownload, submitFeedback } from "@/lib/api";
import { getRunName, setRunName } from "@/lib/runNames";
import type { RunState } from "@/lib/types";
import Timeline from "@/components/Timeline";
import MarkdownViewer from "@/components/MarkdownViewer";
import FeedbackModal from "@/components/FeedbackModal";

function formatScore(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  if (Number.isNaN(Number(value))) return "-";
  return Number(value).toFixed(2);
}

export default function RunPage() {
  const { runId } = useParams<{ runId: string }>();
  const router = useRouter();
  const [state, setState] = useState<RunState | null>(null);
  const [error, setError] = useState("");
  const [executing, setExecuting] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<{ open: boolean; stage: string; stageTitle: string }>({
    open: false,
    stage: "",
    stageTitle: "",
  });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const executedRef = useRef(false);

  useEffect(() => {
    const existingName = getRunName(runId) || "";
    setDisplayName(existingName);
    setNameDraft(existingName);
    setEditingName(false);
  }, [runId]);

  const fetchState = useCallback(async () => {
    try {
      const data = await getRun(runId);
      setState(data);
      return data;
    } catch (e: any) {
      setError(e.message);
      return null;
    }
  }, [runId]);

  // On mount: fetch state, then execute if PENDING
  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval>;

    const startPolling = () => {
      pollTimer = setInterval(async () => {
        const d = await fetchState();
        if (d && d.status !== "RUNNING" && d.status !== "PENDING") {
          clearInterval(pollTimer);
          setExecuting(false);
          if (d.status === "DONE" || d.status === "DONE_WITH_WARNINGS") {
            setError("");
          }
        }
      }, 3000);
    };

    const init = async () => {
      const data = await fetchState();
      if (cancelled || !data) return;

      if (data.status === "PENDING" && !executedRef.current) {
        executedRef.current = true;
        setExecuting(true);
        let shouldPoll = false;
        try {
          const result = await executeRun(runId);
          if (!cancelled) {
            setState(result);
            if (result.status === "RUNNING" || result.status === "PENDING") {
              shouldPoll = true;
            }
          }
        } catch (e: any) {
          if (!cancelled) {
            shouldPoll = true;
            setError(`Execution request failed (${e.message}). Continuing to sync run status...`);
          }
        } finally {
          if (!cancelled && !shouldPoll) {
            setExecuting(false);
          }
        }

        if (!cancelled && shouldPoll) {
          startPolling();
        }
      } else if (data.status === "RUNNING") {
        startPolling();
      }
    };

    init();
    return () => {
      cancelled = true;
      if (pollTimer!) clearInterval(pollTimer);
    };
  }, [runId, fetchState]);

  const handleFeedbackClick = (stage: string, stageTitle: string) => {
    setFeedbackModal({ open: true, stage, stageTitle });
  };

  const handleFeedbackSubmit = async (feedback: string) => {
    setSubmittingFeedback(true);
    setError("");
    
    try {
      // Submit feedback and trigger re-run
      await submitFeedback(runId, feedbackModal.stage, feedback);
      
      // Close modal
      setFeedbackModal({ open: false, stage: "", stageTitle: "" });
      
      // Fetch updated state
      await fetchState();
      
      // Start polling while re-running
      const pollTimer = setInterval(async () => {
        const d = await fetchState();
        if (d && d.status !== "RUNNING") {
          clearInterval(pollTimer);
          setSubmittingFeedback(false);
        }
      }, 3000);
    } catch (e: any) {
      setError(`Failed to submit feedback: ${e.message}`);
      setSubmittingFeedback(false);
    }
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePdfDownload = async () => {
    setDownloadingPdf(true);
    try {
      const blob = await downloadPdf(runId);
      triggerPdfDownload(runId, blob);
    } catch (e: any) {
      setError(`PDF download failed: ${e.message}`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleSaveName = () => {
    setRunName(runId, nameDraft);
    const updated = getRunName(runId) || "";
    setDisplayName(updated);
    setEditingName(false);
  };

  if (error && !state) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-6 py-4">
        <h2 className="font-semibold">Error</h2>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        <span className="ml-3 text-gray-500">Loading run…</span>
      </div>
    );
  }

  const isActive = executing || state.status === "RUNNING";
  const isDone = ["DONE", "DONE_WITH_WARNINGS", "ERROR"].includes(state.status);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          {editingName ? (
            <div className="flex items-center gap-2 mb-1">
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                maxLength={80}
                placeholder="Run name"
                className="bg-paper border border-sage-200 rounded-lg px-3 py-1.5 text-sm text-primary-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
              />
              <button
                onClick={handleSaveName}
                className="text-xs font-semibold px-2.5 py-1.5 rounded bg-primary-600 text-white hover:bg-primary-700"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setNameDraft(displayName);
                  setEditingName(false);
                }}
                className="text-xs font-semibold px-2.5 py-1.5 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{displayName || "Run Timeline"}</h1>
              <button
                onClick={() => setEditingName(true)}
                className="text-xs font-semibold px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Rename
              </button>
            </div>
          )}
          <p className="text-sm text-gray-400 font-mono">{state.run_id}</p>
        </div>
        <StatusBadge status={state.status} />
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Active spinner */}
      {isActive && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
          <span className="text-sm text-blue-700">Pipeline is running… This may take 1-3 minutes.</span>
        </div>
      )}

      {/* Warning banner */}
      {state.status === "DONE_WITH_WARNINGS" && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6 text-sm text-amber-700">
          ⚠ Pipeline completed with warnings — some fact-check issues remain. Review the fact-check section below.
        </div>
      )}

      {/* Timeline */}
      <Timeline 
        state={state} 
        onFeedback={handleFeedbackClick}
        canEdit={isDone && !submittingFeedback}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackModal.open}
        onClose={() => setFeedbackModal({ open: false, stage: "", stageTitle: "" })}
        onSubmit={handleFeedbackSubmit}
        stageName={feedbackModal.stage}
        stageTitle={feedbackModal.stageTitle}
        submitting={submittingFeedback}
      />

      {/* Final output + downloads */}
      {isDone && state.steps?.final?.markdown && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Final Blog Post</h2>
            {/* LinkedIn Pack Button - Navigate to dedicated page */}
            <button
              onClick={() => router.push(`/runs/${runId}/linkedin`)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition flex items-center gap-2"
            >
              {state.linkedin_pack ? (
                <>💼 View LinkedIn Pack</>
              ) : (
                <>💼 Generate LinkedIn Pack</>
              )}
            </button>
          </div>
          {state.steps?.rubric && (
            <div className="mb-4 rounded-lg border border-sage-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-primary-800 uppercase tracking-wider">Rubric Scores</h3>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    state.steps.rubric.review_required
                      ? "bg-red-100 text-red-700"
                      : state.steps.rubric.passed
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {state.steps.rubric.review_required
                    ? "Review Required"
                    : state.steps.rubric.passed
                      ? "Passed"
                      : "Failed"}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4 text-sm">
                <div className="rounded border border-sage-100 px-3 py-2">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Clarity</div>
                  <div className="font-semibold text-primary-900">{formatScore(state.steps.rubric.scores?.clarity)}/5</div>
                </div>
                <div className="rounded border border-sage-100 px-3 py-2">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Correctness</div>
                  <div className="font-semibold text-primary-900">{formatScore(state.steps.rubric.scores?.correctness)}/5</div>
                </div>
                <div className="rounded border border-sage-100 px-3 py-2">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Completeness</div>
                  <div className="font-semibold text-primary-900">{formatScore(state.steps.rubric.scores?.completeness)}/5</div>
                </div>
                <div className="rounded border border-sage-100 px-3 py-2">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Overall</div>
                  <div className="font-semibold text-primary-900">{formatScore(state.steps.rubric.scores?.overall)}/5</div>
                </div>
              </div>
            </div>
          )}
          <MarkdownViewer content={state.steps.final.markdown} />
          <div className="flex gap-3 mt-4">
            <button
              onClick={handlePdfDownload}
              disabled={downloadingPdf}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition flex items-center gap-2"
            >
              {downloadingPdf ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Generating PDF...
                </>
              ) : (
                <>📄 Download PDF</>
              )}
            </button>
            <button
              onClick={() => downloadFile(state.steps.final!.markdown, "blog-post.md")}
              className="bg-green-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              ⬇ Download .md
            </button>
            <button
              onClick={() => downloadFile(JSON.stringify(state, null, 2), "state.json")}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              ⬇ Download state.json
            </button>
          </div>
        </div>
      )}

      {/* Logs */}
      {state.logs && state.logs.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-700">
            📋 Logs ({state.logs.length} entries)
          </summary>
          <pre className="mt-2 bg-gray-900 text-green-400 rounded-lg p-4 text-xs max-h-80 overflow-y-auto">
            {state.logs.join("\n")}
          </pre>
        </details>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: "bg-gray-100 text-gray-600",
    RUNNING: "bg-blue-100 text-blue-700",
    DONE: "bg-green-100 text-green-700",
    DONE_WITH_WARNINGS: "bg-amber-100 text-amber-700",
    ERROR: "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status] || colors.PENDING}`}>
      {status}
    </span>
  );
}
