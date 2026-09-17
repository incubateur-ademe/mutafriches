import { ApiError } from "./api.types";
import type { HttpRequestOptions } from "./api.types";
import { buildUrlWithParams, extractErrorMessage, isNetworkError } from "./api.utils";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Exécute la requête et remonte les erreurs réseau et HTTP de façon uniforme.
   * La réponse brute est renvoyée : à l'appelant de la lire en JSON ou en fichier.
   */
  private async executer(endpoint: string, options: HttpRequestOptions = {}): Promise<Response> {
    try {
      const { params, ...fetchOptions } = options;

      // Construire l'URL complète avec query params si présents
      const url = buildUrlWithParams(`${this.baseUrl}${endpoint}`, params);

      // Headers par défaut
      const headers = {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      };

      // Faire la requête
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      // Gérer les erreurs HTTP
      if (!response.ok) {
        const errorInfo = await extractErrorMessage(response);
        throw new ApiError(errorInfo.message, errorInfo.statusCode, errorInfo.error);
      }

      return response;
    } catch (error) {
      // Gérer les erreurs réseau
      if (isNetworkError(error)) {
        throw new ApiError(
          "Impossible de contacter le serveur. Vérifiez votre connexion internet.",
          503,
          "Network Error",
        );
      }

      // Si c'est déjà une ApiError, la propager
      if (error instanceof ApiError) {
        throw error;
      }

      // Autre erreur
      throw new ApiError(
        error instanceof Error ? error.message : "Une erreur inattendue est survenue",
        500,
        "Unknown Error",
      );
    }
  }

  private async request<T>(endpoint: string, options: HttpRequestOptions = {}): Promise<T> {
    const response = await this.executer(endpoint, options);
    return response.json() as Promise<T>;
  }

  /**
   * Requête GET
   */
  async get<T>(endpoint: string, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "GET",
    });
  }

  /**
   * Requête POST
   */
  async post<T>(endpoint: string, body?: unknown, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Requête POST attendant un fichier en réponse (exports).
   * Renvoie le contenu et les en-têtes, qui portent le nom de fichier et le rapport d'export.
   */
  async postFichier(
    endpoint: string,
    body?: unknown,
    options?: HttpRequestOptions,
  ): Promise<{ blob: Blob; headers: Headers }> {
    const response = await this.executer(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });

    return { blob: await response.blob(), headers: response.headers };
  }

  /**
   * Requête PUT
   */
  async put<T>(endpoint: string, body?: unknown, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Requête PATCH
   */
  async patch<T>(endpoint: string, body?: unknown, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Requête DELETE
   */
  async delete<T>(endpoint: string, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "DELETE",
    });
  }
}

export const apiClient = new ApiClient(
  import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? "http://localhost:3000" : window.location.origin),
);
