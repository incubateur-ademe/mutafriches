import {
  ZonageEnvironnemental,
  ZonagePatrimonial,
  ZonageReglementaire,
  DiagnosticZonages,
} from "@mutafriches/shared-types";
import { EnrichmentResult } from "../shared/enrichissement.types";
import {
  EvaluationZonageEnvironnemental,
  EvaluationZonagePatrimonial,
  EvaluationZonageReglementaire,
} from "./index";

/**
 * Résultat complet de l'enrichissement zonage
 */
export interface ResultatEnrichissementZonage {
  result: EnrichmentResult;
  zonageEnvironnemental: ZonageEnvironnemental;
  zonagePatrimonial: ZonagePatrimonial;
  zonageReglementaire: ZonageReglementaire;
  evaluations: {
    environnemental: EvaluationZonageEnvironnemental;
    patrimonial: EvaluationZonagePatrimonial;
    reglementaire: EvaluationZonageReglementaire;
  };
  /** Données brutes des APIs pour le panneau de diagnostic (absent en production) */
  diagnosticZonages?: DiagnosticZonages;
}
