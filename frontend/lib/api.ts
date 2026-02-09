import type { CreateRunRequest, RunState } from "./types";

const API_BASE = "/api/backend";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
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

export async function downloadPdf(runId: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}/runs/${runId}/export/pdf`);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`PDF export failed (${res.status}): ${body}`);
  }
  return res.blob();
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
