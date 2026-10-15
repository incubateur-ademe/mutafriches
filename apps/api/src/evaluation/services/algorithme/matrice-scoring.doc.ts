import { resolve } from "node:path";
import {
  CAVITES_LABELS,
  DISTANCE_ITE_LABELS,
  ETAT_BATI_LABELS,
  INONDATION_LABELS,
  PRESENCE_ESPECES_LABELS,
  PRESENCE_POLLUTION_LABELS,
  PRESENCE_ZONE_HUMIDE_LABELS,
  QUALITE_PAYSAGE_LABELS,
  QUALITE_VOIE_LABELS,
  RACCORDEMENT_EAU_LABELS,
  RGA_LABELS,
  TRAME_VERTE_BLEUE_LABELS,
  TYPE_PROPRIETAIRE_LABELS,
  VALEUR_ARCHITECTURALE_LABELS,
  ZONAGE_ABC_LOGEMENT_LABELS,
  ZONAGE_ENVIRONNEMENTAL_LABELS,
  ZONAGE_PATRIMONIAL_LABELS,
  ZONAGE_REGLEMENTAIRE_LABELS,
  ZONE_ACCELERATION_ENR_LABELS,
  UsageType,
} from "@mutafriches/shared-types";
import { MATRICE_SCORING, POIDS_CRITERES, REGLES_EXCLUSION } from "./algorithme.config";
import { ScoreParUsage } from "./algorithme.types";
import { ALGORITHME_VERSIONS, VERSION_COURANTE } from "./versions";

// Génère docs/matrice-scoring.md depuis le code : `pnpm docs:matrice:gen`, garde-fou dans le spec associé.

type Libelles = Record<string, string>;
type Scores = Record<string, number>;
type FonctionScore = (valeur: number | undefined) => ScoreParUsage;

interface Ligne {
  reponse: string;
  scores: Scores;
}

interface DefinitionCritere {
  cle: string;
  nom: string;
  libelles?: Libelles;
  // Critères numériques : libellé de la tranche et valeur échantillon dans cette tranche
  tranches?: [string, number | undefined][];
}

const USAGES: { cle: string; nom: string }[] = [
  { cle: UsageType.RESIDENTIEL, nom: "Résidentiel" },
  { cle: UsageType.EQUIPEMENTS, nom: "Équipements" },
  { cle: UsageType.CULTURE, nom: "Culture" },
  { cle: UsageType.TERTIAIRE, nom: "Locaux d'activité" },
  { cle: UsageType.INDUSTRIE, nom: "Industrie" },
  { cle: UsageType.RENATURATION, nom: "Renaturation" },
  { cle: UsageType.PHOTOVOLTAIQUE, nom: "Photovoltaïque" },
];

const SYMBOLES: Record<string, string> = { "2": "++", "1": "+", "0.5": "0", "-1": "−", "-2": "−−" };

// Modifications de scores détaillées à partir de cette version (les anciennes sont bruitées par les changements de seuils et d'enums)
const VERSION_RECENTE_MIN = 12;
const NB_CRITERES_ENRICHIS = 22;

// Ordre = ordre d'affichage : critères enrichis, puis saisis
const CRITERES: DefinitionCritere[] = [
  {
    cle: "surfaceSite",
    nom: "Surface du site (m²)",
    tranches: [
      ["< 10 000", 5000],
      ["10 000 ≤ s < 15 000", 12000],
      ["15 000 ≤ s ≤ 50 000", 30000],
      ["> 50 000", 60000],
    ],
  },
  {
    cle: "surfaceBati",
    nom: "Emprise au sol du bâti (m²)",
    tranches: [
      ["< 5 000 ou pas de bâti", 1000],
      ["5 000 ≤ s ≤ 10 000", 7000],
      ["> 10 000", 20000],
    ],
  },
  { cle: "siteEnCentreVille", nom: "En centre-ville ou centre-bourg" },
  {
    cle: "distanceAutoroute",
    nom: "Distance par la route à l'accès autoroutier",
    tranches: [
      ["< 1 km", 0.5],
      ["1 ≤ d < 2 km", 1.5],
      ["2 ≤ d < 5 km", 3],
      ["≥ 5 km (ou aucun à moins de 50 km)", 10],
    ],
  },
  {
    cle: "distanceTransportCommun",
    nom: "Distance aux transports en commun",
    tranches: [
      ["< 500 m", 100],
      ["≥ 500 m", 1000],
    ],
  },
  { cle: "proximiteCommercesServices", nom: "Commerces et services à proximité" },
  {
    cle: "distanceRaccordementElectrique",
    nom: "Distance au raccordement électrique",
    tranches: [
      ["< 1 km", 0.5],
      ["1 ≤ d < 5 km", 3],
      ["≥ 5 km (ou aucune infrastructure trouvée)", 10],
    ],
  },
  {
    cle: "distanceReseauChaleur",
    nom: "Distance au réseau de chaleur",
    tranches: [
      ["< 500 m", 100],
      ["≥ 500 m (ou aucun réseau)", 1000],
    ],
  },
  {
    cle: "tauxLogementsVacants",
    nom: "Taux de logements vacants (%)",
    tranches: [
      ["≤ 7 %", 5],
      ["7 < t ≤ 8 %", 7.5],
      ["8 < t ≤ 10 %", 9],
      ["> 10 %", 12],
    ],
  },
  {
    cle: "risqueRetraitGonflementArgile",
    nom: "Risque retrait-gonflement des argiles",
    libelles: RGA_LABELS,
  },
  {
    cle: "risqueCavitesSouterraines",
    nom: "Risque cavités souterraines",
    libelles: CAVITES_LABELS,
  },
  { cle: "risqueInondation", nom: "Risque inondation", libelles: INONDATION_LABELS },
  { cle: "presenceRisquesTechnologiques", nom: "Risques technologiques" },
  {
    cle: "zonageReglementaire",
    nom: "Zonage réglementaire (PLU)",
    libelles: ZONAGE_REGLEMENTAIRE_LABELS,
  },
  {
    cle: "zonageEnvironnemental",
    nom: "Zonage environnemental",
    libelles: ZONAGE_ENVIRONNEMENTAL_LABELS,
  },
  { cle: "zonagePatrimonial", nom: "Zonage patrimonial", libelles: ZONAGE_PATRIMONIAL_LABELS },
  {
    cle: "zoneAccelerationEnr",
    nom: "Zone d'accélération des EnR (ZAER)",
    libelles: ZONE_ACCELERATION_ENR_LABELS,
  },
  {
    cle: "zonageAbcLogement",
    nom: "Zonage ABC (tension du logement)",
    libelles: ZONAGE_ABC_LOGEMENT_LABELS,
  },
  { cle: "distanceIte", nom: "Distance à une ITE fret", libelles: DISTANCE_ITE_LABELS },
  { cle: "siteEnQpv", nom: "Quartier prioritaire de la ville (QPV)" },
  { cle: "saturationReseauEnr", nom: "Saturation du réseau électrique pour les EnR" },
  { cle: "siteEnZae", nom: "Zone d'activité économique (ZAE)" },
  { cle: "typeProprietaire", nom: "Type de propriétaire", libelles: TYPE_PROPRIETAIRE_LABELS },
  {
    cle: "raccordementEau",
    nom: "Raccordement à l'eau (dérivé de la surface bâtie)",
    libelles: RACCORDEMENT_EAU_LABELS,
  },
  {
    cle: "etatBatiInfrastructure",
    nom: "État du bâti et des infrastructures",
    libelles: ETAT_BATI_LABELS,
  },
  { cle: "presencePollution", nom: "Présence de pollution", libelles: PRESENCE_POLLUTION_LABELS },
  {
    cle: "valeurArchitecturaleHistorique",
    nom: "Valeur architecturale et historique",
    libelles: VALEUR_ARCHITECTURALE_LABELS,
  },
  { cle: "qualitePaysage", nom: "Qualité du paysage", libelles: QUALITE_PAYSAGE_LABELS },
  {
    cle: "qualiteVoieDesserte",
    nom: "Qualité de la voie de desserte",
    libelles: QUALITE_VOIE_LABELS,
  },
  { cle: "trameVerteEtBleue", nom: "Trame verte et bleue", libelles: TRAME_VERTE_BLEUE_LABELS },
  {
    cle: "presenceEspecesProtegees",
    nom: "Présence d'espèces protégées",
    libelles: PRESENCE_ESPECES_LABELS,
  },
  {
    cle: "presenceZoneHumide",
    nom: "Présence de zone humide",
    libelles: PRESENCE_ZONE_HUMIDE_LABELS,
  },
];

const LIBELLES_REGLES: Record<string, string> = {
  "zone-exclusion-enr": "Zone d'exclusion des EnR (loi APER)",
  "zone-humide-et-especes-protegees": "Zone humide et espèces protégées",
};

export function cheminDocMatrice(): string {
  return resolve(__dirname, "../../../../../../docs/matrice-scoring.md");
}

function numeroVersion(version: string): number {
  return Number(version.replace("v1.", ""));
}

function lignesCritere(matrice: Record<string, unknown>, critere: DefinitionCritere): Ligne[] {
  const entree = matrice[critere.cle];
  if (entree === undefined) return [];

  if (critere.tranches) {
    const fonction = entree as FonctionScore;
    return critere.tranches.map(([reponse, valeur]) => ({
      reponse,
      scores: fonction(valeur) as unknown as Scores,
    }));
  }

  const entrees = Object.entries(entree as Record<string, Scores>).filter(
    ([valeur]) => valeur !== "ne-sait-pas",
  );
  const dictionnaire = critere.libelles;
  if (dictionnaire) {
    // Ordre des libellés (celui de la saisie dans l'UI) plutôt que celui de la matrice
    const ordre = Object.keys(dictionnaire);
    entrees.sort(([a], [b]) => ordre.indexOf(a) - ordre.indexOf(b));
  }
  return entrees.map(([valeur, scores]) => ({
    reponse: dictionnaire
      ? (dictionnaire[valeur] ?? valeur)
      : valeur === "true"
        ? "Oui"
        : valeur === "false"
          ? "Non"
          : valeur,
    scores,
  }));
}

// Version d'ajout et versions récentes où les scores du critère ont changé
function evolutionCritere(critere: DefinitionCritere): string {
  let signaturePrecedente: string | undefined;
  let ajout = "";
  const modifications: string[] = [];

  for (const config of ALGORITHME_VERSIONS) {
    if (!(critere.cle in config.poidsCriteres)) continue;
    const signature = JSON.stringify(lignesCritere(config.matriceScoring, critere));
    if (signaturePrecedente === undefined) ajout = config.version;
    else if (
      signature !== signaturePrecedente &&
      numeroVersion(config.version) >= VERSION_RECENTE_MIN
    )
      modifications.push(config.version);
    signaturePrecedente = signature;
  }

  const gras = (version: string): string =>
    numeroVersion(version) >= VERSION_RECENTE_MIN ? `**${version}**` : version;
  const parties = [ajout === "v1.1" ? "v1.1" : `ajout ${gras(ajout)}`];
  if (modifications.length) parties.push(`modif. ${modifications.map(gras).join(", ")}`);
  return parties.join(" ; ");
}

function tableau(criteres: DefinitionCritere[]): string {
  const poids = POIDS_CRITERES as Record<string, number>;
  const sortie: string[] = [
    `| Critère | Poids | Évolution | Réponse | ${USAGES.map((u) => u.nom).join(" | ")} |`,
    `|---|:-:|---|---|${USAGES.map(() => ":-:").join("|")}|`,
  ];
  for (const critere of criteres) {
    const lignes = lignesCritere(MATRICE_SCORING as Record<string, unknown>, critere);
    lignes.forEach((ligne, index) => {
      const cellules = USAGES.map((u) => SYMBOLES[String(ligne.scores[u.cle])] ?? "?");
      const premiere = index === 0;
      sortie.push(
        `| ${premiere ? `**${critere.nom}**` : ""} | ${premiere ? poids[critere.cle] : ""} | ${premiere ? evolutionCritere(critere) : ""} | ${ligne.reponse} | ${cellules.join(" | ")} |`,
      );
    });
  }
  return sortie.join("\n");
}

function tableauRegles(): string {
  const nomUsage = (cle: string): string => USAGES.find((u) => u.cle === cle)?.nom ?? cle;
  return REGLES_EXCLUSION.map((regle) => {
    const conditions = regle.conditions
      .map((condition) => {
        const critere = CRITERES.find((c) => c.cle === condition.critere);
        const valeur = String(condition.valeur);
        return `${critere?.nom ?? condition.critere} = **${critere?.libelles?.[valeur] ?? valeur}**`;
      })
      .join(" **et** ");
    return `| ${LIBELLES_REGLES[regle.id] ?? regle.id} | ${conditions} | ${regle.usages.map(nomUsage).join(", ")} |`;
  }).join("\n");
}

function verifierCouverture(): void {
  const cles = CRITERES.map((c) => c.cle);
  const manquants = Object.keys(POIDS_CRITERES).filter((cle) => !cles.includes(cle));
  const inconnus = cles.filter((cle) => !(cle in POIDS_CRITERES));
  if (manquants.length || inconnus.length) {
    throw new Error(
      `matrice-scoring.doc.ts désynchronisé de POIDS_CRITERES (à ajouter : ${manquants.join(", ") || "aucun"} ; à retirer : ${inconnus.join(", ") || "aucun"})`,
    );
  }
  for (const regle of REGLES_EXCLUSION) {
    if (!LIBELLES_REGLES[regle.id])
      throw new Error(`Libellé manquant pour la règle d'exclusion « ${regle.id} »`);
  }
}

export function genererMatriceScoringMarkdown(): string {
  verifierCouverture();

  const poids = POIDS_CRITERES as Record<string, number>;
  const enrichis = CRITERES.slice(0, NB_CRITERES_ENRICHIS);
  const saisis = CRITERES.slice(NB_CRITERES_ENRICHIS);
  const somme = (liste: DefinitionCritere[]): number =>
    liste.reduce((total, c) => total + poids[c.cle], 0);

  const courante = ALGORITHME_VERSIONS[ALGORITHME_VERSIONS.length - 1];
  if (courante.version !== VERSION_COURANTE) throw new Error("VERSION_COURANTE incohérente");

  const recentes = ALGORITHME_VERSIONS.filter(
    (v) => numeroVersion(v.version) >= VERSION_RECENTE_MIN,
  )
    .map((v) => `| ${v.version} | ${v.date} | ${v.label.replace(/^v1\.\d+ \+ /, "")} |`)
    .join("\n");

  return `# Matrice de scoring de l'algorithme

> Version de l'algorithme : **${courante.version}** (${courante.date}) — ${CRITERES.length} critères, poids total ${somme(CRITERES)}, 7 usages, ${REGLES_EXCLUSION.length} règles d'exclusion.
> Fichier **généré** depuis \`MATRICE_SCORING\`, \`POIDS_CRITERES\` et \`REGLES_EXCLUSION\` (\`apps/api/src/evaluation/services/algorithme/\`) : ne pas l'éditer à la main. Régénérer avec \`pnpm docs:matrice:gen\` ; \`pnpm test\` échoue s'il diverge du code. Méthode de calcul : [evaluation-mutabilite.md](evaluation-mutabilite.md).

## Lecture

| Symbole | Impact | Points (avant pondération) |
|:-:|---|:-:|
| ++ | Très positif | +2 |
| + | Positif | +1 |
| 0 | Neutre | +0.5 en avantages **et** en contraintes |
| − | Négatif | −1 |
| −− | Très négatif | −2 |

- Points pondérés = score × poids du critère. Indice d'un usage = avantages / (avantages + contraintes) × 100.
- « Ne sait pas » n'a pas de ligne : la réponse est ignorée (ni avantage, ni contrainte) et ne compte pas dans la fiabilité.
- Colonne « Évolution » : version d'ajout du critère et versions où ses scores ont changé ; seules les modifications de scores depuis v1.${VERSION_RECENTE_MIN} sont détaillées, en gras. « v1.1 » : critère présent depuis l'origine.
- Une valeur qui n'a pas de ligne ci-dessous (ex. parc naturel régional, monument historique) n'est pas scorée : le critère est ignoré pour cet usage.
- Tranches : s = surface, d = distance, t = taux ; les bornes inclusives ou exclusives sont explicites (≤ ou <).
- « Locaux d'activité » correspond à l'usage \`tertiaire\` dans l'API, l'export CNIG et Metabase.

## Critères enrichis automatiquement (${enrichis.length}, poids ${somme(enrichis)})

${tableau(enrichis)}

## Critères saisis (${saisis.length}, poids ${somme(saisis)})

${tableau(saisis)}

## Critères excluants (depuis v1.16)

Règles binaires hors matrice : quand **toutes** les conditions sont réunies, l'usage est exclu. Son indice reste calculé et exposé, mais l'usage est relégué en fin de classement (\`exclu: true\`). « Ne sait pas » ne déclenche jamais d'exclusion.

| Règle | Conditions | Usages exclus |
|---|---|---|
${tableauRegles()}

## Versions récentes

| Version | Date | Changement |
|---|---|---|
${recentes}
`;
}
