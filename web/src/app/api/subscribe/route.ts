import { NextResponse, type NextRequest } from "next/server";

const STRAPI_URL = process.env.STRAPI_URL ?? "http://localhost:1337";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Small in-memory limiter: 5 submissions / minute / IP. Good enough for one instance;
// swap for Redis if the frontend is scaled horizontally.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  // Drop idle IPs so the map cannot grow without bound on a long-running server.
  if (hits.size > 5000) {
    for (const [key, stamps] of hits) if (now - stamps[stamps.length - 1] > 60_000) hits.delete(key);
  }
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (limited(ip)) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });

  const body = (await req.json().catch(() => null)) as { email?: unknown; website?: unknown } | null;
  // Honeypot: bots fill the hidden "website" field. Pretend success, store nothing.
  if (body?.website) return NextResponse.json({ ok: true });

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) return NextResponse.json({ ok: false, error: "required" }, { status: 422 });
  if (email.length > 254 || !EMAIL_RE.test(email)) return NextResponse.json({ ok: false, error: "invalid" }, { status: 422 });

  try {
    const res = await fetch(`${STRAPI_URL}/api/subscribers`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ data: { email } }),
      cache: "no-store",
    });
    // Strapi answers 400 ValidationError for the unique-email rule; the visitor is already on the list.
    if (res.ok) return NextResponse.json({ ok: true });
    const err = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    if (res.status === 400 && /unique/i.test(err?.error?.message ?? "")) return NextResponse.json({ ok: true });
    return NextResponse.json({ ok: false, error: "upstream" }, { status: 502 });
  } catch {
    return NextResponse.json({ ok: false, error: "upstream" }, { status: 502 });
  }
}
