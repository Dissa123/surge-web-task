import { mediaSrcSet, mediaUrl } from "@/lib/strapi";
import type { Media as MediaType } from "@/lib/types";

interface Props {
  media: MediaType | null | undefined;
  alt?: string | null;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

/** Plain <img> with srcset built from the formats Strapi generates (no image-optimizer round trip). */
export function Media({ media, alt, className, priority, sizes = "100vw" }: Props) {
  if (!media) return null;
  const isSvg = media.mime === "image/svg+xml";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={mediaUrl(media.url)}
      srcSet={isSvg ? undefined : mediaSrcSet(media)}
      sizes={isSvg ? undefined : sizes}
      width={media.width ?? undefined}
      height={media.height ?? undefined}
      alt={alt ?? media.alternativeText ?? ""}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
    />
  );
}
