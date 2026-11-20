import {
  CANAUX_AVEC_DOMAINE,
  CanalIntegrateur,
  StatutIntegrateur,
  type DeclarationIntegrateurInput,
  type DeclarationIntegrateurOutput,
  type TrancheNbSites,
  type TypeStructure,
} from "@mutafriches/shared-types";

export const CONTACT_MUTAFRICHES = "contact@mutafriches.beta.gouv.fr";

// Saisie du formulaire : tout est texte tant que rien n'est validé.
export interface SaisieDeclaration {
  structure: string;
  typeStructure: TypeStructure | "";
  email: string;
  domaine: string;
  departement: string;
  nbSitesEstime: TrancheNbSites | "";
  // Champ piège, invisible : seul un robot le remplit.
  telephone: string;
}

export const SAISIE_VIDE: SaisieDeclaration = {
  structure: "",
  typeStructure: "",
  email: "",
  domaine: "",
  departement: "",
  nbSitesEstime: "",
  telephone: "",
};

export type ChampDeclaration = "structure" | "typeStructure" | "email" | "domaine" | "departement";
export type ErreursDeclaration = Partial<Record<ChampDeclaration, string>>;

const FORMAT_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const FORMAT_DEPARTEMENT = /^(\d{2,3}|2[ABab])$/;

export const LIBELLE_DOMAINE: Record<CanalIntegrateur, { label: string; aide: string }> = {
  [CanalIntegrateur.API]: {
    label: "Domaine de votre service",
    aide: "Le domaine depuis lequel partent vos appels, par exemple mon-service.gouv.fr",
  },
  [CanalIntegrateur.QGIS]: {
    label: "Domaine de votre structure",
    aide: "Par exemple ma-collectivite.fr",
  },
  [CanalIntegrateur.IFRAME]: {
    label: "Domaine du site qui affichera Mutafriches",
    aide: "Par exemple mon-service.gouv.fr",
  },
  [CanalIntegrateur.PAGE]: { label: "", aide: "" },
};

export function demandeUnDomaine(canal: CanalIntegrateur): boolean {
  return CANAUX_AVEC_DOMAINE.includes(canal);
}

// Contrôle avant envoi. Le serveur reste juge du domaine (hôte local, port, domaine réservé).
export function validerDeclaration(
  canal: CanalIntegrateur,
  saisie: SaisieDeclaration,
): ErreursDeclaration {
  const erreurs: ErreursDeclaration = {};

  if (saisie.structure.trim().length < 2) {
    erreurs.structure = "Indiquez le nom de votre structure.";
  }
  if (!saisie.typeStructure) {
    erreurs.typeStructure = "Choisissez un type de structure.";
  }
  if (!FORMAT_EMAIL.test(saisie.email.trim())) {
    erreurs.email = "Indiquez une adresse e-mail valide, par exemple nom@domaine.fr.";
  }
  if (demandeUnDomaine(canal) && !saisie.domaine.trim()) {
    erreurs.domaine = "Indiquez le domaine, par exemple mon-service.gouv.fr.";
  }
  if (
    canal === CanalIntegrateur.PAGE &&
    saisie.departement.trim() &&
    !FORMAT_DEPARTEMENT.test(saisie.departement.trim())
  ) {
    erreurs.departement = "Indiquez un numéro de département, par exemple 88 ou 2A.";
  }

  return erreurs;
}

// N'appeler qu'après une validation sans erreur.
export function construireDeclaration(
  canal: CanalIntegrateur,
  saisie: SaisieDeclaration,
): DeclarationIntegrateurInput {
  const estPage = canal === CanalIntegrateur.PAGE;
  const departement = saisie.departement.trim().toUpperCase();

  return {
    canal,
    structure: saisie.structure.trim(),
    typeStructure: saisie.typeStructure as TypeStructure,
    email: saisie.email.trim(),
    ...(demandeUnDomaine(canal) ? { domaine: saisie.domaine.trim() } : {}),
    ...(estPage && departement ? { departement } : {}),
    ...(estPage && saisie.nbSitesEstime ? { nbSitesEstime: saisie.nbSitesEstime } : {}),
    ...(saisie.telephone ? { telephone: saisie.telephone } : {}),
  };
}

export interface ConfirmationDeclaration {
  niveau: "success" | "info" | "warning";
  titre: string;
  texte: string;
}

export function confirmationDeclaration(
  reponse: DeclarationIntegrateurOutput,
): ConfirmationDeclaration {
  if (reponse.statut === StatutIntegrateur.REVOQUE) {
    return {
      niveau: "warning",
      titre: "Accès suspendu",
      texte: `L'accès de ce domaine a été suspendu. Écrivez-nous à ${CONTACT_MUTAFRICHES} pour en parler.`,
    };
  }

  if (reponse.statut === StatutIntegrateur.EN_ATTENTE) {
    return {
      niveau: "success",
      titre: reponse.dejaDeclare ? "Demande déjà enregistrée" : "Demande enregistrée",
      texte:
        reponse.canal === CanalIntegrateur.IFRAME
          ? "L'équipe Mutafriches vous recontacte pour vous transmettre votre identifiant. En attendant, l'identifiant « demo » fonctionne depuis un poste local."
          : "L'équipe Mutafriches vous recontacte pour préparer votre page à partir de votre liste de sites.",
    };
  }

  if (reponse.canal === CanalIntegrateur.API || reponse.canal === CanalIntegrateur.QGIS) {
    return {
      niveau: reponse.dejaDeclare ? "info" : "success",
      titre: reponse.dejaDeclare ? "Domaine déjà déclaré" : "Votre domaine est autorisé",
      texte: `Vos appels sont acceptés dès maintenant avec l'en-tête Origin: ${reponse.origine ?? ""}`,
    };
  }

  return {
    niveau: "info",
    titre: "Déjà en service",
    texte: "Cette intégration est déjà active pour ce domaine.",
  };
}

// Message affiché quand l'envoi échoue, selon le code HTTP.
export function messageErreurDeclaration(statusCode: number, message: string): string {
  if (statusCode === 429) {
    return "Trop de déclarations depuis votre connexion. Réessayez dans une heure.";
  }
  if (statusCode === 400) {
    return message;
  }
  return `La déclaration n'a pas pu être enregistrée. Réessayez, ou écrivez-nous à ${CONTACT_MUTAFRICHES}.`;
}
