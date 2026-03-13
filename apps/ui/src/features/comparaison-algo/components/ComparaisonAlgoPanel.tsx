import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import type {
  CalculerMutabiliteInputDto,
  EnrichissementOutputDto,
} from "@mutafriches/shared-types";
import { DetailAlgorithmeSection } from "../../debug/components/sections/DetailAlgorithmeSection";
import "../../debug/components/DebugPanel.css";
import { useAlgorithmeVersions } from "../hooks/useAlgorithmeVersions";
import { useComparaisonAlgo } from "../hooks/useComparaisonAlgo";
import { VersionSelector } from "./VersionSelector";
import { TableauComparaison } from "./TableauComparaison";
import "./ComparaisonAlgoPanel.css";

export interface ComparaisonAlgoPanelProps {
  enrichmentData?: EnrichissementOutputDto;
  donneesComplementaires?: Record<string, string>;
}

const VERSION_COURANTE = "v1.3";

export const ComparaisonAlgoPanel: React.FC<ComparaisonAlgoPanelProps> = ({
  enrichmentData,
  donneesComplementaires,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);

  const { versions, isLoading: isLoadingVersions } = useAlgorithmeVersions();
  const {
    resultats,
    isLoading: isComparing,
    error,
    comparer,
    reinitialiser,
  } = useComparaisonAlgo();

  const handleOpen = useCallback(() => setIsOpen(true), []);
  const handleClose = useCallback(() => setIsOpen(false), []);

  // Fermeture sur Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
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

  const handleToggleVersion = useCallback(
    (version: string) => {
      setSelectedVersions((prev) =>
        prev.includes(version) ? prev.filter((v) => v !== version) : [...prev, version],
      );
      reinitialiser();
    },
    [reinitialiser],
  );

  const handleComparer = useCallback(async () => {
    if (!enrichmentData || selectedVersions.length < 2) return;

    const input: CalculerMutabiliteInputDto = {
      donneesEnrichies: enrichmentData,
      donneesComplementaires:
        donneesComplementaires as unknown as CalculerMutabiliteInputDto["donneesComplementaires"],
    };

    await comparer(input, selectedVersions);
  }, [enrichmentData, donneesComplementaires, selectedVersions, comparer]);

  const drawerContent = (
    <>
      {/* Bouton flottant */}
      <button
        type="button"
        className="fr-btn comparaison-panel__trigger"
        onClick={handleOpen}
        title="Comparer les versions de l'algorithme"
        aria-label="Comparer les versions de l'algorithme"
      >
        <span className="fr-icon-settings-5-fill" aria-hidden="true" />
      </button>

      {/* Backdrop */}
      <div
        className={`comparaison-panel__backdrop ${isOpen ? "comparaison-panel__backdrop--visible" : ""}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Tiroir */}
      <aside
        className={`comparaison-panel__drawer ${isOpen ? "comparaison-panel__drawer--open" : ""}`}
        role="complementary"
        aria-label="Comparaison des versions de l'algorithme"
      >
        {/* En-tête */}
        <div className="comparaison-panel__header">
          <h2>
            <span className="fr-icon-git-merge-line fr-icon--sm" aria-hidden="true" /> Comparaison
            algorithme
          </h2>
          <button
            type="button"
            className="fr-btn--close fr-btn"
            onClick={handleClose}
            title="Fermer le panneau"
            aria-label="Fermer le panneau de comparaison"
          >
            Fermer
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="comparaison-panel__content">
          {isLoadingVersions ? (
            <p>Chargement des versions...</p>
          ) : (
            <>
              <VersionSelector
                versions={versions}
                selectedVersions={selectedVersions}
                onToggleVersion={handleToggleVersion}
                isLoading={isComparing}
              />

              <div className="fr-mt-2w">
                <button
                  type="button"
                  className="fr-btn fr-btn--sm"
                  onClick={handleComparer}
                  disabled={selectedVersions.length < 2 || isComparing || !enrichmentData}
                >
                  {isComparing ? "Comparaison en cours..." : "Comparer"}
                </button>

                {selectedVersions.length < 2 && (
                  <p className="fr-text--xs fr-mt-1v" style={{ color: "#666" }}>
                    Sélectionnez au moins 2 versions pour comparer
                  </p>
                )}
              </div>

              {error && (
                <div className="fr-alert fr-alert--error fr-alert--sm fr-mt-2w">
                  <p>{error}</p>
                </div>
              )}

              {resultats && (
                <div className="fr-mt-3w">
                  <TableauComparaison resultats={resultats} versionCourante={VERSION_COURANTE} />

                  {/* Diagnostic détaillé par version */}
                  {selectedVersions.map((version) => {
                    const versionData = resultats[version];
                    if (!versionData) return null;
                    const versionLabel = versions.find((v) => v.version === version)?.label;
                    const titre = versionLabel
                      ? `Diagnostic de l'algorithme ${version} (${versionLabel})`
                      : `Diagnostic de l'algorithme ${version}`;
                    return (
                      <div key={version} className="fr-mt-2w">
                        <DetailAlgorithmeSection mutabilityData={versionData} title={titre} />
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );

  return createPortal(drawerContent, document.body);
};
