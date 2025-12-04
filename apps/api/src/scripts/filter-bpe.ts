/* eslint-disable no-console, @typescript-eslint/no-non-null-assertion */

/**
 * Script de filtrage du CSV BPE
 *
 * Usage (depuis apps/api):
 *   pnpm db:bpe:filter
 *
 * Prérequis:
 *   - Télécharger le ZIP BPE depuis https://www.insee.fr/fr/statistiques/8217537
 *   - Dézipper dans apps/api/data/raw/bpe24.csv
 *
 * Résultat:
 *   - Crée apps/api/data/bpe-filtered.csv (~10-20 Mo)
 *   - Ce fichier filtré sera committé dans le repo
 */

import { createReadStream, createWriteStream, statSync } from "fs";
import { createInterface } from "readline";
import * as path from "path";

// Constantes (dupliquées ici pour éviter les dépendances circulaires)
const BPE_CODES_A_IMPORTER: string[] = [
  // Transports
  "E107", // Gare nationale
  "E108", // Gare régionale
  "E109", // Gare locale
  // Commerces alimentaires
  "B104", // Hypermarché
  "B105", // Supermarché
  "B201", // Supérette
  "B202", // Épicerie
  "B204", // Boucherie
  "B206", // Poissonnerie
  "B207", // Boulangerie
  // Services
  "A203", // Banque
  "A206", // Bureau de poste
  "A207", // Relais poste
  "A208", // Agence postale
  "D307", // Pharmacie
];

const COLONNES_A_GARDER: string[] = [
  "TYPEQU",
  "DEPCOM",
  "LONGITUDE",
  "LATITUDE",
  "QUALITE_XY",
  "AN",
];

const SEPARATOR = ";";

interface FilterStats {
  totalLines: number;
  keptLines: number;
  filteredLines: number;
  startTime: number;
}

async function filterBpeCsv(): Promise<void> {
  const dataDir = path.resolve(__dirname, "../../data");
  const inputPath = path.resolve(dataDir, "raw/donnees-bpe-2024.csv");
  const outputPath = path.resolve(dataDir, "donnees-bpe-2024-filtered.csv");

  console.log("=".repeat(60));
  console.log("Filtrage du fichier BPE INSEE");
  console.log("=".repeat(60));
  console.log(`Fichier source: ${inputPath}`);
  console.log(`Fichier destination: ${outputPath}`);
  console.log(`Codes equipements a garder: ${BPE_CODES_A_IMPORTER.length}`);
  console.log(`Colonnes a garder: ${COLONNES_A_GARDER.join(", ")}`);
  console.log("-".repeat(60));

  // Vérifier que le fichier source existe
  let fileSize: number;
  try {
    const stats = statSync(inputPath);
    fileSize = stats.size;
    console.log(`Taille fichier source: ${(fileSize / 1024 / 1024).toFixed(2)} Mo`);
  } catch {
    console.error(`ERREUR: Fichier source non trouve: ${inputPath}`);
    console.error("");
    console.error("Instructions:");
    console.error("1. Telecharger le ZIP BPE depuis https://www.insee.fr/fr/statistiques/8217537");
    console.error("2. Dezipper le fichier CSV dans apps/api/data/raw/bpe24.csv");
    process.exit(1);
  }

  const stats: FilterStats = {
    totalLines: 0,
    keptLines: 0,
    filteredLines: 0,
    startTime: Date.now(),
  };

  // Créer les streams
  const inputStream = createReadStream(inputPath, { encoding: "latin1" });
  const outputStream = createWriteStream(outputPath, { encoding: "utf-8" });

  const rl = createInterface({
    input: inputStream,
    crlfDelay: Infinity,
  });

  let headerIndices: Map<string, number> | null = null;
  let isFirstLine = true;

  // Set pour recherche rapide
  const codesSet = new Set(BPE_CODES_A_IMPORTER);

  for await (const line of rl) {
    stats.totalLines++;

    if (isFirstLine) {
      // Traiter le header
      const headers = line.split(SEPARATOR).map((h) => h.replace(/"/g, ""));
      headerIndices = new Map(headers.map((h, i) => [h, i]));

      // Vérifier que toutes les colonnes existent
      for (const col of COLONNES_A_GARDER) {
        if (!headerIndices.has(col)) {
          console.error(`ERREUR: Colonne '${col}' non trouvee dans le fichier`);
          console.error(`Colonnes disponibles: ${headers.slice(0, 20).join(", ")}...`);
          process.exit(1);
        }
      }

      // Écrire le nouveau header
      outputStream.write(COLONNES_A_GARDER.join(SEPARATOR) + "\n");
      isFirstLine = false;
      continue;
    }

    // Traiter les lignes de données
    const values = line.split(SEPARATOR).map((v) => v.replace(/"/g, ""));
    const typequ = values[headerIndices!.get("TYPEQU")!];

    // Filtrer par code équipement
    if (!codesSet.has(typequ)) {
      stats.filteredLines++;
      continue;
    }

    // Vérifier que les coordonnées sont présentes
    const longitude = values[headerIndices!.get("LONGITUDE")!];
    const latitude = values[headerIndices!.get("LATITUDE")!];
    if (!longitude || !latitude || longitude === "" || latitude === "") {
      stats.filteredLines++;
      continue;
    }

    // Extraire les colonnes utiles
    const outputValues = COLONNES_A_GARDER.map((col) => values[headerIndices!.get(col)!]);
    outputStream.write(outputValues.join(SEPARATOR) + "\n");
    stats.keptLines++;

    // Afficher la progression toutes les 100 000 lignes
    if (stats.totalLines % 100000 === 0) {
      const elapsed = (Date.now() - stats.startTime) / 1000;
      const percent = ((stats.totalLines * 150) / (fileSize / 100)).toFixed(1); // Estimation
      console.log(
        `Progression: ${stats.totalLines.toLocaleString()} lignes lues, ` +
          `${stats.keptLines.toLocaleString()} conservees (~${percent}%, ${elapsed.toFixed(1)}s)`,
      );
    }
  }

  outputStream.end();

  // Attendre la fin de l'écriture
  await new Promise<void>((resolve) => outputStream.on("finish", resolve));

  // Statistiques finales
  const elapsed = (Date.now() - stats.startTime) / 1000;
  const outputStats = statSync(outputPath);
  const outputSize = outputStats.size;

  console.log("-".repeat(60));
  console.log("TERMINE !");
  console.log("-".repeat(60));
  console.log(`Lignes lues: ${stats.totalLines.toLocaleString()}`);
  console.log(`Lignes conservees: ${stats.keptLines.toLocaleString()}`);
  console.log(`Lignes filtrees: ${stats.filteredLines.toLocaleString()}`);
  console.log(`Taux de filtrage: ${((stats.filteredLines / stats.totalLines) * 100).toFixed(2)}%`);
  console.log(`Taille fichier sortie: ${(outputSize / 1024 / 1024).toFixed(2)} Mo`);
  console.log(`Reduction: ${((1 - outputSize / fileSize) * 100).toFixed(1)}%`);
  console.log(`Duree: ${elapsed.toFixed(1)}s`);
  console.log("=".repeat(60));
  console.log(`Fichier cree: ${outputPath}`);
}

// Exécution
filterBpeCsv().catch((error: unknown) => {
  console.error("Erreur:", error);
  process.exit(1);
});
