// GET /api/health — quick config/status probe for self-host checks.
import { NextResponse } from "next/server";
import { availableProviders } from "@/lib/llm";
import { usingMock } from "@/lib/hubspot";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    providersConfigured: availableProviders(),
    defaultProvider: process.env.AI_DEFAULT_PROVIDER || "claude",
    hubspot: usingMock() ? "mock" : "live",
    time: new Date().toISOString(),
  });
}
