/**
 * Exemples de requêtes et de réponses des pages de documentation de l'API et de l'iframe.
 * À tenir alignés sur les contrats de `@mutafriches/shared-types` et sur Swagger.
 */

export const URL_PRODUCTION = "https://mutafriches.beta.gouv.fr";
export const URL_SWAGGER = `${URL_PRODUCTION}/api`;
export const LIMITE_REQUETES_PAR_MINUTE = 100;

export const EXEMPLE_ORIGINE = `POST https://mutafriches.beta.gouv.fr/enrichissement
Content-Type: application/json
Origin: https://mon-service.gouv.fr

{
  "identifiant": "49353000AV0202"
}`;

export const ENRICHIR_MULTI = `POST https://mutafriches.beta.gouv.fr/enrichissement
Content-Type: application/json

{
  "identifiants": ["49353000AV0202", "49353000AV0203"]
}`;

export const ENRICHIR_REPONSE = `{
  "identifiantParcelle": "49353000AV0202,49353000AV0203",
  "identifiantsParcelles": ["49353000AV0202", "49353000AV0203"],
  "nombreParcelles": 2,
  "parcellePredominante": "49353000AV0203",
  "communePredominante": "Trélazé",
  "codeInsee": "49353",
  "commune": "Trélazé",
  "coordonnees": { "latitude": 47.4457, "longitude": -0.473 },
  "geometrie": { /* polygone GeoJSON du site */ },
  "surfaceSite": 1449,
  "surfaceBati": 297,
  "siteEnCentreVille": true,
  "distanceAutoroute": 2841,
  "distanceTransportCommun": 122,
  "proximiteCommercesServices": true,
  "distanceIte": "plus-1km",
  "distanceIteMetres": 1130,
  "distanceRaccordementElectrique": 23.25,
  "distanceReseauChaleur": 638,
  "tauxLogementsVacants": 5.1,
  "zonageAbcLogement": "b1",
  "risqueRetraitGonflementArgile": "faible-ou-moyen",
  "risqueCavitesSouterraines": "oui",
  "risqueInondation": "oui",
  "presenceRisquesTechnologiques": true,
  "siteReferencePollue": true,
  "zonageReglementaire": "zone-urbaine-u-habitat",
  "zonageEnvironnemental": "hors-zone",
  "zonagePatrimonial": "non-concerne",
  "zoneAccelerationEnr": "oui",
  "zaer": {
    "enZoneZaer": true,
    "enZoneExclusion": false,
    "nombreZones": 4,
    "filieres": ["SOLAIRE_PV", "GEOTHERMIE", "SOLAIRE_THERMIQUE"],
    "zones": [ /* détail par zone */ ]
  },
  "siteEnQpv": false,
  "saturationReseauEnr": false,
  "siteEnZae": false,
  "ilotChaleurUrbain": "non-couvert",
  "intensiteIlotChaleurC": null,
  "sourcesUtilisees": ["Cadastre", "BDNB", "Enedis-Raccordement", /* ... */],
  "sourcesEchouees": [],
  "champsManquants": []
}`;

export const CALCULER_REPONSE = `{
  "fiabilite": {
    "note": 8.5,
    "text": "Très fiable"
  },
  "resultats": [
    {
      "rang": 1,
      "usage": "residentiel",
      "indiceMutabilite": 68,
      "potentiel": "Très bon",
      "exclu": false
    },
    /* ... */
    {
      "rang": 7,
      "usage": "photovoltaique",
      "indiceMutabilite": 58,
      "potentiel": "Exclu",
      "exclu": true,
      "criteresExcluants": ["zoneAccelerationEnr"]
    }
  ],
  "evaluationId": "eval-uuid"
}`;

// --- Extraits réduits aux champs utiles (page API, « Votre première analyse ») ---

export const ENRICHIR_ENVOI_COURT = `POST /enrichissement

{
  "identifiant": "49353000AV0202"
}`;

export const CALCULER_ENVOI_COURT = `POST /evaluation/calculer

{
  "donneesEnrichies": { /* réponse de l'étape 1 */ },
  "donneesComplementaires": {
    "typeProprietaire": "prive",
    "etatBatiInfrastructure": "degradation-heterogene",
    "presencePollution": "ne-sait-pas",
    "valeurArchitecturaleHistorique": "interet-remarquable",
    "qualitePaysage": "ordinaire",
    "qualiteVoieDesserte": "accessible",
    "trameVerteEtBleue": "hors-trame",
    "presenceEspecesProtegees": "non",
    "presenceZoneHumide": "non"
  }
}`;

export const ENRICHIR_REPONSE_COURTE = `{
  "identifiantsParcelles": ["49353000AV0202"],
  "commune": "Trélazé",
  "surfaceSite": 1449,
  "surfaceBati": 297,
  "siteEnCentreVille": true,
  "risqueInondation": "oui",
  /* ... une trentaine d'autres données ... */
  "sourcesEchouees": [],
  "champsManquants": []
}`;

export const CALCULER_REPONSE_COURTE = `{
  "fiabilite": { "note": 8.5, "text": "Très fiable" },
  "resultats": [
    {
      "rang": 1,
      "usage": "residentiel",
      "indiceMutabilite": 68,
      "potentiel": "Très bon",
      "exclu": false
    }
    /* ... les six autres usages ... */
  ],
  "evaluationId": "eval-uuid"
}`;

// --- Exemples complets, exécutables une fois le domaine autorisé ---

export const EXEMPLE_COMPLET_JS = `// Node.js 18 ou plus récent : node analyse.mjs
const API = "https://mutafriches.beta.gouv.fr";
const enTetes = {
  "Content-Type": "application/json",
  // Votre domaine autorisé (inutile depuis un navigateur, qui l'envoie seul)
  Origin: "https://mon-service.gouv.fr",
};

async function appeler(chemin, corps) {
  const reponse = await fetch(API + chemin, {
    method: "POST",
    headers: enTetes,
    body: JSON.stringify(corps),
  });
  if (!reponse.ok) throw new Error(chemin + " : " + reponse.status + " " + (await reponse.text()));
  return reponse.json();
}

// 1. Recueillir les données automatiques du site
const donneesEnrichies = await appeler("/enrichissement", {
  identifiants: ["49353000AV0202"],
});

// 2. Ajouter la connaissance terrain ("ne-sait-pas" si l'information manque)
const donneesComplementaires = {
  typeProprietaire: "prive",
  etatBatiInfrastructure: "degradation-heterogene",
  presencePollution: "ne-sait-pas",
  valeurArchitecturaleHistorique: "interet-remarquable",
  qualitePaysage: "ordinaire",
  qualiteVoieDesserte: "accessible",
  trameVerteEtBleue: "hors-trame",
  presenceEspecesProtegees: "non",
  presenceZoneHumide: "non",
};

// 3. Calculer la mutabilité
const analyse = await appeler("/evaluation/calculer", {
  donneesEnrichies,
  donneesComplementaires,
});

console.log("Fiabilité :", analyse.fiabilite.note, "/ 10");
for (const resultat of analyse.resultats) {
  console.log(resultat.rang, resultat.usage, resultat.indiceMutabilite, resultat.exclu ? "(exclu)" : "");
}`;

export const EXEMPLE_COMPLET_CURL = `# Nécessite curl et jq

# 1. Recueillir les données automatiques du site
curl -s -X POST https://mutafriches.beta.gouv.fr/enrichissement \\
  -H "Content-Type: application/json" \\
  -H "Origin: https://mon-service.gouv.fr" \\
  -d '{ "identifiants": ["49353000AV0202"] }' \\
  -o enrichissement.json

# 2. Ajouter la connaissance terrain ("ne-sait-pas" si l'information manque)
cat > terrain.json <<'FIN'
{
  "typeProprietaire": "prive",
  "etatBatiInfrastructure": "degradation-heterogene",
  "presencePollution": "ne-sait-pas",
  "valeurArchitecturaleHistorique": "interet-remarquable",
  "qualitePaysage": "ordinaire",
  "qualiteVoieDesserte": "accessible",
  "trameVerteEtBleue": "hors-trame",
  "presenceEspecesProtegees": "non",
  "presenceZoneHumide": "non"
}
FIN

# 3. Calculer la mutabilité
jq -n --slurpfile e enrichissement.json --slurpfile t terrain.json \\
  '{ donneesEnrichies: $e[0], donneesComplementaires: $t[0] }' \\
  | curl -s -X POST https://mutafriches.beta.gouv.fr/evaluation/calculer \\
      -H "Content-Type: application/json" \\
      -H "Origin: https://mon-service.gouv.fr" \\
      -d @- \\
  | jq '{ fiabilite, resultats }'`;

export const RELIRE_REQUETE = `GET https://mutafriches.beta.gouv.fr/evaluation/{id}`;

export const RELIRE_REPONSE = `{
  "id": "eval-uuid",
  "identifiantParcelle": "49353000AV0202",
  "dateCreation": "2024-03-15T10:30:00Z",
  "enrichissement": { /* données enrichies */ },
  "donneesComplementaires": { /* données saisies */ },
  "mutabilite": { /* résultats de calcul */ }
}`;

export const ATTRIBUTAIRE_REQUETE = `GET https://mutafriches.beta.gouv.fr/api/attributaire/sites?codeInsee=77305`;

export const ATTRIBUTAIRE_REPONSE = `{
  "codeInsee": "77305",
  "commune": "Montereau-Fault-Yonne",
  "dateGeneration": "2026-11-03T10:00:00.000Z",
  "avertissement": "Les critères saisis sont déclaratifs : ...",
  "nombreSites": 27,
  "sites": [
    {
      "cleSite": "77305000AV0499,77305000AV0500",
      "parcelles": ["77305000AV0499", "77305000AV0500"],
      "codeInsee": "77305",
      "commune": "Montereau-Fault-Yonne",
      "nom": "Ex-bâtiment ORANGE",
      "partenaire": "scet",
      "centroide": { "latitude": 48.3895, "longitude": 2.9555 },
      "criteresAutomatiques": {
        "surfaceSite": 3415,
        "surfaceBati": 2512,
        "siteEnCentreVille": true,
        "zonageAbcLogement": null
        /* ... */
      },
      "saisieDeclarative": true,
      "criteresSaisis": {
        "typeProprietaire": "prive",
        "presencePollution": "non"
        /* ... les 9 critères manuels */
      },
      "nombreEvaluations": 2,
      "mutabilite": {
        "indices": { "residentiel": 72.3, "equipements": 68 /* ... */ },
        "usagePrioritaire": "residentiel",
        "usagesExclus": [],
        "fiabilite": { "note": 9, "niveau": "Très fiable" }
      },
      "versionAlgorithme": "v1.19"
    }
  ]
}`;

export const ATTRIBUTAIRE_GEOJSON = `curl "https://mutafriches.beta.gouv.fr/api/attributaire/sites?codeInsee=77305&format=geojson" \\
  -o sites-77305.geojson`;

export const IFRAME_EXEMPLE_MINIMAL = `<!-- Iframe Mutafriches -->
<iframe 
  id="mutafriches"
  src="https://mutafriches.beta.gouv.fr/iframe?integrator=demo&callbackUrl=https://mon-site.fr&callbackLabel=Retour"
  style="width: 100%; height: 900px; border: none;">
</iframe>

<script>
  // Écouter les résultats
  window.addEventListener('message', (event) => {
    // Vérifier l'origine pour la sécurité
    if (event.origin !== 'https://mutafriches.beta.gouv.fr') return;
    
    if (event.data.type === 'mutafriches:completed') {
      console.log('Analyse terminée', event.data.data);
      // Traiter les résultats...
    }
  });
</script>`;

export const IFRAME_MESSAGE_COMPLETED = `{
  type: 'mutafriches:completed',
  timestamp: 1758177708492,
  data: {
    evaluationId: "uuid-de-l-evaluation",
    identifiantParcelle: "49353000AV0202",
    identifiantsParcelles: ["49353000AV0202"],
    retrieveUrl: "/evaluation/uuid-de-l-evaluation",
    fiabilite: { note: 8.5, text: "Fiable" },
    usagePrincipal: {
      usage: "residentiel",
      indiceMutabilite: 75.5,
      potentiel: "Excellent"
    },
    top3Usages: [...]
  }
}`;

export const IFRAME_MESSAGE_ERROR = `{
  type: "mutafriches:error",
  timestamp: 1758177708492,
  data: {
    error: "Description de l'erreur",
    code: "ERROR_CODE"
  }
}`;

export const IFRAME_VERIFIER_ORIGINE = `if (event.origin !== 'https://mutafriches.beta.gouv.fr') return;`;
