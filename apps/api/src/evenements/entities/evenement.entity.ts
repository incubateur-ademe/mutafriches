// Classe pour représenter un événement utilisateur
export class EvenementUtilisateur {
  id: string;
  typeEvenement: string;
  evaluationId?: string;
  identifiantCadastral?: string;
  donnees?: Record<string, unknown>;
  dateCreation: Date;
  sourceUtilisation?: string;
  ref?: string;
  integrateur?: string;
  userAgent?: string;
  sessionId?: string;

  constructor(data: {
    id: string;
    typeEvenement: string;
    evaluationId?: string;
    identifiantCadastral?: string;
    donnees?: Record<string, unknown>;
    dateCreation: Date;
    sourceUtilisation?: string;
    ref?: string;
    integrateur?: string;
    userAgent?: string;
    sessionId?: string;
  }) {
    Object.assign(this, data);
  }
}
