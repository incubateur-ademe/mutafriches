import { Injectable } from "@nestjs/common";
import { MutabilityInputDto } from "src/friches/dto/mutability-input.dto";
import { MutabilityResultDto } from "src/friches/dto/mutability-result.dto";
import { UsageType } from "src/friches/enums/mutability.enums";
import { PresencePollution } from "src/friches/enums/parcelle.enums";
import { IMutabilityService } from "src/friches/interfaces/mutability-service.interface";

@Injectable()
export class MockMutabilityService implements IMutabilityService {
  /**
   * Calcule les indices de mutabilité à partir d'un DTO (implémentation mock)
   */
  calculateMutability(input: MutabilityInputDto, fiabilite?: number): MutabilityResultDto {
    // Si on reconnaît un identifiant de parcelle spécifique, on retourne des données prédéfinies
    if (input.identifiantParcelle) {
      const mockResult = this.getMockResultByParcelle(input.identifiantParcelle);
      if (mockResult) {
        // Si une fiabilité est fournie, on l'utilise à la place de celle du mock
        if (fiabilite !== undefined) {
          return {
            ...mockResult,
            fiabilite: this.formatFiabilite(fiabilite),
          };
        }
        return mockResult;
      }
    }

    // Sinon, on fait un calcul simplifié basé sur les données d'entrée
    return this.calculateFromInput(input, fiabilite);
  }

  /**
   * Retourne des résultats mockés basés sur l'identifiant de parcelle
   */
  private getMockResultByParcelle(identifiantParcelle: string): MutabilityResultDto | null {
    switch (identifiantParcelle) {
      case "490007000ZE0153": // Trélazé
        return this.getTrelazeResults();
      case "490007000AB0001": // Angers
      case "490007000CD0042": // Saumur
        return this.getSaumurResults();
      default:
        return null;
    }
  }

  /**
   * Calcul simplifié basé sur les données d'entrée
   */
  private calculateFromInput(input: MutabilityInputDto, fiabilite?: number): MutabilityResultDto {
    const calculatedFiabilite = fiabilite ?? input.fiabilite ?? 7;

    // Calcul simplifié pour les mocks
    let baseScore = 50;

    // Facteurs positifs simples
    if (input.siteEnCentreVille) baseScore += 10;
    if (input.proximiteCommercesServices) baseScore += 8;
    if (input.connectionReseauElectricite) baseScore += 5;
    if (input.distanceTransportCommun && input.distanceTransportCommun < 500) baseScore += 8;

    // Facteurs négatifs simples
    if (input.presencePollution === PresencePollution.OUI_AUTRES_COMPOSES) baseScore -= 15;
    if (input.presenceRisquesTechnologiques) baseScore -= 12;

    const finalScore = Math.max(20, Math.min(100, baseScore));

    return {
      fiabilite: this.formatFiabilite(calculatedFiabilite),
      resultats: [
        {
          rang: 1,
          usage: UsageType.RESIDENTIEL,
          indiceMutabilite: finalScore,
          // potentiel: this.getPotentielFromScore(finalScore),
          // explication: this.getSimpleExplication(input, finalScore),
          avantages: 6,
          contraintes: 0,
        },
        {
          rang: 2,
          usage: UsageType.EQUIPEMENTS,
          indiceMutabilite: Math.max(20, finalScore - 5),
          // potentiel: this.getPotentielFromScore(finalScore - 5),
          // explication:
          //   'Évaluation basée sur les données fournies (mode développement).',
          avantages: 6,
          contraintes: 0,
        },
        {
          rang: 3,
          usage: UsageType.TERTIAIRE,
          indiceMutabilite: Math.max(20, finalScore - 10),
          // potentiel: this.getPotentielFromScore(finalScore - 10),
          // explication:
          //   'Évaluation basée sur les données fournies (mode développement).',
          avantages: 6,
          contraintes: 0,
        },
        {
          rang: 4,
          usage: UsageType.CULTURE,
          indiceMutabilite: Math.max(20, finalScore - 15),
          // potentiel: this.getPotentielFromScore(finalScore - 15),
          // explication:
          //   'Évaluation basée sur les données fournies (mode développement).',
          avantages: 6,
          contraintes: 0,
        },
        {
          rang: 5,
          usage: UsageType.INDUSTRIE,
          indiceMutabilite: Math.max(20, finalScore - 20),
          // potentiel: this.getPotentielFromScore(finalScore - 20),
          // explication:
          //   'Évaluation basée sur les données fournies (mode développement).',
          avantages: 6,
          contraintes: 0,
        },
        {
          rang: 6,
          usage: UsageType.PHOTOVOLTAIQUE,
          indiceMutabilite: Math.max(20, finalScore - 25),
          // potentiel: this.getPotentielFromScore(finalScore - 25),
          // explication:
          //   'Évaluation basée sur les données fournies (mode développement).',
          avantages: 6,
          contraintes: 0,
        },
        {
          rang: 7,
          usage: UsageType.RENATURATION,
          indiceMutabilite: Math.max(20, finalScore - 30),
          avantages: 6,
          contraintes: 0,
          // potentiel: this.getPotentielFromScore(finalScore - 30),
          // explication:
          //   'Évaluation basée sur les données fournies (mode développement).',
        },
      ],
    };
  }

  private getSimpleExplication(input: MutabilityInputDto, score: number): string {
    const facteurs: string[] = [];

    if (input.siteEnCentreVille) facteurs.push("emplacement central");
    if (input.proximiteCommercesServices) facteurs.push("commerces proches");
    if (input.connectionReseauElectricite) facteurs.push("réseaux en place");
    if (input.presencePollution !== PresencePollution.OUI_AUTRES_COMPOSES)
      facteurs.push("absence de pollution majeure");

    if (score >= 60) {
      return `${facteurs.length > 0 ? facteurs.join(", ") + " font que ce" : "Ce"} site semble adapté pour un programme mixte logements-commerces (évaluation simplifiée).`;
    } else {
      return "Site présentant quelques contraintes pour un usage résidentiel (évaluation simplifiée).";
    }
  }

  private getPotentielFromScore(
    score: number,
  ): "Très favorable" | "Favorable" | "Modéré" | "Peu favorable" | "Défavorable" {
    if (score >= 75) return "Très favorable";
    if (score >= 60) return "Favorable";
    if (score >= 40) return "Modéré";
    if (score >= 20) return "Peu favorable";
    return "Défavorable";
  }

  private formatFiabilite(note: number): MutabilityResultDto["fiabilite"] {
    let text: string;
    let description: string;

    if (note >= 9) {
      text = "Très fiable";
      description = "Les données sont suffisamment précises pour une analyse robuste.";
    } else if (note >= 7) {
      text = "Fiable";
      description = "Les données permettent une analyse correcte avec quelques incertitudes.";
    } else if (note >= 5) {
      text = "Modérément fiable";
      description = "Certaines données manquent, les résultats sont à interpréter avec prudence.";
    } else {
      text = "Peu fiable";
      description = "Données insuffisantes, analyse approximative uniquement.";
    }

    return { note, text, description };
  }

  private getTrelazeResults(): MutabilityResultDto {
    return {
      fiabilite: {
        note: 9.5,
        text: "Très fiable",
        description: "Les données sont suffisamment précises pour une analyse robuste.",
      },
      resultats: [
        {
          rang: 1,
          usage: UsageType.RESIDENTIEL,
          avantages: 6,
          contraintes: 0,
          // explication:
          //   'Emplacement central, réseaux déjà en place et absence de pollution majeure font que ce site semble adapté pour un programme mixte logements-commerces.',
          indiceMutabilite: 68,
          // potentiel: 'Favorable',
        },
        {
          rang: 2,
          usage: UsageType.EQUIPEMENTS,
          avantages: 6,
          contraintes: 0,
          // explication:
          //   'Bonne accessibilité et services proches ; quelques travaux de dépollution ou de remise à niveau des bâtiments seront toutefois nécessaires.',
          indiceMutabilite: 63,
          // potentiel: 'Favorable',
        },
        {
          rang: 3,
          usage: UsageType.TERTIAIRE,
          avantages: 6,
          contraintes: 0,
          // explication:
          //   "Accessibilité routière moyenne et surfaces limitées pourraient restreindre l'attractivité pour des activités tertiaires.",
          indiceMutabilite: 60,
          // potentiel: 'Modéré',
        },
        {
          rang: 4,
          usage: UsageType.CULTURE,
          avantages: 6,
          contraintes: 0,
          // explication:
          //   'Localisation intéressante pour des activités culturelles mais nécessite des aménagements spécifiques.',
          indiceMutabilite: 56,
          // potentiel: 'Modéré',
        },
        {
          rang: 5,
          usage: UsageType.INDUSTRIE,
          avantages: 6,
          contraintes: 0,
          // explication:
          //   "Site adapté pour de l'industrie légère mais contraintes environnementales à considérer.",
          indiceMutabilite: 54,
          // potentiel: 'Modéré',
        },
        {
          rang: 6,
          usage: UsageType.PHOTOVOLTAIQUE,
          avantages: 6,
          contraintes: 0,
          // explication:
          //   "Surface disponible mais contraintes d'accès et de raccordement électrique.",
          indiceMutabilite: 47,
          // potentiel: 'Peu favorable',
        },
        {
          rang: 7,
          usage: UsageType.RENATURATION,
          avantages: 6,
          contraintes: 0,
          // explication:
          //   'Renaturation possible mais nécessite des investissements importants de dépollution.',
          indiceMutabilite: 41,
          // potentiel: 'Peu favorable',
        },
      ],
    };
  }

  private getSaumurResults(): MutabilityResultDto {
    return {
      fiabilite: {
        note: 6.2,
        text: "Modérément fiable",
        description: "Certaines données manquent, les résultats sont à interpréter avec prudence.",
      },
      resultats: [
        {
          rang: 1,
          usage: UsageType.RENATURATION,
          indiceMutabilite: 78,
          avantages: 6,
          contraintes: 0,
        },
        {
          rang: 2,
          usage: UsageType.CULTURE,
          indiceMutabilite: 71,
          avantages: 6,
          contraintes: 0,
        },
        {
          rang: 3,
          indiceMutabilite: 45,
          usage: UsageType.PHOTOVOLTAIQUE,
          avantages: 6,
          contraintes: 0,
        },
        {
          rang: 4,
          indiceMutabilite: 38,
          usage: UsageType.EQUIPEMENTS,
          avantages: 6,
          contraintes: 0,
        },
        {
          rang: 5,
          indiceMutabilite: 32,
          usage: UsageType.RESIDENTIEL,
          avantages: 6,
          contraintes: 0,
        },
        {
          rang: 6,
          usage: UsageType.TERTIAIRE,
          indiceMutabilite: 25,
          avantages: 6,
          contraintes: 0,
        },
        {
          rang: 7,
          usage: UsageType.INDUSTRIE,
          indiceMutabilite: 18,
          avantages: 6,
          contraintes: 0,
        },
      ],
    };
  }
}
