import {
  UsageType,
  PresencePollution,
  RisqueNaturel,
  ZonageReglementaire,
  ZonageEnvironnemental,
  ZonagePatrimonial,
  TrameVerteEtBleue,
  EtatBatiInfrastructure,
  TypeProprietaire,
  ValeurArchitecturale,
  QualitePaysage,
  QualiteVoieDesserte,
  RaccordementEau,
} from "@mutafriches/shared-types";
import { TagInputData, UsageTagsConfig } from "./dynamicTags.types";

// ============================================================================
// SEUILS DE CALCUL (alignés sur algorithme.config.ts)
// ============================================================================

/** Seuil pour considérer une parcelle comme "grande" en m² */
export const SEUIL_GRANDE_PARCELLE = 10000;

/** Seuil pour considérer une emprise bâtie comme "faible" en m² */
export const SEUIL_EMPRISE_BATI_FAIBLE = 500;

/** Distance maximale pour considérer les transports en commun "à proximité" en mètres */
export const SEUIL_DISTANCE_TC_PROCHE = 500;

/** Distance maximale pour considérer le raccordement électrique accessible en mètres */
export const SEUIL_DISTANCE_RACCORDEMENT_ELEC = 500;

// ============================================================================
// FONCTIONS DE RÉSOLUTION DES TAGS
// ============================================================================

// --- Taille de la parcelle ---
const resolveTailleParcelle = (data: TagInputData): string | null => {
  const surface = data.enrichmentData.surfaceSite;
  if (surface === undefined || surface === null) return null;
  return surface >= SEUIL_GRANDE_PARCELLE ? "grande parcelle" : "petite parcelle";
};

const resolveGrandeParcelleUniquement = (data: TagInputData): string | null => {
  const surface = data.enrichmentData.surfaceSite;
  if (surface === undefined || surface === null) return null;
  return surface >= SEUIL_GRANDE_PARCELLE ? "grande parcelle" : null;
};

// --- Présence de pollution ---
const resolveNonPollue = (data: TagInputData): string | null => {
  const pollution = data.manualData.presencePollution;
  return pollution === PresencePollution.NON ? "non-pollué" : null;
};

// --- Distance du centre ville ---
const resolveCentral = (data: TagInputData): string | null => {
  const enCentreVille = data.enrichmentData.siteEnCentreVille;
  // Si true → "central", sinon (false ou undefined) → pas de tag
  return enCentreVille === true ? "central" : null;
};

// --- Proximité des commerces et services ---
const resolveServicesProches = (data: TagInputData): string | null => {
  const proxCommerce = data.enrichmentData.proximiteCommercesServices;
  return proxCommerce === true ? "services proches" : null;
};

// --- Risques naturels ---
const resolveRisquesNaturels = (data: TagInputData): string | null => {
  const risques = data.enrichmentData.presenceRisquesNaturels;
  if (!risques) return null;

  switch (risques) {
    case RisqueNaturel.FAIBLE:
    case RisqueNaturel.AUCUN:
      return "risques nat. faibles";
    case RisqueNaturel.MOYEN:
      return "risques nat. modérés";
    case RisqueNaturel.FORT:
    default:
      return null;
  }
};

// --- Risques technologiques ---
const resolveRisquesTechnologiques = (data: TagInputData): string | null => {
  const risques = data.enrichmentData.presenceRisquesTechnologiques;
  // L'API retourne un booléen, true = présence de risques, false = pas de risques
  if (risques === undefined || risques === null) return null;
  return risques === false ? "risques tech. faibles" : "risques tech. modérés";
};

// --- Risques technologiques pour Renaturation (affiche faibles, modérés, forts) ---
const resolveRisquesTechnologiquesRenaturation = (data: TagInputData): string | null => {
  const risques = data.enrichmentData.presenceRisquesTechnologiques;
  if (risques === undefined || risques === null) return null;
  // Pour renaturation, on affiche toujours un tag
  return risques === false ? "risques tech. faibles" : "risques tech. forts";
};

// --- Zonage réglementaire ---
const resolveZonageFavorable = (data: TagInputData): string | null => {
  const zonage = data.enrichmentData.zonageReglementaire;
  if (!zonage || zonage === ZonageReglementaire.NE_SAIT_PAS) return null;
  return zonage === ZonageReglementaire.ZONE_URBAINE_U ? "zonage favorable" : null;
};

// --- Desserte par les réseaux (eau et élec) ---
const resolveDesserteReseaux = (data: TagInputData): string | null => {
  const raccordementEau = data.manualData.raccordementEau;
  const distanceElec = data.enrichmentData.distanceRaccordementElectrique;

  // Convertir distanceElec de km en mètres (l'algo utilise km)
  const distanceElecMetres = distanceElec !== undefined ? distanceElec * 1000 : undefined;

  const eauOk = raccordementEau === RaccordementEau.OUI;
  const elecOk =
    distanceElecMetres !== undefined && distanceElecMetres <= SEUIL_DISTANCE_RACCORDEMENT_ELEC;

  // Si eau = oui ET/OU distance raccordement < 500m → afficher le tag
  // Sinon (ne sait pas, non renseigné, ou conditions non remplies) → pas de tag
  return eauOk || elecOk ? "desserte réseaux" : null;
};

// --- Distance des transports en commun ---
const resolveTransportCommun = (data: TagInputData): string | null => {
  const distance = data.enrichmentData.distanceTransportCommun;
  // null = aucun arrêt trouvé dans le rayon de recherche
  if (distance === null || distance === undefined) return null;
  return distance <= SEUIL_DISTANCE_TC_PROCHE ? "TC prox." : null;
};

// --- État du bâti pour Culture/Tourisme ---
const resolveEtatBatiCulture = (data: TagInputData): string | null => {
  const etat = data.manualData.etatBatiInfrastructure;
  if (!etat || etat === EtatBatiInfrastructure.NE_SAIT_PAS) return null;

  switch (etat) {
    case EtatBatiInfrastructure.DEGRADATION_INEXISTANTE:
      return "bâti bon état";
    case EtatBatiInfrastructure.DEGRADATION_MOYENNE:
    case EtatBatiInfrastructure.DEGRADATION_HETEROGENE:
      return "bâti dégradé";
    case EtatBatiInfrastructure.DEGRADATION_TRES_IMPORTANTE:
      return "bâti ruine";
    case EtatBatiInfrastructure.PAS_DE_BATI:
      return null;
    default:
      return null;
  }
};

// --- État du bâti pour Renaturation ---
const resolveEtatBatiRenaturation = (data: TagInputData): string | null => {
  const etat = data.manualData.etatBatiInfrastructure;
  if (!etat || etat === EtatBatiInfrastructure.NE_SAIT_PAS) return null;

  switch (etat) {
    case EtatBatiInfrastructure.DEGRADATION_MOYENNE:
    case EtatBatiInfrastructure.DEGRADATION_HETEROGENE:
      return "bâti dégradé";
    case EtatBatiInfrastructure.DEGRADATION_TRES_IMPORTANTE:
      return "bâti ruine";
    // Dégradation inexistante ou faible → pas de tag pour renaturation
    case EtatBatiInfrastructure.DEGRADATION_INEXISTANTE:
    case EtatBatiInfrastructure.PAS_DE_BATI:
    default:
      return null;
  }
};

// --- Zonage patrimonial pour Culture ---
const resolveZonagePatrimonialCulture = (data: TagInputData): string | null => {
  const zonage = data.enrichmentData.zonagePatrimonial;
  if (!zonage) return null;

  switch (zonage) {
    case ZonagePatrimonial.SITE_INSCRIT_CLASSE:
    case ZonagePatrimonial.PERIMETRE_ABF:
    case ZonagePatrimonial.MONUMENT_HISTORIQUE:
    case ZonagePatrimonial.ZPPAUP:
    case ZonagePatrimonial.AVAP:
    case ZonagePatrimonial.SPR:
      return "intérêt patrimonial";
    case ZonagePatrimonial.NON_CONCERNE:
      return "zon. pat. non-protégé";
    default:
      return null;
  }
};

// --- Zonage patrimonial pour Industrie ---
const resolveZonagePatrimonialIndustrie = (data: TagInputData): string | null => {
  const zonage = data.enrichmentData.zonagePatrimonial;
  if (!zonage) return null;

  return zonage === ZonagePatrimonial.NON_CONCERNE ? "zon. pat. non-protégé" : null;
};

// --- Qualité du paysage environnant ---
const resolveQualitePaysage = (data: TagInputData): string | null => {
  const qualite = data.manualData.qualitePaysage;
  if (!qualite || qualite === QualitePaysage.NE_SAIT_PAS) return null;

  return qualite === QualitePaysage.INTERET_REMARQUABLE ? "qualité paysage" : null;
};

// --- Qualité de la voie de desserte ---
const resolveQualiteVoieDesserte = (data: TagInputData): string | null => {
  const qualite = data.manualData.qualiteVoieDesserte;
  if (!qualite || qualite === QualiteVoieDesserte.NE_SAIT_PAS) return null;

  return qualite === QualiteVoieDesserte.ACCESSIBLE ? "bon accès" : null;
};

// --- Zonage environnemental pour Industrie ---
const resolveZonageEnvironnementalIndustrie = (data: TagInputData): string | null => {
  const zonage = data.enrichmentData.zonageEnvironnemental;
  if (!zonage) return null;

  switch (zonage) {
    case ZonageEnvironnemental.HORS_ZONE:
    case ZonageEnvironnemental.PROXIMITE_ZONE:
      return "zon. env. non contraint";
    // Si au sein d'une réserve naturelle, natura 2000, ZNIEFF → pas de tag
    default:
      return null;
  }
};

// --- Zonage environnemental pour Renaturation ---
const resolveZonageEnvironnementalRenaturation = (data: TagInputData): string | null => {
  const zonage = data.enrichmentData.zonageEnvironnemental;
  if (!zonage) return null;

  switch (zonage) {
    case ZonageEnvironnemental.RESERVE_NATURELLE:
    case ZonageEnvironnemental.NATURA_2000:
    case ZonageEnvironnemental.ZNIEFF_TYPE_1_2:
    case ZonageEnvironnemental.PARC_NATUREL_REGIONAL:
    case ZonageEnvironnemental.PARC_NATUREL_NATIONAL:
      return "zone protégée";
    // Hors zone ou proximité → pas de tag pour renaturation
    default:
      return null;
  }
};

// --- Type de propriétaire ---
const resolveTypeProprietaire = (data: TagInputData): string | null => {
  const type = data.manualData.typeProprietaire;
  if (!type || type === TypeProprietaire.NE_SAIT_PAS) return null;

  return type === TypeProprietaire.PUBLIC ? "prop. public" : null;
};

// --- Emprise au sol du bâti ---
const resolveEmpriseBatiFaible = (data: TagInputData): string | null => {
  const surface = data.enrichmentData.surfaceBati;
  if (surface === undefined || surface === null) return null;

  return surface < SEUIL_EMPRISE_BATI_FAIBLE ? "emprise bât. faible" : null;
};

// --- Continuité écologique pour Photovoltaïque ---
const resolveContinuiteEcologiquePhotovoltaique = (data: TagInputData): string | null => {
  const trame = data.manualData.trameVerteEtBleue;
  if (!trame || trame === TrameVerteEtBleue.NE_SAIT_PAS) return null;

  return trame === TrameVerteEtBleue.HORS_TRAME ? "absence continuité écologique" : null;
};

// --- Continuité écologique pour Renaturation ---
const resolveContinuiteEcologiqueRenaturation = (data: TagInputData): string | null => {
  const trame = data.manualData.trameVerteEtBleue;
  if (!trame || trame === TrameVerteEtBleue.NE_SAIT_PAS) return null;

  switch (trame) {
    case TrameVerteEtBleue.RESERVOIR_BIODIVERSITE:
    case TrameVerteEtBleue.CORRIDOR_A_RESTAURER:
    case TrameVerteEtBleue.CORRIDOR_A_PRESERVER:
      return "continuité écologique";
    default:
      return null;
  }
};

// --- Valeur architecturale/patrimoniale du bâti pour Photovoltaïque ---
const resolveValeurPatrimonialeFaible = (data: TagInputData): string | null => {
  const valeur = data.manualData.valeurArchitecturaleHistorique;
  if (!valeur || valeur === ValeurArchitecturale.NE_SAIT_PAS) return null;

  switch (valeur) {
    case ValeurArchitecturale.ORDINAIRE:
    case ValeurArchitecturale.SANS_INTERET:
      return "val. patr. faible";
    // Intérêt remarquable → pas de tag
    default:
      return null;
  }
};

// ============================================================================
// CONFIGURATION DES TAGS PAR USAGE
// ============================================================================

export const USAGE_TAGS_CONFIG: UsageTagsConfig = {
  // 1 - Logements et commerces de proximité (RESIDENTIEL)
  [UsageType.RESIDENTIEL]: [
    { critereId: "tailleParcelle", resolver: resolveTailleParcelle },
    { critereId: "presencePollution", resolver: resolveNonPollue },
    { critereId: "distanceCentreVille", resolver: resolveCentral },
    { critereId: "proximiteCommercesServices", resolver: resolveServicesProches },
    { critereId: "risquesNaturels", resolver: resolveRisquesNaturels },
    { critereId: "zonageReglementaire", resolver: resolveZonageFavorable },
  ],

  // 2 - Équipements publics
  [UsageType.EQUIPEMENTS]: [
    { critereId: "tailleParcelle", resolver: resolveTailleParcelle },
    { critereId: "presencePollution", resolver: resolveNonPollue },
    { critereId: "distanceCentreVille", resolver: resolveCentral },
    { critereId: "proximiteCommercesServices", resolver: resolveServicesProches },
    { critereId: "risquesNaturels", resolver: resolveRisquesNaturels },
    { critereId: "risquesTechnologiques", resolver: resolveRisquesTechnologiques },
  ],

  // 3 - Bureaux (Tertiaire)
  [UsageType.TERTIAIRE]: [
    { critereId: "tailleParcelle", resolver: resolveTailleParcelle },
    { critereId: "distanceCentreVille", resolver: resolveCentral },
    { critereId: "desserteReseaux", resolver: resolveDesserteReseaux },
    { critereId: "distanceTransportCommun", resolver: resolveTransportCommun },
    { critereId: "proximiteCommercesServices", resolver: resolveServicesProches },
    { critereId: "zonageReglementaire", resolver: resolveZonageFavorable },
  ],

  // 4 - Équipements culturels et touristiques
  [UsageType.CULTURE]: [
    { critereId: "etatBati", resolver: resolveEtatBatiCulture },
    { critereId: "presencePollution", resolver: resolveNonPollue },
    { critereId: "desserteReseaux", resolver: resolveDesserteReseaux },
    { critereId: "distanceTransportCommun", resolver: resolveTransportCommun },
    { critereId: "zonagePatrimonial", resolver: resolveZonagePatrimonialCulture },
    { critereId: "qualitePaysage", resolver: resolveQualitePaysage },
  ],

  // 5 - Bâtiments industriels
  [UsageType.INDUSTRIE]: [
    { critereId: "tailleParcelle", resolver: resolveGrandeParcelleUniquement },
    { critereId: "desserteReseaux", resolver: resolveDesserteReseaux },
    { critereId: "qualiteVoieDesserte", resolver: resolveQualiteVoieDesserte },
    { critereId: "zonageReglementaire", resolver: resolveZonageFavorable },
    { critereId: "zonageEnvironnemental", resolver: resolveZonageEnvironnementalIndustrie },
    { critereId: "zonagePatrimonial", resolver: resolveZonagePatrimonialIndustrie },
  ],

  // 6 - Centrale photovoltaïque au sol
  [UsageType.PHOTOVOLTAIQUE]: [
    { critereId: "tailleParcelle", resolver: resolveGrandeParcelleUniquement },
    { critereId: "empriseBati", resolver: resolveEmpriseBatiFaible },
    { critereId: "desserteReseaux", resolver: resolveDesserteReseaux },
    { critereId: "risquesNaturels", resolver: resolveRisquesNaturels },
    { critereId: "valeurPatrimoniale", resolver: resolveValeurPatrimonialeFaible },
    { critereId: "continuite", resolver: resolveContinuiteEcologiquePhotovoltaique },
  ],

  // 7 - Espace renaturé
  [UsageType.RENATURATION]: [
    { critereId: "typeProprietaire", resolver: resolveTypeProprietaire },
    { critereId: "empriseBati", resolver: resolveEmpriseBatiFaible },
    { critereId: "etatBati", resolver: resolveEtatBatiRenaturation },
    { critereId: "zonageEnvironnemental", resolver: resolveZonageEnvironnementalRenaturation },
    { critereId: "continuite", resolver: resolveContinuiteEcologiqueRenaturation },
    { critereId: "risquesTechnologiques", resolver: resolveRisquesTechnologiquesRenaturation },
  ],
};
