export type QuestionCategory =
  | 'business-logic'
  | 'technical-constraints'
  | 'nfr'
  | 'integrations';

export type QuestionPriority = 'critical' | 'important' | 'nice-to-have';

export interface Ambiguity {
  readonly id: string;
  readonly quote: string;
  readonly issue: string;
  readonly category: QuestionCategory;
}

export interface StakeholderQuestion {
  readonly id: string;
  readonly question: string;
  readonly category: QuestionCategory;
  readonly priority: QuestionPriority;
  readonly rationale: string;
  readonly relatedQuote: string;
  readonly ambiguityId?: string;
}

export interface BrdSummary {
  readonly scope: string;
  readonly actors: readonly string[];
  readonly businessRules: readonly string[];
  readonly integrations: readonly string[];
}

export interface BrdAnalysis {
  readonly id: string;
  readonly title: string;
  readonly rawContent: string;
  readonly summary: BrdSummary;
  readonly ambiguities: readonly Ambiguity[];
  readonly questions: readonly StakeholderQuestion[];
  readonly createdAt: string;
}

export interface BrdAnalysisMeta {
  readonly id: string;
  readonly title: string;
  readonly questionCount: number;
  readonly ambiguityCount: number;
  readonly createdAt: string;
}
