import type { UsageResultatDetaille } from "@mutafriches/shared-types";
import { getUsageInfo } from "../utils/usagesLabels.utils";
import type { ResultatsExportData } from "./types";

/**
 * Construit l'objet d'export JSON, auto-descriptif et reproductible
 * (versionAlgorithme via donneesEnrichies/complementaires + evaluationId).
 */
export function buildResultatsJson(data: ResultatsExportData): Record<string, unknown> {
  const { mutabilite, enrichissement, complementaires, site } = data;
  const f = mutabilite.fiabilite;

  return {
    meta: {
      source: "Mutafriches",
      formatVersion: 1,
      exporteLe: new Date().toISOString(),
      evaluationId: mutabilite.evaluationId,
    },
    site: {
      identifiant: site.identifiant,
      commune: site.commune ?? enrichissement?.commune,
      codeInsee: enrichissement?.codeInsee,
      nombreParcelles: site.nombreParcelles,
      surfaceM2: site.surfaceM2,
      coordonnees: enrichissement?.coordonnees,
    },
    fiabilite: {
      note: f.note,
      niveau: f.text,
      criteresRenseignes: f.criteresRenseignes,
      criteresTotal: f.criteresTotal,
      poidsRenseignes: f.poidsRenseignes,
      poidsTotal: f.poidsTotal,
    },
    resultats: mutabilite.resultats.map((r) => {
      const d = r as UsageResultatDetaille;
      return {
        usage: r.usage,
        libelle: getUsageInfo(r.usage).label,
        rang: r.rang,
        indiceMutabilite: r.indiceMutabilite,
        potentiel: r.potentiel,
        avantages: d.avantages,
        contraintes: d.contraintes,
      };
    }),
    donneesComplementaires: complementaires,
    donneesEnrichies: enrichissement,
  };
}
