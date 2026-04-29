import React, { useEffect, useState, useCallback, useRef } from "react";
import { EnrichissementOutputDto, MutabiliteOutputDto } from "@mutafriches/shared-types";
import { Layout } from "@shared/components/layout/Layout";
import { enrichissementService } from "@shared/services/api/api.enrichissement.service";
import { evaluationService } from "@shared/services/api/api.evaluation.service";
import { buildMutabilityInput } from "@features/resultats/utils/mutability.mapper";
import { useAlgorithmeVersions } from "@features/comparaison-algo/hooks/useAlgorithmeVersions";
import { CCI92SiteList } from "../components/CCI92SiteList";
import { CCI92SiteDetail } from "../components/CCI92SiteDetail";
import { CCI92Site } from "../data/parcelles-cci92";
import "@features/debug/components/DebugPanel.css";
import "./CCI92Page.css";

type LoadingState = "idle" | "enriching" | "calculating";

export const CCI92Page: React.FC = () => {
  const [selectedSite, setSelectedSite] = useState<CCI92Site | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);

  const enrichmentCacheRef = useRef(new Map<string, EnrichissementOutputDto>());
  const mutabilityCacheRef = useRef(new Map<string, MutabiliteOutputDto>());
  const manualDataRef = useRef(new Map<string, Record<string, string>>());

  const [enrichmentData, setEnrichmentData] = useState<EnrichissementOutputDto | null>(null);
  const [mutabilityData, setMutabilityData] = useState<MutabiliteOutputDto | null>(null);
  const [manualData, setManualData] = useState<Record<string, string>>({});

  const { versions } = useAlgorithmeVersions();
  const [selectedVersion, setSelectedVersion] = useState<string>("");

  useEffect(() => {
    if (!selectedVersion && versions.length > 0) {
      setSelectedVersion(versions[0].version);
    }
  }, [versions, selectedVersion]);

  const handleSelectSite = useCallback(async (site: CCI92Site) => {
    setSelectedSite(site);
    setError(null);

    const cachedManual = manualDataRef.current.get(site.idtup) || {};
    setManualData(cachedManual);

    const cachedMutability = mutabilityCacheRef.current.get(site.idtup) || null;
    setMutabilityData(cachedMutability);

    const cachedEnrichment = enrichmentCacheRef.current.get(site.idtup);
    if (cachedEnrichment) {
      setEnrichmentData(cachedEnrichment);
      return;
    }

    setEnrichmentData(null);
    setLoadingState("enriching");
    try {
      const result = await enrichissementService.enrichirSite(site.parcelles);
      enrichmentCacheRef.current.set(site.idtup, result);
      setEnrichmentData(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de l'enrichissement";
      setError(message);
    } finally {
      setLoadingState("idle");
    }
  }, []);

  const handleManualDataChange = useCallback(
    (fieldName: string, value: string) => {
      if (!selectedSite) return;
      const updated = { ...manualData, [fieldName]: value };
      setManualData(updated);
      manualDataRef.current.set(selectedSite.idtup, updated);
      mutabilityCacheRef.current.delete(selectedSite.idtup);
      setMutabilityData(null);
    },
    [selectedSite, manualData],
  );

  const handleCalculerMutabilite = useCallback(async () => {
    if (!selectedSite || !enrichmentData) return;

    setError(null);
    setLoadingState("calculating");
    try {
      const input = buildMutabilityInput(enrichmentData, manualData);
      const result = await evaluationService.calculerMutabilite(input, {
        modeDetaille: true,
        versionAlgorithme: selectedVersion || undefined,
      });
      mutabilityCacheRef.current.set(selectedSite.idtup, result);
      setMutabilityData(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors du calcul de mutabilité";
      setError(message);
    } finally {
      setLoadingState("idle");
    }
  }, [selectedSite, enrichmentData, manualData, selectedVersion]);

  const handleVersionChange = useCallback((version: string) => {
    setSelectedVersion(version);
    mutabilityCacheRef.current.clear();
    setMutabilityData(null);
  }, []);

  return (
    <Layout fullWidth>
      <div className="fr-container fr-py-4w">
        <div className="fr-mb-4w">
          <h1 className="fr-h3">Mutafriches — CCI Hauts-de-Seine (92)</h1>
          <p className="fr-text--lg">
            Qualification et mutabilité des friches sur le territoire de la CCI 92.
          </p>
        </div>

        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-md-4">
            <CCI92SiteList
              selectedSiteId={selectedSite?.idtup ?? null}
              onSelectSite={handleSelectSite}
              enrichmentCache={enrichmentCacheRef.current}
            />
          </div>
          <div className="fr-col-12 fr-col-md-8">
            {selectedSite ? (
              <CCI92SiteDetail
                site={selectedSite}
                enrichmentData={enrichmentData}
                mutabilityData={mutabilityData}
                manualData={manualData}
                isEnriching={loadingState === "enriching"}
                isCalculating={loadingState === "calculating"}
                error={error}
                versions={versions}
                selectedVersion={selectedVersion}
                onVersionChange={handleVersionChange}
                onManualDataChange={handleManualDataChange}
                onCalculerMutabilite={handleCalculerMutabilite}
              />
            ) : (
              <div className="fr-callout">
                <h2 className="fr-callout__title">Sélectionnez un site</h2>
                <p className="fr-callout__text">
                  Choisissez un site dans la liste pour consulter ses données d'enrichissement et
                  calculer sa mutabilité.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
