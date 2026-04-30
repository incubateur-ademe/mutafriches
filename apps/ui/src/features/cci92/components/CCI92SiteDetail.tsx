import React from "react";
import { EnrichissementOutputDto, MutabiliteOutputDto } from "@mutafriches/shared-types";
import { SiteIdentificationSection } from "@features/debug/components/sections/SiteIdentificationSection";
import { EnrichissementSection } from "@features/debug/components/sections/EnrichissementSection";
import { DiagnosticZonagesSection } from "@features/debug/components/sections/DiagnosticZonagesSection";
import { DiagnosticRisquesSection } from "@features/debug/components/sections/DiagnosticRisquesSection";
import { SourcesMetadataSection } from "@features/debug/components/sections/SourcesMetadataSection";
import { EvaluationSection } from "@features/debug/components/sections/EvaluationSection";
import { DetailAlgorithmeSection } from "@features/debug/components/sections/DetailAlgorithmeSection";
import { DonneesComplementairesSection } from "@features/debug/components/sections/DonneesComplementairesSection";
import { EnrichmentLoadingCallout } from "@features/analyser/components/EnrichmentLoadingCallout";
import { buildDonneesComplementaires } from "@features/resultats/utils/mutability.mapper";
import { CCI92Accordion } from "./CCI92Accordion";
import { CCI92DonneesForm } from "./CCI92DonneesForm";
import { CCI92Site } from "../data/parcelles-cci92";
import { downloadJson } from "../utils/download-json";

interface CCI92SiteDetailProps {
  site: CCI92Site;
  enrichmentData: EnrichissementOutputDto | null;
  mutabilityData: MutabiliteOutputDto | null;
  manualData: Record<string, string>;
  isEnriching: boolean;
  isCalculating: boolean;
  error: string | null;
  selectedVersion: string;
  onManualDataChange: (fieldName: string, value: string) => void;
  onCalculerMutabilite: () => void;
}

type Phase = "qualification" | "mutabilite";

const TAG_AUTO = { label: "automatique", variant: "automatique" as const };
const TAG_SAISIE = { label: "saisie de donnée", variant: "saisie" as const };
const TAG_CALCULE = { label: "calculé", variant: "calcule" as const };

export const CCI92SiteDetail: React.FC<CCI92SiteDetailProps> = ({
  site,
  enrichmentData,
  mutabilityData,
  manualData,
  isEnriching,
  isCalculating,
  error,
  selectedVersion,
  onManualDataChange,
  onCalculerMutabilite,
}) => {
  // Phase dérivée : présence de mutabilityData → mutabilite, sinon qualification.
  // La modification d'un champ vide mutabilityData (cf. handler dans la page) → retour qualification.
  const phase: Phase = mutabilityData ? "mutabilite" : "qualification";

  const hasManualInput = Object.values(manualData).some((v) => v && v !== "");
  const isQualPhase = phase === "qualification";

  const handleExportMutabilite = () => {
    if (!enrichmentData || !mutabilityData) return;
    const payload = {
      site: { idtup: site.idtup, commune: site.commune, parcelles: site.parcelles },
      versionAlgorithme: selectedVersion || undefined,
      donneesEnrichies: enrichmentData,
      donneesComplementaires: buildDonneesComplementaires(manualData),
      resultats: mutabilityData,
    };
    downloadJson(payload, `mutabilite-${site.idtup}`);
  };

  return (
    <div className="cci92-detail">
      {/* En-tête du site */}
      <div className="fr-callout fr-callout--blue-ecume fr-mb-2w">
        <h2 className="fr-callout__title fr-h4">{site.commune}</h2>
        <p className="fr-callout__text fr-text--sm">
          Identifiant : <strong>{site.idtup}</strong>
          <br />
          <br />
          {site.parcelles.length > 1 && (
            <>
              {site.parcelles.length} parcelles : {site.parcelles.join(", ")}
            </>
          )}
        </p>
      </div>

      {/* Erreur */}
      {error && (
        <div className="fr-alert fr-alert--error fr-mb-2w">
          <p>{error}</p>
        </div>
      )}

      {/* Chargement enrichissement */}
      {isEnriching && <EnrichmentLoadingCallout />}

      {enrichmentData && (
        <>
          {/* Section automatique */}
          <div key={`auto-${phase}`}>
            <CCI92Accordion title="Identification du site" tag={TAG_AUTO} defaultOpen={isQualPhase}>
              <SiteIdentificationSection
                enrichmentData={enrichmentData}
                identifiantSite={site.idtup}
                noWrapper
              />
            </CCI92Accordion>

            <CCI92Accordion
              title="Données d'enrichissement"
              tag={TAG_AUTO}
              defaultOpen={isQualPhase}
            >
              <EnrichissementSection enrichmentData={enrichmentData} noWrapper />
            </CCI92Accordion>

            {enrichmentData.diagnosticZonages && (
              <CCI92Accordion
                title="Diagnostic zonages (données brutes API)"
                tag={TAG_AUTO}
                defaultOpen={isQualPhase}
              >
                <DiagnosticZonagesSection enrichmentData={enrichmentData} noWrapper />
              </CCI92Accordion>
            )}

            <CCI92Accordion title="Diagnostic risques" tag={TAG_AUTO} defaultOpen={isQualPhase}>
              <DiagnosticRisquesSection enrichmentData={enrichmentData} noWrapper />
            </CCI92Accordion>

            <CCI92Accordion title="Sources et métadonnées" tag={TAG_AUTO} defaultOpen={isQualPhase}>
              <SourcesMetadataSection enrichmentData={enrichmentData} noWrapper />
            </CCI92Accordion>
          </div>

          {/* Section saisie */}
          <div key={`saisie-${phase}`}>
            <CCI92Accordion
              title="Données complémentaires"
              tag={TAG_SAISIE}
              defaultOpen={isQualPhase}
              highlight={isQualPhase}
            >
              <CCI92DonneesForm values={manualData} onChange={onManualDataChange} />
            </CCI92Accordion>

            <div className="fr-mt-2w fr-mb-3w">
              <button
                type="button"
                className="fr-btn"
                onClick={onCalculerMutabilite}
                disabled={!hasManualInput || isCalculating}
                aria-busy={isCalculating}
              >
                {isCalculating ? "Calcul en cours..." : "Calculer la mutabilité"}
              </button>
              {!hasManualInput && (
                <p className="fr-hint-text fr-mt-1w">
                  Saisissez au moins une donnée complémentaire pour activer le calcul.
                </p>
              )}
            </div>
          </div>

          {/* Section mutabilité (uniquement après calcul) */}
          {mutabilityData && phase === "mutabilite" && (
            <div key={`mutabilite-${phase}`}>
              <CCI92Accordion
                title="Données complémentaires (saisies)"
                tag={TAG_SAISIE}
                defaultOpen={false}
              >
                <DonneesComplementairesSection manualData={manualData} noWrapper />
              </CCI92Accordion>

              <CCI92Accordion title="Résultats de l'évaluation" tag={TAG_CALCULE} defaultOpen>
                <EvaluationSection mutabilityData={mutabilityData} noWrapper />
              </CCI92Accordion>

              <CCI92Accordion title="Détail de l'algorithme" tag={TAG_CALCULE} defaultOpen>
                <DetailAlgorithmeSection mutabilityData={mutabilityData} noWrapper />
              </CCI92Accordion>

              <div className="fr-mt-2w">
                <button
                  type="button"
                  className="fr-btn fr-btn--secondary fr-icon-download-line fr-btn--icon-left"
                  onClick={handleExportMutabilite}
                >
                  Télécharger l'analyse complète (JSON)
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
