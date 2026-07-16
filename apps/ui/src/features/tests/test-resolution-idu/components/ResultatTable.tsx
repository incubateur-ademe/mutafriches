export interface LigneResolution {
  ref: string; // référence source (n° de parcelle ou coordonnées)
  idu: string | null; // IDU renvoyé par le cadastre, null si introuvable
  commune: string | null;
}

// Tableau de résultats partagé entre les deux modes de résolution (numéro / coordonnées).
export function ResultatTable({ lignes }: { lignes: LigneResolution[] }) {
  return (
    <div className="fr-table fr-table--bordered">
      <table>
        <thead>
          <tr>
            <th>Référence</th>
            <th>IDU</th>
            <th>Commune</th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((l, i) => (
            <tr key={`${l.ref}-${i}`}>
              <td>{l.ref}</td>
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
  );
}
