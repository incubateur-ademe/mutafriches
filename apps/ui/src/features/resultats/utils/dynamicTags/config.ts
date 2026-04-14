import {
  UsageType,
  PresencePollution,
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
import { TagInputData, UsageTagsConfig } from "./types";
import {
  SEUIL_GRANDE_PARCELLE,
  SEUIL_EMPRISE_BATI_FAIBLE,
  SEUIL_DISTANCE_TC_PROCHE,
  SEUIL_DISTANCE_RACCORDEMENT_ELEC,
} from "./constants";

// ============================================================================
// FONCTIONS DE RÉSOLUTION DES TAGS (fallback legacy)
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
const resolvePollution = (data: TagInputData): string | null => {
  const pollution = data.manualData.presencePollution;
  if (!pollution || pollution === PresencePollution.NE_SAIT_PAS) return null;
  return pollution === PresencePollution.NON ? "non-pollué" : "pollué";
};

// --- Distance du centre ville ---
const resolveCentreVille = (data: TagInputData): string | null => {
  const enCentreVille = data.enrichmentData.siteEnCentreVille;
  if (enCentreVille === undefined || enCentreVille === null) return null;
  return enCentreVille ? "centre-ville" : "excentré";
};

// --- Proximité des commerces et services ---
const resolveProximiteCommercesServices = (data: TagInputData): string | null => {
  const proxCommerce = data.enrichmentData.proximiteCommercesServices;
  if (proxCommerce === undefined || proxCommerce === null) return null;
  return proxCommerce ? "services proches" : "services éloignés";
};

// --- Risques naturels ---
const resolveRisquesNaturels = (data: TagInputData): string | null => {
  const rga = data.enrichmentData.risqueRetraitGonflementArgile;
  const cavites = data.enrichmentData.risqueCavitesSouterraines;
  const inondation = data.enrichmentData.risqueInondation;

  // Si au moins un risque est "fort" ou "oui" → pas de tag
  if (inondation === "oui") return null;
  if (cavites === "oui") return null;
  if (rga === "fort") return null;

  // Si RGA faible ou moyen (et pas d'autre risque fort) → modérés
  if (rga === "faible-ou-moyen") return "risques nat. modérés";

  // Si au moins un risque est renseigné et aucun n'est problématique → faibles
  if (rga || cavites || inondation) return "risques nat. faibles";

  return null;
};

// --- Risques technologiques ---
const resolveRisquesTechnologiques = (data: TagInputData): string | null => {
  const risques = data.enrichmentData.presenceRisquesTechnologiques;
  if (risques === undefined || risques === null) return null;
  return risques === false ? "risques tech. faibles" : "risques tech. modérés";
};

// --- Risques technologiques pour Renaturation (affiche faibles, modérés, forts) ---
const resolveRisquesTechnologiquesRenaturation = (data: TagInputData): string | null => {
  const risques = data.enrichmentData.presenceRisquesTechnologiques;
  if (risques === undefined || risques === null) return null;
  return risques === false ? "risques tech. faibles" : "risques tech. forts";
};

// --- Zonage réglementaire ---
const resolveZonageReglementaire = (data: TagInputData): string | null => {
  const zonage = data.enrichmentData.zonageReglementaire;
  if (!zonage || zonage === ZonageReglementaire.NE_SAIT_PAS) return null;
  return zonage === ZonageReglementaire.ZONE_URBAINE_U ? "Zonage compatible" : null;
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

  if (eauOk || elecOk) return "desserte réseaux";

  // Si au moins une donnée renseignée mais conditions non remplies → absence
  const eauRenseignee =
    raccordementEau !== undefined &&
    raccordementEau !== null &&
    raccordementEau !== RaccordementEau.NE_SAIT_PAS;
  const elecRenseignee = distanceElecMetres !== undefined;

  if (eauRenseignee || elecRenseignee) return "absence réseaux";

  return null;
};

// --- Distance des transports en commun ---
const resolveTransportCommun = (data: TagInputData): string | null => {
  const distance = data.enrichmentData.distanceTransportCommun;
  // null = aucun arrêt trouvé dans le rayon de recherche
  if (distance === null || distance === undefined) return null;
  return distance <= SEUIL_DISTANCE_TC_PROCHE ? "TC prox." : "TC éloigné";
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
      return "zon. pat. non-protégée";
    default:
      return null;
  }
};

// --- Zonage patrimonial pour Industrie ---
const resolveZonagePatrimonialIndustrie = (data: TagInputData): string | null => {
  const zonage = data.enrichmentData.zonagePatrimonial;
  if (!zonage) return null;

  return zonage === ZonagePatrimonial.NON_CONCERNE ? "zon. pat. non-protégée" : null;
};

// --- Qualité du paysage environnant ---
const resolveQualitePaysage = (data: TagInputData): string | null => {
  const qualite = data.manualData.qualitePaysage;
  if (!qualite || qualite === QualitePaysage.NE_SAIT_PAS) return null;

  return qualite === QualitePaysage.INTERET_REMARQUABLE ? "qualité paysage" : "paysage dégradé";
};

// --- Qualité de la voie de desserte ---
const resolveQualiteVoieDesserte = (data: TagInputData): string | null => {
  const qualite = data.manualData.qualiteVoieDesserte;
  if (!qualite || qualite === QualiteVoieDesserte.NE_SAIT_PAS) return null;

  return qualite === QualiteVoieDesserte.ACCESSIBLE ? "bon accès" : "voie dégradée";
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

  switch (type) {
    case TypeProprietaire.PUBLIC:
      return "prop. public";
    case TypeProprietaire.PRIVE:
      return "prop. privé";
    case TypeProprietaire.MIXTE:
    case TypeProprietaire.COPRO_INDIVISION:
      return "prop. mixte";
    default:
      return null;
  }
};

// --- Emprise au sol du bâti ---
const resolveEmpriseBati = (data: TagInputData): string | null => {
  const surface = data.enrichmentData.surfaceBati;
  if (surface === undefined || surface === null) return null;

  return surface < SEUIL_EMPRISE_BATI_FAIBLE ? "emprise bât. faible" : "emprise bât. forte";
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

// --- Valeur architecturale/patrimoniale du bâti ---
const resolveValeurPatrimoniale = (data: TagInputData): string | null => {
  const valeur = data.manualData.valeurArchitecturaleHistorique;
  if (!valeur || valeur === ValeurArchitecturale.NE_SAIT_PAS) return null;

  switch (valeur) {
    case ValeurArchitecturale.ORDINAIRE:
    case ValeurArchitecturale.SANS_INTERET:
      return "val. patr. faible";
    case ValeurArchitecturale.INTERET_REMARQUABLE:
      return "val. patr. forte";
    default:
      return null;
  }
};

// --- Zone d'accélération ENR pour Photovoltaïque ---
const resolveZoneEnrPhotovoltaique = (data: TagInputData): string | null => {
  const filieres = data.enrichmentData.zaer?.filieres;
  if (!filieres || filieres.length === 0) return null;

  const hasSolairePv = filieres.some((f) => f.toUpperCase().includes("SOLAIRE_PV"));
  return hasSolairePv ? "ZA Photovoltaïque" : null;
};

// ============================================================================
// CONFIGURATION DES TAGS PAR USAGE (fallback legacy)
// ============================================================================

export const USAGE_TAGS_CONFIG: UsageTagsConfig = {
  // 1 - Logements et commerces de proximité (RESIDENTIEL)
  [UsageType.RESIDENTIEL]: [
    { critereId: "tailleParcelle", resolver: resolveTailleParcelle },
    { critereId: "presencePollution", resolver: resolvePollution },
    { critereId: "distanceCentreVille", resolver: resolveCentreVille },
    { critereId: "proximiteCommercesServices", resolver: resolveProximiteCommercesServices },
    { critereId: "risquesNaturels", resolver: resolveRisquesNaturels },
    { critereId: "zonageReglementaire", resolver: resolveZonageReglementaire },
  ],

  // 2 - Équipements publics
  [UsageType.EQUIPEMENTS]: [
    { critereId: "tailleParcelle", resolver: resolveTailleParcelle },
    { critereId: "presencePollution", resolver: resolvePollution },
    { critereId: "distanceCentreVille", resolver: resolveCentreVille },
    { critereId: "proximiteCommercesServices", resolver: resolveProximiteCommercesServices },
    { critereId: "risquesNaturels", resolver: resolveRisquesNaturels },
    { critereId: "risquesTechnologiques", resolver: resolveRisquesTechnologiques },
  ],

  // 3 - Bureaux (Tertiaire)
  [UsageType.TERTIAIRE]: [
    { critereId: "tailleParcelle", resolver: resolveTailleParcelle },
    { critereId: "distanceCentreVille", resolver: resolveCentreVille },
    { critereId: "desserteReseaux", resolver: resolveDesserteReseaux },
    { critereId: "distanceTransportCommun", resolver: resolveTransportCommun },
    { critereId: "proximiteCommercesServices", resolver: resolveProximiteCommercesServices },
    { critereId: "zonageReglementaire", resolver: resolveZonageReglementaire },
  ],

  // 4 - Équipements culturels et touristiques
  [UsageType.CULTURE]: [
    { critereId: "etatBati", resolver: resolveEtatBatiCulture },
    { critereId: "presencePollution", resolver: resolvePollution },
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
    { critereId: "zonageReglementaire", resolver: resolveZonageReglementaire },
    { critereId: "zonageEnvironnemental", resolver: resolveZonageEnvironnementalIndustrie },
    { critereId: "zonagePatrimonial", resolver: resolveZonagePatrimonialIndustrie },
  ],

  // 6 - Centrale photovoltaïque au sol
  [UsageType.PHOTOVOLTAIQUE]: [
    { critereId: "tailleParcelle", resolver: resolveGrandeParcelleUniquement },
    { critereId: "empriseBati", resolver: resolveEmpriseBati },
    { critereId: "desserteReseaux", resolver: resolveDesserteReseaux },
    { critereId: "risquesNaturels", resolver: resolveRisquesNaturels },
    { critereId: "valeurPatrimoniale", resolver: resolveValeurPatrimoniale },
    { critereId: "continuite", resolver: resolveContinuiteEcologiquePhotovoltaique },
    { critereId: "zoneEnr", resolver: resolveZoneEnrPhotovoltaique },
  ],

  // 7 - Espace renaturé
  [UsageType.RENATURATION]: [
    { critereId: "typeProprietaire", resolver: resolveTypeProprietaire },
    { critereId: "empriseBati", resolver: resolveEmpriseBati },
    { critereId: "etatBati", resolver: resolveEtatBatiRenaturation },
    { critereId: "zonageEnvironnemental", resolver: resolveZonageEnvironnementalRenaturation },
    { critereId: "continuite", resolver: resolveContinuiteEcologiqueRenaturation },
    { critereId: "risquesTechnologiques", resolver: resolveRisquesTechnologiquesRenaturation },
  ],
};
