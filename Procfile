# NB : on bypasse pnpm au runtime — voir README "Bypass de pnpm au runtime (pnpm >= 10.16)".
# Shims .bin directs, jamais préfixés par `node`. drizzle-kit est en dependencies (non pruné).
# import-all importe les référentiels dont la table est vide (ADR-0050) ; un échec ne bloque pas le déploiement.
# peupler-attributaire remplit la table attributaire si vide, sinon recalcule les lignes d'une ancienne version d'algo (ADR-0053).
postdeploy: cd apps/api && ./node_modules/.bin/drizzle-kit migrate && node dist/src/scripts/import-all.js && node dist/src/scripts/peupler-attributaire.js --si-necessaire
web: node apps/api/dist/src/main