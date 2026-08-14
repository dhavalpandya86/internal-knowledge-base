// Local, private document storage + text extraction.
// Files are written under UPLOAD_DIR on your own disk; only extracted text is
// stored in the DB (for search / AI grounding). Nothing is sent to third parties.

import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export function uploadDir(): string {
  return process.env.UPLOAD_DIR || "./uploads";
}

export function maxUploadBytes(): number {
  return (Number(process.env.MAX_UPLOAD_MB) || 25) * 1024 * 1024;
}

const SUPPORTED = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "text/markdown",
  "text/plain",
]);

export function isSupported(mime: string, filename: string): boolean {
  if (SUPPORTED.has(mime)) return true;
  return /\.(pdf|docx|md|markdown|txt)$/i.test(filename);
}

export async function saveFile(filename: string, buffer: Buffer): Promise<string> {
  const dir = uploadDir();
  await fs.mkdir(dir, { recursive: true });
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const unique = `${crypto.randomBytes(6).toString("hex")}-${safe}`;
  const full = path.join(dir, unique);
  await fs.writeFile(full, buffer);
  return full;
}

// Extract plain text so uploaded knowledge is searchable and can ground AI.
export async function extractText(
  buffer: Buffer,
  mime: string,
  filename: string
): Promise<string> {
  const isPdf = mime === "application/pdf" || /\.pdf$/i.test(filename);
  const isDocx =
    mime.includes("wordprocessingml") || /\.docx$/i.test(filename);

  try {
    if (isPdf) {
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer);
      return data.text?.trim() ?? "";
    }
    if (isDocx) {
      const mammoth = await import("mammoth");
      const { value } = await mammoth.extractRawText({ buffer });
      return value?.trim() ?? "";
    }
    // md / txt / fallback
    return buffer.toString("utf8").trim();
  } catch (err) {
    // Never fail the upload just because extraction hiccuped.
    return "";
  }
}
