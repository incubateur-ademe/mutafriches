import { ModeUtilisation, TypeEvenement, EvenementDonnees } from "@mutafriches/shared-types";

// Classe pour representer un evenement utilisateur
export class EvenementUtilisateur {
  id: string;
  typeEvenement: TypeEvenement;
  evaluationId?: string;
  identifiantCadastral?: string;
  donnees?: EvenementDonnees;
  dateCreation: Date;
  sourceCampagne?: string;
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
    donnees?: EvenementDonnees;
    dateCreation: Date;
    sourceCampagne?: string;
    modeUtilisation?: ModeUtilisation;
    ref?: string;
    integrateur?: string;
    userAgent?: string;
    sessionId?: string;
  }) {
    Object.assign(this, data);
  }
}
