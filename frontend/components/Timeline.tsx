"use client";

import type { RunState } from "@/lib/types";
import StepCard from "./StepCard";
import SourcesList from "./SourcesList";
import IssuesTable from "./IssuesTable";
import { useState } from "react";

interface TimelineProps {
  state: RunState;
  onFeedback?: (stage: string, stageTitle: string) => void;
  canEdit?: boolean;
}

export default function Timeline({ state, onFeedback, canEdit = false }: TimelineProps) {
  const { steps, citations } = state;
  const [activeDraft, setActiveDraft] = useState(0);

  return (
    <div className="space-y-4">
      {/* Step 1: Research */}
      <StepCard
        step={1}
        title="Researcher"
        status={steps.research ? "done" : state.status === "RUNNING" ? "active" : "pending"}
        onFeedback={() => onFeedback?.("researcher", "Researcher")}
        canEdit={canEdit}
      >
        {steps.research && (
          <div className="space-y-3">
            {steps.research.queries?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Queries</h4>
                <ul className="list-disc pl-5 text-sm text-gray-700">
                  {steps.research.queries.map((q, i) => <li key={i}>{q}</li>)}
                </ul>
              </div>
            )}
            <SourcesList sources={steps.research.sources || []} />
            {steps.research.summary_facts?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Key Facts</h4>
                <ul className="list-disc pl-5 text-sm text-gray-700">
                  {steps.research.summary_facts.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}
            {steps.research.unknowns?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Unknowns</h4>
                <ul className="list-disc pl-5 text-sm text-amber-600">
                  {steps.research.unknowns.map((u, i) => <li key={i}>{u}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </StepCard>

      {/* Step 2: Writer Drafts */}
      <StepCard
        step={2}
        title="Writer"
        status={
          steps.drafts.length > 0
            ? "done"
            : steps.research
              ? state.status === "RUNNING" ? "active" : "pending"
              : "pending"
        }
        onFeedback={() => onFeedback?.("writer", "Writer")}
        canEdit={canEdit}
      >
        {steps.drafts.length > 0 && (
          <div>
            {/* Tabs for iterations */}
            {steps.drafts.length > 1 && (
              <div className="flex gap-1 mb-3">
                {steps.drafts.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveDraft(i)}
                    className={`px-3 py-1 text-xs rounded-full font-medium transition ${
                      activeDraft === i
                        ? "bg-brand-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Draft {d.iteration}
                  </button>
                ))}
              </div>
            )}
            <pre className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 max-h-60 overflow-y-auto whitespace-pre-wrap">
              {steps.drafts[activeDraft]?.text}
            </pre>
          </div>
        )}
      </StepCard>

      {/* Step 3: Fact-Checker */}
      <StepCard
        step={3}
        title="Fact-Checker"
        status={
          steps.fact_checks.length > 0
            ? "done"
            : steps.drafts.length > 0
              ? state.status === "RUNNING" ? "active" : "pending"
              : "pending"
        }
        onFeedback={() => onFeedback?.("fact_checker", "Fact-Checker")}
        canEdit={canEdit}
      >
        {steps.fact_checks.length > 0 && (
          <div className="space-y-3">
            {steps.fact_checks.map((fc, i) => (
              <div key={i} className="border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-gray-500">Iteration {fc.iteration}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      fc.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {fc.passed ? "PASSED" : "FAILED"}
                  </span>
                </div>
                {fc.issues.length > 0 ? (
                  <>
                    <IssuesTable issues={fc.issues} />
                    {fc.rewrite_instructions && (
                      <div className="mt-3 bg-amber-50 border border-amber-200 rounded p-2">
                        <h4 className="text-xs font-semibold text-amber-700 mb-1">Revision Instructions</h4>
                        <p className="text-xs text-amber-700 whitespace-pre-wrap">{fc.rewrite_instructions}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-green-600 bg-green-50 rounded p-2">
                    ✓ All factual claims verified. Content is properly sourced with citations.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </StepCard>

      {/* Step 4: Polisher */}
      <StepCard
        step={4}
        title="Style Editor"
        status={
          steps.final
            ? "done"
            : steps.fact_checks.length > 0
              ? state.status === "RUNNING" ? "active" : "pending"
              : "pending"
        }
        onFeedback={() => onFeedback?.("style_editor", "Style Editor")}
        canEdit={canEdit}
      >
        {steps.final && (
          <p className="text-sm text-green-600">✓ Final polished blog ready below.</p>
        )}
      </StepCard>

      {/* Citations */}
      {citations.length > 0 && (
        <div className="border rounded-lg p-4 bg-white">
          <h3 className="font-semibold text-sm text-gray-700 mb-2">📚 Citations</h3>
          <ol className="list-decimal pl-5 text-sm space-y-1">
            {citations.map((c) => (
              <li key={c.id}>
                <span className="font-mono text-xs text-brand-600">[{c.id}]</span>{" "}
                {c.url.startsWith("http") ? (
                  <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-brand-600 underline">
                    {c.title}
                  </a>
                ) : (
                  <span>{c.title} <span className="text-gray-400">({c.url})</span></span>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
