import { NextRequest, NextResponse } from 'next/server';
import { graphDb } from '@/lib/db/graph';
import { ImportInventorySchema } from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = ImportInventorySchema.safeParse(body);
    if (!input.success) {
      return NextResponse.json(
        { error: input.error.issues[0]?.message ?? 'Invalid import data' },
        { status: 400 }
      );
    }
    await graphDb.importData(input.data.systems, input.data.relationships);
    return NextResponse.json({
      data: {
        systemsImported: input.data.systems.length,
        relationshipsImported: input.data.relationships.length,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
