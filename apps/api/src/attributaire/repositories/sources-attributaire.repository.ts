import { Injectable } from "@nestjs/common";
import { and, eq, inArray, isNotNull, isNull, ne, sql, type SQL } from "drizzle-orm";
import {
  StatutEnrichissement,
  type DonneesComplementairesInputDto,
  type EnrichissementOutputDto,
} from "@mutafriches/shared-types";
import { DatabaseService } from "../../shared/database/database.service";
import { evaluations } from "../../shared/database/schemas/evaluations.schema";
import { sites } from "../../shared/database/schemas/sites.schema";
import { enrichissements } from "../../shared/database/schemas/enrichissements.schema";
import { partenaireSites } from "../../shared/database/schemas/partenaire-sites.schema";

export interface EvaluationSource {
  id: string;
  siteId: string;
  dateCalcul: Date;
  evaluationSourceId: string | null;
}

export interface EnrichissementSource {
  table: "sites" | "enrichissements";
  id: string;
  parcelles: string[];
  complet: boolean;
  date: Date;
}

export interface SitePartenaireSource {
  slug: string;
  idtup: string;
  parcelles: string[];
  nom: string | null;
}

function tableauTexte(valeurs: readonly string[]): SQL {
  return sql`ARRAY[${sql.join(
    valeurs.map((v) => sql`${v}`),
    sql`, `,
  )}]::text[]`;
}

// Même périmètre que Metabase : les évaluations de démonstration ne décrivent aucun site réel.
const EVALUATION_HORS_DEMO = sql`COALESCE(${evaluations.integrateur}, '') NOT IN ('demo', 'mutafriches')`;

/**
 * Lectures des tables qui alimentent la table attributaire. Les requêtes par site ramènent
 * des colonnes légères ; le service compare les clés normalisées, puis ne charge que le JSON
 * de la ligne retenue.
 */
@Injectable()
export class SourcesAttributaireRepository {
  constructor(private readonly database: DatabaseService) {}

  async evaluationsPartageantUneParcelle(
    variantes: readonly string[],
  ): Promise<EvaluationSource[]> {
    return this.database.db
      .select({
        id: evaluations.id,
        siteId: evaluations.siteId,
        dateCalcul: evaluations.dateCalcul,
        evaluationSourceId: evaluations.evaluationSourceId,
      })
      .from(evaluations)
      .where(
        and(
          sql`string_to_array(${evaluations.siteId}, ',') && ${tableauTexte(variantes)}`,
          EVALUATION_HORS_DEMO,
        ),
      );
  }

  async lireEvaluation(id: string): Promise<{
    donneesEnrichissement: EnrichissementOutputDto;
    donneesComplementaires: DonneesComplementairesInputDto;
  } | null> {
    const [ligne] = await this.database.db
      .select({
        donneesEnrichissement: evaluations.donneesEnrichissement,
        donneesComplementaires: evaluations.donneesComplementaires,
      })
      .from(evaluations)
      .where(eq(evaluations.id, id))
      .limit(1);

    if (!ligne) return null;
    return {
      donneesEnrichissement: ligne.donneesEnrichissement as EnrichissementOutputDto,
      donneesComplementaires: ligne.donneesComplementaires as DonneesComplementairesInputDto,
    };
  }

  /** Enrichissements d'origine (hors réutilisations du cache), échecs exclus. */
  async enrichissementsPartageantUneParcelle(
    variantes: readonly string[],
  ): Promise<EnrichissementSource[]> {
    const lignesSites = await this.database.db
      .select({
        id: sites.id,
        parcelles: sites.identifiantsCadastraux,
        statut: sites.statut,
        date: sites.dateEnrichissement,
      })
      .from(sites)
      .where(
        and(
          sql`${sites.identifiantsCadastraux} ?| ${tableauTexte(variantes)}`,
          isNotNull(sites.donnees),
          isNull(sites.siteSourceId),
          ne(sites.statut, StatutEnrichissement.ECHEC),
        ),
      );

    const lignesParcelles = await this.database.db
      .select({
        id: enrichissements.id,
        parcelle: enrichissements.identifiantCadastral,
        statut: enrichissements.statut,
        date: enrichissements.dateEnrichissement,
      })
      .from(enrichissements)
      .where(
        and(
          inArray(enrichissements.identifiantCadastral, [...variantes]),
          isNotNull(enrichissements.donnees),
          isNull(enrichissements.enrichissementSourceId),
          ne(enrichissements.statut, StatutEnrichissement.ECHEC),
        ),
      );

    return [
      ...lignesSites.map((l) => ({
        table: "sites" as const,
        id: l.id,
        parcelles: l.parcelles as string[],
        complet: l.statut === (StatutEnrichissement.SUCCES as string),
        date: l.date,
      })),
      ...lignesParcelles.map((l) => ({
        table: "enrichissements" as const,
        id: l.id,
        parcelles: [l.parcelle],
        complet: l.statut === (StatutEnrichissement.SUCCES as string),
        date: l.date,
      })),
    ];
  }

  async lireEnrichissement(source: EnrichissementSource): Promise<EnrichissementOutputDto | null> {
    const [ligne] =
      source.table === "sites"
        ? await this.database.db
            .select({ donnees: sites.donnees })
            .from(sites)
            .where(eq(sites.id, source.id))
            .limit(1)
        : await this.database.db
            .select({ donnees: enrichissements.donnees })
            .from(enrichissements)
            .where(eq(enrichissements.id, source.id))
            .limit(1);

    return (ligne?.donnees as EnrichissementOutputDto | null | undefined) ?? null;
  }

  async sitesPartenairesPartageantUneParcelle(
    variantes: readonly string[],
  ): Promise<SitePartenaireSource[]> {
    const lignes = await this.database.db
      .select({
        slug: partenaireSites.partenaireSlug,
        idtup: partenaireSites.idtup,
        parcelles: partenaireSites.parcelles,
        nom: partenaireSites.nom,
        nomDefaut: partenaireSites.nomDefaut,
      })
      .from(partenaireSites)
      .where(sql`${partenaireSites.parcelles} ?| ${tableauTexte(variantes)}`);

    return lignes.map((l) => ({
      slug: l.slug,
      idtup: l.idtup,
      parcelles: l.parcelles as string[],
      nom: l.nom ?? l.nomDefaut,
    }));
  }

  /** Ensembles de parcelles évalués ; `codeInsee` restreint à la commune prédominante. */
  async listerParcellesEvaluees(codeInsee?: string): Promise<string[][]> {
    const lignes = await this.database.db
      .selectDistinct({ siteId: evaluations.siteId })
      .from(evaluations)
      .where(
        and(EVALUATION_HORS_DEMO, codeInsee ? eq(evaluations.codeInsee, codeInsee) : undefined),
      );
    return lignes.map((l) => l.siteId.split(","));
  }

  /** Sites partenaires ; leur `code_insee` n'étant pas renseigné, le filtre lit le préfixe des parcelles. */
  async listerParcellesPartenaires(codeInsee?: string): Promise<string[][]> {
    const lignes = await this.database.db
      .select({ parcelles: partenaireSites.parcelles })
      .from(partenaireSites)
      .where(
        codeInsee
          ? sql`EXISTS (SELECT 1 FROM jsonb_array_elements_text(${partenaireSites.parcelles}) p WHERE p LIKE ${`${codeInsee}%`})`
          : undefined,
      );
    return lignes.map((l) => l.parcelles as string[]);
  }
}
