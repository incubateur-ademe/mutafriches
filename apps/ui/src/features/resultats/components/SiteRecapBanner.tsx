import React from "react";
import { extraireDepartement } from "../../../shared/utils/cadastre.utils";

interface SiteRecapBannerProps {
  commune?: string;
  /** Identifiant cadastral, sert à dériver le code département affiché entre parenthèses */
  identifiantParcelle?: string;
  nombreParcelles?: number;
  /** Surface déjà formatée (ex : "11 338 m²") */
  surface?: string;
  onVoirRecap: () => void;
}

/**
 * Bandeau de synthèse du site (commune, parcelles, surface) avec accès au récapitulatif détaillé.
 */
export const SiteRecapBanner: React.FC<SiteRecapBannerProps> = ({
  commune,
  identifiantParcelle,
  nombreParcelles,
  surface,
  onVoirRecap,
}) => {
  const departement = extraireDepartement(identifiantParcelle);
  const titreSite = commune
    ? `Site de ${commune}${departement ? ` (${departement})` : ""}`
    : "Récapitulatif du site";
  const labelParcelles =
    nombreParcelles && nombreParcelles > 1
      ? `${nombreParcelles} parcelles`
      : `${nombreParcelles ?? 1} parcelle`;

  return (
    <div
      className="fr-p-2w fr-mb-4w"
      // Fond bleu clair DSFR non couvert par une classe utilitaire dédiée
      style={{
        backgroundColor: "var(--background-alt-blue-france)",
        borderRadius: "8px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1.5rem" }}>
        <strong>{titreSite}</strong>
        <span style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span>{labelParcelles}</span>
          <span aria-hidden="true" style={{ color: "var(--border-default-grey)" }}>
            |
          </span>
          <span>{surface}</span>
        </span>
      </div>

      <button
        type="button"
        className="fr-link"
        style={{ textDecoration: "underline" }}
        onClick={onVoirRecap}
      >
        voir récapitulatif du site
      </button>
    </div>
  );
};
