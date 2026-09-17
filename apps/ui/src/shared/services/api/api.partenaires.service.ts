import type {
  AjouterSitePartenaireInputDto,
  ExportCnigInputDto,
  RapportExportCnig,
  AjouterSitePartenaireOutputDto,
  PartenaireOutputDto,
  PartenaireSiteOutputDto,
  RenommerSitePartenaireInputDto,
} from "@mutafriches/shared-types";
import { apiClient } from "./api.client";
import { API_CONFIG } from "./api.config";

class PartenairesService {
  /** Récupère un partenaire et ses sites depuis la base. */
  async getPartenaire(slug: string): Promise<PartenaireOutputDto> {
    return apiClient.get<PartenaireOutputDto>(API_CONFIG.endpoints.partenaires.get(slug));
  }

  /** Ajoute un site (enrichit + dérive le nom par défaut + persiste). */
  async ajouterSite(slug: string, parcelles: string[]): Promise<AjouterSitePartenaireOutputDto> {
    const body: AjouterSitePartenaireInputDto = { parcelles };
    return apiClient.post<AjouterSitePartenaireOutputDto>(
      API_CONFIG.endpoints.partenaires.sites(slug),
      body,
    );
  }

  /**
   * Exporte tous les sites du partenaire au standard CNIG.
   * Le nom du fichier et le rapport (sites écartés) sont portés par les en-têtes de la réponse.
   */
  async exporterCnig(
    slug: string,
    options: ExportCnigInputDto,
  ): Promise<{ blob: Blob; nomFichier: string; rapport?: RapportExportCnig }> {
    const { blob, headers } = await apiClient.postFichier(
      API_CONFIG.endpoints.partenaires.export(slug),
      options,
    );

    return {
      blob,
      nomFichier: nomFichierDepuisEnTete(headers) ?? `friches-cnig-${slug}.${options.format}`,
      rapport: rapportDepuisEnTete(headers),
    };
  }

  /** Renomme un site (nom vide => repli sur le nom par défaut). */
  async renommerSite(slug: string, id: string, nom: string): Promise<PartenaireSiteOutputDto> {
    const body: RenommerSitePartenaireInputDto = { nom };
    return apiClient.patch<PartenaireSiteOutputDto>(
      API_CONFIG.endpoints.partenaires.renommerSite(slug, id),
      body,
    );
  }
}

// Le rapport voyage en base64 : un en-tête HTTP ne transporte pas d'UTF-8 (noms de communes).
function rapportDepuisEnTete(headers: Headers): RapportExportCnig | undefined {
  const encode = headers.get("X-Export-Rapport");
  if (!encode) return undefined;

  try {
    const json = new TextDecoder().decode(
      Uint8Array.from(atob(encode), (caractere) => caractere.charCodeAt(0)),
    );
    return JSON.parse(json) as RapportExportCnig;
  } catch {
    return undefined;
  }
}

function nomFichierDepuisEnTete(headers: Headers): string | undefined {
  const disposition = headers.get("Content-Disposition");
  return disposition?.match(/filename="([^"]+)"/)?.[1];
}

export const partenairesService = new PartenairesService();
