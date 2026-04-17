import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { docsStore } from '@/lib/storage/docs-store';
import { sessionsStore } from '@/lib/storage/sessions-store';
import { callClaude } from '@/lib/ai/claude-client';
import {
  CASCADE_IMPACT_SYSTEM_PROMPT,
  buildImpactAnalysisPrompt,
  CASCADE_UPDATE_SYSTEM_PROMPT,
  buildCascadeUpdatePrompt,
} from '@/lib/ai/prompts/cascade-update';
import { DocType, DocImpact, CascadeResult } from '@/types/docs';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

type Params = { params: Promise<{ analysisId: string }> };

const CascadeRequestSchema = z.object({
  updatedBrd: z.string().min(10),
});

interface ImpactAnalysis {
  changeDescription: string;
  impactedDocTypes: DocType[];
  reasoning: Record<DocType, string | null>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const { analysisId } = await params;
  try {
    const body = await req.json();
    const input = CascadeRequestSchema.safeParse(body);
    if (!input.success) {
      return NextResponse.json(
        { error: input.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      );
    }

    const { updatedBrd } = input.data;

    const [docSet, session] = await Promise.all([
      docsStore.getByAnalysisId(analysisId),
      sessionsStore.getByAnalysisId(analysisId),
    ]);

    if (!docSet || docSet.docs.length === 0) {
      return NextResponse.json(
        { error: 'No documents found. Generate documents first.' },
        { status: 404 }
      );
    }

    const originalBrd = session?.enrichedBrd ?? '';

    // Step 1: Impact analysis
    const impactRaw = await callClaude(
      CASCADE_IMPACT_SYSTEM_PROMPT,
      buildImpactAnalysisPrompt(originalBrd, updatedBrd, [...docSet.docs]),
      { maxTokens: 1024, tier: 'smart' }   // impact analysis — Sonnet
    );

    let impact: ImpactAnalysis;
    try {
      const jsonStr = impactRaw.slice(impactRaw.indexOf('{'), impactRaw.lastIndexOf('}') + 1);
      impact = JSON.parse(jsonStr) as ImpactAnalysis;
    } catch {
      return NextResponse.json({ error: 'Failed to analyze impact' }, { status: 500 });
    }

    if (impact.impactedDocTypes.length === 0) {
      return NextResponse.json({
        data: {
          changeDescription: impact.changeDescription,
          impactedDocTypes: [],
          impacts: [],
        } satisfies CascadeResult,
      });
    }

    // Step 2: Update impacted docs
    const impacts: DocImpact[] = [];
    for (const docType of impact.impactedDocTypes) {
      const existingDoc = docSet.docs.find((d) => d.type === docType);
      if (!existingDoc) continue;

      const reason = impact.reasoning[docType] ?? 'BRD change requires update';
      const updatedContent = await callClaude(
        CASCADE_UPDATE_SYSTEM_PROMPT,
        buildCascadeUpdatePrompt(
          docType,
          existingDoc.content,
          updatedBrd,
          impact.changeDescription,
          reason
        ),
        { maxTokens: 6000, tier: 'deep' }   // doc rewrite — Opus
      );

      const updatedDoc = {
        id: uuidv4(),
        analysisId,
        type: docType,
        content: updatedContent,
        version: existingDoc.version + 1,
        generatedAt: new Date().toISOString(),
      };

      await docsStore.upsertDoc(analysisId, updatedDoc);

      impacts.push({
        docType,
        reason,
        before: existingDoc.content,
        after: updatedContent,
        changeSummary: reason,
      });
    }

    // Save updated BRD to session
    if (session) {
      await sessionsStore.setEnrichedBrd(analysisId, updatedBrd);
    }
    await docsStore.bumpVersion(analysisId);

    const result: CascadeResult = {
      changeDescription: impact.changeDescription,
      impactedDocTypes: impact.impactedDocTypes,
      impacts,
    };

    return NextResponse.json({ data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
