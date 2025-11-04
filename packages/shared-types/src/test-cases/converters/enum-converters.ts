import {
  EtatBatiInfrastructure,
  PresencePollution,
  QualitePaysage,
  QualiteVoieDesserte,
  RaccordementEau,
  TypeProprietaire,
  ValeurArchitecturale,
} from "../../evaluation";

/**
 * Convertit une string en valeur d'enum EtatBatiInfrastructure
 * Gère les formats kebab-case (test cases) et UPPER_SNAKE_CASE (enums)
 */
export function toEtatBati(value: string | undefined): EtatBatiInfrastructure {
  if (!value) return EtatBatiInfrastructure.NE_SAIT_PAS;

  const normalizedValue = value.toLowerCase().replace(/_/g, "-");

  const mapping: Record<string, EtatBatiInfrastructure> = {
    // Formats du test case (kebab-case)
    "batiments-heterogenes": EtatBatiInfrastructure.DEGRADATION_HETEROGENE,
    "batiments-homogenes": EtatBatiInfrastructure.DEGRADATION_MOYENNE,
    "absence-batiments": EtatBatiInfrastructure.DEGRADATION_INEXISTANTE,
    "degradation-tres-importante": EtatBatiInfrastructure.DEGRADATION_TRES_IMPORTANTE,
    "degradation-moyenne": EtatBatiInfrastructure.DEGRADATION_MOYENNE,
    "degradation-inexistante": EtatBatiInfrastructure.DEGRADATION_INEXISTANTE,
    "degradation-heterogene": EtatBatiInfrastructure.DEGRADATION_HETEROGENE,
    "ne-sait-pas": EtatBatiInfrastructure.NE_SAIT_PAS,
  };

  // Essayer d'abord avec la valeur normalisée
  if (mapping[normalizedValue]) {
    return mapping[normalizedValue];
  }

  // Essayer avec la valeur originale si c'est déjà un enum
  if (value === "DEGRADATION_HETEROGENE") return EtatBatiInfrastructure.DEGRADATION_HETEROGENE;
  if (value === "DEGRADATION_TRES_IMPORTANTE")
    return EtatBatiInfrastructure.DEGRADATION_TRES_IMPORTANTE;
  if (value === "DEGRADATION_MOYENNE") return EtatBatiInfrastructure.DEGRADATION_MOYENNE;
  if (value === "DEGRADATION_INEXISTANTE") return EtatBatiInfrastructure.DEGRADATION_INEXISTANTE;
  if (value === "NE_SAIT_PAS") return EtatBatiInfrastructure.NE_SAIT_PAS;

  return EtatBatiInfrastructure.NE_SAIT_PAS;
}

/**
 * Convertit une string en valeur d'enum TypeProprietaire
 */
export function toTypeProprietaire(value: string | undefined): TypeProprietaire {
  if (!value) return TypeProprietaire.NE_SAIT_PAS;

  const normalizedValue = value.toLowerCase().replace(/_/g, "-");

  const mapping: Record<string, TypeProprietaire> = {
    // Formats test case (kebab-case et lowercase)
    public: TypeProprietaire.PUBLIC,
    prive: TypeProprietaire.PRIVE,
    mixte: TypeProprietaire.MIXTE,
    "copro-indivision": TypeProprietaire.COPRO_INDIVISION,
    "ne-sait-pas": TypeProprietaire.NE_SAIT_PAS,
  };

  // Essayer avec la valeur normalisée
  if (mapping[normalizedValue]) {
    return mapping[normalizedValue];
  }

  // Essayer avec la valeur originale si c'est déjà un enum
  if (value === "PUBLIC") return TypeProprietaire.PUBLIC;
  if (value === "PRIVE") return TypeProprietaire.PRIVE;
  if (value === "MIXTE") return TypeProprietaire.MIXTE;
  if (value === "COPRO_INDIVISION") return TypeProprietaire.COPRO_INDIVISION;
  if (value === "NE_SAIT_PAS") return TypeProprietaire.NE_SAIT_PAS;

  return TypeProprietaire.NE_SAIT_PAS;
}

/**
 * Convertit un booléen ou string en RaccordementEau
 */
export function toRaccordementEau(value: boolean | string | undefined): RaccordementEau {
  if (typeof value === "boolean") {
    return value ? RaccordementEau.OUI : RaccordementEau.NON;
  }

  if (!value) return RaccordementEau.NE_SAIT_PAS;

  const normalizedValue = value.toString().toLowerCase();

  const mapping: Record<string, RaccordementEau> = {
    // Formats test case et bool string
    oui: RaccordementEau.OUI,
    non: RaccordementEau.NON,
    true: RaccordementEau.OUI,
    false: RaccordementEau.NON,
    "ne-sait-pas": RaccordementEau.NE_SAIT_PAS,
  };

  if (mapping[normalizedValue]) {
    return mapping[normalizedValue];
  }

  // Essayer avec la valeur originale si c'est déjà un enum
  if (value === "OUI") return RaccordementEau.OUI;
  if (value === "NON") return RaccordementEau.NON;
  if (value === "NE_SAIT_PAS") return RaccordementEau.NE_SAIT_PAS;

  return RaccordementEau.NE_SAIT_PAS;
}

/**
 * Convertit une string en PresencePollution
 */
export function toPresencePollution(value: string | undefined): PresencePollution {
  if (!value) return PresencePollution.NE_SAIT_PAS;

  const normalizedValue = value.toLowerCase().replace(/_/g, "-");

  const mapping: Record<string, PresencePollution> = {
    // Formats test case (kebab-case)
    non: PresencePollution.NON,
    "oui-autres-composes": PresencePollution.OUI_AUTRES_COMPOSES,
    "oui-composes-volatils": PresencePollution.OUI_COMPOSES_VOLATILS,
    "oui-hydrocarbures": PresencePollution.OUI_COMPOSES_VOLATILS, // Hydrocarbures = composés volatils
    "deja-geree": PresencePollution.DEJA_GEREE,
    "ne-sait-pas": PresencePollution.NE_SAIT_PAS,
  };

  if (mapping[normalizedValue]) {
    return mapping[normalizedValue];
  }

  // Essayer avec la valeur originale si c'est déjà un enum
  if (value === "NON") return PresencePollution.NON;
  if (value === "OUI_AUTRES_COMPOSES") return PresencePollution.OUI_AUTRES_COMPOSES;
  if (value === "OUI_COMPOSES_VOLATILS") return PresencePollution.OUI_COMPOSES_VOLATILS;
  if (value === "DEJA_GEREE") return PresencePollution.DEJA_GEREE;
  if (value === "NE_SAIT_PAS") return PresencePollution.NE_SAIT_PAS;

  return PresencePollution.NE_SAIT_PAS;
}

/**
 * Convertit une string en ValeurArchitecturale
 */
export function toValeurArchitecturale(value: string | undefined): ValeurArchitecturale {
  if (!value) return ValeurArchitecturale.NE_SAIT_PAS;

  const normalizedValue = value.toLowerCase().replace(/_/g, "-");

  const mapping: Record<string, ValeurArchitecturale> = {
    // Formats test case (kebab-case)
    "sans-interet": ValeurArchitecturale.SANS_INTERET,
    ordinaire: ValeurArchitecturale.ORDINAIRE,
    "interet-remarquable": ValeurArchitecturale.INTERET_REMARQUABLE,
    "ne-sait-pas": ValeurArchitecturale.NE_SAIT_PAS,
  };

  if (mapping[normalizedValue]) {
    return mapping[normalizedValue];
  }

  // Essayer avec la valeur originale si c'est déjà un enum
  if (value === "INTERET_REMARQUABLE") return ValeurArchitecturale.INTERET_REMARQUABLE;
  if (value === "ORDINAIRE") return ValeurArchitecturale.ORDINAIRE;
  if (value === "SANS_INTERET") return ValeurArchitecturale.SANS_INTERET;
  if (value === "NE_SAIT_PAS") return ValeurArchitecturale.NE_SAIT_PAS;

  return ValeurArchitecturale.NE_SAIT_PAS;
}

/**
 * Convertit une string en QualitePaysage
 */
export function toQualitePaysage(value: string | undefined): QualitePaysage {
  if (!value) return QualitePaysage.NE_SAIT_PAS;

  const normalizedValue = value.toLowerCase().replace(/_/g, "-");

  const mapping: Record<string, QualitePaysage> = {
    // Formats test case (kebab-case)
    "sans-interet": QualitePaysage.SANS_INTERET,
    ordinaire: QualitePaysage.ORDINAIRE,
    "interet-remarquable": QualitePaysage.INTERET_REMARQUABLE,
    "ne-sait-pas": QualitePaysage.NE_SAIT_PAS,
  };

  if (mapping[normalizedValue]) {
    return mapping[normalizedValue];
  }

  // Essayer avec la valeur originale si c'est déjà un enum
  if (value === "INTERET_REMARQUABLE") return QualitePaysage.INTERET_REMARQUABLE;
  if (value === "ORDINAIRE") return QualitePaysage.ORDINAIRE;
  if (value === "SANS_INTERET") return QualitePaysage.SANS_INTERET;
  if (value === "NE_SAIT_PAS") return QualitePaysage.NE_SAIT_PAS;

  return QualitePaysage.NE_SAIT_PAS;
}

/**
 * Convertit une string en QualiteVoieDesserte
 */
export function toQualiteVoieDesserte(value: string | undefined): QualiteVoieDesserte {
  if (!value) return QualiteVoieDesserte.NE_SAIT_PAS;

  const normalizedValue = value.toLowerCase().replace(/_/g, "-");

  const mapping: Record<string, QualiteVoieDesserte> = {
    // Formats test case (kebab-case)
    accessible: QualiteVoieDesserte.ACCESSIBLE,
    "peu-accessible": QualiteVoieDesserte.PEU_ACCESSIBLE,
    degradee: QualiteVoieDesserte.DEGRADEE,
    "ne-sait-pas": QualiteVoieDesserte.NE_SAIT_PAS,
  };

  if (mapping[normalizedValue]) {
    return mapping[normalizedValue];
  }

  // Essayer avec la valeur originale si c'est déjà un enum
  if (value === "ACCESSIBLE") return QualiteVoieDesserte.ACCESSIBLE;
  if (value === "PEU_ACCESSIBLE") return QualiteVoieDesserte.PEU_ACCESSIBLE;
  if (value === "DEGRADEE") return QualiteVoieDesserte.DEGRADEE;
  if (value === "NE_SAIT_PAS") return QualiteVoieDesserte.NE_SAIT_PAS;

  return QualiteVoieDesserte.NE_SAIT_PAS;
}
