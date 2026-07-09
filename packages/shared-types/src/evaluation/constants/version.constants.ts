/**
 * Version courante de l'algorithme de mutabilité (format `vX.Y`).
 *
 * Miroir cross-package de `VERSION_COURANTE` (registre `apps/api`, source de vérité).
 * L'UI l'utilise pour taguer le résultat renvoyé aux intégrateurs via l'iframe : elle ne
 * peut pas importer le registre `apps/api`. Un garde-fou côté API (`versions.spec.ts`)
 * casse si cette valeur diverge de `VERSION_COURANTE`.
 */
export const VERSION_ALGO = "v1.10";
