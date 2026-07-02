import React, { useState } from "react";
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
import { DsfrAccordion } from "@shared/components/dsfr/DsfrAccordion";
import { DonneesForm } from "./DonneesForm";
import { SiteMap } from "./SiteMap";
import { PartagerButton } from "./PartagerButton";
import { RenameSiteModal } from "./RenameSiteModal";
import type { PartnerSite } from "../types";
import { downloadJson } from "../download-json";

interface SiteDetailProps {
  site: PartnerSite;
  partenaireSlug: string;
  partenaireNom: string;
  enrichmentData: EnrichissementOutputDto | null;
  mutabilityData: MutabiliteOutputDto | null;
  manualData: Record<string, string>;
  isEnriching: boolean;
  isCalculating: boolean;
  error: string | null;
  selectedVersion: string;
  onManualDataChange: (fieldName: string, value: string) => void;
  onCalculerMutabilite: () => void;
  // Renomme le site en base (présent seulement si le site vient de l'API).
  onRenameSite?: (id: string, nom: string) => Promise<void>;
}

type Phase = "qualification" | "mutabilite";

const BADGE_DONNEES_NATIONALES = {
  label: "automatique",
  variant: "success",
  icon: "fr-icon-checkbox-line",
};
const BADGE_SAISIE = {
  label: "manuelle",
  variant: "green-tilleul-verveine",
  icon: "fr-icon-edit-line",
};
const BADGE_CALCULE = {
  label: "calculé",
  variant: "success",
  icon: "fr-icon-calculator-line",
};

export const SiteDetail: React.FC<SiteDetailProps> = ({
  site,
  partenaireSlug,
  partenaireNom,
  enrichmentData,
  mutabilityData,
  manualData,
  isEnriching,
  isCalculating,
  error,
  selectedVersion,
  onManualDataChange,
  onCalculerMutabilite,
  onRenameSite,
}) => {
  const [isRenameOpen, setIsRenameOpen] = useState(false);

  const canRename = Boolean(site.id && onRenameSite);
  const titreSite = site.nom ? `${site.nom}, ${site.commune}` : site.commune;

  const enregistrerNom = async (nom: string): Promise<void> => {
    if (!site.id || !onRenameSite) return;
    await onRenameSite(site.id, nom);
  };

  // Phase dérivée : présence de mutabilityData → mutabilite, sinon qualification.
  // La modification d'un champ vide mutabilityData (cf. handler dans la page) → retour qualification.
  const phase: Phase = mutabilityData ? "mutabilite" : "qualification";

  const hasManualInput = Object.values(manualData).some((v) => v && v !== "");
  const isQualPhase = phase === "qualification";

  // Emprise du site : union en multi-parcelle, polygone complet sinon
  const geometrieSite = enrichmentData?.geometrieSite ?? enrichmentData?.geometrie;

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
    <div className="mf-ms-detail">
      {/* En-tête du site (hauteur limitée : la liste des parcelles défile) */}
      <div className="fr-callout fr-callout--blue-ecume fr-mb-2w">
        <div className="flex items-start justify-between gap-4">
          <h2 className="fr-callout__title fr-h4 fr-mb-0">{titreSite}</h2>
          {canRename && (
            <button
              type="button"
              className="fr-btn fr-btn--secondary fr-btn--sm fr-icon-edit-line fr-btn--icon-left"
              onClick={() => setIsRenameOpen(true)}
            >
              Modifier site
            </button>
          )}
        </div>

        <p className="fr-text--sm fr-mt-1w fr-mb-1v">
          Identifiant : <strong>{site.idtup}</strong>
        </p>
        <div className="fr-text--sm max-h-20 overflow-y-auto">
          {site.parcelles.length} parcelle{site.parcelles.length > 1 ? "s" : ""} :{" "}
          {site.parcelles.join(", ")}
        </div>
      </div>

      {canRename && (
        <RenameSiteModal
          isOpen={isRenameOpen}
          initialNom={site.nom ?? ""}
          onClose={() => setIsRenameOpen(false)}
          onSubmit={enregistrerNom}
        />
      )}

      {/* Carte de l'emprise du site (dès que la géométrie est enrichie) */}
      {geometrieSite && (
        <div className="fr-mb-2w">
          <SiteMap
            key={site.idtup}
            geometrie={geometrieSite}
            centre={enrichmentData?.coordonnees}
          />
        </div>
      )}

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
          {/* Section automatique — repliée par défaut, l'utilisateur déplie au besoin */}
          <div key={`auto-${phase}`}>
            <DsfrAccordion title="Identification du site" badge={BADGE_DONNEES_NATIONALES}>
              <SiteIdentificationSection
                enrichmentData={enrichmentData}
                identifiantSite={site.idtup}
                noWrapper
              />
            </DsfrAccordion>

            <DsfrAccordion title="Qualification du site" badge={BADGE_DONNEES_NATIONALES}>
              <EnrichissementSection enrichmentData={enrichmentData} noWrapper />
            </DsfrAccordion>

            {enrichmentData.diagnosticZonages && (
              <DsfrAccordion
                title="Diagnostic zonages (données brutes API)"
                badge={BADGE_DONNEES_NATIONALES}
              >
                <DiagnosticZonagesSection enrichmentData={enrichmentData} noWrapper />
              </DsfrAccordion>
            )}

            <DsfrAccordion title="Données exhaustives Géorisques" badge={BADGE_DONNEES_NATIONALES}>
              <DiagnosticRisquesSection enrichmentData={enrichmentData} noWrapper />
            </DsfrAccordion>

            <DsfrAccordion title="Sources appelées" badge={BADGE_DONNEES_NATIONALES}>
              <SourcesMetadataSection enrichmentData={enrichmentData} noWrapper />
            </DsfrAccordion>
          </div>

          {/* Section saisie */}
          <div key={`saisie-${phase}`}>
            <DsfrAccordion
              title="Connaissance terrain"
              badge={BADGE_SAISIE}
              defaultOpen={isQualPhase}
              highlight={isQualPhase}
            >
              <DonneesForm values={manualData} onChange={onManualDataChange} />

              {!hasManualInput && (
                <p className="fr-hint-text fr-mt-2w fr-mb-1w">
                  Saisissez au moins une donnée complémentaire pour activer le calcul.
                </p>
              )}
              <ul className="fr-btns-group fr-btns-group--inline fr-btns-group--right fr-mt-2w">
                <li>
                  <button
                    type="button"
                    className="fr-btn"
                    onClick={onCalculerMutabilite}
                    disabled={!hasManualInput || isCalculating}
                    aria-busy={isCalculating}
                  >
                    {isCalculating ? "Calcul en cours..." : "Calculer la mutabilité"}
                  </button>
                </li>
              </ul>
            </DsfrAccordion>
          </div>

          {/* Section mutabilité (uniquement après calcul) */}
          {mutabilityData && phase === "mutabilite" && (
            <div key={`mutabilite-${phase}`}>
              <DsfrAccordion title="Connaissance terrain (saisie)" badge={BADGE_SAISIE}>
                <DonneesComplementairesSection manualData={manualData} noWrapper />
              </DsfrAccordion>

              <DsfrAccordion title="Résultats de l'évaluation" badge={BADGE_CALCULE} defaultOpen>
                <EvaluationSection mutabilityData={mutabilityData} noWrapper />
              </DsfrAccordion>

              <DsfrAccordion title="Détail de l'algorithme" badge={BADGE_CALCULE} defaultOpen>
                <DetailAlgorithmeSection
                  mutabilityData={mutabilityData}
                  enrichissement={enrichmentData}
                  complementaires={buildDonneesComplementaires(manualData)}
                  noWrapper
                />
              </DsfrAccordion>

              <ul className="fr-btns-group fr-btns-group--inline fr-btns-group--right fr-btns-group--icon-left fr-mt-2w">
                <li>
                  <button
                    type="button"
                    className="fr-btn fr-btn--secondary fr-icon-download-line"
                    onClick={handleExportMutabilite}
                  >
                    Télécharger l'analyse complète (JSON)
                  </button>
                </li>
                <li>
                  <PartagerButton
                    slug={partenaireSlug}
                    nom={partenaireNom}
                    className="fr-btn fr-btn--secondary fr-icon-share-line"
                  />
                </li>
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};
