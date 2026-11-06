import { Media } from "../Media";
import { mediaUrl } from "@/lib/strapi";
import { Reveal } from "../Reveal";
import { ScrollLede } from "../ScrollLede";
import { DustField } from "../DustField";
import { AudienceStage } from "./AudienceStage";
import { BookScene } from "./BookScene";
import { PaperScene } from "./PaperScene";
import { DepthScene } from "./DepthScene";
import { SpecGroups } from "./SpecGroups";
import { SpecsStage } from "./SpecsStage";
import type {
  AudienceSection,
  ClosingSection,
  FeatureBlockSection,
  SiteSetting,
  SpecificationsSection,
} from "@/lib/types";

export function Specifications({ section }: { section: SpecificationsSection }) {
  return (
    <section id={section.anchor ?? undefined} className="specs">
      <Reveal className="specs__head">
        {section.eyebrow && <p className="specs__eyebrow">{section.eyebrow}</p>}
        <h2 className="specs__title">{section.title}</h2>
      </Reveal>
      <SpecsStage markers={section.markers} src={section.image ? mediaUrl(section.image.url) : null}>
        <Media className="specs__pen" media={section.image} alt={section.imageAlt} sizes="(max-width: 768px) 40vw, 18vw" />
      </SpecsStage>
      <SpecGroups groups={section.groups} />
    </section>
  );
}

export function Audience({ section }: { section: AudienceSection }) {
  return (
    <section id={section.anchor ?? undefined} className="audience">
      {section.lede && <ScrollLede className="audience__lede" text={section.lede} />}
      <div className="audience__row">
        <h2 className="audience__label">{section.title}</h2>
        {section.intro && <p className="audience__intro">{section.intro}</p>}
      </div>
      <AudienceStage>
        <Media className="audience__image" media={section.image} alt={section.imageAlt} sizes="(max-width: 860px) 100vw, 90vw" />
      </AudienceStage>
      <div className="audience__cards">
        {section.cards.map((c, i) => (
          <Reveal as="article" key={c.title} className="card" delay={i * 100}>
            <h3>{c.title}</h3>
            <p>{c.text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/** Full-viewport scene: image behind, serif title top-left, frosted card bottom-right. */
export function FeatureBlock({ section }: { section: FeatureBlockSection }) {
  const isBook = Boolean(section.bookScene && section.image && section.coverImage);
  const isPaper = Boolean(section.paperScene && section.image && section.paperImage);
  const pinned = isBook || isPaper; // scroll-scrubbed 3D scenes share one sticky layout
  return (
    <>
      <section id={section.anchor ?? undefined} className={`scene${pinned ? " scene--book" : ""}`}>
        {pinned && section.image ? (
          <div className="scene__sticky">
            <div className="scene__bg">
              {isBook && section.coverImage ? (
                <BookScene coverSrc={mediaUrl(section.coverImage.url)} pagesSrc={mediaUrl(section.image.url)}>
                  <Media media={section.image} alt={section.imageAlt} sizes="100vw" />
                </BookScene>
              ) : section.paperImage ? (
                <PaperScene paperSrc={mediaUrl(section.paperImage.url)}>
                  <Media media={section.image} alt={section.imageAlt} sizes="100vw" />
                </PaperScene>
              ) : null}
            </div>
            <DustField className="dust--scene" tone="light" layer="front" count={36} />
            <div className="scene__title">
              {section.eyebrow && <p>{section.eyebrow}</p>}
              <h2>{section.title}</h2>
            </div>
            {(section.subtitle || section.body) && (
              <div className="scene__card glass scene__card--late">
                {section.subtitle && <h3>{section.subtitle}</h3>}
                {section.body && <p>{section.body}</p>}
              </div>
            )}
          </div>
        ) : section.depthScene && section.image ? (
          <>
            <div className="scene__bg">
              <DepthScene src={mediaUrl(section.image.url)}>
                <Media media={section.image} alt={section.imageAlt} sizes="100vw" />
              </DepthScene>
            </div>
            <DustField className="dust--scene" tone="light" layer="front" count={40} />
          </>
        ) : (
          <Media className="scene__bg" media={section.image} alt={section.imageAlt} sizes="100vw" />
        )}
        {!pinned && (
          <div className="scene__title">
            {section.eyebrow && <p>{section.eyebrow}</p>}
            <h2>{section.title}</h2>
          </div>
        )}
        {!pinned && (section.subtitle || section.body) && (
          <Reveal className="scene__card glass">
            {section.subtitle && <h3>{section.subtitle}</h3>}
            {section.body && <p>{section.body}</p>}
          </Reveal>
        )}
      </section>
      {section.secondImage && (
        <section className="scene scene--plain">
          <Media className="scene__bg" media={section.secondImage} alt={section.secondImageAlt} sizes="100vw" />
        </section>
      )}
    </>
  );
}

export function Closing({ section, settings }: { section: ClosingSection; settings: SiteSetting }) {
  return (
    <section className="closing">
      <p className="closing__text">{section.text}</p>
      <nav className="closing__col" aria-label="Footer">
        <p className="closing__label">Navigation</p>
        {settings.navLinks.map((l) => (
          <a key={l.url} href={l.url}>
            {l.label}
          </a>
        ))}
      </nav>
      <div className="closing__col closing__col--end">
        <p className="closing__label">{settings.footerYearLabel}</p>
        <p>{settings.footerYear}</p>
      </div>
    </section>
  );
}
