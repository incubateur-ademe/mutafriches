# NB : on bypasse pnpm au runtime — voir README "Bypass de pnpm au runtime (pnpm >= 10.16)".
# Shims .bin directs, jamais préfixés par `node`. drizzle-kit est en dependencies (non pruné).
postdeploy: cd apps/api && ./node_modules/.bin/drizzle-kit migrate
web: node apps/api/dist/src/main