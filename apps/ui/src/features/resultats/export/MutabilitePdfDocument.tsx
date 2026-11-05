import React from "react";
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  buildDetailUsage,
  buildRecapitulatifSite,
  MENTION_INFORMATIVE,
  type UsageResultatDetaille,
} from "@mutafriches/shared-types";
import {
  formatRang,
  getResultBadgeConfig,
  getUsageInfo,
  getUsagesPodium,
  MESSAGE_USAGE_EXCLU,
} from "../utils/usagesLabels.utils";
import { IMPACT_TAG_VARIANT, TAG_COLORS } from "@shared/components/tag";
import {
  enregistrerPolicesPdf,
  moisAnneeCourants,
  PDF_COULEURS,
  PDF_GRAISSE,
  PDF_MARGES,
  PDF_POLICE,
  PdfBadge,
  PdfBandeSection,
  PdfEnTete,
  PdfEnTeteTableau,
  PdfLigneTableau,
  PdfPiedDePage,
  PdfTag,
  type PdfColonne,
} from "@shared/pdf";
import { getPodiumTags } from "../utils/podiumTags";
import type { ResultatsExportData } from "./types";

enregistrerPolicesPdf();

const SOUS_TITRE = "Le meilleur usage pour votre site en friche";

const COLONNES_USAGES: PdfColonne[] = [
  { libelle: "Rang", poids: 0.9 },
  { libelle: "Usage", poids: 4.2 },
  { libelle: "Indice de mutabilité", poids: 5 },
  { libelle: "Potentiel", poids: 1.9 },
];

// Colonne Critère assez large pour éviter les retours à la ligne : un usage tient sur une page
const COLONNES_RECAP: PdfColonne[] = [
  { libelle: "Critère", poids: 5.6 },
  { libelle: "Valeur", poids: 3.2 },
  { libelle: "Saisie", poids: 1.7, centree: true },
  { libelle: "Source", poids: 2.5, centree: true },
];

const COLONNES_DETAIL: PdfColonne[] = [
  { libelle: "Critère", poids: 6 },
  { libelle: "Valeur", poids: 3.4 },
  { libelle: "Pondération", poids: 1.5, centree: true },
  { libelle: "Impact", poids: 1.7, centree: true },
];

const s = StyleSheet.create({
  page: {
    paddingTop: PDF_MARGES.haut,
    paddingBottom: PDF_MARGES.bas,
    paddingHorizontal: PDF_MARGES.cotes,
    fontFamily: PDF_POLICE,
    fontSize: 9,
    // react-pdf calcule l'interligne sur le corps du même style (18 sinon) puis l'hérite en
    // valeur absolue : chaque style qui change de corps redéfinit corps et interligne ensemble
    lineHeight: 1.2,
    color: PDF_COULEURS.texte,
  },
  h1: { fontSize: 20, lineHeight: 1.2, fontWeight: PDF_GRAISSE.grasse, marginBottom: 12 },
  h2: {
    fontSize: 13,
    lineHeight: 1.2,
    fontWeight: PDF_GRAISSE.grasse,
    marginTop: 20,
    marginBottom: 10,
  },
  gras: { fontWeight: PDF_GRAISSE.grasse },
  mention: { fontSize: 7, lineHeight: 1.2, color: PDF_COULEURS.mention, marginTop: 1 },
  // Encadré du site (maquette : bordure bleu France, angles droits)
  encadre: {
    backgroundColor: PDF_COULEURS.fondEncadre,
    borderLeft: `4px solid ${PDF_COULEURS.bleuFrance}`,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  encadreTitre: { fontSize: 18, lineHeight: 1.2, fontWeight: PDF_GRAISSE.grasse, marginBottom: 6 },
  encadreTexte: { fontSize: 9, lineHeight: 1.6, color: PDF_COULEURS.texteCourant },
  // Podium : react-pdf n'a pas de box-shadow, l'ombre est simulée par une bordure basse
  podium: { flexDirection: "row", gap: 14 },
  carte: {
    flexGrow: 1,
    flexBasis: 0,
    border: `1px solid ${PDF_COULEURS.bordureCarte}`,
    borderBottom: `2.5px solid ${PDF_COULEURS.ombreCarte}`,
    paddingTop: 8,
    paddingHorizontal: 8,
    paddingBottom: 10,
    alignItems: "center",
  },
  carteLibelle: {
    fontSize: 10,
    lineHeight: 1.2,
    fontWeight: PDF_GRAISSE.moyenne,
    textAlign: "center",
    marginTop: 8,
    minHeight: 24,
  },
  carteTags: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginTop: 6 },
  // Barre d'indice : largeur proportionnelle à l'indice, sans piste, comme sur le site
  indice: { flexDirection: "row", alignItems: "center" },
  indicePiste: { flexGrow: 1 },
  indiceBarre: { height: 5, borderRadius: 2.5 },
  indiceValeur: { width: 34, textAlign: "right", fontWeight: PDF_GRAISSE.grasse },
  // Pages usage
  usageTitre: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  usageLibelle: { fontSize: 15, lineHeight: 1.2, fontWeight: PDF_GRAISSE.grasse, marginLeft: 6 },
  ratio: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 6,
  },
  ratioLegende: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 6,
    fontSize: 8.5,
    lineHeight: 1.2,
  },
});

const IndiceBarre: React.FC<{ indice: number; couleur: string }> = ({ indice, couleur }) => (
  <View style={s.indice}>
    <View style={s.indicePiste}>
      <View
        style={[s.indiceBarre, { width: `${Math.max(indice, 2)}%`, backgroundColor: couleur }]}
      />
    </View>
    <Text style={s.indiceValeur}>{Math.round(indice)}%</Text>
  </View>
);

export const MutabilitePdfDocument: React.FC<{ data: ResultatsExportData }> = ({ data }) => {
  const { mutabilite, enrichissement, complementaires, site } = data;
  const resultats = mutabilite.resultats as UsageResultatDetaille[];
  const podium = getUsagesPodium(resultats);
  const sectionsSite = buildRecapitulatifSite(enrichissement, complementaires);
  const titreSite = site.nom ? `${site.nom}, ${site.commune ?? ""}` : (site.commune ?? "Site");
  const nombreParcelles = site.parcelles?.length ?? site.nombreParcelles ?? 0;
  const piedDePage = [
    "Mutafriches Ademe",
    `Analyse de mutabilité Site ${site.nom ?? site.commune ?? ""}`,
    moisAnneeCourants(),
  ];

  return (
    <Document title="Mutafriches — Analyse de mutabilité">
      {/* Page 1 : synthèse de l'analyse */}
      <Page size="A4" style={s.page}>
        <PdfEnTete sousTitre={SOUS_TITRE} />
        <Text style={s.h1}>Analyse de mutabilité</Text>

        <View style={s.encadre}>
          <Text style={s.encadreTitre}>{titreSite}</Text>
          <Text style={s.encadreTexte}>
            {nombreParcelles > 1
              ? `${nombreParcelles} parcelles : ${(site.parcelles ?? []).join(", ")}`
              : `Identifiant : ${site.identifiant ?? ""}`}
          </Text>
        </View>

        <Text style={s.h2}>Usages les plus compatibles</Text>
        <View style={s.podium}>
          {podium.map((r) => {
            const info = getUsageInfo(r.usage);
            const badge = getResultBadgeConfig(r);
            return (
              <View key={r.usage} style={s.carte}>
                <View style={{ alignSelf: "flex-start" }}>
                  <PdfBadge libelle={badge.label} couleurs={badge} grand />
                </View>
                <Image src={info.image} style={{ width: 64, height: 64, marginTop: 10 }} />
                <Text style={s.carteLibelle}>{info.label}</Text>
                <View style={s.carteTags}>
                  {getPodiumTags(r, enrichissement, complementaires).map((tag) => (
                    <PdfTag key={tag} libelle={tag} />
                  ))}
                </View>
              </View>
            );
          })}
        </View>

        <Text style={s.h2}>Tous les usages</Text>
        <PdfEnTeteTableau colonnes={COLONNES_USAGES} />
        {resultats.map((r) => {
          const badge = getResultBadgeConfig(r);
          return (
            <PdfLigneTableau key={r.usage} colonnes={COLONNES_USAGES} aeree>
              {/* Rang, usage et indice en gras, comme le tableau du site (ResultTable) */}
              <Text style={s.gras}>{formatRang(r.rang)}</Text>
              <Text style={s.gras}>{getUsageInfo(r.usage).label}</Text>
              {r.exclu ? (
                <Text style={{ fontSize: 8, lineHeight: 1.2, color: PDF_COULEURS.texteCourant }}>
                  {MESSAGE_USAGE_EXCLU}
                </Text>
              ) : (
                <IndiceBarre indice={r.indiceMutabilite} couleur={badge.backgroundColor} />
              )}
              <View style={{ alignItems: "flex-start" }}>
                <PdfBadge libelle={badge.label} couleurs={badge} grand />
              </View>
            </PdfLigneTableau>
          );
        })}
        <PdfPiedDePage segments={piedDePage} />
      </Page>

      {/* Page 2 : récapitulatif du site, colonnes du site (RecapTable) */}
      <Page size="A4" style={s.page}>
        <PdfEnTete sousTitre={SOUS_TITRE} />
        <Text style={s.h1}>Récapitulatif du site</Text>
        <PdfEnTeteTableau colonnes={COLONNES_RECAP} />
        {sectionsSite.map((section) => (
          <React.Fragment key={section.id}>
            <PdfBandeSection titre={section.titre} />
            {section.criteres.map((c) => {
              const couleursSaisie = TAG_COLORS[c.saisie === "MANUELLE" ? "jaune" : "bleu"];
              return (
                <PdfLigneTableau key={c.key} colonnes={COLONNES_RECAP}>
                  <View>
                    <Text>{c.label}</Text>
                    {c.informatif && <Text style={s.mention}>{MENTION_INFORMATIVE}</Text>}
                    {c.mention && <Text style={s.mention}>{c.mention}</Text>}
                  </View>
                  <Text style={s.gras}>{c.valeurAffichee}</Text>
                  <PdfBadge
                    libelle={c.saisie === "MANUELLE" ? "Manuelle" : "Automatique"}
                    couleurs={couleursSaisie}
                  />
                  {/* Cellule vide plutôt que null : chaque enfant occupe sa colonne */}
                  {c.sourceLabel ? (
                    <PdfBadge libelle={c.sourceLabel} couleurs={TAG_COLORS.bleu} />
                  ) : (
                    <View />
                  )}
                </PdfLigneTableau>
              );
            })}
          </React.Fragment>
        ))}
        <PdfPiedDePage segments={piedDePage} />
      </Page>

      {/* Pages usage : un usage par page, colonnes du site (UsageDetailTable) */}
      {resultats.map((usage) => {
        const info = getUsageInfo(usage.usage);
        const badge = getResultBadgeConfig(usage);
        const sections = buildDetailUsage(usage, enrichissement, complementaires);
        const avantages = usage.avantages ?? 0;
        const contraintes = usage.contraintes ?? 0;
        const total = avantages + contraintes;
        const partAvantages = total > 0 ? (avantages / total) * 100 : 0;

        return (
          <Page key={usage.usage} size="A4" style={s.page}>
            <PdfEnTete sousTitre={SOUS_TITRE} />
            <Text style={[s.h1, { marginBottom: 10 }]}>Usage n°{usage.rang}</Text>
            <View style={s.usageTitre}>
              <Image src={info.image} style={{ width: 24, height: 24 }} />
              <Text style={s.usageLibelle}>{info.label}</Text>
              <View style={{ marginLeft: 10 }}>
                <PdfBadge libelle={badge.label} couleurs={badge} grand />
              </View>
            </View>

            {usage.exclu ? (
              <Text style={{ marginBottom: 10 }}>
                <Text style={s.gras}>{MESSAGE_USAGE_EXCLU}.</Text> Les critères incompatibles sont
                signalés dans le tableau.
              </Text>
            ) : (
              <>
                <Text>
                  <Text style={s.gras}>
                    {Math.round(usage.indiceMutabilite)} % de compatibilité
                  </Text>
                  {"    "}Indice = avantages / (avantages + contraintes)
                </Text>
                <View style={s.ratio}>
                  <View
                    style={{
                      width: `${partAvantages}%`,
                      backgroundColor: TAG_COLORS["vert-fort"].backgroundColor,
                    }}
                  />
                  <View
                    style={{ flexGrow: 1, backgroundColor: TAG_COLORS.saumon.backgroundColor }}
                  />
                </View>
                <View style={s.ratioLegende}>
                  <Text>Avantages : {avantages.toFixed(1)}</Text>
                  <Text>Contraintes : {contraintes.toFixed(1)}</Text>
                </View>
              </>
            )}

            <PdfEnTeteTableau colonnes={COLONNES_DETAIL} />
            {sections.map((section) => (
              <React.Fragment key={section.id}>
                <PdfBandeSection titre={section.titre} />
                {section.criteres.map((c) => (
                  <PdfLigneTableau key={c.key} colonnes={COLONNES_DETAIL}>
                    <Text>{c.label}</Text>
                    <Text style={s.gras}>{c.valeurAffichee}</Text>
                    {/* Le poids est une magnitude : pas de signe, comme sur le site */}
                    <Text style={s.gras}>{c.poids.toFixed(1)}</Text>
                    <PdfBadge
                      libelle={c.impact.label}
                      couleurs={TAG_COLORS[IMPACT_TAG_VARIANT[c.impact.niveau]]}
                    />
                  </PdfLigneTableau>
                ))}
              </React.Fragment>
            ))}
            <PdfPiedDePage segments={piedDePage} />
          </Page>
        );
      })}
    </Document>
  );
};
