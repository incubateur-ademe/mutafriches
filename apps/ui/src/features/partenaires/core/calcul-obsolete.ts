import { CRITERES_METADATA_LIST, type EnrichissementOutputDto } from "@mutafriches/shared-types";

// Données automatiques et version sur lesquelles une mutabilité a été calculée (ADR-0045).
export interface ContexteCalcul {
  date: string; // ISO
  versionAlgorithme?: string;
  criteres: Record<string, unknown>;
}

export interface EcartCalcul {
  // Libellés des critères dont la valeur a changé ou est devenue disponible
  criteresModifies: string[];
  // Critères disponibles au calcul, indisponibles aujourd'hui (panne de source probable)
  criteresIndisponibles: string[];
  versionChangee: boolean;
  // Calcul antérieur au suivi : impossible de savoir ce qui a changé
  contexteInconnu: boolean;
}

// JSON perd `undefined` : sans marqueur, « indisponible » et « absent » se confondraient.
const INDISPONIBLE = "__indisponible__";

const CRITERES_AUTOMATIQUES = CRITERES_METADATA_LIST.filter((c) => c.saisie === "AUTOMATIQUE");

export function contexteCalcul(
  enrichissement: EnrichissementOutputDto,
  versionAlgorithme: string | undefined,
  date: Date = new Date(),
): ContexteCalcul {
  const donnees = enrichissement as unknown as Record<string, unknown>;
  const criteres: Record<string, unknown> = {};
  for (const { key } of CRITERES_AUTOMATIQUES) {
    criteres[key] = donnees[key] === undefined ? INDISPONIBLE : donnees[key];
  }
  return { date: date.toISOString(), versionAlgorithme: versionAlgorithme || undefined, criteres };
}

// null : le calcul correspond toujours aux données du jour.
export function ecartCalcul(
  contexte: ContexteCalcul | undefined,
  enrichissement: EnrichissementOutputDto,
  versionCourante: string | undefined,
): EcartCalcul | null {
  if (!contexte) {
    return {
      criteresModifies: [],
      criteresIndisponibles: [],
      versionChangee: false,
      contexteInconnu: true,
    };
  }

  const actuel = contexteCalcul(enrichissement, versionCourante).criteres;
  const criteresModifies: string[] = [];
  const criteresIndisponibles: string[] = [];
  for (const { key, label } of CRITERES_AUTOMATIQUES) {
    // Critère ajouté depuis le calcul : absent du contexte, donc inconnu à l'époque
    const avant = key in contexte.criteres ? contexte.criteres[key] : INDISPONIBLE;
    const maintenant = actuel[key];
    if (JSON.stringify(avant) === JSON.stringify(maintenant)) continue;
    if (maintenant === INDISPONIBLE) criteresIndisponibles.push(label);
    else criteresModifies.push(label);
  }

  const versionChangee = Boolean(
    contexte.versionAlgorithme && versionCourante && contexte.versionAlgorithme !== versionCourante,
  );

  if (criteresModifies.length === 0 && criteresIndisponibles.length === 0 && !versionChangee) {
    return null;
  }
  return { criteresModifies, criteresIndisponibles, versionChangee, contexteInconnu: false };
}

// Recalculer n'a de sens que si les données ont réellement évolué : sur une simple panne de
// source, le recalcul dégraderait un résultat plus complet.
export function recalculConseille(ecart: EcartCalcul): boolean {
  return ecart.contexteInconnu || ecart.versionChangee || ecart.criteresModifies.length > 0;
}
