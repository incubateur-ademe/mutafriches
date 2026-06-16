import { useState } from "react";
import { EnrichmentLoadingCallout } from "@features/analyser/components/EnrichmentLoadingCallout";
import { diagnostiquerIdu, DiagnosticResult, DiagnosticStatut } from "../diagnostic";
import { lienGeoportail } from "../geoportail";
import "./DiagnosticIduTab.css";

const BADGE: Record<DiagnosticStatut, { label: string; variant: string }> = {
  trouvee: { label: "Trouvée", variant: "success" },
  "format-invalide": { label: "Format invalide", variant: "error" },
  "commune-inconnue": { label: "Commune inconnue", variant: "error" },
  "section-absente": { label: "Section absente", variant: "warning" },
  "numero-introuvable": { label: "Numéro introuvable", variant: "warning" },
  erreur: { label: "Erreur API", variant: "error" },
};

// Concurrence maximale d'appels au cadastre (évite de saturer apicarto sur de grandes listes)
const CONCURRENCE = 6;

// Exécute fn sur chaque item avec une concurrence bornée, en préservant l'ordre.
async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
  onDone: () => void,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const worker = async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index]);
      onDone();
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export function DiagnosticIduTab() {
  const [value, setValue] = useState("");
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

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
    setProgress({ done: 0, total: idus.length });
    try {
      const res = await mapPool(idus, CONCURRENCE, diagnostiquerIdu, () =>
        setProgress((p) => ({ ...p, done: p.done + 1 })),
      );
      setResults(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
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
        className="fr-btn fr-mb-2w"
        onClick={handleDiagnostiquer}
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? "Diagnostic en cours..." : "Diagnostiquer"}
      </button>

      {loading && (
        <EnrichmentLoadingCallout
          title="Diagnostic des parcelles en cours..."
          subtitle={`${progress.done} / ${progress.total} parcelles analysées`}
        />
      )}

      {!loading && results.length > 0 && (
        <div className="fr-table fr-table--bordered">
          <table>
            <thead>
              <tr>
                <th scope="col" className="idu-statut-col">
                  Statut
                </th>
                <th scope="col">Vérif. 2ᵉ source</th>
                <th scope="col">IDU</th>
                <th scope="col">Commune</th>
                <th scope="col">Section</th>
                <th scope="col">Numéro</th>
                <th scope="col">Détail</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => {
                const badge = BADGE[r.statut];
                const cibleGeo = r.coordonnees ?? r.centreCommune;
                return (
                  <tr key={`${r.iduSaisi}-${i}`}>
                    <td className="idu-statut-col">
                      <p className={`fr-badge fr-badge--${badge.variant}`}>{badge.label}</p>
                    </td>
                    <td>
                      {r.geocodeurTrouve === undefined ? (
                        "—"
                      ) : (
                        <p
                          className={`fr-badge fr-badge--${r.geocodeurTrouve ? "success" : "warning"}`}
                        >
                          {r.geocodeurTrouve ? "Présente" : "Absente"}
                        </p>
                      )}
                    </td>
                    <td>
                      <code>{r.iduSaisi}</code>
                    </td>
                    <td>{r.commune ?? "—"}</td>
                    <td>{r.parts?.section ?? "—"}</td>
                    <td>{r.parts?.numero ?? "—"}</td>
                    <td className="fr-text--sm">
                      {r.message}
                      {r.adresse && (
                        <>
                          <br />
                          <span className="fr-text--xs">
                            {r.statut === "trouvee" ? "Adresse : " : "À proximité : "}
                            {r.adresse}
                          </span>
                        </>
                      )}
                      {cibleGeo && (
                        <>
                          <br />
                          <a
                            className="fr-link fr-link--sm fr-icon-external-link-line fr-link--icon-right"
                            href={lienGeoportail(cibleGeo, r.coordonnees ? 19 : 18)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Voir sur le Géoportail
                          </a>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
