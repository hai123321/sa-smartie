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

export function getModel(): string {
  return process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';
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
 * Unified call function. Auto-selects API or CLI based on env.
 */
export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  options: { maxTokens?: number } = {}
): Promise<string> {
  if (getAuthMode() === 'cli') {
    return callClaudeCli(systemPrompt, userMessage);
  }

  const client = getClaudeClient();
  const response = await client.messages.create({
    model: getModel(),
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
