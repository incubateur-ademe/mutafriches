import { INestApplication, ValidationPipe } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { App } from "supertest/types";
import {
  CanalIntegrateur,
  EN_TETE_CLIENT_MUTAFRICHES,
  INTEGRATEURS_IFRAME,
  SourceUtilisation,
  StatutIntegrateur,
  type OrigineUtilisation,
} from "@mutafriches/shared-types";
import { EnrichissementController } from "../src/enrichissement/enrichissement.controller";
import { EnrichissementService } from "../src/enrichissement/services/enrichissement.service";
import { EvaluationController } from "../src/evaluation/evaluation.controller";
import { OrchestrateurService } from "../src/evaluation/services/orchestrateur.service";
import { BrevoContactsService } from "../src/integrateurs/adapters/brevo/brevo-contacts.service";
import { DepotIntegrateursEnMemoire } from "../src/integrateurs/__test-helpers__/depot-integrateurs.memoire";
import { IntegrateursController } from "../src/integrateurs/integrateurs.controller";
import {
  DUREE_CACHE_ORIGINES_MS,
  IntegrateursRegistreService,
} from "../src/integrateurs/integrateurs-registre.service";
import { IntegrateursService } from "../src/integrateurs/integrateurs.service";
import { IntegrateurRepository } from "../src/integrateurs/repositories/integrateur.repository";
import {
  construireLignesReprise,
  ORIGINE_QGIS_PARTAGEE,
} from "../src/scripts/integrateurs/reprise-integrateurs.core";
import { IntegrateurOriginGuard } from "../src/shared/guards";
import { OrigineDetectionService } from "../src/shared/services/origine-detection.service";

const PARCELLE = "49007000AB0123";
const AUTRE_PARCELLE = "49007000AB0124";
const DOMAINE = "metropole-x.fr";
const ORIGINE = `https://${DOMAINE}`;
const CLIENT_QGIS = "qgis/1.2.0";
const EMAIL = "sig@metropole-x.fr";

interface Contexte {
  app: INestApplication;
  depot: DepotIntegrateursEnMemoire;
  brevo: { ajouterContact: ReturnType<typeof vi.fn> };
  enrichissement: { enrichir: ReturnType<typeof vi.fn>; enrichirSite: ReturnType<typeof vi.fn> };
  orchestrateur: { calculerMutabilite: ReturnType<typeof vi.fn> };
}

// Vraie chaîne HTTP : déclaration, registre, guard et détection d'origine. Seuls la table
// (en mémoire), Brevo et les deux services métier appelés en bout de chaîne sont simulés.
async function creerContexte(options: { limiteDeDebit?: boolean } = {}): Promise<Contexte> {
  const depot = new DepotIntegrateursEnMemoire();
  const brevo = { ajouterContact: vi.fn().mockResolvedValue({ success: true, source: "Brevo" }) };
  const enrichissement = {
    enrichir: vi.fn().mockResolvedValue({ identifiantParcelle: PARCELLE }),
    enrichirSite: vi.fn().mockResolvedValue({ identifiantParcelle: PARCELLE }),
  };
  const orchestrateur = {
    calculerMutabilite: vi.fn().mockResolvedValue({ evaluationId: "eval-test" }),
  };

  const module = await Test.createTestingModule({
    imports: options.limiteDeDebit ? [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }])] : [],
    controllers: [IntegrateursController, EnrichissementController, EvaluationController],
    providers: [
      IntegrateursService,
      IntegrateursRegistreService,
      IntegrateurOriginGuard,
      OrigineDetectionService,
      { provide: IntegrateurRepository, useValue: depot },
      { provide: BrevoContactsService, useValue: brevo },
      { provide: EnrichissementService, useValue: enrichissement },
      { provide: OrchestrateurService, useValue: orchestrateur },
      ...(options.limiteDeDebit ? [{ provide: APP_GUARD, useClass: ThrottlerGuard }] : []),
    ],
  }).compile();

  const app = module.createNestApplication();
  app.useGlobalPipes(new ValidationPipe());
  await app.init();

  return { app, depot, brevo, enrichissement, orchestrateur };
}

function serveur(contexte: Contexte): App {
  return contexte.app.getHttpServer() as App;
}

function declarer(contexte: Contexte, declaration: Record<string, unknown>) {
  return request(serveur(contexte))
    .post("/api/integrateurs/declarations")
    .send({
      structure: "Métropole de X",
      typeStructure: "collectivite",
      email: EMAIL,
      ...declaration,
    });
}

function enrichir(
  contexte: Contexte,
  enTetes: Record<string, string>,
  corps: Record<string, unknown> = { identifiant: PARCELLE },
) {
  return request(serveur(contexte)).post("/enrichissement").set(enTetes).send(corps);
}

function calculer(contexte: Contexte, enTetes: Record<string, string>) {
  return request(serveur(contexte))
    .post("/evaluation/calculer")
    .set(enTetes)
    .send({ donneesEnrichies: { identifiantCadastral: PARCELLE } });
}

// Intégrateur passé au service d'enrichissement, tel qu'il sera écrit en base.
function integrateurEnrichissement(appel: unknown[]): { source: unknown; integrateur: unknown } {
  return { source: appel[1], integrateur: appel[2] };
}

describe("Registre des intégrateurs E2E", () => {
  let contexte: Contexte;

  beforeEach(async () => {
    contexte = await creerContexte();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await contexte.app.close();
  });

  describe("Ajout d'un intégrateur par canal", () => {
    it("API : le domaine est refusé avant la déclaration, accepté juste après", async () => {
      await enrichir(contexte, { Origin: ORIGINE }).expect(403);

      const reponse = await declarer(contexte, { canal: "api", domaine: DOMAINE }).expect(200);

      expect(reponse.body).toEqual({
        canal: "api",
        statut: "actif",
        origine: ORIGINE,
        dejaDeclare: false,
      });
      await enrichir(contexte, { Origin: ORIGINE }).expect(201);

      expect(contexte.depot.lignes).toHaveLength(1);
      expect(contexte.depot.lignes[0]).toMatchObject({
        canal: CanalIntegrateur.API,
        structure: "Métropole de X",
        typeStructure: "collectivite",
        origine: ORIGINE,
        cleStats: DOMAINE,
        statut: StatutIntegrateur.ACTIF,
        contactEnregistre: true,
      });
    });

    it("extension QGIS : le domaine est accepté juste après, avec sa propre clé", async () => {
      const reponse = await declarer(contexte, { canal: "qgis", domaine: DOMAINE }).expect(200);

      expect(reponse.body).toMatchObject({ canal: "qgis", statut: "actif", origine: ORIGINE });
      await enrichir(contexte, {
        Origin: ORIGINE,
        [EN_TETE_CLIENT_MUTAFRICHES]: CLIENT_QGIS,
      }).expect(201);
      expect(contexte.depot.lignes[0]).toMatchObject({
        canal: CanalIntegrateur.QGIS,
        cleStats: `qgis:${DOMAINE}`,
        statut: StatutIntegrateur.ACTIF,
      });
    });

    it("iframe : la demande attend, et n'ouvre ni l'API ni une clé de statistiques", async () => {
      const reponse = await declarer(contexte, { canal: "iframe", domaine: DOMAINE }).expect(200);

      expect(reponse.body).toMatchObject({ canal: "iframe", statut: "en_attente" });
      await enrichir(contexte, { Origin: ORIGINE }).expect(403);
      expect(contexte.depot.lignes[0]).toMatchObject({
        canal: CanalIntegrateur.IFRAME,
        origine: ORIGINE,
        cleStats: null,
        statut: StatutIntegrateur.EN_ATTENTE,
        activeLe: null,
      });
    });

    it("page personnalisée : la demande attend, sans domaine, avec département et tranche", async () => {
      const reponse = await declarer(contexte, {
        canal: "page",
        departement: "88",
        nbSitesEstime: "10-a-50",
      }).expect(200);

      expect(reponse.body).toEqual({ canal: "page", statut: "en_attente", dejaDeclare: false });
      expect(contexte.depot.lignes[0]).toMatchObject({
        canal: CanalIntegrateur.PAGE,
        origine: null,
        cleStats: null,
        statut: StatutIntegrateur.EN_ATTENTE,
        departement: "88",
        nbSitesEstime: "10-a-50",
      });
    });

    it("transmet le contact à Brevo sans jamais l'écrire dans la table ni dans la réponse", async () => {
      const reponse = await declarer(contexte, { canal: "api", domaine: DOMAINE }).expect(200);

      expect(contexte.brevo.ajouterContact).toHaveBeenCalledWith({
        email: EMAIL,
        canal: "api",
        structure: "Métropole de X",
        typeStructure: "collectivite",
        domaine: DOMAINE,
      });
      expect(JSON.stringify(contexte.depot.lignes)).not.toContain(EMAIL);
      expect(JSON.stringify(reponse.body)).not.toContain(EMAIL);
    });

    it("garde la déclaration quand Brevo échoue, en la marquant non joignable", async () => {
      contexte.brevo.ajouterContact.mockResolvedValue({ success: false, source: "Brevo" });

      await declarer(contexte, { canal: "api", domaine: DOMAINE }).expect(200);

      expect(contexte.depot.lignes[0].contactEnregistre).toBe(false);
      await enrichir(contexte, { Origin: ORIGINE }).expect(201);
    });

    it("ne recrée rien pour un domaine déjà déclaré sur le même canal", async () => {
      await declarer(contexte, { canal: "api", domaine: DOMAINE }).expect(200);
      const reponse = await declarer(contexte, {
        canal: "api",
        domaine: `${ORIGINE}/outil`,
        email: "autre@metropole-x.fr",
      }).expect(200);

      expect(reponse.body).toMatchObject({ statut: "actif", dejaDeclare: true });
      expect(contexte.depot.lignes).toHaveLength(1);
      expect(contexte.brevo.ajouterContact).toHaveBeenCalledTimes(2);
    });

    it("tient une ligne par canal quand une structure déclare l'API et l'extension QGIS", async () => {
      await declarer(contexte, { canal: "api", domaine: DOMAINE }).expect(200);
      await declarer(contexte, { canal: "qgis", domaine: DOMAINE }).expect(200);

      expect(contexte.depot.lignes.map((ligne) => ligne.cleStats).sort()).toEqual([
        DOMAINE,
        `qgis:${DOMAINE}`,
      ]);
    });

    it.each([
      ["canal inconnu", { canal: "fax", domaine: DOMAINE }],
      ["type de structure inconnu", { canal: "api", domaine: DOMAINE, typeStructure: "ami" }],
      ["adresse e-mail invalide", { canal: "api", domaine: DOMAINE, email: "sig@" }],
      ["structure vide", { canal: "api", domaine: DOMAINE, structure: "" }],
      ["domaine absent pour l'API", { canal: "api" }],
      ["domaine absent pour QGIS", { canal: "qgis" }],
      ["domaine absent pour l'iframe", { canal: "iframe" }],
      ["domaine local", { canal: "api", domaine: "localhost" }],
      ["domaine sans extension", { canal: "api", domaine: "mon-service" }],
      ["extension d'une lettre", { canal: "api", domaine: "mon-service.x" }],
      ["domaine en http", { canal: "qgis", domaine: "http://metropole-x.fr" }],
      ["notre propre domaine", { canal: "api", domaine: "mutafriches.beta.gouv.fr" }],
      ["département invalide", { canal: "page", departement: "Vosges" }],
      ["tranche de sites inconnue", { canal: "page", nbSitesEstime: "beaucoup" }],
    ])("refuse en 400 sans rien créer : %s", async (_cas, declaration) => {
      await declarer(contexte, declaration).expect(400);

      expect(contexte.depot.lignes).toHaveLength(0);
      expect(contexte.brevo.ajouterContact).not.toHaveBeenCalled();
    });

    it("coupe le domaine sur tous les canaux après une révocation", async () => {
      await declarer(contexte, { canal: "api", domaine: DOMAINE }).expect(200);
      await declarer(contexte, { canal: "qgis", domaine: DOMAINE }).expect(200);
      const ligneApi = contexte.depot.lignes.find((ligne) => ligne.canal === CanalIntegrateur.API);
      await contexte.depot.changerStatut(ligneApi?.id ?? "", StatutIntegrateur.REVOQUE);

      // Le cache du registre expire : la révocation est lue au rechargement suivant.
      const maintenant = Date.now();
      vi.spyOn(Date, "now").mockReturnValue(maintenant + DUREE_CACHE_ORIGINES_MS + 1);

      await enrichir(contexte, { Origin: ORIGINE }).expect(403);
      await enrichir(contexte, {
        Origin: ORIGINE,
        [EN_TETE_CLIENT_MUTAFRICHES]: CLIENT_QGIS,
      }).expect(403);

      const redeclaration = await declarer(contexte, { canal: "qgis", domaine: DOMAINE }).expect(
        200,
      );
      expect(redeclaration.body).toMatchObject({ statut: "revoque", dejaDeclare: true });
      await enrichir(contexte, { Origin: ORIGINE }).expect(403);
    });

    it("limite les déclarations à cinq par heure et par adresse IP", async () => {
      const limite = await creerContexte({ limiteDeDebit: true });
      try {
        for (let numero = 1; numero <= 5; numero += 1) {
          await declarer(limite, { canal: "api", domaine: `site-${numero}.exemple.fr` }).expect(
            200,
          );
        }
        await declarer(limite, { canal: "api", domaine: "site-6.exemple.fr" }).expect(429);
        expect(limite.depot.lignes).toHaveLength(5);
      } finally {
        await limite.app.close();
      }
    });
  });

  describe("Décompte des appels de l'extension QGIS", () => {
    const ENTETES_QGIS = { Origin: ORIGINE, [EN_TETE_CLIENT_MUTAFRICHES]: CLIENT_QGIS };
    const ORIGINE_ATTENDUE: OrigineUtilisation = {
      source: SourceUtilisation.API_DIRECTE,
      integrateur: `qgis:${DOMAINE}`,
    };

    beforeEach(async () => {
      await declarer(contexte, { canal: "qgis", domaine: DOMAINE }).expect(200);
    });

    it("qualification d'une parcelle : enregistrée sous la clé QGIS de la structure", async () => {
      await enrichir(contexte, ENTETES_QGIS).expect(201);

      expect(contexte.enrichissement.enrichir).toHaveBeenCalledWith(
        PARCELLE,
        SourceUtilisation.API_DIRECTE,
        `qgis:${DOMAINE}`,
        false,
      );
    });

    it("qualification d'un site de plusieurs parcelles : même clé", async () => {
      await enrichir(contexte, ENTETES_QGIS, { identifiants: [PARCELLE, AUTRE_PARCELLE] }).expect(
        201,
      );

      expect(contexte.enrichissement.enrichirSite).toHaveBeenCalledWith(
        [PARCELLE, AUTRE_PARCELLE],
        SourceUtilisation.API_DIRECTE,
        `qgis:${DOMAINE}`,
        false,
      );
    });

    it("calcul de mutabilité : même clé, transmise à l'évaluation enregistrée", async () => {
      await calculer(contexte, ENTETES_QGIS).expect(201);

      expect(contexte.orchestrateur.calculerMutabilite).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ origine: ORIGINE_ATTENDUE }),
      );
    });

    it("chaque appel se rattache à une seule ligne du registre par sa clé de statistiques", async () => {
      await enrichir(contexte, ENTETES_QGIS).expect(201);
      await calculer(contexte, ENTETES_QGIS).expect(201);

      const cles = [
        integrateurEnrichissement(contexte.enrichissement.enrichir.mock.calls[0] as unknown[])
          .integrateur,
        (
          contexte.orchestrateur.calculerMutabilite.mock.calls[0] as [
            unknown,
            { origine: OrigineUtilisation },
          ]
        )[1].origine.integrateur,
      ];

      for (const cle of cles) {
        const lignes = contexte.depot.trouverParCle(cle as string);
        expect(lignes).toHaveLength(1);
        expect(lignes[0]).toMatchObject({
          canal: CanalIntegrateur.QGIS,
          structure: "Métropole de X",
        });
      }
    });

    it("ne mélange pas l'extension et l'API d'une même structure", async () => {
      await declarer(contexte, { canal: "api", domaine: DOMAINE }).expect(200);

      await enrichir(contexte, ENTETES_QGIS).expect(201);
      await enrichir(contexte, { Origin: ORIGINE }).expect(201);

      const [appelQgis, appelApi] = contexte.enrichissement.enrichir.mock.calls as unknown[][];
      expect(integrateurEnrichissement(appelQgis).integrateur).toBe(`qgis:${DOMAINE}`);
      expect(integrateurEnrichissement(appelApi).integrateur).toBe(DOMAINE);
      expect(contexte.depot.trouverParCle(DOMAINE)[0].canal).toBe(CanalIntegrateur.API);
    });

    it("reconnaît l'extension quelle que soit sa version ou la casse de l'en-tête", async () => {
      await enrichir(contexte, {
        Origin: ORIGINE,
        "X-Mutafriches-Client": "QGIS/2.0.0-beta",
      }).expect(201);

      expect(
        integrateurEnrichissement(contexte.enrichissement.enrichir.mock.calls[0] as unknown[])
          .integrateur,
      ).toBe(`qgis:${DOMAINE}`);
    });

    it("ne compte rien pour une extension dont la structure n'a pas déclaré son domaine", async () => {
      await enrichir(contexte, {
        Origin: "https://non-declare.fr",
        [EN_TETE_CLIENT_MUTAFRICHES]: CLIENT_QGIS,
      }).expect(403);
      await calculer(contexte, {
        Origin: "https://non-declare.fr",
        [EN_TETE_CLIENT_MUTAFRICHES]: CLIENT_QGIS,
      }).expect(403);

      expect(contexte.enrichissement.enrichir).not.toHaveBeenCalled();
      expect(contexte.orchestrateur.calculerMutabilite).not.toHaveBeenCalled();
    });

    it("compte les anciennes versions sous l'origine partagée reprise, plus avec le site", async () => {
      const [reprise] = construireLignesReprise({
        originesVariable: ORIGINE_QGIS_PARTAGEE,
        integrateursIframe: INTEGRATEURS_IFRAME,
        partenaires: [],
      });
      await contexte.depot.creerSiAbsent(reprise);
      const maintenant = Date.now();
      vi.spyOn(Date, "now").mockReturnValue(maintenant + DUREE_CACHE_ORIGINES_MS + 1);

      await enrichir(contexte, { Origin: ORIGINE_QGIS_PARTAGEE }).expect(201);

      const appel = integrateurEnrichissement(
        contexte.enrichissement.enrichir.mock.calls[0] as unknown[],
      );
      expect(appel).toEqual({
        source: SourceUtilisation.API_DIRECTE,
        integrateur: "qgis.mutafriches.beta.gouv.fr",
      });
      expect(contexte.depot.trouverParCle(appel.integrateur as string)).toEqual([
        expect.objectContaining({ canal: CanalIntegrateur.QGIS, structure: "QGIS non déclaré" }),
      ]);
    });
  });
});
