import { DocType, GeneratedDoc } from '@/types/docs';

export const CASCADE_IMPACT_SYSTEM_PROMPT = `You are a Solution Architect performing impact analysis on a Business Requirements Document change.

You will receive:
1. A description of what changed in the BRD
2. The current content of each architecture document

Your task: Determine which documents need to be updated based on the BRD change.

Output ONLY a valid JSON object:
{
  "changeDescription": "one sentence describing the nature of the BRD change",
  "impactedDocTypes": ["architecture", "prd", "data-model", "api-design", "adr"],
  "reasoning": {
    "architecture": "why architecture doc needs updating (or null if not impacted)",
    "prd": "why prd needs updating (or null)",
    "data-model": "why data model needs updating (or null)",
    "api-design": "why api design needs updating (or null)",
    "adr": "why adr needs updating (or null)"
  }
}

Rules for impact determination:
- "architecture": update if system topology, integrations, or NFRs changed
- "prd": update if user stories, features, or acceptance criteria are affected
- "data-model": update if entities, attributes, or relationships changed
- "api-design": update if endpoints, request/response contracts changed
- "adr": update if a new significant architectural decision was introduced

Be conservative — only include doc types that TRULY need updating. Cosmetic BRD changes do not require doc updates.`;

export function buildImpactAnalysisPrompt(
  originalBrd: string,
  updatedBrd: string,
  existingDocs: GeneratedDoc[]
): string {
  const docSummaries = existingDocs
    .map((d) => `### ${d.type.toUpperCase()}\n${d.content.slice(0, 300)}...`)
    .join('\n\n');

  return `## Original BRD:
${originalBrd.slice(0, 2000)}

## Updated BRD:
${updatedBrd.slice(0, 2000)}

## Existing Documents (summaries):
${docSummaries}

Analyze the changes and determine which documents need updating.`;
}

export const CASCADE_UPDATE_SYSTEM_PROMPT = `You are a Senior Solution Architect updating an architecture document based on a BRD change.

You will receive:
1. The updated (enriched) BRD
2. The current document content
3. A description of what changed and why this document is affected

Your task: Produce an UPDATED version of the document that reflects the BRD change.

Rules:
- Preserve the existing document structure and style
- Only modify the sections affected by the BRD change
- Add clear markers for what changed: use > **Updated:** prefix for modified content
- Do not rewrite sections that are unaffected
- Output the complete updated document as plain markdown`;

export function buildCascadeUpdatePrompt(
  docType: DocType,
  currentContent: string,
  updatedBrd: string,
  changeDescription: string,
  updateReason: string
): string {
  return `## What Changed in the BRD:
${changeDescription}

## Why This Document (${docType}) is Affected:
${updateReason}

## Updated BRD:
${updatedBrd.slice(0, 3000)}

## Current Document to Update:
${currentContent}

Please produce the updated ${docType} document now.`;
}
