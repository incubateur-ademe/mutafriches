import { describe, expect, it } from "vitest";
import { hoteDeDomaineDeclare } from "./declaration-integrateur";

describe("hoteDeDomaineDeclare", () => {
  it.each([
    ["exemple.fr", "exemple.fr"],
    ["  Exemple.FR  ", "exemple.fr"],
    ["mon-service.gouv.fr", "mon-service.gouv.fr"],
    ["https://www.exemple.fr/outil?x=1#ancre", "www.exemple.fr"],
    ["https://exemple.fr/", "exemple.fr"],
    ["sig.metropole-x.fr", "sig.metropole-x.fr"],
    ["a1.b2.exemple.museum", "a1.b2.exemple.museum"],
    ["xn--caf-dma.fr", "xn--caf-dma.fr"],
    ["exemple.xn--p1ai", "exemple.xn--p1ai"],
  ])("extrait l'hôte de « %s »", (saisie, attendu) => {
    expect(hoteDeDomaineDeclare(saisie)).toBe(attendu);
  });

  it.each([
    ["", "vide"],
    ["mon-service", "sans extension"],
    ["intranet", "nom nu"],
    ["localhost", "hôte local"],
    ["exemple.f", "extension d'une lettre"],
    ["exemple.123", "extension numérique"],
    ["192.168.1.10", "adresse IPv4"],
    ["https://[::1]", "adresse IPv6"],
    ["exemple..fr", "label vide"],
    [".exemple.fr", "point initial"],
    ["-exemple.fr", "tiret en début de label"],
    ["exemple-.fr", "tiret en fin de label"],
    ["exem_ple.fr", "caractère interdit"],
    ["café.fr", "caractère accentué non converti"],
    ["mon service.fr", "espace"],
    ["http://exemple.fr", "schéma http"],
    ["ftp://exemple.fr", "schéma non web"],
    ["exemple.fr:8443", "port"],
    ["https://exemple.fr:443", "port par défaut explicite"],
    ["https://user:secret@exemple.fr", "identifiants"],
    ["contact@exemple.fr", "adresse e-mail"],
    [`${"a".repeat(64)}.fr`, "label de plus de 63 caractères"],
  ])("refuse « %s » (%s)", (saisie) => {
    expect(hoteDeDomaineDeclare(saisie)).toBeNull();
  });
});
