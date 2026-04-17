'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { GeneratedDoc } from '@/types/docs';
import { cn } from '@/lib/utils';

interface DocViewerProps {
  doc: GeneratedDoc;
  className?: string;
}

export function DocViewer({ doc, className }: DocViewerProps) {
  return (
    <div className={cn('prose prose-sm max-w-none', className)}>
      <style>{`
        .prose h1 { font-size: 1.4rem; font-weight: 700; margin-top: 0; }
        .prose h2 { font-size: 1.1rem; font-weight: 600; margin-top: 1.5rem; border-bottom: 1px solid hsl(var(--border)); padding-bottom: 0.25rem; }
        .prose h3 { font-size: 0.95rem; font-weight: 600; margin-top: 1.25rem; }
        .prose h4 { font-size: 0.875rem; font-weight: 600; margin-top: 1rem; }
        .prose table { font-size: 0.8rem; }
        .prose code { font-size: 0.8rem; background: hsl(var(--muted)); padding: 0.1em 0.3em; border-radius: 0.25rem; }
        .prose pre { background: hsl(var(--muted)) !important; border-radius: 0.5rem; font-size: 0.78rem; }
        .prose blockquote { border-color: hsl(var(--primary)); background: hsl(var(--primary) / 0.05); padding: 0.5rem 0.75rem; border-radius: 0 0.5rem 0.5rem 0; }
        .prose li { margin: 0.15rem 0; }
        .prose p { margin: 0.5rem 0; }
        .updated-marker { background: hsl(var(--primary) / 0.08); border-left: 3px solid hsl(var(--primary)); }
      `}</style>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
        {doc.content}
      </ReactMarkdown>
    </div>
  );
}
