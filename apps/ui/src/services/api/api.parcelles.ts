import {
  ParcelleInputDto,
  EnrichmentResultDto,
  MutabilityInputDto,
  MutabilityResultDto,
} from "@mutafriches/shared-types";
import { handleResponse } from "./api.errors";
import { API_BASE_URL, DEFAULT_FETCH_OPTIONS, DEFAULT_HEADERS } from "./api.config";

/**
 * Enrichir une parcelle avec les données externes
 */
export async function enrichirParcelle(identifiantParcelle: string): Promise<EnrichmentResultDto> {
  const input: ParcelleInputDto = { identifiantParcelle };

  const response = await fetch(`${API_BASE_URL}/friches/parcelle/enrichir`, {
    ...DEFAULT_FETCH_OPTIONS,
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(input),
  });

  return handleResponse<EnrichmentResultDto>(response);
}

/**
 * Calculer la mutabilité d'une parcelle
 */
export async function calculerMutabilite(input: MutabilityInputDto): Promise<MutabilityResultDto> {
  const response = await fetch(`${API_BASE_URL}/friches/parcelle/mutabilite`, {
    ...DEFAULT_FETCH_OPTIONS,
    method: "POST",
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(input),
  });

  return handleResponse<MutabilityResultDto>(response);
}

/**
 * Workflow complet : enrichir puis calculer la mutabilité
 */
export async function analyserParcelle(
  identifiantParcelle: string,
  donneesManuellesInput?: Partial<MutabilityInputDto>,
): Promise<{
  enrichment: EnrichmentResultDto;
  mutability: MutabilityResultDto;
}> {
  // Étape 1: Enrichissement
  const enrichment = await enrichirParcelle(identifiantParcelle);

  // Étape 2: Fusion avec les données manuelles
  const mutabilityInput: MutabilityInputDto = {
    ...enrichment,
    ...donneesManuellesInput,
  } as MutabilityInputDto;

  // Étape 3: Calcul de mutabilité
  const mutability = await calculerMutabilite(mutabilityInput);

  return { enrichment, mutability };
}
