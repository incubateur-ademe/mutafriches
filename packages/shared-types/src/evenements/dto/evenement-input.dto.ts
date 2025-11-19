import { TypeEvenement } from "../enums";

export interface EvenementInputDto {
  typeEvenement: TypeEvenement;
  evaluationId?: string;
  identifiantCadastral?: string;
  donnees?: Record<string, unknown>;
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
    contexte?: string;
  };
}

export interface InteretMiseEnRelationDto extends EvenementInputDto {
  typeEvenement: TypeEvenement.INTERET_MISE_EN_RELATION;
  donnees?: {
    usageConcerne?: string;
    contexte?: string;
  };
}

export interface InteretExportResultatsDto extends EvenementInputDto {
  typeEvenement: TypeEvenement.INTERET_EXPORT_RESULTATS;
  donnees?: {
    usageConcerne?: string;
    contexte?: string;
  };
}
