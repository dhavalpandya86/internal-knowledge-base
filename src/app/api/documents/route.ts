// Document ingestion.
//   GET  /api/documents        — list uploaded documents (metadata only)
//   POST /api/documents        — multipart upload; saves file locally + extracts text
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { saveFile, extractText, isSupported, maxUploadBytes } from "@/lib/documents";

export const runtime = "nodejs";

export async function GET() {
  const docs = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, filename: true, mimeType: true, sizeBytes: true, createdAt: true, uploadedBy: true },
  });
  return NextResponse.json({ documents: docs });
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const uploadedBy = (form.get("uploadedBy") as string) || null;

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "file field is required" }, { status: 400 });
    }
    const f = file as File;
    if (!isSupported(f.type, f.name)) {
      return NextResponse.json({ error: "Unsupported type. Allowed: PDF, DOCX, MD, TXT." }, { status: 415 });
    }
    if (f.size > maxUploadBytes()) {
      return NextResponse.json({ error: `File exceeds ${process.env.MAX_UPLOAD_MB || 25}MB limit` }, { status: 413 });
    }

    const buffer = Buffer.from(await f.arrayBuffer());
    const storagePath = await saveFile(f.name, buffer);
    const extractedText = await extractText(buffer, f.type, f.name);

    const doc = await prisma.document.create({
      data: {
        filename: f.name,
        storagePath,
        mimeType: f.type || "application/octet-stream",
        sizeBytes: f.size,
        extractedText,
        uploadedBy,
      },
      select: { id: true, filename: true, sizeBytes: true, createdAt: true },
    });
    return NextResponse.json({ document: doc, extractedChars: extractedText.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
