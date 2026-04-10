import { z } from 'zod';

// Inventory schemas
export const SystemTypeSchema = z.enum([
  'web-app', 'mobile-app', 'api', 'database', 'message-broker',
  'identity', 'file-storage', 'cdn', 'monitoring', 'third-party', 'legacy', 'other',
]);

export const SystemStatusSchema = z.enum(['active', 'deprecated', 'planned']);

export const RelationshipTypeSchema = z.enum([
  'integrates-with', 'depends-on', 'publishes-to', 'consumes-from',
  'authenticates-via', 'stores-data-in', 'proxied-by', 'monitored-by',
]);

export const FrequencyTypeSchema = z.enum([
  'realtime', 'near-realtime', 'batch-hourly', 'batch-daily', 'on-demand',
]);

export const CreateSystemSchema = z.object({
  name: z.string().min(1).max(100),
  type: SystemTypeSchema,
  description: z.string().max(1000).default(''),
  techStack: z.array(z.string().max(50)).max(20).default([]),
  team: z.string().max(100).default(''),
  status: SystemStatusSchema.default('active'),
  version: z.string().max(50).optional(),
});

export const UpdateSystemSchema = CreateSystemSchema.partial();

export const CreateRelationshipSchema = z.object({
  sourceId: z.string().uuid(),
  targetId: z.string().uuid(),
  predicate: RelationshipTypeSchema,
  protocol: z.string().max(50).optional(),
  dataFormat: z.string().max(50).optional(),
  frequency: FrequencyTypeSchema.optional(),
  description: z.string().max(500).optional(),
  sla: z.string().max(100).optional(),
});

// Analysis schemas
export const AnalyzeRequestSchema = z.object({
  content: z.string().min(10).max(100000),
  title: z.string().max(200).optional(),
});

export const AmbiguitySchema = z.object({
  id: z.string(),
  quote: z.string(),
  issue: z.string(),
  category: z.enum(['business-logic', 'technical-constraints', 'nfr', 'integrations']),
});

export const StakeholderQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  category: z.enum(['business-logic', 'technical-constraints', 'nfr', 'integrations']),
  priority: z.enum(['critical', 'important', 'nice-to-have']),
  rationale: z.string(),
  relatedQuote: z.string(),
  ambiguityId: z.string().optional(),
});

export const BrdAnalysisSchema = z.object({
  id: z.string(),
  title: z.string(),
  rawContent: z.string(),
  summary: z.object({
    scope: z.string(),
    actors: z.array(z.string()),
    businessRules: z.array(z.string()),
    integrations: z.array(z.string()),
  }),
  ambiguities: z.array(AmbiguitySchema),
  questions: z.array(StakeholderQuestionSchema),
  createdAt: z.string(),
});

// Chat schemas
export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(100),
  conversationId: z.string().optional(),
  analysisId: z.string().optional(),
  useInventoryContext: z.boolean().default(true),
});

export const ExportRequestSchema = z.object({
  format: z.enum(['markdown', 'confluence']),
});

// Import schema
export const ImportInventorySchema = z.object({
  systems: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: SystemTypeSchema,
    description: z.string(),
    techStack: z.array(z.string()),
    team: z.string(),
    status: SystemStatusSchema,
    version: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })),
  relationships: z.array(z.object({
    id: z.string(),
    sourceId: z.string(),
    targetId: z.string(),
    predicate: RelationshipTypeSchema,
    protocol: z.string().optional(),
    dataFormat: z.string().optional(),
    frequency: FrequencyTypeSchema.optional(),
    description: z.string().optional(),
    sla: z.string().optional(),
    createdAt: z.string(),
  })),
});
