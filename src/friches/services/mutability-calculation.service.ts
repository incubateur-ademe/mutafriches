import { Injectable } from '@nestjs/common';
import { Parcelle } from '../entities/parcelle.entity';
import { TrameVerteEtBleue, ZonagePatrimonial } from '../enums/parcelle.enums';
import {
  MutabilityResultDto,
  UsageResultDto,
} from '../dto/mutability-result.dto';

@Injectable()
export class MutabilityCalculationService {
  /**
   * Calcule les indices de mutabilité pour les 7 usages
   */
  calculateMutability(
    parcelle: Parcelle,
    fiabilite: number,
  ): MutabilityResultDto {
    const usages = [
      this.calculateResidentielMixte(parcelle),
      this.calculateEquipementsPublics(parcelle),
      this.calculateTertiaire(parcelle),
      this.calculateCultureTourisme(parcelle),
      this.calculateIndustrie(parcelle),
      this.calculatePhotovoltaique(parcelle),
      this.calculateRenaturation(parcelle),
    ];

    // Trier par indice décroissant et attribuer les rangs
    const resultats = usages
      .sort((a, b) => b.indiceMutabilite - a.indiceMutabilite)
      .map((usage, index) => ({
        ...usage,
        rang: index + 1,
      }));

    return {
      fiabilite: this.formatFiabilite(fiabilite),
      resultats,
    };
  }

  private calculateResidentielMixte(
    parcelle: Parcelle,
  ): Omit<UsageResultDto, 'rang'> {
    let score = 50; // Base

    // Facteurs positifs
    if (parcelle.siteEnCentreVille) score += 15;
    if (
      parcelle.distanceTransportCommun &&
      parcelle.distanceTransportCommun < 500
    )
      score += 10;
    if (parcelle.proximiteCommercesServices) score += 8;
    if (parcelle.connectionReseauElectricite) score += 5;
    if (parcelle.tauxLogementsVacants && parcelle.tauxLogementsVacants < 8)
      score += 7;

    // Facteurs négatifs
    if (parcelle.presenceRisquesTechnologiques) score -= 15;
    if (parcelle.presencePollution === 'Oui') score -= 12;
    if (parcelle.terrainEnPente) score -= 8;

    const indice = Math.max(0, Math.min(100, score));

    return {
      usage: 'Logement et commerces de proximité',
      indiceMutabilite: indice,
      potentiel: this.getPotentielFromScore(indice),
      explication: this.getExplicationResidentiel(parcelle, indice),
    };
  }

  private calculateEquipementsPublics(
    parcelle: Parcelle,
  ): Omit<UsageResultDto, 'rang'> {
    let score = 45;

    if (parcelle.siteEnCentreVille) score += 12;
    if (
      parcelle.distanceTransportCommun &&
      parcelle.distanceTransportCommun < 800
    )
      score += 10;
    if (parcelle.surfaceSite && parcelle.surfaceSite > 5000) score += 8;
    if (parcelle.connectionReseauElectricite) score += 6;

    if (parcelle.presenceRisquesTechnologiques) score -= 10;
    if (parcelle.presencePollution === 'Oui') score -= 8;

    const indice = Math.max(0, Math.min(100, score));

    return {
      usage: 'Équipements publics',
      indiceMutabilite: indice,
      potentiel: this.getPotentielFromScore(indice),
      explication:
        'Bonne accessibilité et services proches ; quelques travaux de dépollution ou de remise à niveau des bâtiments seront toutefois nécessaires.',
    };
  }

  private calculateTertiaire(parcelle: Parcelle): Omit<UsageResultDto, 'rang'> {
    let score = 40;

    if (parcelle.distanceAutoroute && parcelle.distanceAutoroute < 2)
      score += 12;
    if (
      parcelle.distanceTransportCommun &&
      parcelle.distanceTransportCommun < 1000
    )
      score += 8;
    if (parcelle.surfaceSite && parcelle.surfaceSite > 3000) score += 10;
    if (parcelle.connectionReseauElectricite) score += 8;

    if (parcelle.terrainEnPente) score -= 10;
    if (parcelle.presencePollution === 'Oui') score -= 8;

    const indice = Math.max(0, Math.min(100, score));

    return {
      usage: 'Bureaux',
      indiceMutabilite: indice,
      potentiel: this.getPotentielFromScore(indice),
      explication:
        "Accessibilité routière moyenne et surfaces limitées pourraient restreindre l'attractivité pour des activités tertiaires.",
    };
  }

  private calculateCultureTourisme(
    parcelle: Parcelle,
  ): Omit<UsageResultDto, 'rang'> {
    let score = 35;

    if (parcelle.valeurArchitecturaleHistorique === 'Exceptionnel') score += 20;
    if (parcelle.valeurArchitecturaleHistorique === 'Remarquable') score += 15;
    if (parcelle.siteEnCentreVille) score += 10;
    if (
      parcelle.distanceTransportCommun &&
      parcelle.distanceTransportCommun < 500
    )
      score += 8;

    if (parcelle.presenceRisquesTechnologiques) score -= 12;

    const indice = Math.max(0, Math.min(100, score));

    return {
      usage: 'Equipements culturels et touristiques',
      indiceMutabilite: indice,
      potentiel: this.getPotentielFromScore(indice),
      explication:
        'Localisation intéressante pour des activités culturelles mais nécessite des aménagements spécifiques.',
    };
  }

  private calculateIndustrie(parcelle: Parcelle): Omit<UsageResultDto, 'rang'> {
    let score = 30;

    if (parcelle.distanceAutoroute && parcelle.distanceAutoroute < 3)
      score += 15;
    if (parcelle.surfaceSite && parcelle.surfaceSite > 10000) score += 12;
    if (parcelle.connectionReseauElectricite) score += 10;
    if (!parcelle.siteEnCentreVille) score += 8; // Avantage d'être en périphérie

    if (parcelle.presenceRisquesTechnologiques) score -= 10;
    if (parcelle.presencePollution === 'Oui') score -= 5; // Moins pénalisant pour l'industrie

    const indice = Math.max(0, Math.min(100, score));

    return {
      usage: 'Bâtiments industriels',
      indiceMutabilite: indice,
      potentiel: this.getPotentielFromScore(indice),
      explication:
        "Site adapté pour de l'industrie légère mais contraintes environnementales à considérer.",
    };
  }

  private calculatePhotovoltaique(
    parcelle: Parcelle,
  ): Omit<UsageResultDto, 'rang'> {
    let score = 25;

    if (parcelle.surfaceSite && parcelle.surfaceSite > 20000) score += 15;
    if (
      parcelle.distanceRaccordementElectrique &&
      parcelle.distanceRaccordementElectrique < 1
    )
      score += 12;
    if (!parcelle.terrainEnPente) score += 10;
    if (parcelle.couvertVegetal === 'Imperméabilisé') score += 8;

    if (parcelle.presenceEspeceProtegee) score -= 15;
    if (parcelle.zonagePatrimonial !== ZonagePatrimonial.NON_CONCERNE)
      score -= 10;

    const indice = Math.max(0, Math.min(100, score));

    return {
      usage: 'Centrale photovoltaïque au sol',
      indiceMutabilite: indice,
      potentiel: this.getPotentielFromScore(indice),
      explication:
        "Surface disponible mais contraintes d'accès et de raccordement électrique.",
    };
  }

  private calculateRenaturation(
    parcelle: Parcelle,
  ): Omit<UsageResultDto, 'rang'> {
    let score = 20;

    if (parcelle.presenceEspeceProtegee) score += 15;
    if (parcelle.trameVerteEtBleue === TrameVerteEtBleue.CORRIDOR_ECOLOGIQUE)
      score += 12;
    if (parcelle.trameVerteEtBleue === TrameVerteEtBleue.RESERVOIR_BIODIVERSITE)
      score += 15;
    if (parcelle.voieEauProximite) score += 10;

    if (parcelle.presencePollution === 'Oui') score -= 20; // Très pénalisant
    if (parcelle.presenceRisquesTechnologiques) score -= 15;

    const indice = Math.max(0, Math.min(100, score));

    return {
      usage: 'Espace renaturé',
      indiceMutabilite: indice,
      potentiel: this.getPotentielFromScore(indice),
      explication:
        'Renaturation possible mais nécessite des investissements importants de dépollution.',
    };
  }

  private getPotentielFromScore(score: number): UsageResultDto['potentiel'] {
    if (score >= 75) return 'Très favorable';
    if (score >= 60) return 'Favorable';
    if (score >= 40) return 'Modéré';
    if (score >= 20) return 'Peu favorable';
    return 'Défavorable';
  }

  private getExplicationResidentiel(parcelle: Parcelle, score: number): string {
    const facteurs: string[] = [];

    if (parcelle.siteEnCentreVille) facteurs.push('emplacement central');
    if (parcelle.proximiteCommercesServices) facteurs.push('commerces proches');
    if (parcelle.connectionReseauElectricite) facteurs.push('réseaux en place');
    if (parcelle.presencePollution !== 'Oui')
      facteurs.push('absence de pollution majeure');

    if (score >= 60) {
      return `${facteurs.join(', ')} font que ce site semble adapté pour un programme mixte logements-commerces.`;
    } else {
      return 'Site présentant quelques contraintes pour un usage résidentiel.';
    }
  }

  private formatFiabilite(note: number): MutabilityResultDto['fiabilite'] {
    let text: string;
    let description: string;

    if (note >= 9) {
      text = 'Très fiable';
      description =
        'Les données sont suffisamment précises pour une analyse robuste.';
    } else if (note >= 7) {
      text = 'Fiable';
      description =
        'Les données permettent une analyse correcte avec quelques incertitudes.';
    } else if (note >= 5) {
      text = 'Modérément fiable';
      description =
        'Certaines données manquent, les résultats sont à interpréter avec prudence.';
    } else {
      text = 'Peu fiable';
      description = 'Données insuffisantes, analyse approximative uniquement.';
    }

    return { note, text, description };
  }
}
