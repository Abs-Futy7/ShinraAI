import type {
  CreateRunRequest,
  RunState,
  LinkedInPack,
  GeneratedImage,
  MetricsSummaryResponse,
  MetricsRun,
} from "./types";
import { getSupabaseClientSafe } from "./supabase";

const API_BASE = "/api/backend";

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const supabase = getSupabaseClientSafe();
    if (!supabase) return {};
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeaders, ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json();
}

export async function createRun(data: CreateRunRequest): Promise<{ run_id: string }> {
  return apiFetch("/runs", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function executeRun(runId: string): Promise<RunState> {
  return apiFetch(`/runs/${runId}/execute`, { method: "POST" });
}

export async function getRun(runId: string): Promise<RunState> {
  return apiFetch(`/runs/${runId}`);
}

export async function submitFeedback(runId: string, stage: string, feedback: string): Promise<RunState> {
  return apiFetch(`/runs/${runId}/feedback`, {
    method: "POST",
    body: JSON.stringify({ stage, feedback }),
  });
}

export async function generateLinkedInPack(runId: string): Promise<LinkedInPack> {
  return apiFetch(`/runs/${runId}/linkedin-pack`, { method: "POST" });
}

export async function generateImage(runId: string): Promise<GeneratedImage> {
  return apiFetch(`/runs/${runId}/generate-image`, { method: "POST" });
}

export async function downloadPdf(runId: string): Promise<Blob> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/runs/${runId}/export/pdf`, {
    headers: authHeaders,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`PDF export failed (${res.status}): ${body}`);
  }
  return res.blob();
}

export async function getMetricsSummary(): Promise<MetricsSummaryResponse> {
  return apiFetch("/metrics/summary");
}

export async function getMetricsRuns(limit = 50): Promise<MetricsRun[]> {
  return apiFetch(`/metrics/runs?limit=${encodeURIComponent(String(limit))}`);
}

export function triggerPdfDownload(runId: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `blog-post-${runId.slice(0, 8)}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
