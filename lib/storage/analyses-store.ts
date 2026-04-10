import fs from 'fs/promises';
import path from 'path';
import { BrdAnalysis, BrdAnalysisMeta } from '@/types/analysis';

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), 'data');
const ANALYSES_DIR = path.join(DATA_DIR, 'analyses');

async function ensureDir() {
  await fs.mkdir(ANALYSES_DIR, { recursive: true });
}

export const analysesStore = {
  async save(analysis: BrdAnalysis): Promise<void> {
    await ensureDir();
    const file = path.join(ANALYSES_DIR, `${analysis.id}.json`);
    const tmp = file + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(analysis, null, 2), 'utf-8');
    await fs.rename(tmp, file);
  },

  async getById(id: string): Promise<BrdAnalysis | null> {
    await ensureDir();
    try {
      const file = path.join(ANALYSES_DIR, `${id}.json`);
      const raw = await fs.readFile(file, 'utf-8');
      return JSON.parse(raw) as BrdAnalysis;
    } catch {
      return null;
    }
  },

  async getAll(): Promise<BrdAnalysisMeta[]> {
    await ensureDir();
    try {
      const files = await fs.readdir(ANALYSES_DIR);
      const metas: BrdAnalysisMeta[] = [];
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        try {
          const raw = await fs.readFile(path.join(ANALYSES_DIR, file), 'utf-8');
          const analysis = JSON.parse(raw) as BrdAnalysis;
          metas.push({
            id: analysis.id,
            title: analysis.title,
            questionCount: analysis.questions.length,
            ambiguityCount: analysis.ambiguities.length,
            createdAt: analysis.createdAt,
          });
        } catch {
          // skip corrupt files
        }
      }
      return metas.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch {
      return [];
    }
  },

  async deleteById(id: string): Promise<boolean> {
    await ensureDir();
    try {
      await fs.unlink(path.join(ANALYSES_DIR, `${id}.json`));
      return true;
    } catch {
      return false;
    }
  },
};
