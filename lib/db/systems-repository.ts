import { v4 as uuidv4 } from 'uuid';
import { graphDb } from './graph';
import { System, CreateSystemInput, UpdateSystemInput } from '@/types/inventory';

export const systemsRepository = {
  async findAll(): Promise<System[]> {
    const systems = await graphDb.getSystems();
    return systems.sort((a, b) => a.name.localeCompare(b.name));
  },

  async findById(id: string): Promise<System | null> {
    return graphDb.getSystemById(id);
  },

  async create(input: CreateSystemInput): Promise<System> {
    const now = new Date().toISOString();
    const system: System = {
      ...input,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    await graphDb.upsertSystem(system);
    return system;
  },

  async update(id: string, input: UpdateSystemInput): Promise<System | null> {
    const existing = await graphDb.getSystemById(id);
    if (!existing) return null;

    const updated: System = {
      ...existing,
      ...input,
      id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    await graphDb.upsertSystem(updated);
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const existing = await graphDb.getSystemById(id);
    if (!existing) return false;
    await graphDb.deleteSystem(id);
    return true;
  },

  async search(query: string): Promise<System[]> {
    return graphDb.searchSystems(query);
  },
};
