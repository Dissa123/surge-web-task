import type { Metadata, Viewport } from "next";
import { DM_Mono, Inter, Instrument_Serif } from "next/font/google";
import { getHomepage, mediaUrl } from "@/lib/strapi";
import { SmoothScroll } from "@/components/SmoothScroll";
import "./globals.css";

const sans = Inter({ subsets: ["latin", "cyrillic"], display: "swap", variable: "--font-sans" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], display: "swap", variable: "--font-serif" });
const mono = DM_Mono({ subsets: ["latin"], weight: "400", display: "swap", variable: "--font-mono" });

export const viewport: Viewport = { themeColor: "#0b0b0c", width: "device-width", initialScale: 1 };

/** All SEO meta comes from Strapi. Assignment rule: the site must stay noindex, which is the CMS default. */
export async function generateMetadata(): Promise<Metadata> {
  const seo = await getHomepage().then((h) => h.seo).catch(() => null);
  // CMS unreachable (e.g. during build): keep the site noindex and let the page itself surface the error.
  if (!seo) return { title: "NŌTA", robots: { index: false, follow: false } };
  return {
    metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
    title: seo.metaTitle,
    description: seo.metaDescription,
    robots: seo.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: seo.metaTitle,
      description: seo.metaDescription,
      images: seo.ogImage ? [mediaUrl(seo.ogImage.url)] : undefined,
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
