// POST /api/ai/generate — server-side proxy to the configured AI provider.
// Keeps all provider keys on the server. Accepts { prompt, system?, provider?, maxTokens? }.
import { NextRequest, NextResponse } from "next/server";
import { generate, availableProviders } from "@/lib/llm";

export const runtime = "nodejs";

export async function GET() {
  // Lets the UI know which providers are configured (for the switcher).
  return NextResponse.json({ providers: availableProviders(), default: process.env.AI_DEFAULT_PROVIDER || "claude" });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }
    const result = await generate({
      prompt: body.prompt,
      system: body.system,
      provider: body.provider,
      maxTokens: body.maxTokens,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "AI request failed" }, { status: 500 });
  }
}
