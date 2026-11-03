import {
  AVERTISSEMENT_SAISIE_DECLARATIVE,
  CHAMPS_COMPLEMENTAIRES_REQUIS,
  UsageType,
  type SiteAttributaireDto,
  type TableAttributaireOutputDto,
} from "@mutafriches/shared-types";
import type { AttributaireSite } from "../shared/database/schemas/attributaire-sites.schema";
import type { SitesAttributairesCommune } from "./attributaire.service";
import { CLES_CRITERES_AUTOMATIQUES } from "./attributaire.utils";

interface FeatureAttributaire {
  type: "Feature";
  geometry: unknown;
  properties: Record<string, unknown>;
}

export interface FeatureCollectionAttributaire {
  type: "FeatureCollection";
  name: string;
  avertissement: string;
  features: FeatureAttributaire[];
}

function versNombre(valeur: string | null): number | undefined {
  return valeur === null ? undefined : Number(valeur);
}

export function versSiteAttributaireDto(ligne: AttributaireSite): SiteAttributaireDto {
  const latitude = versNombre(ligne.centroidLatitude);
  const longitude = versNombre(ligne.centroidLongitude);

  return {
    cleSite: ligne.cleSite,
    parcelles: ligne.identifiantsCadastraux,
    nombreParcelles: ligne.nombreParcelles,
    parcellePredominante: ligne.parcellePredominante ?? undefined,
    codeInsee: ligne.codeInsee,
    commune: ligne.commune ?? undefined,
    nom: ligne.nom ?? undefined,
    partenaire: ligne.partenaireSlug ?? undefined,
    centroide:
      latitude !== undefined && longitude !== undefined ? { latitude, longitude } : undefined,
    criteresAutomatiques: ligne.criteresAutomatiques,
    dateEnrichissement: ligne.dateEnrichissement.toISOString(),
    saisieDeclarative: ligne.criteresSaisis !== null,
    criteresSaisis: ligne.criteresSaisis,
    dateSaisie: ligne.dateSaisie?.toISOString(),
    nombreEvaluations: ligne.nombreEvaluations,
    mutabilite: ligne.mutabilite,
    versionAlgorithme: ligne.versionAlgorithme,
    dateMiseAJour: ligne.dateMiseAJour.toISOString(),
  };
}

export function versTableAttributaire(
  resultat: SitesAttributairesCommune,
  dateGeneration: Date,
): TableAttributaireOutputDto {
  return {
    codeInsee: resultat.codeInsee,
    commune: resultat.commune,
    dateGeneration: dateGeneration.toISOString(),
    avertissement: AVERTISSEMENT_SAISIE_DECLARATIVE,
    nombreSites: resultat.lignes.length,
    sites: resultat.lignes.map(versSiteAttributaireDto),
  };
}

// Mêmes colonnes pour toutes les entités : un SIG fige le schéma sur la première lue
const COLONNES_AUTOMATIQUES = [...CLES_CRITERES_AUTOMATIQUES, "raccordementEau"];

// Attributs à plat, une colonne par critère et par usage : c'est ce qu'attend un SIG.
function proprietesAPlat(site: SiteAttributaireDto): Record<string, unknown> {
  const proprietes: Record<string, unknown> = {
    cle_site: site.cleSite,
    parcelles: site.parcelles.join("|"),
    nombre_parcelles: site.nombreParcelles,
    parcelle_predominante: site.parcellePredominante ?? null,
    code_insee: site.codeInsee,
    commune: site.commune ?? null,
    nom: site.nom ?? null,
    partenaire: site.partenaire ?? null,
  };

  // À plat, « indisponible » et « sans résultat » se confondent en null ; le JSON les distingue
  for (const colonne of COLONNES_AUTOMATIQUES) {
    proprietes[colonne] = site.criteresAutomatiques[colonne] ?? null;
  }
  proprietes.date_enrichissement = site.dateEnrichissement;
  proprietes.saisie_declarative = site.saisieDeclarative;

  for (const champ of CHAMPS_COMPLEMENTAIRES_REQUIS) {
    proprietes[champ] = site.criteresSaisis?.[champ] ?? "ne-sait-pas";
  }
  proprietes.date_saisie = site.dateSaisie ?? null;
  proprietes.nombre_evaluations = site.nombreEvaluations;

  for (const usage of Object.values(UsageType)) {
    proprietes[`indice_${usage}`] = site.mutabilite.indices[usage] ?? null;
  }
  proprietes.usage_prioritaire = site.mutabilite.usagePrioritaire ?? null;
  proprietes.usages_exclus = site.mutabilite.usagesExclus.join("|");
  proprietes.fiabilite = site.mutabilite.fiabilite.note;
  proprietes.fiabilite_niveau = site.mutabilite.fiabilite.niveau;
  proprietes.version_algorithme = site.versionAlgorithme;
  proprietes.date_mise_a_jour = site.dateMiseAJour;

  return proprietes;
}

export function versGeoJsonAttributaire(
  resultat: SitesAttributairesCommune,
  dateGeneration: Date,
): FeatureCollectionAttributaire {
  const table = versTableAttributaire(resultat, dateGeneration);

  return {
    type: "FeatureCollection",
    name: `mutafriches-attributaire-${table.codeInsee}`,
    avertissement: table.avertissement,
    features: resultat.lignes.map((ligne, index) => {
      const site = table.sites[index];
      // Sans emprise, le centroïde garde le site visible sur une carte
      const geometry =
        ligne.geometrie ??
        (site.centroide
          ? { type: "Point", coordinates: [site.centroide.longitude, site.centroide.latitude] }
          : null);
      return { type: "Feature", geometry, properties: proprietesAPlat(site) };
    }),
  };
}
