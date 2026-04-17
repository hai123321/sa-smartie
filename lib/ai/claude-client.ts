import Anthropic from '@anthropic-ai/sdk';
import { callClaudeCli } from './cli-client';

/**
 * Auth mode detection:
 * - If ANTHROPIC_API_KEY is set → use API directly
 * - Otherwise → use local `claude` CLI (Claude Code OAuth session)
 */
export function getAuthMode(): 'api' | 'cli' {
  return process.env.ANTHROPIC_API_KEY ? 'api' : 'cli';
}

/**
 * Model tiers for routing:
 *
 * fast   → claude-haiku-4-5-20251001   (lightweight tasks: validation, short checks)
 * smart  → claude-sonnet-4-6           (main workload: analysis, session QA, cascade)
 * deep   → claude-opus-4-6             (heavyweight: full doc generation, BRD enrichment)
 *
 * Override any tier via env: MODEL_FAST, MODEL_SMART, MODEL_DEEP
 * Override ALL tiers at once: ANTHROPIC_MODEL (legacy, takes precedence over tiers)
 */
export type ModelTier = 'fast' | 'smart' | 'deep';

const TIER_DEFAULTS: Record<ModelTier, string> = {
  fast:  'claude-haiku-4-5-20251001',
  smart: 'claude-sonnet-4-6',
  deep:  'claude-opus-4-6',
};

export function getModel(tier: ModelTier = 'smart'): string {
  // Legacy single-model override wins for backwards-compat
  if (process.env.ANTHROPIC_MODEL) return process.env.ANTHROPIC_MODEL;

  const envKey = `MODEL_${tier.toUpperCase()}` as keyof NodeJS.ProcessEnv;
  return (process.env[envKey] as string | undefined) ?? TIER_DEFAULTS[tier];
}

let _client: Anthropic | null = null;

export function getClaudeClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error('ANTHROPIC_API_KEY not set — use callClaude() which auto-selects the right client');
  }
  if (!_client) {
    _client = new Anthropic({ apiKey: key });
  }
  return _client;
}

/**
 * Unified call function.
 * - tier controls which model is used when calling via API
 * - CLI mode always uses the installed `claude` binary (no tier concept)
 */
export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  options: { maxTokens?: number; tier?: ModelTier } = {}
): Promise<string> {
  if (getAuthMode() === 'cli') {
    return callClaudeCli(systemPrompt, userMessage);
  }

  const client = getClaudeClient();
  const model = getModel(options.tier ?? 'smart');

  const response = await client.messages.create({
    model,
    max_tokens: options.maxTokens ?? 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude API');
  }
  return content.text;
}
