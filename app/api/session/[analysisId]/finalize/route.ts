import { NextRequest, NextResponse } from 'next/server';
import { sessionsStore } from '@/lib/storage/sessions-store';
import { analysesStore } from '@/lib/storage/analyses-store';
import { callClaude } from '@/lib/ai/claude-client';
import {
  BRD_ENRICH_SYSTEM_PROMPT,
  buildEnrichBrdPrompt,
} from '@/lib/ai/prompts/session-qa';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ analysisId: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { analysisId } = await params;
  try {
    const [session, analysis] = await Promise.all([
      sessionsStore.getByAnalysisId(analysisId),
      analysesStore.getById(analysisId),
    ]);

    if (!session || !analysis) {
      return NextResponse.json({ error: 'Session or analysis not found' }, { status: 404 });
    }

    if (session.sessionStatus === 'finalized' && session.enrichedBrd) {
      return NextResponse.json({ data: { enrichedBrd: session.enrichedBrd } });
    }

    const answeredCount = session.answers.filter((a) => a.status === 'answered').length;
    const criticalUnanswered = analysis.questions.filter(
      (q) =>
        q.priority === 'critical' &&
        session.answers.find((a) => a.questionId === q.id)?.status !== 'answered'
    );

    if (criticalUnanswered.length > 0) {
      return NextResponse.json(
        {
          error: `${criticalUnanswered.length} critical question(s) must be answered before finalizing`,
          criticalUnanswered: criticalUnanswered.map((q) => q.id),
        },
        { status: 422 }
      );
    }

    if (answeredCount === 0) {
      return NextResponse.json(
        { error: 'At least one question must be answered before finalizing' },
        { status: 422 }
      );
    }

    const enrichedBrd = await callClaude(
      BRD_ENRICH_SYSTEM_PROMPT,
      buildEnrichBrdPrompt(analysis, session.answers),
      { maxTokens: 8192, tier: 'deep' }   // enriching full BRD — Opus
    );

    const updated = await sessionsStore.setEnrichedBrd(analysisId, enrichedBrd);

    return NextResponse.json({ data: { enrichedBrd, session: updated } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
