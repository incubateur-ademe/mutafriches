import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BaseLayout } from "../layouts/BaseLayout";
import { Header } from "../components/common/Header";
import { Stepper } from "../components/common/Stepper";
import { SelectionMode } from "../components/parcelle/SelectionMode";
import { MultiParcelleToggle } from "../components/parcelle/MultiParcelleToggle";
import { IdMode } from "../components/parcelle/IdMode";
import { MapMode } from "../components/parcelle/MapMode";
import { ErrorAlert } from "../components/ui/ErrorAlert";
import { LoadingCallout } from "../components/ui/LoadingCallout";
import { useParcelles } from "../hooks/useParcelles";
import { EnrichmentResultDto } from "@mutafriches/shared-types";

export function Step1() {
  const navigate = useNavigate();
  const parcelles = useParcelles();

  // États locaux
  const [selectionMode, setSelectionMode] = useState<"id" | "carte">("id");
  const [isMultiParcelle, setIsMultiParcelle] = useState(false);
  const [identifiant, setIdentifiant] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrichmentData, setEnrichmentData] = useState<EnrichmentResultDto | null>(null);

  // Fonction de recherche/enrichissement
  const handleSearch = async (parcelId?: string) => {
    const idToSearch = parcelId || identifiant.trim();

    if (!idToSearch) {
      setError("Veuillez saisir un identifiant de parcelle");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await parcelles.enrichir(idToSearch);
      setEnrichmentData(result);

      // TODO: Sauvegarder en session ou contexte
      // Naviguer vers l'étape suivante après succès
      setTimeout(() => {
        navigate("/step2", { state: { enrichmentData: result } });
      }, 1500);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Une erreur technique s'est produite lors de la récupération des données.";
      setError(`Impossible de trouver les données pour cette parcelle : ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler pour la sélection depuis la carte
  const handleMapSelect = (parcelId: string) => {
    setIdentifiant(parcelId);
    handleSearch(parcelId);
  };

  return (
    <BaseLayout>
      <Header />

      <Stepper
        currentStep={1}
        totalSteps={3}
        currentStepTitle="Sélection de la parcelle"
        nextStepTitle="Données complémentaires"
      />

      <div className="fr-mb-4w">
        <h3>Sélectionnez la (les) parcelle(s) concernée(s)</h3>

        {/* Choix du mode de sélection */}
        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-12 fr-col-md-8">
            <SelectionMode mode={selectionMode} onModeChange={setSelectionMode} />
          </div>

          <div className="fr-col-12 fr-col-md-4">
            <MultiParcelleToggle isMulti={isMultiParcelle} onToggle={setIsMultiParcelle} />
          </div>
        </div>

        {/* Mode de sélection actif */}
        {selectionMode === "carte" ? (
          <MapMode onSelectParcel={handleMapSelect} />
        ) : (
          <IdMode
            identifiant={identifiant}
            onIdentifiantChange={setIdentifiant}
            onSearch={() => handleSearch()}
            isLoading={isLoading}
          />
        )}

        {/* États de chargement et erreurs */}
        {isLoading && <LoadingCallout />}
        {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

        {/* Affichage temporaire des données enrichies (sera dans un composant séparé) */}
        {enrichmentData && !isLoading && (
          <div className="fr-callout fr-callout--green-emeraude fr-mt-4w">
            <h3 className="fr-callout__title">Données récupérées avec succès</h3>
            <p className="fr-callout__text">
              Parcelle {enrichmentData.identifiantParcelle} à {enrichmentData.commune}
              <br />
              Surface : {enrichmentData.surfaceSite} m²
            </p>
          </div>
        )}
      </div>
    </BaseLayout>
  );
}
