export type SystemType =
  | 'web-app'
  | 'mobile-app'
  | 'api'
  | 'database'
  | 'message-broker'
  | 'identity'
  | 'file-storage'
  | 'cdn'
  | 'monitoring'
  | 'third-party'
  | 'legacy'
  | 'other';

export type SystemStatus = 'active' | 'deprecated' | 'planned';

export type RelationshipType =
  | 'integrates-with'
  | 'depends-on'
  | 'publishes-to'
  | 'consumes-from'
  | 'authenticates-via'
  | 'stores-data-in'
  | 'proxied-by'
  | 'monitored-by';

export type FrequencyType =
  | 'realtime'
  | 'near-realtime'
  | 'batch-hourly'
  | 'batch-daily'
  | 'on-demand';

export interface System {
  readonly id: string;
  readonly name: string;
  readonly type: SystemType;
  readonly description: string;
  readonly techStack: readonly string[];
  readonly team: string;
  readonly status: SystemStatus;
  readonly version?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Relationship {
  readonly id: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly predicate: RelationshipType;
  readonly protocol?: string;
  readonly dataFormat?: string;
  readonly frequency?: FrequencyType;
  readonly description?: string;
  readonly sla?: string;
  readonly createdAt: string;
}

export interface GraphData {
  readonly nodes: readonly System[];
  readonly edges: readonly Relationship[];
}

export type CreateSystemInput = Omit<System, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateSystemInput = Partial<Omit<System, 'id' | 'createdAt' | 'updatedAt'>>;
export type CreateRelationshipInput = Omit<Relationship, 'id' | 'createdAt'>;
