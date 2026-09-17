import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import {
  SourceUtilisation,
  construireExtensionMutafriches,
  construireFricheCnig,
  type EnrichissementOutputDto,
  type ExportCnigInputDto,
  type RapportExportCnig,
  type SiteEcarteExportCnig,
} from "@mutafriches/shared-types";
import { AppConfig } from "../../config";
import { EnrichissementService } from "../../enrichissement/services/enrichissement.service";
import type { PartenaireSite } from "../../shared/database/schemas/partenaire-sites.schema";
import { PartenaireRepository } from "../repositories/partenaire.repository";
import { nomFichierExport, versCsv, versGeoJson, type EntreeExportCnig } from "./cnig-serializer";

/** Nombre d'enrichissements menés de front quand le cache est froid. */
const CONCURRENCE = 4;

/**
 * Budget d'enrichissement à la volée. Le routeur Scalingo coupe une requête à 30 s : au-delà
 * du budget, les sites restants sont écartés et signalés plutôt que de faire échouer l'export.
 * En régime normal, le pré-chauffe quotidien rend ce chemin inutile.
 */
const BUDGET_ENRICHISSEMENT_MS = 20_000;

const NOM_SOURCE = "Mutafriches";
const CONTACT_SOURCE = "contact@mutafriches.beta.gouv.fr";

export interface FichierExportCnig {
  contenu: string;
  nomFichier: string;
  typeMime: string;
  rapport: RapportExportCnig;
}

/**
 * Export des sites d'un partenaire au standard CNIG Friches.
 *
 * L'export tourne côté serveur : exporter 316 sites depuis le navigateur dépasserait la
 * limite de 100 requêtes par minute du ThrottlerGuard. La connaissance terrain, elle, vit
 * dans le navigateur de l'utilisateur (ADR-0021) : elle est transmise dans la requête, lue
 * le temps de construire le fichier, et jamais persistée.
 */
@Injectable()
export class CnigExportService {
  private readonly logger = new Logger(CnigExportService.name);

  constructor(
    private readonly partenaireRepository: PartenaireRepository,
    private readonly enrichissementService: EnrichissementService,
    private readonly config: AppConfig,
  ) {}

  async exporter(slug: string, options: ExportCnigInputDto): Promise<FichierExportCnig> {
    const partenaire = await this.partenaireRepository.findBySlug(slug);
    if (!partenaire) {
      // Le slug demandé est journalisé, pas renvoyé : une réponse ne réexpose pas son entrée.
      this.logger.warn(`Export demandé pour un partenaire introuvable : ${slug}`);
      throw new NotFoundException("Partenaire introuvable");
    }

    // Tout ce qui ressort dans le fichier et ses en-têtes vient désormais de la base, jamais
    // du paramètre de route : un identifiant arbitraire ne peut pas se retrouver dans la réponse.
    const slugPartenaire = partenaire.slug;

    const sites = await this.partenaireRepository.findSites(slugPartenaire);
    const dateExport = new Date();
    const echeance = Date.now() + BUDGET_ENRICHISSEMENT_MS;

    const source = {
      nom: NOM_SOURCE,
      producteur: partenaire.nom,
      url: `${this.config.publicUrl}/partenaires/${slugPartenaire}`,
      contact: CONTACT_SOURCE,
    };

    const entrees: EntreeExportCnig[] = [];
    const sitesEcartes: SiteEcarteExportCnig[] = [];
    const inclureMutabilite = options.inclureMutabilite === true;

    await this.parLots(sites, async (site) => {
      const parcelles = site.parcelles as string[];
      const enrichissement = await this.resoudreEnrichissement(slugPartenaire, parcelles, echeance);

      const ligne = construireFricheCnig({
        site: {
          idtup: site.idtup,
          parcelles,
          nom: site.nom ?? site.nomDefaut ?? undefined,
          commune: site.commune,
          codeInsee: site.codeInsee ?? undefined,
          dateIdentification: site.createdAt,
        },
        enrichissement,
        complementaires: options.connaissanceTerrain?.[site.idtup],
        source,
        dateActualisation: dateExport,
      });

      if (!ligne) {
        sitesEcartes.push({
          idtup: site.idtup,
          commune: site.commune,
          motif: enrichissement
            ? "Enrichissement incomplet : commune ou centroïde manquant"
            : "Site non enrichi : données indisponibles au moment de l'export",
        });
        return;
      }

      const extension = inclureMutabilite
        ? construireExtensionMutafriches(
            options.mutabilite?.[site.idtup],
            options.versionAlgorithme,
          )
        : {};

      entrees.push({
        ligne: { ...ligne, ...extension },
        geometrie: enrichissement?.geometrieSite ?? enrichissement?.geometrie,
        coordonnees: enrichissement?.coordonnees,
      });
    });

    // La concurrence désordonne les résultats : on rétablit l'ordre commune puis identifiant.
    entrees.sort((a, b) =>
      `${a.ligne.comm_nom}${a.ligne.site_id}`.localeCompare(
        `${b.ligne.comm_nom}${b.ligne.site_id}`,
        "fr",
      ),
    );

    this.logger.log(
      `Export CNIG ${slugPartenaire} : ${entrees.length}/${sites.length} sites, ` +
        `format ${options.format}`,
    );

    return {
      contenu:
        options.format === "geojson"
          ? versGeoJson(entrees, `friches-${slugPartenaire}`, inclureMutabilite)
          : versCsv(entrees, inclureMutabilite),
      nomFichier: nomFichierExport(slugPartenaire, options.format, inclureMutabilite, dateExport),
      typeMime:
        options.format === "geojson"
          ? "application/geo+json; charset=utf-8"
          : "text/csv; charset=utf-8",
      rapport: {
        sitesTotal: sites.length,
        sitesExportes: entrees.length,
        sitesEcartes,
      },
    };
  }

  /**
   * Cache d'abord (lecture seule, sans journalisation). En cas de miss et tant que le budget
   * le permet, enrichissement complet marqué `PREFETCH` : c'est un pré-chauffe de masse, et
   * le compter comme une qualification utilisateur fausserait les ratios d'usage (ADR-0041).
   *
   * L'enrichissement est borné par l'échéance : un appel lent ne doit pas emporter la requête
   * au-delà du budget. Il poursuit sa route en tâche de fond et réchauffe le cache pour le
   * prochain export.
   */
  private async resoudreEnrichissement(
    slug: string,
    parcelles: string[],
    echeance: number,
  ): Promise<EnrichissementOutputDto | undefined> {
    const cache = await this.enrichissementService.lireCacheSite(parcelles);
    if (cache) return cache;

    const restant = echeance - Date.now();
    if (restant <= 0) return undefined;

    const enrichissement = this.enrichissementService
      .enrichirSite(parcelles, SourceUtilisation.PREFETCH, `partenaire:${slug}`, true)
      .catch((erreur: unknown) => {
        const message = erreur instanceof Error ? erreur.message : "erreur inconnue";
        this.logger.warn(`Enrichissement impossible pour [${parcelles.join(",")}] : ${message}`);
        return undefined;
      });

    let minuteur: ReturnType<typeof setTimeout> | undefined;
    const echeanceAtteinte = new Promise<undefined>((resolve) => {
      minuteur = setTimeout(() => resolve(undefined), restant);
    });

    try {
      return await Promise.race([enrichissement, echeanceAtteinte]);
    } finally {
      clearTimeout(minuteur);
    }
  }

  // Traitement par lots : borne la charge sur les APIs externes quand le cache est froid.
  private async parLots(
    sites: PartenaireSite[],
    traiter: (site: PartenaireSite) => Promise<void>,
  ): Promise<void> {
    for (let debut = 0; debut < sites.length; debut += CONCURRENCE) {
      await Promise.all(sites.slice(debut, debut + CONCURRENCE).map(traiter));
    }
  }
}
