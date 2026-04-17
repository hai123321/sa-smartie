import { NextRequest, NextResponse } from 'next/server';
import { docsStore } from '@/lib/storage/docs-store';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ analysisId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { analysisId } = await params;
  try {
    const docSet = await docsStore.getByAnalysisId(analysisId);
    return NextResponse.json({ data: docSet ?? null });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
