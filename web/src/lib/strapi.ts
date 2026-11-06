import type { Homepage, Media, SiteSetting } from "./types";

/** Server-side base URL (private network on Railway). */
const STRAPI_URL = process.env.STRAPI_URL ?? "http://localhost:1337";
/** Browser-facing base URL used to resolve /uploads/... media paths. */
const PUBLIC_STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? STRAPI_URL;

/** Single cache tag; the Strapi publish hook revalidates it via /api/revalidate. */
export const CMS_TAG = "strapi";

async function getSingle<T>(path: string): Promise<T> {
  const res = await fetch(`${STRAPI_URL}/api/${path}`, {
    // Tag = instant updates on publish. 1h revalidate = safety net if the webhook is missed.
    next: { tags: [CMS_TAG], revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Strapi ${path} responded ${res.status}`);
  const json = (await res.json()) as { data: T };
  return json.data;
}

export const getHomepage = () => getSingle<Homepage>("homepage");
export const getSiteSetting = () => getSingle<SiteSetting>("site-setting");

/** Strapi returns relative upload paths with the local provider and absolute URLs with cloud ones. */
export const mediaUrl = (url: string) => (url.startsWith("http") ? url : `${PUBLIC_STRAPI_URL}${url}`);

/** Builds a srcSet from the formats Strapi generates, plus the original. */
export function mediaSrcSet(media: Media): string | undefined {
  const formats = Object.values(media.formats ?? {});
  if (!formats.length || !media.width) return undefined;
  return [...formats, { url: media.url, width: media.width }]
    .sort((a, b) => a.width - b.width)
    .map((f) => `${mediaUrl(f.url)} ${f.width}w`)
    .join(", ");
}
