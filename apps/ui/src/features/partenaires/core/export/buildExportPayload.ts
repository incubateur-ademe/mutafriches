import { type ExportCnigInputDto, type FormatExportCnig } from "@mutafriches/shared-types";
import { buildDonneesComplementaires } from "@features/resultats/utils/mutability.mapper";
import type { SaisieSite } from "../hooks/useSiteUserData";

interface OptionsExport {
  format: FormatExportCnig;
  inclureMutabilite: boolean;
}

const aUneSaisie = (manualData: Record<string, string>): boolean =>
  Object.values(manualData).some((valeur) => valeur && valeur !== "");

/**
 * Construit le corps de la requête d'export.
 *
 * Seuls les sites réellement qualifiés dans ce navigateur sont transmis : la charge utile
 * suit le nombre de sites saisis, pas le nombre de sites du partenaire (316 pour la DDT des
 * Vosges), et reste sous la limite de taille du corps de requête.
 *
 * La mutabilité n'est pas transmise : le serveur la recalcule sur l'enrichissement du jour,
 * la copie locale pouvant dater d'un autre enrichissement (ADR-0045).
 */
export function buildExportPayload(
  saisies: SaisieSite[],
  { format, inclureMutabilite }: OptionsExport,
): ExportCnigInputDto {
  const payload: ExportCnigInputDto = { format, inclureMutabilite };

  const connaissanceTerrain: ExportCnigInputDto["connaissanceTerrain"] = {};
  for (const saisie of saisies) {
    if (aUneSaisie(saisie.manualData)) {
      connaissanceTerrain[saisie.idtup] = buildDonneesComplementaires(saisie.manualData);
    }
  }
  if (Object.keys(connaissanceTerrain).length > 0) {
    payload.connaissanceTerrain = connaissanceTerrain;
  }

  return payload;
}
