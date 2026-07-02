import { compterEcarts } from "../utils/comparaison";
import { genererCsvEcarts, telechargerCsv, type SiteCompare } from "../utils/export-csv";
import { EcartsDetail } from "./EcartsDetail";

interface SiteComparaisonDetailProps {
  site: SiteCompare;
}

/**
 * Panneau complet de comparaison d'un site (pas d'accordéon) : en-tête, score Cartofriches,
 * lien vers la fiche, tableau des écarts et export CSV.
 */
export function SiteComparaisonDetail({ site }: SiteComparaisonDetailProps) {
  const nbEcarts = compterEcarts(site.lignes);

  const badge = !site.trouveCartofriches
    ? { label: "Absent de Cartofriches", variant: "fr-badge--purple-glycine" }
    : nbEcarts === 0
      ? { label: "Aucun écart", variant: "fr-badge--success" }
      : { label: `${nbEcarts} écart${nbEcarts > 1 ? "s" : ""}`, variant: "fr-badge--error" };

  const handleExport = (): void => {
    telechargerCsv(genererCsvEcarts([site]), `ecarts-${site.identifiant}`);
  };

  return (
    <section className="fr-mt-4w">
      <div className="fr-grid-row fr-grid-row--middle fr-mb-2w">
        <div className="fr-col">
          <h2 className="fr-h4 fr-mb-1v">
            {site.commune} — {site.identifiant}
          </h2>
          <p className="fr-mb-0">
            <span className={`fr-badge fr-badge--sm ${badge.variant}`}>{badge.label}</span>
            <span className="fr-ml-2w fr-text--sm">
              <strong>Score Cartofriches :</strong> {site.scoreCartofriches}
            </span>
          </p>
        </div>
        <div className="fr-col-auto">
          <button
            type="button"
            className="fr-btn fr-btn--secondary fr-icon-download-line fr-btn--icon-left"
            onClick={handleExport}
          >
            Exporter en CSV
          </button>
        </div>
      </div>

      {site.ficheUrl ? (
        <p className="fr-mb-2w fr-text--sm">
          <a
            className="fr-link fr-icon-external-link-line fr-link--icon-right"
            href={site.ficheUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Voir la fiche Cartofriches
          </a>
        </p>
      ) : null}

      <EcartsDetail lignes={site.lignes} />
    </section>
  );
}
