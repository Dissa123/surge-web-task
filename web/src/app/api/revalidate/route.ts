import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { CMS_TAG } from "@/lib/strapi";

/** Called by Strapi (see cms/src/index.ts) whenever the homepage or site settings change. */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || req.headers.get("x-revalidate-secret") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  revalidateTag(CMS_TAG, { expire: 0 });
  return NextResponse.json({ ok: true, revalidated: CMS_TAG });
}
