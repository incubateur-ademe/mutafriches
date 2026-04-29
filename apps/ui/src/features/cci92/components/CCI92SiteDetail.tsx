import React, { useState } from "react";
import {
  AlgorithmeVersionDto,
  EnrichissementOutputDto,
  MutabiliteOutputDto,
} from "@mutafriches/shared-types";
import { SiteIdentificationSection } from "@features/debug/components/sections/SiteIdentificationSection";
import { EnrichissementSection } from "@features/debug/components/sections/EnrichissementSection";
import { DiagnosticZonagesSection } from "@features/debug/components/sections/DiagnosticZonagesSection";
import { DiagnosticRisquesSection } from "@features/debug/components/sections/DiagnosticRisquesSection";
import { SourcesMetadataSection } from "@features/debug/components/sections/SourcesMetadataSection";
import { EvaluationSection } from "@features/debug/components/sections/EvaluationSection";
import { DetailAlgorithmeSection } from "@features/debug/components/sections/DetailAlgorithmeSection";
import { DonneesComplementairesSection } from "@features/debug/components/sections/DonneesComplementairesSection";
import { EnrichmentLoadingCallout } from "@features/analyser/components/EnrichmentLoadingCallout";
import { CCI92DonneesForm } from "./CCI92DonneesForm";
import { CCI92Site } from "../data/parcelles-cci92";

interface CCI92SiteDetailProps {
  site: CCI92Site;
  enrichmentData: EnrichissementOutputDto | null;
  mutabilityData: MutabiliteOutputDto | null;
  manualData: Record<string, string>;
  isEnriching: boolean;
  isCalculating: boolean;
  error: string | null;
  versions: AlgorithmeVersionDto[];
  selectedVersion: string;
  onVersionChange: (version: string) => void;
  onManualDataChange: (fieldName: string, value: string) => void;
  onCalculerMutabilite: () => void;
}

type TabId = "qualification" | "mutabilite";

export const CCI92SiteDetail: React.FC<CCI92SiteDetailProps> = ({
  site,
  enrichmentData,
  mutabilityData,
  manualData,
  isEnriching,
  isCalculating,
  error,
  versions,
  selectedVersion,
  onVersionChange,
  onManualDataChange,
  onCalculerMutabilite,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>("qualification");

  const renderTabButton = (id: TabId, label: string) => (
    <li role="presentation">
      <button
        type="button"
        id={`cci92-tab-${id}`}
        className="fr-tabs__tab"
        tabIndex={activeTab === id ? 0 : -1}
        role="tab"
        aria-selected={activeTab === id}
        aria-controls={`cci92-tabpanel-${id}`}
        onClick={() => setActiveTab(id)}
      >
        {label}
      </button>
    </li>
  );

  const renderPanel = (id: TabId, content: React.ReactNode) => (
    <div
      id={`cci92-tabpanel-${id}`}
      className={`fr-tabs__panel ${activeTab === id ? "fr-tabs__panel--selected" : ""}`}
      role="tabpanel"
      aria-labelledby={`cci92-tab-${id}`}
      tabIndex={0}
    >
      {content}
    </div>
  );

  return (
    <div className="cci92-detail">
      {/* En-tête du site */}
      <div className="fr-callout fr-callout--brown-caramel fr-mb-2w">
        <h2 className="fr-callout__title fr-h4">{site.commune}</h2>
        <p className="fr-callout__text fr-text--sm">
          Identifiant : <strong>{site.idtup}</strong>
          {site.parcelles.length > 1 && (
            <>
              {" "}
              — {site.parcelles.length} parcelles : {site.parcelles.join(", ")}
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

      <div className="fr-tabs">
        <ul className="fr-tabs__list" role="tablist" aria-label="Détail du site">
          {renderTabButton("qualification", "Qualification du site")}
          {renderTabButton("mutabilite", "Mutabilité")}
        </ul>

        {renderPanel(
          "qualification",
          <>
            {isEnriching && <EnrichmentLoadingCallout />}
            {enrichmentData && (
              <div className="cci92-detail__sections">
                <SiteIdentificationSection
                  enrichmentData={enrichmentData}
                  identifiantSite={site.idtup}
                />
                <EnrichissementSection enrichmentData={enrichmentData} />
                <DiagnosticZonagesSection enrichmentData={enrichmentData} />
                <DiagnosticRisquesSection enrichmentData={enrichmentData} />
                <SourcesMetadataSection enrichmentData={enrichmentData} />
              </div>
            )}
          </>,
        )}

        {renderPanel(
          "mutabilite",
          <>
            {!enrichmentData && !isEnriching && (
              <p className="fr-text--sm">
                L'enrichissement du site est nécessaire avant de pouvoir calculer la mutabilité.
              </p>
            )}
            {isEnriching && <EnrichmentLoadingCallout />}
            {enrichmentData && (
              <div className="cci92-detail__sections">
                <CCI92DonneesForm
                  values={manualData}
                  onChange={onManualDataChange}
                  onSubmit={onCalculerMutabilite}
                  isSubmitting={isCalculating}
                  versions={versions}
                  selectedVersion={selectedVersion}
                  onVersionChange={onVersionChange}
                />
                {mutabilityData && (
                  <div className="fr-mt-4w">
                    <DonneesComplementairesSection manualData={manualData} />
                    <EvaluationSection mutabilityData={mutabilityData} />
                    <DetailAlgorithmeSection mutabilityData={mutabilityData} />
                  </div>
                )}
              </div>
            )}
          </>,
        )}
      </div>
    </div>
  );
};
