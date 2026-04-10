/**
 * CLI-based Claude client — uses the local `claude` CLI (Claude Code)
 * instead of an API key. Works with claude.ai OAuth session.
 *
 * Used when ANTHROPIC_API_KEY is not set but `claude` CLI is available.
 */
import { spawn } from 'child_process';

const CLAUDE_BIN = process.env.CLAUDE_BIN ?? 'claude';

export async function callClaudeCli(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const fullPrompt = `${systemPrompt}\n\n---\n\n${userMessage}`;

    const proc = spawn(CLAUDE_BIN, ['--print', '--output-format', 'text'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Claude CLI exited with code ${code}: ${stderr.slice(0, 200)}`));
        return;
      }
      resolve(stdout.trim());
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn claude CLI: ${err.message}`));
    });

    // Send prompt via stdin
    proc.stdin.write(fullPrompt);
    proc.stdin.end();
  });
}

/**
 * Streaming version — yields text chunks via async generator.
 * claude CLI doesn't natively stream to stdout in --print mode,
 * so this wraps the completed response in a single chunk.
 */
export async function* streamClaudeCli(
  systemPrompt: string,
  userMessage: string
): AsyncGenerator<string> {
  const result = await callClaudeCli(systemPrompt, userMessage);
  // Yield in ~50-char chunks to simulate streaming in the UI
  const chunkSize = 50;
  for (let i = 0; i < result.length; i += chunkSize) {
    yield result.slice(i, i + chunkSize);
    // Small delay to give the streaming effect
    await new Promise((r) => setTimeout(r, 8));
  }
}
