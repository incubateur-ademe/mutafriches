import { downloadBlob, exportFileName } from "./downloadFile";
import type { ResultatsExportData } from "./types";

/**
 * Génère et télécharge le PDF. La librairie @react-pdf/renderer et le document
 * sont chargés à la demande (code-split) pour ne pas alourdir le bundle principal.
 */
export async function generateMutabilitePdf(data: ResultatsExportData): Promise<void> {
  const [{ pdf }, { MutabilitePdfDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./MutabilitePdfDocument"),
  ]);
  const blob = await pdf(<MutabilitePdfDocument data={data} />).toBlob();
  downloadBlob(blob, exportFileName(data.site.commune, "pdf"));
}
