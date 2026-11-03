import { Injectable, Logger } from "@nestjs/common";
import type { EnrichissementOutputDto } from "@mutafriches/shared-types";
import { CalculService } from "../evaluation/services/calcul.service";
import { VERSION_COURANTE } from "../evaluation/services/algorithme/versions";
import type { AttributaireSite } from "../shared/database/schemas/attributaire-sites.schema";
import { construireLigneAttributaire } from "./attributaire.builder";
import { cleSite, parcellesNormalisees, variantesParcelles } from "./attributaire.utils";
import { AttributaireRepository } from "./repositories/attributaire.repository";
import {
  SourcesAttributaireRepository,
  type EvaluationSource,
} from "./repositories/sources-attributaire.repository";

export type StatutRafraichissement = "a-jour" | "hors-perimetre" | "sans-enrichissement" | "ecarte";

export interface ResultatRafraichissement {
  cle: string;
  statut: StatutRafraichissement;
  motif?: string;
}

/** Enrichissement qui vient d'être produit, pas encore lisible en base (écriture non bloquante). */
export interface EnrichissementFrais {
  donnees: EnrichissementOutputDto;
  complet: boolean;
}

interface CandidatEnrichissement {
  complet: boolean;
  date: Date;
  charger: () => Promise<EnrichissementOutputDto | null>;
}

export interface SitesAttributairesCommune {
  codeInsee: string;
  commune?: string;
  lignes: AttributaireSite[];
}

/**
 * Tient à jour la table attributaire (ADR-0053) : une ligne par ensemble de parcelles évalué
 * ou d'inventaire partenaire, mutabilité recalculée avec la version courante, sans appel externe.
 */
@Injectable()
export class AttributaireService {
  private readonly logger = new Logger(AttributaireService.name);

  constructor(
    private readonly sources: SourcesAttributaireRepository,
    private readonly repository: AttributaireRepository,
    private readonly calculService: CalculService,
  ) {}

  /** Appelé après une évaluation ou un enrichissement : ne bloque ni ne fait échouer l'appelant. */
  rafraichirEnArrierePlan(parcelles: string[], frais?: EnrichissementFrais): void {
    this.rafraichir(parcelles, { frais }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "erreur inconnue";
      this.logger.warn(
        `Table attributaire non mise à jour pour [${parcelles.join(",")}] : ${message}`,
      );
    });
  }

  async rafraichir(
    parcelles: string[],
    options: { frais?: EnrichissementFrais; enregistrer?: boolean } = {},
  ): Promise<ResultatRafraichissement> {
    const normalisees = parcellesNormalisees(parcelles);
    const cle = normalisees.join(",");
    const variantes = variantesParcelles(normalisees);
    const memeSite = (liste: string[]): boolean => cleSite(liste) === cle;

    const [evaluationsProches, partenairesProches] = await Promise.all([
      this.sources.evaluationsPartageantUneParcelle(variantes),
      this.sources.sitesPartenairesPartageantUneParcelle(variantes),
    ]);
    // Correspondance exacte : un ensemble qui se contente de recouper le site en est un autre
    const evaluationsSite = evaluationsProches.filter((e) => memeSite(e.siteId.split(",")));
    const partenaire = partenairesProches.find((p) => memeSite(p.parcelles));

    if (evaluationsSite.length === 0 && !partenaire) {
      return { cle, statut: "hors-perimetre" };
    }

    const derniere = this.derniereEvaluation(evaluationsSite);
    const evaluation = derniere ? await this.sources.lireEvaluation(derniere.id) : null;

    const candidats: CandidatEnrichissement[] = [];
    if (options.frais) {
      const { donnees, complet } = options.frais;
      candidats.push({ complet, date: new Date(), charger: () => Promise.resolve(donnees) });
    }
    if (derniere && evaluation) {
      const snapshot = evaluation.donneesEnrichissement;
      candidats.push({
        complet: (snapshot.sourcesEchouees?.length ?? 0) === 0,
        date: derniere.dateCalcul,
        charger: () => Promise.resolve(snapshot),
      });
    }
    const enCache = await this.sources.enrichissementsPartageantUneParcelle(variantes);
    for (const source of enCache.filter((s) => memeSite(s.parcelles))) {
      candidats.push({
        complet: source.complet,
        date: source.date,
        charger: () => this.sources.lireEnrichissement(source),
      });
    }

    const enrichissement = await this.choisirEnrichissement(candidats);
    if (!enrichissement) {
      return { cle, statut: "sans-enrichissement" };
    }

    const resultat = await construireLigneAttributaire(
      {
        parcelles: normalisees,
        enrichissement,
        saisie:
          derniere && evaluation
            ? {
                donnees: evaluation.donneesComplementaires,
                date: derniere.dateCalcul,
                evaluationId: derniere.id,
              }
            : undefined,
        nombreEvaluations: evaluationsSite.filter((e) => !e.evaluationSourceId).length,
        partenaire: partenaire
          ? { slug: partenaire.slug, idtup: partenaire.idtup, nom: partenaire.nom ?? undefined }
          : undefined,
      },
      this.calculService,
    );

    if ("motif" in resultat) {
      return { cle, statut: "ecarte", motif: resultat.motif };
    }

    if (options.enregistrer !== false) {
      await this.repository.enregistrer(resultat.ligne);
    }
    return { cle, statut: "a-jour" };
  }

  async listerParCommune(codeInsee: string): Promise<SitesAttributairesCommune> {
    const lignes = await this.repository.trouverParCodeInsee(codeInsee);
    const commune =
      lignes.find((l) => l.commune)?.commune ?? (await this.repository.nomCommune(codeInsee));
    return { codeInsee, commune: commune ?? undefined, lignes };
  }

  /** Ensembles de parcelles du périmètre, dédoublonnés par clé. */
  async listerPerimetre(codeInsee?: string): Promise<string[][]> {
    const [evalues, partenaires] = await Promise.all([
      this.sources.listerParcellesEvaluees(codeInsee),
      this.sources.listerParcellesPartenaires(codeInsee),
    ]);
    const parCle = new Map<string, string[]>();
    for (const parcelles of [...evalues, ...partenaires]) {
      const normalisees = parcellesNormalisees(parcelles);
      parCle.set(normalisees.join(","), normalisees);
    }
    return [...parCle.values()];
  }

  async listerHorsVersionCourante(): Promise<string[][]> {
    return this.repository.listerParcellesHorsVersion(VERSION_COURANTE);
  }

  async compter(): Promise<number> {
    return this.repository.compter();
  }

  private derniereEvaluation(evaluations: EvaluationSource[]): EvaluationSource | undefined {
    return evaluations.reduce<EvaluationSource | undefined>(
      (retenue, e) => (!retenue || e.dateCalcul > retenue.dateCalcul ? e : retenue),
      undefined,
    );
  }

  /**
   * Le plus récent des enrichissements complets, à défaut le plus récent des partiels : une
   * panne de source (BDNB) ne doit pas remplacer une donnée complète par une donnée dégradée.
   */
  private async choisirEnrichissement(
    candidats: CandidatEnrichissement[],
  ): Promise<{ donnees: EnrichissementOutputDto; date: Date } | null> {
    const ordonnes = [...candidats].sort(
      (a, b) => Number(b.complet) - Number(a.complet) || b.date.getTime() - a.date.getTime(),
    );
    for (const candidat of ordonnes) {
      const donnees = await candidat.charger();
      if (donnees) return { donnees, date: candidat.date };
    }
    return null;
  }
}
