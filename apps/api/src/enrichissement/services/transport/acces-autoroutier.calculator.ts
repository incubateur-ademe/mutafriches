import { IgnWfsTronconRoute } from "../../adapters/ign-wfs/ign-wfs.types";
import { calculateDistance } from "../../adapters/shared/distance.utils";

export interface EntreeAutoroutiere {
  longitude: number;
  latitude: number;
  distanceVolOiseauMetres: number;
}

interface Arc {
  de: number[];
  vers: number[];
  estBretelle: boolean;
}

const NATURE_AUTOROUTE = "Type autoroutier";
const NATURE_BRETELLE = "Bretelle";
// Une chaîne de bretelles dépasse rarement quelques tronçons ; borne de sécurité anti-cycle.
const LONGUEUR_MAX_CHAINE = 20;

// Nœuds du graphe BD TOPO : les tronçons connectés partagent exactement leurs sommets.
const cle = (c: number[]): string => `${c[0].toFixed(6)},${c[1].toFixed(6)}`;

/**
 * Points d'entrée sur le réseau autoroutier (autoroutes et voies express BD TOPO) :
 * tête de chaque bretelle qui rejoint une chaussée autoroutière, et origine des chaussées
 * qui commencent sans bretelle (autoroute débouchant sur un giratoire). Cf. ADR-0047.
 */
export class AccesAutoroutierCalculator {
  static extraireEntrees(
    troncons: IgnWfsTronconRoute[],
    site: { latitude: number; longitude: number },
    rayonMetres: number,
  ): EntreeAutoroutiere[] {
    const arcs = troncons.flatMap((t) => AccesAutoroutierCalculator.versArcs(t));

    const sommetsAutoroute = new Set<string>();
    for (const t of troncons) {
      if (t.properties.nature !== NATURE_AUTOROUTE) continue;
      for (const c of t.geometry.coordinates) sommetsAutoroute.add(cle(c));
    }

    const arrivees = new Set(arcs.map((a) => cle(a.vers)));
    const bretellesParArrivee = new Map<string, Arc[]>();
    for (const arc of arcs) {
      if (!arc.estBretelle) continue;
      const k = cle(arc.vers);
      bretellesParArrivee.set(k, [...(bretellesParArrivee.get(k) ?? []), arc]);
    }

    const entrees = new Map<string, number[]>();

    for (const arc of arcs) {
      if (arc.estBretelle) {
        // Bretelle d'insertion : on remonte la chaîne jusqu'au réseau local
        if (!sommetsAutoroute.has(cle(arc.vers)) || sommetsAutoroute.has(cle(arc.de))) continue;
        const tete = AccesAutoroutierCalculator.remonterChaine(
          arc.de,
          bretellesParArrivee,
          sommetsAutoroute,
        );
        entrees.set(cle(tete), tete);
      } else if (!arrivees.has(cle(arc.de))) {
        // Chaussée sans amont connu : début d'autoroute accessible depuis le réseau local
        entrees.set(cle(arc.de), arc.de);
      }
    }

    return (
      [...entrees.values()]
        .map(([longitude, latitude]) => ({
          longitude,
          latitude,
          distanceVolOiseauMetres: calculateDistance(
            site.latitude,
            site.longitude,
            latitude,
            longitude,
          ),
        }))
        // Au-delà du rayon, l'amont d'un nœud peut manquer : faux début de chaussée
        .filter((e) => e.distanceVolOiseauMetres <= rayonMetres)
        .sort((a, b) => a.distanceVolOiseauMetres - b.distanceVolOiseauMetres)
    );
  }

  private static versArcs(troncon: IgnWfsTronconRoute): Arc[] {
    const { nature, sens_de_circulation: sens } = troncon.properties;
    if (nature !== NATURE_AUTOROUTE && nature !== NATURE_BRETELLE) return [];

    const coords = troncon.geometry.coordinates;
    const premier = coords[0];
    const dernier = coords[coords.length - 1];
    const estBretelle = nature === NATURE_BRETELLE;

    if (sens === "Sens direct") return [{ de: premier, vers: dernier, estBretelle }];
    if (sens === "Sens inverse") return [{ de: dernier, vers: premier, estBretelle }];
    return [
      { de: premier, vers: dernier, estBretelle },
      { de: dernier, vers: premier, estBretelle },
    ];
  }

  private static remonterChaine(
    depart: number[],
    bretellesParArrivee: Map<string, Arc[]>,
    sommetsAutoroute: Set<string>,
  ): number[] {
    let courant = depart;
    const vus = new Set<string>([cle(courant)]);

    for (let i = 0; i < LONGUEUR_MAX_CHAINE; i++) {
      const amont = (bretellesParArrivee.get(cle(courant)) ?? []).filter(
        (a) => !sommetsAutoroute.has(cle(a.de)),
      );
      // Plusieurs bretelles convergent : ce nœud est déjà un carrefour du réseau local
      if (amont.length !== 1 || vus.has(cle(amont[0].de))) break;
      courant = amont[0].de;
      vus.add(cle(courant));
    }

    return courant;
  }
}
