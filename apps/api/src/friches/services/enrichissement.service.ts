/* eslint-disable no-console */
import { Injectable } from "@nestjs/common";
import { EnrichissementOutputDto, RisqueNaturel } from "@mutafriches/shared-types";
import { Parcelle } from "../domain/entities/parcelle.entity";
import { CadastreService } from "./external/cadastre/cadastre.service";
import { BdnbService } from "./external/bdnb/bdnb.service";
import { EnedisService } from "./external/enedis/enedis.service";
import { CadastreServiceResponse } from "./external/cadastre/cadastre.types";

@Injectable()
export class EnrichissementService {
  constructor(
    private readonly cadastreService: CadastreService,
    private readonly bdnbService: BdnbService,
    private readonly enedisService: EnedisService,
  ) {}

  /**
   * Enrichit une parcelle depuis toutes les sources externes disponibles
   */
  async enrichir(identifiantParcelle: string): Promise<EnrichissementOutputDto> {
    console.log(`Enrichissement parcelle: ${identifiantParcelle}`);

    const sourcesUtilisees: string[] = [];
    const champsManquants: string[] = [];

    // 1. Données cadastrales (obligatoires)
    const cadastreData = await this.getCadastreData(identifiantParcelle);
    if (!cadastreData) {
      throw new Error("Données cadastrales introuvables");
    }

    const parcelle = new Parcelle();
    parcelle.identifiantParcelle = cadastreData.identifiant;
    parcelle.commune = cadastreData.commune;
    parcelle.surfaceSite = cadastreData.surface;
    parcelle.coordonnees = cadastreData.coordonnees;
    sourcesUtilisees.push("Cadastre");

    // 2. Surface bâtie (BDNB)
    const surfaceBatie = await this.getSurfaceBatie(identifiantParcelle);
    if (surfaceBatie !== null) {
      parcelle.surfaceBati = surfaceBatie;
      sourcesUtilisees.push("BDNB");
    } else {
      champsManquants.push("surfaceBati");
    }

    // 3. Distance transport
    if (parcelle.coordonnees) {
      const distanceTransport = await this.getDistanceTransport(parcelle.coordonnees);
      if (distanceTransport !== null) {
        parcelle.distanceTransportCommun = distanceTransport;
        sourcesUtilisees.push("Transport");
      } else {
        champsManquants.push("distanceTransportCommun");
      }

      // 4. Données Enedis
      await this.enrichWithEnedisData(
        parcelle,
        parcelle.coordonnees,
        sourcesUtilisees,
        champsManquants,
      );

      // 5. Données Overpass
      await this.enrichWithOverpassData(
        parcelle,
        parcelle.coordonnees,
        sourcesUtilisees,
        champsManquants,
      );
    }

    // 6. Données Lovac
    await this.enrichWithLovacData(
      parcelle,
      cadastreData.commune,
      sourcesUtilisees,
      champsManquants,
    );

    // 7. Risques naturels (BDNB)
    await this.enrichWithRisquesNaturels(
      parcelle,
      identifiantParcelle,
      sourcesUtilisees,
      champsManquants,
    );

    // 8. Données complémentaires temporaires
    await this.enrichWithTemporaryMockData(
      parcelle,
      identifiantParcelle,
      sourcesUtilisees,
      champsManquants,
    );

    const fiabilite = this.calculateFiabilite(sourcesUtilisees.length, champsManquants.length);

    console.log(
      `Enrichissement terminé - Sources: ${sourcesUtilisees.length}, Manquants: ${champsManquants.length}`,
    );

    return {
      // Données déduites automatiquement de la parcelle
      identifiantParcelle: parcelle.identifiantParcelle,
      commune: parcelle.commune,
      surfaceSite: parcelle.surfaceSite,
      surfaceBati: parcelle.surfaceBati,
      connectionReseauElectricite: parcelle.connectionReseauElectricite,
      distanceRaccordementElectrique: parcelle.distanceRaccordementElectrique,
      presenceRisquesNaturels: parcelle.presenceRisquesNaturels,
      coordonnees: parcelle.coordonnees,

      // Données non déductibles pour le moment
      siteEnCentreVille: parcelle.siteEnCentreVille,
      distanceAutoroute: parcelle.distanceAutoroute,
      distanceTransportCommun: parcelle.distanceTransportCommun,
      proximiteCommercesServices: parcelle.proximiteCommercesServices,
      tauxLogementsVacants: parcelle.tauxLogementsVacants,
      presenceRisquesTechnologiques: parcelle.presenceRisquesTechnologiques,
      zonageEnvironnemental: parcelle.zonageEnvironnemental,
      zonageReglementaire: parcelle.zonageReglementaire,
      zonagePatrimonial: parcelle.zonagePatrimonial,
      trameVerteEtBleue: parcelle.trameVerteEtBleue,

      // Métadonnées d'enrichissement
      sourcesUtilisees,
      champsManquants,
      fiabilite,
    } as EnrichissementOutputDto;
  }

  /**
   * Récupère les données cadastrales
   */
  private async getCadastreData(identifiant: string): Promise<CadastreServiceResponse | null> {
    try {
      const result = await this.cadastreService.getParcelleInfo(identifiant);
      return result.success && result.data ? result.data : null;
    } catch (error) {
      console.error("Erreur cadastre:", error);
      return null;
    }
  }

  /**
   * Récupère la surface bâtie depuis BDNB
   */
  private async getSurfaceBatie(identifiant: string): Promise<number | null> {
    try {
      const result = await this.bdnbService.getSurfaceBatie(identifiant);
      return result.success && result.data !== undefined ? result.data : null;
    } catch (error) {
      console.error("Erreur BDNB:", error);
      return null;
    }
  }

  /**
   * Récupère la distance au transport en commun
   * TODO: Implémenter le service de transport manquant
   */
  private async getDistanceTransport(coordonnees: {
    latitude: number;
    longitude: number;
  }): Promise<number | null> {
    try {
      // TODO: Remplacer par le vrai service de transport
      console.log(
        `Transport temporaire pour coordonnées: ${coordonnees.latitude}, ${coordonnees.longitude}`,
      );

      // Données temporaires - distance aléatoire entre 100m et 2km
      const distanceTemporaire = Math.floor(Math.random() * 1900) + 100;
      return distanceTemporaire;
    } catch (error) {
      console.error("Erreur Transport:", error);
      return null;
    }
  }

  /**
   * Enrichit avec les données Enedis
   */
  private async enrichWithEnedisData(
    parcelle: Parcelle,
    coordonnees: { latitude: number; longitude: number },
    sources: string[],
    manquants: string[],
  ): Promise<void> {
    try {
      // Connection électrique - Maintenant avec les vraies coordonnées
      const connectionResult = await this.enedisService.checkConnection(
        parcelle.identifiantParcelle,
        coordonnees, // Passage des coordonnées réelles de la parcelle
      );

      if (connectionResult.success && connectionResult.data) {
        const connexionStatus = connectionResult.data;
        // Extraction du boolean depuis l'objet EnedisConnexionStatus
        parcelle.connectionReseauElectricite = connexionStatus.isConnected;
        sources.push("Enedis-Connection");
      } else {
        manquants.push("connectionReseauElectricite");
      }

      // Distance raccordement
      const distanceResult = await this.enedisService.getDistanceRaccordement(
        coordonnees.latitude,
        coordonnees.longitude,
      );

      if (distanceResult.success && distanceResult.data) {
        const raccordementData = distanceResult.data;
        parcelle.distanceRaccordementElectrique = raccordementData.distance;
        sources.push("Enedis-Raccordement");
      } else {
        manquants.push("distanceRaccordementElectrique");
      }
    } catch (error) {
      console.error("Erreur Enedis:", error);
      manquants.push("connectionReseauElectricite", "distanceRaccordementElectrique");
    }
  }

  /**
   * Enrichit avec les données Overpass
   * TODO: Implémenter les services Overpass pour commerces/services à proximité
   */
  private async enrichWithOverpassData(
    parcelle: Parcelle,
    coordonnees: { latitude: number; longitude: number },
    sources: string[],
    manquants: string[],
  ): Promise<void> {
    try {
      // TODO: Implémenter les appels aux services Overpass pour récupérer les données
      console.log(
        `Overpass temporaire pour coordonnées: ${coordonnees.latitude}, ${coordonnees.longitude}`,
      );

      // Données temporaires - présence aléatoire de commerces/services
      const hasCommercesServices = Math.random() > 0.5;
      parcelle.proximiteCommercesServices = hasCommercesServices;
      sources.push("Overpass-Temporaire");
    } catch (error) {
      console.error("Erreur Overpass:", error);
      manquants.push("proximiteCommercesServices");
    }
  }

  /**
   * Enrichit avec les données Lovac
   * TODO: Implémenter le service Lovac pour les taux de logements vacants
   */
  private async enrichWithLovacData(
    parcelle: Parcelle,
    commune: string,
    sources: string[],
    manquants: string[],
  ): Promise<void> {
    try {
      // TODO: Implémenter l'appel au service Lovac pour récupérer les données
      console.log(`Lovac temporaire pour commune: ${commune}`);

      // Données temporaires - taux de logements vacants aléatoire entre 2% et 15%
      const tauxTemporaire = Math.floor(Math.random() * 13) + 2;
      parcelle.tauxLogementsVacants = tauxTemporaire;
      sources.push("Lovac-Temporaire");
    } catch (error) {
      console.error("Erreur Lovac:", error);
      manquants.push("tauxLogementsVacants");
    }
  }

  /**
   * Enrichit avec les risques naturels depuis BDNB
   */
  private async enrichWithRisquesNaturels(
    parcelle: Parcelle,
    identifiantParcelle: string,
    sources: string[],
    manquants: string[],
  ): Promise<void> {
    try {
      const risquesResult = await this.bdnbService.getRisquesNaturels(identifiantParcelle);

      if (risquesResult.success && risquesResult.data) {
        const risquesData = risquesResult.data;

        if (risquesData.aleaArgiles) {
          // Transformer l'aléa argiles BDNB en enum de présence de risques naturels
          parcelle.presenceRisquesNaturels = this.transformAleaArgilesToRisque(
            risquesData.aleaArgiles,
          );
          sources.push("BDNB-Risques");
        } else {
          manquants.push("presenceRisquesNaturels");
        }
      } else {
        manquants.push("presenceRisquesNaturels");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      console.error("Erreur récupération risques naturels BDNB:", errorMessage);
      manquants.push("presenceRisquesNaturels");
    }
  }

  /**
   * Transforme l'aléa argiles BDNB en risque naturel pour Mutafriches
   */
  private transformAleaArgilesToRisque(aleaArgiles: string): RisqueNaturel {
    const aleaNormalise = aleaArgiles.toLowerCase();

    if (aleaNormalise.includes("fort") || aleaNormalise.includes("élevé")) {
      return RisqueNaturel.FORT;
    } else if (aleaNormalise.includes("moyen") || aleaNormalise.includes("modéré")) {
      return RisqueNaturel.MOYEN;
    } else if (aleaNormalise.includes("faible") || aleaNormalise.includes("bas")) {
      return RisqueNaturel.FAIBLE;
    } else if (aleaNormalise.includes("nul") || aleaNormalise.includes("inexistant")) {
      return RisqueNaturel.AUCUN;
    }

    // Valeur par défaut si format non reconnu
    return RisqueNaturel.AUCUN;
  }

  /**
   * Enrichit avec les données temporaires restantes
   * TODO: Remplacer par de vrais services quand disponibles
   */
  private async enrichWithTemporaryMockData(
    parcelle: Parcelle,
    identifiant: string,
    sources: string[],
    manquants: string[],
  ): Promise<void> {
    // TODO: Ces champs seront enrichis par de vrais services plus tard
    console.log(`Données temporaires pour parcelle: ${identifiant}`);

    try {
      // Données temporaires pour les champs manquants
      if (!parcelle.siteEnCentreVille) {
        parcelle.siteEnCentreVille = Math.random() > 0.6; // 40% de chance d'être en centre-ville
      }

      if (!parcelle.distanceAutoroute) {
        parcelle.distanceAutoroute = Math.floor(Math.random() * 20) + 1; // Entre 1 et 20 km
      }

      if (!parcelle.presenceRisquesTechnologiques) {
        parcelle.presenceRisquesTechnologiques = Math.random() > 0.8; // 20% de chance de risques technologiques
      }

      sources.push("Données-Temporaires");
    } catch (error) {
      console.error("Erreur données temporaires:", error);
      manquants.push("données-temporaires");
    }
  }

  /**
   * Calcule l'indice de fiabilité
   */
  private calculateFiabilite(sourcesCount: number, manquantsCount: number): number {
    let fiabilite = 10;
    fiabilite -= manquantsCount * 0.3;
    fiabilite -= sourcesCount > 2 ? 0 : 2; // Bonus si plusieurs sources
    return Math.max(0, Math.min(10, Math.round(fiabilite * 10) / 10));
  }
}
