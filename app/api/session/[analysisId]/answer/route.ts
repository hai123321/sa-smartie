import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sessionsStore } from '@/lib/storage/sessions-store';
import { analysesStore } from '@/lib/storage/analyses-store';
import { callClaude } from '@/lib/ai/claude-client';
import {
  SESSION_CLARIFY_SYSTEM_PROMPT,
  buildClarifyPrompt,
} from '@/lib/ai/prompts/session-qa';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ analysisId: string }> };

const AnswerSchema = z.object({
  questionId: z.string(),
  answer: z.string().min(1, 'Answer cannot be empty'),
  clarificationAnswer: z.string().optional(),
  skipClarification: z.boolean().default(false),
});

interface ClarifyResponse {
  isSufficient: boolean;
  followUpQuestion: string | null;
}

export async function POST(req: NextRequest, { params }: Params) {
  const { analysisId } = await params;
  try {
    const body = await req.json();
    const input = AnswerSchema.safeParse(body);
    if (!input.success) {
      return NextResponse.json(
        { error: input.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      );
    }

    const { questionId, answer, clarificationAnswer, skipClarification } = input.data;

    const [session, analysis] = await Promise.all([
      sessionsStore.getByAnalysisId(analysisId),
      analysesStore.getById(analysisId),
    ]);

    if (!session || !analysis) {
      return NextResponse.json({ error: 'Session or analysis not found' }, { status: 404 });
    }

    const question = analysis.questions.find((q) => q.id === questionId);
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Check if AI wants to ask a follow-up (only for critical/important questions)
    let clarification: string | undefined;
    if (!skipClarification && !clarificationAnswer && question.priority !== 'nice-to-have') {
      try {
        const raw = await callClaude(
          SESSION_CLARIFY_SYSTEM_PROMPT,
          buildClarifyPrompt(question, answer),
          { maxTokens: 512, tier: 'fast' }   // short validation — Haiku is sufficient
        );
        const jsonStr = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
        const parsed = JSON.parse(jsonStr) as ClarifyResponse;
        if (!parsed.isSufficient && parsed.followUpQuestion) {
          clarification = parsed.followUpQuestion;
        }
      } catch {
        // If clarify check fails, proceed without follow-up
      }
    }

    const updated = await sessionsStore.upsertAnswer(analysisId, {
      questionId,
      answer,
      clarification,
      clarificationAnswer,
      status: 'answered',
      answeredAt: new Date().toISOString(),
    });

    return NextResponse.json({ data: { session: updated, clarification } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
