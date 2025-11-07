import { Injectable, Logger } from '@nestjs/common';
import { ZonagePatrimonial } from '@mutafriches/shared-types';
import { ApiCartoGpuFeature } from '../../../adapters/api-carto/gpu/api-carto-gpu.types';
import { ResultatAC1, ResultatAC2, ResultatAC4 } from './zonage-patrimonial.types';

/**
 * Calculator du sous-domaine Zonage Patrimonial
 *
 * Contient toute la logique métier pure pour évaluer le zonage patrimonial
 * basé sur les SUP (AC1, AC2, AC4)
 */
@Injectable()
export class ZonagePatrimonialCalculator {
  private readonly logger = new Logger(ZonagePatrimonialCalculator.name);

  /**
   * Évalue le zonage patrimonial final
   *
   * Règles métier (par ordre de priorité) :
   * - AC1 Monument → MONUMENT_HISTORIQUE
   * - AC1 Périmètre → PERIMETRE_ABF
   * - AC2 → SITE_INSCRIT_CLASSE
   * - AC4 ZPPAUP → ZPPAUP
   * - AC4 AVAP → AVAP
   * - AC4 SPR → SPR
   * - Sinon → NON_CONCERNE
   */
  evaluer(
    ac1: ResultatAC1 | null,
    ac2: ResultatAC2 | null,
    ac4: ResultatAC4 | null,
  ): ZonagePatrimonial {
    // Priorité 1 : AC1 (Monuments historiques)
    if (ac1?.present) {
      if (ac1.type === 'monument') {
        this.logger.debug('Zonage patrimonial: MONUMENT_HISTORIQUE');
        return ZonagePatrimonial.MONUMENT_HISTORIQUE;
      }
      if (ac1.type === 'perimetre') {
        this.logger.debug('Zonage patrimonial: PERIMETRE_ABF');
        return ZonagePatrimonial.PERIMETRE_ABF;
      }
    }

    // Priorité 2 : AC2 (Sites inscrits/classés)
    if (ac2?.present) {
      this.logger.debug('Zonage patrimonial: SITE_INSCRIT_CLASSE');
      return ZonagePatrimonial.SITE_INSCRIT_CLASSE;
    }

    // Priorité 3 : AC4 (SPR/ZPPAUP/AVAP)
    if (ac4?.present) {
      if (ac4.type === 'zppaup') {
        this.logger.debug('Zonage patrimonial: ZPPAUP');
        return ZonagePatrimonial.ZPPAUP;
      }
      if (ac4.type === 'avap') {
        this.logger.debug('Zonage patrimonial: AVAP');
        return ZonagePatrimonial.AVAP;
      }
      if (ac4.type === 'spr') {
        this.logger.debug('Zonage patrimonial: SPR');
        return ZonagePatrimonial.SPR;
      }
    }

    // Aucun zonage
    this.logger.debug('Zonage patrimonial: NON_CONCERNE');
    return ZonagePatrimonial.NON_CONCERNE;
  }

  /**
   * Mappe les features AC1 vers le type de zonage
   */
  mapAC1Features(features: ApiCartoGpuFeature[]): 'monument' | 'perimetre' | null {
    if (!features || features.length === 0) {
      return null;
    }

    for (const feature of features) {
      const typeass = (feature.properties?.typeass as string)?.toLowerCase() || '';
      const nomass = (feature.properties?.nomass as string)?.toLowerCase() || '';

      // Monument lui-même
      if (
        typeass.includes('monument') ||
        typeass.includes('emprise') ||
        nomass.includes('monument')
      ) {
        return 'monument';
      }

      // Périmètre de protection
      if (
        typeass.includes('périmètre') ||
        typeass.includes('perimetre') ||
        typeass.includes('protection') ||
        typeass.includes('abord') ||
        nomass.includes('périmètre') ||
        nomass.includes('perimetre')
      ) {
        return 'perimetre';
      }
    }

    // Par défaut : périmètre ABF
    return 'perimetre';
  }

  /**
   * Mappe les features AC4 vers le type de zonage
   */
  mapAC4Features(features: ApiCartoGpuFeature[]): 'zppaup' | 'avap' | 'spr' | null {
    if (!features || features.length === 0) {
      return null;
    }

    for (const feature of features) {
      const typeass = (feature.properties?.typeass as string)?.toLowerCase() || '';
      const nomass = (feature.properties?.nomass as string)?.toLowerCase() || '';
      const combined = `${typeass} ${nomass}`;

      if (combined.includes('zppaup')) {
        return 'zppaup';
      }

      if (combined.includes('avap')) {
        return 'avap';
      }

      if (combined.includes('spr') || combined.includes('site patrimonial')) {
        return 'spr';
      }
    }

    // Par défaut : SPR (le plus récent)
    return 'spr';
  }
}
