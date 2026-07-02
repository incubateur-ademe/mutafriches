import type { LigneEcart } from "../utils/comparaison";

interface EcartsDetailProps {
  lignes: LigneEcart[];
}

/** Badge DSFR selon le statut de comparaison d'une ligne */
function statutBadge(ligne: LigneEcart): { label: string; variant: string } {
  if (!ligne.comparable) return { label: "Non comparable", variant: "fr-badge--info" };
  if (ligne.ecart) return { label: "Écart", variant: "fr-badge--error" };
  return { label: "Concordant", variant: "fr-badge--success" };
}

/**
 * Tableau détaillé des écarts d'un site (une ligne par champ comparé).
 */
export function EcartsDetail({ lignes }: EcartsDetailProps) {
  if (lignes.length === 0) {
    return (
      <p className="fr-text--sm fr-mb-0">
        Aucune friche correspondante trouvée dans Cartofriches pour cet identifiant.
      </p>
    );
  }

  return (
    <div className="fr-table fr-table--bordered fr-mb-0">
      <table>
        <thead>
          <tr>
            <th scope="col">Critère</th>
            <th scope="col">Mutafriches</th>
            <th scope="col">Cartofriches</th>
            <th scope="col">Statut</th>
            <th scope="col">Note</th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((ligne) => {
            const badge = statutBadge(ligne);
            return (
              <tr key={ligne.cle}>
                <td>{ligne.label}</td>
                <td>{ligne.mutafriches}</td>
                <td>{ligne.cartofriches}</td>
                <td>
                  <span className={`fr-badge fr-badge--sm ${badge.variant}`}>{badge.label}</span>
                  {ligne.magnitude ? ` ${ligne.magnitude}` : ""}
                </td>
                <td className="fr-text--xs">
                  {ligne.note ?? ""}
                  {ligne.warning ? (
                    <span
                      className="fr-badge fr-badge--sm fr-badge--warning fr-icon-warning-line fr-badge--icon-left fr-mt-1v"
                      title={ligne.warning}
                      style={{ display: "flex", marginTop: "0.25rem" }}
                    >
                      {ligne.warning}
                    </span>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
