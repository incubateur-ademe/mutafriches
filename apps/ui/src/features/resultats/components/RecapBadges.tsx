import React from "react";
import { SaisieCritere } from "@mutafriches/shared-types";

/**
 * Badge indiquant le mode de saisie d'un critère.
 * AUTOMATIQUE : vert + coche. MANUELLE : jaune + crayon.
 */
export const SaisieBadge: React.FC<{ saisie: SaisieCritere }> = ({ saisie }) => {
  if (saisie === "MANUELLE") {
    return (
      <p className="fr-badge fr-badge--sm fr-badge--yellow-tournesol fr-badge--icon-left fr-icon-edit-line">
        Manuelle
      </p>
    );
  }
  return (
    <p className="fr-badge fr-badge--sm fr-badge--success fr-badge--icon-left fr-icon-checkbox-circle-line">
      Automatique
    </p>
  );
};

/**
 * Badge de la source d'enrichissement (vert + coche).
 */
export const SourceBadge: React.FC<{ label: string }> = ({ label }) => (
  <p className="fr-badge fr-badge--sm fr-badge--success fr-badge--icon-left fr-icon-checkbox-circle-line">
    {label}
  </p>
);
