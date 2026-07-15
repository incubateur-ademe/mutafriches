import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ApicartoCadastreResponse,
  apicartoCadastreUrl,
  apicartoParamsParAttributs,
  apicartoParamsParPoint,
  buildIduCandidate,
  ParcelleCadastre,
  parseNumParcelle,
  premiereParcelle,
} from "@mutafriches/shared-types";
import { Layout } from "../../../../shared/components/layout/Layout";

// Frontière I/O navigateur (les conventions apicarto vivent dans shared-types).
async function fetchCadastre(params: Record<string, string>): Promise<ParcelleCadastre | null> {
  const res = await fetch(apicartoCadastreUrl(params));
  if (!res.ok) return null;
  return premiereParcelle((await res.json()) as ApicartoCadastreResponse);
}

interface LigneResolution {
  ref: string;
  candidat: string;
  idu: string | null;
  commune: string | null;
}

export function CoordIduPage() {
  const [insee, setInsee] = useState("77305");
  const [numParcelle, setNumParcelle] = useState("AB160/161/163");
  const [lignes, setLignes] = useState<LigneResolution[] | null>(null);
  const [loadingAttrs, setLoadingAttrs] = useState(false);

  const [lon, setLon] = useState("2.95");
  const [lat, setLat] = useState("48.386");
  const [pointResult, setPointResult] = useState<string | null>(null);
  const [loadingPoint, setLoadingPoint] = useState(false);

  const resoudreParAttributs = async (): Promise<void> => {
    setLoadingAttrs(true);
    setLignes(null);
    const refs = parseNumParcelle(numParcelle);
    const resultats: LigneResolution[] = [];
    for (const ref of refs) {
      const parcelle = await fetchCadastre(
        apicartoParamsParAttributs(insee, ref.section, ref.numero),
      );
      resultats.push({
        ref: `${ref.section}${ref.numero}`,
        candidat: buildIduCandidate(insee, ref.section, ref.numero),
        idu: parcelle?.idu ?? null,
        commune: parcelle?.commune ?? null,
      });
    }
    setLignes(resultats);
    setLoadingAttrs(false);
  };

  const resoudreParPoint = async (): Promise<void> => {
    setLoadingPoint(true);
    setPointResult(null);
    const parcelle = await fetchCadastre(apicartoParamsParPoint(Number(lon), Number(lat)));
    setPointResult(
      parcelle ? `${parcelle.idu} — ${parcelle.commune ?? "?"}` : "Aucune parcelle à ce point",
    );
    setLoadingPoint(false);
  };

  return (
    <Layout>
      <div className="content-editorial fr-col-12">
        <nav role="navigation" className="fr-breadcrumb" aria-label="vous êtes ici :">
          <div className="fr-collapse" id="breadcrumb">
            <ol className="fr-breadcrumb__list">
              <li>
                <Link className="fr-breadcrumb__link" to="/">
                  Accueil
                </Link>
              </li>
              <li>
                <Link className="fr-breadcrumb__link" to="/tests">
                  Tests
                </Link>
              </li>
              <li>
                <a className="fr-breadcrumb__link" aria-current="page">
                  Coordonnées → IDU
                </a>
              </li>
            </ol>
          </div>
        </nav>

        <h1>Résolution d'IDU cadastral</h1>
        <p className="fr-text--lead">
          Retrouver l'identifiant unique de parcelle (IDU) à partir d'un numéro de parcelle ou de
          coordonnées, via l'API Carto Cadastre (IGN). Outil utilisé pour l'onboarding des
          partenaires dont l'inventaire ne fournit pas d'IDU.
        </p>

        <div className="fr-callout fr-mb-4w">
          <p className="fr-callout__text fr-text--sm">
            Les coordonnées Lambert-93 des fichiers partenaires sont traitées par lots via le script{" "}
            <code>resolve-idu-scet</code>. Cette page vérifie ponctuellement les deux modes de
            résolution en WGS84.
          </p>
        </div>

        <h2>Par numéro de parcelle</h2>
        <div className="fr-grid-row fr-grid-row--gutters fr-mb-2w">
          <div className="fr-col-12 fr-col-md-3">
            <div className="fr-input-group">
              <label className="fr-label" htmlFor="insee">
                Code INSEE
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
              onClick={() => void resoudreParAttributs()}
              disabled={loadingAttrs}
            >
              {loadingAttrs ? "Résolution…" : "Résoudre"}
            </button>
          </div>
        </div>

        {lignes && (
          <div className="fr-table fr-table--bordered fr-mb-6w">
            <table>
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>IDU candidat</th>
                  <th>IDU réel (cadastre)</th>
                  <th>Commune</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l) => (
                  <tr key={l.ref}>
                    <td>{l.ref}</td>
                    <td>
                      <code>{l.candidat}</code>
                    </td>
                    <td>
                      {l.idu ? (
                        <code>{l.idu}</code>
                      ) : (
                        <span className="fr-badge fr-badge--error fr-badge--sm">Introuvable</span>
                      )}
                    </td>
                    <td>{l.commune ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h2>Par coordonnées (WGS84)</h2>
        <div className="fr-grid-row fr-grid-row--gutters fr-mb-2w">
          <div className="fr-col-12 fr-col-md-3">
            <div className="fr-input-group">
              <label className="fr-label" htmlFor="lon">
                Longitude
              </label>
              <input
                className="fr-input"
                id="lon"
                value={lon}
                onChange={(e) => setLon(e.target.value)}
              />
            </div>
          </div>
          <div className="fr-col-12 fr-col-md-3">
            <div className="fr-input-group">
              <label className="fr-label" htmlFor="lat">
                Latitude
              </label>
              <input
                className="fr-input"
                id="lat"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
              />
            </div>
          </div>
          <div className="fr-col-12 fr-col-md-3 flex items-end">
            <button
              type="button"
              className="fr-btn fr-mt-md-4w"
              onClick={() => void resoudreParPoint()}
              disabled={loadingPoint}
            >
              {loadingPoint ? "Résolution…" : "Résoudre"}
            </button>
          </div>
        </div>

        {pointResult && (
          <div className="fr-alert fr-alert--info fr-mb-6w">
            <p>
              <code>{pointResult}</code>
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
