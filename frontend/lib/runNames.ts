const STORAGE_KEY = "shinrai_run_names_v1";

export type RunNameMap = Record<string, string>;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getRunNames(): RunNameMap {
  if (!canUseStorage()) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};

    const out: RunNameMap = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof key === "string" && typeof value === "string") {
        out[key] = value;
      }
    }
    return out;
  } catch {
    return {};
  }
}

function saveRunNames(map: RunNameMap): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage failures
  }
}

export function getRunName(runId: string): string | null {
  const map = getRunNames();
  return map[runId] ?? null;
}

export function setRunName(runId: string, name: string): void {
  const cleanName = name.trim().slice(0, 80);
  const map = getRunNames();
  if (!cleanName) {
    delete map[runId];
  } else {
    map[runId] = cleanName;
  }
  saveRunNames(map);
}
