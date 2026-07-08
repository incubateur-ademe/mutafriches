import React from "react";
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  SOURCES_DONNEES,
  getCriteresManuels,
  getCriteresPourSource,
  type CritereMetadata,
  type SourceDonnees,
} from "@mutafriches/shared-types";

const BLEU = "#000091";
const GRIS = "#666666";
const BORDURE = "#e5e5e5";

const TYPE_LABELS: Record<SourceDonnees["type"], string> = {
  "api-externe": "API externe",
  "referentiel-local": "Référentiel local",
};

const s = StyleSheet.create({
  page: {
    paddingTop: 92,
    paddingBottom: 40,
    paddingHorizontal: 32,
    fontSize: 9,
    color: "#161616",
    fontFamily: "Helvetica",
  },
  header: {
    position: "absolute",
    top: 24,
    left: 32,
    right: 32,
    flexDirection: "row",
    alignItems: "center",
  },
  rfBlock: { marginRight: 12 },
  rfTitle: { fontSize: 7, fontFamily: "Helvetica-Bold", lineHeight: 1.1 },
  rfDevise: { fontSize: 6, fontFamily: "Helvetica-Oblique", color: "#3a3a3a", lineHeight: 1.1 },
  brand: { marginLeft: 6 },
  brandTitle: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  brandSub: { fontSize: 8, color: GRIS },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 32,
    right: 32,
    flexDirection: "row",
    alignItems: "center",
    fontSize: 7,
    color: "#7b7b7b",
  },
  footerText: { width: "100%", textAlign: "center" },
  footerPage: { position: "absolute", right: 0 },
  h1: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 10 },
  h2: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 16, marginBottom: 8 },
  lead: { fontSize: 10, color: GRIS, marginBottom: 10, lineHeight: 1.4 },
  callout: {
    backgroundColor: "#F0F4FE",
    borderLeft: "4px solid #6A6AF4",
    borderRadius: 3,
    padding: 12,
    marginBottom: 8,
  },
  sourceBlock: { marginBottom: 14 },
  sourceTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", color: BLEU, marginBottom: 2 },
  meta: { fontSize: 8, color: GRIS, marginBottom: 4 },
  badge: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#0063CB",
    backgroundColor: "#E8EDFF",
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 3,
  },
  subtitle: { fontSize: 9, fontFamily: "Helvetica-Bold", marginTop: 6, marginBottom: 2 },
  li: { marginLeft: 8, marginBottom: 1 },
  bold: { fontFamily: "Helvetica-Bold" },
  muted: { color: GRIS },
  headerRow: { flexDirection: "row", borderBottom: "1.5px solid #161616", paddingVertical: 3 },
  row: {
    flexDirection: "row",
    borderBottom: `1px solid ${BORDURE}`,
    paddingVertical: 3,
    alignItems: "center",
  },
  cellCritere: { flexGrow: 4, flexBasis: 0, paddingRight: 4 },
  cellPoids: { flexGrow: 1, flexBasis: 0, textAlign: "right" },
});

const dateComplete = (): string =>
  new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

const PdfHeader: React.FC = () => (
  <View style={s.header} fixed>
    <View style={s.rfBlock}>
      <Text style={s.rfTitle}>RÉPUBLIQUE</Text>
      <Text style={s.rfTitle}>FRANÇAISE</Text>
      <Text style={s.rfDevise}>Liberté</Text>
      <Text style={s.rfDevise}>Égalité</Text>
      <Text style={s.rfDevise}>Fraternité</Text>
    </View>
    <Image src="/images/logo-ademe.png" style={{ width: 34, height: 40 }} />
    <View style={s.brand}>
      <Text style={s.brandTitle}>Mutafriches</Text>
      <Text style={s.brandSub}>Documentation des sources de données</Text>
    </View>
  </View>
);

const PdfFooter: React.FC = () => (
  <View style={s.footer} fixed>
    <Text style={s.footerText}>
      Mutafriches ADEME — Documentation des sources de données — {dateComplete()}
    </Text>
    <Text
      style={s.footerPage}
      render={({ pageNumber, totalPages }) => `${pageNumber}/${totalPages}`}
    />
  </View>
);

const CriteresTable: React.FC<{ criteres: CritereMetadata[] }> = ({ criteres }) => (
  <View>
    <View style={s.headerRow}>
      <Text style={[s.cellCritere, s.bold]}>Critère d'évaluation alimenté</Text>
      <Text style={[s.cellPoids, s.bold]}>Poids</Text>
    </View>
    {criteres.map((critere) => (
      <View key={critere.key} style={s.row}>
        <Text style={s.cellCritere}>{critere.label}</Text>
        <Text style={s.cellPoids}>{critere.poids}</Text>
      </View>
    ))}
  </View>
);

export const SourcesPdfDocument: React.FC = () => {
  const criteresManuels = getCriteresManuels();

  return (
    <Document title="Mutafriches — Documentation des sources de données">
      <Page size="A4" style={s.page}>
        <PdfHeader />
        <Text style={s.h1}>Documentation des sources de données</Text>
        <Text style={s.lead}>
          Pour chaque source de données externe mobilisée par Mutafriches : les champs récupérés, la
          façon dont ils sont traités dans l'algorithme de mutabilité, et les critères d'évaluation
          qu'ils alimentent.
        </Text>

        <View style={s.callout}>
          <Text style={s.bold}>Comment sont utilisées ces données</Text>
          <Text style={{ marginTop: 3 }}>
            L'analyse repose sur 27 critères notés pour 7 usages possibles. 17 critères sont
            enrichis automatiquement à partir des sources ci-dessous, 10 sont saisis manuellement.
            Chaque critère porte un poids (poids total : 29,5). La part des critères renseignés
            détermine l'indice de fiabilité de l'analyse.
          </Text>
        </View>

        <Text style={s.h2}>Sources enrichies automatiquement</Text>
        {SOURCES_DONNEES.map((source) => {
          const criteres = getCriteresPourSource(source);
          return (
            <View key={source.id} style={s.sourceBlock} wrap={false}>
              <Text style={s.sourceTitle}>{source.nom}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                <Text style={s.badge}>{TYPE_LABELS[source.type]}</Text>
                <Text style={[s.meta, { marginLeft: 6, marginBottom: 0 }]}>
                  Opérateur : {source.organisme}
                </Text>
              </View>

              <Text style={s.subtitle}>Champs récupérés</Text>
              {source.champsRecuperes.map((champ) => (
                <Text key={champ} style={s.li}>
                  • {champ}
                </Text>
              ))}

              <Text style={s.subtitle}>Traitement dans l'algorithme</Text>
              <Text>{source.traitementAlgo}</Text>

              <Text style={s.subtitle}>Critères d'évaluation alimentés</Text>
              <CriteresTable criteres={criteres} />
            </View>
          );
        })}

        <View wrap={false}>
          <Text style={s.h2}>Critères saisis manuellement</Text>
          <Text style={[s.muted, { marginBottom: 6 }]}>
            Renseignés par l'utilisateur lors de la qualification du site (le raccordement à l'eau
            est dérivé automatiquement de la surface bâtie, cf. ADR-0019).
          </Text>
          <CriteresTable criteres={criteresManuels} />
        </View>

        <PdfFooter />
      </Page>
    </Document>
  );
};
