import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { EnrichissementOutputDto, MutabiliteOutputDto } from "@mutafriches/shared-types";
import { SiteIdentificationSection } from "./sections/SiteIdentificationSection";
import { EnrichissementSection } from "./sections/EnrichissementSection";
import { DonneesComplementairesSection } from "./sections/DonneesComplementairesSection";
import { EvaluationSection } from "./sections/EvaluationSection";
import { DetailAlgorithmeSection } from "./sections/DetailAlgorithmeSection";
import { DiagnosticRisquesSection } from "./sections/DiagnosticRisquesSection";
import { SourcesMetadataSection } from "./sections/SourcesMetadataSection";
import { RawJsonSection } from "./sections/RawJsonSection";
import "./DebugPanel.css";

export interface DebugPanelProps {
  enrichmentData?: EnrichissementOutputDto;
  manualData?: Record<string, string>;
  mutabilityData: MutabiliteOutputDto | null;
  identifiantSite?: string;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  enrichmentData,
  manualData,
  mutabilityData,
  identifiantSite,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = useCallback(() => setIsOpen(true), []);
  const handleClose = useCallback(() => setIsOpen(false), []);

  // Fermeture sur Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Bloquer le scroll du body quand le tiroir est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const drawerContent = (
    <>
      {/* Bouton flottant */}
      <button
        type="button"
        className="fr-btn debug-panel__trigger"
        onClick={handleOpen}
        title="Ouvrir le panneau de diagnostic"
        aria-label="Ouvrir le panneau de diagnostic"
      >
        <span className="fr-icon-search-line" aria-hidden="true" />
      </button>

      {/* Backdrop */}
      <div
        className={`debug-panel__backdrop ${isOpen ? "debug-panel__backdrop--visible" : ""}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Tiroir */}
      <aside
        className={`debug-panel__drawer ${isOpen ? "debug-panel__drawer--open" : ""}`}
        role="complementary"
        aria-label="Panneau de diagnostic"
      >
        {/* En-tete */}
        <div className="debug-panel__header">
          <h2>
            <span className="fr-icon-search-line fr-icon--sm" aria-hidden="true" /> Diagnostic
          </h2>
          <button
            type="button"
            className="fr-btn--close fr-btn"
            onClick={handleClose}
            title="Fermer le panneau"
            aria-label="Fermer le panneau de diagnostic"
          >
            Fermer
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="debug-panel__content">
          <SiteIdentificationSection
            enrichmentData={enrichmentData}
            identifiantSite={identifiantSite}
          />

          <EnrichissementSection enrichmentData={enrichmentData} />

          <DonneesComplementairesSection manualData={manualData} />

          <EvaluationSection mutabilityData={mutabilityData} />

          <DetailAlgorithmeSection mutabilityData={mutabilityData} />

          <DiagnosticRisquesSection enrichmentData={enrichmentData} />

          <SourcesMetadataSection enrichmentData={enrichmentData} />

          <RawJsonSection enrichmentData={enrichmentData} mutabilityData={mutabilityData} />
        </div>
      </aside>
    </>
  );

  return createPortal(drawerContent, document.body);
};
