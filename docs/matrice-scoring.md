# Matrice de scoring de l'algorithme

> Version de l'algorithme : **v1.19** (2026-10-07) — 32 critères, poids total 34, 7 usages, 2 règles d'exclusion.
> Fichier **généré** depuis `MATRICE_SCORING`, `POIDS_CRITERES` et `REGLES_EXCLUSION` (`apps/api/src/evaluation/services/algorithme/`) : ne pas l'éditer à la main. Régénérer avec `pnpm docs:matrice:gen` ; `pnpm test` échoue s'il diverge du code. Méthode de calcul : [evaluation-mutabilite.md](evaluation-mutabilite.md).

## Lecture

| Symbole | Impact | Points (avant pondération) |
|:-:|---|:-:|
| ++ | Très positif | +2 |
| + | Positif | +1 |
| 0 | Neutre | +0.5 en avantages **et** en contraintes |
| − | Négatif | −1 |
| −− | Très négatif | −2 |

- Points pondérés = score × poids du critère. Indice d'un usage = avantages / (avantages + contraintes) × 100.
- « Ne sait pas » n'a pas de ligne : la réponse est ignorée (ni avantage, ni contrainte) et ne compte pas dans la fiabilité.
- Colonne « Évolution » : version d'ajout du critère et versions où ses scores ont changé ; seules les modifications de scores depuis v1.12 sont détaillées, en gras. « v1.1 » : critère présent depuis l'origine.
- Une valeur qui n'a pas de ligne ci-dessous (ex. parc naturel régional, monument historique) n'est pas scorée : le critère est ignoré pour cet usage.
- Tranches : s = surface, d = distance, t = taux ; les bornes inclusives ou exclusives sont explicites (≤ ou <).
- « Locaux d'activité » correspond à l'usage `tertiaire` dans l'API, l'export CNIG et Metabase.

## Critères enrichis automatiquement (22, poids 22.5)

| Critère | Poids | Évolution | Réponse | Résidentiel | Équipements | Culture | Locaux d'activité | Industrie | Renaturation | Photovoltaïque |
|---|:-:|---|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| **Surface du site (m²)** | 2 | v1.1 ; modif. **v1.17** | < 10 000 | + | + | 0 | + | −− | 0 | −− |
|  |  |  | 10 000 ≤ s < 15 000 | − | − | 0 | + | + | 0 | −− |
|  |  |  | 15 000 ≤ s ≤ 50 000 | − | − | 0 | 0 | + | 0 | + |
|  |  |  | > 50 000 | − | − | 0 | 0 | ++ | 0 | ++ |
| **Emprise au sol du bâti (m²)** | 2 | v1.1 | < 5 000 ou pas de bâti | + | 0 | 0 | 0 | −− | + | + |
|  |  |  | 5 000 ≤ s ≤ 10 000 | + | 0 | 0 | 0 | − | 0 | 0 |
|  |  |  | > 10 000 | − | 0 | 0 | 0 | + | − | − |
| **En centre-ville ou centre-bourg** | 1 | v1.1 ; modif. **v1.17** | Oui | ++ | + | 0 | 0 | −− | 0 | −− |
|  |  |  | Non | −− | − | 0 | + | ++ | + | + |
| **Distance par la route à l'accès autoroutier** | 0.5 | v1.1 | < 1 km | 0 | 0 | 0 | 0 | ++ | 0 | − |
|  |  |  | 1 ≤ d < 2 km | 0 | 0 | 0 | 0 | + | 0 | + |
|  |  |  | 2 ≤ d < 5 km | 0 | 0 | 0 | 0 | − | 0 | + |
|  |  |  | ≥ 5 km (ou aucun à moins de 50 km) | 0 | 0 | 0 | 0 | −− | 0 | − |
| **Distance aux transports en commun** | 1 | v1.1 | < 500 m | + | + | + | + | + | 0 | 0 |
|  |  |  | ≥ 500 m | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **Commerces et services à proximité** | 1 | v1.1 ; modif. **v1.17** | Oui | ++ | ++ | 0 | + | 0 | 0 | − |
|  |  |  | Non | − | − | 0 | 0 | 0 | 0 | 0 |
| **Distance au raccordement électrique** | 1 | v1.1 | < 1 km | 0 | 0 | 0 | 0 | 0 | 0 | ++ |
|  |  |  | 1 ≤ d < 5 km | 0 | 0 | 0 | 0 | 0 | 0 | − |
|  |  |  | ≥ 5 km (ou aucune infrastructure trouvée) | 0 | 0 | 0 | 0 | 0 | 0 | −− |
| **Distance au réseau de chaleur** | 1 | ajout **v1.13** | < 500 m | ++ | ++ | ++ | + | 0 | 0 | 0 |
|  |  |  | ≥ 500 m (ou aucun réseau) | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **Taux de logements vacants (%)** | 1 | v1.1 | ≤ 7 % | ++ | 0 | 0 | 0 | 0 | 0 | 0 |
|  |  |  | 7 < t ≤ 8 % | + | 0 | 0 | 0 | 0 | 0 | 0 |
|  |  |  | 8 < t ≤ 10 % | − | 0 | 0 | 0 | 0 | 0 | 0 |
|  |  |  | > 10 % | −− | 0 | 0 | 0 | 0 | 0 | 0 |
| **Risque retrait-gonflement des argiles** | 0.5 | ajout v1.4 | Aucun | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
|  |  |  | Faible ou moyen | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
|  |  |  | Fort | − | − | − | − | − | + | 0 |
| **Risque cavités souterraines** | 0.5 | ajout v1.4 | Non | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
|  |  |  | Oui | − | − | − | − | − | + | 0 |
| **Risque inondation** | 1 | ajout v1.4 | Non | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
|  |  |  | Oui | −− | −− | − | − | −− | ++ | − |
| **Risques technologiques** | 1 | v1.1 | Oui | −− | −− | −− | −− | + | + | + |
|  |  |  | Non | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **Zonage réglementaire (PLU)** | 2 | v1.1 | Zone urbaine (U) | ++ | ++ | + | + | 0 | 0 | − |
|  |  |  | Zone urbaine - habitat | ++ | + | + | 0 | −− | 0 | − |
|  |  |  | Zone urbaine - équipement | −− | ++ | + | 0 | −− | 0 | 0 |
|  |  |  | Zone urbaine - activité | −− | − | − | + | ++ | 0 | 0 |
|  |  |  | Zone à urbaniser (AU) | + | + | 0 | + | 0 | 0 | − |
|  |  |  | Zone à vocation d'activités | −− | − | − | + | ++ | − | 0 |
|  |  |  | Secteur ouvert à la construction | + | + | + | + | + | − | − |
|  |  |  | Secteur non ouvert à la construction | −− | − | − | −− | −− | ++ | 0 |
|  |  |  | Secteur avec règlement d'urbanisme | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
|  |  |  | Zone agricole (A) | −− | − | − | −− | −− | ++ | 0 |
|  |  |  | Zone naturelle (N) | −− | − | − | −− | −− | ++ | 0 |
| **Zonage environnemental** | 1 | v1.1 | Hors zone | + | + | + | + | + | 0 | + |
|  |  |  | Natura 2000 | − | − | − | − | − | + | − |
|  |  |  | ZNIEFF type 1 / 2 | − | − | − | − | − | + | − |
|  |  |  | Réserve naturelle | −− | −− | −− | −− | −− | ++ | −− |
|  |  |  | À proximité d'une zone protégée | 0 | 0 | 0 | 0 | 0 | + | 0 |
| **Zonage patrimonial** | 1 | v1.1 | Non concerné | + | + | 0 | + | + | + | + |
|  |  |  | Site inscrit / classé | 0 | − | ++ | −− | −− | −− | −− |
|  |  |  | Périmètre ABF | 0 | − | ++ | − | − | 0 | − |
| **Zone d'accélération des EnR (ZAER)** | 1 | ajout v1.3 ; modif. **v1.12** | Non | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
|  |  |  | Oui | 0 | 0 | 0 | 0 | 0 | 0 | + |
|  |  |  | Oui - PV ombrière | 0 | 0 | 0 | 0 | 0 | 0 | ++ |
|  |  |  | Exclu des zones d'accélération ENR | 0 | 0 | 0 | 0 | 0 | 0 | −− |
| **Zonage ABC (tension du logement)** | 0.5 | ajout v1.7 | Zone A bis | ++ | 0 | 0 | 0 | 0 | 0 | 0 |
|  |  |  | Zone A | ++ | 0 | 0 | 0 | 0 | 0 | 0 |
|  |  |  | Zone B1 | + | 0 | 0 | 0 | 0 | 0 | 0 |
|  |  |  | Zone B2 | + | 0 | 0 | 0 | 0 | 0 | 0 |
|  |  |  | Zone C | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **Distance à une ITE fret** | 0.5 | ajout v1.8 | Moins d'1 km, en bon état | 0 | 0 | 0 | 0 | ++ | 0 | 0 |
|  |  |  | Moins d'1 km, en mauvais état | 0 | 0 | 0 | 0 | + | 0 | 0 |
|  |  |  | Plus d'1 km | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **Quartier prioritaire de la ville (QPV)** | 1 | ajout **v1.14** | Oui | ++ | ++ | 0 | −− | 0 | 0 | − |
|  |  |  | Non | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **Saturation du réseau électrique pour les EnR** | 1 | ajout **v1.15** | Oui | 0 | 0 | 0 | 0 | 0 | 0 | −− |
|  |  |  | Non | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **Zone d'activité économique (ZAE)** | 1 | ajout **v1.18** ; modif. **v1.19** | Oui | − | 0 | 0 | ++ | ++ | 0 | 0 |
|  |  |  | Non | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## Critères saisis (10, poids 11.5)

| Critère | Poids | Évolution | Réponse | Résidentiel | Équipements | Culture | Locaux d'activité | Industrie | Renaturation | Photovoltaïque |
|---|:-:|---|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| **Type de propriétaire** | 1 | v1.1 | Public | ++ | ++ | + | 0 | 0 | + | + |
|  |  |  | Privé | 0 | − | 0 | 0 | 0 | −− | − |
|  |  |  | Mixte public et privé | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
|  |  |  | Copropriété / Indivision | − | − | − | − | − | −− | − |
| **Raccordement à l'eau (dérivé de la surface bâtie)** | 1 | v1.1 | Oui | ++ | ++ | ++ | ++ | ++ | 0 | 0 |
|  |  |  | Non | −− | −− | −− | −− | −− | + | 0 |
| **État du bâti et des infrastructures** | 2 | v1.1 | Bâti intact | ++ | ++ | ++ | ++ | ++ | −− | −− |
|  |  |  | Bâti faiblement dégradé | ++ | ++ | ++ | ++ | ++ | −− | −− |
|  |  |  | Bâti moyennement dégradé | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
|  |  |  | Bâti dégradé de manière hétérogène | 0 | 0 | 0 | 0 | 0 | − | + |
|  |  |  | Bâti très dégradé | − | − | − | − | − | ++ | ++ |
|  |  |  | Pas de bâti | 0 | 0 | 0 | 0 | + | ++ | ++ |
| **Présence de pollution** | 2 | v1.1 | Non | ++ | ++ | ++ | ++ | + | + | + |
|  |  |  | Déjà gérée | + | + | + | + | + | + | + |
|  |  |  | Oui - composés volatils | −− | −− | −− | − | − | 0 | 0 |
|  |  |  | Oui - amiante | − | − | − | − | − | − | − |
|  |  |  | Oui - autres composés | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **Valeur architecturale et historique** | 1 | v1.1 | Bâti sans qualité patrimoniale particulière | 0 | 0 | − | 0 | + | + | + |
|  |  |  | Bâti courant, mais cohérent avec le site | 0 | 0 | 0 | 0 | + | + | + |
|  |  |  | Bâti à valeur patrimoniale remarquable | 0 | 0 | + | 0 | − | −− | −− |
|  |  |  | Pas de bâti | 0 | 0 | 0 | 0 | 0 | ++ | ++ |
| **Qualité du paysage** | 1 | v1.1 | Paysage dégradé ou sans qualité notable | 0 | 0 | − | 0 | + | + | + |
|  |  |  | Paysage courant | 0 | 0 | 0 | 0 | + | + | + |
|  |  |  | Paysage remarquable | 0 | 0 | 0 | 0 | − | + | − |
| **Qualité de la voie de desserte** | 0.5 | v1.1 | Accessible | + | + | 0 | + | ++ | 0 | 0 |
|  |  |  | Accessibilité limitée | − | − | 0 | − | −− | ++ | 0 |
|  |  |  | Accessibilité dégradée | 0 | 0 | 0 | 0 | − | + | 0 |
| **Trame verte et bleue** | 1 | v1.1 | Hors trame | + | + | + | + | + | 0 | + |
|  |  |  | Réservoir de biodiversité | − | − | − | − | − | + | − |
|  |  |  | Corridor à préserver | − | − | − | − | − | + | − |
|  |  |  | Corridor à restaurer | − | − | − | − | − | ++ | − |
| **Présence d'espèces protégées** | 1 | ajout v1.5 | Oui | −− | −− | −− | −− | −− | ++ | −− |
|  |  |  | Non | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **Présence de zone humide** | 1 | ajout v1.6 | Oui | −− | −− | −− | −− | −− | ++ | −− |
|  |  |  | Non | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## Critères excluants (depuis v1.16)

Règles binaires hors matrice : quand **toutes** les conditions sont réunies, l'usage est exclu. Son indice reste calculé et exposé, mais l'usage est relégué en fin de classement (`exclu: true`). « Ne sait pas » ne déclenche jamais d'exclusion.

| Règle | Conditions | Usages exclus |
|---|---|---|
| Zone d'exclusion des EnR (loi APER) | Zone d'accélération des EnR (ZAER) = **Exclu des zones d'accélération ENR** | Photovoltaïque |
| Zone humide et espèces protégées | Présence de zone humide = **Oui** **et** Présence d'espèces protégées = **Oui** | Industrie, Locaux d'activité |

## Versions récentes

| Version | Date | Changement |
|---|---|---|
| v1.12 | 2026-09-04 | zone d'exclusion EnR |
| v1.13 | 2026-09-10 | distance au réseau de chaleur |
| v1.14 | 2026-09-11 | quartier prioritaire de la ville |
| v1.15 | 2026-09-23 | saturation du réseau électrique pour les projets EnR |
| v1.16 | 2026-10-01 | critères excluants |
| v1.17 | 2026-10-02 | rééquilibrage des locaux d'activité |
| v1.18 | 2026-10-07 | zone d'activité économique |
| v1.19 | 2026-10-07 | locaux d'activité très positifs en zone d'activité économique |
