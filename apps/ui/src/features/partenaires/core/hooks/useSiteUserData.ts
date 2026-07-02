import { useMemo, useRef } from "react";
import type { MutabiliteOutputDto } from "@mutafriches/shared-types";

// Persistance locale (par utilisateur) de la saisie « Connaissance terrain » et de la
// mutabilité associée, par site (idtup). Propre à l'appareil/navigateur — cf. ADR-0021.

const STORAGE_VERSION = 1;

interface SiteUserData {
  manualData: Record<string, string>;
  mutability: MutabiliteOutputDto | null;
  /** La qualification (enrichissement) a été lancée et terminée pour ce site. */
  qualified?: boolean;
}

interface StoredPayload {
  version: number;
  sites: Record<string, SiteUserData>;
}

const storageKeyFor = (base: string): string => `${base}-userdata`;

function load(base: string): Map<string, SiteUserData> {
  try {
    const raw = localStorage.getItem(storageKeyFor(base));
    if (!raw) return new Map();
    const payload = JSON.parse(raw) as StoredPayload;
    if (payload.version !== STORAGE_VERSION || typeof payload.sites !== "object") return new Map();
    return new Map(Object.entries(payload.sites));
  } catch {
    return new Map();
  }
}

function save(base: string, map: Map<string, SiteUserData>): void {
  try {
    const payload: StoredPayload = { version: STORAGE_VERSION, sites: Object.fromEntries(map) };
    localStorage.setItem(storageKeyFor(base), JSON.stringify(payload));
  } catch {
    // Quota dépassé ou storage indisponible : on ignore.
  }
}

export interface SiteUserDataStore {
  getManualData(idtup: string): Record<string, string>;
  setManualData(idtup: string, data: Record<string, string>): void;
  getMutability(idtup: string): MutabiliteOutputDto | null;
  setMutability(idtup: string, data: MutabiliteOutputDto): void;
  clearMutability(idtup: string): void;
  remove(idtup: string): void;
  /** Marque la qualification (enrichissement) comme terminée pour ce site. */
  markQualified(idtup: string): void;
  /** idtups dont la qualification a tourné (simple check). */
  qualifiedIds(): Set<string>;
  /** idtups ayant une mutabilité calculée (double check). */
  evaluatedIds(): Set<string>;
}

const aUneSaisie = (data: Record<string, string>): boolean =>
  Object.values(data).some((v) => v && v !== "");

// Un site est « qualifié » si l'enrichissement a tourné, ou s'il porte déjà une
// saisie / une mutabilité (compatibilité avec les données déjà en localStorage).
const estQualifie = (d: SiteUserData): boolean =>
  Boolean(d.qualified) || aUneSaisie(d.manualData) || Boolean(d.mutability);

export function useSiteUserData(storageKey: string): SiteUserDataStore {
  const mapRef = useRef<Map<string, SiteUserData> | null>(null);
  if (mapRef.current === null) mapRef.current = load(storageKey);

  return useMemo<SiteUserDataStore>(() => {
    const map = () => mapRef.current as Map<string, SiteUserData>;
    const entry = (idtup: string): SiteUserData =>
      map().get(idtup) ?? { manualData: {}, mutability: null };
    const persist = () => save(storageKey, map());

    return {
      getManualData: (idtup) => entry(idtup).manualData,
      setManualData: (idtup, data) => {
        map().set(idtup, { ...entry(idtup), manualData: data });
        persist();
      },
      getMutability: (idtup) => entry(idtup).mutability,
      setMutability: (idtup, data) => {
        map().set(idtup, { ...entry(idtup), mutability: data });
        persist();
      },
      clearMutability: (idtup) => {
        const e = map().get(idtup);
        if (e?.mutability) {
          map().set(idtup, { ...e, mutability: null });
          persist();
        }
      },
      remove: (idtup) => {
        map().delete(idtup);
        persist();
      },
      markQualified: (idtup) => {
        const e = entry(idtup);
        if (!e.qualified) {
          map().set(idtup, { ...e, qualified: true });
          persist();
        }
      },
      qualifiedIds: () => {
        const set = new Set<string>();
        for (const [idtup, d] of map()) {
          if (estQualifie(d)) set.add(idtup);
        }
        return set;
      },
      evaluatedIds: () => {
        const set = new Set<string>();
        for (const [idtup, d] of map()) {
          if (d.mutability) set.add(idtup);
        }
        return set;
      },
    };
  }, [storageKey]);
}
