# DTOs Swagger

Ces DTOs sont des **duplications nécessaires** des interfaces de `@mutafriches/shared-types`.

## Pourquoi cette duplication ?

- Les interfaces dans `shared-types` sont partagées avec le front
- Les décorateurs `@ApiProperty` de NestJS ne peuvent pas être dans `shared-types` (ça créerait une dépendance front → NestJS)
- Pour avoir une documentation Swagger complète, on doit créer des classes avec décorateurs

## Règles de maintenance

1. Ces DTOs **implémentent** toujours les interfaces de `shared-types`
2. Si l'interface change dans `shared-types`, mettre à jour ici aussi
3. Les noms suivent le pattern : `[Nom]SwaggerDto`
4. Toujours ajouter `@ApiProperty` avec description et exemple

## Structure

- `input/` : DTOs pour les requêtes (POST body, query params)
- `output/` : DTOs pour les réponses
