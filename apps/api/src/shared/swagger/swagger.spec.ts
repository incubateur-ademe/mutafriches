import { Test } from "@nestjs/testing";
import { SwaggerModule, OpenAPIObject } from "@nestjs/swagger";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import type { INestApplication } from "@nestjs/common";
import { AppModule } from "../../app.module";
import { DatabaseService } from "../database/database.service";
import { buildSwaggerConfig } from "./swagger.config";

/**
 * Vérifie la stabilité du contrat OpenAPI exposé aux intégrateurs.
 *
 * Si ces tests cassent, c'est qu'une route, un décorateur ou un exemple a changé
 * de façon non rétrocompatible — relire le diff avant de mettre à jour le snapshot.
 */
describe("Swagger OpenAPI document", () => {
  let app: INestApplication;
  let document: OpenAPIObject;

  beforeAll(async () => {
    const databaseMock = {
      db: { execute: vi.fn().mockResolvedValue([]) },
      onModuleInit: vi.fn(),
      onModuleDestroy: vi.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DatabaseService)
      .useValue(databaseMock)
      .compile();

    app = moduleRef.createNestApplication({ logger: false });
    document = SwaggerModule.createDocument(app, buildSwaggerConfig());
  });

  afterAll(async () => {
    await app?.close();
  });

  it("expose les endpoints publics attendus", () => {
    const paths = Object.keys(document.paths);
    expect(paths).toContain("/enrichissement");
    expect(paths).toContain("/evaluation/calculer");
    expect(paths).toContain("/evaluation/metadata");
    expect(paths).toContain("/evaluation/algorithme/versions");
    expect(paths).toContain("/evaluation/{id}");
    expect(paths).toContain("/api/stats");
  });

  it("n'expose pas les endpoints internes", () => {
    const paths = Object.keys(document.paths);
    expect(paths).not.toContain("/evenements");
    expect(paths.find((p) => p.startsWith("/api/metabase"))).toBeUndefined();
  });

  it("documente 400 et 500 sur les endpoints exposés", () => {
    const sample = [
      document.paths["/enrichissement"]?.post,
      document.paths["/evaluation/calculer"]?.post,
      document.paths["/evaluation/{id}"]?.get,
      document.paths["/api/stats"]?.get,
    ];
    for (const operation of sample) {
      expect(operation?.responses["400"]).toBeDefined();
      expect(operation?.responses["500"]).toBeDefined();
    }
  });

  it("documente 403 sur les endpoints protégés par origine", () => {
    expect(document.paths["/enrichissement"]?.post?.responses["403"]).toBeDefined();
    expect(document.paths["/evaluation/calculer"]?.post?.responses["403"]).toBeDefined();
  });

  it("documente 404 sur GET /evaluation/{id}", () => {
    expect(document.paths["/evaluation/{id}"]?.get?.responses["404"]).toBeDefined();
  });

  it("fournit des exemples nommés sur les POST principaux", () => {
    const enrichBody = document.paths["/enrichissement"]?.post?.requestBody;
    const calculerBody = document.paths["/evaluation/calculer"]?.post?.requestBody;

    // Le requestBody peut être un Reference ou un RequestBodyObject
    const enrichExamples =
      enrichBody && "content" in enrichBody
        ? enrichBody.content?.["application/json"]?.examples
        : undefined;
    const calculerExamples =
      calculerBody && "content" in calculerBody
        ? calculerBody.content?.["application/json"]?.examples
        : undefined;

    expect(enrichExamples && Object.keys(enrichExamples).length).toBeGreaterThan(0);
    expect(calculerExamples && Object.keys(calculerExamples).length).toBeGreaterThan(0);
  });

  it("expose une version d'algorithme non hardcodée (jamais 1.0.0)", () => {
    // Le document Swagger ne doit plus contenir l'ancienne version hardcodée
    const json = JSON.stringify(document);
    expect(json).not.toMatch(/"algorithme":\s*"1\.0\.0"/);
    expect(json).not.toMatch(/"algorithme":\s*"1\.1\.0"/);
  });

  it("liste prod, staging et localhost dans les serveurs", () => {
    const urls = (document.servers ?? []).map((s) => s.url);
    expect(urls).toContain("https://mutafriches.beta.gouv.fr");
    expect(urls).toContain("https://mutafriches.incubateur.ademe.dev");
    expect(urls).toContain("http://localhost:3000");
  });

  it("garantit la stabilité du snapshot des chemins exposés", () => {
    // On snapshot uniquement la liste des paths et leurs méthodes, pas le détail complet
    // (sinon le snapshot bouge à chaque ajout d'exemple ou de description).
    const summary = Object.fromEntries(
      Object.entries(document.paths)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([path, methods]) => [
          path,
          Object.keys(methods)
            .sort()
            .filter((k) => k !== "parameters"),
        ]),
    );
    expect(summary).toMatchSnapshot();
  });
});
