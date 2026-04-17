'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from '@/hooks/useSession';
import { SessionProgress } from '@/components/session/SessionProgress';
import { QuestionAnswerCard } from '@/components/session/QuestionAnswerCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BrdAnalysis } from '@/types/analysis';
import { cn } from '@/lib/utils';
import {
  CheckCircle2, Loader2, ArrowRight, FileText, ChevronLeft, ChevronRight,
} from 'lucide-react';

type Props = { params: Promise<{ analysisId: string }> };

const priorityOrder = { critical: 0, important: 1, 'nice-to-have': 2 };

export default function SessionPage({ params }: Props) {
  const { analysisId } = use(params);
  const router = useRouter();
  const [analysis, setAnalysis] = useState<BrdAnalysis | null>(null);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  const {
    session,
    isLoading,
    isSubmitting,
    isFinalizing,
    error,
    loadSession,
    createSession,
    submitAnswer,
    skipQuestion,
    finalizeSession,
  } = useSession(analysisId);

  // Load analysis
  useEffect(() => {
    fetch(`/api/analyses/${analysisId}`)
      .then((r) => r.json())
      .then((j: { data?: BrdAnalysis }) => {
        if (j.data) setAnalysis(j.data);
      });
  }, [analysisId]);

  // Load or create session
  useEffect(() => {
    loadSession().then(async () => {
      const res = await fetch(`/api/session/${analysisId}`);
      const json = await res.json() as { data?: typeof session };
      if (!json.data) {
        await createSession();
      }
    });
  }, [analysisId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Set active question to first unanswered
  useEffect(() => {
    if (!session || !analysis || activeQuestionId) return;
    const sorted = [...analysis.questions].sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );
    const firstUnanswered = sorted.find((q) => {
      const ans = session.answers.find((a) => a.questionId === q.id);
      return ans?.status !== 'answered';
    });
    setActiveQuestionId(firstUnanswered?.id ?? sorted[0]?.id ?? null);
  }, [session, analysis, activeQuestionId]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleSubmit = useCallback(async (
    answer: string,
    clarificationAnswer?: string
  ) => {
    if (!activeQuestionId) return;
    const result = await submitAnswer(activeQuestionId, answer, { clarificationAnswer });

    // If no clarification needed, auto-advance
    if (!result.clarification && analysis) {
      const sorted = [...analysis.questions].sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
      );
      const currentIdx = sorted.findIndex((q) => q.id === activeQuestionId);
      const nextUnanswered = sorted.slice(currentIdx + 1).find((q) => {
        const ans = result.session?.answers.find((a) => a.questionId === q.id);
        return ans?.status !== 'answered';
      });
      if (nextUnanswered) setActiveQuestionId(nextUnanswered.id);
    }
  }, [activeQuestionId, submitAnswer, analysis]);

  const handleSkip = useCallback(async () => {
    if (!activeQuestionId || !analysis) return;
    await skipQuestion(activeQuestionId);
    const sorted = [...analysis.questions].sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );
    const currentIdx = sorted.findIndex((q) => q.id === activeQuestionId);
    const next = sorted[currentIdx + 1];
    if (next) setActiveQuestionId(next.id);
  }, [activeQuestionId, skipQuestion, analysis]);

  const handleFinalize = useCallback(async () => {
    const enrichedBrd = await finalizeSession();
    if (enrichedBrd) {
      toast.success('BRD enriched! Generating documents…');
      router.push(`/docs/${analysisId}?generate=1`);
    }
  }, [finalizeSession, router, analysisId]);

  if (isLoading || !analysis || !session) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const sorted = [...analysis.questions].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );
  const answeredCount = session.answers.filter((a) => a.status === 'answered').length;
  const criticalUnanswered = analysis.questions.filter(
    (q) =>
      q.priority === 'critical' &&
      session.answers.find((a) => a.questionId === q.id)?.status !== 'answered'
  ).length;
  const canFinalize = criticalUnanswered === 0 && answeredCount > 0;
  const activeIdx = sorted.findIndex((q) => q.id === activeQuestionId);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar: question list */}
      <div className="w-64 shrink-0 border-r border-border bg-card flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border">
          <button
            onClick={() => router.push('/analyze')}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2"
          >
            <ChevronLeft className="h-3 w-3" />
            Back to analyses
          </button>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary shrink-0" />
            <h1 className="text-sm font-semibold truncate">{analysis.title}</h1>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <SessionProgress
            analysis={analysis}
            session={session}
            activeQuestionId={activeQuestionId}
            onSelectQuestion={setActiveQuestionId}
          />
        </div>
        {/* Finalize button */}
        <div className="p-3 border-t border-border space-y-2">
          {criticalUnanswered > 0 && (
            <p className="text-[10px] text-amber-600 text-center">
              {criticalUnanswered} critical question(s) remaining
            </p>
          )}
          <Button
            className="w-full gap-1.5"
            size="sm"
            disabled={!canFinalize || isFinalizing || session.sessionStatus === 'finalized'}
            onClick={handleFinalize}
          >
            {isFinalizing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3 w-3" />
            )}
            {session.sessionStatus === 'finalized' ? 'Already Finalized' : 'Finalize & Generate Docs'}
          </Button>
          {session.sessionStatus === 'finalized' && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1"
              onClick={() => router.push(`/docs/${analysisId}`)}
            >
              <ArrowRight className="h-3 w-3" />
              View Documents
            </Button>
          )}
        </div>
      </div>

      {/* Main: active question */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">PO Clarification Session</h2>
              <p className="text-xs text-muted-foreground">
                Answer questions to enrich the BRD — AI will follow up if needed
              </p>
            </div>
            <div className="flex items-center gap-2">
              {activeIdx > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => setActiveQuestionId(sorted[activeIdx - 1].id)}
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
              )}
              <Badge variant="secondary" className="text-xs">
                {activeIdx + 1} / {sorted.length}
              </Badge>
              {activeIdx < sorted.length - 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => setActiveQuestionId(sorted[activeIdx + 1].id)}
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Questions: show active + prev 2 */}
          <div className="space-y-3">
            {sorted.map((q) => {
              const ans = session.answers.find((a) => a.questionId === q.id);
              const isActive = q.id === activeQuestionId;

              // Only show active + adjacent answered questions for clarity
              const isAdjacentAnswered =
                ans?.status === 'answered' && Math.abs(sorted.indexOf(q) - activeIdx) <= 2;

              if (!isActive && !isAdjacentAnswered) return null;

              return (
                <QuestionAnswerCard
                  key={q.id}
                  question={q}
                  answer={ans}
                  isActive={isActive}
                  isSubmitting={isSubmitting && isActive}
                  onSubmit={handleSubmit}
                  onSkip={handleSkip}
                />
              );
            })}
          </div>

          {/* Done state */}
          {answeredCount === analysis.questions.length && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center space-y-2">
              <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
              <p className="text-sm font-semibold text-green-800">All questions answered!</p>
              <p className="text-xs text-green-700">
                Click &ldquo;Finalize & Generate Docs&rdquo; to enrich the BRD and generate all architecture documents.
              </p>
              <Button
                onClick={handleFinalize}
                disabled={isFinalizing}
                className={cn('mt-2 gap-1.5 bg-green-600 hover:bg-green-700')}
              >
                {isFinalizing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="h-3.5 w-3.5" />
                )}
                Finalize & Generate Docs
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
