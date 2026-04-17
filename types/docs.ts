export type DocType = 'architecture' | 'prd' | 'data-model' | 'api-design' | 'adr';

export const DOC_META: Record<DocType, { title: string; description: string; icon: string }> = {
  architecture: {
    title: 'Architecture Design',
    description: 'System components, C4 model, integration topology',
    icon: 'layers',
  },
  prd: {
    title: 'Product Requirements',
    description: 'User stories, acceptance criteria, feature breakdown',
    icon: 'list-checks',
  },
  'data-model': {
    title: 'Data Model',
    description: 'Entities, relationships, schema design',
    icon: 'database',
  },
  'api-design': {
    title: 'API Design',
    description: 'Endpoints, contracts, request/response schemas',
    icon: 'plug',
  },
  adr: {
    title: 'Architecture Decision Records',
    description: 'Key design decisions with context and rationale',
    icon: 'file-check',
  },
};

export const DOC_ORDER: DocType[] = ['architecture', 'prd', 'data-model', 'api-design', 'adr'];

export interface GeneratedDoc {
  readonly id: string;
  readonly analysisId: string;
  readonly type: DocType;
  readonly content: string; // Markdown
  readonly version: number;
  readonly generatedAt: string;
}

export interface DocSet {
  readonly analysisId: string;
  readonly enrichedBrdVersion: number;
  readonly docs: readonly GeneratedDoc[];
  readonly lastUpdatedAt: string;
}

export interface DocImpact {
  readonly docType: DocType;
  readonly reason: string;
  readonly before: string;
  readonly after: string;
  readonly changeSummary: string;
}

export interface CascadeResult {
  readonly changeDescription: string;
  readonly impactedDocTypes: DocType[];
  readonly impacts: readonly DocImpact[];
}
