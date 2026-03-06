import React, { useState } from "react";
import type {
  MutabiliteOutputDto,
  UsageResultatDetaille,
  DetailCritere,
} from "@mutafriches/shared-types";
import { getMutabilityColor } from "../../utils/debug.helpers";

/** Labels français pour les types d'usage */
const USAGE_LABELS: Record<string, string> = {
  residentiel: "Résidentiel",
  equipements: "Équipements publics",
  culture: "Culture et loisirs",
  tertiaire: "Tertiaire",
  industrie: "Industrie",
  renaturation: "Renaturation",
  photovoltaique: "Photovoltaïque",
};

/** Labels français pour les noms de critères techniques */
const CRITERE_LABELS: Record<string, string> = {
  typeProprietaire: "Type de propriétaire",
  surfaceSite: "Surface du site",
  surfaceBati: "Surface bâtie",
  etatBatiInfrastructure: "État du bâti",
  presencePollution: "Présence de pollution",
  siteEnCentreVille: "Site en centre-ville",
  tauxLogementsVacants: "Taux de logements vacants",
  raccordementEau: "Raccordement eau",
  qualiteVoieDesserte: "Qualité de la voie de desserte",
  distanceAutoroute: "Distance autoroute",
  distanceTransportCommun: "Distance transport en commun",
  proximiteCommercesServices: "Commerces et services",
  distanceRaccordementElectrique: "Distance raccordement électrique",
  zonageReglementaire: "Zonage réglementaire",
  presenceRisquesNaturels: "Risques naturels",
  presenceRisquesTechnologiques: "Risques technologiques",
  zonagePatrimonial: "Zonage patrimonial",
  qualitePaysage: "Qualité du paysage",
  valeurArchitecturaleHistorique: "Valeur architecturale / historique",
  zonageEnvironnemental: "Zonage environnemental",
  trameVerteEtBleue: "Trame verte et bleue",
};

/** Critères à mettre en évidence (poids élevé et/ou intérêt analytique) */
const CRITERES_SURLIGNER = new Set([
  "zonageReglementaire",
  "zonageEnvironnemental",
  "zonagePatrimonial",
]);

/**
 * Retourne le label d'impact pour un scoreBrut
 */
function getImpactLabel(scoreBrut: number): string {
  if (scoreBrut >= 2) return "Très positif";
  if (scoreBrut >= 1) return "Positif";
  if (scoreBrut > 0 && scoreBrut < 1) return "Neutre";
  if (scoreBrut >= -1 && scoreBrut < 0) return "Négatif";
  if (scoreBrut < -1) return "Très négatif";
  return "Neutre";
}

/**
 * Retourne la classe CSS pour la couleur d'un score
 */
function getScoreClassName(scoreBrut: number): string {
  if (scoreBrut >= 2) return "detail-algo__score--tres-positif";
  if (scoreBrut >= 1) return "detail-algo__score--positif";
  if (scoreBrut > 0 && scoreBrut < 1) return "detail-algo__score--neutre";
  if (scoreBrut >= -1 && scoreBrut < 0) return "detail-algo__score--negatif";
  if (scoreBrut < -1) return "detail-algo__score--tres-negatif";
  return "detail-algo__score--neutre";
}

/**
 * Formate la valeur d'un critère pour l'affichage
 */
function formatValeur(valeur: string | number | boolean): string {
  if (typeof valeur === "boolean") return valeur ? "Oui" : "Non";
  if (typeof valeur === "number") return valeur.toLocaleString("fr-FR");
  return String(valeur);
}

interface DetailAlgorithmeSectionProps {
  mutabilityData: MutabiliteOutputDto | null;
}

export const DetailAlgorithmeSection: React.FC<DetailAlgorithmeSectionProps> = ({
  mutabilityData,
}) => {
  const [selectedUsage, setSelectedUsage] = useState<string | null>(null);

  // Vérifier si les données détaillées sont disponibles
  const resultatsDetailles = mutabilityData?.resultats as UsageResultatDetaille[] | undefined;
  const hasDetailedData = resultatsDetailles?.some((r) => r.detailsCalcul);

  if (!mutabilityData || !hasDetailedData) {
    return (
      <details className="debug-panel__section">
        <summary>Détail de l'algorithme</summary>
        <div className="debug-panel__section-content">
          <p className="fr-text--sm">
            Données détaillées non disponibles. Le mode détaillé n'est pas activé.
          </p>
        </div>
      </details>
    );
  }

  // Usage sélectionné ou le premier par défaut
  const activeUsage = selectedUsage ?? resultatsDetailles?.[0]?.usage;
  const activeResult = resultatsDetailles?.find((r) => r.usage === activeUsage);
  const details = activeResult?.detailsCalcul;

  /**
   * Rend une ligne de critère dans le tableau
   */
  const renderCritereRow = (critere: DetailCritere, type: "avantage" | "contrainte" | "vide") => {
    const isHighlighted = CRITERES_SURLIGNER.has(critere.critere);
    const rowClass = [
      type === "vide" ? "detail-algo__row--vide" : "",
      isHighlighted ? "detail-algo__row--highlight" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <tr key={`${critere.critere}-${type}`} className={rowClass}>
        <td className="detail-algo__critere-name">
          {CRITERE_LABELS[critere.critere] ?? critere.critere}
        </td>
        <td className="detail-algo__critere-valeur">{formatValeur(critere.valeur)}</td>
        <td>
          <span className={`detail-algo__impact-badge ${getScoreClassName(critere.scoreBrut)}`}>
            {getImpactLabel(critere.scoreBrut)} ({critere.scoreBrut > 0 ? "+" : ""}
            {critere.scoreBrut})
          </span>
        </td>
        <td className="detail-algo__poids">{critere.poids}</td>
        <td className="detail-algo__pondere">
          <strong>
            {critere.scorePondere > 0 ? "+" : ""}
            {critere.scorePondere.toFixed(1)}
          </strong>
        </td>
      </tr>
    );
  };

  return (
    <details className="debug-panel__section">
      <summary>Détail de l'algorithme</summary>
      <div className="debug-panel__section-content">
        {/* Sélecteur d'usage */}
        <div className="detail-algo__usage-selector">
          {resultatsDetailles?.map((r) => (
            <button
              key={r.usage}
              type="button"
              className={`detail-algo__usage-btn ${r.usage === activeUsage ? "detail-algo__usage-btn--active" : ""}`}
              onClick={() => setSelectedUsage(r.usage)}
              style={{
                borderColor:
                  r.usage === activeUsage ? getMutabilityColor(r.indiceMutabilite) : undefined,
                backgroundColor:
                  r.usage === activeUsage ? getMutabilityColor(r.indiceMutabilite) : undefined,
              }}
            >
              <span className="detail-algo__usage-btn-label">
                {USAGE_LABELS[r.usage] ?? r.usage}
              </span>
              <span className="detail-algo__usage-btn-score">{r.indiceMutabilite}%</span>
            </button>
          ))}
        </div>

        {/* Synthèse pour l'usage sélectionné */}
        {activeResult && details && (
          <>
            {/* Barre avantages / contraintes */}
            <div className="detail-algo__ratio-bar">
              <div className="detail-algo__ratio-header">
                <span>
                  Avantages : <strong>{details.totalAvantages.toFixed(1)}</strong>
                </span>
                <span className="detail-algo__ratio-formula">
                  Indice = avantages / (avantages + contraintes) ={" "}
                  <strong>{activeResult.indiceMutabilite}%</strong>
                </span>
                <span>
                  Contraintes : <strong>{details.totalContraintes.toFixed(1)}</strong>
                </span>
              </div>
              <div className="detail-algo__ratio-track">
                <div
                  className="detail-algo__ratio-fill detail-algo__ratio-fill--avantages"
                  style={{
                    width: `${(details.totalAvantages / (details.totalAvantages + details.totalContraintes)) * 100}%`,
                  }}
                />
                <div
                  className="detail-algo__ratio-fill detail-algo__ratio-fill--contraintes"
                  style={{
                    width: `${(details.totalContraintes / (details.totalAvantages + details.totalContraintes)) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Tableau des critères */}
            <table className="debug-panel__usage-table detail-algo__table">
              <thead>
                <tr>
                  <th>Critère</th>
                  <th>Valeur</th>
                  <th>Impact</th>
                  <th>Poids</th>
                  <th>Pondéré</th>
                </tr>
              </thead>
              <tbody>
                {/* Avantages */}
                {details.detailsAvantages.length > 0 && (
                  <tr className="detail-algo__group-header">
                    <td colSpan={5}>Avantages ({details.detailsAvantages.length} critères)</td>
                  </tr>
                )}
                {details.detailsAvantages.map((c) => renderCritereRow(c, "avantage"))}

                {/* Contraintes */}
                {details.detailsContraintes.length > 0 && (
                  <tr className="detail-algo__group-header">
                    <td colSpan={5}>Contraintes ({details.detailsContraintes.length} critères)</td>
                  </tr>
                )}
                {details.detailsContraintes.map((c) => renderCritereRow(c, "contrainte"))}

                {/* Critères vides */}
                {details.detailsCriteresVides.length > 0 && (
                  <tr className="detail-algo__group-header">
                    <td colSpan={5}>
                      Non renseignés ({details.detailsCriteresVides.length} critères)
                    </td>
                  </tr>
                )}
                {details.detailsCriteresVides.map((c) => renderCritereRow(c, "vide"))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </details>
  );
};
