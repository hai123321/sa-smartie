import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { analysesStore } from '@/lib/storage/analyses-store';
import { sessionsStore } from '@/lib/storage/sessions-store';
import { BrdSession } from '@/types/session';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ analysisId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { analysisId } = await params;
  try {
    const session = await sessionsStore.getByAnalysisId(analysisId);
    if (!session) {
      return NextResponse.json({ data: null });
    }
    return NextResponse.json({ data: session });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: create a new session for this analysis
export async function POST(_req: NextRequest, { params }: Params) {
  const { analysisId } = await params;
  try {
    const analysis = await analysesStore.getById(analysisId);
    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    // Return existing if already created
    const existing = await sessionsStore.getByAnalysisId(analysisId);
    if (existing) {
      return NextResponse.json({ data: existing });
    }

    const now = new Date().toISOString();
    const session: BrdSession = {
      id: uuidv4(),
      analysisId,
      answers: analysis.questions.map((q) => ({
        questionId: q.id,
        answer: '',
        status: 'pending',
      })),
      sessionStatus: 'in-progress',
      createdAt: now,
      updatedAt: now,
    };

    await sessionsStore.save(session);
    return NextResponse.json({ data: session }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
