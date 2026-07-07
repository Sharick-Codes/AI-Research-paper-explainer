import React from 'react';
import Markdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-body prose max-w-none text-slate-800 dark:text-slate-200">
      <Markdown
        components={{
          h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-3 text-slate-900 dark:text-white border-b pb-1 border-slate-200 dark:border-slate-700">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-semibold mt-5 mb-2.5 text-slate-900 dark:text-white">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-medium mt-4 mb-2 text-slate-900 dark:text-white">{children}</h3>,
          p: ({ children }) => <p className="leading-relaxed mb-4 text-sm md:text-base">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-4 pl-4 space-y-1.5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-4 pl-4 space-y-1.5">{children}</ol>,
          li: ({ children }) => <li className="text-sm md:text-base">{children}</li>,
          code: ({ children }) => (
            <code className="bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded font-mono text-sm">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto font-mono text-sm mb-4 border border-slate-800 dark:border-slate-700">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-emerald-500 bg-slate-50 dark:bg-slate-800/40 pl-4 py-2 pr-2 rounded-r-lg italic my-4 text-slate-600 dark:text-slate-400">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="bg-slate-50 dark:bg-slate-800 px-4 py-2 font-semibold text-left text-slate-700 dark:text-slate-300">{children}</th>,
          td: ({ children }) => <td className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">{children}</td>,
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
