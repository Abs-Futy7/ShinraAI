"use client";

import type { FactIssue } from "@/lib/types";

interface Props {
  issues: FactIssue[];
}

export default function IssuesTable({ issues }: Props) {
  if (issues.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="py-1 pr-2">Claim</th>
            <th className="py-1 pr-2">Reason</th>
            <th className="py-1 pr-2">Fix</th>
            <th className="py-1">Sources</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-1.5 pr-2 text-gray-700">{issue.claim}</td>
              <td className="py-1.5 pr-2 text-red-600">{issue.reason}</td>
              <td className="py-1.5 pr-2 text-gray-600">{issue.suggested_fix}</td>
              <td className="py-1.5 font-mono text-brand-600">
                {issue.source_ids?.join(", ") || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
