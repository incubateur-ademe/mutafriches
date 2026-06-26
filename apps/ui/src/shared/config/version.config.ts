/**
 * Version de l'application Mutafriches.
 *
 * Injectée au build par Vite (`define`) depuis le `package.json` racine du monorepo,
 * source unique partagée avec l'API (endpoint `/health`). Aucun appel réseau requis.
 */
export const APP_VERSION = __APP_VERSION__;
