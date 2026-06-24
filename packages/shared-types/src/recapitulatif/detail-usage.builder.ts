import { EnrichissementOutputDto } from "../enrichissement";
import {
  DetailCritere,
  DonneesComplementairesInputDto,
  UsageResultatDetaille,
} from "../evaluation";
import { CRITERES_METADATA_LIST } from "./criteres.metadata";
import { DetailUsageSection } from "./detail-usage.types";
import { getImpactCritere } from "./impact.labels";
import { buildRecapitulatifSite } from "./recapitulatif.builder";
import { SECTIONS_RECAPITULATIF_TITRES, SectionRecapitulatifId } from "./recapitulatif.types";
import { VALEUR_NON_DISPONIBLE } from "./valeurs.labels";

type Enrichissement = EnrichissementOutputDto | undefined;
type Complementaires = Partial<DonneesComplementairesInputDto> | undefined;

/**
 * Construit le détail d'un usage : les critères groupés par section avec
 * valeur, pondération (poids) et impact (scoreBrut traduit en niveau).
 *
 * Les valeurs affichées sont résolues via le builder du récapitulatif (cohérence),
 * la pondération et l'impact proviennent du calcul détaillé de l'évaluation.
 *
 * Fonction pure : aucune I/O.
 */
export function buildDetailUsage(
  usage: UsageResultatDetaille | undefined,
  enrichissement: Enrichissement,
  complementaires?: Complementaires,
): DetailUsageSection[] {
  // Valeur affichée par critère (réutilise la résolution du récapitulatif)
  const valeurParCritere: Record<string, string> = {};
  for (const section of buildRecapitulatifSite(enrichissement, complementaires)) {
    for (const critere of section.criteres) {
      valeurParCritere[critere.key] = critere.valeurAffichee;
    }
  }

  // Détail de calcul (poids + scoreBrut) par critère pour cet usage
  const details: DetailCritere[] = [
    ...(usage?.detailsCalcul?.detailsAvantages ?? []),
    ...(usage?.detailsCalcul?.detailsContraintes ?? []),
    ...(usage?.detailsCalcul?.detailsCriteresVides ?? []),
  ];
  const detailParCritere = new Map<string, DetailCritere>();
  for (const detail of details) {
    detailParCritere.set(detail.critere, detail);
  }

  const sections: Record<SectionRecapitulatifId, DetailUsageSection> = {
    "site-bati": {
      id: "site-bati",
      titre: SECTIONS_RECAPITULATIF_TITRES["site-bati"],
      criteres: [],
    },
    environnement: {
      id: "environnement",
      titre: SECTIONS_RECAPITULATIF_TITRES.environnement,
      criteres: [],
    },
    "risques-zonages": {
      id: "risques-zonages",
      titre: SECTIONS_RECAPITULATIF_TITRES["risques-zonages"],
      criteres: [],
    },
  };

  for (const meta of CRITERES_METADATA_LIST) {
    const detail = detailParCritere.get(meta.key);
    if (!detail) continue; // critère absent du calcul de cet usage

    sections[meta.section].criteres.push({
      key: meta.key,
      label: meta.label,
      valeurAffichee: valeurParCritere[meta.key] ?? VALEUR_NON_DISPONIBLE,
      poids: detail.poids,
      impact: getImpactCritere(detail.scoreBrut),
    });
  }

  return Object.values(sections).filter((section) => section.criteres.length > 0);
}
