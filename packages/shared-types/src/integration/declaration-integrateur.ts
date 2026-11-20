// Registre des intégrateurs (table `integrateurs`, ADR-0055) : valeurs partagées par le
// formulaire de déclaration (UI, extension QGIS) et l'API.

export enum CanalIntegrateur {
  API = "api",
  QGIS = "qgis",
  PAGE = "page",
  IFRAME = "iframe",
}

export const CANAUX_INTEGRATEUR: CanalIntegrateur[] = Object.values(CanalIntegrateur);

export const CANAL_INTEGRATEUR_LABELS: Record<CanalIntegrateur, string> = {
  [CanalIntegrateur.API]: "API",
  [CanalIntegrateur.QGIS]: "Extension QGIS",
  [CanalIntegrateur.PAGE]: "Page personnalisée",
  [CanalIntegrateur.IFRAME]: "Iframe",
};

export enum StatutIntegrateur {
  EN_ATTENTE = "en_attente",
  ACTIF = "actif",
  REVOQUE = "revoque",
}

// L'API et l'extension QGIS sont actives dès la déclaration. Une page personnalisée ou une
// iframe demande une action de l'équipe avant d'exister.
export const CANAUX_ACTIFS_A_LA_DECLARATION: CanalIntegrateur[] = [
  CanalIntegrateur.API,
  CanalIntegrateur.QGIS,
];

// Seule la page personnalisée vit sur notre domaine, sans domaine à déclarer.
export const CANAUX_AVEC_DOMAINE: CanalIntegrateur[] = [
  CanalIntegrateur.API,
  CanalIntegrateur.QGIS,
  CanalIntegrateur.IFRAME,
];

export const TYPES_STRUCTURE = [
  "collectivite",
  "etablissement_public",
  "etat",
  "bureau_etudes",
  "entreprise",
  "association",
  "autre",
] as const;

export type TypeStructure = (typeof TYPES_STRUCTURE)[number];

export const TYPE_STRUCTURE_LABELS: Record<TypeStructure, string> = {
  collectivite: "Collectivité territoriale",
  etablissement_public: "Établissement public (EPF, EPA, agence d'urbanisme…)",
  etat: "Service de l'État",
  bureau_etudes: "Bureau d'études",
  entreprise: "Entreprise",
  association: "Association",
  autre: "Autre",
};

export const TRANCHES_NB_SITES = ["moins-de-10", "10-a-50", "50-a-200", "plus-de-200"] as const;

export type TrancheNbSites = (typeof TRANCHES_NB_SITES)[number];

export const TRANCHE_NB_SITES_LABELS: Record<TrancheNbSites, string> = {
  "moins-de-10": "Moins de 10 sites",
  "10-a-50": "De 10 à 50 sites",
  "50-a-200": "De 50 à 200 sites",
  "plus-de-200": "Plus de 200 sites",
};

// En-tête posé par un client non navigateur pour se nommer (`qgis/1.2.0`). Sert à distinguer
// l'extension QGIS de l'API d'une même structure dans les statistiques.
export const EN_TETE_CLIENT_MUTAFRICHES = "x-mutafriches-client";
export const PREFIXE_CLIENT_QGIS = "qgis";

const SCHEMA_URL = /^([a-z][a-z0-9+.-]*):\/\//;
// Nom de domaine complet : des labels de lettres, chiffres et tirets (jamais en bord de
// label), puis une extension d'au moins deux lettres (ou sa forme punycode).
const FORMAT_NOM_DOMAINE =
  /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/;

// Ramène une saisie libre (`exemple.fr`, `https://www.exemple.fr/outil`) à son hôte, ou null
// si ce n'est pas un nom de domaine déclarable : extension absente (`intranet`, `mon-service`),
// adresse IP, schéma autre que https, port ou identifiants dans l'adresse. Partagé par le
// formulaire, qui signale l'erreur avant l'envoi, et par l'API, qui reste seule juge.
// Analyse à la main : ce paquet ne dépend ni du DOM ni de Node, donc pas de `URL`.
export function hoteDeDomaineDeclare(saisie: string): string | null {
  const brut = saisie.trim().toLowerCase();
  if (!brut || /\s/.test(brut)) {
    return null;
  }

  const schema = SCHEMA_URL.exec(brut);
  if (schema && schema[1] !== "https") {
    return null;
  }

  // Tout ce qui précède le chemin ; un « @ » (identifiants) ou un « : » (port, IPv6) l'écarte.
  const autorite = (schema ? brut.slice(schema[0].length) : brut).split(/[/?#]/)[0];
  if (autorite.includes("@") || autorite.includes(":")) {
    return null;
  }

  return FORMAT_NOM_DOMAINE.test(autorite) ? autorite : null;
}

export interface DeclarationIntegrateurInput {
  canal: CanalIntegrateur;
  structure: string;
  typeStructure: TypeStructure;
  // Transmis à l'outil d'e-mailing, jamais stocké en base.
  email: string;
  // Obligatoire pour les canaux de CANAUX_AVEC_DOMAINE.
  domaine?: string;
  // Canal page uniquement.
  departement?: string;
  nbSitesEstime?: TrancheNbSites;
  // Champ piège : rempli par un robot, jamais par un humain.
  telephone?: string;
}

export interface DeclarationIntegrateurOutput {
  canal: CanalIntegrateur;
  statut: StatutIntegrateur;
  // Origine normalisée à envoyer dans l'en-tête `Origin` (absente pour une page personnalisée).
  origine?: string;
  // Vrai quand ce domaine était déjà déclaré pour ce canal : rien n'a été créé.
  dejaDeclare: boolean;
}
