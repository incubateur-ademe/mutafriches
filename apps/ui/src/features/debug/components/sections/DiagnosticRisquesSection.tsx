import React, { useState } from "react";
import type { EnrichissementOutputDto } from "@mutafriches/shared-types";

// TODO: supprimer après analyse

/** Clés des 13 APIs GeoRisques dans l'ordre d'affichage */
const GEORISQUES_APIS = [
  { key: "rga", label: "RGA (Retrait-Gonflement Argiles)", exploite: "naturel" },
  { key: "cavites", label: "Cavités souterraines", exploite: "naturel" },
  { key: "sis", label: "SIS (Secteurs d'Information sur les Sols)", exploite: "techno" },
  { key: "icpe", label: "ICPE (Installations Classées)", exploite: "techno" },
  { key: "catnat", label: "CATNAT (Catastrophes Naturelles)", exploite: null },
  { key: "zonageSismique", label: "Zonage sismique", exploite: null },
  { key: "mvt", label: "MVT (Mouvements de Terrain)", exploite: null },
  { key: "tri", label: "TRI (Territoires à Risques d'Inondation)", exploite: null },
  { key: "triZonage", label: "TRI Zonage", exploite: null },
  { key: "azi", label: "AZI (Atlas Zones Inondables)", exploite: null },
  { key: "papi", label: "PAPI (Programmes Prévention Inondations)", exploite: null },
  { key: "ppr", label: "PPR (Plans de Prévention des Risques)", exploite: null },
  { key: "old", label: "OLD (Obligations Débroussaillement)", exploite: null },
] as const;

interface DiagnosticRisquesSectionProps {
  enrichmentData?: EnrichissementOutputDto;
}

/**
 * Retourne un résumé lisible pour une API GeoRisques
 */
function getApiSummary(key: string, data: Record<string, unknown>): string {
  switch (key) {
    case "rga": {
      const alea = data.alea as string | undefined;
      const code = data.codeExposition as string | undefined;
      return `Aléa : ${alea ?? "?"} (code ${code ?? "?"})`;
    }
    case "cavites": {
      const n = data.nombreCavites as number | undefined;
      const dist = data.distancePlusProche as number | undefined;
      const types = data.typesCavites as string[] | undefined;
      const parts = [`${n ?? 0} cavité(s)`];
      if (dist != null) parts.push(`plus proche : ${Math.round(dist)} m`);
      if (types?.length) parts.push(`types : ${types.join(", ")}`);
      return parts.join(" | ");
    }
    case "sis": {
      const n = data.nombreSis as number | undefined;
      const presence = data.presenceSis as boolean | undefined;
      return presence ? `${n ?? "?"} SIS trouvé(s)` : "Aucun SIS";
    }
    case "icpe": {
      const n = data.nombreIcpe as number | undefined;
      const dist = data.distancePlusProche as number | undefined;
      const seveso = data.presenceSeveso as boolean | undefined;
      const pn = data.presencePrioriteNationale as boolean | undefined;
      const parts = [`${n ?? 0} ICPE`];
      if (dist != null) parts.push(`plus proche : ${Math.round(dist)} m`);
      if (seveso) parts.push("SEVESO");
      if (pn) parts.push("Priorité nationale");
      return parts.join(" | ");
    }
    case "catnat": {
      const n = data.nombreEvenements as number | undefined;
      const types = data.typesRisques as string[] | undefined;
      if (!n) return "Aucun événement";
      const parts = [`${n} événement(s)`];
      if (types?.length) parts.push(types.join(", "));
      return parts.join(" | ");
    }
    case "zonageSismique": {
      const zone = data.codeZone as string | undefined;
      const libelle = data.libelle as string | undefined;
      return `Zone ${zone ?? "?"} : ${libelle ?? "?"}`;
    }
    case "mvt": {
      const n = data.nombreMouvements as number | undefined;
      const types = data.typesMouvements as string[] | undefined;
      if (!n) return "Aucun mouvement";
      const parts = [`${n} mouvement(s)`];
      if (types?.length) parts.push(types.join(", "));
      return parts.join(" | ");
    }
    case "tri": {
      const n = data.nombreTri as number | undefined;
      const risques = data.risquesUniques as string[] | undefined;
      if (!n) return "Aucun TRI";
      const parts = [`${n} TRI`];
      if (risques?.length) parts.push(risques.join(", "));
      return parts.join(" | ");
    }
    case "triZonage": {
      const n = data.nombreTri as number | undefined;
      const types = data.typesInondation as string[] | undefined;
      if (!n) return "Aucun TRI zonage";
      const parts = [`${n} TRI zonage`];
      if (types?.length) parts.push(types.join(", "));
      return parts.join(" | ");
    }
    case "azi": {
      const n = data.nombreAzi as number | undefined;
      if (!n) return "Aucun AZI";
      return `${n} AZI`;
    }
    case "papi": {
      const n = data.nombrePapi as number | undefined;
      const enCours = data.papiEnCours as number | undefined;
      if (!n) return "Aucun PAPI";
      return `${n} PAPI (${enCours ?? 0} en cours)`;
    }
    case "ppr": {
      const n = data.nombrePpr as number | undefined;
      const actifs = data.pprActifs as number | undefined;
      const types = data.typesRisquesUniques as string[] | undefined;
      if (!n) return "Aucun PPR";
      const parts = [`${n} PPR (${actifs ?? 0} actifs)`];
      if (types?.length) parts.push(types.join(", "));
      return parts.join(" | ");
    }
    case "old": {
      const expo = data.exposition as boolean | undefined;
      const commune = data.commune as string | undefined;
      return expo ? `Obligation : Oui (${commune ?? ""})` : "Pas d'obligation";
    }
    default:
      return "Données disponibles";
  }
}

/**
 * Retourne true si l'API a des résultats significatifs (exposition/présence)
 */
function hasExposition(data: Record<string, unknown>): boolean {
  if ("exposition" in data) return data.exposition === true;
  if ("presenceSis" in data) return data.presenceSis === true;
  if ("presenceIcpe" in data) return data.presenceIcpe === true;
  return false;
}

export const DiagnosticRisquesSection: React.FC<DiagnosticRisquesSectionProps> = ({
  enrichmentData,
}) => {
  const [expandedApis, setExpandedApis] = useState<Set<string>>(new Set());

  const risques = enrichmentData?.risquesGeorisques as Record<string, unknown> | undefined;

  if (!enrichmentData || !risques) {
    return (
      <details className="debug-panel__section">
        <summary>Diagnostic risques</summary>
        <div className="debug-panel__section-content">
          <p className="fr-text--sm">Données GeoRisques non disponibles.</p>
        </div>
      </details>
    );
  }

  const metadata = risques.metadata as {
    sourcesUtilisees: string[];
    sourcesEchouees: string[];
    fiabilite: number;
  } | undefined;

  const toggleExpand = (key: string) => {
    setExpandedApis((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <details className="debug-panel__section">
      <summary>Diagnostic risques</summary>
      <div className="debug-panel__section-content">
        {/* Résumé exploitation */}
        <h4 className="debug-panel__subtitle">
          Données exploitées par l'algorithme
        </h4>
        <dl className="debug-panel__data-grid">
          <dt>Risques naturels (final)</dt>
          <dd>
            <span
              className={`fr-badge fr-badge--sm ${
                enrichmentData.presenceRisquesNaturels === "fort"
                  ? "fr-badge--error"
                  : enrichmentData.presenceRisquesNaturels === "moyen"
                    ? "fr-badge--warning"
                    : "fr-badge--success"
              }`}
            >
              {enrichmentData.presenceRisquesNaturels ?? "Non disponible"}
            </span>
          </dd>
          <dt>Risques technologiques (final)</dt>
          <dd>
            <span
              className={`fr-badge fr-badge--sm ${
                enrichmentData.presenceRisquesTechnologiques
                  ? "fr-badge--error"
                  : "fr-badge--success"
              }`}
            >
              {enrichmentData.presenceRisquesTechnologiques ? "Oui" : "Non"}
            </span>
          </dd>
        </dl>

        {/* Fiabilité GeoRisques */}
        {metadata && (
          <div className="diag-risques__fiabilite">
            <span className="fr-text--xs">
              APIs GeoRisques : {metadata.sourcesUtilisees.length}/13 OK
              {metadata.sourcesEchouees.length > 0 && (
                <>, {metadata.sourcesEchouees.length} en échec</>
              )}
            </span>
          </div>
        )}

        {/* Tableau des 13 APIs */}
        <h4 className="debug-panel__subtitle">
          Détail des 13 APIs GeoRisques
        </h4>
        <table className="debug-panel__usage-table diag-risques__table">
          <thead>
            <tr>
              <th>API</th>
              <th>Statut</th>
              <th>Résumé</th>
              <th>Utilisé</th>
            </tr>
          </thead>
          <tbody>
            {GEORISQUES_APIS.map(({ key, label, exploite }) => {
              const apiData = risques[key] as Record<string, unknown> | undefined;
              const isExpanded = expandedApis.has(key);
              const expo = apiData ? hasExposition(apiData) : false;

              return (
                <React.Fragment key={key}>
                  <tr
                    className={`diag-risques__row ${expo ? "diag-risques__row--alerte" : ""}`}
                  >
                    <td className="diag-risques__api-name">
                      <button
                        type="button"
                        className="diag-risques__expand-btn"
                        onClick={() => apiData && toggleExpand(key)}
                        disabled={!apiData}
                        title={apiData ? "Voir le détail JSON" : "Pas de données"}
                      >
                        <span style={{ fontSize: "0.625rem", marginRight: "0.25rem" }}>
                          {isExpanded ? "\u25BC" : "\u25B6"}
                        </span>
                        {label}
                      </button>
                    </td>
                    <td>
                      {apiData ? (
                        <span className={`fr-badge fr-badge--sm ${expo ? "fr-badge--warning" : "fr-badge--success"}`}>
                          {expo ? "Exposé" : "OK"}
                        </span>
                      ) : (
                        <span className="fr-badge fr-badge--sm fr-badge--error">
                          Échec
                        </span>
                      )}
                    </td>
                    <td className="diag-risques__summary">
                      {apiData
                        ? getApiSummary(key, apiData)
                        : "Non disponible"}
                    </td>
                    <td className="diag-risques__exploite">
                      {exploite === "naturel" ? (
                        <span className="fr-badge fr-badge--sm fr-badge--blue-ecume">
                          Naturel
                        </span>
                      ) : exploite === "techno" ? (
                        <span className="fr-badge fr-badge--sm fr-badge--purple-glycine">
                          Techno
                        </span>
                      ) : (
                        <span className="fr-text--xs" style={{ color: "#999" }}>Non exploité</span>
                      )}
                    </td>
                  </tr>
                  {/* Détail JSON expandable */}
                  {isExpanded && apiData && (
                    <tr>
                      <td colSpan={4}>
                        <pre className="debug-panel__json">
                          {JSON.stringify(apiData, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );
};
