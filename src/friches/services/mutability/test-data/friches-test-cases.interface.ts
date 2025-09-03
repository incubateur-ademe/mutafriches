import { MutabilityInputDto } from 'src/friches/dto/mutability-input.dto';
import { UsageType } from 'src/friches/enums/mutability.enums';

/**
 * Interface pour définir les résultats attendus d'un test de mutabilité
 */
export interface ExpectedUsageResult {
  usage: UsageType;
  indiceMutabilite: number;
  /** Tolérance acceptable pour l'indice (ex: ±1%) */
  tolerance?: number;
  rang: number;
  /** Optionnel : valeurs attendues pour debug */
  expectedAvantages?: number;
  expectedContraintes?: number;
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

  /** Source des données (ex: "Excel Test 3 Renaison.xlsx") */
  source?: string;

  /** Date de création du cas de test */
  createdAt: string;

  /** Version de l'algorithme utilisé pour les résultats attendus */
  algorithmVersion?: string;

  /** Données d'entrée pour le calcul de mutabilité */
  input: MutabilityInputDto;

  /** Résultats attendus */
  expected: {
    /** Résultats par usage, triés par rang */
    usages: ExpectedUsageResult[];

    /** Fiabilité attendue */
    fiabilite: {
      note: number;
      noteMin?: number;
      noteMax?: number;
      text: string;
    };

    /** Métadonnées sur le calcul */
    metadata?: {
      criteresRenseignes: number;
      criteresTotal: number;
      criteresNonMappes?: string[];
    };
  };

  /** Tags pour catégoriser les tests */
  tags?: string[];

  /** Notes additionnelles pour le debug */
  notes?: string;
}
