/**
 * Réduit n'importe quelle erreur en un message concis sur une seule ligne.
 *
 * Objectif : ne JAMAIS logger l'objet erreur brut d'Axios — il embarque des références
 * circulaires (sockets, TLSWrap, session cache) que l'inspection profonde du logger déroule
 * sur des milliers de lignes, saturant les logs et bloquant l'event loop.
 */
export function safeError(error: unknown): string {
  if (error && typeof error === "object") {
    const e = error as Record<string, unknown>;

    // Erreur Axios : message + statut HTTP + code + URL, sans l'objet complet
    if (e.isAxiosError === true) {
      const response = e.response as { status?: number } | undefined;
      const config = e.config as { url?: string } | undefined;
      const parts = [typeof e.message === "string" ? e.message : "Erreur Axios"];
      if (response?.status) parts.push(`status=${response.status}`);
      if (e.code) parts.push(`code=${String(e.code)}`);
      if (config?.url) parts.push(`url=${config.url}`);
      return parts.join(" ");
    }

    if (error instanceof Error) {
      return `${error.name}: ${error.message}`;
    }
  }

  return String(error);
}
