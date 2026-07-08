import { downloadBlob } from "../../resultats/export/downloadFile";

/**
 * Génère et télécharge le PDF de la documentation des sources. La librairie
 * @react-pdf/renderer et le document sont chargés à la demande (code-split).
 */
export async function generateSourcesPdf(): Promise<void> {
  const [{ pdf }, { SourcesPdfDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./SourcesPdfDocument"),
  ]);
  const blob = await pdf(<SourcesPdfDocument />).toBlob();
  const date = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `mutafriches-sources-donnees-${date}.pdf`);
}
