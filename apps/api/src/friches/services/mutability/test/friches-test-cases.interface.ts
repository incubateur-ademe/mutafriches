import { MutabilityInputDto } from "src/friches/dto/mutability-input.dto";
import { UsageType } from "@mutafriches/shared-types";

/**
 * Interface pour définir les résultats attendus d'un test de mutabilité
 */
export interface ExpectedUsageResult {
  usage: UsageType;
  indiceMutabilite: number;
  rang: number;
}

/**
 * Interface pour définir un cas de test complet d'une friche
 */
export interface FricheTestCase {
  /** Identifiant unique du cas de test */
  id: string;

  /** Nom descriptif de la friche */
  name: string;

  /** Description du contexte de test */
  description: string;

  /** Source des données (ex: "Excel Test.xlsx") */
  source?: string;

  /** Version de l'algorithme utilisé pour les résultats attendus */
  algorithmVersion?: string;

  /** Données d'entrée pour le calcul de mutabilité */
  input: MutabilityInputDto;

  /** Résultats attendus */
  expected: {
    /** Résultats par usage, triés par rang */
    usages: ExpectedUsageResult[];

    /** Fiabilité attendue */
    fiabilite: number;

    /** Métadonnées sur le calcul */
    metadata?: {
      criteresRenseignes: number;
      criteresTotal: number;
      criteresManquants?: string[];
    };
  };
}
