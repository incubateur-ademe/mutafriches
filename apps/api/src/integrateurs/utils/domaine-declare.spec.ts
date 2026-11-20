import { describe, expect, it } from "vitest";
import { CanalIntegrateur } from "@mutafriches/shared-types";
import { cleStatsPourOrigine, normaliserDomaineDeclare } from "./domaine-declare";

describe("normaliserDomaineDeclare", () => {
  it.each([
    ["exemple.fr", "https://exemple.fr"],
    ["  Exemple.FR  ", "https://exemple.fr"],
    ["https://www.exemple.fr/outil?x=1", "https://www.exemple.fr"],
    ["https://exemple.fr/", "https://exemple.fr"],
    ["sig.metropole-x.fr", "https://sig.metropole-x.fr"],
  ])("ramène « %s » à l'origine %s", (saisie, attendu) => {
    expect(normaliserDomaineDeclare(saisie)).toBe(attendu);
  });

  it.each([
    ["", "vide"],
    ["http://exemple.fr", "schéma http"],
    ["ftp://exemple.fr", "schéma non web"],
    ["localhost", "hôte local"],
    ["https://localhost:5173", "hôte local avec port"],
    ["intranet", "nom sans domaine"],
    ["poste.local", "suffixe local"],
    ["192.168.1.10", "adresse IPv4"],
    ["https://[::1]", "adresse IPv6"],
    ["https://exemple.fr:8443", "port explicite"],
    ["https://user:secret@exemple.fr", "identifiants dans l'URL"],
    ["mutafriches.beta.gouv.fr", "notre domaine"],
    ["qgis.mutafriches.beta.gouv.fr", "origine partagée de l'extension"],
    ["mutafriches.incubateur.ademe.dev", "notre staging"],
    ["stats.incubateur.ademe.fr", "dashboard ADEME"],
    ["pas un domaine", "saisie libre"],
  ])("refuse « %s » (%s)", (saisie) => {
    expect(normaliserDomaineDeclare(saisie)).toBeNull();
  });
});

describe("cleStatsPourOrigine", () => {
  it("donne l'hôte pour l'API, comme la colonne integrateur", () => {
    expect(cleStatsPourOrigine(CanalIntegrateur.API, "https://outil.exemple.fr")).toBe(
      "outil.exemple.fr",
    );
  });

  it("préfixe l'hôte pour l'extension QGIS", () => {
    expect(cleStatsPourOrigine(CanalIntegrateur.QGIS, "https://exemple.fr")).toBe(
      "qgis:exemple.fr",
    );
  });
});
