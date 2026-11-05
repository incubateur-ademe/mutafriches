import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  SOURCES_DONNEES,
  getCriteresManuels,
  getCriteresPourSource,
  MENTION_SOURCE_SANS_CRITERE,
  CRITERES_STATS,
  POIDS_TOTAL_AFFICHE,
  type CritereMetadata,
  type SourceDonnees,
} from "@mutafriches/shared-types";
import {
  enregistrerPolicesPdf,
  PDF_COULEURS,
  PDF_GRAISSE,
  PDF_MARGES,
  PDF_POLICE,
  PdfEnTete,
  PdfPiedDePage,
} from "@shared/pdf";

enregistrerPolicesPdf();

const BLEU = PDF_COULEURS.bleuFrance;
const GRIS = PDF_COULEURS.mention;
const BORDURE = PDF_COULEURS.filetLigne;
const GRAS = PDF_GRAISSE.grasse;

const TYPE_LABELS: Record<SourceDonnees["type"], string> = {
  "api-externe": "API externe",
  "referentiel-local": "Référentiel local",
};

const s = StyleSheet.create({
  page: {
    paddingTop: PDF_MARGES.haut,
    paddingBottom: PDF_MARGES.bas,
    paddingHorizontal: PDF_MARGES.cotes,
    fontFamily: PDF_POLICE,
    fontSize: 9,
    // Interligne résolu sur le corps du même style : chaque changement de corps le redéfinit
    lineHeight: 1.3,
    color: PDF_COULEURS.texte,
  },
  h1: { fontSize: 18, lineHeight: 1.2, fontWeight: GRAS, marginBottom: 10 },
  h2: { fontSize: 13, lineHeight: 1.2, fontWeight: GRAS, marginTop: 16, marginBottom: 8 },
  lead: { fontSize: 10, color: GRIS, marginBottom: 10, lineHeight: 1.4 },
  callout: {
    backgroundColor: PDF_COULEURS.fondEncadre,
    borderLeft: `4px solid ${BLEU}`,
    padding: 12,
    marginBottom: 8,
  },
  sourceBlock: { marginBottom: 14 },
  sourceTitle: { fontSize: 12, lineHeight: 1.2, fontWeight: GRAS, color: BLEU, marginBottom: 2 },
  meta: { fontSize: 8, lineHeight: 1.3, color: GRIS, marginBottom: 4 },
  badge: {
    fontSize: 7,
    lineHeight: 1.2,
    fontWeight: GRAS,
    color: "#0063CB",
    backgroundColor: "#E8EDFF",
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 3,
  },
  subtitle: { fontWeight: GRAS, marginTop: 6, marginBottom: 2 },
  li: { marginLeft: 8, marginBottom: 1 },
  bold: { fontWeight: GRAS },
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

const TITRE = "Documentation des sources de données";

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
        <PdfEnTete sousTitre={TITRE} />
        <Text style={s.h1}>Documentation des sources de données</Text>
        <Text style={s.lead}>
          Pour chaque source de données externe mobilisée par Mutafriches : les champs récupérés, la
          façon dont ils sont traités dans l'algorithme de mutabilité, et les critères d'évaluation
          qu'ils alimentent.
        </Text>

        <View style={s.callout}>
          <Text style={s.bold}>Comment sont utilisées ces données</Text>
          <Text style={{ marginTop: 3 }}>
            L'analyse repose sur {CRITERES_STATS.total} critères notés pour 7 usages possibles.{" "}
            {CRITERES_STATS.automatiques} critères sont enrichis automatiquement à partir des
            sources ci-dessous, {CRITERES_STATS.manuels} sont saisis manuellement. Chaque critère
            porte un poids (poids total : {POIDS_TOTAL_AFFICHE}). La part des critères renseignés
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
              {criteres.length > 0 ? (
                <CriteresTable criteres={criteres} />
              ) : (
                <Text>{MENTION_SOURCE_SANS_CRITERE}</Text>
              )}
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

        <PdfPiedDePage segments={["Mutafriches Ademe", TITRE, dateComplete()]} />
      </Page>
    </Document>
  );
};
