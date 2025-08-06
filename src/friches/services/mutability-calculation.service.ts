import { Injectable } from '@nestjs/common';
import { MutabilityInputDto } from '../dto/mutability-input.dto';
import { MutabilityResultDto } from '../dto/mutability-result.dto';
import {
  PresencePollution,
  TrameVerteEtBleue,
  ValeurArchitecturale,
  ZonagePatrimonial,
} from '../enums/parcelle.enums';
import { IMutabilityService } from '../interfaces/mutability-service.interface';
import { UsageResultDto } from '../dto/usage-result.dto';

@Injectable()
export class MutabilityCalculationService implements IMutabilityService {
  /**
   * Calcule les indices de mutabilité à partir d'un DTO (méthode principale)
   */
  calculateMutability(
    input: MutabilityInputDto,
    fiabilite?: number,
  ): MutabilityResultDto {
    const calculatedFiabilite = fiabilite ?? input.fiabilite ?? 7; // Valeur par défaut

    const usages = [
      this.calculateResidentielMixte(input),
      this.calculateEquipementsPublics(input),
      this.calculateTertiaire(input),
      this.calculateCultureTourisme(input),
      this.calculateIndustrie(input),
      this.calculatePhotovoltaique(input),
      this.calculateRenaturation(input),
    ];

    // Trier par indice décroissant et attribuer les rangs
    const resultats = usages
      .sort((a, b) => b.indiceMutabilite - a.indiceMutabilite)
      .map((usage, index) => ({
        ...usage,
        rang: index + 1,
      }));

    return {
      fiabilite: this.formatFiabilite(calculatedFiabilite),
      resultats,
    };
  }

  private calculateResidentielMixte(
    input: MutabilityInputDto,
  ): Omit<UsageResultDto, 'rang'> {
    let score = 50; // Base

    // Facteurs positifs
    if (input.siteEnCentreVille) score += 15;
    if (input.distanceTransportCommun && input.distanceTransportCommun < 500)
      score += 10;
    if (input.proximiteCommercesServices) score += 8;
    if (input.connectionReseauElectricite) score += 5;
    if (input.tauxLogementsVacants && input.tauxLogementsVacants < 8)
      score += 7;

    // Facteurs négatifs
    if (input.presenceRisquesTechnologiques) score -= 15;
    if (input.presencePollution === PresencePollution.OUI_AUTRES_COMPOSES)
      score -= 12;

    const indice = Math.max(0, Math.min(100, score));

    return {
      usage: 'Logement et commerces de proximité',
      indiceMutabilite: indice,
      potentiel: this.getPotentielFromScore(indice),
      explication: this.getExplicationResidentiel(input, indice),
    };
  }

  private calculateEquipementsPublics(
    input: MutabilityInputDto,
  ): Omit<UsageResultDto, 'rang'> {
    let score = 45;

    // Facteurs positifs
    if (input.siteEnCentreVille) score += 12;
    if (input.distanceTransportCommun && input.distanceTransportCommun < 800)
      score += 10;
    if (input.surfaceSite && input.surfaceSite > 5000) score += 8;
    if (input.connectionReseauElectricite) score += 6;

    // Facteurs négatifs
    if (input.presenceRisquesTechnologiques) score -= 10;
    if (input.presencePollution === PresencePollution.OUI_AUTRES_COMPOSES)
      score -= 8;

    const indice = Math.max(0, Math.min(100, score));

    return {
      usage: 'Équipements publics',
      indiceMutabilite: indice,
      potentiel: this.getPotentielFromScore(indice),
      explication: this.getExplicationEquipementsPublics(input, indice),
    };
  }

  private calculateTertiaire(
    input: MutabilityInputDto,
  ): Omit<UsageResultDto, 'rang'> {
    let score = 40;

    // Facteurs positifs
    if (input.distanceAutoroute && input.distanceAutoroute < 2) score += 12;
    if (input.distanceTransportCommun && input.distanceTransportCommun < 1000)
      score += 8;
    if (input.surfaceSite && input.surfaceSite > 3000) score += 10;
    if (input.connectionReseauElectricite) score += 8;

    // Facteurs négatifs
    if (input.presencePollution === PresencePollution.OUI_AUTRES_COMPOSES)
      score -= 8;

    const indice = Math.max(0, Math.min(100, score));

    return {
      usage: 'Bureaux',
      indiceMutabilite: indice,
      potentiel: this.getPotentielFromScore(indice),
      explication: this.getExplicationTertiaire(input),
    };
  }

  private calculateCultureTourisme(
    input: MutabilityInputDto,
  ): Omit<UsageResultDto, 'rang'> {
    let score = 35;

    // Facteurs positifs
    if (
      input.valeurArchitecturaleHistorique === ValeurArchitecturale.EXCEPTIONNEL
    )
      score += 20;
    if (
      input.valeurArchitecturaleHistorique ===
      ValeurArchitecturale.BANAL_INFRA_ORDINAIRE
    )
      score += 15;
    if (input.siteEnCentreVille) score += 10;
    if (input.distanceTransportCommun && input.distanceTransportCommun < 500)
      score += 8;

    // Facteurs négatifs
    if (input.presenceRisquesTechnologiques) score -= 12;

    const indice = Math.max(0, Math.min(100, score));

    return {
      usage: 'Equipements culturels et touristiques',
      indiceMutabilite: indice,
      potentiel: this.getPotentielFromScore(indice),
      explication: this.getExplicationCultureTourisme(input, indice),
    };
  }

  private calculateIndustrie(
    input: MutabilityInputDto,
  ): Omit<UsageResultDto, 'rang'> {
    let score = 30;

    // Facteurs positifs
    if (input.distanceAutoroute && input.distanceAutoroute < 3) score += 15;
    if (input.surfaceSite && input.surfaceSite > 10000) score += 12;
    if (input.connectionReseauElectricite) score += 10;
    if (!input.siteEnCentreVille) score += 8; // Avantage d'être en périphérie

    // Facteurs négatifs
    if (input.presenceRisquesTechnologiques) score -= 10;
    if (input.presencePollution === PresencePollution.OUI_AUTRES_COMPOSES)
      score -= 5; // Moins pénalisant pour l'industrie

    const indice = Math.max(0, Math.min(100, score));

    return {
      usage: 'Bâtiments industriels',
      indiceMutabilite: indice,
      potentiel: this.getPotentielFromScore(indice),
      explication: this.getExplicationIndustrie(input, indice),
    };
  }

  private calculatePhotovoltaique(
    input: MutabilityInputDto,
  ): Omit<UsageResultDto, 'rang'> {
    let score = 25;

    // Facteurs positifs
    if (input.surfaceSite && input.surfaceSite > 20000) score += 15;
    if (
      input.distanceRaccordementElectrique &&
      input.distanceRaccordementElectrique < 1
    )
      score += 12;

    // Facteurs négatifs
    if (input.zonagePatrimonial !== ZonagePatrimonial.NON_CONCERNE) score -= 10;

    const indice = Math.max(0, Math.min(100, score));

    return {
      usage: 'Centrale photovoltaïque au sol',
      indiceMutabilite: indice,
      potentiel: this.getPotentielFromScore(indice),
      explication: this.getExplicationPhotovoltaique(input, indice),
    };
  }

  private calculateRenaturation(
    input: MutabilityInputDto,
  ): Omit<UsageResultDto, 'rang'> {
    let score = 20;

    // Facteurs positifs
    if (input.trameVerteEtBleue === TrameVerteEtBleue.CORRIDOR_ECOLOGIQUE)
      score += 12;
    if (input.trameVerteEtBleue === TrameVerteEtBleue.RESERVOIR_BIODIVERSITE)
      score += 15;

    // Facteurs négatifs
    if (input.presenceRisquesTechnologiques) score -= 15;

    const indice = Math.max(0, Math.min(100, score));

    return {
      usage: 'Espace renaturé',
      indiceMutabilite: indice,
      potentiel: this.getPotentielFromScore(indice),
      explication: this.getExplicationRenaturation(input, indice),
    };
  }

  private getPotentielFromScore(score: number): UsageResultDto['potentiel'] {
    if (score >= 75) return 'Très favorable';
    if (score >= 60) return 'Favorable';
    if (score >= 40) return 'Modéré';
    if (score >= 20) return 'Peu favorable';
    return 'Défavorable';
  }

  private getExplicationResidentiel(
    input: MutabilityInputDto,
    score: number,
  ): string {
    const facteurs: string[] = [];

    if (input.siteEnCentreVille) facteurs.push('emplacement central');
    if (input.proximiteCommercesServices) facteurs.push('commerces proches');
    if (input.connectionReseauElectricite) facteurs.push('réseaux en place');
    if (input.presencePollution !== PresencePollution.OUI_AUTRES_COMPOSES)
      facteurs.push('absence de pollution majeure');

    if (score >= 60) {
      return `${facteurs.join(', ')} font que ce site semble adapté pour un programme mixte logements-commerces.`;
    } else {
      return 'Site présentant quelques contraintes pour un usage résidentiel.';
    }
  }

  private getExplicationEquipementsPublics(
    input: MutabilityInputDto,
    score: number,
  ): string {
    const facteurs: string[] = [];

    if (input.siteEnCentreVille) facteurs.push('localisation centrale');
    if (input.distanceTransportCommun && input.distanceTransportCommun < 800)
      facteurs.push('transports accessibles');
    if (input.surfaceSite && input.surfaceSite > 5000)
      facteurs.push('surface suffisante');

    if (score >= 60) {
      return `Bonne accessibilité et ${facteurs.join(', ')} favorisent l'implantation d'équipements publics.`;
    } else {
      return 'Bonne accessibilité et services proches ; quelques travaux de dépollution ou de remise à niveau des bâtiments seront toutefois nécessaires.';
    }
  }

  private getExplicationTertiaire(input: MutabilityInputDto): string {
    const contraintes: string[] = [];

    if (input.distanceAutoroute && input.distanceAutoroute >= 2)
      contraintes.push('éloignement des axes routiers');
    if (input.surfaceSite && input.surfaceSite <= 3000)
      contraintes.push('surfaces limitées');

    if (contraintes.length > 0) {
      return `${contraintes.join(' et ')} pourraient restreindre l'attractivité pour des activités tertiaires.`;
    } else {
      return 'Site bien positionné pour des activités tertiaires avec une bonne accessibilité.';
    }
  }

  private getExplicationCultureTourisme(
    input: MutabilityInputDto,
    score: number,
  ): string {
    if (
      input.valeurArchitecturaleHistorique ===
        ValeurArchitecturale.EXCEPTIONNEL ||
      input.valeurArchitecturaleHistorique === ValeurArchitecturale.INTERET_FORT
    ) {
      return 'Valeur patrimoniale remarquable qui constitue un atout majeur pour des activités culturelles et touristiques.';
    } else if (score >= 50) {
      return 'Localisation intéressante pour des activités culturelles avec une bonne accessibilité.';
    } else {
      return 'Localisation intéressante pour des activités culturelles mais nécessite des aménagements spécifiques.';
    }
  }

  private getExplicationIndustrie(
    input: MutabilityInputDto,
    score: number,
  ): string {
    const atouts: string[] = [];

    if (input.distanceAutoroute && input.distanceAutoroute < 3)
      atouts.push('proximité des axes routiers');
    if (input.surfaceSite && input.surfaceSite > 10000)
      atouts.push('superficie importante');
    if (!input.siteEnCentreVille) atouts.push('localisation périphérique');

    if (score >= 50) {
      return `Site favorable à l'industrie avec ${atouts.join(', ')}.`;
    } else {
      return "Site adapté pour de l'industrie légère mais contraintes environnementales à considérer.";
    }
  }

  private getExplicationPhotovoltaique(
    input: MutabilityInputDto,
    score: number,
  ): string {
    if (input.surfaceSite && input.surfaceSite > 20000) {
      return "Grande surface disponible favorable au déploiement d'une centrale photovoltaïque.";
    } else if (score >= 40) {
      return 'Site potentiellement intéressant pour le photovoltaïque avec quelques aménagements.';
    } else {
      return "Surface disponible mais contraintes d'accès et de raccordement électrique.";
    }
  }

  private getExplicationRenaturation(
    input: MutabilityInputDto,
    score: number,
  ): string {
    if (input.presencePollution === PresencePollution.OUI_AUTRES_COMPOSES) {
      return 'Renaturation possible mais nécessite des investissements importants de dépollution.';
    } else if (input.trameVerteEtBleue !== TrameVerteEtBleue.HORS_TRAME) {
      return 'Site présentant un fort potentiel écologique pour la renaturation.';
    } else if (score >= 40) {
      return 'Potentiel de renaturation intéressant avec restauration de la biodiversité locale.';
    } else {
      return 'Potentiel de renaturation limité, nécessite une étude environnementale approfondie.';
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
