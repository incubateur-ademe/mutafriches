import {
  RisqueNaturel,
  ZonageEnvironnemental,
  ZonagePatrimonial,
  TrameVerteEtBleue,
} from '../enums/parcelle.enums';

export interface SourceInfo {
  champ: string;
  source: string;
  fiable: boolean;
}

export class ParcelleDetectionResultDto {
  // Champs déduits automatiquement
  commune: string;
  identifiantParcelle: string;
  surfaceSite: number;
  surfaceBati?: number;
  connectionReseauElectricite: boolean;
  ancienneActivite?: string;
  siteEnCentreVille: boolean;
  distanceAutoroute: number;
  distanceTransportCommun: number;
  proximiteCommercesServices: boolean;
  distanceRaccordementElectrique: number;
  tauxLogementsVacants: number;
  presenceRisquesTechnologiques: boolean;

  // Utilisation des enums (plus type-safe)
  presenceRisquesNaturels: RisqueNaturel;
  zonageEnvironnemental: ZonageEnvironnemental;
  zonagePatrimonial: ZonagePatrimonial;
  trameVerteEtBleue: TrameVerteEtBleue;

  zonageReglementaire: string;

  // Métadonnées
  sourcesUtilisees: SourceInfo[];
  fiabilite: number;
  sessionId: string;
}
