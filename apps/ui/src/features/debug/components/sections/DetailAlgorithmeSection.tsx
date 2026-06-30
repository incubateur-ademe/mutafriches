import React, { useState } from "react";
import type {
  MutabiliteOutputDto,
  UsageResultatDetaille,
  EnrichissementOutputDto,
  DonneesComplementairesInputDto,
} from "@mutafriches/shared-types";
import { buildDetailUsage } from "@mutafriches/shared-types";
import { DsfrAccordion } from "@shared/components/dsfr/DsfrAccordion";
import { UsageDetailTable, UsageRatioBar } from "@shared/components/recap";
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

interface DetailAlgorithmeSectionProps {
  mutabilityData: MutabiliteOutputDto | null;
  enrichissement?: EnrichissementOutputDto;
  complementaires?: Partial<DonneesComplementairesInputDto>;
  title?: string;
  noWrapper?: boolean;
}

export const DetailAlgorithmeSection: React.FC<DetailAlgorithmeSectionProps> = ({
  mutabilityData,
  enrichissement,
  complementaires,
  title,
  noWrapper = false,
}) => {
  const [selectedUsage, setSelectedUsage] = useState<string | null>(null);

  // Vérifier si les données détaillées sont disponibles
  const resultatsDetailles = mutabilityData?.resultats as UsageResultatDetaille[] | undefined;
  const hasDetailedData = resultatsDetailles?.some((r) => r.detailsCalcul);

  if (!mutabilityData || !hasDetailedData) {
    const empty = (
      <p className="fr-text--sm">
        Données détaillées non disponibles. Le mode détaillé n'est pas activé.
      </p>
    );
    if (noWrapper) return empty;
    return <DsfrAccordion title={title ?? "Détail de l'algorithme"}>{empty}</DsfrAccordion>;
  }

  // Usage sélectionné ou le premier par défaut
  const activeUsage = selectedUsage ?? resultatsDetailles?.[0]?.usage;
  const activeResult = resultatsDetailles?.find((r) => r.usage === activeUsage);
  const details = activeResult?.detailsCalcul;

  const content = (
    <>
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
            <span className="detail-algo__usage-btn-label">{USAGE_LABELS[r.usage] ?? r.usage}</span>
            <span className="detail-algo__usage-btn-score">{r.indiceMutabilite}%</span>
          </button>
        ))}
      </div>

      {/* Synthèse pour l'usage sélectionné : même barre + tableau que la modale de détail */}
      {activeResult && details && (
        <>
          <UsageRatioBar
            avantages={details.totalAvantages}
            contraintes={details.totalContraintes}
            indice={activeResult.indiceMutabilite}
          />
          <UsageDetailTable
            sections={buildDetailUsage(activeResult, enrichissement, complementaires)}
          />
        </>
      )}
    </>
  );

  if (noWrapper) return content;

  return <DsfrAccordion title={title ?? "Détail de l'algorithme"}>{content}</DsfrAccordion>;
};
