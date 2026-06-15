import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@shared/components/layout/Layout";
import { diagnostiquerIdu, DiagnosticResult, DiagnosticStatut } from "../diagnostic";

const BADGE: Record<DiagnosticStatut, { label: string; variant: string }> = {
  trouvee: { label: "Trouvée", variant: "success" },
  "format-invalide": { label: "Format invalide", variant: "error" },
  "commune-inconnue": { label: "Commune inconnue", variant: "error" },
  "section-absente": { label: "Section absente", variant: "warning" },
  "numero-introuvable": { label: "Numéro introuvable", variant: "warning" },
  erreur: { label: "Erreur API", variant: "error" },
};

export function TestIduDiagnostic() {
  const [value, setValue] = useState("");
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleDiagnostiquer = async () => {
    const idus = Array.from(
      new Set(
        value
          .split(/[\n,;]/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0),
      ),
    );
    if (idus.length === 0) return;

    setLoading(true);
    setResults([]);
    try {
      const res = await Promise.all(idus.map((idu) => diagnostiquerIdu(idu)));
      setResults(res);
    } finally {
      setLoading(false);
    }
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
                  Diagnostic IDU
                </a>
              </li>
            </ol>
          </div>
        </nav>

        <h1 id="diagnostic-idu">Diagnostic IDU</h1>
        <p className="fr-text--lead fr-mb-4w">
          Vérifie pourquoi un identifiant cadastral (IDU) est trouvé ou rejeté par le cadastre IGN :
          format, commune, section, et existence du numéro de parcelle.
        </p>

        <div className="fr-input-group fr-mb-2w">
          <label className="fr-label" htmlFor="idu-input">
            Identifiants de parcelles
            <span className="fr-hint-text">
              Un IDU par ligne (ou séparés par des virgules). Exemple : 920360000L0266
            </span>
          </label>
          <textarea
            id="idu-input"
            className="fr-input"
            rows={6}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="920360000L0266&#10;49222000AB0174"
          />
        </div>

        <button
          type="button"
          className="fr-btn fr-mb-4w"
          onClick={handleDiagnostiquer}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? "Diagnostic en cours..." : "Diagnostiquer"}
        </button>

        {results.length > 0 && (
          <div className="fr-table fr-table--bordered">
            <table>
              <thead>
                <tr>
                  <th scope="col">IDU</th>
                  <th scope="col">Commune</th>
                  <th scope="col">Section</th>
                  <th scope="col">Numéro</th>
                  <th scope="col">Statut</th>
                  <th scope="col">Détail</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => {
                  const badge = BADGE[r.statut];
                  return (
                    <tr key={`${r.iduSaisi}-${i}`}>
                      <td>
                        <code>{r.iduSaisi}</code>
                      </td>
                      <td>{r.commune ?? "—"}</td>
                      <td>{r.parts?.section ?? "—"}</td>
                      <td>{r.parts?.numero ?? "—"}</td>
                      <td>
                        <span className={`fr-badge fr-badge--sm fr-badge--${badge.variant}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="fr-text--sm">{r.message}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
