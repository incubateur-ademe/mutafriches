import { describe, it, expect } from "vitest";
import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { UsageDetailTable } from "./UsageDetailTable";

function extraireIds(html: string, motif: RegExp): string[] {
  return [...html.matchAll(motif)].map((correspondance) => correspondance[1] as string);
}

describe("UsageDetailTable", () => {
  // Page résultats : le tableau est rendu dans la modale et dans le panneau de debug.
  it("donne des id d'infobulle distincts à chaque tableau rendu", () => {
    const html = renderToStaticMarkup(
      createElement(
        Fragment,
        null,
        createElement(UsageDetailTable, { sections: [] }),
        createElement(UsageDetailTable, { sections: [] }),
      ),
    );

    const idsInfobulles = extraireIds(html, /<span[^>]*\bid="([^"]+)"[^>]*role="tooltip"/g);
    const idsReferences = extraireIds(html, /aria-describedby="([^"]+)"/g);

    expect(idsInfobulles).toHaveLength(4);
    expect(new Set(idsInfobulles).size).toBe(4);
    expect(idsReferences).toEqual(idsInfobulles);
  });
});
