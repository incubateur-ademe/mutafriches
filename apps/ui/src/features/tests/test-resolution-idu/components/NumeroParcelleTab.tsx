import { useState } from "react";
import { apicartoParamsParAttributs, parseNumParcelle } from "@mutafriches/shared-types";
import { fetchCadastre } from "../api/cadastre.client";
import { LigneResolution, ResultatTable } from "./ResultatTable";

export function NumeroParcelleTab() {
  const [insee, setInsee] = useState("77305");
  const [numParcelle, setNumParcelle] = useState("AB160/161/163");
  const [lignes, setLignes] = useState<LigneResolution[] | null>(null);
  const [loading, setLoading] = useState(false);

  const resoudre = async (): Promise<void> => {
    setLoading(true);
    setLignes(null);
    const refs = parseNumParcelle(numParcelle);
    const resultats: LigneResolution[] = [];
    for (const ref of refs) {
      const parcelle = await fetchCadastre(
        apicartoParamsParAttributs(insee, ref.section, ref.numero),
      );
      resultats.push({
        ref: `${ref.section}${ref.numero}`,
        idu: parcelle?.idu ?? null,
        commune: parcelle?.commune ?? null,
      });
    }
    setLignes(resultats);
    setLoading(false);
  };

  return (
    <>
      <div className="fr-grid-row fr-grid-row--gutters fr-mb-2w">
        <div className="fr-col-12 fr-col-md-3">
          <div className="fr-input-group">
            <label className="fr-label" htmlFor="insee">
              Code INSEE
              <span className="fr-hint-text">Ex. 77305 (5 chiffres)</span>
            </label>
            <input
              className="fr-input"
              id="insee"
              value={insee}
              onChange={(e) => setInsee(e.target.value)}
            />
          </div>
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <div className="fr-input-group">
            <label className="fr-label" htmlFor="numParcelle">
              Numéro(s) de parcelle
              <span className="fr-hint-text">Ex. AB160/161/163 ou AC578/ZB580</span>
            </label>
            <input
              className="fr-input"
              id="numParcelle"
              value={numParcelle}
              onChange={(e) => setNumParcelle(e.target.value)}
            />
          </div>
        </div>
        <div className="fr-col-12 fr-col-md-3 flex items-end">
          <button
            type="button"
            className="fr-btn fr-mt-md-4w"
            onClick={() => void resoudre()}
            disabled={loading}
          >
            {loading ? "Résolution…" : "Résoudre"}
          </button>
        </div>
      </div>

      {lignes && <ResultatTable lignes={lignes} />}
    </>
  );
}
