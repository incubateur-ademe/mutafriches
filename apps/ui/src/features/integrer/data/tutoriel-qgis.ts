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
      "Si votre projet QGIS est vide, l'extension y ajoute un fond de carte OpenStreetMap cadré sur la France, pour situer vos sites. Si votre projet contient déjà des couches, elle n'y touche pas : vos sites s'afficheront par-dessus vos propres fonds.",
    ],
    captures: [
      {
        fichier: "02-se-presenter.webp",
        alt: "QGIS avec un fond de carte de la France au centre et le panneau Mutafriches ouvert à droite : formulaire « Bienvenue dans Mutafriches » avec les champs structure et mail, une case de consentement et le bouton « Suivant ».",
      },
    ],
  },
  {
    id: "preparer",
    titre: "Préparer son inventaire de sites",
    paragraphes: [
      "L'extension lit un inventaire de friches au standard CNIG Friches : une ligne par site. Le CSV est le fichier d'échange de référence, validable sur validata.fr et ouvrable dans un tableur ; le GeoJSON est directement exploitable dans un SIG.",
      "Quatre colonnes sont indispensables : l'identifiant du site (site_id), son nom (site_nom), le code INSEE de la commune (comm_insee) et les parcelles cadastrales du site (unite_fonciere_refcad, séparées par une barre verticale), ainsi que sa localisation (geompoint).",
      "Si vous n'avez pas encore de fichier à ce format, le bouton « Télécharger un fichier exemple » enregistre un modèle à remplir, par défaut dans votre dossier Téléchargements. Ses trois sites sont fictifs : remplacez-les par les vôtres. Envoyé tel quel, ce fichier est refusé au contrôle.",
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
      "Cliquez sur « Envoyer mes sites ». Pour chaque site, Mutafriches recueille automatiquement ses données d'identification et de qualification auprès de plus de dix bases nationales, puis calcule son indice de mutabilité pour sept usages.",
      "Comptez deux à cinq secondes par site. L'avancement s'affiche site par site ; vous pouvez annuler à tout moment.",
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
      "Le panneau devient un tableau de bord de votre territoire : nombre de sites analysés, indice de fiabilité moyen, répartition des usages les plus compatibles, profils de sites et liste des sites à forte compatibilité.",
      "L'indice de mutabilité d'un usage est un pourcentage de compatibilité : avantages / (avantages + contraintes).",
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
      "Ces résultats constituent une première orientation, basée sur les éléments que nous avons recueillis et que vous avez renseignés. Ils doivent être croisés avec votre connaissance du territoire et ne se substituent pas à des études de programmation. Un indice de mutabilité n'est pas une probabilité de réussite. Pour les sites de plus d'un hectare, il vous est recommandé de privilégier un mixte d'usages dans votre programmation.",
  },
  {
    id: "tables",
    titre: "Exploiter les tables attributaires",
    paragraphes: [
      "L'extension ajoute deux couches à votre projet. « Mutabilité » porte, pour chaque site, l'usage le plus compatible, l'indice de mutabilité de tous les usages, l'indice de fiabilité et les parcelles. « Qualification » détaille l'identification et la qualification du site (données automatiques), la connaissance terrain lue dans votre fichier (données manuelles) et signale les données manquantes.",
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
  {
    id: "regler",
    titre: "Régler l'extension",
    paragraphes: [
      "Le lien « Réglages », en bas de l'écran d'envoi, ouvre la page Mutafriches des options de QGIS. Vous la retrouvez aussi par le menu Préférences, Options, ou par le menu Extensions, Mutafriches.",
      "Vous y choisissez le service utilisé (l'analyse réelle, ou une démonstration sur des données figées), vous modifiez ou effacez votre structure et votre adresse mail, et vous décidez si l'extension ajoute un fond de carte OpenStreetMap quand votre projet est vide.",
    ],
    captures: [
      {
        fichier: "14-reglages.webp",
        alt: "Fenêtre Options de QGIS sur la page Mutafriches : choix de l'environnement, structure et adresse mail avec le bouton « Effacer mes informations », case du fond de carte OpenStreetMap et case du mode développeur.",
      },
    ],
    aSavoir:
      "Changer de service vide les résultats affichés et retire les deux couches Mutafriches du projet : enregistrez-les avant si vous voulez les conserver. Le mode développeur est réservé à l'équipe Mutafriches.",
  },
];

export interface QuestionTutoriel {
  /** Identifiant stable de l'accordéon */
  id: string;
  question: string;
  reponse: string;
}

export const QUESTIONS_TUTORIEL_QGIS: QuestionTutoriel[] = [
  {
    id: "acces-refuse",
    question: "Le panneau affiche « Accès refusé » ou « API injoignable »",
    reponse:
      "L'extension interroge le service Mutafriches par Internet. Vérifiez votre connexion et, derrière un proxy, les réglages réseau de QGIS. Si le message persiste, écrivez-nous.",
  },
  {
    id: "fichier-refuse",
    question: "Mon fichier est refusé en entier",
    reponse:
      "Une colonne indispensable manque (site_id, site_nom, comm_insee, unite_fonciere_refcad ou geompoint), ou le fichier n'est ni un CSV ni un GeoJSON. Repartez du fichier exemple.",
  },
  {
    id: "site-en-echec",
    question: "Un site est en échec alors que sa ligne était « OK »",
    reponse:
      "Ses parcelles sont probablement introuvables au cadastre, ou le service n'a pas répondu à temps. Vérifiez les identifiants de parcelles (14 caractères, parcelles existantes) et relancez l'analyse.",
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
      "Oui : le lien « Passer en mode démonstration », en bas de l'écran d'envoi, montre le parcours complet sur des données figées. Le même choix se fait dans les réglages de l'extension.",
  },
];
