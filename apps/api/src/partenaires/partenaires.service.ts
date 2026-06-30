import { createHash } from "node:crypto";
import { Injectable, NotFoundException } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import {
  isValidParcelId,
  normalizeParcelId,
  type AjouterSitePartenaireOutputDto,
  type OrigineSitePartenaire,
  type PartenaireOutputDto,
  type PartenaireSiteOutputDto,
} from "@mutafriches/shared-types";
import { PartenaireRepository } from "./repositories/partenaire.repository";
import { reverseRueProche } from "./ban-reverse.util";
import { EnrichissementService } from "../enrichissement/services/enrichissement.service";
import type { PartenaireSite } from "../shared/database/schemas/partenaire-sites.schema";

@Injectable()
export class PartenairesService {
  constructor(
    private readonly partenaireRepository: PartenaireRepository,
    private readonly enrichissementService: EnrichissementService,
  ) {}

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

  // Ajoute un site « custom » : valide les IDU, enrichit (commune + centroïde, réchauffe
  // le cache), dérive le nom par défaut (BAN), puis persiste. Idempotent par (slug, idtup).
  async ajouterSite(
    slug: string,
    parcellesBrutes: string[],
  ): Promise<AjouterSitePartenaireOutputDto> {
    const partenaire = await this.partenaireRepository.findBySlug(slug);
    if (!partenaire) {
      throw new NotFoundException(`Partenaire introuvable : ${slug}`);
    }

    const invalidIdpars: string[] = [];
    const valides: string[] = [];
    for (const brut of parcellesBrutes) {
      const id = brut.trim();
      if (!id) continue;
      if (isValidParcelId(id)) valides.push(normalizeParcelId(id));
      else invalidIdpars.push(id);
    }
    const parcelles = Array.from(new Set(valides));
    if (parcelles.length === 0) {
      return { site: null, invalidIdpars };
    }

    const idtup = this.deriverIdtup(parcelles);

    const existant = await this.partenaireRepository.findSiteByIdtup(slug, idtup);
    if (existant) {
      return { site: this.toSiteDto(existant), invalidIdpars };
    }

    // Enrichissement best-effort : commune + centroïde pour le nom par défaut.
    let commune = "Ajouts personnalisés";
    let codeInsee: string | null = null;
    let nomDefaut: string | null = null;
    try {
      const enr = await this.enrichissementService.enrichirSite(
        parcelles,
        undefined,
        undefined,
        true,
      );
      if (enr.commune) commune = enr.commune;
      if (enr.codeInsee) codeInsee = enr.codeInsee;
      if (enr.coordonnees) {
        nomDefaut = await reverseRueProche(enr.coordonnees.latitude, enr.coordonnees.longitude);
      }
    } catch {
      // On crée quand même le site ; nom par défaut et commune restent au repli.
    }

    const created = await this.partenaireRepository.insertSite({
      id: uuidv4(),
      partenaireSlug: slug,
      idtup,
      parcelles,
      commune,
      codeInsee,
      nomDefaut,
      origine: "custom",
    });

    return { site: this.toSiteDto(created), invalidIdpars };
  }

  // idtup stable : mono = identifiant cadastral ; multi = clé dérivée des parcelles triées.
  private deriverIdtup(parcelles: string[]): string {
    const triees = [...parcelles].sort();
    if (triees.length === 1) return triees[0];
    return `c-${createHash("sha256").update(triees.join("|")).digest("hex").slice(0, 16)}`;
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
