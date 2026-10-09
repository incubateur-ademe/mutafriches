import React from "react";
import { TAG_COLORS, TagVariant } from "./tag.tokens";

interface TagProps {
  variant: TagVariant;
  id?: string;
  children: React.ReactNode;
  className?: string;
}

// Badge DSFR dont les teintes viennent de la maquette : aucune classe fr-badge--* n'a ces couleurs,
// d'où le style inline (même source que l'export PDF).
export const Tag: React.FC<TagProps> = ({ variant, id, children, className }) => {
  const { textColor, backgroundColor } = TAG_COLORS[variant];
  return (
    <p
      id={id}
      className={`fr-badge fr-badge--sm fr-badge--no-icon${className ? ` ${className}` : ""}`}
      style={{ color: textColor, backgroundColor }}
    >
      {children}
    </p>
  );
};
