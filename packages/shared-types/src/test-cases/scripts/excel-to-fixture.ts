/* eslint-disable no-console */
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import type {
  TestCase,
  TestCaseInput,
  TestCaseExpected,
  TestCaseExpectedUsage,
} from "../types/test-case.types";
import {
  EXCEL_STRUCTURE,
  FIELD_MAPPINGS,
  USAGE_MAPPING,
  getFieldByExcelName,
  type FieldMapping,
} from "../config/excel-structure.config";

// Fonction pour obtenir la valeur d'une cellule
function getCellValue(worksheet: XLSX.WorkSheet, column: string, row: number): any {
  const cellAddress = `${column}${row}`;
  const cell = worksheet[cellAddress];
  return cell ? cell.v : undefined;
}

// Fonction pour transformer une valeur selon le type et les règles
function transformValue(value: any, fieldMapping: FieldMapping): any {
  if (value === undefined || value === null || value === "" || value === "-") {
    return undefined;
  }

  // Transformation des booléens
  if (fieldMapping.type === "boolean") {
    const strValue = String(value).toLowerCase().trim();
    return strValue === "oui" || strValue === "true" || strValue === "1";
  }

  // Transformation des nombres
  if (fieldMapping.type === "number") {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      // Gérer les pourcentages et les nombres avec virgules françaises
      const cleaned = value.replace(",", ".").replace("%", "").trim();
      return parseFloat(cleaned);
    }
    return value;
  }

  // Transformation des strings avec mapping
  if (fieldMapping.type === "string" && fieldMapping.transform) {
    const strValue = String(value).trim();

    // Normaliser les apostrophes avant de chercher dans le mapping
    const normalizedValue = strValue.replace(/'/g, "'"); // Remplacer apostrophe courbe par droite

    // Chercher d'abord avec la valeur normalisée
    if (fieldMapping.transform[normalizedValue]) {
      const result = fieldMapping.transform[normalizedValue];
      return result;
    }

    // Puis avec la valeur originale
    if (fieldMapping.transform[strValue]) {
      const result = fieldMapping.transform[strValue];
      return result;
    }

    // Si pas de correspondance exacte, normaliser la valeur en kebab-case
    const normalized = strValue
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Retirer les accents
      .replace(/[^\w\s-]/g, "-") // Remplacer les caractères spéciaux par des tirets
      .replace(/\s+/g, "-") // Remplacer les espaces par des tirets
      .replace(/-+/g, "-") // Remplacer les tirets multiples par un seul
      .replace(/^-+|-+$/g, ""); // Retirer les tirets en début et fin

    return normalized;
  }

  return value;
}

// Fonction pour extraire les inputs du fichier Excel
function extractInputFromExcel(worksheet: XLSX.WorkSheet): TestCaseInput {
  const input: Partial<TestCaseInput> = {};

  // Parcourir les lignes d'input
  for (let row = EXCEL_STRUCTURE.inputStartRow; row <= EXCEL_STRUCTURE.inputEndRow; row++) {
    const fieldName = getCellValue(worksheet, EXCEL_STRUCTURE.nameColumn, row);
    const fieldValue = getCellValue(worksheet, EXCEL_STRUCTURE.valueColumn, row);

    if (fieldName) {
      const fieldMapping = getFieldByExcelName(fieldName);
      if (fieldMapping) {
        const transformedValue = transformValue(fieldValue, fieldMapping);
        if (transformedValue !== undefined) {
          (input as any)[fieldMapping.jsonField] = transformedValue;
        }
      } else {
        console.warn(`Champ non mappé: "${fieldName}" (ligne ${row})`);
      }
    }
  }

  return input as TestCaseInput;
}

// Fonction pour extraire les usages et classements
function extractUsagesFromExcel(worksheet: XLSX.WorkSheet): TestCaseExpectedUsage[] {
  const usages: TestCaseExpectedUsage[] = [];

  // Pour chaque usage
  Object.entries(EXCEL_STRUCTURE.usagesColumns).forEach(([usageKey, column]) => {
    if (usageKey === "ponderation") return; // Skip pondération

    // Récupérer l'indice de mutabilité (ligne 41)
    const mutabilite = getCellValue(worksheet, column, EXCEL_STRUCTURE.resultRow);
    // Récupérer le classement (ligne 42)
    const rang = getCellValue(worksheet, column, EXCEL_STRUCTURE.rankingRow);

    if (mutabilite !== undefined && rang !== undefined) {
      // Nettoyer les valeurs
      let indiceMutabilite: number;
      if (typeof mutabilite === "number") {
        indiceMutabilite = Math.round(mutabilite * 100); // Si c'est un ratio
      } else if (typeof mutabilite === "string") {
        // Extraire le nombre du format "0.68" ou "68%" ou "68"
        const cleaned = mutabilite.replace("%", "").replace(",", ".").trim();
        const parsed = parseFloat(cleaned);
        indiceMutabilite = parsed > 1 ? Math.round(parsed) : Math.round(parsed * 100);
      } else {
        indiceMutabilite = 0;
      }

      usages.push({
        usage: USAGE_MAPPING[usageKey] || usageKey,
        indiceMutabilite: indiceMutabilite,
        rang: typeof rang === "number" ? rang : parseInt(String(rang)),
      });
    }
  });

  // Trier par rang
  return usages.sort((a, b) => a.rang - b.rang);
}

// Fonction pour générer les métadonnées
function generateMetadata(input: any): TestCaseExpected["metadata"] {
  // Ne compter que les champs qui sont de vrais critères (pas les champs informatifs)
  const infoFields = [
    "nomSite",
    "identifiantsParcellaires",
    "nomProprietaire",
    "nombreBatiments",
    "identifiantParcelle",
    "commune",
  ];
  const testCaseFields = FIELD_MAPPINGS.filter((f) => !infoFields.includes(f.jsonField)).map(
    (f) => f.jsonField,
  );

  const renseignes: string[] = [];
  const manquants: string[] = [];

  testCaseFields.forEach((field) => {
    const value = input[field];
    // Un champ est considéré comme renseigné s'il a une valeur
    if (value !== undefined && value !== null) {
      renseignes.push(field);
    } else {
      manquants.push(field);
    }
  });

  return {
    criteresRenseignes: renseignes.length,
    criteresTotal: testCaseFields.length,
    criteresManquants: manquants,
  };
}

// Fonction principale pour traiter un fichier Excel
function processExcelFile(filePath: string, outputName: string, description?: string): TestCase {
  console.log(`Traitement de ${filePath}...`);

  // Lire le fichier Excel
  const workbook = XLSX.readFile(filePath);

  // Utiliser l'onglet spécifié dans la configuration
  const worksheet = workbook.Sheets[EXCEL_STRUCTURE.sheet];

  if (!worksheet) {
    throw new Error(`L'onglet "${EXCEL_STRUCTURE.sheet}" n'existe pas dans ${filePath}`);
  }

  // Extraire les données d'entrée
  const input = extractInputFromExcel(worksheet);
  console.log(`  - ${Object.keys(input).length} critères extraits`);

  // Extraire les résultats attendus
  const usages = extractUsagesFromExcel(worksheet);
  console.log(`  - ${usages.length} usages extraits`);

  // Générer les métadonnées
  const metadata = generateMetadata(input);

  // Récupérer le nom du site depuis les données extraites ou utiliser le nom par défaut
  const siteName = (input as any).nomSite || outputName;

  // Extraire la version depuis le nom du fichier
  const versionMatch = path.basename(filePath).match(/^v([\d.]+)_/);
  const algorithmVersion = versionMatch ? versionMatch[1] : "1.1";

  // Construire le test case avec tous les champs (y compris informatifs)
  const testCase: TestCase = {
    id: outputName.toLowerCase().replace(/\s+/g, "-"),
    name: siteName,
    description: description || `Test case généré depuis ${path.basename(filePath)}`,
    source: path.basename(filePath),
    algorithmVersion: algorithmVersion,
    input: input as TestCaseInput, // Garder tous les champs
    expected: {
      usages,
      metadata,
    },
  };

  return testCase;
}

// Fonction pour traiter tous les fichiers d'un dossier
function processAllExcelFiles() {
  // Extraire la version depuis les arguments ou utiliser v1.1 par défaut
  const versionArg = process.argv.find((arg) => arg.startsWith("--version="));
  const version = versionArg ? versionArg.split("=")[1] : "1.1";

  // Formater la version avec le préfixe 'v'
  const versionFolder = `v${version}`;

  const sourceDir = path.join(__dirname, "..", "excel-sources", versionFolder);
  const outputDir = path.join(__dirname, "..", "fixtures", versionFolder);

  // Créer le dossier de sortie si nécessaire
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  if (!fs.existsSync(sourceDir)) {
    console.error(`Le dossier ${sourceDir} n'existe pas`);
    console.log("Créez le dossier et placez-y vos fichiers Excel");
    console.log("Versions disponibles:");
    const excelSourcesDir = path.join(__dirname, "..", "excel-sources");
    if (fs.existsSync(excelSourcesDir)) {
      const versions = fs
        .readdirSync(excelSourcesDir)
        .filter(
          (f) => f.startsWith("v") && fs.statSync(path.join(excelSourcesDir, f)).isDirectory(),
        );
      versions.forEach((v) => console.log(`  - ${v} (utilisez --version=${v.substring(1)})`));
    }
    process.exit(1);
  }

  const files = fs
    .readdirSync(sourceDir)
    .filter((f) => f.endsWith(".xlsx"))
    .sort(); // Trier pour avoir un ordre cohérent

  if (files.length === 0) {
    console.error(`Aucun fichier Excel trouvé dans ${sourceDir}`);
    process.exit(1);
  }

  console.log(`Version: ${version}`);
  console.log(`Dossier source: ${sourceDir}`);
  console.log(`Dossier destination: ${outputDir}`);
  console.log(`Traitement de ${files.length} fichiers Excel...\n`);

  const results: { success: string[]; errors: string[] } = {
    success: [],
    errors: [],
  };

  files.forEach((file) => {
    const filePath = path.join(sourceDir, file);

    // Extraire le nom de sortie depuis le nom du fichier
    // Format attendu: v1.1_test-01_oyonnax.xlsx -> test-01-oyonnax
    const versionPattern = `v${version.replace(/\./g, "\\.")}_`;
    const regex = new RegExp(`${versionPattern}(.+)\\.xlsx$`);
    const match = file.match(regex);
    const outputName = match ? match[1].replace(/_/g, "-") : file.replace(".xlsx", "");

    try {
      const testCase = processExcelFile(filePath, outputName);

      const outputPath = path.join(outputDir, `${outputName}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(testCase, null, 2));

      console.log(`✓ ${file}`);
      console.log(`  → ${outputName}.json`);
      console.log(`  → ${testCase.expected.usages.length} usages`);
      console.log(
        `  → ${testCase.expected.metadata.criteresRenseignes}/${testCase.expected.metadata.criteresTotal} critères\n`,
      );

      results.success.push(file);
    } catch (error) {
      console.error(`✗ Erreur avec ${file}:`);
      console.error(`  ${error}\n`);
      results.errors.push(file);
    }
  });

  // Résumé
  console.log("\n" + "=".repeat(50));
  console.log("RÉSUMÉ");
  console.log("=".repeat(50));
  console.log(`Succès: ${results.success.length}/${files.length} fichiers`);
  if (results.errors.length > 0) {
    console.log(`Erreurs: ${results.errors.join(", ")}`);
  }
}

// Fonction pour traiter un fichier unique
function processSingleFile() {
  const args = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));

  // Extraire la version depuis les arguments ou utiliser 1.1 par défaut
  const versionArg = process.argv.find((arg) => arg.startsWith("--version="));
  const version = versionArg ? versionArg.split("=")[1] : "1.1";

  // Formater la version avec le préfixe 'v'
  const versionFolder = `v${version}`;

  if (args.length < 1) {
    console.error("Usage: pnpm run excel-to-fixture <excel-file> [output-name] [description]");
    console.error("       pnpm run excel-to-fixture <excel-file> --version=1.1");
    console.error(
      "Example: pnpm run excel-to-fixture ./excel-sources/v1.1/v1.1_test-01_oyonnax.xlsx --version=1.1",
    );
    console.error("\nOu pour traiter tous les fichiers:");
    console.error("pnpm run excel-to-fixture:all");
    console.error("pnpm run excel-to-fixture:all --version=1.1");
    process.exit(1);
  }

  const [excelPath, outputName, description] = args;

  // Si pas de nom de sortie, l'extraire du nom du fichier
  const versionPattern = `v${version.replace(/\./g, "\\.")}_`;
  const regex = new RegExp(`${versionPattern}(.+)\\.xlsx$`);
  const match = path.basename(excelPath).match(regex);
  const finalOutputName =
    outputName || (match ? match[1].replace(/_/g, "-") : path.basename(excelPath, ".xlsx"));

  try {
    const testCase = processExcelFile(excelPath, finalOutputName, description);

    const outputDir = path.join(__dirname, "..", "fixtures", versionFolder);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `${finalOutputName}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(testCase, null, 2) + "\n");

    console.log(`\nVersion: ${version}`);
    console.log(`✓ Fixture créée avec succès: ${outputPath}`);
    console.log(`  - ${testCase.expected.usages.length} usages`);
    console.log(
      `  - Critères: ${testCase.expected.metadata.criteresRenseignes}/${testCase.expected.metadata.criteresTotal}`,
    );
  } catch (error) {
    console.error("Erreur lors de la transformation:", error);
    process.exit(1);
  }
}

// Point d'entrée principal
if (process.argv.includes("--all")) {
  processAllExcelFiles();
} else {
  processSingleFile();
}
