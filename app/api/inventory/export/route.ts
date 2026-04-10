import { NextResponse } from 'next/server';
import { systemsRepository } from '@/lib/db/systems-repository';
import { relationshipsRepository } from '@/lib/db/relationships-repository';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [systems, relationships] = await Promise.all([
      systemsRepository.findAll(),
      relationshipsRepository.findAll(),
    ]);
    return NextResponse.json({ data: { systems, relationships } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
