import { NextRequest, NextResponse } from 'next/server';
import { systemsRepository } from '@/lib/db/systems-repository';
import { UpdateSystemSchema } from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const system = await systemsRepository.findById(id);
    if (!system) {
      return NextResponse.json({ error: 'System not found' }, { status: 404 });
    }
    return NextResponse.json({ data: system });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const input = UpdateSystemSchema.safeParse(body);
    if (!input.success) {
      return NextResponse.json(
        { error: input.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      );
    }
    const system = await systemsRepository.update(id, input.data);
    if (!system) {
      return NextResponse.json({ error: 'System not found' }, { status: 404 });
    }
    return NextResponse.json({ data: system });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await systemsRepository.delete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'System not found' }, { status: 404 });
    }
    return NextResponse.json({ data: { success: true } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
