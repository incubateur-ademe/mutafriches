import type { Coordonnees, GeometrieParcelle, LigneExportCnig } from "@mutafriches/shared-types";
import { COLONNES_EXTENSION_MUTAFRICHES, COLONNES_FRICHE_CNIG } from "@mutafriches/shared-types";

/** Une friche prête à sérialiser : ses attributs CNIG et sa géométrie d'origine (GeoJSON). */
export interface EntreeExportCnig {
  ligne: LigneExportCnig;
  geometrie?: GeometrieParcelle;
  coordonnees?: Coordonnees;
}

/** Excel n'interprète l'UTF-8 d'un CSV qu'en présence du BOM. */
const BOM_UTF8 = "﻿";

/** RFC 4180 : les enregistrements sont séparés par CRLF. */
const FIN_DE_LIGNE = "\r\n";

const CARACTERES_A_ECHAPPER = /[",\r\n]/;

// Un tableur interprète une cellule commençant par ces caractères comme une formule.
// Les noms de site étant éditables par les utilisateurs, on désamorce à l'écriture.
const DEBUTS_DE_FORMULE = /^[=+\-@\t\r]/;

function neutraliserFormule(valeur: string): string {
  return DEBUTS_DE_FORMULE.test(valeur) ? `'${valeur}` : valeur;
}

function cellule(valeur: string | number | null | undefined): string {
  if (valeur === null || valeur === undefined) return "";
  if (typeof valeur === "number") return Number.isFinite(valeur) ? valeur.toString() : "";

  const texte = neutraliserFormule(valeur);
  if (!CARACTERES_A_ECHAPPER.test(texte)) return texte;
  return `"${texte.replace(/"/g, '""')}"`;
}

function colonnes(inclureMutabilite: boolean): readonly string[] {
  return inclureMutabilite
    ? [...COLONNES_FRICHE_CNIG, ...COLONNES_EXTENSION_MUTAFRICHES]
    : COLONNES_FRICHE_CNIG;
}

/**
 * Fichier d'échange CSV du standard CNIG : séparateur virgule et encodage UTF-8, comme le
 * fichier de référence `cnigfr/schema-friches`. Sans l'extension Mutafriches, le fichier est
 * validable tel quel sur validata.fr.
 */
export function versCsv(entrees: EntreeExportCnig[], inclureMutabilite = false): string {
  const entetes = colonnes(inclureMutabilite);
  const lignes = entrees.map((entree) =>
    entetes.map((colonne) => cellule(entree.ligne[colonne as keyof LigneExportCnig])).join(","),
  );

  return BOM_UTF8 + [entetes.join(","), ...lignes].join(FIN_DE_LIGNE) + FIN_DE_LIGNE;
}

/**
 * Même modèle au format GeoJSON (RFC 7946, donc en `[longitude, latitude]` et en WGS84).
 * L'emprise surfacique sert de géométrie quand elle est connue, le centroïde sinon — les
 * deux primitives graphiques prévues par le standard. `geompoint` et `geomsurf` sont alors
 * omis des propriétés : la géométrie du Feature les porte déjà.
 */
export function versGeoJson(
  entrees: EntreeExportCnig[],
  nom: string,
  inclureMutabilite = false,
): string {
  const entetes = colonnes(inclureMutabilite).filter(
    (colonne) => colonne !== "geompoint" && colonne !== "geomsurf",
  );

  const features = entrees.map((entree) => {
    const properties: Record<string, string | number | null> = {};
    for (const colonne of entetes) {
      properties[colonne] = entree.ligne[colonne as keyof LigneExportCnig] ?? null;
    }

    const geometry: GeometrieParcelle | { type: "Point"; coordinates: number[] } | null =
      entree.geometrie ??
      (entree.coordonnees
        ? {
            type: "Point" as const,
            coordinates: [entree.coordonnees.longitude, entree.coordonnees.latitude],
          }
        : null);

    return { type: "Feature" as const, properties, geometry };
  });

  return JSON.stringify({ type: "FeatureCollection", name: nom, features }, null, 2);
}

/**
 * Nom de fichier : `friches-cnig-<slug>-<AAAAMMJJ>[-etendu].<ext>`.
 *
 * Le nom part dans un en-tête `Content-Disposition` : on n'y laisse que des caractères de
 * slug, pour qu'aucune valeur inattendue ne puisse casser l'en-tête.
 */
export function nomFichierExport(
  slug: string,
  format: "csv" | "geojson",
  inclureMutabilite: boolean,
  date: Date = new Date(),
): string {
  const slugSur =
    slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 50) || "partenaire";
  const jour = date.toISOString().slice(0, 10).replace(/-/g, "");
  const suffixe = inclureMutabilite ? "-etendu" : "";
  return `friches-cnig-${slugSur}-${jour}${suffixe}.${format}`;
}
