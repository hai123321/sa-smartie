import { NextRequest, NextResponse } from 'next/server';
import { systemsRepository } from '@/lib/db/systems-repository';
import { relationshipsRepository } from '@/lib/db/relationships-repository';
import { buildRelevantContext } from '@/lib/ai/prompts/inventory-context';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get('query') ?? '';
    const [systems, relationships] = await Promise.all([
      systemsRepository.findAll(),
      relationshipsRepository.findAll(),
    ]);
    const context = buildRelevantContext(systems, relationships, query);
    return NextResponse.json({ data: { context } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
