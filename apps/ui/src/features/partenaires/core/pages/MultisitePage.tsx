import React, { useState, useCallback, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { EnrichissementOutputDto, MutabiliteOutputDto } from "@mutafriches/shared-types";
import { Layout } from "@shared/components/layout/Layout";
import { ROUTES } from "@shared/config/routes.config";
import { enrichissementService } from "@shared/services/api/api.enrichissement.service";
import { evaluationService } from "@shared/services/api/api.evaluation.service";
import { buildMutabilityInput } from "@features/resultats/utils/mutability.mapper";
import { useAlgorithmeVersions } from "@features/comparaison-algo/hooks/useAlgorithmeVersions";
import { SiteList } from "../components/SiteList";
import { SiteDetail } from "../components/SiteDetail";
import { AddSiteModal } from "../components/AddSiteModal";
import { DonneesExternesLink } from "../components/DonneesExternesLink";
import { PartagerButton } from "../components/PartagerButton";
import { useCustomSites } from "../hooks/useCustomSites";
import { getPartnerBySlug } from "../../registry";
import type { PartnerConfig, PartnerSite } from "../types";
import "@features/debug/components/DebugPanel.css";
import "../partenaires.css";

type LoadingState = "idle" | "enriching" | "calculating";

// Orchestrateur générique : caches enrichissement/mutabilité, saisie manuelle, version d'algo.
const MultisiteView: React.FC<{ config: PartnerConfig }> = ({ config }) => {
  const [selectedSite, setSelectedSite] = useState<PartnerSite | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);

  const enrichmentCacheRef = useRef(new Map<string, EnrichissementOutputDto>());
  const mutabilityCacheRef = useRef(new Map<string, MutabiliteOutputDto>());
  const manualDataRef = useRef(new Map<string, Record<string, string>>());

  // IDs des sites enrichis suivis en state (le ref ne peut pas être lu pendant le rendu)
  const [enrichedSiteIds, setEnrichedSiteIds] = useState<Set<string>>(new Set());

  const [enrichmentData, setEnrichmentData] = useState<EnrichissementOutputDto | null>(null);
  const [mutabilityData, setMutabilityData] = useState<MutabiliteOutputDto | null>(null);
  const [manualData, setManualData] = useState<Record<string, string>>({});

  const { versions } = useAlgorithmeVersions();
  const selectedVersion = versions[0]?.version ?? "";

  const { customSites, addSite, removeSite, clearAll } = useCustomSites(config.storageKey);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleSelectSite = useCallback(async (site: PartnerSite) => {
    setSelectedSite(site);
    setError(null);

    const cachedManual = manualDataRef.current.get(site.idtup) || {};
    setManualData(cachedManual);

    const cachedMutability = mutabilityCacheRef.current.get(site.idtup) || null;
    setMutabilityData(cachedMutability);

    const cachedEnrichment = enrichmentCacheRef.current.get(site.idtup);
    if (cachedEnrichment) {
      setEnrichmentData(cachedEnrichment);
      setLoadingState("idle");
      return;
    }

    setEnrichmentData(null);
    setLoadingState("enriching");
    try {
      const result = await enrichissementService.enrichirSite(site.parcelles, {
        acceptDegradedCache: true,
      });
      enrichmentCacheRef.current.set(site.idtup, result);
      setEnrichedSiteIds((prev) => new Set(prev).add(site.idtup));
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

  const cleanupCachesForSite = useCallback((idtup: string) => {
    enrichmentCacheRef.current.delete(idtup);
    mutabilityCacheRef.current.delete(idtup);
    manualDataRef.current.delete(idtup);
    setEnrichedSiteIds((prev) => {
      const next = new Set(prev);
      next.delete(idtup);
      return next;
    });
  }, []);

  const handleAddSiteSubmit = useCallback(
    (idpars: string[]) => {
      const result = addSite(idpars);
      return {
        invalidIdpars: result.invalidIdpars,
        success: result.added !== null,
      };
    },
    [addSite],
  );

  const handleRemoveCustomSite = useCallback(
    (idtup: string) => {
      cleanupCachesForSite(idtup);
      if (selectedSite?.idtup === idtup) {
        setSelectedSite(null);
        setEnrichmentData(null);
        setMutabilityData(null);
        setManualData({});
      }
      removeSite(idtup);
    },
    [removeSite, selectedSite, cleanupCachesForSite],
  );

  const handleClearCustomSites = useCallback(() => {
    customSites.forEach((s) => cleanupCachesForSite(s.idtup));
    if (selectedSite && customSites.some((s) => s.idtup === selectedSite.idtup)) {
      setSelectedSite(null);
      setEnrichmentData(null);
      setMutabilityData(null);
      setManualData({});
    }
    clearAll();
  }, [clearAll, customSites, selectedSite, cleanupCachesForSite]);

  return (
    <Layout fullWidth>
      <div className="fr-container fr-py-4w">
        <div className="fr-mb-4w">
          <div className="flex items-start justify-between gap-4">
            <h1 className="fr-h3 fr-mb-1w">Mutafriches — {config.nom}</h1>
            <PartagerButton slug={config.slug} nom={config.nom} />
          </div>
          <p className="fr-text--lg fr-mb-1w">{config.sousTitre}</p>
          <DonneesExternesLink />
        </div>

        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-md-4">
            <SiteList
              titre={config.sidemenuTitre}
              sitesByCommune={config.sitesByCommune}
              selectedSiteId={selectedSite?.idtup ?? null}
              onSelectSite={handleSelectSite}
              enrichedSiteIds={enrichedSiteIds}
              customSites={customSites}
              onAddSiteClick={() => setIsAddModalOpen(true)}
              onRemoveCustomSite={handleRemoveCustomSite}
              onClearCustomSites={handleClearCustomSites}
            />
          </div>
          <div className="fr-col-12 fr-col-md-8">
            {selectedSite ? (
              <SiteDetail
                site={selectedSite}
                enrichmentData={enrichmentData}
                mutabilityData={mutabilityData}
                manualData={manualData}
                isEnriching={loadingState === "enriching"}
                isCalculating={loadingState === "calculating"}
                error={error}
                selectedVersion={selectedVersion}
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

      <AddSiteModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddSiteSubmit}
      />
    </Layout>
  );
};

// Résout le partenaire depuis le slug de l'URL. La key force le remontage à chaque partenaire.
export const MultisitePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const config = getPartnerBySlug(slug);

  if (!config) {
    return (
      <Layout>
        <div className="fr-my-6w">
          <h1 className="fr-h3">Partenaire introuvable</h1>
          <p className="fr-text--lg">Aucun partenaire ne correspond à cette adresse.</p>
          <Link to={ROUTES.PARTENAIRES} className="fr-btn">
            Retour aux partenaires
          </Link>
        </div>
      </Layout>
    );
  }

  return <MultisiteView key={config.slug} config={config} />;
};
