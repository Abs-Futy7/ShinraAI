"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Components } from "react-markdown";

interface Props {
  content: string;
}

export default function MarkdownViewer({ content }: Props) {
  // Custom renderer for text nodes to convert [S#] to clickable links
  const components: Components = {
    p: ({ children, ...props }) => {
      const processText = (child: any): any => {
        if (typeof child === 'string') {
          // Split text by citation pattern [S#] or [s#]
          const parts = child.split(/(\[[Ss]\d+\])/g);
          return parts.map((part, idx) => {
            const match = part.match(/\[[Ss](\d+)\]/);
            if (match) {
              const citationId = `S${match[1]}`;
              return (
                <a
                  key={idx}
                  href={`#citation-${citationId}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const element = document.getElementById(`citation-${citationId}`);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      element.classList.add('highlight-citation');
                      setTimeout(() => element.classList.remove('highlight-citation'), 2000);
                    }
                  }}
                  className="inline-flex items-center justify-center px-1.5 py-0.5 mx-0.5 text-[10px] font-bold text-white bg-primary-600 rounded-full transition-colors hover:bg-primary-700 no-underline shadow-sm"
                  style={{ textDecoration: 'none' }}
                >
                  {match[1]}
                </a>
              );
            }
            return part;
          });
        }
        if (Array.isArray(child)) {
          return child.map(processText);
        }
        if (child?.props?.children) {
          return {
            ...child,
            props: {
              ...child.props,
              children: processText(child.props.children)
            }
          };
        }
        return child;
      };

      return <p {...props}>{processText(children)}</p>;
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
