import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { OrderProvider } from "@/components/OrderModal";
import { SectionRenderer } from "@/components/sections/SectionRenderer";
import { getHomepage, getSiteSetting } from "@/lib/strapi";

// Rendered per request; Strapi data is served from the tagged fetch cache (see lib/strapi.ts).
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [page, settings] = await Promise.all([getHomepage(), getSiteSetting()]);

  return (
    <OrderProvider settings={settings}>
      <Header settings={settings} />
      <main id="top">
        <SectionRenderer sections={page.sections} settings={settings} />
      </main>
      <Footer settings={settings} />
    </OrderProvider>
  );
}
