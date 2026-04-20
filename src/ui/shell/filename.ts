/**
 * Produce a filesystem-safe filename from user-provided text.
 *
 * Strips characters that are forbidden on Windows/macOS/Linux paths or that
 * most browsers reject in `<a download>`. Collapses runs of whitespace into
 * a single hyphen so "John Smith" becomes "john-smith.pdf" rather than
 * "john smith.pdf" (which works but reads as sloppy).
 *
 * Falls back to "resume" when the input is empty after sanitization, so the
 * export never produces `undefined.pdf` or `.pdf`.
 */
export function safeFilename(raw: string, extension: string): string {
  const base = raw
    .trim()
    .replace(/[\\/:*?"<>|]/g, "") // forbidden path chars across OSes
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  const safe = base.length > 0 ? base : "resume";
  const ext = extension.startsWith(".") ? extension : `.${extension}`;
  return `${safe}${ext}`;
}
