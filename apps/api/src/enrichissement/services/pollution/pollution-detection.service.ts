import { Injectable, Logger } from "@nestjs/common";
import { SourceEnrichissement } from "@mutafriches/shared-types";
import { AdemeSitesPolluesRepository } from "../../repositories/ademe-sites-pollues.repository";
import { SisService } from "../../adapters/georisques/sis/sis.service";
import { IcpeService } from "../../adapters/georisques/icpe/icpe.service";
import { GEORISQUES_RAYONS_DEFAUT } from "../../adapters/georisques/georisques.constants";

/** Seuil de distance ICPE en metres pour considerer le site comme pollue */
const ICPE_DISTANCE_SEUIL_METRES = 500;

/**
 * Resultat de la detection de pollution
 */
export interface PollutionDetectionResult {
  /** Le site est-il reference comme pollue (ADEME, SIS ou ICPE proche) */
  siteReferencePollue: boolean;

  /** Sources ayant detecte une pollution */
  sourcesPollution: string[];

  /** Sources utilisees avec succes */
  sourcesUtilisees: string[];

  /** Sources en echec */
  sourcesEchouees: string[];

  /** Detail: pollution detectee via ADEME */
  pollutionAdeme: boolean;

  /** Detail: pollution detectee via SIS (Secteurs d'Information sur les Sols) */
  pollutionSis: boolean;

  /** Detail: pollution detectee via ICPE (installation a moins de 500m) */
  pollutionIcpe: boolean;

  /** Distance de l'ICPE la plus proche (si applicable) */
  distanceIcpePlusProche?: number;
}

/**
 * Service de detection de pollution combinant 3 sources :
 * - ADEME Sites Pollues (base PostGIS locale)
 * - GeoRisques SIS (Secteurs d'Information sur les Sols)
 * - GeoRisques ICPE (Installations Classees pour la Protection de l'Environnement)
 *
 * Le site est considere comme pollue si AU MOINS UNE des conditions est vraie :
 * - Parcelle a moins de 500m d'un site ADEME
 * - Parcelle dans un secteur SIS
 * - Parcelle a moins de 500m d'une ICPE
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
   * Detecte si un site est potentiellement pollue en combinant 3 sources
   *
   * @param latitude Latitude WGS84
   * @param longitude Longitude WGS84
   * @param codeInsee Code INSEE de la commune (optionnel, pour ADEME)
   * @returns Resultat de detection avec details par source
   */
  async detecterPollution(
    latitude: number,
    longitude: number,
    codeInsee?: string,
  ): Promise<PollutionDetectionResult> {
    const sourcesUtilisees: string[] = [];
    const sourcesEchouees: string[] = [];
    const sourcesPollution: string[] = [];

    let pollutionAdeme = false;
    let pollutionSis = false;
    let pollutionIcpe = false;
    let distanceIcpePlusProche: number | undefined;

    // Appeler les 3 sources en parallele
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
        if (pollutionAdeme) {
          sourcesPollution.push("ADEME-Sites-Pollues");
        }
        this.logger.debug(`ADEME: pollue=${pollutionAdeme}`);
      } else {
        sourcesEchouees.push("ADEME-Sites-Pollues");
      }
    } else {
      sourcesEchouees.push("ADEME-Sites-Pollues");
      this.logger.warn(`Echec ADEME: ${ademeResult.reason}`);
    }

    // 2. Traiter SIS
    if (sisResult.status === "fulfilled") {
      if (sisResult.value !== null) {
        sourcesUtilisees.push(SourceEnrichissement.GEORISQUES_SIS);
        pollutionSis = sisResult.value;
        if (pollutionSis) {
          sourcesPollution.push(SourceEnrichissement.GEORISQUES_SIS);
        }
        this.logger.debug(`SIS: pollue=${pollutionSis}`);
      } else {
        sourcesEchouees.push(SourceEnrichissement.GEORISQUES_SIS);
      }
    } else {
      sourcesEchouees.push(SourceEnrichissement.GEORISQUES_SIS);
      this.logger.warn(`Echec SIS: ${sisResult.reason}`);
    }

    // 3. Traiter ICPE
    if (icpeResult.status === "fulfilled") {
      if (icpeResult.value !== null) {
        sourcesUtilisees.push(SourceEnrichissement.GEORISQUES_ICPE);
        distanceIcpePlusProche = icpeResult.value.distancePlusProche;
        pollutionIcpe = icpeResult.value.pollue;
        if (pollutionIcpe) {
          sourcesPollution.push(SourceEnrichissement.GEORISQUES_ICPE);
        }
        this.logger.debug(
          `ICPE: pollue=${pollutionIcpe}, distance=${distanceIcpePlusProche !== undefined ? `${Math.round(distanceIcpePlusProche)}m` : "N/A"}`,
        );
      } else {
        sourcesEchouees.push(SourceEnrichissement.GEORISQUES_ICPE);
      }
    } else {
      sourcesEchouees.push(SourceEnrichissement.GEORISQUES_ICPE);
      this.logger.warn(`Echec ICPE: ${icpeResult.reason}`);
    }

    // Resultat final : pollue si au moins une source detecte une pollution
    const siteReferencePollue = pollutionAdeme || pollutionSis || pollutionIcpe;

    this.logger.log(
      `Detection pollution (lat=${latitude.toFixed(5)}, lon=${longitude.toFixed(5)}): ` +
        `ADEME=${pollutionAdeme}, SIS=${pollutionSis}, ICPE=${pollutionIcpe} ` +
        `-> siteReferencePollue=${siteReferencePollue}`,
    );

    return {
      siteReferencePollue,
      sourcesPollution,
      sourcesUtilisees,
      sourcesEchouees,
      pollutionAdeme,
      pollutionSis,
      pollutionIcpe,
      distanceIcpePlusProche,
    };
  }

  /**
   * Verifie la pollution via ADEME (base PostGIS locale)
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
      this.logger.error("Erreur lors de la verification ADEME:", error);
      return null;
    }
  }

  /**
   * Verifie la pollution via SIS (GeoRisques API)
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
      this.logger.error("Erreur lors de la verification SIS:", error);
      return null;
    }
  }

  /**
   * Verifie la pollution via ICPE (GeoRisques API)
   * Pollue si une ICPE est a moins de 500m
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
      this.logger.error("Erreur lors de la verification ICPE:", error);
      return null;
    }
  }
}
