import { NextRequest, NextResponse } from "next/server";
import { extractViaVision } from "@/lib/vision";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let base64: string | null = null;

    if (contentType.includes("application/json")) {
      const body = await req.json() as { image?: string };
      base64 = body.image || null;
    } else {
      const form = await req.formData();
      const file = form.get("image") as File | null;
      if (file) {
        const buf = Buffer.from(await file.arrayBuffer());
        if (buf.length > 10 * 1024 * 1024) {
          return NextResponse.json({ ok: false, error: "File terlalu besar (max 10MB)" }, { status: 413 });
        }
        base64 = `data:${file.type || "image/jpeg"};base64,${buf.toString("base64")}`;
      }
    }

    if (!base64) return NextResponse.json({ ok: false, error: "Tidak ada gambar" }, { status: 400 });

    const data = await extractViaVision(base64);

    // normalize platform
    if (data.platform) {
      const p = data.platform.toLowerCase();
      if (p.includes("shopee")) data.platform = "Shopee Drive";
      else if (p.includes("grab")) data.platform = "Grab";
      else data.platform = "Lainnya";
    }

    return NextResponse.json({ ok: true, data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    // graceful fallback — never crash, let client show manual fallback
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
