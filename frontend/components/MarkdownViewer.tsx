"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Components } from "react-markdown";

interface Props {
  content: string;
}

export default function MarkdownViewer({ content }: Props) {
  const scrollToCitation = (citationId: string) => {
    const element = document.getElementById(`citation-${citationId}`);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.classList.add("highlight-citation");
    setTimeout(() => element.classList.remove("highlight-citation"), 2000);
  };

  const parseCitationIds = (part: string): string[] | null => {
    const bracketMatch = part.match(/^\[\s*([^\]]+)\s*\]$/);
    if (!bracketMatch) return null;

    const rawIds = bracketMatch[1]
      .split(",")
      .map((token) => token.trim())
      .filter(Boolean);

    if (rawIds.length === 0) return null;

    const ids: string[] = [];
    for (const token of rawIds) {
      const m = token.match(/^[Ss]?(\d+)$/);
      if (!m) return null;
      ids.push(`S${m[1]}`);
    }
    return ids;
  };

  const renderTextWithCitations = (text: string): React.ReactNode[] => {
    const parts = text.split(/(\[[^\]]+\])/g);

    return parts.map((part, idx) => {
      const citationIds = parseCitationIds(part);
      if (!citationIds) return part;

      return (
        <span key={idx} className="inline-flex items-center gap-1 mx-0.5 align-middle">
          {citationIds.map((citationId, cIdx) => (
            <button
              key={`${idx}-${citationId}-${cIdx}`}
              type="button"
              onClick={() => scrollToCitation(citationId)}
              className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full transition-colors shadow-sm bg-primary-600 hover:bg-primary-700 leading-none"
              style={{ color: "#ffffff" }}
              title={`Jump to citation ${citationId}`}
            >
              [{citationId}]
            </button>
          ))}
        </span>
      );
    });
  };

  const processNode = (node: React.ReactNode): React.ReactNode => {
    if (typeof node === "string") return renderTextWithCitations(node);
    if (Array.isArray(node)) {
      return node.map((n, i) => <React.Fragment key={i}>{processNode(n)}</React.Fragment>);
    }
    if (React.isValidElement(node) && node.props?.children) {
      return React.cloneElement(node, {
        ...node.props,
        children: processNode(node.props.children),
      });
    }
    return node;
  };

  // Custom renderer for text nodes to convert [S#] and [S0, S1] to clickable chips
  const components: Components = {
    p: ({ children, ...props }) => {
      return <p {...props}>{processNode(children)}</p>;
    },
  };

  return (
    <div className="prose bg-white border rounded-lg p-6 max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
      <style jsx global>{`
        .highlight-citation {
          animation: highlight 2s ease-out;
        }
        @keyframes highlight {
          0%, 100% { background-color: transparent; }
          50% { background-color: rgba(147, 51, 234, 0.2); }
        }
      `}</style>
    </div>
  );
}
