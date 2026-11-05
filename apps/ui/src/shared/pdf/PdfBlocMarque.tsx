import React from "react";
import { G, Path, Rect, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import { DEVISE_GLYPHES, DEVISE_PLACEMENTS, MARIANNE_TRACES } from "./blocMarque.traces";
import { PDF_COULEURS, PDF_GRAISSE } from "./pdfTheme";

// Proportions du fr-logo du DSFR : drapeau 44×16, devise 126×90
const LARGEUR_DRAPEAU = 26;
const LARGEUR_DEVISE = 24;

const s = StyleSheet.create({
  intitule: {
    fontSize: 8.5,
    fontWeight: PDF_GRAISSE.grasse,
    lineHeight: 1.03,
    letterSpacing: -0.1,
  },
});

export const PdfBlocMarque: React.FC = () => (
  <View>
    <Svg width={LARGEUR_DRAPEAU} height={(LARGEUR_DRAPEAU * 16) / 44} viewBox="0 0 44 16">
      <Rect x={0} y={0} width={22} height={16} fill={PDF_COULEURS.bleuFrance} />
      <Rect x={22} y={0} width={22} height={16} fill={PDF_COULEURS.rougeMarianne} />
      <G transform="translate(0, -1)">
        {MARIANNE_TRACES.map((trace, i) => (
          <Path key={i} d={trace.d} fill={trace.couleur} />
        ))}
      </G>
    </Svg>
    {/* Deux Text plutôt qu'un saut de ligne, qui ajoute une référence à Helvetica dans le PDF */}
    <View style={{ marginTop: 4 }}>
      <Text style={s.intitule}>RÉPUBLIQUE</Text>
      <Text style={s.intitule}>FRANÇAISE</Text>
    </View>
    <Svg
      width={LARGEUR_DEVISE}
      height={(LARGEUR_DEVISE * 90) / 126}
      viewBox="0 0 126 90"
      style={{ marginTop: 4 }}
    >
      {DEVISE_PLACEMENTS.flatMap((placement, i) =>
        DEVISE_GLYPHES[placement.glyphe].map((trace, j) => (
          <Path
            key={`${i}-${j}`}
            d={trace.d}
            transform={`translate(${placement.x + trace.dx}, ${placement.y + trace.dy})`}
            fill={PDF_COULEURS.texte}
          />
        )),
      )}
    </Svg>
  </View>
);
