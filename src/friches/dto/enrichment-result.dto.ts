import { Parcelle } from '../entities/parcelle.entity';

export interface EnrichmentResultDto {
  parcelle: Parcelle;
  sourcesUtilisees: string[];
  champsManquants: string[];
  fiabilite: number;
}
