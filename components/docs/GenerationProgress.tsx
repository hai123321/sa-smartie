'use client';

import { DocType, DOC_META, DOC_ORDER } from '@/types/docs';
import { cn } from '@/lib/utils';
import { CheckCircle2, Loader2, Circle } from 'lucide-react';

interface GenerationProgressProps {
  generatingDoc: DocType | null;
  completedDocs: DocType[];
}

export function GenerationProgress({ generatingDoc, completedDocs }: GenerationProgressProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Generating documents…</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          AI is writing your architecture documents from the enriched BRD
        </p>
      </div>
      <div className="space-y-2">
        {DOC_ORDER.map((docType) => {
          const meta = DOC_META[docType];
          const isCompleted = completedDocs.includes(docType);
          const isGenerating = generatingDoc === docType;
          const isPending = !isCompleted && !isGenerating;

          return (
            <div
              key={docType}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
                isGenerating ? 'bg-primary/5 border border-primary/20' : 'bg-muted/30'
              )}
            >
              <span className="shrink-0">
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : isGenerating ? (
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/30" />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium', isPending && 'text-muted-foreground')}>
                  {meta.title}
                </p>
                <p className="text-xs text-muted-foreground">{meta.description}</p>
              </div>
              {isGenerating && (
                <span className="text-xs text-primary font-medium animate-pulse">Writing…</span>
              )}
              {isCompleted && (
                <span className="text-xs text-green-600 font-medium">Done</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
