import { Injectable, Logger } from "@nestjs/common";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { Site } from "../../../evaluation/entities/site.entity";
import { AdemeSitesPolluesRepository } from "../../repositories/ademe-sites-pollues.repository";
import { SisService } from "../../adapters/georisques/sis/sis.service";
import { IcpeService } from "../../adapters/georisques/icpe/icpe.service";
import { GEORISQUES_RAYONS_DEFAUT } from "../../adapters/georisques/georisques.constants";
import { EnrichmentResult } from "../shared/enrichissement.types";

/** Seuil de distance ICPE en mètres pour considérer le site comme pollué */
const ICPE_DISTANCE_SEUIL_METRES = 500;

/**
 * Service de détection de pollution combinant 3 sources :
 * - ADEME Sites Pollués (base PostGIS locale)
 * - GéoRisques SIS (Secteurs d'Information sur les Sols)
 * - GéoRisques ICPE (Installations Classées pour la Protection de l'Environnement)
 *
 * Le site est considéré comme pollué si AU MOINS UNE des conditions est vraie :
 * - Parcelle à moins de 500m d'un site ADEME
 * - Parcelle dans un secteur SIS
 * - Parcelle à moins de 500m d'une ICPE
 *
 * Pattern uniforme : enrichir(site) mute site.siteReferencePollue et retourne EnrichmentResult
 */
@Injectable()
export class PollutionDetectionService {
  private readonly logger = new Logger(PollutionDetectionService.name);

  constructor(
    private readonly ademeSitesPolluesRepository: AdemeSitesPolluesRepository,
    private readonly sisService: SisService,
    private readonly icpeService: IcpeService,
  ) {}

  /**
   * Enrichit un site avec la détection de pollution
   *
   * Mute site.siteReferencePollue avec le résultat combiné des 3 sources
   *
   * @param site - Site à enrichir (doit avoir des coordonnées)
   * @returns Résultat de l'enrichissement (sources utilisées/échouées)
   */
  async enrichir(site: Site): Promise<EnrichmentResult> {
    const sourcesUtilisees: string[] = [];
    const sourcesEchouees: string[] = [];

    if (!site.coordonnees) {
      this.logger.warn(
        `Pas de coordonnées disponibles pour la détection de pollution - site ${site.identifiantParcelle}`,
      );
      sourcesEchouees.push(
        "ADEME-Sites-Pollues",
        SourceEnrichissement.GEORISQUES_SIS,
        SourceEnrichissement.GEORISQUES_ICPE,
      );
      site.siteReferencePollue = false;
      return { success: false, sourcesUtilisees, sourcesEchouees };
    }

    const { latitude, longitude } = site.coordonnees;
    const codeInsee = site.codeInsee;

    let pollutionAdeme = false;
    let pollutionSis = false;
    let pollutionIcpe = false;

    // Appeler les 3 sources en parallèle
    const [ademeResult, sisResult, icpeResult] = await Promise.allSettled([
      this.checkAdeme(latitude, longitude, codeInsee),
      this.checkSis(latitude, longitude),
      this.checkIcpe(latitude, longitude),
    ]);

    // 1. Traiter ADEME
    if (ademeResult.status === "fulfilled") {
      if (ademeResult.value !== null) {
        sourcesUtilisees.push("ADEME-Sites-Pollues");
        pollutionAdeme = ademeResult.value;
        this.logger.debug(`ADEME: pollué=${pollutionAdeme}`);
      } else {
        sourcesEchouees.push("ADEME-Sites-Pollues");
      }
    } else {
      sourcesEchouees.push("ADEME-Sites-Pollues");
      this.logger.warn(`Échec ADEME: ${ademeResult.reason}`);
    }

    // 2. Traiter SIS
    if (sisResult.status === "fulfilled") {
      if (sisResult.value !== null) {
        sourcesUtilisees.push(SourceEnrichissement.GEORISQUES_SIS);
        pollutionSis = sisResult.value;
        this.logger.debug(`SIS: pollué=${pollutionSis}`);
      } else {
        sourcesEchouees.push(SourceEnrichissement.GEORISQUES_SIS);
      }
    } else {
      sourcesEchouees.push(SourceEnrichissement.GEORISQUES_SIS);
      this.logger.warn(`Échec SIS: ${sisResult.reason}`);
    }

    // 3. Traiter ICPE
    if (icpeResult.status === "fulfilled") {
      if (icpeResult.value !== null) {
        sourcesUtilisees.push(SourceEnrichissement.GEORISQUES_ICPE);
        pollutionIcpe = icpeResult.value.pollue;
        this.logger.debug(
          `ICPE: pollué=${pollutionIcpe}, distance=${icpeResult.value.distancePlusProche !== undefined ? `${Math.round(icpeResult.value.distancePlusProche)}m` : "N/A"}`,
        );
      } else {
        sourcesEchouees.push(SourceEnrichissement.GEORISQUES_ICPE);
      }
    } else {
      sourcesEchouees.push(SourceEnrichissement.GEORISQUES_ICPE);
      this.logger.warn(`Échec ICPE: ${icpeResult.reason}`);
    }

    // Résultat final : pollué si au moins une source détecte une pollution
    const siteReferencePollue = pollutionAdeme || pollutionSis || pollutionIcpe;
    site.siteReferencePollue = siteReferencePollue;

    this.logger.log(
      `Détection pollution (lat=${latitude.toFixed(5)}, lon=${longitude.toFixed(5)}): ` +
        `ADEME=${pollutionAdeme}, SIS=${pollutionSis}, ICPE=${pollutionIcpe} ` +
        `-> siteReferencePollue=${siteReferencePollue}`,
    );

    return {
      success: sourcesUtilisees.length > 0,
      sourcesUtilisees,
      sourcesEchouees,
    };
  }

  /**
   * Vérifie la pollution via ADEME (base PostGIS locale)
   */
  private async checkAdeme(
    latitude: number,
    longitude: number,
    codeInsee?: string,
  ): Promise<boolean | null> {
    try {
      return await this.ademeSitesPolluesRepository.isSiteReferencePollue(
        latitude,
        longitude,
        codeInsee,
      );
    } catch (error) {
      this.logger.error("Erreur lors de la vérification ADEME:", error);
      return null;
    }
  }

  /**
   * Vérifie la pollution via SIS (GéoRisques API)
   */
  private async checkSis(latitude: number, longitude: number): Promise<boolean | null> {
    try {
      const result = await this.sisService.getSisByLatLon({
        latitude,
        longitude,
        rayon: GEORISQUES_RAYONS_DEFAUT.SIS,
      });

      if (!result.success || !result.data) {
        return null;
      }

      return result.data.presenceSis;
    } catch (error) {
      this.logger.error("Erreur lors de la vérification SIS:", error);
      return null;
    }
  }

  /**
   * Vérifie la pollution via ICPE (GéoRisques API)
   * Pollué si une ICPE est à moins de 500m
   */
  private async checkIcpe(
    latitude: number,
    longitude: number,
  ): Promise<{ pollue: boolean; distancePlusProche?: number } | null> {
    try {
      const result = await this.icpeService.getIcpeByLatLon({
        latitude,
        longitude,
        rayon: GEORISQUES_RAYONS_DEFAUT.ICPE,
      });

      if (!result.success || !result.data) {
        return null;
      }

      const distancePlusProche = result.data.distancePlusProche;
      const pollue =
        distancePlusProche !== undefined && distancePlusProche <= ICPE_DISTANCE_SEUIL_METRES;

      return {
        pollue,
        distancePlusProche,
      };
    } catch (error) {
      this.logger.error("Erreur lors de la vérification ICPE:", error);
      return null;
    }
  }
}
