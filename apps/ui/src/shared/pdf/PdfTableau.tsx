import React from "react";
import { StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Styles } from "@react-pdf/renderer";
import type { TagColors } from "@shared/components/tag";
import { PDF_COULEURS, PDF_GRAISSE } from "./pdfTheme";

export interface PdfColonne {
  libelle: string;
  // Part de la largeur du tableau (flexGrow)
  poids: number;
  centree?: boolean;
}

const s = StyleSheet.create({
  badge: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    maxWidth: "100%",
    fontSize: 7,
    lineHeight: 1.15,
    fontWeight: PDF_GRAISSE.grasse,
    paddingTop: 1.5,
    paddingBottom: 1,
    paddingHorizontal: 4,
    borderRadius: 2,
  },
  // Page de synthèse : badges à la taille de la maquette
  badgeGrand: {
    fontSize: 8,
    lineHeight: 1.15,
    paddingTop: 2.5,
    paddingBottom: 2,
    paddingHorizontal: 5,
  },
  tag: {
    fontSize: 7.5,
    lineHeight: 1.2,
    color: PDF_COULEURS.bleuFrance,
    backgroundColor: PDF_COULEURS.fondTag,
    paddingTop: 2,
    paddingBottom: 1.5,
    paddingHorizontal: 5.5,
    borderRadius: 8,
    margin: 2,
  },
  enTete: {
    flexDirection: "row",
    backgroundColor: PDF_COULEURS.fondEnTeteTableau,
    borderBottom: `1px solid ${PDF_COULEURS.filetEnTeteTableau}`,
    paddingVertical: 4,
    fontSize: 8.5,
    lineHeight: 1.2,
  },
  bandeSection: {
    backgroundColor: PDF_COULEURS.fondSection,
    borderBottom: `0.75px solid ${PDF_COULEURS.filetLigne}`,
    paddingVertical: 2.5,
    paddingHorizontal: 6,
    fontSize: 7.5,
    lineHeight: 1.2,
    fontWeight: PDF_GRAISSE.grasse,
    textTransform: "uppercase",
  },
  ligne: {
    flexDirection: "row",
    alignItems: "center",
    borderBottom: `0.75px solid ${PDF_COULEURS.filetLigne}`,
    paddingVertical: 2,
    // Corps réduit pour qu'un usage (32 critères) tienne sur une page, comme sur la maquette
    fontSize: 8.5,
    lineHeight: 1.1,
  },
  ligneAeree: { paddingVertical: 6, fontSize: 9, lineHeight: 1.2 },
});

type StylePdf = Styles[string];

// Majuscules comme fr-badge sur le site (les libellés d'impact arrivent en casse mixte).
// Un segment par tiret : react-pdf ne coupe qu'aux espaces, et une coupure de syllabe
// ajouterait un second tiret (« ENEDIS-ZONES-CONTRAINTE-ENR »).
export const PdfBadge: React.FC<{ libelle: string; couleurs: TagColors; grand?: boolean }> = ({
  libelle,
  couleurs,
  grand = false,
}) => (
  <View
    style={[
      s.badge,
      ...(grand ? [s.badgeGrand] : []),
      { color: couleurs.textColor, backgroundColor: couleurs.backgroundColor },
    ]}
  >
    {libelle
      .toLocaleUpperCase("fr-FR")
      .split(/(?<=-)/)
      .map((segment, i) => (
        <Text key={i}>{segment}</Text>
      ))}
  </View>
);

// Tag décoratif bleu France, comme les fr-tag du podium sur le site
export const PdfTag: React.FC<{ libelle: string }> = ({ libelle }) => (
  <Text style={s.tag}>{libelle}</Text>
);

const styleCellule = (colonne: PdfColonne): StylePdf => ({
  flexBasis: 0,
  flexGrow: colonne.poids,
  paddingHorizontal: 6,
  ...(colonne.centree ? { alignItems: "center", textAlign: "center" } : {}),
});

export const PdfEnTeteTableau: React.FC<{ colonnes: PdfColonne[] }> = ({ colonnes }) => (
  <View style={s.enTete} wrap={false}>
    {colonnes.map((colonne) => (
      <Text
        key={colonne.libelle}
        style={[styleCellule(colonne), { fontWeight: PDF_GRAISSE.grasse }]}
      >
        {colonne.libelle}
      </Text>
    ))}
  </View>
);

// Ne laisse jamais un titre de section seul en bas de page
export const PdfBandeSection: React.FC<{ titre: string }> = ({ titre }) => (
  <Text style={s.bandeSection} minPresenceAhead={40}>
    {titre}
  </Text>
);

// Un enfant par colonne, dans l'ordre de colonnes
export const PdfLigneTableau: React.FC<{
  colonnes: PdfColonne[];
  // Lignes hautes et corps normal quand la page a de la place (tableau des usages)
  aeree?: boolean;
  children: React.ReactNode;
}> = ({ colonnes, aeree = false, children }) => (
  <View style={aeree ? [s.ligne, s.ligneAeree] : s.ligne} wrap={false}>
    {React.Children.map(children, (cellule, i) => (
      <View style={styleCellule(colonnes[i])}>{cellule}</View>
    ))}
  </View>
);
