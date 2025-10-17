import React, { useState } from "react";
import { LoadingCallout } from "@/shared/components/common/LoadingCallout";
import { ErrorAlert } from "@/shared/components/common/ErrorAlert";
import { frichesService } from "@/shared/services/api/api.friches.service";
import type { EnrichissementOutputDto } from "@mutafriches/shared-types";
import { ParcelleSelection } from "../../../enrichissement/components/parcelle-selection/ParcelleSelection";

interface EnrichmentTestSelectionProps {
  onEnrichmentComplete: (data: EnrichissementOutputDto) => void;
}

export const EnrichmentTestSelection: React.FC<EnrichmentTestSelectionProps> = ({
  onEnrichmentComplete,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnrichir = async (identifiant: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const enrichmentResult = await frichesService.enrichirParcelle(identifiant);
      onEnrichmentComplete(enrichmentResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <ParcelleSelection onAnalyze={handleEnrichir} />

      {isLoading && (
        <LoadingCallout
          title="Enrichissement en cours"
          message="Récupération des informations de la parcelle..."
        />
      )}

      {error && !isLoading && <ErrorAlert message={error} />}
    </div>
  );
};
