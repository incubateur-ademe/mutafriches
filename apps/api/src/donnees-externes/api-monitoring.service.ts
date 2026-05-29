import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { sql } from "drizzle-orm";
import { firstValueFrom } from "rxjs";
import type {
  ApiHealthItem,
  ApiHealthStatus,
  ApiMonitoringSnapshot,
} from "@mutafriches/shared-types";
import { DatabaseService } from "../shared/database/database.service";
import { API_MONITORING_ENTRIES, type ApiMonitoringEntry } from "./api-monitoring.config";

/** Type structurel minimal d'une réponse HTTP (compatible AxiosResponse) */
interface HttpResponseLike {
  status: number;
}

/** Seuil au-dessus duquel une API est considérée "slow" (ms) */
const SLOW_THRESHOLD_MS = 2000;

/** Timeout par requête (ms) */
const REQUEST_TIMEOUT_MS = 5000;

/** Durée de conservation des snapshots en base (jours) */
const SNAPSHOT_RETENTION_DAYS = 30;

interface SnapshotRow {
  data: ApiMonitoringSnapshot;
  checked_at: Date;
}

@Injectable()
export class ApiMonitoringService {
  private readonly logger = new Logger(ApiMonitoringService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly database: DatabaseService,
  ) {}

  /**
   * Récupère le dernier snapshot stocké en base, ou un snapshot vide si
   * aucun check n'a encore été exécuté.
   */
  async getLatestSnapshot(): Promise<ApiMonitoringSnapshot> {
    try {
      const result = await this.database.db.execute(sql`
        SELECT data, checked_at
        FROM api_health_snapshots
        ORDER BY id DESC
        LIMIT 1
      `);
      const rows = result as unknown as SnapshotRow[];
      if (rows.length === 0) {
        return this.emptySnapshot();
      }
      return rows[0].data;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.warn(`Lecture du dernier snapshot échouée : ${err.message}`);
      return this.emptySnapshot();
    }
  }

  /**
   * Déclenche un cycle de health-check : ping toutes les APIs en parallèle,
   * stocke un nouveau snapshot, supprime les snapshots > 30 jours.
   * Retourne le snapshot nouvellement inséré.
   */
  async runHealthCheck(): Promise<ApiMonitoringSnapshot> {
    const startedAt = Date.now();
    this.logger.log(`Démarrage du health-check sur ${API_MONITORING_ENTRIES.length} APIs externes`);

    const results = await Promise.allSettled(
      API_MONITORING_ENTRIES.map((entry) => this.checkOne(entry)),
    );

    const apis: ApiHealthItem[] = results.map((res, idx) => {
      if (res.status === "fulfilled") {
        return res.value;
      }
      // Promise.allSettled : on ne devrait jamais arriver ici car checkOne
      // ne throw pas — mais par sécurité on fabrique un item "down".
      const entry = API_MONITORING_ENTRIES[idx];
      return this.toHealthItem(entry, "down", null, null, String(res.reason));
    });

    const summary = {
      up: apis.filter((a) => a.status === "up").length,
      slow: apis.filter((a) => a.status === "slow").length,
      down: apis.filter((a) => a.status === "down").length,
    };

    const snapshot: ApiMonitoringSnapshot = {
      checkedAt: new Date().toISOString(),
      apis,
      summary,
    };

    await this.persistSnapshot(snapshot);
    await this.cleanupOldSnapshots();

    this.logger.log(
      `Health-check terminé en ${Date.now() - startedAt} ms — up=${summary.up}, slow=${summary.slow}, down=${summary.down}`,
    );

    return snapshot;
  }

  /**
   * Ping une API et retourne son ApiHealthItem.
   * Cette méthode ne throw jamais : toute erreur est capturée et traduite en "down".
   */
  private async checkOne(entry: ApiMonitoringEntry): Promise<ApiHealthItem> {
    const start = Date.now();
    try {
      const response = await firstValueFrom(
        entry.healthCheckMethod === "POST"
          ? this.httpService.post(entry.healthCheckUrl, entry.healthCheckPayload ?? {}, {
              timeout: REQUEST_TIMEOUT_MS,
              validateStatus: () => true, // ne throw pas sur 4xx / 5xx
            })
          : this.httpService.get(entry.healthCheckUrl, {
              timeout: REQUEST_TIMEOUT_MS,
              validateStatus: () => true,
            }),
      );
      const elapsed = Date.now() - start;
      return this.classifyResponse(entry, response, elapsed);
    } catch (error: unknown) {
      const elapsed = Date.now() - start;
      const err = error as { message?: string };
      const messageBrut = err?.message ?? String(error);
      this.logger.debug(`Health-check ${entry.key} échoué : ${messageBrut}`);
      return this.toHealthItem(entry, "down", null, elapsed, this.traduireErreur(messageBrut));
    }
  }

  private classifyResponse(
    entry: ApiMonitoringEntry,
    response: HttpResponseLike,
    elapsed: number,
  ): ApiHealthItem {
    const httpStatus = response.status;
    // 2xx ou 4xx => le serveur a répondu, l'API tourne (les 4xx sont attendus sur
    // certains endpoints qui exigent des paramètres précis qu'on ne fournit pas).
    // 5xx ou autres => l'API est en panne.
    const serverResponded = httpStatus >= 200 && httpStatus < 500;
    if (!serverResponded) {
      return this.toHealthItem(
        entry,
        "down",
        httpStatus,
        elapsed,
        `Erreur serveur (HTTP ${httpStatus})`,
      );
    }
    const status: ApiHealthStatus = elapsed < SLOW_THRESHOLD_MS ? "up" : "slow";
    return this.toHealthItem(entry, status, httpStatus, elapsed, null);
  }

  /**
   * Traduit les messages d'erreur techniques (axios / réseau) en français lisible.
   */
  private traduireErreur(message: string): string {
    const m = message.toLowerCase();
    if (m.includes("timeout")) return "Délai d'attente dépassé (5 s)";
    if (m.includes("etimedout")) return "Délai de connexion dépassé";
    if (m.includes("enotfound") || m.includes("eai_again")) return "Hôte introuvable (erreur DNS)";
    if (m.includes("econnrefused")) return "Connexion refusée par le serveur";
    if (m.includes("econnreset") || m.includes("socket hang up")) return "Connexion interrompue";
    if (m.includes("cert") || m.includes("ssl") || m.includes("tls"))
      return "Erreur de certificat SSL";
    if (m.includes("network")) return "Erreur réseau";
    return "Erreur réseau inattendue";
  }

  private toHealthItem(
    entry: ApiMonitoringEntry,
    status: ApiHealthStatus,
    httpStatus: number | null,
    responseTimeMs: number | null,
    error: string | null,
  ): ApiHealthItem {
    return {
      key: entry.key,
      name: entry.name,
      category: entry.category,
      description: entry.description,
      docUrl: entry.docUrl,
      adapterFile: entry.adapterFile,
      baseUrl: entry.baseUrl,
      healthCheckUrl: entry.healthCheckUrl,
      status,
      httpStatus,
      responseTimeMs,
      error,
    };
  }

  private async persistSnapshot(snapshot: ApiMonitoringSnapshot): Promise<void> {
    try {
      await this.database.db.execute(sql`
        INSERT INTO api_health_snapshots (data)
        VALUES (${JSON.stringify(snapshot)}::jsonb)
      `);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(`Persistance du snapshot échouée : ${err.message}`);
      throw err;
    }
  }

  private async cleanupOldSnapshots(): Promise<void> {
    try {
      await this.database.db.execute(sql`
        DELETE FROM api_health_snapshots
        WHERE checked_at < NOW() - INTERVAL '${sql.raw(String(SNAPSHOT_RETENTION_DAYS))} days'
      `);
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.warn(`Cleanup des anciens snapshots échoué : ${err.message}`);
    }
  }

  private emptySnapshot(): ApiMonitoringSnapshot {
    return {
      checkedAt: null,
      apis: [],
      summary: { up: 0, slow: 0, down: 0 },
    };
  }
}
