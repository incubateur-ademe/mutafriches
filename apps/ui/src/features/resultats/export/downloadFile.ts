// Déclenche le téléchargement d'un blob dans le navigateur.
// La révocation de l'URL est différée : la révoquer immédiatement peut annuler
// le téléchargement d'un blob volumineux (le PDF) avant qu'il ne démarre.
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// Nom de fichier nettoyé (commune + date) pour l'export.
export function exportFileName(commune: string | undefined, ext: "pdf" | "json"): string {
  const slug = (commune ?? "site")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // retire les accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const date = new Date().toISOString().slice(0, 10);
  return `mutabilite-${slug}-${date}.${ext}`;
}
