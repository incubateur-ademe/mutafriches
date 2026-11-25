import { describe, expect, it, vi } from "vitest";
import { of, throwError } from "rxjs";
import type { HttpService } from "@nestjs/axios";
import { CanalIntegrateur } from "@mutafriches/shared-types";
import type { AppConfig } from "../../../config";
import {
  BREVO_CONTACTS_URL,
  BREVO_TIMEOUT_MS,
  BrevoContactsService,
  type ContactDeclarant,
} from "./brevo-contacts.service";

const CONTACT: ContactDeclarant = {
  prenom: "Camille",
  nom: "Martin",
  email: "sig@exemple.fr",
  canal: CanalIntegrateur.API,
  structure: "Métropole de X",
  typeStructure: "collectivite",
  domaine: "exemple.fr",
  accepteContact: false,
};

function creerService(brevo: Partial<AppConfig["brevo"]> = {}) {
  const post = vi.fn().mockReturnValue(of({ status: 201, data: { id: 1 } }));
  const config = {
    brevo: { apiKey: "cle-de-test", listeId: 12, ...brevo },
  } as unknown as AppConfig;
  const service = new BrevoContactsService({ post } as unknown as HttpService, config);
  return { service, post };
}

type CorpsBrevo = { attributes: Record<string, unknown>; listIds: number[] };

describe("BrevoContactsService", () => {
  it("crée le contact dans la liste de l'environnement, avec ses attributs", async () => {
    const { service, post } = creerService();

    const resultat = await service.ajouterContact(CONTACT);

    expect(resultat.success).toBe(true);
    expect(resultat.responseTimeMs).toBeGreaterThanOrEqual(0);
    expect(post).toHaveBeenCalledWith(
      BREVO_CONTACTS_URL,
      {
        email: "sig@exemple.fr",
        attributes: {
          PRENOM: "Camille",
          NOM: "Martin",
          STRUCTURE: "Métropole de X",
          TYPE_STRUCTURE: "collectivite",
          DOMAINE: "exemple.fr",
          TYPE_ACCES: "API",
          USAGE_API: true,
        },
        listIds: [12],
        updateEnabled: true,
      },
      { headers: { "api-key": "cle-de-test" }, timeout: BREVO_TIMEOUT_MS },
    );
  });

  it.each([
    [CanalIntegrateur.API, "USAGE_API", "API"],
    [CanalIntegrateur.QGIS, "USAGE_QGIS", "Extension QGIS"],
    [CanalIntegrateur.PAGE, "USAGE_PAGE", "Page personnalisée"],
    [CanalIntegrateur.IFRAME, "USAGE_IFRAME", "Iframe"],
  ])(
    "ne transmet que l'attribut d'usage du canal %s (usages cumulables) et nomme l'accès demandé",
    async (canal, attribut, typeAcces) => {
      const { service, post } = creerService();

      await service.ajouterContact({ ...CONTACT, canal });

      const corps = post.mock.calls[0][1] as CorpsBrevo;
      const usages = Object.keys(corps.attributes).filter((cle) => cle.startsWith("USAGE_"));
      expect(usages).toEqual([attribut]);
      expect(corps.attributes[attribut]).toBe(true);
      expect(corps.attributes.TYPE_ACCES).toBe(typeAcces);
      expect(corps.listIds).toEqual([12]);
    },
  );

  it("n'envoie pas d'attribut DOMAINE pour une page personnalisée", async () => {
    const { service, post } = creerService();

    await service.ajouterContact({ ...CONTACT, canal: CanalIntegrateur.PAGE, domaine: undefined });

    const corps = post.mock.calls[0][1] as CorpsBrevo;
    expect(corps.attributes).not.toHaveProperty("DOMAINE");
  });

  it("ne transmet le consentement que s'il est donné, sans jamais l'écraser à faux", async () => {
    const { service, post } = creerService();

    await service.ajouterContact(CONTACT);
    await service.ajouterContact({ ...CONTACT, accepteContact: true });

    const [sansAccord, avecAccord] = post.mock.calls.map((appel) => appel[1] as CorpsBrevo);
    expect(sansAccord.attributes).not.toHaveProperty("ACCEPTE_CONTACT");
    expect(avecAccord.attributes.ACCEPTE_CONTACT).toBe(true);
  });

  it("n'appelle pas Brevo sans clé d'API", async () => {
    const { service, post } = creerService({ apiKey: undefined });

    const resultat = await service.ajouterContact(CONTACT);

    expect(resultat).toMatchObject({ success: false, error: "Brevo non configuré" });
    expect(post).not.toHaveBeenCalled();
  });

  it("n'appelle pas Brevo sans liste", async () => {
    const { service, post } = creerService({ listeId: undefined });

    const resultat = await service.ajouterContact(CONTACT);

    expect(resultat.success).toBe(false);
    expect(post).not.toHaveBeenCalled();
  });

  it("retourne un échec sans lever d'exception quand Brevo répond en erreur", async () => {
    const { service, post } = creerService();
    post.mockReturnValue(throwError(() => new Error("Request failed with status code 400")));

    const resultat = await service.ajouterContact(CONTACT);

    expect(resultat).toMatchObject({
      success: false,
      error: "Request failed with status code 400",
      source: "Brevo",
    });
  });
});
