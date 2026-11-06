import type { Section, SiteSetting } from "@/lib/types";
import { Audience, Closing, FeatureBlock, Specifications } from "./StaticSections";
import { Hero } from "./Hero";
import { InsideBox } from "./InsideBox";
import { WorksWith } from "./WorksWith";

/** Maps each Strapi dynamic-zone component to its React section. Order comes from the CMS. */
export function SectionRenderer({ sections, settings }: { sections: Section[]; settings: SiteSetting }) {
  return (
    <>
      {sections.map((s, i) => {
        switch (s.__component) {
          case "sections.hero":
            return <Hero key={i} section={s} />;
          case "sections.specifications":
            return <Specifications key={i} section={s} />;
          case "sections.audience":
            return <Audience key={i} section={s} />;
          case "sections.feature-block":
            return <FeatureBlock key={i} section={s} />;
          case "sections.works-with":
            return <WorksWith key={i} section={s} />;
          case "sections.inside-box":
            return <InsideBox key={i} section={s} />;
          case "sections.closing":
            return <Closing key={i} section={s} settings={settings} />;
          default:
            return null;
        }
      })}
    </>
  );
}
