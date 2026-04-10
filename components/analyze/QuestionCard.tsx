'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StakeholderQuestion } from '@/types/analysis';
import { cn } from '@/lib/utils';

interface QuestionCardProps {
  question: StakeholderQuestion;
  index: number;
}

const priorityConfig = {
  critical: { label: 'Critical', class: 'bg-red-50 border-red-200 text-red-700' },
  important: { label: 'Important', class: 'bg-amber-50 border-amber-200 text-amber-700' },
  'nice-to-have': { label: 'Nice to have', class: 'bg-green-50 border-green-200 text-green-700' },
};

export function QuestionCard({ question, index }: QuestionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = priorityConfig[question.priority];

  return (
    <div className={cn('rounded-md border p-3.5 transition-colors', config.class)}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 text-xs font-mono font-medium opacity-50">
          {question.id || `Q-${String(index + 1).padStart(3, '0')}`}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium leading-snug">{question.question}</p>
            <button
              onClick={() => setExpanded(!expanded)}
              className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100"
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {expanded && (
            <div className="mt-2.5 space-y-2 border-t border-current/10 pt-2.5">
              {question.relatedQuote && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60 mb-1">
                    BRD Reference
                  </p>
                  <blockquote className="text-xs italic opacity-80 pl-2 border-l-2 border-current/20">
                    "{question.relatedQuote}"
                  </blockquote>
                </div>
              )}
              {question.rationale && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60 mb-1">
                    Why ask this
                  </p>
                  <p className="text-xs opacity-80">{question.rationale}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
