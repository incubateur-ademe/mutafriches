import { describe, expect, it } from "vitest";
import { CanalIntegrateur, StatutIntegrateur } from "@mutafriches/shared-types";
import {
  confirmationDeclaration,
  construireDeclaration,
  messageErreurDeclaration,
  SAISIE_VIDE,
  validerDeclaration,
  type SaisieDeclaration,
} from "./declaration-integrateur";

const SAISIE: SaisieDeclaration = {
  ...SAISIE_VIDE,
  structure: " Métropole de X ",
  typeStructure: "collectivite",
  email: " sig@exemple.fr ",
  domaine: " exemple.fr ",
};

describe("validerDeclaration", () => {
  it("accepte une déclaration API complète", () => {
    expect(validerDeclaration(CanalIntegrateur.API, SAISIE)).toEqual({});
  });

  it("signale chaque champ obligatoire manquant", () => {
    expect(Object.keys(validerDeclaration(CanalIntegrateur.API, SAISIE_VIDE)).sort()).toEqual([
      "domaine",
      "email",
      "structure",
      "typeStructure",
    ]);
  });

  it("refuse une adresse e-mail mal formée", () => {
    const erreurs = validerDeclaration(CanalIntegrateur.API, { ...SAISIE, email: "sig@exemple" });
    expect(erreurs).toHaveProperty("email");
  });

  it.each(["mon-service", "intranet", "exemple.f", "192.168.1.10", "http://exemple.fr", "a b.fr"])(
    "refuse le domaine « %s » avant l'envoi",
    (domaine) => {
      expect(validerDeclaration(CanalIntegrateur.API, { ...SAISIE, domaine })).toHaveProperty(
        "domaine",
      );
    },
  );

  it.each(["exemple.fr", "https://www.exemple.fr/outil", "sig.metropole-x.fr"])(
    "accepte le domaine « %s »",
    (domaine) => {
      expect(validerDeclaration(CanalIntegrateur.API, { ...SAISIE, domaine })).toEqual({});
    },
  );

  it("ne demande pas de domaine pour une page personnalisée", () => {
    expect(validerDeclaration(CanalIntegrateur.PAGE, { ...SAISIE, domaine: "" })).toEqual({});
  });

  it("contrôle le département d'une page seulement s'il est saisi", () => {
    const page = { ...SAISIE, domaine: "" };
    expect(validerDeclaration(CanalIntegrateur.PAGE, { ...page, departement: "2a" })).toEqual({});
    expect(validerDeclaration(CanalIntegrateur.PAGE, { ...page, departement: "971" })).toEqual({});
    expect(
      validerDeclaration(CanalIntegrateur.PAGE, { ...page, departement: "Vosges" }),
    ).toHaveProperty("departement");
  });
});

describe("construireDeclaration", () => {
  it("nettoie la saisie et n'envoie que les champs du canal API", () => {
    expect(
      construireDeclaration(CanalIntegrateur.API, {
        ...SAISIE,
        departement: "88",
        nbSitesEstime: "10-a-50",
      }),
    ).toEqual({
      canal: "api",
      structure: "Métropole de X",
      typeStructure: "collectivite",
      email: "sig@exemple.fr",
      domaine: "exemple.fr",
    });
  });

  it("envoie département et tranche pour une page, sans domaine", () => {
    expect(
      construireDeclaration(CanalIntegrateur.PAGE, {
        ...SAISIE,
        departement: "2a",
        nbSitesEstime: "10-a-50",
      }),
    ).toEqual({
      canal: "page",
      structure: "Métropole de X",
      typeStructure: "collectivite",
      email: "sig@exemple.fr",
      departement: "2A",
      nbSitesEstime: "10-a-50",
    });
  });

  it("transmet le champ piège quand il est rempli", () => {
    expect(
      construireDeclaration(CanalIntegrateur.API, { ...SAISIE, telephone: "0102030405" }),
    ).toHaveProperty("telephone", "0102030405");
  });
});

describe("confirmationDeclaration", () => {
  it("annonce un accès immédiat pour l'API, avec l'origine à envoyer", () => {
    const confirmation = confirmationDeclaration({
      canal: CanalIntegrateur.API,
      statut: StatutIntegrateur.ACTIF,
      origine: "https://exemple.fr",
      dejaDeclare: false,
    });
    expect(confirmation.niveau).toBe("success");
    expect(confirmation.texte).toContain("Origin: https://exemple.fr");
  });

  it("signale un domaine déjà déclaré sans le présenter comme une nouveauté", () => {
    const confirmation = confirmationDeclaration({
      canal: CanalIntegrateur.API,
      statut: StatutIntegrateur.ACTIF,
      origine: "https://exemple.fr",
      dejaDeclare: true,
    });
    expect(confirmation).toMatchObject({ niveau: "info", titre: "Domaine déjà déclaré" });
  });

  it("annonce un recontact pour une page ou une iframe en attente", () => {
    const page = confirmationDeclaration({
      canal: CanalIntegrateur.PAGE,
      statut: StatutIntegrateur.EN_ATTENTE,
      dejaDeclare: false,
    });
    const iframe = confirmationDeclaration({
      canal: CanalIntegrateur.IFRAME,
      statut: StatutIntegrateur.EN_ATTENTE,
      origine: "https://exemple.fr",
      dejaDeclare: false,
    });
    expect(page.texte).toContain("liste de sites");
    expect(iframe.texte).toContain("demo");
  });

  it("avertit quand le domaine a été suspendu", () => {
    const confirmation = confirmationDeclaration({
      canal: CanalIntegrateur.API,
      statut: StatutIntegrateur.REVOQUE,
      origine: "https://exemple.fr",
      dejaDeclare: true,
    });
    expect(confirmation.niveau).toBe("warning");
  });
});

describe("messageErreurDeclaration", () => {
  it("explique la limite de débit", () => {
    expect(messageErreurDeclaration(429, "Too Many Requests")).toContain("une heure");
  });

  it("reprend le message du serveur pour une saisie refusée", () => {
    expect(messageErreurDeclaration(400, "Domaine invalide")).toBe("Domaine invalide");
  });

  it("reste générique pour une panne", () => {
    expect(messageErreurDeclaration(500, "stack")).not.toContain("stack");
  });
});
