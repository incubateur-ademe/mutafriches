import {
  DistanceIte,
  ZoneAccelerationEnr,
  type EnrichissementOutputDto,
  type FrichesCerema,
} from "@mutafriches/shared-types";

/**
 * Logique pure de comparaison entre l'enrichissement Mutafriches et les données sources
 * Cartofriches (API Cerema). Produit une ligne par champ comparé.
 *
 * On compare les données SOURCES (l'API Cerema n'expose pas de score fiable) : surface,
 * commune, pollution, ZAER et surtout la distance à une ITE fret (sujet d'écart identifié).
 */

/** Résultat d'une comparaison de champ */
export interface LigneEcart {
  cle: string;
  label: string;
  /** Valeur Mutafriches formatée pour affichage */
  mutafriches: string;
  /** Valeur Cartofriches formatée pour affichage */
  cartofriches: string;
  /** true si les deux valeurs divergent */
  ecart: boolean;
  /** false si l'une des deux valeurs est absente (comparaison impossible) */
  comparable: boolean;
  /** Ampleur de l'écart (ex: "+5.9%") */
  magnitude?: string;
  /** Précision sur la nature de l'écart */
  note?: string;
  /** Avertissement : incohérence interne de Cartofriches (donnée API vs fiche) */
  warning?: string;
}

const ABSENT = "—";

/** Formate un nombre pour affichage, ou tiret si absent */
function fmtNombre(valeur: number | null | undefined, suffixe = ""): string {
  if (valeur === null || valeur === undefined) return ABSENT;
  return `${Math.round(valeur * 100) / 100}${suffixe}`;
}

/** Compare deux surfaces en m² avec une tolérance relative */
function comparerSurface(
  cle: string,
  label: string,
  mutafriches: number | null | undefined,
  cartofriches: number | null | undefined,
  tolerancePct = 5,
): LigneEcart {
  const comparable =
    mutafriches !== null &&
    mutafriches !== undefined &&
    cartofriches !== null &&
    cartofriches !== undefined;

  let ecart = false;
  let magnitude: string | undefined;
  let note: string | undefined;

  if (comparable) {
    const ref = Math.max(Math.abs(cartofriches), 1);
    const diffPct = ((mutafriches - cartofriches) / ref) * 100;
    const signe = diffPct >= 0 ? "+" : "";
    magnitude = `${signe}${Math.round(diffPct * 10) / 10}%`;
    ecart = Math.abs(diffPct) > tolerancePct;
    note = ecart ? `Écart > tolérance ±${tolerancePct}%` : `Dans la tolérance ±${tolerancePct}%`;
  } else {
    note = "Surface absente d'un des deux côtés";
  }

  return {
    cle,
    label,
    mutafriches: fmtNombre(mutafriches, " m²"),
    cartofriches: fmtNombre(cartofriches, " m²"),
    ecart,
    comparable,
    magnitude,
    note,
  };
}

/** Compare deux chaînes (insensible à la casse / aux accents) */
function comparerTexte(
  cle: string,
  label: string,
  mutafriches: string | null | undefined,
  cartofriches: string | null | undefined,
): LigneEcart {
  // Retrait des accents (diacritiques combinants U+0300–U+036F), motif en ASCII pur
  const diacritiques = new RegExp("[\\u0300-\\u036f]", "g");
  const norm = (v: string | null | undefined): string =>
    (v ?? "").normalize("NFD").replace(diacritiques, "").trim().toUpperCase();
  const comparable = !!mutafriches && !!cartofriches;
  const ecart = comparable && norm(mutafriches) !== norm(cartofriches);
  return {
    cle,
    label,
    mutafriches: mutafriches || ABSENT,
    cartofriches: cartofriches || ABSENT,
    ecart,
    comparable,
    note: comparable ? undefined : "Valeur absente d'un des deux côtés",
  };
}

/** Compare la présence de pollution (booléen Mutafriches vs indices Cerema) */
function comparerPollution(enrich: EnrichissementOutputDto, friche: FrichesCerema): LigneEcart {
  const mutafriches = enrich.siteReferencePollue === true;

  // Cartofriches : pollution avérée si référencé Basol/Basias ou pollution du sol déclarée "oui".
  // L'absence d'info (Basol/Basias absents ET sol_pollution_existe "inconnu"/vide) N'est PAS
  // une absence de pollution : on ne compare pas dans ce cas (évite un faux écart).
  const basol = !!friche.site_numero_basol || !!friche.site_numero_basias;
  const solExiste = (friche.sol_pollution_existe ?? "").toLowerCase();
  const infoConnue = basol || solExiste === "oui" || solExiste === "non";
  const polluCf = basol || solExiste === "oui";

  const comparable = infoConnue;
  const ecart = comparable && mutafriches !== polluCf;

  return {
    cle: "siteReferencePollue",
    label: "Site référencé pollué",
    mutafriches: mutafriches ? "Oui" : "Non",
    cartofriches: infoConnue ? (polluCf ? "Oui" : "Non") : "Non renseigné",
    ecart,
    comparable,
    note: infoConnue
      ? "Basol/Basias + pollution sol côté Cartofriches"
      : "Pollution non renseignée côté Cartofriches",
  };
}

/** Compare la zone d'accélération ENR */
function comparerZaer(enrich: EnrichissementOutputDto, friche: FrichesCerema): LigneEcart {
  const mutaEnZone =
    !!enrich.zoneAccelerationEnr && enrich.zoneAccelerationEnr !== ZoneAccelerationEnr.NON;
  const cfRaw = (friche.site_zaer ?? "").toLowerCase();
  const comparable = cfRaw === "oui" || cfRaw === "non";
  const cfEnZone = cfRaw === "oui";
  const ecart = comparable && mutaEnZone !== cfEnZone;
  return {
    cle: "zoneAccelerationEnr",
    label: "Zone d'accélération ENR",
    mutafriches: mutaEnZone ? "Oui" : "Non",
    cartofriches: comparable ? (cfEnZone ? "Oui" : "Non") : friche.site_zaer || ABSENT,
    ecart,
    comparable,
    note: comparable ? undefined : "Valeur ZAER Cartofriches absente",
  };
}

/**
 * Reconstitue la catégorie Mutafriches d'ITE fret depuis les deux distances Cerema (en km).
 * Seuil : < 1 km. Priorité au bon état.
 */
export function categorieIteDepuisCerema(friche: FrichesCerema): DistanceIte {
  const bon = friche.distance_ite_bon;
  const mauvais = friche.distance_ite_mauvais;
  if (bon !== null && bon !== undefined && bon < 1) return DistanceIte.MOINS_1KM_BON_ETAT;
  if (mauvais !== null && mauvais !== undefined && mauvais < 1)
    return DistanceIte.MOINS_1KM_MAUVAIS_ETAT;
  return DistanceIte.PLUS_1KM;
}

const LABEL_ITE: Record<DistanceIte, string> = {
  [DistanceIte.MOINS_1KM_BON_ETAT]: "< 1 km, bon état",
  [DistanceIte.MOINS_1KM_MAUVAIS_ETAT]: "< 1 km, mauvais état",
  [DistanceIte.PLUS_1KM]: "> 1 km",
};

/** Marge (km) autour du seuil de 1 km en deçà de laquelle un écart est signalé comme sensible */
const MARGE_SEUIL_ITE_KM = 0.3;

/** Distance ITE la plus proche côté Cerema (min des deux volets renseignés) */
function distanceIteMinCerema(friche: FrichesCerema): number | null {
  const distances = [friche.distance_ite_bon, friche.distance_ite_mauvais].filter(
    (d): d is number => d !== null && d !== undefined,
  );
  return distances.length > 0 ? Math.min(...distances) : null;
}

/** Compare la distance à une ITE fret (sujet d'écart principal) */
function comparerIte(enrich: EnrichissementOutputDto, friche: FrichesCerema): LigneEcart {
  const mutaCat = enrich.distanceIte;
  const cfCat = categorieIteDepuisCerema(friche);
  const comparable = !!mutaCat;
  const ecart = comparable && mutaCat !== cfCat;
  const detailCf = `bon: ${fmtNombre(friche.distance_ite_bon, " km")} / mauvais: ${fmtNombre(
    friche.distance_ite_mauvais,
    " km",
  )}`;

  // Note enrichie quand l'écart tient à une distance Cerema proche du seuil de 1 km
  let note = "Catégorie reconstituée depuis les distances Cerema (seuil 1 km)";
  const distMin = distanceIteMinCerema(friche);
  if (ecart && distMin !== null && Math.abs(distMin - 1) <= MARGE_SEUIL_ITE_KM) {
    note = `Distance Cerema (${fmtNombre(distMin, " km")}) proche du seuil de 1 km — écart sensible au point de mesure`;
  }

  // Anomalie Cartofriches : sa fiche (texte de la modale) arrondit la distance au km et
  // affiche « moins d'1 km » lorsque la distance arrondit à 1, alors que sa donnée API
  // dépasse 1 km. Détecté quand la distance la plus proche est dans ]1 km ; 1,5 km[.
  let warning: string | undefined;
  if (distMin !== null && distMin > 1 && Math.round(distMin) <= 1) {
    warning =
      `Anomalie Cartofriches : sa donnée API indique ${fmtNombre(distMin, " km")} (> 1 km), ` +
      `mais sa fiche affiche « moins d'1 km » (distance arrondie à 1 km). Cartofriches se contredit.`;
  }

  return {
    cle: "distanceIte",
    label: "Distance ITE fret",
    mutafriches: mutaCat ? LABEL_ITE[mutaCat] : ABSENT,
    cartofriches: `${LABEL_ITE[cfCat]} (${detailCf})`,
    ecart,
    comparable,
    note,
    warning,
  };
}

/**
 * Compare un enrichissement Mutafriches aux données sources Cartofriches.
 * Retourne une ligne par champ comparé (vide si la friche n'a pas été trouvée).
 */
export function comparerSites(
  enrich: EnrichissementOutputDto,
  friche: FrichesCerema | null,
): LigneEcart[] {
  if (!friche) return [];

  return [
    comparerSurface(
      "surfaceSite",
      "Surface du site",
      enrich.surfaceSite,
      friche.unite_fonciere_surface,
    ),
    comparerSurface("surfaceBati", "Surface bâtie", enrich.surfaceBati, friche.bati_surface),
    comparerTexte("codeInsee", "Code INSEE", enrich.codeInsee, friche.comm_insee),
    comparerTexte("commune", "Commune", enrich.commune, friche.comm_nom),
    comparerPollution(enrich, friche),
    comparerZaer(enrich, friche),
    comparerIte(enrich, friche),
  ];
}

/** Nombre d'écarts réels (champs comparables qui divergent) */
export function compterEcarts(lignes: LigneEcart[]): number {
  return lignes.filter((l) => l.comparable && l.ecart).length;
}

/** Indice de mutabilité Cartofriches s'il est présent (souvent null en accès libre) */
export function scoreCartofriches(friche: FrichesCerema | null): string {
  if (!friche) return ABSENT;
  const scores = [
    friche.p_residentiel,
    friche.p_equipement,
    friche.p_culturel,
    friche.p_tertiaire,
    friche.p_industriel,
    friche.p_renaturation,
    friche.p_pv,
  ];
  return scores.some((s) => s !== null && s !== undefined)
    ? scores.map((s) => fmtNombre(s)).join(" / ")
    : "non calculé (beta)";
}
