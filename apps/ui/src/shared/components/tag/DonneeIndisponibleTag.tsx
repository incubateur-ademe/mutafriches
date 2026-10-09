import React from "react";
import { Tag } from "./Tag";
import { LABEL_DONNEE_NON_ACCESSIBLE, LABEL_DONNEE_NON_COUVERTE } from "./tag.tokens";

interface DonneeIndisponibleTagProps {
  // non-accessible : erreur ou valeur absente ; non-couverte : territoire hors du référentiel
  motif?: "non-accessible" | "non-couverte";
  id?: string;
}

export const DonneeIndisponibleTag: React.FC<DonneeIndisponibleTagProps> = ({
  motif = "non-accessible",
  id,
}) => (
  <Tag variant="rose" id={id}>
    {motif === "non-couverte" ? LABEL_DONNEE_NON_COUVERTE : LABEL_DONNEE_NON_ACCESSIBLE}
  </Tag>
);
