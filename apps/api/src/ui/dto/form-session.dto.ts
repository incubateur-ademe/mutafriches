import { MutabilityInputDto } from "src/friches/dto/mutability-input.dto";
import { UiMutabilityResultDto } from "./ui-mutability-result.dto";
import { DataSource } from "../enums/form-session.enums";
import { ParcelleBase } from "src/friches/entities/shared/parcelle.base";

/**
 * Interface pour tracer l'origine des données
 */
export interface DataWithSource<T> {
  value: T;
  source: DataSource;
  confidence?: number; // Score de confiance 0-100
}

/**
 * Données de session unifiées basées sur ParcelleBase
 */
export interface FormSessionData {
  /**
   * Étape courante du formulaire
   */
  currentStep: number;

  /**
   * Identifiant de la parcelle (point d'entrée)
   */
  identifiantParcelle?: string;

  /**
   * Données de la parcelle avec traçabilité des sources
   * Réutilise directement la structure ParcelleBase
   */
  parcelleData: Partial<{
    [K in keyof ParcelleBase]: DataWithSource<ParcelleBase[K]>;
  }>;

  /**
   * Métadonnées de la session
   */
  metadata: {
    createdAt: Date;
    lastUpdatedAt: Date;
    completionPercentage: number;
    dataQualityScore: number;
  };

  /**
   * Résultats compilés
   */
  mutabilityInput?: MutabilityInputDto;
  mutabilityResult?: UiMutabilityResultDto;
}
