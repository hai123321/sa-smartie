import { NextRequest, NextResponse } from 'next/server';
import { relationshipsRepository } from '@/lib/db/relationships-repository';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await relationshipsRepository.delete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Relationship not found' }, { status: 404 });
    }
    return NextResponse.json({ data: { success: true } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
