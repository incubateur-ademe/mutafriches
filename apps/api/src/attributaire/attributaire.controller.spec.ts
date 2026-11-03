import { describe, it, expect, beforeEach, vi } from "vitest";
import { BadRequestException } from "@nestjs/common";
import type { Response } from "express";
import { AttributaireController } from "./attributaire.controller";
import type { AttributaireService } from "./attributaire.service";

function creerReponse() {
  const res = {
    setHeader: vi.fn(),
    status: vi.fn(),
    json: vi.fn(),
    send: vi.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
}

describe("AttributaireController", () => {
  let service: { listerParCommune: ReturnType<typeof vi.fn> };
  let controller: AttributaireController;

  beforeEach(() => {
    service = {
      listerParCommune: vi.fn().mockResolvedValue({
        codeInsee: "77305",
        commune: "Montereau-Fault-Yonne",
        lignes: [],
      }),
    };
    controller = new AttributaireController(service as unknown as AttributaireService);
  });

  it("refuse un code INSEE absent ou mal formé", async () => {
    const res = creerReponse();
    await expect(controller.listerSites(res as unknown as Response)).rejects.toThrow(
      BadRequestException,
    );
    await expect(controller.listerSites(res as unknown as Response, "7730")).rejects.toThrow(
      BadRequestException,
    );
    expect(service.listerParCommune).not.toHaveBeenCalled();
  });

  it("refuse un format inconnu", async () => {
    const res = creerReponse();
    await expect(
      controller.listerSites(res as unknown as Response, "77305", "csv"),
    ).rejects.toThrow(BadRequestException);
  });

  it("renvoie la table en JSON avec un cache court", async () => {
    const res = creerReponse();

    await controller.listerSites(res as unknown as Response, "77305");

    expect(service.listerParCommune).toHaveBeenCalledWith("77305");
    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "public, max-age=300");
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ codeInsee: "77305", nombreSites: 0, sites: [] }),
    );
  });

  it("accepte un code corse et renvoie du GeoJSON", async () => {
    const res = creerReponse();

    await controller.listerSites(res as unknown as Response, "2a004", "geojson");

    expect(service.listerParCommune).toHaveBeenCalledWith("2A004");
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/geo+json; charset=utf-8",
    );
    const corps = JSON.parse(res.send.mock.calls[0][0] as string) as { type: string };
    expect(corps.type).toBe("FeatureCollection");
  });
});
