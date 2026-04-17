'use client';

import { useState } from 'react';
import { StakeholderQuestion } from '@/types/analysis';
import { QuestionAnswer } from '@/types/session';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle2, SkipForward, Bot, ChevronRight, Loader2 } from 'lucide-react';

interface QuestionAnswerCardProps {
  question: StakeholderQuestion;
  answer?: QuestionAnswer;
  isActive: boolean;
  isSubmitting: boolean;
  onSubmit: (answer: string, clarificationAnswer?: string) => void;
  onSkip: () => void;
}

const priorityConfig = {
  critical: { label: 'Critical', class: 'bg-red-50 text-red-700 border-red-200' },
  important: { label: 'Important', class: 'bg-amber-50 text-amber-700 border-amber-200' },
  'nice-to-have': { label: 'Nice to have', class: 'bg-green-50 text-green-700 border-green-200' },
};

const categoryConfig = {
  'business-logic': 'Business Logic',
  'technical-constraints': 'Technical',
  nfr: 'NFR',
  integrations: 'Integrations',
};

export function QuestionAnswerCard({
  question,
  answer,
  isActive,
  isSubmitting,
  onSubmit,
  onSkip,
}: QuestionAnswerCardProps) {
  const [text, setText] = useState('');
  const [clarText, setClarText] = useState('');
  const [showClarification, setShowClarification] = useState(false);

  const isAnswered = answer?.status === 'answered';
  const hasPendingClarification = isAnswered && answer.clarification && !answer.clarificationAnswer;

  // When clarification comes in, show it automatically
  if (isAnswered && answer.clarification && !answer.clarificationAnswer && !showClarification) {
    setShowClarification(true);
  }

  function handleSubmit() {
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText('');
  }

  function handleClarSubmit() {
    if (!clarText.trim()) return;
    onSubmit(answer?.answer ?? '', clarText.trim());
    setClarText('');
    setShowClarification(false);
  }

  function handleKeyDown(e: React.KeyboardEvent, action: () => void) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      action();
    }
  }

  const pCfg = priorityConfig[question.priority];

  return (
    <div
      className={cn(
        'rounded-xl border bg-card transition-all',
        isActive
          ? 'border-primary/40 shadow-md ring-1 ring-primary/20'
          : isAnswered
          ? 'border-border opacity-70'
          : 'border-border'
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <div className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full', isAnswered ? 'bg-green-100' : 'bg-muted')}>
          {isAnswered ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <Badge variant="outline" className={cn('text-[10px] h-4 px-1.5', pCfg.class)}>
              {pCfg.label}
            </Badge>
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
              {categoryConfig[question.category]}
            </Badge>
            <span className="text-[10px] text-muted-foreground">{question.id}</span>
          </div>
          <p className="text-sm font-medium leading-relaxed">{question.question}</p>
          {!isActive && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{question.rationale}</p>
          )}
        </div>
      </div>

      {/* Rationale & context (active only) */}
      {isActive && (
        <div className="mx-4 mb-3 rounded-lg bg-muted/50 px-3 py-2">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
            Why this matters
          </p>
          <p className="text-xs text-muted-foreground">{question.rationale}</p>
          {question.relatedQuote && (
            <blockquote className="mt-1.5 border-l-2 border-muted-foreground/30 pl-2">
              <p className="text-[11px] text-muted-foreground/70 italic">
                &ldquo;{question.relatedQuote}&rdquo;
              </p>
            </blockquote>
          )}
        </div>
      )}

      {/* Answer input (active and not yet answered) */}
      {isActive && !isAnswered && (
        <div className="px-4 pb-4 space-y-2">
          <textarea
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            rows={3}
            placeholder="Type your answer... (Ctrl+Enter to submit)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, handleSubmit)}
            disabled={isSubmitting}
          />
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={onSkip}
              disabled={isSubmitting}
            >
              <SkipForward className="mr-1 h-3 w-3" />
              Skip
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!text.trim() || isSubmitting}
              className="gap-1"
            >
              {isSubmitting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              Submit
            </Button>
          </div>
        </div>
      )}

      {/* PO's answer (if answered) */}
      {isAnswered && answer.answer && answer.answer !== '[Skipped]' && (
        <div className="px-4 pb-3 space-y-2">
          <div className="rounded-lg bg-primary/5 border border-primary/10 px-3 py-2">
            <p className="text-[10px] font-medium text-primary/70 mb-0.5">Your answer</p>
            <p className="text-xs">{answer.answer}</p>
          </div>

          {/* AI follow-up */}
          {answer.clarification && (
            <div className="rounded-lg bg-violet-50 border border-violet-200 px-3 py-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Bot className="h-3 w-3 text-violet-600" />
                <p className="text-[10px] font-medium text-violet-700">AI follow-up</p>
              </div>
              <p className="text-xs text-violet-800">{answer.clarification}</p>

              {answer.clarificationAnswer ? (
                <div className="mt-2 rounded-md bg-white border border-violet-100 px-2 py-1.5">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Your clarification</p>
                  <p className="text-xs">{answer.clarificationAnswer}</p>
                </div>
              ) : (
                hasPendingClarification && isActive && (
                  <div className="mt-2 space-y-1.5">
                    <textarea
                      className="w-full rounded-md border border-violet-200 bg-white px-2.5 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-400 resize-none"
                      rows={2}
                      placeholder="Clarify your answer..."
                      value={clarText}
                      onChange={(e) => setClarText(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, handleClarSubmit)}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[10px] text-muted-foreground"
                        onClick={() => {
                          onSubmit(answer.answer, '[Skipped clarification]');
                          setShowClarification(false);
                        }}
                      >
                        Skip
                      </Button>
                      <Button
                        size="sm"
                        className="h-6 text-[10px] bg-violet-600 hover:bg-violet-700"
                        onClick={handleClarSubmit}
                        disabled={!clarText.trim()}
                      >
                        Submit
                      </Button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}

      {isAnswered && answer.answer === '[Skipped]' && (
        <div className="px-4 pb-3">
          <p className="text-xs text-muted-foreground italic">Skipped</p>
        </div>
      )}
    </div>
  );
}
