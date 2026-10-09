import { describe, it, expect, vi } from "vitest";
import { BadRequestException } from "@nestjs/common";
import type { Response } from "express";
import { MetabaseController } from "./metabase.controller";
import type { MetabaseService } from "./metabase.service";

function creerReponse(): Response {
  const res = { setHeader: vi.fn(), status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  return res as unknown as Response;
}

function creerService(configure = true): MetabaseService {
  return {
    isConfigured: vi.fn().mockReturnValue(configure),
    generateEmbedUrl: vi.fn().mockReturnValue("https://metabase.example.com/embed/x"),
  } as unknown as MetabaseService;
}

describe("MetabaseController", () => {
  it("utilise la vue usage par défaut", () => {
    const service = creerService();
    new MetabaseController(service).getEmbedUrl(undefined, creerReponse());

    expect(service.generateEmbedUrl).toHaveBeenCalledWith("usage");
  });

  it("transmet la vue matrice au service", () => {
    const service = creerService();
    new MetabaseController(service).getEmbedUrl("matrice", creerReponse());

    expect(service.generateEmbedUrl).toHaveBeenCalledWith("matrice");
  });

  it("rejette une vue inconnue", () => {
    const service = creerService();

    expect(() => new MetabaseController(service).getEmbedUrl("autre", creerReponse())).toThrow(
      BadRequestException,
    );
    expect(service.generateEmbedUrl).not.toHaveBeenCalled();
  });

  it("répond 503 si Metabase n'est pas configuré", () => {
    const res = creerReponse();
    new MetabaseController(creerService(false)).getEmbedUrl("usage", res);

    expect(res.status).toHaveBeenCalledWith(503);
  });
});
