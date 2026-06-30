import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  OrigineSitePartenaire,
  PartenaireOutputDto,
  PartenaireSiteOutputDto,
} from "@mutafriches/shared-types";
import { PartenaireRepository } from "./repositories/partenaire.repository";
import type { PartenaireSite } from "../shared/database/schemas/partenaire-sites.schema";

@Injectable()
export class PartenairesService {
  constructor(private readonly partenaireRepository: PartenaireRepository) {}

  async getPartenaire(slug: string): Promise<PartenaireOutputDto> {
    const partenaire = await this.partenaireRepository.findBySlug(slug);
    if (!partenaire) {
      throw new NotFoundException(`Partenaire introuvable : ${slug}`);
    }

    const sites = await this.partenaireRepository.findSites(slug);

    return {
      slug: partenaire.slug,
      nom: partenaire.nom,
      description: partenaire.description,
      departement: partenaire.departement,
      sites: sites.map((s) => this.toSiteDto(s)),
    };
  }

  // Renomme un site. nom vide => réinitialise au nom par défaut (null en base).
  async renommerSite(slug: string, id: string, nom: string): Promise<PartenaireSiteOutputDto> {
    const valeur = nom.trim() === "" ? null : nom.trim();
    const site = await this.partenaireRepository.renommerSite(slug, id, valeur);
    if (!site) {
      throw new NotFoundException(`Site introuvable : ${id}`);
    }
    return this.toSiteDto(site);
  }

  private toSiteDto(site: PartenaireSite): PartenaireSiteOutputDto {
    return {
      id: site.id,
      idtup: site.idtup,
      parcelles: site.parcelles as string[],
      commune: site.commune,
      codeInsee: site.codeInsee ?? undefined,
      nom: site.nom ?? undefined,
      nomDefaut: site.nomDefaut ?? undefined,
      origine: site.origine as OrigineSitePartenaire,
    };
  }
}
