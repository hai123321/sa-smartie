import { NextRequest, NextResponse } from 'next/server';
import { AnalyzeRequestSchema } from '@/lib/validation/schemas';
import { callClaude } from '@/lib/ai/claude-client';
import { BRD_ANALYSIS_SYSTEM_PROMPT, buildBrdAnalysisPrompt } from '@/lib/ai/prompts/brd-analysis';
import { parseBrdAnalysisResponse } from '@/lib/ai/response-parsers';
import { analysesStore } from '@/lib/storage/analyses-store';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = AnalyzeRequestSchema.safeParse(body);

    if (!input.success) {
      return NextResponse.json(
        { error: input.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      );
    }

    const { content, title } = input.data;
    const analysisTitle = title ?? `BRD Analysis ${new Date().toLocaleDateString('vi-VN')}`;

    const rawResponse = await callClaude(
      BRD_ANALYSIS_SYSTEM_PROMPT,
      buildBrdAnalysisPrompt(content, analysisTitle),
      { maxTokens: 8192 }
    );

    const analysis = parseBrdAnalysisResponse(rawResponse, analysisTitle, content);
    await analysesStore.save(analysis);

    return NextResponse.json({ data: analysis });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
