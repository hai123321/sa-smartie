import { NextRequest, NextResponse } from 'next/server';
import { systemsRepository } from '@/lib/db/systems-repository';
import { CreateSystemSchema } from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const systems = await systemsRepository.findAll();
    return NextResponse.json({ data: systems });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = CreateSystemSchema.safeParse(body);
    if (!input.success) {
      return NextResponse.json(
        { error: input.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      );
    }
    const system = await systemsRepository.create(input.data);
    return NextResponse.json({ data: system }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
