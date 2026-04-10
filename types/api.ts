export interface ApiError {
  readonly error: string;
  readonly code?: string;
}

export interface ApiSuccess<T> {
  readonly data: T;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface AnalyzeRequest {
  readonly content: string;
  readonly title?: string;
}

export interface ChatRequest {
  readonly messages: { role: 'user' | 'assistant'; content: string }[];
  readonly conversationId?: string;
  readonly analysisId?: string;
  readonly useInventoryContext?: boolean;
}

export interface ExportRequest {
  readonly format: 'markdown' | 'confluence';
}
