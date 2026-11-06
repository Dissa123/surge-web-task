import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The page is rendered per request on top of tagged fetch caching (see src/lib/strapi.ts),
  // so the build never needs the CMS to be online.
};

export default nextConfig;
