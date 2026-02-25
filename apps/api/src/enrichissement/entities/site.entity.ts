import { Coordonnees, GeometrieParcelle } from "@mutafriches/shared-types";

/**
 * Données initiales d'une parcelle individuelle au sein d'un site
 */
export interface ParcelleData {
  identifiantParcelle: string;
  codeInsee: string;
  commune: string;
  surface: number;
  surfaceBati?: number;
  coordonnees?: Coordonnees;
  geometrie?: GeometrieParcelle;
}

/**
 * Entité métier Site (ensemble de 1+ parcelles)
 *
 * Responsabilités :
 * - Stocker les données individuelles de chaque parcelle
 * - Déterminer la commune prédominante (plus grande surface cumulée)
 * - Déterminer la parcelle prédominante (plus grande surface)
 * - Calculer la surface totale
 * - Porter le centroïde et la géométrie union (calculés par SiteGeometryService)
 */
export class Site {
  parcelles: ParcelleData[] = [];

  /** Centroïde du site calculé depuis l'union des géométries */
  centroidSite?: Coordonnees;

  /** Géométrie union du site (union de toutes les parcelles) */
  geometrieUnion?: GeometrieParcelle;

  get identifiantsParcelles(): string[] {
    return this.parcelles.map((p) => p.identifiantParcelle);
  }

  get nombreParcelles(): number {
    return this.parcelles.length;
  }

  get surfaceTotale(): number {
    return this.parcelles.reduce((sum, p) => sum + p.surface, 0);
  }

  get surfaceBatieTotale(): number | undefined {
    const parcellesAvecBati = this.parcelles.filter((p) => p.surfaceBati !== undefined);
    if (parcellesAvecBati.length === 0) return undefined;
    return parcellesAvecBati.reduce((sum, p) => sum + (p.surfaceBati ?? 0), 0);
  }

  /** Commune avec la plus grande surface cumulée parmi les parcelles */
  get communePredominante(): { codeInsee: string; commune: string } {
    const surfaceParCommune = new Map<
      string,
      { codeInsee: string; commune: string; surface: number }
    >();

    for (const p of this.parcelles) {
      const existing = surfaceParCommune.get(p.codeInsee) ?? {
        codeInsee: p.codeInsee,
        commune: p.commune,
        surface: 0,
      };
      existing.surface += p.surface;
      surfaceParCommune.set(p.codeInsee, existing);
    }

    const sorted = [...surfaceParCommune.values()].sort((a, b) => b.surface - a.surface);
    return { codeInsee: sorted[0].codeInsee, commune: sorted[0].commune };
  }

  /** Parcelle avec la plus grande surface (première en cas d'égalité) */
  get parcellePredominante(): ParcelleData {
    return [...this.parcelles].sort((a, b) => b.surface - a.surface)[0];
  }

  estMonoParcelle(): boolean {
    return this.parcelles.length === 1;
  }
}
