import { useCallback, useEffect, useState } from "react";
import { isValidParcelId, normalizeParcelId } from "@mutafriches/shared-types";
import type { PartnerSite } from "../types";

const STORAGE_VERSION = 1;

export const CUSTOM_COMMUNE_LABEL = "Ajouts personnalisés";

interface StoredPayload {
  version: number;
  sites: PartnerSite[];
}

function loadFromStorage(storageKey: string): PartnerSite[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredPayload;
    if (parsed?.version !== STORAGE_VERSION || !Array.isArray(parsed.sites)) {
      return [];
    }
    return parsed.sites.filter(
      (s) =>
        typeof s?.idtup === "string" &&
        typeof s?.commune === "string" &&
        Array.isArray(s.parcelles) &&
        s.parcelles.every((p) => typeof p === "string"),
    );
  } catch {
    return [];
  }
}

function saveToStorage(storageKey: string, sites: PartnerSite[]): void {
  try {
    const payload: StoredPayload = { version: STORAGE_VERSION, sites };
    localStorage.setItem(storageKey, JSON.stringify(payload));
  } catch {
    // Quota dépassé ou storage indisponible : on ignore
  }
}

export interface AddSiteResult {
  added: PartnerSite | null;
  invalidIdpars: string[];
}

export function useCustomSites(storageKey: string) {
  const [customSites, setCustomSites] = useState<PartnerSite[]>(() => loadFromStorage(storageKey));

  useEffect(() => {
    saveToStorage(storageKey, customSites);
  }, [storageKey, customSites]);

  const addSite = useCallback((rawIdpars: string[]): AddSiteResult => {
    const cleaned = Array.from(new Set(rawIdpars.map((s) => s.trim()).filter((s) => s.length > 0)));

    const invalid: string[] = [];
    const valid: string[] = [];
    for (const id of cleaned) {
      if (isValidParcelId(id)) {
        valid.push(normalizeParcelId(id));
      } else {
        invalid.push(id);
      }
    }

    if (valid.length === 0) {
      return { added: null, invalidIdpars: invalid };
    }

    const idtup = valid.length === 1 ? valid[0] : `custom-${Date.now().toString(36)}`;
    const newSite: PartnerSite = {
      idtup,
      commune: CUSTOM_COMMUNE_LABEL,
      parcelles: valid,
    };

    setCustomSites((prev) => [...prev, newSite]);
    return { added: newSite, invalidIdpars: invalid };
  }, []);

  const removeSite = useCallback((idtup: string) => {
    setCustomSites((prev) => prev.filter((s) => s.idtup !== idtup));
  }, []);

  const clearAll = useCallback(() => {
    setCustomSites([]);
  }, []);

  return { customSites, addSite, removeSite, clearAll };
}
