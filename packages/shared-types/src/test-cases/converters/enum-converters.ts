import {
  TypeProprietaire,
  TerrainViabilise,
  EtatBatiInfrastructure,
  PresencePollution,
  ValeurArchitecturale,
  QualitePaysage,
  QualiteVoieDesserte,
} from "../../enums";

/**
 * Convertit une string en valeur d'enum EtatBatiInfrastructure
 */
export function toEtatBati(value: string | undefined): EtatBatiInfrastructure {
  const mapping: Record<string, EtatBatiInfrastructure> = {
    "batiments-heterogenes": EtatBatiInfrastructure.DEGRADATION_HETEROGENE,
    BATIMENTS_HETEROGENES: EtatBatiInfrastructure.DEGRADATION_HETEROGENE,
    "degradation-tres-importante": EtatBatiInfrastructure.DEGRADATION_TRES_IMPORTANTE,
    "degradation-moyenne": EtatBatiInfrastructure.DEGRADATION_MOYENNE,
    "degradation-inexistante": EtatBatiInfrastructure.DEGRADATION_INEXISTANTE,
    "degradation-heterogene": EtatBatiInfrastructure.DEGRADATION_HETEROGENE,
  };
  return mapping[value || ""] || EtatBatiInfrastructure.NE_SAIT_PAS;
}

/**
 * Convertit une string en valeur d'enum TypeProprietaire
 */
export function toTypeProprietaire(value: string | undefined): TypeProprietaire {
  const mapping: Record<string, TypeProprietaire> = {
    PUBLIC: TypeProprietaire.PUBLIC,
    public: TypeProprietaire.PUBLIC,
    PRIVE: TypeProprietaire.PRIVE,
    prive: TypeProprietaire.PRIVE,
    mixte: TypeProprietaire.MIXTE,
    "copro-indivision": TypeProprietaire.COPRO_INDIVISION,
  };
  return mapping[value || ""] || TypeProprietaire.NE_SAIT_PAS;
}

/**
 * Convertit un booléen ou string en TerrainViabilise
 */
export function toTerrainViabilise(value: boolean | string | undefined): TerrainViabilise {
  if (typeof value === "boolean") {
    return value ? TerrainViabilise.OUI : TerrainViabilise.NON;
  }
  const mapping: Record<string, TerrainViabilise> = {
    oui: TerrainViabilise.OUI,
    non: TerrainViabilise.NON,
    true: TerrainViabilise.OUI,
    false: TerrainViabilise.NON,
  };
  return mapping[value || ""] || TerrainViabilise.NE_SAIT_PAS;
}

/**
 * Convertit une string en PresencePollution
 */
export function toPresencePollution(value: string | undefined): PresencePollution {
  const mapping: Record<string, PresencePollution> = {
    NON: PresencePollution.NON,
    non: PresencePollution.NON,
    OUI_AUTRES_COMPOSES: PresencePollution.OUI_AUTRES_COMPOSES,
    "oui-autres-composes": PresencePollution.OUI_AUTRES_COMPOSES,
    "oui-composes-volatils": PresencePollution.OUI_COMPOSES_VOLATILS,
    "deja-geree": PresencePollution.DEJA_GEREE,
  };
  return mapping[value || ""] || PresencePollution.NE_SAIT_PAS;
}

/**
 * Convertit une string en ValeurArchitecturale
 */
export function toValeurArchitecturale(value: string | undefined): ValeurArchitecturale {
  const mapping: Record<string, ValeurArchitecturale> = {
    EXCEPTIONNEL: ValeurArchitecturale.EXCEPTIONNEL,
    exceptionnel: ValeurArchitecturale.EXCEPTIONNEL,
    INTERET_FORT: ValeurArchitecturale.INTERET_FORT,
    "interet-fort": ValeurArchitecturale.INTERET_FORT,
    ordinaire: ValeurArchitecturale.ORDINAIRE,
    "banal-infra-ordinaire": ValeurArchitecturale.BANAL_INFRA_ORDINAIRE,
    "sans-interet": ValeurArchitecturale.SANS_INTERET,
  };
  return mapping[value || ""] || ValeurArchitecturale.NE_SAIT_PAS;
}

/**
 * Convertit une string en QualitePaysage
 */
export function toQualitePaysage(value: string | undefined): QualitePaysage {
  const mapping: Record<string, QualitePaysage> = {
    INTERESSANT: QualitePaysage.INTERESSANT,
    interessant: QualitePaysage.INTERESSANT,
    remarquable: QualitePaysage.REMARQUABLE,
    "quotidien-ordinaire": QualitePaysage.QUOTIDIEN_ORDINAIRE,
    "banal-infra-ordinaire": QualitePaysage.BANAL_INFRA_ORDINAIRE,
    degrade: QualitePaysage.DEGRADE,
  };
  return mapping[value || ""] || QualitePaysage.NE_SAIT_PAS;
}

/**
 * Convertit une string en QualiteVoieDesserte
 */
export function toQualiteVoieDesserte(value: string | undefined): QualiteVoieDesserte {
  const mapping: Record<string, QualiteVoieDesserte> = {
    ACCESSIBLE: QualiteVoieDesserte.ACCESSIBLE,
    accessible: QualiteVoieDesserte.ACCESSIBLE,
    PEU_ACCESSIBLE: QualiteVoieDesserte.PEU_ACCESSIBLE,
    "peu-accessible": QualiteVoieDesserte.PEU_ACCESSIBLE,
    degradee: QualiteVoieDesserte.DEGRADEE,
  };
  return mapping[value || ""] || QualiteVoieDesserte.NE_SAIT_PAS;
}
