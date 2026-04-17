export type AnswerStatus = 'pending' | 'answered' | 'skipped';

export interface QuestionAnswer {
  readonly questionId: string;
  readonly answer: string;
  readonly clarification?: string;   // AI follow-up question text
  readonly clarificationAnswer?: string; // PO's response to follow-up
  readonly status: AnswerStatus;
  readonly answeredAt?: string;
}

export interface BrdSession {
  readonly id: string;
  readonly analysisId: string;
  readonly answers: readonly QuestionAnswer[];
  readonly enrichedBrd?: string;
  readonly sessionStatus: 'in-progress' | 'finalized';
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface BrdSessionMeta {
  readonly id: string;
  readonly analysisId: string;
  readonly answeredCount: number;
  readonly totalCount: number;
  readonly sessionStatus: 'in-progress' | 'finalized';
  readonly updatedAt: string;
}
