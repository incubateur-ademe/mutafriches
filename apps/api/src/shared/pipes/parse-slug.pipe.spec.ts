import { describe, expect, it } from "vitest";
import { ArgumentMetadata, BadRequestException } from "@nestjs/common";
import { ParseSlugPipe } from "./parse-slug.pipe";

const metadata = { type: "param", data: "slug" } as ArgumentMetadata;

describe("ParseSlugPipe", () => {
  const pipe = new ParseSlugPipe();

  it("laisse passer les slugs des partenaires existants", () => {
    expect(pipe.transform("cci-92", metadata)).toBe("cci-92");
    expect(pipe.transform("ddt-vosges", metadata)).toBe("ddt-vosges");
    expect(pipe.transform("aura", metadata)).toBe("aura");
  });

  it("rejette les caractères qui pourraient remonter dans une réponse", () => {
    expect(() => pipe.transform("<script>alert(1)</script>", metadata)).toThrow(
      BadRequestException,
    );
    expect(() => pipe.transform('cci"92', metadata)).toThrow(BadRequestException);
    expect(() => pipe.transform("cci\r\n92", metadata)).toThrow(BadRequestException);
    expect(() => pipe.transform("../../etc/passwd", metadata)).toThrow(BadRequestException);
  });

  it("rejette les majuscules, les espaces et les slugs vides", () => {
    expect(() => pipe.transform("CCI-92", metadata)).toThrow(BadRequestException);
    expect(() => pipe.transform("cci 92", metadata)).toThrow(BadRequestException);
    expect(() => pipe.transform("", metadata)).toThrow(BadRequestException);
  });

  it("rejette une valeur trop longue ou d'un autre type", () => {
    expect(() => pipe.transform("a".repeat(51), metadata)).toThrow(BadRequestException);
    expect(() => pipe.transform(42, metadata)).toThrow(BadRequestException);
    expect(() => pipe.transform(undefined, metadata)).toThrow(BadRequestException);
  });

  it("ne réexpose pas la valeur reçue dans le message d'erreur", () => {
    try {
      pipe.transform("<script>alert(1)</script>", metadata);
      expect.unreachable("le pipe aurait dû rejeter");
    } catch (erreur) {
      expect(JSON.stringify((erreur as BadRequestException).getResponse())).not.toContain("script");
    }
  });
});
