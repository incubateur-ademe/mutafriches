/**
 * Classe d'erreur personnalisée pour l'API
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Helper pour gérer les réponses d'API
 */
export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({
      message: response.statusText,
    }));
    throw new ApiError(response.status, errorBody.message || response.statusText, errorBody);
  }
  return response.json() as Promise<T>;
}
