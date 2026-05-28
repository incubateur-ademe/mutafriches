import { useEffect, useMemo, useState } from "react";
import type {
  ApiHealthItem,
  ApiHealthStatus,
  ApiMonitoringSnapshot,
} from "@mutafriches/shared-types";
import { donneesExternesService } from "../../../shared/services/api/api.donnees-externes.service";

const STATUS_LABELS: Record<ApiHealthStatus, string> = {
  up: "OK",
  slow: "Lent",
  down: "Indisponible",
};

const STATUS_BADGE_CLASSES: Record<ApiHealthStatus, string> = {
  up: "fr-badge fr-badge--success fr-badge--sm",
  slow: "fr-badge fr-badge--warning fr-badge--sm",
  down: "fr-badge fr-badge--error fr-badge--sm",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Regroupe les APIs par catégorie en conservant l'ordre d'apparition.
 */
function groupByCategory(
  apis: ApiHealthItem[],
): Array<{ category: string; items: ApiHealthItem[] }> {
  const groups: Map<string, ApiHealthItem[]> = new Map();
  for (const api of apis) {
    const existing = groups.get(api.category);
    if (existing) {
      existing.push(api);
    } else {
      groups.set(api.category, [api]);
    }
  }
  return Array.from(groups.entries()).map(([category, items]) => ({ category, items }));
}

export function ApisExternesPanel() {
  const [snapshot, setSnapshot] = useState<ApiMonitoringSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    donneesExternesService
      .getApis()
      .then((result) => setSnapshot(result))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        setError(`Impossible de récupérer le snapshot des APIs : ${message}`);
      })
      .finally(() => setLoading(false));
  }, []);

  const apisDown = snapshot?.apis.filter((a) => a.status === "down") ?? [];
  const grouped = useMemo(() => groupByCategory(snapshot?.apis ?? []), [snapshot]);
  const noSnapshotYet = snapshot !== null && snapshot.checkedAt === null;

  return (
    <>
      {loading && (
        <div className="fr-mb-4w">
          <p>Chargement en cours…</p>
        </div>
      )}

      {error && (
        <div className="fr-alert fr-alert--error fr-mb-4w">
          <h3 className="fr-alert__title">Erreur</h3>
          <p>{error}</p>
        </div>
      )}

      {noSnapshotYet && (
        <div className="fr-alert fr-alert--info fr-mb-4w">
          <h3 className="fr-alert__title">Aucun check effectué pour l'instant</h3>
          <p>
            Le workflow GitHub Actions <code>api-monitoring</code> n'a pas encore tourné. Lancez-le
            manuellement depuis l'onglet « Actions » de GitHub (option <em>Run workflow</em>), ou
            attendez le prochain cron quotidien (5h UTC).
          </p>
        </div>
      )}

      {snapshot && snapshot.checkedAt && apisDown.length > 0 && (
        <div className="fr-alert fr-alert--warning fr-mb-4w">
          <h3 className="fr-alert__title">
            {apisDown.length} API{apisDown.length > 1 ? "s" : ""} en panne
          </h3>
          <ul>
            {apisDown.map((api) => (
              <li key={api.key}>
                <strong>{api.name}</strong>
                {api.error ? ` — ${api.error}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {snapshot && snapshot.checkedAt && (
        <p className="fr-text--sm fr-mb-2w">
          Dernier check : <strong>{formatDate(snapshot.checkedAt)}</strong> — UP :{" "}
          {snapshot.summary.up} · Lent : {snapshot.summary.slow} · Indisponible :{" "}
          {snapshot.summary.down}
        </p>
      )}

      {snapshot && snapshot.checkedAt && (
        <div className="fr-table fr-table--bordered">
          <div className="fr-table__wrapper">
            <div className="fr-table__container">
              <div className="fr-table__content">
                <table>
                  <caption>
                    APIs externes utilisées par les adapters d'enrichissement
                    <div className="fr-table__caption__desc">
                      Résultat du dernier health-check journalier (cron GitHub Actions).
                    </div>
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">API</th>
                      <th scope="col">Description</th>
                      <th scope="col">Statut</th>
                    </tr>
                  </thead>
                  {grouped.map((group) => (
                    <tbody key={group.category}>
                      <tr>
                        <th
                          scope="rowgroup"
                          colSpan={3}
                          style={{ backgroundColor: "var(--background-alt-grey)" }}
                        >
                          {group.category}
                        </th>
                      </tr>
                      {group.items.map((api) => (
                        <tr key={api.key}>
                          <td>
                            <a
                              href={api.docUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Ouvrir la documentation"
                            >
                              <strong>{api.name}</strong>
                            </a>
                          </td>
                          <td>{api.description}</td>
                          <td>
                            <span
                              className={STATUS_BADGE_CLASSES[api.status]}
                              title={api.error ?? undefined}
                            >
                              {STATUS_LABELS[api.status]}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  ))}
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
