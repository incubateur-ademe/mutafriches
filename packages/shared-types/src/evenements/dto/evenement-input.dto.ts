import { TypeEvenement, ContexteEvenement } from "../enums";
import { UsageType } from "../../evaluation/enums";

/**
 * Structure typee du champ donnees des evenements
 */
export interface EvenementDonnees {
  /** Page courante (pathname), doit commencer par / */
  page?: string;
  /** Contexte de declenchement de l'evenement */
  contexte?: ContexteEvenement | string;
  /** Feedback: l'utilisateur trouve le resultat pertinent */
  pertinent?: boolean;
  /** Feedback: commentaire libre */
  commentaire?: string;
  /** Usage concerne pour les interets */
  usageConcerne?: UsageType | string;
  /** Nombre de champs saisis dans les donnees complementaires */
  nombreChampsSaisis?: number;
  /** Nombre de parcelles dans la sélection au moment de l'événement */
  nombreParcelles?: number;
  /** Surface cumulée du site en m² au moment de l'événement */
  surfaceTotaleM2?: number;
}

export interface EvenementInputDto {
  typeEvenement: TypeEvenement;
  evaluationId?: string;
  identifiantCadastral?: string;
  donnees?: EvenementDonnees;
  sessionId?: string;
  sourceUtilisation?: string;
  ref?: string;
  integrateur?: string;
}

export interface FeedbackPertinenceDto extends EvenementInputDto {
  typeEvenement: TypeEvenement.FEEDBACK_PERTINENCE_CLASSEMENT;
  donnees: {
    pertinent: boolean;
    commentaire?: string;
  };
}

export interface InteretMultiParcellesDto extends EvenementInputDto {
  typeEvenement: TypeEvenement.INTERET_MULTI_PARCELLES;
  donnees?: {
    contexte?: ContexteEvenement | string;
  };
}

export interface InteretMiseEnRelationDto extends EvenementInputDto {
  typeEvenement: TypeEvenement.INTERET_MISE_EN_RELATION;
  donnees?: {
    usageConcerne?: UsageType | string;
    contexte?: ContexteEvenement | string;
  };
}

export interface InteretExportResultatsDto extends EvenementInputDto {
  typeEvenement: TypeEvenement.INTERET_EXPORT_RESULTATS;
  donnees?: {
    usageConcerne?: UsageType | string;
    contexte?: ContexteEvenement | string;
  };
}
