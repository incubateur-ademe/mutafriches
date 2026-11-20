import { beforeEach, describe, expect, it, vi } from "vitest";
import { BadRequestException } from "@nestjs/common";
import {
  CanalIntegrateur,
  StatutIntegrateur,
  type DeclarationIntegrateurInput,
} from "@mutafriches/shared-types";
import type { Integrateur, NewIntegrateur } from "../shared/database/schemas/integrateurs.schema";
import type { BrevoContactsService } from "./adapters/brevo/brevo-contacts.service";
import type { IntegrateursRegistreService } from "./integrateurs-registre.service";
import { IntegrateursService } from "./integrateurs.service";
import type { IntegrateurRepository } from "./repositories/integrateur.repository";

const DECLARATION: DeclarationIntegrateurInput = {
  canal: CanalIntegrateur.API,
  structure: "  Métropole de X ",
  typeStructure: "collectivite",
  email: "sig@exemple.fr",
  domaine: "https://www.exemple.fr/outil",
};

function versIntegrateur(ligne: NewIntegrateur): Integrateur {
  return {
    origine: null,
    cleStats: null,
    departement: null,
    nbSitesEstime: null,
    contactEnregistre: false,
    activeLe: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...ligne,
  } as Integrateur;
}

function creerService() {
  const repository = {
    estOrigineRevoquee: vi.fn().mockResolvedValue(false),
    trouverParCanalEtOrigine: vi.fn().mockResolvedValue(null),
    creerSiAbsent: vi
      .fn()
      .mockImplementation((ligne: NewIntegrateur) => Promise.resolve(versIntegrateur(ligne))),
    marquerContactEnregistre: vi.fn().mockResolvedValue(undefined),
  };
  const registre = { ajouterOrigine: vi.fn() };
  const brevo = { ajouterContact: vi.fn().mockResolvedValue({ success: true, source: "Brevo" }) };

  const service = new IntegrateursService(
    repository as unknown as IntegrateurRepository,
    registre as unknown as IntegrateursRegistreService,
    brevo as unknown as BrevoContactsService,
  );
  return { service, repository, registre, brevo };
}

describe("IntegrateursService.declarer", () => {
  let contexte: ReturnType<typeof creerService>;

  beforeEach(() => {
    contexte = creerService();
  });

  it("active une déclaration API tout de suite, sans stocker l'e-mail", async () => {
    const { service, repository, registre } = contexte;

    const resultat = await service.declarer(DECLARATION);

    expect(resultat).toEqual({
      canal: "api",
      statut: "actif",
      origine: "https://www.exemple.fr",
      dejaDeclare: false,
    });
    const ligne = repository.creerSiAbsent.mock.calls[0][0] as NewIntegrateur;
    expect(ligne).toMatchObject({
      canal: "api",
      structure: "Métropole de X",
      origine: "https://www.exemple.fr",
      cleStats: "www.exemple.fr",
      statut: StatutIntegrateur.ACTIF,
    });
    expect(ligne.activeLe).toBeInstanceOf(Date);
    expect(JSON.stringify(ligne)).not.toContain("sig@exemple.fr");
    expect(registre.ajouterOrigine).toHaveBeenCalledWith("https://www.exemple.fr");
  });

  it("préfixe la clé de statistiques d'une déclaration QGIS", async () => {
    const { service, repository } = contexte;

    await service.declarer({ ...DECLARATION, canal: CanalIntegrateur.QGIS, domaine: "exemple.fr" });

    expect(repository.creerSiAbsent.mock.calls[0][0]).toMatchObject({
      canal: "qgis",
      cleStats: "qgis:exemple.fr",
      statut: StatutIntegrateur.ACTIF,
    });
  });

  it("met une demande d'iframe en attente, sans ouvrir l'origine", async () => {
    const { service, repository, registre } = contexte;

    const resultat = await service.declarer({ ...DECLARATION, canal: CanalIntegrateur.IFRAME });

    expect(resultat.statut).toBe("en_attente");
    expect(repository.creerSiAbsent.mock.calls[0][0]).toMatchObject({
      origine: "https://www.exemple.fr",
      cleStats: null,
      activeLe: null,
    });
    expect(registre.ajouterOrigine).not.toHaveBeenCalled();
  });

  it("enregistre une demande de page sans domaine, avec département et tranche", async () => {
    const { service, repository } = contexte;

    const resultat = await service.declarer({
      canal: CanalIntegrateur.PAGE,
      structure: "EPF Z",
      typeStructure: "etablissement_public",
      email: "contact@epf-z.fr",
      departement: "88",
      nbSitesEstime: "10-a-50",
    });

    expect(resultat).toEqual({
      canal: "page",
      statut: "en_attente",
      origine: undefined,
      dejaDeclare: false,
    });
    expect(repository.trouverParCanalEtOrigine).not.toHaveBeenCalled();
    expect(repository.creerSiAbsent.mock.calls[0][0]).toMatchObject({
      origine: null,
      departement: "88",
      nbSitesEstime: "10-a-50",
    });
  });

  it("ne recrée rien pour un domaine déjà déclaré, mais transmet le nouveau contact", async () => {
    const { service, repository, registre, brevo } = contexte;
    const existant = versIntegrateur({
      id: "id-existant",
      canal: CanalIntegrateur.API,
      structure: "Métropole de X",
      typeStructure: "collectivite",
      origine: "https://www.exemple.fr",
      statut: StatutIntegrateur.ACTIF,
      contactEnregistre: true,
    });
    repository.trouverParCanalEtOrigine.mockResolvedValue(existant);

    const resultat = await service.declarer({ ...DECLARATION, email: "autre@exemple.fr" });

    expect(resultat).toMatchObject({ statut: "actif", dejaDeclare: true });
    expect(repository.creerSiAbsent).not.toHaveBeenCalled();
    expect(registre.ajouterOrigine).not.toHaveBeenCalled();
    expect(brevo.ajouterContact).toHaveBeenCalledWith(
      expect.objectContaining({ email: "autre@exemple.fr", domaine: "www.exemple.fr" }),
    );
    expect(repository.marquerContactEnregistre).not.toHaveBeenCalled();
  });

  it.each([CanalIntegrateur.API, CanalIntegrateur.QGIS, CanalIntegrateur.IFRAME])(
    "refuse sur le canal %s une origine révoquée, quel que soit le canal révoqué",
    async (canal) => {
      const { service, repository, registre, brevo } = contexte;
      repository.estOrigineRevoquee.mockResolvedValue(true);

      const resultat = await service.declarer({ ...DECLARATION, canal });

      expect(resultat).toEqual({
        canal,
        statut: "revoque",
        origine: "https://www.exemple.fr",
        dejaDeclare: true,
      });
      expect(repository.estOrigineRevoquee).toHaveBeenCalledWith("https://www.exemple.fr");
      expect(repository.creerSiAbsent).not.toHaveBeenCalled();
      expect(registre.ajouterOrigine).not.toHaveBeenCalled();
      expect(brevo.ajouterContact).not.toHaveBeenCalled();
    },
  );

  it("autorise sans clé une origine dont l'hôte porte déjà une clé de statistiques", async () => {
    const { service, repository, registre } = contexte;
    repository.creerSiAbsent
      .mockResolvedValueOnce(null)
      .mockImplementationOnce((ligne: NewIntegrateur) => Promise.resolve(versIntegrateur(ligne)));

    const resultat = await service.declarer(DECLARATION);

    expect(resultat).toMatchObject({ statut: "actif", dejaDeclare: false });
    expect(repository.creerSiAbsent.mock.calls[1][0]).toMatchObject({
      origine: "https://www.exemple.fr",
      cleStats: null,
    });
    expect(registre.ajouterOrigine).toHaveBeenCalledWith("https://www.exemple.fr");
  });

  it("relit la ligne d'une déclaration concurrente du même domaine", async () => {
    const { service, repository } = contexte;
    const concurrente = versIntegrateur({
      id: "id-concurrent",
      canal: CanalIntegrateur.API,
      structure: "Métropole de X",
      typeStructure: "collectivite",
      origine: "https://www.exemple.fr",
      statut: StatutIntegrateur.ACTIF,
    });
    repository.creerSiAbsent.mockResolvedValue(null);
    repository.trouverParCanalEtOrigine
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(concurrente);

    const resultat = await service.declarer(DECLARATION);

    expect(resultat).toMatchObject({ statut: "actif", origine: "https://www.exemple.fr" });
  });

  it("marque le contact enregistré quand Brevo répond", async () => {
    const { service, repository } = contexte;

    await service.declarer(DECLARATION);

    expect(repository.marquerContactEnregistre).toHaveBeenCalledTimes(1);
  });

  it("accepte la déclaration même si Brevo échoue", async () => {
    const { service, repository, brevo } = contexte;
    brevo.ajouterContact.mockResolvedValue({ success: false, error: "timeout", source: "Brevo" });

    const resultat = await service.declarer(DECLARATION);

    expect(resultat.statut).toBe("actif");
    expect(repository.marquerContactEnregistre).not.toHaveBeenCalled();
  });

  it.each([
    "localhost",
    "mon-service",
    "exemple.f",
    "http://exemple.fr",
    "192.168.0.1",
    "mutafriches.beta.gouv.fr",
    "",
  ])("refuse le domaine « %s »", async (domaine) => {
    const { service, repository, brevo } = contexte;

    await expect(service.declarer({ ...DECLARATION, domaine })).rejects.toThrow(
      BadRequestException,
    );
    expect(repository.creerSiAbsent).not.toHaveBeenCalled();
    expect(brevo.ajouterContact).not.toHaveBeenCalled();
  });

  it("ignore en silence une déclaration dont le champ piège est rempli", async () => {
    const { service, repository, registre, brevo } = contexte;

    const resultat = await service.declarer({ ...DECLARATION, telephone: "0102030405" });

    expect(resultat).toMatchObject({ statut: "actif", dejaDeclare: false });
    expect(repository.creerSiAbsent).not.toHaveBeenCalled();
    expect(registre.ajouterOrigine).not.toHaveBeenCalled();
    expect(brevo.ajouterContact).not.toHaveBeenCalled();
  });
});
