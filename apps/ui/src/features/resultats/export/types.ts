import type {
  DonneesComplementairesInputDto,
  EnrichissementOutputDto,
  MutabiliteOutputDto,
} from "@mutafriches/shared-types";

/** Données nécessaires aux exports (PDF et JSON) du résultat de mutabilité. */
export interface ResultatsExportData {
  mutabilite: MutabiliteOutputDto;
  enrichissement?: EnrichissementOutputDto;
  complementaires?: Partial<DonneesComplementairesInputDto>;
  site: {
    identifiant?: string;
    commune?: string;
    nombreParcelles?: number;
    surfaceM2?: number;
  };
}
