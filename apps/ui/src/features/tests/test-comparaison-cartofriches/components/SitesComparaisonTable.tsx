import { DsfrAccordion } from "@shared/components/dsfr/DsfrAccordion";
import { compterEcarts } from "../utils/comparaison";
import { genererCsvEcarts, telechargerCsv, type SiteCompare } from "../utils/export-csv";
import { EcartsDetail } from "./EcartsDetail";

interface SitesComparaisonTableProps {
  sites: SiteCompare[];
  onRetirer: (identifiant: string) => void;
  onVider: () => void;
}

/** Badge de synthèse d'un site selon son nombre d'écarts */
function badgeSynthese(site: SiteCompare): { label: string; variant: string } {
  if (!site.trouveCartofriches) {
    return { label: "Absent de Cartofriches", variant: "purple-glycine" };
  }
  const nbEcarts = compterEcarts(site.lignes);
  if (nbEcarts === 0) return { label: "Aucun écart", variant: "success" };
  return { label: `${nbEcarts} écart${nbEcarts > 1 ? "s" : ""}`, variant: "error" };
}

/**
 * Tableau cumulatif des sites comparés. Chaque site est un accordéon dépliable
 * affichant le détail des écarts. Export CSV de l'ensemble.
 */
export function SitesComparaisonTable({ sites, onRetirer, onVider }: SitesComparaisonTableProps) {
  if (sites.length === 0) {
    return (
      <div className="fr-callout fr-mt-4w">
        <p className="fr-callout__text">
          Sélectionnez une parcelle sur la carte puis lancez l'analyse pour l'ajouter au comparatif.
        </p>
      </div>
    );
  }

  const handleExport = (): void => {
    const csv = genererCsvEcarts(sites);
    telechargerCsv(csv, "ecarts-mutafriches-cartofriches");
  };

  return (
    <div className="fr-mt-4w">
      <div className="fr-grid-row fr-grid-row--middle fr-grid-row--right fr-mb-2w">
        <button type="button" className="fr-btn fr-btn--secondary fr-mr-2w" onClick={onVider}>
          Vider le comparatif
        </button>
        <button
          type="button"
          className="fr-btn fr-icon-download-line fr-btn--icon-left"
          onClick={handleExport}
        >
          Exporter en CSV
        </button>
      </div>

      {sites.map((site) => {
        const badge = badgeSynthese(site);
        return (
          <DsfrAccordion
            key={site.identifiant}
            title={`${site.commune} — ${site.identifiant}`}
            badge={{ label: badge.label, variant: badge.variant }}
          >
            <div className="fr-mb-2w fr-text--sm">
              <strong>Score Cartofriches :</strong> {site.scoreCartofriches}
              {site.ficheUrl ? (
                <>
                  {" — "}
                  <a
                    className="fr-link fr-icon-external-link-line fr-link--icon-right"
                    href={site.ficheUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Voir la fiche Cartofriches
                  </a>
                </>
              ) : null}
            </div>

            <EcartsDetail lignes={site.lignes} />

            <button
              type="button"
              className="fr-btn fr-btn--tertiary-no-outline fr-icon-delete-line fr-btn--icon-left fr-mt-2w"
              onClick={() => onRetirer(site.identifiant)}
            >
              Retirer ce site
            </button>
          </DsfrAccordion>
        );
      })}
    </div>
  );
}
