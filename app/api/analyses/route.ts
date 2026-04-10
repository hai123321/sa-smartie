import { NextResponse } from 'next/server';
import { analysesStore } from '@/lib/storage/analyses-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const analyses = await analysesStore.getAll();
    return NextResponse.json({ data: analyses });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
