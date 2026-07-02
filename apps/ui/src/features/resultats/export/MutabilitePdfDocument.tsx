import React from "react";
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  buildDetailUsage,
  buildRecapitulatifSite,
  type ImpactNiveau,
  type UsageResultatDetaille,
} from "@mutafriches/shared-types";
import { getBadgeConfig, getUsageInfo } from "../utils/usagesLabels.utils";
import { getPodiumTags } from "../utils/podiumTags";
import type { ResultatsExportData } from "./types";

const BLEU = "#000091";
const GRIS = "#666666";
const BORDURE = "#e5e5e5";

const IMPACT_COLORS: Record<ImpactNiveau, { bg: string; text: string }> = {
  "tres-positif": { bg: "#B8FEC9", text: "#18753C" },
  positif: { bg: "#C9FCAC", text: "#208D49" },
  neutre: { bg: "#FEECC2", text: "#716043" },
  negatif: { bg: "#FFBDBE", text: "#8D533E" },
  "tres-negatif": { bg: "#FFBDBE", text: "#8D533E" },
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
  // En-tête fixe
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
  // Footer fixe
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
  // Titres
  h1: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 10 },
  h2: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 16, marginBottom: 8 },
  subtitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginTop: 10,
    marginBottom: 4,
    color: BLEU,
  },
  muted: { color: GRIS },
  bold: { fontFamily: "Helvetica-Bold" },
  // Callout site
  callout: {
    backgroundColor: "#F0F4FE",
    borderLeft: "4px solid #6A6AF4",
    borderRadius: 3,
    padding: 12,
    marginBottom: 8,
  },
  calloutTitle: { fontSize: 15, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  // Badges
  badge: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 3,
  },
  tag: {
    fontSize: 7,
    color: BLEU,
    backgroundColor: "#E3E3FD",
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 3,
    margin: 2,
  },
  // Tableaux
  row: {
    flexDirection: "row",
    borderBottom: `1px solid ${BORDURE}`,
    paddingVertical: 4,
    alignItems: "center",
  },
  headerRow: { flexDirection: "row", borderBottom: "1.5px solid #161616", paddingVertical: 4 },
  cell: { flexGrow: 1, flexBasis: 0, paddingRight: 4 },
  cellCenter: { flexGrow: 1, flexBasis: 0, textAlign: "center", alignItems: "center" },
  // Podium
  podiumRow: { flexDirection: "row", gap: 8 },
  podiumCard: {
    flexGrow: 1,
    flexBasis: 0,
    border: `1px solid ${BORDURE}`,
    borderRadius: 6,
    padding: 8,
    alignItems: "center",
  },
  podiumLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", textAlign: "center", marginTop: 4 },
  podiumTags: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginTop: 6 },
  // Barre indice / ratio
  bar: { height: 6, borderRadius: 3, backgroundColor: "#eee" },
  ratioTrack: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 6,
  },
});

const moisAnnee = (): string =>
  new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

const Badge: React.FC<{ label: string; bg: string; color: string }> = ({ label, bg, color }) => (
  <Text style={[s.badge, { backgroundColor: bg, color }]}>{label}</Text>
);

const Header: React.FC = () => (
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
      <Text style={s.brandSub}>Le meilleur usage pour votre site en friche</Text>
    </View>
  </View>
);

const Footer: React.FC<{ site: string }> = ({ site }) => (
  <View style={s.footer} fixed>
    <Text style={s.footerText}>
      Mutafriches Ademe - Analyse de mutabilité Site {site} - {moisAnnee()}
    </Text>
    <Text
      style={s.footerPage}
      render={({ pageNumber, totalPages }) => `${pageNumber}/${totalPages}`}
    />
  </View>
);

// Barre d'indice colorée selon le potentiel.
const IndiceBar: React.FC<{ indice: number; couleur: string }> = ({ indice, couleur }) => (
  <View style={[s.bar, { width: 90 }]}>
    <View
      style={{
        height: 6,
        borderRadius: 3,
        width: `${Math.max(indice, 5)}%`,
        backgroundColor: couleur,
      }}
    />
  </View>
);

export const MutabilitePdfDocument: React.FC<{ data: ResultatsExportData }> = ({ data }) => {
  const { mutabilite, enrichissement, complementaires, site } = data;
  const resultats = mutabilite.resultats as UsageResultatDetaille[];
  const top3 = resultats.slice(0, 3);
  const sectionsSite = buildRecapitulatifSite(enrichissement, complementaires);
  const titreSite = site.nom ? `${site.nom}, ${site.commune ?? ""}` : (site.commune ?? "Site");
  const nomFooter = site.nom ?? site.commune ?? "";

  return (
    <Document title="Mutafriches — Analyse de mutabilité">
      {/* Page 1 : récap de l'analyse */}
      <Page size="A4" style={s.page}>
        <Header />
        <Text style={s.h1}>Analyse de mutabilité</Text>

        <View style={s.callout}>
          <Text style={s.calloutTitle}>{titreSite}</Text>
          <Text style={s.muted}>
            {(site.parcelles?.length ?? site.nombreParcelles ?? 0) > 1
              ? `${site.parcelles?.length ?? site.nombreParcelles} parcelles : ${(site.parcelles ?? []).join(", ")}`
              : `Identifiant : ${site.identifiant ?? ""}`}
          </Text>
        </View>

        <Text style={s.h2}>Usages les plus compatibles</Text>
        <View style={s.podiumRow}>
          {top3.map((r) => {
            const info = getUsageInfo(r.usage);
            const badge = getBadgeConfig(r.indiceMutabilite);
            const tags = getPodiumTags(r, enrichissement, complementaires);
            return (
              <View key={r.usage} style={s.podiumCard}>
                <View style={{ alignSelf: "flex-start" }}>
                  <Badge label={badge.label} bg={badge.backgroundColor} color={badge.textColor} />
                </View>
                <Image src={info.image} style={{ width: 40, height: 40, marginTop: 6 }} />
                <Text style={s.podiumLabel}>{info.label}</Text>
                <View style={s.podiumTags}>
                  {tags.map((t, i) => (
                    <Text key={i} style={s.tag}>
                      {t}
                    </Text>
                  ))}
                </View>
              </View>
            );
          })}
        </View>

        <Text style={s.h2}>Tous les usages</Text>
        <View style={s.headerRow}>
          <Text style={[s.cell, s.bold, { flexGrow: 0, flexBasis: 30 }]}>Rang</Text>
          <Text style={[s.cell, s.bold, { flexGrow: 3 }]}>Usage</Text>
          <Text style={[s.cell, s.bold, { flexGrow: 2 }]}>Indice de mutabilité</Text>
          <Text style={[s.cellCenter, s.bold, { flexGrow: 1.5 }]}>Potentiel</Text>
        </View>
        {resultats.map((r) => {
          const badge = getBadgeConfig(r.indiceMutabilite);
          return (
            <View key={r.usage} style={s.row}>
              <Text style={[s.cell, { flexGrow: 0, flexBasis: 30 }]}>{r.rang}</Text>
              <Text style={[s.cell, { flexGrow: 3 }]}>{getUsageInfo(r.usage).label}</Text>
              <View style={[s.cell, { flexGrow: 2, flexDirection: "row", alignItems: "center" }]}>
                <IndiceBar indice={r.indiceMutabilite} couleur={badge.backgroundColor} />
                <Text style={{ marginLeft: 6 }}>{r.indiceMutabilite}%</Text>
              </View>
              <View style={[s.cellCenter, { flexGrow: 1.5 }]}>
                <Badge label={badge.label} bg={badge.backgroundColor} color={badge.textColor} />
              </View>
            </View>
          );
        })}
        <Footer site={nomFooter} />
      </Page>

      {/* Page 2 : récapitulatif du site */}
      <Page size="A4" style={s.page}>
        <Header />
        <Text style={s.h1}>Récapitulatif du site</Text>
        <View style={s.headerRow}>
          <Text style={[s.cell, s.bold, { flexGrow: 2 }]}>Critère</Text>
          <Text style={[s.cell, s.bold]}>Valeur</Text>
          <Text style={[s.cellCenter, s.bold]}>Saisie</Text>
          <Text style={[s.cellCenter, s.bold]}>Source</Text>
        </View>
        {sectionsSite.map((section) => (
          <View key={section.id} wrap={false}>
            <Text style={s.subtitle}>{section.titre}</Text>
            {section.criteres.map((c) => {
              const auto = c.saisie === "AUTOMATIQUE";
              return (
                <View key={c.key} style={s.row}>
                  <Text style={[s.cell, { flexGrow: 2 }]}>{c.label}</Text>
                  <Text style={[s.cell, s.bold]}>{c.valeurAffichee}</Text>
                  <View style={s.cellCenter}>
                    <Badge
                      label={auto ? "AUTOMATIQUE" : "MANUELLE"}
                      bg={auto ? "#B8FEC9" : "#FEECC2"}
                      color={auto ? "#18753C" : "#716043"}
                    />
                  </View>
                  <View style={s.cellCenter}>
                    {c.sourceLabel ? (
                      <Badge label={c.sourceLabel.toUpperCase()} bg="#B8FEC9" color="#18753C" />
                    ) : (
                      <Text style={s.muted}>—</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ))}
        <Footer site={nomFooter} />
      </Page>

      {/* Pages usages : un usage par page */}
      {resultats.map((usage) => {
        const info = getUsageInfo(usage.usage);
        const badge = getBadgeConfig(usage.indiceMutabilite);
        const sections = buildDetailUsage(usage, enrichissement, complementaires);
        const avantages = usage.avantages ?? 0;
        const contraintes = usage.contraintes ?? 0;
        const total = avantages + contraintes;
        const partAvantages = total > 0 ? (avantages / total) * 100 : 0;

        return (
          <Page key={usage.usage} size="A4" style={s.page}>
            <Header />
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Image src={info.image} style={{ width: 38, height: 38, marginRight: 10 }} />
              <View>
                <Text style={s.h1}>{info.label}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                  <Badge label={badge.label} bg={badge.backgroundColor} color={badge.textColor} />
                  <Text style={{ marginLeft: 6 }}>
                    {Math.round(usage.indiceMutabilite)} % de compatibilité (rang {usage.rang})
                  </Text>
                </View>
              </View>
            </View>

            <View style={s.ratioTrack}>
              <View style={{ width: `${partAvantages}%`, backgroundColor: "#B8FEC9" }} />
              <View style={{ flexGrow: 1, backgroundColor: "#FFBDBE" }} />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 3 }}>
              <Text style={s.muted}>Avantages : {avantages.toFixed(1)}</Text>
              <Text style={s.muted}>Contraintes : {contraintes.toFixed(1)}</Text>
            </View>

            <View style={[s.headerRow, { marginTop: 10 }]}>
              <Text style={[s.cell, s.bold, { flexGrow: 2 }]}>Critère</Text>
              <Text style={[s.cell, s.bold]}>Valeur</Text>
              <Text style={[s.cellCenter, s.bold]}>Pondération</Text>
              <Text style={[s.cellCenter, s.bold, { flexGrow: 1.5 }]}>Impact</Text>
            </View>
            {sections.map((section) => (
              <View key={section.id} wrap={false}>
                <Text style={s.subtitle}>{section.titre}</Text>
                {section.criteres.map((c) => {
                  const col = IMPACT_COLORS[c.impact.niveau];
                  return (
                    <View key={c.key} style={s.row}>
                      <Text style={[s.cell, { flexGrow: 2 }]}>{c.label}</Text>
                      <Text style={[s.cell, s.bold]}>{c.valeurAffichee}</Text>
                      <Text style={s.cellCenter}>{c.poids.toFixed(1)}</Text>
                      <View style={[s.cellCenter, { flexGrow: 1.5 }]}>
                        <Badge label={c.impact.label} bg={col.bg} color={col.text} />
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
            <Footer site={nomFooter} />
          </Page>
        );
      })}
    </Document>
  );
};
