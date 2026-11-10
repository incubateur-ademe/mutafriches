// Définition de chaque critère pour la page « Comprendre les analyses » : ce que la donnée mesure
// et comment elle est obtenue. Couverture de CRITERES_METADATA vérifiée par le spec associé.
export const DEFINITIONS_CRITERES: Record<string, string> = {
  surfaceSite: "Somme des surfaces cadastrales des parcelles du site.",
  surfaceBati: "Somme des surfaces d'emprise au sol des bâtiments présents sur les parcelles.",
  siteEnCentreVille:
    "Distance à vol d'oiseau entre le site et la mairie : le site est en centre-ville s'il se trouve à moins de 1 km de la mairie.",
  distanceAutoroute:
    "Distance par la route jusqu'à l'entrée d'autoroute ou de voie express la plus proche, recherchée dans un rayon de 50 km.",
  distanceTransportCommun:
    "Distance à vol d'oiseau jusqu'à l'arrêt de transport en commun le plus proche.",
  proximiteCommercesServices:
    "Présence d'au moins un commerce alimentaire ou service du quotidien (banque, poste, pharmacie) à moins de 500 m du site.",
  distanceRaccordementElectrique:
    "Distance au point de raccordement électrique le plus proche : poste ou ligne basse tension.",
  distanceReseauChaleur:
    "Distance au tracé du réseau de chaleur ou de froid urbain le plus proche.",
  tauxLogementsVacants: "Part des logements vacants du parc privé dans la commune du site.",
  risqueRetraitGonflementArgile:
    "Niveau d'exposition du site à l'aléa retrait-gonflement des argiles.",
  risqueCavitesSouterraines: "Présence d'une cavité souterraine recensée à moins de 1 km du site.",
  risqueInondation:
    "Exposition du site au risque d'inondation : territoire à risque important, atlas des zones inondables, programme d'actions de prévention ou plan de prévention des risques.",
  presenceRisquesTechnologiques:
    "Présence d'une installation classée (ICPE) à moins de 500 m du site, ou d'un secteur d'information sur les sols.",
  zonageReglementaire:
    "Zone du document d'urbanisme (PLU ou carte communale) dans laquelle se trouve le site.",
  zonageEnvironnemental:
    "Zonage de protection de l'environnement qui couvre le site ou se trouve à proximité : Natura 2000, ZNIEFF, réserve naturelle.",
  zonagePatrimonial:
    "Servitude patrimoniale qui couvre le site : site inscrit ou classé, abords d'un monument historique.",
  zoneAccelerationEnr:
    "Appartenance du site à une zone d'accélération des énergies renouvelables, ou à une zone d'exclusion au titre de la loi APER.",
  zonageAbcLogement:
    "Zone ABC de la commune, qui qualifie la tension du marché du logement (A bis la plus tendue, C la moins tendue).",
  distanceIte:
    "Distance à l'installation terminale embranchée (raccordement ferroviaire de fret) la plus proche, croisée avec son état.",
  siteEnQpv:
    "Appartenance du centre du site à un quartier prioritaire de la politique de la ville.",
  saturationReseauEnr:
    "Appartenance du centre du site à une zone où le réseau électrique est saturé pour raccorder de nouveaux projets d'énergie renouvelable.",
  siteEnZae: "Appartenance du centre du site à une zone d'activité économique en activité.",
  typeProprietaire: "Nature du ou des propriétaires du site, renseignée par l'utilisateur.",
  raccordementEau:
    "Raccordement aux réseaux d'eau, déduit de l'emprise au sol du bâti : un site bâti est considéré comme raccordé.",
  etatBatiInfrastructure:
    "État général des bâtiments et des infrastructures du site, renseigné par l'utilisateur.",
  presencePollution:
    "Connaissance d'une pollution des sols ou du bâti et de sa nature, renseignée par l'utilisateur.",
  valeurArchitecturaleHistorique:
    "Intérêt patrimonial des constructions du site, renseigné par l'utilisateur.",
  qualitePaysage: "Qualité du paysage environnant le site, renseignée par l'utilisateur.",
  qualiteVoieDesserte:
    "Accessibilité du site par sa voie de desserte, renseignée par l'utilisateur.",
  trameVerteEtBleue:
    "Position du site par rapport aux continuités écologiques (trame verte et bleue), renseignée par l'utilisateur.",
  presenceEspecesProtegees:
    "Connaissance d'espèces protégées sur le site, renseignée par l'utilisateur.",
  presenceZoneHumide: "Connaissance d'une zone humide sur le site, renseignée par l'utilisateur.",
};
