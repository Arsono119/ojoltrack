import { VISION_PROMPT } from "./visionPrompt";

export interface ExtractResult {
  nominal: number | null;
  jarak_km: number | null;
  platform: string | null;
  waktu: string | null;
  jenis: string | null;
  keterangan: string | null;
}

function sanitizeResult(raw: unknown): ExtractResult {
  const r = raw as Record<string, unknown>;
  return {
    nominal: typeof r.nominal === "number" ? r.nominal : r.nominal ? parseInt(String(r.nominal).replace(/[^0-9]/g,""),10) || null : null,
    jarak_km: typeof r.jarak_km === "number" ? r.jarak_km : r.jarak_km ? parseFloat(String(r.jarak_km).replace(",",".")) || null : null,
    platform: typeof r.platform === "string" ? r.platform : null,
    waktu: typeof r.waktu === "string" ? r.waktu : null,
    jenis: typeof r.jenis === "string" ? r.jenis : null,
    keterangan: typeof r.keterangan === "string" ? r.keterangan : null,
  };
}

function extractJson(text: string): unknown {
  // try direct JSON
  try { return JSON.parse(text); } catch {}
  // try find JSON block
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  throw new Error("Gagal parse JSON dari vision");
}

async function callOpenRouter(base64: string, apiKey: string): Promise<ExtractResult> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://ojoltrack.vercel.app",
      "X-Title": "OjolTrack",
    },
    body: JSON.stringify({
      model: process.env.VISION_MODEL_OPENROUTER || "qwen/qwen-2-vl-72b-instruct:free",
      messages: [
        { role: "user", content: [
          { type: "text", text: VISION_PROMPT },
          { type: "image_url", image_url: { url: base64.startsWith("data:") ? base64 : `data:image/jpeg;base64,${base64}` } }
        ]}
      ],
      max_tokens: 500,
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
  const json = await res.json() as { choices: { message: { content: string } }[] };
  const content = json.choices?.[0]?.message?.content || "";
  return sanitizeResult(extractJson(content));
}

async function callGroq(base64: string, apiKey: string): Promise<ExtractResult> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.VISION_MODEL_GROQ || "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        { role: "user", content: [
          { type: "text", text: VISION_PROMPT },
          { type: "image_url", image_url: { url: base64.startsWith("data:") ? base64 : `data:image/jpeg;base64,${base64}` } }
        ]}
      ],
      max_tokens: 500,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const json = await res.json() as { choices: { message: { content: string } }[] };
  const content = json.choices?.[0]?.message?.content || "";
  return sanitizeResult(extractJson(content));
}

export async function extractViaVision(base64: string): Promise<ExtractResult> {
  const orKey = process.env.OPENROUTER_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  if (orKey) {
    try { return await callOpenRouter(base64, orKey); } catch (e) {
      if (!groqKey) throw e;
      // fallback to Groq
    }
  }
  if (groqKey) return await callGroq(base64, groqKey);
  throw new Error("Tidak ada API key vision (OPENROUTER_API_KEY / GROQ_API_KEY)");
}
