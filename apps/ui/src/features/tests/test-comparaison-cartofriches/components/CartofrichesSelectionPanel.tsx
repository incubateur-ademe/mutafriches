import { useState } from "react";
import type { FricheCarte } from "@mutafriches/shared-types";
import { cartofrichesService } from "@shared/services/api/api.cartofriches.service";
import type { CommuneSuggestion } from "@shared/services/geo/api.commune.service";
import { CommuneSearchInput } from "./CommuneSearchInput";
import { CartofrichesFrichesMap } from "./CartofrichesFrichesMap";
import { couleurStatut, libelleStatut } from "./fricheMarkerIcon";

interface CartofrichesSelectionPanelProps {
  /** Compare une friche (ses parcelles) et l'ajoute au comparatif */
  onComparer: (refcad: string[]) => void;
  desactive: boolean;
}

function cleFriche(friche: FricheCarte): string {
  return friche.refcad.join(",");
}

function formatSurface(surface: number | null): string {
  if (surface === null) return "—";
  return `${Math.round(surface).toLocaleString("fr-FR")} m²`;
}

/**
 * Onglet « Depuis Cartofriches » : recherche d'une commune, puis affichage des friches
 * Cartofriches (carte des emprises + liste), cliquables pour lancer la comparaison.
 */
export function CartofrichesSelectionPanel({
  onComparer,
  desactive,
}: CartofrichesSelectionPanelProps) {
  const [commune, setCommune] = useState<CommuneSuggestion | null>(null);
  const [friches, setFriches] = useState<FricheCarte[]>([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [survolee, setSurvolee] = useState<string | null>(null);

  const chargerCommune = async (c: CommuneSuggestion): Promise<void> => {
    setCommune(c);
    setChargement(true);
    setErreur(null);
    setFriches([]);
    try {
      const result = await cartofrichesService.getFrichesCommune(c.code);
      if (result.erreur) {
        setErreur(`Cartofriches indisponible (${result.erreur})`);
      }
      setFriches(result.friches);
    } catch {
      setErreur("Erreur lors du chargement des friches Cartofriches");
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="fr-p-2w">
      <CommuneSearchInput
        onCommuneSelected={(c) => void chargerCommune(c)}
        desactive={desactive || chargement}
      />

      {chargement ? (
        <p className="fr-mt-2w">
          <span className="fr-icon-refresh-line" aria-hidden="true" /> Chargement des friches de{" "}
          {commune?.nom}…
        </p>
      ) : null}

      {erreur ? (
        <div className="fr-alert fr-alert--warning fr-mt-2w">
          <p>{erreur}</p>
        </div>
      ) : null}

      {!chargement && commune && friches.length === 0 && !erreur ? (
        <p className="fr-mt-2w fr-text--sm">Aucune friche Cartofriches dans {commune.nom}.</p>
      ) : null}

      {friches.length > 0 ? (
        <div className="fr-grid-row fr-grid-row--gutters fr-mt-2w">
          <div className="fr-col-12 fr-col-md-7">
            <CartofrichesFrichesMap
              friches={friches}
              onSelectFriche={(f) => onComparer(f.refcad)}
              refcadSurvolee={survolee}
              onHoverFriche={setSurvolee}
            />
            <div className="fr-mt-1w fr-text--xs" style={{ display: "flex", gap: "1rem" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                <span
                  className="mf-cf-statut-dot"
                  style={{ background: couleurStatut("sans projet") }}
                />
                Sans projet
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                <span
                  className="mf-cf-statut-dot"
                  style={{ background: couleurStatut("avec projet") }}
                />
                Avec projet / reconvertie
              </span>
            </div>
          </div>

          <div className="fr-col-12 fr-col-md-5">
            <p className="fr-text--sm fr-mb-1w">
              <strong>
                {friches.length} friche{friches.length > 1 ? "s" : ""}
              </strong>{" "}
              dans {commune?.nom}
            </p>
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                maxHeight: "640px",
                overflowY: "auto",
              }}
            >
              {friches.map((friche) => {
                const cle = cleFriche(friche);
                return (
                  <li
                    key={cle}
                    className={`fr-p-1w ${survolee === cle ? "fr-background-alt--grey" : ""}`}
                    style={{ borderBottom: "1px solid var(--border-default-grey)" }}
                    onMouseEnter={() => setSurvolee(cle)}
                    onMouseLeave={() => setSurvolee(null)}
                  >
                    <div
                      className="fr-text--sm"
                      style={{
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                      }}
                    >
                      <span
                        className="mf-cf-statut-dot"
                        style={{ background: couleurStatut(friche.statut) }}
                        title={libelleStatut(friche.statut)}
                      />
                      {friche.nom ?? cle}
                    </div>
                    <div
                      className="fr-text--xs fr-mb-1w"
                      style={{ color: "var(--text-mention-grey)" }}
                    >
                      {libelleStatut(friche.statut)} · {formatSurface(friche.surface)} ·{" "}
                      {friche.refcad.length} parcelle{friche.refcad.length > 1 ? "s" : ""}
                    </div>
                    <button
                      type="button"
                      className="fr-btn fr-btn--sm fr-icon-search-line fr-btn--icon-left"
                      onClick={() => onComparer(friche.refcad)}
                      disabled={desactive}
                    >
                      Comparer
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
