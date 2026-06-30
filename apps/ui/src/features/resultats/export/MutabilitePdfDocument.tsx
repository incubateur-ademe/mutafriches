import React from "react";
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  buildDetailUsage,
  buildRecapitulatifSite,
  type ImpactNiveau,
  type UsageResultatDetaille,
} from "@mutafriches/shared-types";
import { getBadgeConfig, getUsageInfo } from "../utils/usagesLabels.utils";
import type { ResultatsExportData } from "./types";

// Couleurs d'impact (cohérentes avec les badges DSFR de l'UI).
const IMPACT_COLORS: Record<ImpactNiveau, { bg: string; text: string }> = {
  "tres-positif": { bg: "#B8FEC9", text: "#18753C" },
  positif: { bg: "#C9FCAC", text: "#208D49" },
  neutre: { bg: "#FEECC2", text: "#716043" },
  negatif: { bg: "#FFBDBE", text: "#8D533E" },
  "tres-negatif": { bg: "#FFBDBE", text: "#8D533E" },
};

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, color: "#161616", fontFamily: "Helvetica" },
  h1: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 4, color: "#000091" },
  h2: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 14, marginBottom: 6 },
  muted: { color: "#666666" },
  subtitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 10,
    marginBottom: 4,
    color: "#000091",
  },
  badge: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 3,
  },
  row: { flexDirection: "row", borderBottom: "1px solid #e5e5e5", paddingVertical: 3 },
  headerRow: { flexDirection: "row", borderBottom: "1.5px solid #161616", paddingVertical: 3 },
  cell: { flexGrow: 1, flexBasis: 0, paddingRight: 4 },
  cellCenter: { flexGrow: 1, flexBasis: 0, textAlign: "center" },
  bold: { fontFamily: "Helvetica-Bold" },
  ratioTrack: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 6,
  },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 32,
    right: 32,
    fontSize: 7,
    color: "#999999",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

const Footer: React.FC = () => (
  <View style={styles.footer} fixed>
    <Text>Mutafriches — Analyse de mutabilité</Text>
    <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
  </View>
);

const Badge: React.FC<{ label: string; bg: string; color: string }> = ({ label, bg, color }) => (
  <Text style={[styles.badge, { backgroundColor: bg, color }]}>{label}</Text>
);

export const MutabilitePdfDocument: React.FC<{ data: ResultatsExportData }> = ({ data }) => {
  const { mutabilite, enrichissement, complementaires, site } = data;
  const resultats = mutabilite.resultats as UsageResultatDetaille[];
  const sectionsSite = buildRecapitulatifSite(enrichissement, complementaires);

  return (
    <Document title="Mutafriches — Analyse de mutabilité">
      {/* Page 1 : récap de l'analyse */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Analyse de mutabilité</Text>
        <Text style={styles.muted}>
          {[site.commune, site.identifiant].filter(Boolean).join(" — ")}
          {site.nombreParcelles ? ` — ${site.nombreParcelles} parcelle(s)` : ""}
          {site.surfaceM2 ? ` — ${site.surfaceM2.toLocaleString("fr-FR")} m²` : ""}
        </Text>

        <Text style={styles.h2}>Fiabilité de l'analyse</Text>
        <Text>
          <Text style={styles.bold}>
            {mutabilite.fiabilite.note}/10 — {mutabilite.fiabilite.text}
          </Text>{" "}
          ({mutabilite.fiabilite.criteresRenseignes}/{mutabilite.fiabilite.criteresTotal} critères
          renseignés)
        </Text>

        <Text style={styles.h2}>Classement des usages</Text>
        <View style={styles.headerRow}>
          <Text style={[styles.cell, styles.bold, { flexGrow: 0, flexBasis: 24 }]}>#</Text>
          <Text style={[styles.cell, styles.bold, { flexGrow: 3 }]}>Usage</Text>
          <Text style={[styles.cellCenter, styles.bold]}>Indice</Text>
          <Text style={[styles.cellCenter, styles.bold, { flexGrow: 2 }]}>Potentiel</Text>
        </View>
        {resultats.map((r) => {
          const badge = getBadgeConfig(r.indiceMutabilite);
          return (
            <View key={r.usage} style={styles.row}>
              <Text style={[styles.cell, { flexGrow: 0, flexBasis: 24 }]}>{r.rang}</Text>
              <Text style={[styles.cell, { flexGrow: 3 }]}>{getUsageInfo(r.usage).label}</Text>
              <Text style={styles.cellCenter}>{r.indiceMutabilite}%</Text>
              <View style={[styles.cellCenter, { flexGrow: 2, alignItems: "center" }]}>
                <Badge label={badge.label} bg={badge.backgroundColor} color={badge.textColor} />
              </View>
            </View>
          );
        })}
        <Footer />
      </Page>

      {/* Page 2 : caractéristiques du site */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Caractéristiques du site</Text>
        {sectionsSite.map((section) => (
          <View key={section.id} wrap={false}>
            <Text style={styles.subtitle}>{section.titre}</Text>
            <View style={styles.headerRow}>
              <Text style={[styles.cell, styles.bold, { flexGrow: 2 }]}>Critère</Text>
              <Text style={[styles.cell, styles.bold]}>Valeur</Text>
            </View>
            {section.criteres.map((c) => (
              <View key={c.key} style={styles.row}>
                <Text style={[styles.cell, { flexGrow: 2 }]}>{c.label}</Text>
                <Text style={[styles.cell, styles.bold]}>{c.valeurAffichee}</Text>
              </View>
            ))}
          </View>
        ))}
        <Footer />
      </Page>

      {/* Pages 3+ : un usage par page */}
      {resultats.map((usage) => {
        const info = getUsageInfo(usage.usage);
        const badge = getBadgeConfig(usage.indiceMutabilite);
        const sections = buildDetailUsage(usage, enrichissement, complementaires);
        const avantages = usage.avantages ?? 0;
        const contraintes = usage.contraintes ?? 0;
        const total = avantages + contraintes;
        const partAvantages = total > 0 ? (avantages / total) * 100 : 0;

        return (
          <Page key={usage.usage} size="A4" style={styles.page}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Image src={info.image} style={{ width: 36, height: 36, marginRight: 10 }} />
              <View>
                <Text style={styles.h1}>{info.label}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                  <Badge label={badge.label} bg={badge.backgroundColor} color={badge.textColor} />
                  <Text style={{ marginLeft: 6 }}>
                    {Math.round(usage.indiceMutabilite)} % de compatibilité (rang {usage.rang})
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.ratioTrack}>
              <View style={{ width: `${partAvantages}%`, backgroundColor: "#B8FEC9" }} />
              <View style={{ flexGrow: 1, backgroundColor: "#FFBDBE" }} />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 3 }}>
              <Text style={styles.muted}>Avantages : {avantages.toFixed(1)}</Text>
              <Text style={styles.muted}>Contraintes : {contraintes.toFixed(1)}</Text>
            </View>

            {sections.map((section) => (
              <View key={section.id} wrap={false}>
                <Text style={styles.subtitle}>{section.titre}</Text>
                <View style={styles.headerRow}>
                  <Text style={[styles.cell, styles.bold, { flexGrow: 2 }]}>Critère</Text>
                  <Text style={[styles.cell, styles.bold]}>Valeur</Text>
                  <Text style={[styles.cellCenter, styles.bold]}>Pondération</Text>
                  <Text style={[styles.cellCenter, styles.bold, { flexGrow: 1.5 }]}>Impact</Text>
                </View>
                {section.criteres.map((c) => {
                  const col = IMPACT_COLORS[c.impact.niveau];
                  return (
                    <View key={c.key} style={styles.row}>
                      <Text style={[styles.cell, { flexGrow: 2 }]}>{c.label}</Text>
                      <Text style={[styles.cell, styles.bold]}>{c.valeurAffichee}</Text>
                      <Text style={styles.cellCenter}>{c.poids.toFixed(1)}</Text>
                      <View style={[styles.cellCenter, { flexGrow: 1.5, alignItems: "center" }]}>
                        <Badge label={c.impact.label} bg={col.bg} color={col.text} />
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
            <Footer />
          </Page>
        );
      })}
    </Document>
  );
};
