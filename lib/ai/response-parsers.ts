import { v4 as uuidv4 } from 'uuid';
import { BrdAnalysis, BrdSummary, Ambiguity, StakeholderQuestion } from '@/types/analysis';

interface RawAnalysisResponse {
  summary?: {
    scope?: string;
    actors?: string[];
    businessRules?: string[];
    integrations?: string[];
  };
  ambiguities?: Array<{
    id?: string;
    quote?: string;
    issue?: string;
    category?: string;
  }>;
  questions?: Array<{
    id?: string;
    question?: string;
    category?: string;
    priority?: string;
    rationale?: string;
    relatedQuote?: string;
    ambiguityId?: string;
  }>;
}

function extractJson(raw: string): string {
  // Try to extract JSON from markdown code blocks
  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();

  // Find first { and last } to extract raw JSON
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end !== -1) return raw.slice(start, end + 1);

  return raw.trim();
}

const VALID_CATEGORIES = ['business-logic', 'technical-constraints', 'nfr', 'integrations'] as const;
const VALID_PRIORITIES = ['critical', 'important', 'nice-to-have'] as const;

function normalizeCategory(cat?: string): Ambiguity['category'] {
  if (VALID_CATEGORIES.includes(cat as typeof VALID_CATEGORIES[number])) {
    return cat as Ambiguity['category'];
  }
  return 'business-logic';
}

function normalizePriority(p?: string): StakeholderQuestion['priority'] {
  if (VALID_PRIORITIES.includes(p as typeof VALID_PRIORITIES[number])) {
    return p as StakeholderQuestion['priority'];
  }
  return 'important';
}

export function parseBrdAnalysisResponse(
  rawText: string,
  title: string,
  rawContent: string
): BrdAnalysis {
  const jsonStr = extractJson(rawText);
  let parsed: RawAnalysisResponse;

  try {
    parsed = JSON.parse(jsonStr) as RawAnalysisResponse;
  } catch {
    // Fallback: return minimal valid structure
    return buildFallbackAnalysis(title, rawContent);
  }

  const summary: BrdSummary = {
    scope: parsed.summary?.scope ?? 'Unable to extract scope from BRD.',
    actors: parsed.summary?.actors?.filter(Boolean) ?? [],
    businessRules: parsed.summary?.businessRules?.filter(Boolean) ?? [],
    integrations: parsed.summary?.integrations?.filter(Boolean) ?? [],
  };

  const ambiguities: Ambiguity[] = (parsed.ambiguities ?? []).map((a, idx) => ({
    id: a.id ?? `AMB-${String(idx + 1).padStart(3, '0')}`,
    quote: a.quote ?? '',
    issue: a.issue ?? 'Unclear requirement',
    category: normalizeCategory(a.category),
  }));

  const questions: StakeholderQuestion[] = (parsed.questions ?? []).map((q, idx) => ({
    id: q.id ?? `Q-${String(idx + 1).padStart(3, '0')}`,
    question: q.question ?? 'Please clarify this requirement.',
    category: normalizeCategory(q.category),
    priority: normalizePriority(q.priority),
    rationale: q.rationale ?? '',
    relatedQuote: q.relatedQuote ?? '',
    ambiguityId: q.ambiguityId,
  }));

  return {
    id: uuidv4(),
    title,
    rawContent,
    summary,
    ambiguities,
    questions,
    createdAt: new Date().toISOString(),
  };
}

function buildFallbackAnalysis(title: string, rawContent: string): BrdAnalysis {
  return {
    id: uuidv4(),
    title,
    rawContent,
    summary: {
      scope: 'Unable to parse BRD analysis. Please try again.',
      actors: [],
      businessRules: [],
      integrations: [],
    },
    ambiguities: [],
    questions: [
      {
        id: 'Q-001',
        question: 'The BRD analysis could not be parsed. Please review the document and try again.',
        category: 'business-logic',
        priority: 'critical',
        rationale: 'Parse error occurred',
        relatedQuote: '',
      },
    ],
    createdAt: new Date().toISOString(),
  };
}
