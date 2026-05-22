import { useEffect, useState } from "react";
import type { ImportStatus, ImportStatusOutput } from "@mutafriches/shared-types";
import { donneesExternesService } from "../../../shared/services/api/api.donnees-externes.service";

const STATUS_LABELS: Record<ImportStatus, string> = {
  success: "OK",
  failed: "En erreur",
  running: "En cours",
  never: "Jamais importé",
};

const STATUS_BADGE_CLASSES: Record<ImportStatus, string> = {
  success: "fr-badge fr-badge--success fr-badge--sm",
  failed: "fr-badge fr-badge--error fr-badge--sm",
  running: "fr-badge fr-badge--info fr-badge--sm",
  never: "fr-badge fr-badge--warning fr-badge--sm",
};

function formatRows(count: number): string {
  return new Intl.NumberFormat("fr-FR").format(count);
}

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

function formatSource(source: string | null): string {
  if (!source) return "—";
  // Affiche le nom de fichier ou le hôte plutôt que le chemin complet
  const lastSlash = source.lastIndexOf("/");
  return lastSlash >= 0 && lastSlash < source.length - 1 ? source.slice(lastSlash + 1) : source;
}

export function ImportsPanel() {
  const [data, setData] = useState<ImportStatusOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    donneesExternesService
      .getImports()
      .then((result) => setData(result))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        setError(`Impossible de récupérer le statut des imports : ${message}`);
      })
      .finally(() => setLoading(false));
  }, []);

  const datasetsEnSouci =
    data?.imports.filter((item) => item.status === "failed" || item.rowsInDb === 0) ?? [];
  const hasIssue = datasetsEnSouci.length > 0;

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

      {data && hasIssue && (
        <div className="fr-alert fr-alert--warning fr-mb-4w">
          <h3 className="fr-alert__title">
            Attention : certains référentiels nécessitent une action
          </h3>
          <p>Les datasets suivants sont en erreur ou ne contiennent aucune donnée en base :</p>
          <ul>
            {datasetsEnSouci.map((item) => (
              <li key={item.key}>
                <strong>{item.label}</strong> —{" "}
                {item.status === "failed"
                  ? "dernier import en erreur"
                  : item.status === "never"
                    ? "aucun import enregistré"
                    : "table vide"}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data && (
        <div className="fr-table fr-table--bordered">
          <div className="fr-table__wrapper">
            <div className="fr-table__container">
              <div className="fr-table__content">
                <table>
                  <caption>
                    Référentiels importés en base
                    <div className="fr-table__caption__desc">
                      Statut du dernier import enregistré dans la table <code>raw_imports_log</code>{" "}
                      et nombre de lignes actuellement présentes en base.
                    </div>
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Dataset</th>
                      <th scope="col">Statut</th>
                      <th scope="col">Lignes en base</th>
                      <th scope="col">Dernier import</th>
                      <th scope="col">Fichier source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.imports.map((item) => (
                      <tr key={item.key}>
                        <td>
                          <strong>{item.label}</strong>
                        </td>
                        <td>
                          <span className={STATUS_BADGE_CLASSES[item.status]}>
                            {STATUS_LABELS[item.status]}
                          </span>
                        </td>
                        <td>{formatRows(item.rowsInDb)}</td>
                        <td>{formatDate(item.lastImportAt)}</td>
                        <td title={item.sourcePath ?? undefined}>
                          <code>{formatSource(item.sourcePath)}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {data && (
        <p className="fr-text--sm fr-mt-2w">Données générées le {formatDate(data.generatedAt)}.</p>
      )}
    </>
  );
}
