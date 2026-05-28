import { Injectable, Logger } from "@nestjs/common";
import { sql } from "drizzle-orm";
import type { ImportStatus, ImportStatusItem, ImportStatusOutput } from "@mutafriches/shared-types";
import { DatabaseService } from "../shared/database/database.service";
import { IMPORT_DATASETS, type ImportDatasetDefinition } from "./imports.registry";

interface RawImportLogRow {
  status: ImportStatus;
  rows_imported: number | null;
  finished_at: Date | null;
  started_at: Date | null;
  source_path: string | null;
  file_size_bytes: number | string | null;
}

interface CountRow {
  count: number | string;
}

@Injectable()
export class ImportsService {
  private readonly logger = new Logger(ImportsService.name);

  constructor(private readonly database: DatabaseService) {}

  async getStatus(): Promise<ImportStatusOutput> {
    const imports = await Promise.all(
      IMPORT_DATASETS.map((dataset) => this.getDatasetStatus(dataset)),
    );

    return {
      generatedAt: new Date().toISOString(),
      imports,
      hasEmptyImport: imports.some((item) => item.rowsInDb === 0),
      hasFailedImport: imports.some((item) => item.status === "failed"),
    };
  }

  private async getDatasetStatus(dataset: ImportDatasetDefinition): Promise<ImportStatusItem> {
    const [lastLog, rowsInDb] = await Promise.all([
      this.fetchLastImportLog(dataset.datasetNamePattern),
      this.countRowsInTable(dataset.countTable),
    ]);

    if (!lastLog) {
      return {
        key: dataset.key,
        label: dataset.label,
        status: "never",
        rowsInDb,
        rowsImported: null,
        lastImportAt: null,
        sourcePath: null,
        fileSizeBytes: null,
        docUrl: dataset.docUrl,
      };
    }

    const lastImportDate = lastLog.finished_at ?? lastLog.started_at;
    const fileSize = lastLog.file_size_bytes === null ? null : Number(lastLog.file_size_bytes);

    return {
      key: dataset.key,
      label: dataset.label,
      status: lastLog.status,
      rowsInDb,
      rowsImported: lastLog.rows_imported,
      lastImportAt: lastImportDate ? new Date(lastImportDate).toISOString() : null,
      sourcePath: lastLog.source_path,
      fileSizeBytes: Number.isFinite(fileSize) ? fileSize : null,
      docUrl: dataset.docUrl,
    };
  }

  private async fetchLastImportLog(datasetNamePattern: string): Promise<RawImportLogRow | null> {
    try {
      const result = await this.database.db.execute(sql`
        SELECT status, rows_imported, finished_at, started_at, source_path, file_size_bytes
        FROM raw_imports_log
        WHERE dataset_name LIKE ${datasetNamePattern}
        ORDER BY id DESC
        LIMIT 1
      `);
      const rows = result as unknown as RawImportLogRow[];
      return rows.length > 0 ? rows[0] : null;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.warn(
        `Lecture raw_imports_log pour "${datasetNamePattern}" échouée : ${err.message}`,
      );
      return null;
    }
  }

  private async countRowsInTable(tableName: string): Promise<number> {
    try {
      // tableName provient du registre statique IMPORT_DATASETS, pas d'injection possible
      const result = await this.database.db.execute(
        sql.raw(`SELECT COUNT(*)::INT AS count FROM ${tableName}`),
      );
      const rows = result as unknown as CountRow[];
      if (rows.length === 0) return 0;
      return Number(rows[0].count) || 0;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.warn(`COUNT(*) sur "${tableName}" échoué : ${err.message}`);
      return 0;
    }
  }
}
