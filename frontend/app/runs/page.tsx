"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { getMetricsRuns } from "@/lib/api";
import type { MetricsRun } from "@/lib/types";
import { getRunNames } from "@/lib/runNames";
import { useRequireAuth } from "@/lib/useRequireAuth";

function formatMs(ms: number | null | undefined): string {
  if (!ms || ms <= 0) return "-";
  if (ms < 1000) return `${ms} ms`;
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatScore(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  if (Number.isNaN(Number(value))) return "-";
  return Number(value).toFixed(2);
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "DONE":
      return "bg-emerald-100 text-emerald-700";
    case "DONE_WITH_WARNINGS":
      return "bg-amber-100 text-amber-700";
    case "ERROR":
      return "bg-red-100 text-red-700";
    case "RUNNING":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function RunsPage() {
  const { loading: authLoading, isAuthenticated } = useRequireAuth();
  const [runs, setRuns] = useState<MetricsRun[]>([]);
  const [runNames, setRunNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadRuns = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const data = await getMetricsRuns(100);
      setRuns(data);
      setRunNames(getRunNames());
    } catch (err: any) {
      setError(err?.message || "Failed to load runs.");
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadRuns();
    setRunNames(getRunNames());
    const onFocus = () => setRunNames(getRunNames());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [isAuthenticated]);

  const filteredRuns = useMemo(() => {
    if (statusFilter === "ALL") return runs;
    return runs.filter((run) => run.status === statusFilter);
  }, [runs, statusFilter]);

  const statusOptions = useMemo(() => {
    const values = new Set<string>(["ALL"]);
    for (const run of runs) values.add(run.status);
    return Array.from(values);
  }, [runs]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
        <span className="ml-3 text-sm text-gray-500">Checking session...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-500">History</p>
          <h1 className="mt-2 font-serif text-4xl text-primary-900">Runs</h1>
          <p className="mt-2 text-sm text-gray-600">Browse your recent pipeline executions.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadRuns(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-sage-200 bg-white px-3 py-2 text-sm text-primary-700 hover:border-primary-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-lg border border-sage-200 bg-white px-3 py-2 text-sm text-primary-700 hover:border-primary-300"
          >
            Dashboard
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="rounded-xl border border-sage-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-serif text-2xl text-primary-900">Run List</h2>
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-sage-200 bg-paper px-3 py-2 text-sm text-primary-900 outline-none focus:border-primary-500"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-gray-500">Loading runs...</div>
        ) : filteredRuns.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">No runs found for this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-sage-100 text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-3 py-3">Run</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Model</th>
                  <th className="px-3 py-3">Web Search</th>
                  <th className="px-3 py-3">Rubric</th>
                  <th className="px-3 py-3">Gate</th>
                  <th className="px-3 py-3">Prompt</th>
                  <th className="px-3 py-3">Completion</th>
                  <th className="px-3 py-3">Total</th>
                  <th className="px-3 py-3">LLM Latency</th>
                  <th className="px-3 py-3">Duration</th>
                  <th className="px-3 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredRuns.map((run) => (
                  <tr key={run.id} className="border-b border-sage-50 hover:bg-sage-50/40">
                    <td className="px-3 py-3 text-xs">
                      <div className="flex flex-col gap-0.5">
                        <Link href={`/runs/${run.id}`} className="text-primary-700 hover:underline font-semibold">
                          {runNames[run.id] || `${run.id.slice(0, 8)}...`}
                        </Link>
                        <span className="font-mono text-[11px] text-gray-500">{run.id.slice(0, 8)}...</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(run.status)}`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-700">
                      <div className="font-medium">{run.model_provider || "-"}</div>
                      <div className="text-xs text-gray-500">{run.model_name || "-"}</div>
                    </td>
                    <td className="px-3 py-3 text-gray-700">{run.use_web_search ? "Enabled" : "Off"}</td>
                    <td className="px-3 py-3 text-gray-700">{formatScore(run.rubric_overall_score)}</td>
                    <td className="px-3 py-3 text-gray-700">
                      {run.rubric_review_required ? "Review Required" : run.rubric_passed === null || run.rubric_passed === undefined ? "-" : run.rubric_passed ? "Passed" : "Failed"}
                    </td>
                    <td className="px-3 py-3 text-gray-700">{Number(run.prompt_tokens ?? 0).toLocaleString()}</td>
                    <td className="px-3 py-3 text-gray-700">{Number(run.completion_tokens ?? 0).toLocaleString()}</td>
                    <td className="px-3 py-3 text-gray-700">{Number(run.total_tokens ?? 0).toLocaleString()}</td>
                    <td className="px-3 py-3 text-gray-700">{formatMs(run.avg_llm_latency_ms)}</td>
                    <td className="px-3 py-3 text-gray-700">{formatMs(run.duration_ms)}</td>
                    <td className="px-3 py-3 text-gray-700">{formatDate(run.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
