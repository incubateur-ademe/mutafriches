-- Reclasse en API_DIRECTE les appels d'origine tierce enregistrés à tort en IFRAME_INTEGREE
-- avant le correctif de septembre 2026 (OrigineDetectionService).
-- Enrichissements et sites : l'UI n'a jamais posé iframe=true sur /enrichissement, donc un
-- intégrateur au format hôte ne peut venir que d'un Origin tiers.
UPDATE "enrichissements" SET "source_utilisation" = 'API_DIRECTE' WHERE "source_utilisation" = 'IFRAME_INTEGREE' AND "integrateur" LIKE '%.%';
--> statement-breakpoint
UPDATE "sites" SET "source_utilisation" = 'API_DIRECTE' WHERE "source_utilisation" = 'IFRAME_INTEGREE' AND "integrateur" LIKE '%.%';
--> statement-breakpoint
-- Évaluations : l'iframe peut aussi enregistrer un hôte (domaine parent), d'où une liste
-- explicite d'intégrateurs vérifiés en prod sans aucun événement iframe (2026-09-25).
UPDATE "evaluations" SET "source_utilisation" = 'API_DIRECTE' WHERE "source_utilisation" = 'IFRAME_INTEGREE' AND "integrateur" IN ('www.aurangevine.org', 'www.indre.gouv.fr');
