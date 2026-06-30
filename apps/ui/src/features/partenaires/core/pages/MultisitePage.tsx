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
import { usePartenaireSites } from "../hooks/usePartenaireSites";
import { useSiteUserData } from "../hooks/useSiteUserData";
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

  // Saisie « Connaissance terrain » + mutabilité : persistées en local par site (ADR-0021, phase 3).
  const userData = useSiteUserData(config.storageKey);

  // IDs des sites enrichis suivis en state (le ref ne peut pas être lu pendant le rendu)
  const [enrichedSiteIds, setEnrichedSiteIds] = useState<Set<string>>(new Set());

  const [enrichmentData, setEnrichmentData] = useState<EnrichissementOutputDto | null>(null);
  const [mutabilityData, setMutabilityData] = useState<MutabiliteOutputDto | null>(null);
  const [manualData, setManualData] = useState<Record<string, string>>({});

  const { versions } = useAlgorithmeVersions();
  const selectedVersion = versions[0]?.version ?? "";

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Sites lus en base (repli sur la config statique). Cf. ADR-0021, phases 1 et 3.
  const { sitesByCommune, renommerSite, ajouterSite } = usePartenaireSites(config);

  const handleRenameSite = useCallback(
    async (id: string, nom: string) => {
      const updated = await renommerSite(id, nom);
      setSelectedSite((prev) => (prev?.id === id ? updated : prev));
    },
    [renommerSite],
  );

  const handleSelectSite = useCallback(
    async (site: PartnerSite) => {
      setSelectedSite(site);
      setError(null);

      setManualData(userData.getManualData(site.idtup));
      setMutabilityData(userData.getMutability(site.idtup));

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
    },
    [userData],
  );

  const handleManualDataChange = useCallback(
    (fieldName: string, value: string) => {
      if (!selectedSite) return;
      const updated = { ...manualData, [fieldName]: value };
      setManualData(updated);
      userData.setManualData(selectedSite.idtup, updated);
      userData.clearMutability(selectedSite.idtup);
      setMutabilityData(null);
    },
    [selectedSite, manualData, userData],
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
      userData.setMutability(selectedSite.idtup, result);
      setMutabilityData(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors du calcul de mutabilité";
      setError(message);
    } finally {
      setLoadingState("idle");
    }
  }, [selectedSite, enrichmentData, manualData, selectedVersion, userData]);

  const handleAddSiteSubmit = useCallback(
    async (idpars: string[]) => {
      const result = await ajouterSite(idpars);
      if (result.site) {
        await handleSelectSite(result.site);
      }
      return {
        invalidIdpars: result.invalidIdpars,
        success: result.site !== null,
      };
    },
    [ajouterSite, handleSelectSite],
  );

  return (
    <Layout fullWidth>
      <div className="fr-container fr-py-4w">
        <div className="fr-mb-4w">
          <div className="flex items-start justify-between gap-4">
            <h1 className="fr-h3 fr-mb-1w">{config.nom}</h1>
            <PartagerButton slug={config.slug} nom={config.nom} />
          </div>
          <DonneesExternesLink />
        </div>

        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-md-4">
            <SiteList
              sitesByCommune={sitesByCommune}
              selectedSiteId={selectedSite?.idtup ?? null}
              onSelectSite={handleSelectSite}
              enrichedSiteIds={enrichedSiteIds}
              onAddSiteClick={() => setIsAddModalOpen(true)}
            />
          </div>
          <div className="fr-col-12 fr-col-md-8">
            {selectedSite ? (
              <SiteDetail
                site={selectedSite}
                partenaireSlug={config.slug}
                partenaireNom={config.nom}
                onRenameSite={handleRenameSite}
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
