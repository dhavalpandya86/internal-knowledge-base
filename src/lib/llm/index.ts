// Provider-agnostic AI layer.
// One `generate()` entry point fans out to Claude / OpenAI / Gemini based on
// the requested (or default) provider. Keys are read from env at call time and
// never leave the server. Each provider is called via its plain HTTP API so we
// don't need a vendor SDK per provider.

export type Provider = "claude" | "openai" | "gemini";

export interface GenerateInput {
  prompt: string;
  system?: string;
  provider?: Provider;
  maxTokens?: number;
}

export interface GenerateResult {
  text: string;
  provider: Provider;
  model: string;
}

function defaultProvider(): Provider {
  const p = (process.env.AI_DEFAULT_PROVIDER || "claude").toLowerCase();
  if (p === "openai" || p === "gemini" || p === "claude") return p;
  return "claude";
}

export async function generate(input: GenerateInput): Promise<GenerateResult> {
  const provider = input.provider || defaultProvider();
  const maxTokens = input.maxTokens ?? 1000;
  switch (provider) {
    case "openai":
      return callOpenAI(input, maxTokens);
    case "gemini":
      return callGemini(input, maxTokens);
    case "claude":
    default:
      return callClaude(input, maxTokens);
  }
}

// Which providers actually have a key configured — used by the UI switcher.
export function availableProviders(): Provider[] {
  const out: Provider[] = [];
  if (process.env.ANTHROPIC_API_KEY) out.push("claude");
  if (process.env.OPENAI_API_KEY) out.push("openai");
  if (process.env.GEMINI_API_KEY) out.push("gemini");
  return out;
}

// ── Anthropic (Claude) ────────────────────────────────────────────────
async function callClaude(input: GenerateInput, maxTokens: number): Promise<GenerateResult> {
  const key = requireKey("ANTHROPIC_API_KEY", "claude");
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: input.system,
      messages: [{ role: "user", content: input.prompt }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Claude error: ${JSON.stringify(data)}`);
  return { text: data.content?.[0]?.text ?? "", provider: "claude", model };
}

// ── OpenAI ────────────────────────────────────────────────────────────
async function callOpenAI(input: GenerateInput, maxTokens: number): Promise<GenerateResult> {
  const key = requireKey("OPENAI_API_KEY", "openai");
  const model = process.env.OPENAI_MODEL || "gpt-4o";
  const messages = [];
  if (input.system) messages.push({ role: "system", content: input.system });
  messages.push({ role: "user", content: input.prompt });
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, max_tokens: maxTokens, messages }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`OpenAI error: ${JSON.stringify(data)}`);
  return { text: data.choices?.[0]?.message?.content ?? "", provider: "openai", model };
}

// ── Google Gemini ─────────────────────────────────────────────────────
async function callGemini(input: GenerateInput, maxTokens: number): Promise<GenerateResult> {
  const key = requireKey("GEMINI_API_KEY", "gemini");
  const model = process.env.GEMINI_MODEL || "gemini-1.5-pro";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: input.system ? { parts: [{ text: input.system }] } : undefined,
      contents: [{ role: "user", parts: [{ text: input.prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Gemini error: ${JSON.stringify(data)}`);
  const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
  return { text, provider: "gemini", model };
}

function requireKey(envName: string, provider: Provider): string {
  const key = process.env[envName];
  if (!key) {
    throw new Error(
      `Provider "${provider}" selected but ${envName} is not set. Add it to your .env.`
    );
  }
  return key;
}
