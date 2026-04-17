import { BrdAnalysis, StakeholderQuestion } from '@/types/analysis';
import { QuestionAnswer } from '@/types/session';

export const SESSION_CLARIFY_SYSTEM_PROMPT = `You are a Solution Architect facilitating a requirements clarification session with a Product Owner.

Your role is to evaluate the PO's answer to a stakeholder question and decide if it's sufficiently clear for architecture decision-making.

Output ONLY a valid JSON object:
{
  "isSufficient": true | false,
  "followUpQuestion": "string | null — ask only if the answer leaves critical ambiguity"
}

Rules:
- "isSufficient": true if the answer provides enough information to proceed with architecture design
- Only ask a follow-up if a critical ambiguity remains (missing numbers, unclear ownership, undefined behavior)
- Keep the follow-up question short, specific, and focused on ONE thing
- If the PO said "TBD", "not sure", or gave a vague answer on a CRITICAL question, always follow up
- For "nice-to-have" questions, be lenient — almost any answer is sufficient
- Never ask more than one follow-up per question`;

export function buildClarifyPrompt(
  question: StakeholderQuestion,
  answer: string
): string {
  return `Question (${question.priority} priority):
"${question.question}"

Rationale: ${question.rationale}

PO's Answer:
"${answer}"

Is this answer sufficient for architecture decision-making?`;
}

export const BRD_ENRICH_SYSTEM_PROMPT = `You are a Solution Architect writing an enriched Business Requirements Document.

You will receive:
1. The original BRD content
2. A list of clarification Q&A from the Product Owner

Your task: Rewrite and enrich the BRD by integrating the PO's answers into the appropriate sections.

Rules:
- Preserve ALL original content and structure
- Add a new section "## Clarification Addendum" at the end with all Q&A
- Where an answer directly clarifies an existing section, add an inline note: > **Clarified:** [answer]
- If an answer introduces new requirements, add them as sub-points under the relevant section
- Keep the same markdown formatting style as the original
- Do NOT remove any original requirements
- Output the complete enriched BRD as plain markdown (no JSON wrapper)`;

export function buildEnrichBrdPrompt(
  analysis: BrdAnalysis,
  answers: readonly QuestionAnswer[]
): string {
  const answeredQA = answers
    .filter((a) => a.status === 'answered')
    .map((a) => {
      const q = analysis.questions.find((q) => q.id === a.questionId);
      if (!q) return null;
      const parts = [`**Q (${q.priority}): ${q.question}**\nA: ${a.answer}`];
      if (a.clarification && a.clarificationAnswer) {
        parts.push(`  Follow-up: ${a.clarification}\n  A: ${a.clarificationAnswer}`);
      }
      return parts.join('\n');
    })
    .filter(Boolean)
    .join('\n\n');

  return `## Original BRD: "${analysis.title}"

${analysis.rawContent}

---

## Clarification Q&A from Product Owner

${answeredQA || 'No answers provided.'}

---

Please produce the enriched BRD now.`;
}
