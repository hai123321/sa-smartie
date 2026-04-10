import { NextRequest, NextResponse } from 'next/server';
import { analysesStore } from '@/lib/storage/analyses-store';
import { exportToMarkdown } from '@/lib/export/markdown-exporter';
import { ExportRequestSchema } from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const input = ExportRequestSchema.safeParse(body);

    if (!input.success) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

    const analysis = await analysesStore.getById(id);
    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    const content = exportToMarkdown(analysis);
    const filename = `${analysis.title.replace(/[^a-zA-Z0-9]/g, '_')}_questions.md`;

    return NextResponse.json({ data: { content, filename } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
