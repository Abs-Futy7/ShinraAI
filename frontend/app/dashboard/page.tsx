"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, CheckCircle2, Clock3, Gauge, RefreshCw, Sparkles, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getMetricsRuns, getMetricsSummary } from "@/lib/api";
import type { MetricsRun, MetricsSummaryResponse } from "@/lib/types";
import { getRunNames } from "@/lib/runNames";
import { useRequireAuth } from "@/lib/useRequireAuth";

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

function RunsChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const runs = payload.find((p: any) => p.dataKey === "runs")?.value ?? 0;
  const errors = payload.find((p: any) => p.dataKey === "errors")?.value ?? 0;

  return (
    <div className="rounded-lg border border-primary-900/10 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      <div className="mt-1 space-y-1 text-sm">
        <p className="text-primary-800">
          <span className="font-semibold">Runs:</span> {runs}
        </p>
        <p className="text-red-700">
          <span className="font-semibold">Errors:</span> {errors}
        </p>
      </div>
    </div>
  );
}

type TileTone = "emerald" | "teal" | "slate";

function tileToneStyles(tone: TileTone): string {
  if (tone === "emerald") {
    return "bg-gradient-to-br from-emerald-50 to-emerald-100/60 border-emerald-200/60 text-emerald-700";
  }
  if (tone === "teal") {
    return "bg-gradient-to-br from-cyan-50 to-teal-100/50 border-cyan-200/60 text-cyan-700";
  }
  return "bg-gradient-to-br from-slate-50 to-slate-100/70 border-slate-200/60 text-slate-700";
}

type MetricTileProps = {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: TileTone;
};

function MetricTile({ label, value, hint, icon: Icon, tone = "slate" }: MetricTileProps) {
  return (
    <div className="rounded-2xl border border-sage-100 bg-white p-5 shadow-[0_12px_25px_-18px_rgba(6,104,57,0.35)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-500">{label}</p>
        <div className={`rounded-lg border px-2 py-2 ${tileToneStyles(tone)}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="mt-3 font-serif text-3xl text-primary-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

export default function DashboardPage() {
  const { loading: authLoading, isAuthenticated } = useRequireAuth();
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
    if (!isAuthenticated) return;
    loadData();
    setRunNames(getRunNames());
    const onFocus = () => setRunNames(getRunNames());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [isAuthenticated]);

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

  const fourteenDayRuns = chartData.reduce((sum, point) => sum + point.runs, 0);
  const fourteenDayErrors = chartData.reduce((sum, point) => sum + point.errors, 0);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-600" />
        <span className="ml-3 text-sm text-gray-500">Checking session...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-sage-100 bg-white/75 p-6 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-500">Operations</p>
            <h1 className="mt-2 font-serif text-4xl text-primary-900">Pipeline Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
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
              href="/studio"
              className="inline-flex items-center rounded-lg border border-sage-200 bg-white px-3 py-2 text-sm text-primary-700 hover:border-primary-300"
            >
              Back to Studio
            </Link>
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <MetricTile
            label="Total Runs"
            value={loading ? "-" : totalRuns.toLocaleString()}
            hint={loading ? "" : `${completedRuns.toLocaleString()} completed`}
            icon={Activity}
            tone="emerald"
          />
          <MetricTile
            label="Completion Rate"
            value={loading ? "-" : `${completionRate}%`}
            hint={loading ? "" : `${completedRuns} completed / ${totalRuns} total`}
            icon={CheckCircle2}
            tone="teal"
          />
          <MetricTile
            label="Avg Duration"
            value={loading ? "-" : formatMs(avgDurationMs)}
            hint="End-to-end pipeline runtime"
            icon={Clock3}
            tone="slate"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricTile label="Prompt Tokens" value={loading ? "-" : totalPromptTokens.toLocaleString()} icon={Sparkles} tone="slate" />
          <MetricTile label="Completion Tokens" value={loading ? "-" : totalCompletionTokens.toLocaleString()} icon={Sparkles} tone="slate" />
          <MetricTile label="Total Tokens" value={loading ? "-" : totalTokens.toLocaleString()} icon={Gauge} tone="teal" />
          <MetricTile label="Avg LLM Latency" value={loading ? "-" : formatMs(avgLlmLatencyMs)} icon={Clock3} tone="slate" />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <MetricTile
            label="Avg Quality Score"
            value={loading ? "-" : `${formatScore(rubricAvgOverall)}/5`}
            icon={ShieldCheck}
            tone="emerald"
          />
          <MetricTile
            label="Quality Pass Rate"
            value={loading || rubricPassRate === null || rubricPassRate === undefined ? "-" : `${Number(rubricPassRate).toFixed(1)}%`}
            icon={CheckCircle2}
            tone="teal"
          />
          <MetricTile label="Scored Runs" value={loading ? "-" : rubricScoredRuns.toLocaleString()} icon={Activity} tone="slate" />
        </div>
      </section>

      <section className="rounded-2xl border border-sage-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="font-serif text-2xl text-primary-900">Runs Per Day</h2>
            <p className="text-sm text-gray-500">Last 14 days, including error count.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">
              14d Runs: {fourteenDayRuns}
            </span>
            <span className="rounded-full bg-red-100 px-3 py-1 font-semibold text-red-700">
              14d Errors: {fourteenDayErrors}
            </span>
          </div>
        </div>

        <div className="h-[330px] w-full rounded-xl border border-sage-100 bg-sage-50/40 p-3">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">Loading chart...</div>
          ) : chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">No run data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#d2ddd7" vertical={false} />
                <XAxis dataKey="dayLabel" tick={{ fontSize: 12, fill: "#4b5563" }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#4b5563" }} tickLine={false} axisLine={false} />
                <Tooltip content={<RunsChartTooltip />} cursor={{ fill: "rgba(6, 104, 57, 0.06)" }} />
                <Bar dataKey="runs" fill="#0f766e" radius={[6, 6, 0, 0]} maxBarSize={26} />
                <Bar dataKey="errors" fill="#dc2626" radius={[6, 6, 0, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-sage-100 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="font-serif text-2xl text-primary-900">Recent Runs</h2>
          <p className="text-sm text-gray-500">Latest 50 pipeline runs.</p>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-gray-500">Loading recent runs...</div>
        ) : data.runs.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">No runs found.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-sage-100">
            <table className="w-full min-w-[980px] border-collapse text-sm">
              <thead className="bg-sage-50/70">
                <tr className="border-b border-sage-100 text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-3 py-3">Run</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Model</th>
                  <th className="px-3 py-3">Web Search</th>
                  <th className="px-3 py-3">Rubric</th>
                  <th className="px-3 py-3">Quality Gate</th>
                  <th className="px-3 py-3">Prompt</th>
                  <th className="px-3 py-3">Completion</th>
                  <th className="px-3 py-3">Total</th>
                  <th className="px-3 py-3">LLM Latency</th>
                  <th className="px-3 py-3">Duration</th>
                  <th className="px-3 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.runs.map((run) => (
                  <tr key={run.id} className="border-b border-sage-50 hover:bg-sage-50/40">
                    <td className="px-3 py-3 text-xs">
                      <div className="flex flex-col gap-0.5">
                        <Link href={`/runs/${run.id}`} className="font-semibold text-primary-700 hover:underline">
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
                      {run.rubric_review_required ? (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Review</span>
                      ) : run.rubric_passed === null || run.rubric_passed === undefined ? (
                        "-"
                      ) : run.rubric_passed ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Passed</span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">Failed</span>
                      )}
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
      </section>
    </div>
  );
}
