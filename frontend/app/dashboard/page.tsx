"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, CheckCircle2, Clock3, RefreshCw } from "lucide-react";
import { getMetricsRuns, getMetricsSummary } from "@/lib/api";
import type { MetricsRun, MetricsSummaryResponse } from "@/lib/types";
import { getRunNames } from "@/lib/runNames";

type DashboardData = {
  summary: MetricsSummaryResponse | null;
  runs: MetricsRun[];
};

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

function formatDay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({ summary: null, runs: [] });
  const [runNames, setRunNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const [summary, runs] = await Promise.all([getMetricsSummary(), getMetricsRuns(50)]);
      setData({ summary, runs });
      setRunNames(getRunNames());
    } catch (err: any) {
      setError(err?.message || "Failed to load dashboard metrics.");
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setRunNames(getRunNames());
    const onFocus = () => setRunNames(getRunNames());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const headline = data.summary?.headline;
  const totalRuns = Number(headline?.total_runs ?? 0);
  const completedRuns = Number(headline?.completed_runs ?? 0);
  const avgDurationMs = headline?.avg_duration_ms ?? null;

  const completionRate = useMemo(() => {
    if (totalRuns === 0) return 0;
    return Math.round((completedRuns / totalRuns) * 100);
  }, [completedRuns, totalRuns]);

  const totalPromptTokens = Number(headline?.prompt_tokens ?? 0);
  const totalCompletionTokens = Number(headline?.completion_tokens ?? 0);
  const totalTokens = Number(headline?.total_tokens ?? 0);
  const avgLlmLatencyMs = headline?.avg_llm_latency_ms ?? null;
  const rubricAvgOverall = headline?.rubric_avg_overall ?? null;
  const rubricPassRate = headline?.rubric_pass_rate ?? null;
  const rubricScoredRuns = Number(headline?.rubric_scored_runs ?? 0);

  const chartData = useMemo(
    () =>
      (data.summary?.daily ?? []).map((point) => ({
        dayLabel: formatDay(point.day),
        runs: Number(point.runs ?? 0),
        errors: Number(point.errors ?? 0),
      })),
    [data.summary?.daily],
  );

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-500">Operations</p>
          <h1 className="mt-2 font-serif text-4xl text-primary-900">Pipeline Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Reliability and throughput across your PRD to Blog workflow.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-sage-200 bg-white px-3 py-2 text-sm text-primary-700 hover:border-primary-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <Link
            href="/"
            className="inline-flex items-center rounded-lg border border-sage-200 bg-white px-3 py-2 text-sm text-primary-700 hover:border-primary-300"
          >
            Back to Home
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-sage-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-500">Total Runs</p>
            <Activity size={16} className="text-primary-500" />
          </div>
          <p className="mt-3 font-serif text-3xl text-primary-900">{loading ? "-" : totalRuns}</p>
        </div>
        <div className="rounded-xl border border-sage-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-500">Completion Rate</p>
            <CheckCircle2 size={16} className="text-primary-500" />
          </div>
          <p className="mt-3 font-serif text-3xl text-primary-900">{loading ? "-" : `${completionRate}%`}</p>
          <p className="mt-1 text-xs text-gray-500">
            {loading ? "" : `${completedRuns} completed / ${totalRuns} total`}
          </p>
        </div>
        <div className="rounded-xl border border-sage-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-500">Avg Duration</p>
            <Clock3 size={16} className="text-primary-500" />
          </div>
          <p className="mt-3 font-serif text-3xl text-primary-900">{loading ? "-" : formatMs(avgDurationMs)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-sage-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-500">Prompt Tokens</p>
          <p className="mt-3 font-serif text-2xl text-primary-900">
            {loading ? "-" : totalPromptTokens.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-sage-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-500">Completion Tokens</p>
          <p className="mt-3 font-serif text-2xl text-primary-900">
            {loading ? "-" : totalCompletionTokens.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-sage-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-500">Total Tokens</p>
          <p className="mt-3 font-serif text-2xl text-primary-900">
            {loading ? "-" : totalTokens.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-sage-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-500">Avg LLM Latency</p>
          <p className="mt-3 font-serif text-2xl text-primary-900">{loading ? "-" : formatMs(avgLlmLatencyMs)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-sage-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-500">Avg Quality Score</p>
          <p className="mt-3 font-serif text-2xl text-primary-900">{loading ? "-" : `${formatScore(rubricAvgOverall)}/5`}</p>
        </div>
        <div className="rounded-xl border border-sage-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-500">Quality Pass Rate</p>
          <p className="mt-3 font-serif text-2xl text-primary-900">
            {loading || rubricPassRate === null || rubricPassRate === undefined ? "-" : `${Number(rubricPassRate).toFixed(1)}%`}
          </p>
        </div>
        <div className="rounded-xl border border-sage-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary-500">Scored Runs</p>
          <p className="mt-3 font-serif text-2xl text-primary-900">{loading ? "-" : rubricScoredRuns.toLocaleString()}</p>
        </div>
      </div>

      <div className="rounded-xl border border-sage-100 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="font-serif text-2xl text-primary-900">Runs Per Day</h2>
          <p className="text-sm text-gray-500">Last 14 days, including error count.</p>
        </div>
        <div className="h-[320px] w-full">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">Loading chart...</div>
          ) : chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">No run data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                <XAxis dataKey="dayLabel" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="runs" stroke="#066839" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="errors" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-sage-100 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="font-serif text-2xl text-primary-900">Recent Runs</h2>
          <p className="text-sm text-gray-500">Latest 50 pipeline runs.</p>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-gray-500">Loading recent runs...</div>
        ) : data.runs.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">No runs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-sage-100 text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-3 py-3">Run ID</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Model</th>
                  <th className="px-3 py-3">Web Search</th>
                  <th className="px-3 py-3">Rubric Overall</th>
                  <th className="px-3 py-3">Quality Gate</th>
                  <th className="px-3 py-3">Prompt Tokens</th>
                  <th className="px-3 py-3">Completion Tokens</th>
                  <th className="px-3 py-3">Total Tokens</th>
                  <th className="px-3 py-3">Avg LLM Latency</th>
                  <th className="px-3 py-3">Duration</th>
                  <th className="px-3 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.runs.map((run) => (
                  <tr key={run.id} className="border-b border-sage-50 hover:bg-sage-50/40">
                    <td className="px-3 py-3 text-gray-700">
                      <div className="font-semibold text-xs">{runNames[run.id] || `${run.id.slice(0, 8)}...`}</div>
                      <div className="font-mono text-[11px] text-gray-500">{run.id.slice(0, 8)}...</div>
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
                    <td className="px-3 py-3 text-gray-700">
                      {Number(run.prompt_tokens ?? 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-gray-700">
                      {Number(run.completion_tokens ?? 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-gray-700">
                      {Number(run.total_tokens ?? 0).toLocaleString()}
                    </td>
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
