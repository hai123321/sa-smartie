export interface Message {
  readonly id: string;
  readonly role: 'user' | 'assistant';
  readonly content: string;
  readonly timestamp: string;
}

export interface Conversation {
  readonly id: string;
  readonly title: string;
  readonly messages: readonly Message[];
  readonly attachedAnalysisId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ConversationMeta {
  readonly id: string;
  readonly title: string;
  readonly messageCount: number;
  readonly attachedAnalysisId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
