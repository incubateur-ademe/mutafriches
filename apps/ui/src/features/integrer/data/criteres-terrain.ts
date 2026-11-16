import {
  CHAMPS_COMPLEMENTAIRES_REQUIS,
  CRITERES_METADATA,
  ETAT_BATI_LABELS,
  PRESENCE_ESPECES_LABELS,
  PRESENCE_POLLUTION_LABELS,
  PRESENCE_ZONE_HUMIDE_LABELS,
  QUALITE_PAYSAGE_LABELS,
  QUALITE_VOIE_LABELS,
  TRAME_VERTE_BLEUE_LABELS,
  TYPE_PROPRIETAIRE_LABELS,
  VALEUR_ARCHITECTURALE_LABELS,
  type ChampComplementaireRequis,
} from "@mutafriches/shared-types";

// Le typage par ChampComplementaireRequis casse la compilation si un critère requis n'a pas ses valeurs
const VALEURS_PAR_CRITERE: Record<ChampComplementaireRequis, Record<string, string>> = {
  typeProprietaire: TYPE_PROPRIETAIRE_LABELS,
  etatBatiInfrastructure: ETAT_BATI_LABELS,
  presencePollution: PRESENCE_POLLUTION_LABELS,
  valeurArchitecturaleHistorique: VALEUR_ARCHITECTURALE_LABELS,
  qualitePaysage: QUALITE_PAYSAGE_LABELS,
  qualiteVoieDesserte: QUALITE_VOIE_LABELS,
  trameVerteEtBleue: TRAME_VERTE_BLEUE_LABELS,
  presenceEspecesProtegees: PRESENCE_ESPECES_LABELS,
  presenceZoneHumide: PRESENCE_ZONE_HUMIDE_LABELS,
};

export const VALEUR_INCONNUE = "ne-sait-pas";

export interface CritereTerrain {
  cle: ChampComplementaireRequis;
  libelle: string;
  valeurs: { code: string; libelle: string }[];
}

// Les 9 critères à transmettre au calcul, avec leurs valeurs admises (hors « ne-sait-pas », commune à tous)
export const CRITERES_TERRAIN: CritereTerrain[] = CHAMPS_COMPLEMENTAIRES_REQUIS.map((cle) => ({
  cle,
  libelle: CRITERES_METADATA[cle].label,
  valeurs: Object.entries(VALEURS_PAR_CRITERE[cle])
    .filter(([code]) => code !== VALEUR_INCONNUE)
    .map(([code, libelle]) => ({ code, libelle })),
}));

export const NOMBRE_CRITERES_AUTOMATIQUES = Object.values(CRITERES_METADATA).filter(
  (critere) => critere.saisie === "AUTOMATIQUE",
).length;
