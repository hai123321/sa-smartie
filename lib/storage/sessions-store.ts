import fs from 'fs/promises';
import path from 'path';
import { BrdSession, BrdSessionMeta, QuestionAnswer } from '@/types/session';

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), 'data');
const SESSIONS_DIR = path.join(DATA_DIR, 'sessions');

async function ensureDir() {
  await fs.mkdir(SESSIONS_DIR, { recursive: true });
}

export const sessionsStore = {
  async save(session: BrdSession): Promise<void> {
    await ensureDir();
    const file = path.join(SESSIONS_DIR, `${session.analysisId}.json`);
    const tmp = file + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(session, null, 2), 'utf-8');
    await fs.rename(tmp, file);
  },

  async getByAnalysisId(analysisId: string): Promise<BrdSession | null> {
    await ensureDir();
    try {
      const file = path.join(SESSIONS_DIR, `${analysisId}.json`);
      const raw = await fs.readFile(file, 'utf-8');
      return JSON.parse(raw) as BrdSession;
    } catch {
      return null;
    }
  },

  async upsertAnswer(analysisId: string, answer: QuestionAnswer): Promise<BrdSession | null> {
    const session = await sessionsStore.getByAnalysisId(analysisId);
    if (!session) return null;

    const existingIdx = session.answers.findIndex((a) => a.questionId === answer.questionId);
    const newAnswers =
      existingIdx >= 0
        ? session.answers.map((a, i) => (i === existingIdx ? answer : a))
        : [...session.answers, answer];

    const updated: BrdSession = {
      ...session,
      answers: newAnswers,
      updatedAt: new Date().toISOString(),
    };
    await sessionsStore.save(updated);
    return updated;
  },

  async setEnrichedBrd(analysisId: string, enrichedBrd: string): Promise<BrdSession | null> {
    const session = await sessionsStore.getByAnalysisId(analysisId);
    if (!session) return null;

    const updated: BrdSession = {
      ...session,
      enrichedBrd,
      sessionStatus: 'finalized',
      updatedAt: new Date().toISOString(),
    };
    await sessionsStore.save(updated);
    return updated;
  },

  async getMeta(analysisId: string): Promise<BrdSessionMeta | null> {
    const session = await sessionsStore.getByAnalysisId(analysisId);
    if (!session) return null;
    return {
      id: session.id,
      analysisId: session.analysisId,
      answeredCount: session.answers.filter((a) => a.status === 'answered').length,
      totalCount: session.answers.length,
      sessionStatus: session.sessionStatus,
      updatedAt: session.updatedAt,
    };
  },
};
