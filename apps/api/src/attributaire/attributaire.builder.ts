import {
  resumerMutabilite,
  type DonneesComplementairesInputDto,
  type EnrichissementOutputDto,
  type MutabiliteAttributaire,
  type MutabiliteOutputDto,
} from "@mutafriches/shared-types";
import { Site } from "../evaluation/entities/site.entity";
import { CalculService } from "../evaluation/services/calcul.service";
import { VERSION_COURANTE } from "../evaluation/services/algorithme/versions";
import type { NewAttributaireSite } from "../shared/database/schemas/attributaire-sites.schema";
import {
  CLES_CRITERES_AUTOMATIQUES,
  DONNEES_COMPLEMENTAIRES_NE_SAIT_PAS,
  extraireCriteresSaisis,
} from "./attributaire.utils";

export interface SourcesSiteAttributaire {
  /** Parcelles normalisées et triées */
  parcelles: string[];
  enrichissement: { donnees: EnrichissementOutputDto; date: Date };
  saisie?: { donnees: DonneesComplementairesInputDto; date: Date; evaluationId: string };
  nombreEvaluations: number;
  partenaire?: { slug: string; idtup: string; nom?: string };
}

export type LigneAttributaire = { ligne: NewAttributaireSite } | { motif: string };

export function resumerPourAttributaire(mutabilite: MutabiliteOutputDto): MutabiliteAttributaire {
  const resume = resumerMutabilite(mutabilite);
  return {
    indices: resume.indices,
    usagePrioritaire: resume.usagePrioritaire,
    usagesExclus: mutabilite.resultats.filter((r) => r.exclu).map((r) => r.usage),
    fiabilite: { note: mutabilite.fiabilite.note, niveau: mutabilite.fiabilite.text },
  };
}

function criteresAutomatiques(
  enrichissement: EnrichissementOutputDto,
  site: Site,
): Record<string, unknown> {
  const source = enrichissement as unknown as Record<string, unknown>;
  const criteres: Record<string, unknown> = {};
  for (const cle of CLES_CRITERES_AUTOMATIQUES) {
    // `undefined` (donnée indisponible) est omis, `null` (recherche sans résultat) conservé
    if (source[cle] !== undefined) criteres[cle] = source[cle];
  }
  // Critère manuel par nature, mais dérivé de la surface bâtie depuis l'ADR-0019
  criteres.raccordementEau = site.raccordementEau;
  return criteres;
}

// Mutabilité calculée avec la saisie si elle existe, sinon « ne sait pas » partout.
export async function construireLigneAttributaire(
  sources: SourcesSiteAttributaire,
  calculService: CalculService,
): Promise<LigneAttributaire> {
  const { donnees: enrichissement } = sources.enrichissement;
  if (!enrichissement.codeInsee) {
    return { motif: "Enrichissement sans code INSEE" };
  }

  const criteresSaisis = extraireCriteresSaisis(sources.saisie?.donnees);
  const complementaires = {
    ...DONNEES_COMPLEMENTAIRES_NE_SAIT_PAS,
    ...criteresSaisis,
  } as DonneesComplementairesInputDto;

  const site = Site.fromEnrichissement(enrichissement, complementaires);
  const champsManquants = site.champsEssentielsManquants();
  if (champsManquants.length > 0) {
    return { motif: `Enrichissement incomplet : ${champsManquants.join(", ")}` };
  }

  const mutabilite = resumerPourAttributaire(await calculService.calculer(site));
  const { coordonnees } = enrichissement;

  return {
    ligne: {
      cleSite: sources.parcelles.join(","),
      identifiantsCadastraux: sources.parcelles,
      nombreParcelles: sources.parcelles.length,
      parcellePredominante:
        enrichissement.parcellePredominante ??
        (sources.parcelles.length === 1 ? sources.parcelles[0] : null),
      codeInsee: enrichissement.codeInsee,
      commune: enrichissement.commune ?? null,
      partenaireSlug: sources.partenaire?.slug ?? null,
      partenaireIdtup: sources.partenaire?.idtup ?? null,
      nom: sources.partenaire?.nom ?? null,
      centroidLatitude: coordonnees ? String(coordonnees.latitude) : null,
      centroidLongitude: coordonnees ? String(coordonnees.longitude) : null,
      geometrie: enrichissement.geometrieSite ?? enrichissement.geometrie ?? null,
      criteresAutomatiques: criteresAutomatiques(enrichissement, site),
      dateEnrichissement: sources.enrichissement.date,
      criteresSaisis,
      dateSaisie: criteresSaisis ? (sources.saisie?.date ?? null) : null,
      evaluationId: sources.saisie?.evaluationId ?? null,
      nombreEvaluations: sources.nombreEvaluations,
      mutabilite,
      fiabilite: String(mutabilite.fiabilite.note),
      usagePrioritaire: mutabilite.usagePrioritaire ?? null,
      versionAlgorithme: VERSION_COURANTE,
      dateMiseAJour: new Date(),
    },
  };
}
