import { NextRequest, NextResponse } from 'next/server';
import { relationshipsRepository } from '@/lib/db/relationships-repository';
import { CreateRelationshipSchema } from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const relationships = await relationshipsRepository.findAll();
    return NextResponse.json({ data: relationships });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = CreateRelationshipSchema.safeParse(body);
    if (!input.success) {
      return NextResponse.json(
        { error: input.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      );
    }
    const relationship = await relationshipsRepository.create(input.data);
    return NextResponse.json({ data: relationship }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
