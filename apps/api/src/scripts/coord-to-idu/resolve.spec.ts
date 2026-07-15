import { describe, expect, it } from "vitest";
import { communeSure, iduSur } from "./resolve";

// Ces valeurs proviennent de l'API cadastre et sont écrites dans des fichiers générés :
// on vérifie qu'un format inattendu est rejeté (garde-fou injection, cf. CodeQL js/http-to-file-access).
describe("iduSur", () => {
  it("accepte un IDU cadastral valide", () => {
    expect(iduSur("77305000AB0160")).toBe("77305000AB0160");
  });

  it("normalise la section préfixée (0B → B)", () => {
    expect(iduSur("07019000B2188")).toBe("07019000B2188");
  });

  it("rejette undefined", () => {
    expect(iduSur(undefined)).toBeNull();
  });

  it("rejette un IDU malformé", () => {
    expect(iduSur("pas-un-idu")).toBeNull();
    expect(iduSur("77305")).toBeNull();
  });

  it("rejette une tentative d'injection", () => {
    expect(iduSur('77305000AB0160"];maliciousCode();//')).toBeNull();
    expect(iduSur("77305000AB0160\n+ evil")).toBeNull();
  });
});

describe("communeSure", () => {
  it("accepte un nom de commune accentué avec tiret et apostrophe", () => {
    expect(communeSure("Cannes-Écluse")).toBe("Cannes-Écluse");
    expect(communeSure("L'Isle-d'Abeau")).toBe("L'Isle-d'Abeau");
  });

  it("rejette undefined et la chaîne vide", () => {
    expect(communeSure(undefined)).toBeUndefined();
    expect(communeSure("")).toBeUndefined();
  });

  it("rejette une chaîne contenant des caractères de code (guillemets, retour ligne)", () => {
    expect(communeSure('Foo";evil()')).toBeUndefined();
    expect(communeSure("Foo\nBar")).toBeUndefined();
  });
});
