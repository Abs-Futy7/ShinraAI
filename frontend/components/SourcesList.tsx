"use client";

import type { ResearchSource } from "@/lib/types";

interface Props {
  sources: ResearchSource[];
}

export default function SourcesList({ sources }: Props) {
  if (sources.length === 0) return null;
  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Sources</h4>
      <div className="space-y-1">
        {sources.map((s) => (
          <div key={s.id} className="flex items-start gap-2 text-sm">
            <span className="font-mono text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded flex-shrink-0">
              {s.id}
            </span>
            <div>
              <span className="font-medium text-gray-800">{s.title}</span>
              {s.url && !s.url.startsWith("internal") && (
                <a href={s.url} className="ml-1 text-brand-600 underline text-xs" target="_blank" rel="noopener noreferrer">
                  ↗
                </a>
              )}
              {s.key_facts && s.key_facts.length > 0 && (
                <ul className="list-disc pl-4 text-xs text-gray-500 mt-0.5">
                  {s.key_facts.slice(0, 3).map((f, i) => <li key={i}>{f}</li>)}
                  {s.key_facts.length > 3 && <li>…and {s.key_facts.length - 3} more</li>}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
