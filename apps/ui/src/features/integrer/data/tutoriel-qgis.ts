/**
 * Contenu du tutoriel de l'extension QGIS (`/integrer-mutafriches/extension-qgis`).
 *
 * Les captures sont produites par le dépôt `mutafriches-qgis` (`scripts/captures-tutoriel.sh`),
 * dans une vraie session QGIS : ne pas les retoucher à la main, relancer le script.
 */

export const DOSSIER_CAPTURES_QGIS = "/images/tutoriel-qgis";

export const URL_TELECHARGEMENT_EXTENSION =
  "https://github.com/incubateur-ademe/mutafriches-qgis/releases/latest";

export const URL_STANDARD_CNIG = "https://schema.data.gouv.fr/cnigfr/schema-friches/";

export const VERSION_QGIS_TESTEE = "3.44";

export interface CaptureTutoriel {
  fichier: string;
  alt: string;
}

export interface EtapeTutorielQgis {
  id: string;
  titre: string;
  paragraphes: string[];
  /** Points à suivre dans l'ordre, affichés en liste numérotée. */
  actions?: string[];
  captures: CaptureTutoriel[];
  /** Encadré d'aide affiché sous l'étape. */
  aSavoir?: string;
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
    titre: "Ouvrir le panneau et se présenter",
    paragraphes: [
      "Cliquez sur le bouton Mutafriches : un panneau s'ouvre à droite de la carte. À la première ouverture, indiquez votre structure et votre adresse mail, puis cliquez sur « Suivant ».",
      "Ces informations restent sur votre poste, dans votre profil QGIS. Elles ne sont demandées qu'une fois ; le lien « Modifier » permet d'y revenir.",
    ],
    captures: [
      {
        fichier: "02-se-presenter.webp",
        alt: "QGIS avec le panneau Mutafriches ouvert à droite : formulaire « Bienvenue dans Mutafriches » avec les champs structure et mail, une case de consentement et le bouton « Suivant ».",
      },
    ],
  },
  {
    id: "preparer",
    titre: "Préparer son inventaire de sites",
    paragraphes: [
      "L'extension lit un inventaire de friches au standard national CNIG Friches, au format CSV ou GeoJSON : une ligne par site.",
      "Quatre colonnes sont indispensables : l'identifiant du site (site_id), son nom (site_nom), le code INSEE de la commune (comm_insee) et les parcelles cadastrales du site (unite_fonciere_refcad, séparées par une barre verticale), ainsi que sa localisation (geompoint).",
      "Si vous n'avez pas encore de fichier à ce format, le bouton « Télécharger un fichier exemple » enregistre un modèle à remplir. Ses trois sites sont fictifs : remplacez-les par les vôtres.",
    ],
    captures: [
      {
        fichier: "03-fichier-exemple.webp",
        alt: "Panneau Mutafriches sur l'écran d'envoi : champ de sélection du fichier de sites et bouton « Télécharger un fichier exemple ».",
      },
    ],
  },
  {
    id: "controler",
    titre: "Choisir le fichier et lire le contrôle",
    paragraphes: [
      "Sélectionnez votre fichier : chaque ligne est contrôlée aussitôt et affichée « OK » ou « KO », avec le motif de l'erreur (identifiant en double, parcelle mal formée, code INSEE invalide, localisation absente…).",
      "Les lignes en erreur sont écartées de l'envoi, les autres restent analysables. Vous pouvez corriger le fichier et le choisir à nouveau, ou envoyer tout de suite les sites prêts.",
    ],
    captures: [
      {
        fichier: "04-controle-ligne-a-ligne.webp",
        alt: "Contrôle du fichier dans le panneau : 4 sites prêts et 6 lignes en erreur, chaque ligne en erreur portant une étiquette « KO » et son motif.",
      },
      {
        fichier: "05-fichier-pret.webp",
        alt: "Contrôle d'un fichier sans erreur : 28 sites lus, toutes les lignes marquées « OK », bouton « Envoyer mes 28 sites » actif.",
      },
    ],
  },
  {
    id: "analyser",
    titre: "Lancer l'analyse",
    paragraphes: [
      "Cliquez sur « Envoyer mes sites ». Pour chaque site, Mutafriches recueille les données de plus de dix bases nationales, puis calcule l'indice de mutabilité pour sept usages.",
      "Comptez deux à cinq secondes par site. L'avancement s'affiche site par site ; vous pouvez annuler à tout moment.",
    ],
    captures: [
      {
        fichier: "06-analyse-en-cours.webp",
        alt: "Analyse en cours dans le panneau : compteur de sites traités, barre de progression et bouton « Annuler l'analyse ».",
      },
    ],
    aSavoir:
      "Sans information de terrain dans votre fichier, les critères à saisir (état du bâti, pollution, propriétaire…) sont comptés « ne sait pas ». Le calcul reste possible, mais l'indice de fiabilité s'en ressent.",
  },
  {
    id: "carte",
    titre: "Lire la carte et le tableau de bord",
    paragraphes: [
      "À la fin de l'analyse, vos sites apparaissent sur la carte, colorés selon leur usage le plus compatible. Chaque étiquette rappelle le nom du site, cet usage et son indice. La légende des couleurs se trouve dans le panneau Couches.",
      "Le panneau devient un tableau de bord de votre territoire : nombre de sites analysés, fiabilité moyenne, répartition des usages les plus compatibles, profils de sites et liste des sites à forte compatibilité.",
      "Dans cette liste, cliquer sur un site le sélectionne et recadre la carte dessus.",
    ],
    captures: [
      {
        fichier: "07-carte-et-tableau-de-bord.webp",
        alt: "Carte de Montereau-Fault-Yonne avec les sites colorés par usage et étiquetés, et le tableau de bord territorial dans le panneau : 28 sites analysés, fiabilité moyenne, jauges par usage.",
      },
      {
        fichier: "08-tableau-de-bord-profils.webp",
        alt: "Suite du tableau de bord : anneau de répartition des usages les plus compatibles et tableau des profils de sites.",
      },
      {
        fichier: "12-site-sur-la-carte.webp",
        alt: "Un site sélectionné depuis la liste des sites à forte compatibilité : la carte est recadrée sur son emprise, surlignée.",
      },
    ],
    aSavoir:
      "Un indice de mutabilité n'est pas une probabilité de réussite : il mesure la compatibilité d'un site avec un usage, au regard des critères connus. Ces résultats sont une première orientation, à croiser avec votre connaissance du territoire.",
  },
  {
    id: "tables",
    titre: "Exploiter les tables attributaires",
    paragraphes: [
      "L'extension ajoute deux couches à votre projet. « Mutabilité » porte, pour chaque site, l'usage le plus compatible, son indice, les indices des sept usages, la fiabilité et les parcelles. « Qualification » détaille les critères recueillis et signale les données manquantes.",
      "Ouvrez leurs tables par les boutons du panneau, ou comme pour toute couche QGIS : clic droit sur la couche, puis « Ouvrir la table d'attributs ». Tri, filtres, sélection, jointures et export fonctionnent comme d'habitude.",
    ],
    captures: [
      {
        fichier: "10-table-mutabilite.webp",
        alt: "Table attributaire de la couche Mutabilité ancrée sous la carte : une ligne par site avec l'usage prioritaire et les indices par usage.",
      },
      {
        fichier: "11-table-qualification.webp",
        alt: "Table attributaire de la couche Qualification : surfaces, zonage, desserte et critères de terrain de chaque site.",
      },
    ],
    aSavoir:
      "Ces couches sont temporaires : pour les conserver, enregistrez-les (clic droit, « Exporter », « Sauvegarder les entités sous… »).",
  },
  {
    id: "reprendre",
    titre: "Reprendre les sites à corriger",
    paragraphes: [
      "En bas du tableau de bord, la rubrique « Sites nécessitant votre attention » liste les lignes écartées au contrôle et les sites que l'analyse n'a pas pu traiter, avec leur motif.",
      "Corrigez votre fichier, puis cliquez sur « Analyser un autre inventaire » pour l'envoyer à nouveau.",
    ],
    captures: [
      {
        fichier: "13-sites-a-reprendre.webp",
        alt: "Bas du tableau de bord : encadré rouge « 6 sites à reprendre » listant les lignes du fichier écartées.",
      },
    ],
  },
];

export interface QuestionTutoriel {
  question: string;
  reponse: string;
}

export const QUESTIONS_TUTORIEL_QGIS: QuestionTutoriel[] = [
  {
    question: "Le panneau affiche « Accès refusé » ou « API injoignable »",
    reponse:
      "L'extension interroge le service Mutafriches par Internet. Vérifiez votre connexion et, derrière un proxy, les réglages réseau de QGIS. Si le message persiste, écrivez-nous.",
  },
  {
    question: "Mon fichier est refusé en entier",
    reponse:
      "Une colonne indispensable manque (site_id, site_nom, comm_insee, unite_fonciere_refcad ou geompoint), ou le fichier n'est ni un CSV ni un GeoJSON. Repartez du fichier exemple.",
  },
  {
    question: "Un site est en échec alors que sa ligne était « OK »",
    reponse:
      "Une de ses parcelles est probablement introuvable au cadastre, ou le service n'a pas répondu à temps. Vérifiez les identifiants de parcelles (14 caractères) et relancez l'analyse.",
  },
  {
    question: "Puis-je essayer sans inventaire ?",
    reponse:
      "Oui : le lien « Passer en mode démonstration », en bas de l'écran d'envoi, montre le parcours complet sur des données figées.",
  },
];
