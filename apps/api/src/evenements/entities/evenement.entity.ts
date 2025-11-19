import { ModeUtilisation, TypeEvenement } from "@mutafriches/shared-types";

// Classe pour représenter un événement utilisateur
export class EvenementUtilisateur {
  id: string;
  typeEvenement: TypeEvenement;
  evaluationId?: string;
  identifiantCadastral?: string;
  donnees?: Record<string, unknown>;
  dateCreation: Date;
  sourceUtilisation?: string;
  modeUtilisation?: ModeUtilisation;
  ref?: string;
  integrateur?: string;
  userAgent?: string;
  sessionId?: string;

  constructor(data: {
    id: string;
    typeEvenement: TypeEvenement;
    evaluationId?: string;
    identifiantCadastral?: string;
    donnees?: Record<string, unknown>;
    dateCreation: Date;
    sourceUtilisation?: string;
    modeUtilisation?: ModeUtilisation;
    ref?: string;
    integrateur?: string;
    userAgent?: string;
    sessionId?: string;
  }) {
    Object.assign(this, data);
  }
}
