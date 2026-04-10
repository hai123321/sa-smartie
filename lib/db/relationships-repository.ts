import { v4 as uuidv4 } from 'uuid';
import { graphDb } from './graph';
import { Relationship, CreateRelationshipInput } from '@/types/inventory';

export const relationshipsRepository = {
  async findAll(): Promise<Relationship[]> {
    return graphDb.getRelationships();
  },

  async findById(id: string): Promise<Relationship | null> {
    return graphDb.getRelationshipById(id);
  },

  async findBySystem(systemId: string): Promise<Relationship[]> {
    return graphDb.getRelationshipsBySystem(systemId);
  },

  async create(input: CreateRelationshipInput): Promise<Relationship> {
    const relationship: Relationship = {
      ...input,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    await graphDb.upsertRelationship(relationship);
    return relationship;
  },

  async delete(id: string): Promise<boolean> {
    const existing = await graphDb.getRelationshipById(id);
    if (!existing) return false;
    await graphDb.deleteRelationship(id);
    return true;
  },
};
