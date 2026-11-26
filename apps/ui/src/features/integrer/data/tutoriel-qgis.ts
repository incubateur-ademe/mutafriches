import { SOURCES_DONNEES } from "@mutafriches/shared-types";

/**
 * Contenu du tutoriel de l'extension QGIS (`/utiliser-mutafriches/extension-qgis`).
 *
 * Les captures sont produites par le dépôt `mutafriches-qgis` (`scripts/captures-tutoriel.sh`),
 * dans une vraie session QGIS : ne pas les retoucher à la main, relancer le script.
 */

export const DOSSIER_CAPTURES_QGIS = "/images/tutoriel-qgis";

const URL_DERNIERE_RELEASE = "https://github.com/incubateur-ademe/mutafriches-qgis/releases/latest";

// ZIP au nom sans version, joint à chaque release par release.yml du dépôt mutafriches-qgis :
// GitHub redirige vers celui de la dernière release
export const URL_TELECHARGEMENT_EXTENSION = `${URL_DERNIERE_RELEASE}/download/extension-qgis-mutafriches.zip`;

// Numéro et notes de la dernière version
export const URL_VERSIONS_EXTENSION = URL_DERNIERE_RELEASE;

// Inventaire de 5 vrais sites de Montereau-Fault-Yonne, joint à chaque release de l'extension
export const URL_FICHIER_TEST_QGIS = `${URL_DERNIERE_RELEASE}/download/friches-cnig-test-montereau-5-sites.csv`;

export const URL_STANDARD_CNIG = "https://schema.data.gouv.fr/cnigfr/schema-friches/";

export const VERSION_QGIS_TESTEE = "3.44";

export interface CaptureTutoriel {
  fichier: string;
  alt: string;
}

/** Paragraphe contenant un lien externe, entre deux portions de texte. */
export interface ParagrapheAvecLien {
  avant: string;
  lien: { libelle: string; url: string };
  apres: string;
}

export type ParagrapheTutoriel = string | ParagrapheAvecLien;

export const texteParagraphe = (paragraphe: ParagrapheTutoriel): string =>
  typeof paragraphe === "string"
    ? paragraphe
    : `${paragraphe.avant}${paragraphe.lien.libelle}${paragraphe.apres}`;

export interface EtapeTutorielQgis {
  id: string;
  titre: string;
  paragraphes: ParagrapheTutoriel[];
  /** Points à suivre dans l'ordre, affichés en liste numérotée. */
  actions?: string[];
  captures: CaptureTutoriel[];
  /** Encadré d'aide affiché sous l'étape. */
  aSavoir?: string;
  /** Avertissement affiché sous l'étape, quand un travail peut être perdu. */
  attention?: string;
}

export const ETAPES_TUTORIEL_QGIS: EtapeTutorielQgis[] = [
  {
    id: "installer",
    titre: "Installer l'extension",
    paragraphes: [
      "L'extension se présente sous la forme d'un fichier ZIP à installer depuis le gestionnaire d'extensions de QGIS. Aucune autre dépendance n'est nécessaire.",
    ],
    actions: [
      "Téléchargez le fichier ZIP de l'extension.",
      "Dans QGIS, ouvrez le menu Extensions, puis « Installer/Gérer les extensions ».",
      "Choisissez l'onglet « Installer depuis un ZIP », sélectionnez le fichier téléchargé et cliquez sur « Installer l'extension ».",
      "Acceptez l'avertissement sur les extensions non vérifiées : un bouton Mutafriches apparaît dans la barre d'outils.",
    ],
    captures: [
      {
        fichier: "01-installer-depuis-un-zip.webp",
        alt: "Gestionnaire d'extensions de QGIS, onglet « Installer depuis un ZIP », avec le champ « Fichier ZIP » et le bouton « Installer l'extension ».",
      },
    ],
  },
  {
    id: "se-presenter",
    titre: "Ouvrir le plugin et déclarer sa structure",
    paragraphes: [
      "Cliquez sur le bouton Mutafriches : le plugin s'ouvre à droite de la carte. Déclarez votre structure (nom, type et domaine, par exemple ma-collectivite.fr), indiquez vos prénom, nom et adresse e-mail, cochez la case « J'accepte d'être contacté·e », obligatoire pour utiliser l'extension, puis cliquez sur « Suivant ».",
      "Ces informations sont recueillies pour suivre l'utilisation de l'extension. Vos prénom, nom et adresse e-mail sont conservés dans notre outil d'e-mailing, pas dans la base de Mutafriches.",
    ],
    aSavoir:
      "Si votre projet QGIS est vide, l'extension y ajoute un fond de carte OpenStreetMap cadré sur la France, pour situer vos sites. Si votre projet contient déjà des couches, elle n'y touche pas : vos sites s'afficheront par-dessus vos propres fonds.",
    attention:
      "Vérifiez vos informations avant de cliquer sur « Suivant » : une fois votre structure déclarée, elles ne sont plus modifiables dans l'extension. Pour les faire corriger ensuite, écrivez à contact@mutafriches.beta.gouv.fr.",
    captures: [
      {
        fichier: "02-se-presenter.webp",
        alt: "QGIS avec un fond de carte de la France au centre et le panneau Mutafriches ouvert à droite : formulaire « Bienvenue dans Mutafriches » de déclaration de la structure : nom, type, domaine, prénom, nom, adresse e-mail et case d'accord cochée, puis le bouton « Suivant ».",
      },
    ],
  },
  {
    id: "regler",
    titre: "Retrouver ses réglages",
    paragraphes: [
      "Les réglages sont dans la page Mutafriches des options de QGIS : menu Préférences, Options, ou menu Extensions, Mutafriches, « Réglages… ».",
      "Vous y retrouvez les informations déclarées à l'étape précédente, en lecture seule, et vous décidez si l'extension ajoute un fond de carte OpenStreetMap quand votre projet est vide.",
    ],
    captures: [
      {
        fichier: "14-reglages.webp",
        alt: "Fenêtre Options de QGIS sur la page Mutafriches : structure, domaine, prénom, nom, adresse e-mail et accord de contact affichés sans champ de saisie, puis case du fond de carte OpenStreetMap.",
      },
    ],
  },
  {
    id: "preparer",
    titre: "Préparer son inventaire de sites",
    paragraphes: [
      {
        avant: "L'extension lit un inventaire de friches au ",
        lien: { libelle: "standard CNIG Friches", url: URL_STANDARD_CNIG },
        apres: ", en CSV ou en GeoJSON : une ligne par site.",
      },
      "Si vous n'avez pas encore de fichier à ce format, cliquez sur le « ? » à côté de « Fichier de sites », puis sur « Télécharger un modèle de fichier vide » : il contient les colonnes du standard, à remplir avec vos sites.",
      {
        avant: "Pour un premier essai, téléchargez un ",
        lien: { libelle: "inventaire de test de 5 sites réels", url: URL_FICHIER_TEST_QGIS },
        apres: " (Montereau-Fault-Yonne), prêt à être analysé.",
      },
    ],
    captures: [
      {
        fichier: "03-modele-de-fichier.webp",
        alt: "Panneau Mutafriches sur l'écran d'envoi : champ de sélection du fichier de sites, et bulle d'aide ouverte avec le lien « Télécharger un modèle de fichier vide ».",
      },
    ],
  },
  {
    id: "controler",
    titre: "Choisir le fichier et lire le contrôle",
    paragraphes: [
      "Sélectionnez votre fichier : chaque ligne est contrôlée aussitôt et affichée « OK » ou « KO », avec le motif de l'erreur (identifiant en double, parcelle mal formée, code INSEE invalide, localisation absente…).",
      "Deux encadrés résument le contrôle : en rouge, les sites KO, écartés de l'analyse et à corriger ; en vert, les sites OK, prêts à être analysés. Chacun n'apparaît que s'il a des sites.",
      "Sous la liste, « Analyser les sites OK » lance l'analyse des sites valides ; « Charger de nouveau le fichier » relit votre fichier une fois corrigé.",
    ],
    captures: [
      {
        fichier: "04-controle-ligne-a-ligne.webp",
        alt: "Contrôle du fichier dans le panneau : un encadré rouge « 6 sites KO », un encadré vert « 4 sites OK », puis chaque site en erreur avec son étiquette « KO » et son motif.",
      },
      {
        fichier: "05-fichier-pret.webp",
        alt: "Contrôle d'un fichier sans erreur : un encadré vert « 28 sites OK », toutes les lignes marquées « OK », bouton « Analyser mes 28 sites » actif.",
      },
    ],
  },
  {
    id: "analyser",
    titre: "Lancer l'analyse",
    paragraphes: [
      `Cliquez sur « Analyser mes sites ». Pour chaque site, Mutafriches recueille automatiquement ses données d'identification et de qualification auprès de ${SOURCES_DONNEES.length} sources de données nationales, puis calcule son indice de mutabilité pour sept usages.`,
      "L'analyse peut prendre de quelques secondes à quelques minutes. L'avancement s'affiche site par site ; vous pouvez annuler à tout moment.",
    ],
    captures: [
      {
        fichier: "06-analyse-en-cours.webp",
        alt: "Analyse en cours dans le panneau : compteur de sites traités, barre de progression et bouton « Annuler l'analyse ».",
      },
    ],
    aSavoir:
      "L'indice de fiabilité reflète la complétude des informations concernant la friche. Il baisse si des données manquent ou si la connaissance terrain (état du bâti, pollution, propriétaire…) est absente de votre fichier : ces critères sont alors comptés « Je ne sais pas ».",
  },
  {
    id: "carte",
    titre: "Lire la carte et le tableau de bord",
    paragraphes: [
      "À la fin de l'analyse, la carte se recadre sur vos sites, colorés selon leur usage le plus compatible. Chaque étiquette rappelle le nom du site, cet usage et son indice de mutabilité. La légende des couleurs se trouve dans le panneau Couches.",
      "Le panneau devient un tableau de bord de votre territoire : nombre de sites analysés, indice de fiabilité moyen, répartition des usages les plus compatibles, liste des sites à forte compatibilité et profils des sites.",
      "L'indice de mutabilité d'un usage est un pourcentage de compatibilité : avantages / (avantages + contraintes).",
      "Dans cette liste, cliquer sur un site le sélectionne et recadre la carte dessus.",
    ],
    captures: [
      {
        fichier: "07-carte-et-tableau-de-bord.webp",
        alt: "Carte de Montereau-Fault-Yonne avec les sites colorés par usage et étiquetés, et le tableau de bord territorial dans le panneau : 28 sites analysés, fiabilité moyenne, jauges par usage.",
      },
      {
        fichier: "12-site-sur-la-carte.webp",
        alt: "Un site sélectionné depuis la liste des sites à forte compatibilité : la carte est recadrée sur son emprise, surlignée.",
      },
    ],
  },
  {
    id: "tables",
    titre: "Exploiter les tables attributaires",
    paragraphes: [
      "L'extension ajoute deux couches à votre projet. « Mutabilité » porte, pour chaque site, l'usage le plus compatible, l'indice de mutabilité de tous les usages, l'indice de fiabilité et les parcelles. « Qualification » détaille l'identification et la qualification du site (données automatiques), la connaissance terrain lue dans votre fichier (données manuelles) et signale les données manquantes.",
      "Ouvrez leurs tables par les boutons « Voir table de mutabilité » et « Voir table de qualification » du panneau, ou comme pour toute couche QGIS : clic droit sur la couche, puis « Ouvrir la table d'attributs ». Tri, filtres, sélection, jointures et export fonctionnent comme d'habitude.",
      "Le lien « Améliorer la fiabilité » du tableau de bord ouvre la table de qualification : les critères de terrain inconnus y apparaissent en rouge. Renseignez-les dans votre fichier, puis relancez l'analyse.",
    ],
    captures: [
      {
        fichier: "10-table-mutabilite.webp",
        alt: "Table attributaire de la couche Mutabilité ancrée sous la carte : une ligne par site avec l'usage prioritaire et les indices par usage.",
      },
      {
        fichier: "13-ameliorer-la-fiabilite.webp",
        alt: "Table de qualification ouverte par « Améliorer la fiabilité » : les critères de terrain « Ne sait pas » sont sur fond rouge, juste après le nom du site.",
      },
    ],
    attention:
      "Ces couches sont temporaires : pour les conserver, enregistrez-les (clic droit, « Exporter », « Sauvegarder les entités sous… »).",
  },
];

export interface QuestionTutoriel {
  /** Identifiant stable de l'accordéon */
  id: string;
  question: string;
  reponse: ParagrapheTutoriel;
}

export const QUESTIONS_TUTORIEL_QGIS: QuestionTutoriel[] = [
  {
    id: "acces-refuse",
    question: "Le panneau affiche « Accès refusé » ou « API injoignable »",
    reponse:
      "L'extension interroge le service Mutafriches par Internet. Pour « API injoignable », vérifiez votre connexion et, derrière un proxy, les réglages réseau de QGIS. Pour « Accès refusé », vérifiez le domaine de votre structure par le lien « Modifier », qui apparaît alors en bas du panneau. Si le message persiste, écrivez-nous.",
  },
  {
    id: "fichier-refuse",
    question: "Mon fichier est refusé en entier",
    reponse:
      "Une colonne indispensable manque (site_id, site_nom, comm_insee, unite_fonciere_refcad ou geompoint), ou le fichier n'est ni un CSV ni un GeoJSON. Repartez du modèle de fichier vide.",
  },
  {
    id: "site-en-echec",
    question: "Un site est en échec alors que sa ligne était « OK »",
    reponse:
      "Ses parcelles sont probablement introuvables au cadastre, ou le service n'a pas répondu à temps. Vérifiez les identifiants de parcelles (14 caractères, parcelles existantes) et relancez l'analyse. QGIS signale les sites non analysés dans sa barre de messages, à la fin de l'analyse.",
  },
  {
    id: "carte-sans-fond",
    question: "La carte reste blanche ou sans fond",
    reponse:
      "Le fond OpenStreetMap n'est ajouté que dans un projet vide, s'il n'a pas été désactivé dans les réglages, et il demande une connexion Internet. Dans un projet qui a déjà des couches, ajoutez le fond de votre choix : les sites analysés s'affichent dans tous les cas.",
  },
  {
    id: "sans-inventaire",
    question: "Puis-je essayer sans inventaire ?",
    reponse:
      "Oui : l'étape « Préparer son inventaire de sites » propose un inventaire de test de 5 sites réels (Montereau-Fault-Yonne). Téléchargez-le et analysez-le comme votre propre fichier.",
  },
  {
    id: "modifier-informations",
    question: "Comment modifier les informations de ma structure ?",
    reponse:
      "Une fois votre structure déclarée, ses informations ne sont plus modifiables dans l'extension, et la désinstaller ne les efface pas : QGIS les conserve dans votre profil. Pour les faire corriger, écrivez à contact@mutafriches.beta.gouv.fr.",
  },
  {
    id: "a-propos",
    question: "À propos de l'extension QGIS",
    reponse: {
      avant:
        "L'extension est développée par l'équipe Mutafriches et publiée sur GitHub. Le bouton « Télécharger l'extension » fournit toujours la dernière version ; son numéro et ses nouveautés sont détaillés sur la ",
      lien: { libelle: "page des versions de l'extension", url: URL_VERSIONS_EXTENSION },
      apres:
        ". La version installée se lit dans le gestionnaire d'extensions de QGIS, onglet « Installées ».",
    },
  },
];
