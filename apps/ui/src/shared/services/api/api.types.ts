// Types pour les erreurs API
export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
}

export class ApiError extends Error {
  statusCode: number;
  error?: string;

  constructor(message: string, statusCode: number, error?: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.error = error;
  }
}

// Options communes pour les appels API
export interface ApiCallOptions {
  isIframe?: boolean;
  integrator?: string;
}

// Options spécifiques pour calculer mutabilité
export interface CalculerMutabiliteOptions extends ApiCallOptions {
  modeDetaille?: boolean;
  sansEnrichissement?: boolean;
}

// Options pour les requêtes HTTP
export interface HttpRequestOptions extends Record<string, any> {
  params?: Record<string, string>;
}
