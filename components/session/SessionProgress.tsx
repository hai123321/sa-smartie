'use client';

import { BrdAnalysis } from '@/types/analysis';
import { BrdSession } from '@/types/session';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, SkipForward } from 'lucide-react';

interface SessionProgressProps {
  analysis: BrdAnalysis;
  session: BrdSession;
  activeQuestionId: string | null;
  onSelectQuestion: (id: string) => void;
}

const priorityOrder = { critical: 0, important: 1, 'nice-to-have': 2 };

const priorityDot: Record<string, string> = {
  critical: 'bg-red-500',
  important: 'bg-amber-500',
  'nice-to-have': 'bg-green-500',
};

export function SessionProgress({
  analysis,
  session,
  activeQuestionId,
  onSelectQuestion,
}: SessionProgressProps) {
  const sorted = [...analysis.questions].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  const answeredCount = session.answers.filter((a) => a.status === 'answered').length;
  const criticalTotal = analysis.questions.filter((q) => q.priority === 'critical').length;
  const criticalAnswered = session.answers.filter((a) => {
    const q = analysis.questions.find((q) => q.id === a.questionId);
    return q?.priority === 'critical' && a.status === 'answered';
  }).length;

  const pct = Math.round((answeredCount / analysis.questions.length) * 100);

  return (
    <div className="flex flex-col h-full">
      {/* Stats */}
      <div className="p-4 border-b border-border space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{answeredCount}/{analysis.questions.length}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            {criticalAnswered}/{criticalTotal} critical
          </div>
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            {pct}%
          </div>
        </div>
      </div>

      {/* Question list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {sorted.map((q, idx) => {
          const ans = session.answers.find((a) => a.questionId === q.id);
          const isActive = q.id === activeQuestionId;
          const isAnswered = ans?.status === 'answered';
          const isSkipped = ans?.answer === '[Skipped]';

          return (
            <button
              key={q.id}
              onClick={() => onSelectQuestion(q.id)}
              className={cn(
                'w-full text-left flex items-start gap-2 rounded-md px-2 py-1.5 text-xs transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              {/* Status icon */}
              <span className="mt-0.5 shrink-0">
                {isAnswered && !isSkipped ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                ) : isSkipped ? (
                  <SkipForward className="h-3.5 w-3.5 text-muted-foreground/50" />
                ) : (
                  <Circle className={cn('h-3.5 w-3.5', isActive ? 'text-primary' : 'text-muted-foreground/30')} />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', priorityDot[q.priority])} />
                  <span className="font-medium truncate">{q.id}</span>
                </div>
                <p className="truncate leading-tight">{q.question.slice(0, 60)}…</p>
              </div>
              <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground/50">
                {idx + 1}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
