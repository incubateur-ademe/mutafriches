import React from "react";
import { Image, Text, View } from "@react-pdf/renderer";
import { PdfBlocMarque } from "./PdfBlocMarque";
import { PDF_COULEURS, PDF_GRAISSE, PDF_MARGES, PDF_POLICE } from "./pdfTheme";

// En-tête répété sur chaque page : bloc-marque, logo ADEME, nom du service
export const PdfEnTete: React.FC<{ sousTitre: string }> = ({ sousTitre }) => (
  <View
    fixed
    style={{
      position: "absolute",
      top: 30,
      left: PDF_MARGES.cotes,
      right: PDF_MARGES.cotes,
      flexDirection: "row",
      alignItems: "center",
      fontFamily: PDF_POLICE,
    }}
  >
    <PdfBlocMarque />
    <Image src="/images/logo-ademe.png" style={{ width: 36, height: 43, marginLeft: 14 }} />
    <View style={{ marginLeft: 26 }}>
      <Text style={{ fontSize: 14, lineHeight: 1.2, fontWeight: PDF_GRAISSE.grasse }}>
        Mutafriches
      </Text>
      <Text
        style={{ fontSize: 10, lineHeight: 1.2, color: PDF_COULEURS.texteCourant, marginTop: 4 }}
      >
        {sousTitre}
      </Text>
    </View>
  </View>
);

// Pied de page répété : segments séparés par une barre verticale, numéro de page à droite
export const PdfPiedDePage: React.FC<{ segments: string[] }> = ({ segments }) => (
  <View
    fixed
    style={{
      position: "absolute",
      bottom: 20,
      left: PDF_MARGES.cotes,
      right: PDF_MARGES.cotes,
      flexDirection: "row",
      alignItems: "center",
      fontSize: 9,
      lineHeight: 1.2,
      color: PDF_COULEURS.texte,
      fontFamily: PDF_POLICE,
    }}
  >
    <Text style={{ width: "100%", textAlign: "center" }}>{segments.join("  |  ")}</Text>
    <Text
      style={{ position: "absolute", right: 0 }}
      render={({ pageNumber, totalPages }) => `${pageNumber}/${totalPages}`}
    />
  </View>
);
