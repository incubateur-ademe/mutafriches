// Types pour l'API Health
export interface HealthResponse {
  status: "OK" | "DEGRADED" | "ERROR";
  timestamp: string;
  service: string;
  version: string;
  checks: {
    api: "OK" | "ERROR";
    database: "OK" | "DISCONNECTED" | "ERROR";
  };
}
