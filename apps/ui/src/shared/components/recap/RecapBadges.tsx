import React from "react";
import { ImpactCritere, ImpactNiveau, SaisieCritere } from "@mutafriches/shared-types";

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

const IMPACT_BADGE_CLASS: Record<ImpactNiveau, string> = {
  "tres-positif": "fr-badge--green-emeraude",
  positif: "fr-badge--success",
  neutre: "fr-badge--yellow-tournesol",
  negatif: "fr-badge--error",
  "tres-negatif": "fr-badge--error",
};

/**
 * Badge d'impact d'un critère sur un usage (couleur selon le niveau).
 */
export const ImpactBadge: React.FC<{ impact: ImpactCritere }> = ({ impact }) => (
  <p className={`fr-badge fr-badge--sm ${IMPACT_BADGE_CLASS[impact.niveau]}`}>{impact.label}</p>
);
