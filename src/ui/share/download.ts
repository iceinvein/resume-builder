function clickDownloadLink(url: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.click();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  clickDownloadLink(url, filename);
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadTextFile(
  text: string,
  filename: string,
  mimeType = "text/plain;charset=utf-8",
) {
  downloadBlob(new Blob([text], { type: mimeType }), filename);
}
