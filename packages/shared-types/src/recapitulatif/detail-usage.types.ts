import { ImpactCritere } from "./impact.labels";
import { SectionRecapitulatifId } from "./recapitulatif.types";

/** Critère détaillé pour un usage : valeur, pondération et impact */
export interface DetailUsageCritere {
  key: string;
  label: string;
  valeurAffichee: string;
  /** Poids du critère dans le calcul (POIDS_CRITERES) */
  poids: number;
  impact: ImpactCritere;
}

/** Section de critères détaillés pour un usage */
export interface DetailUsageSection {
  id: SectionRecapitulatifId;
  titre: string;
  criteres: DetailUsageCritere[];
}
