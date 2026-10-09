import React from "react";
import { IMPACT_TAG_VARIANT, Tag } from "@shared/components/tag";
import { ImpactCritere, SaisieCritere } from "@mutafriches/shared-types";

/**
 * Badge indiquant le mode de saisie d'un critère (automatique : bleu, manuelle : jaune).
 */
export const SaisieBadge: React.FC<{ saisie: SaisieCritere }> = ({ saisie }) =>
  saisie === "MANUELLE" ? (
    <Tag variant="jaune">Manuelle</Tag>
  ) : (
    <Tag variant="bleu">Automatique</Tag>
  );

/**
 * Badge de la source d'enrichissement.
 */
export const SourceBadge: React.FC<{ label: string }> = ({ label }) => (
  <Tag variant="bleu">{label}</Tag>
);

/**
 * Badge d'impact d'un critère sur un usage (couleur selon le niveau).
 */
export const ImpactBadge: React.FC<{ impact: ImpactCritere }> = ({ impact }) => (
  <Tag variant={IMPACT_TAG_VARIANT[impact.niveau]}>{impact.label}</Tag>
);
