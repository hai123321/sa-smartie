import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { sessionsStore } from '@/lib/storage/sessions-store';
import { analysesStore } from '@/lib/storage/analyses-store';
import { docsStore } from '@/lib/storage/docs-store';
import { callClaude } from '@/lib/ai/claude-client';
import {
  DOC_SYSTEM_PROMPTS,
  buildDocGenerationPrompt,
} from '@/lib/ai/prompts/doc-generation';
import { DOC_ORDER, DocType } from '@/types/docs';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const GenerateRequestSchema = z.object({
  analysisId: z.string(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const input = GenerateRequestSchema.safeParse(body);
  if (!input.success) {
    return new Response(
      JSON.stringify({ error: 'analysisId is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { analysisId } = input.data;

  const [session, analysis] = await Promise.all([
    sessionsStore.getByAnalysisId(analysisId),
    analysesStore.getById(analysisId),
  ]);

  if (!analysis) {
    return new Response(
      JSON.stringify({ error: 'Analysis not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const enrichedBrd = session?.enrichedBrd ?? analysis.rawContent;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        for (const docType of DOC_ORDER) {
          send({ type: 'start', docType });

          const content = await callClaude(
            DOC_SYSTEM_PROMPTS[docType],
            buildDocGenerationPrompt(docType, enrichedBrd, analysis.title),
            { maxTokens: 6000, tier: 'deep' }   // full doc generation — Opus
          );

          const doc = {
            id: uuidv4(),
            analysisId,
            type: docType as DocType,
            content,
            version: 1,
            generatedAt: new Date().toISOString(),
          };

          await docsStore.upsertDoc(analysisId, doc);
          send({ type: 'done', docType, doc });
        }

        send({ type: 'complete' });
        controller.close();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Generation failed';
        send({ type: 'error', message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
