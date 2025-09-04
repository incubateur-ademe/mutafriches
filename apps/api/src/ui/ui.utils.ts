// Type pour les valeurs primitives acceptées dans les templates
type PrimitiveValue = string | number | boolean | null | undefined;

// Type pour un objet qui peut contenir d'autres objets, des tableaux ou des primitives
type NestedObject = {
  [key: string]: PrimitiveValue | NestedObject | Array<any>;
};

// Type pour l'objet aplati final
type FlattenedObject = Record<string, PrimitiveValue>;

/**
 * Vérifie si une valeur est un objet (pas null, pas array)
 */
function isObject(value: unknown): value is NestedObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Vérifie si une valeur est un tableau
 */
function isArray(value: unknown): value is Array<any> {
  return Array.isArray(value);
}

/**
 * Aplatit un objet imbriqué pour permettre l'utilisation de variables comme {{obj.prop}}
 * @param obj L'objet à aplatir
 * @param prefix Le préfixe pour les clés (utilisé en récursion)
 * @returns Un objet aplati avec des clés comme 'fiabilite.note' ou 'resultats.0.usage'
 */
export function flattenObject(obj: NestedObject, prefix = ''): FlattenedObject {
  const flattened: FlattenedObject = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];

      if (isArray(value)) {
        // Traiter les tableaux - aplatir chaque élément avec son index
        value.forEach((item, index) => {
          const arrayKey = `${newKey}.${index}`;

          if (isObject(item)) {
            // Si l'élément du tableau est un objet, l'aplatir aussi
            Object.assign(flattened, flattenObject(item, arrayKey));
          } else {
            // Si c'est une primitive, l'ajouter directement
            flattened[arrayKey] = item as PrimitiveValue;
          }
        });
      } else if (isObject(value)) {
        // Récursion pour les objets imbriqués
        Object.assign(flattened, flattenObject(value, newKey));
      } else {
        // Valeur primitive
        flattened[newKey] = value;
      }
    }
  }

  return flattened;
}

/**
 * Remplace les variables {{variable}} dans un template HTML
 * @param html Le template HTML avec des variables
 * @param data Les données à injecter
 * @returns Le HTML avec les variables remplacées
 */
export function replaceVariables(
  html: string,
  data: Record<string, unknown>,
): string {
  // Filtrer les données pour garder seulement les objets, tableaux et primitives
  const cleanData: NestedObject = {};

  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        value === null ||
        value === undefined ||
        isObject(value) ||
        isArray(value)
      ) {
        cleanData[key] = value as PrimitiveValue | NestedObject | Array<any>;
      }
    }
  }

  // Aplatir les données pour gérer les objets imbriqués et tableaux
  const flattenedData = flattenObject(cleanData);

  // Remplacer les variables dans le template
  Object.keys(flattenedData).forEach((key) => {
    const value = flattenedData[key];
    const regex = new RegExp(
      `\\{\\{${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}\\}`,
      'g',
    );
    html = html.replace(regex, String(value ?? ''));
  });

  return html;
}
