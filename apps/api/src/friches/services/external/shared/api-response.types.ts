export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  source: string;
  responseTimeMs?: number;
}
