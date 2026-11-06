"use client";

import { Media } from "../Media";
import { Reveal } from "../Reveal";
import { useCarousel } from "../useCarousel";
import type { InsideBoxSection } from "@/lib/types";

/** "Impossible to overthink" -> ["Impossible to", "overthink"]; "Precision Red. Form follows thought." -> two sentences. */
function splitCaption(caption: string): [string, string] {
  const sentence = caption.match(/^(.+?\.)\s+(.+)$/);
  if (sentence) return [sentence[1], sentence[2]];
  const words = caption.split(" ");
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

export function InsideBox({ section }: { section: InsideBoxSection }) {
  const { colors } = section;
  const { index, goTo, next, prev, handlers } = useCarousel(colors.length);

  return (
    <>
      <section id={section.anchor ?? undefined} className="box">
        <Reveal as="h2" className="box__title">
          {section.title}
        </Reveal>
        {section.description && <Reveal as="p" className="box__desc">{section.description}</Reveal>}

        <div className="box__tiles">
          {section.tiles.map((t, i) => (
            <Reveal key={t.label} className={`tile tile--${i + 1}`} delay={i * 80}>
              <Media media={t.image} alt="" sizes="(max-width: 860px) 100vw, 50vw" />
              <span className="pill">{t.label}</span>
            </Reveal>
          ))}
        </div>

        <div className="box__set">
          <div className="box__setcopy">
            {section.heading && <h3>{section.heading}</h3>}
            {section.intro && <p>{section.intro}</p>}
          </div>
          <div className="box__products">
            {section.products.map((p) => (
              <article key={p.title}>
                <Media media={p.image} alt="" sizes="(max-width: 860px) 100vw, 30vw" />
                <h4>{p.title}</h4>
                <p>{p.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {colors.length > 0 && (
        <section className="colors" role="group" aria-roledescription="carousel" aria-label="Colours" tabIndex={0} {...handlers}>
          {colors.map((c, i) => {
            const [left, right] = splitCaption(c.caption);
            return (
              <div key={c.name} className={`colors__frame${i === index ? " is-active" : ""}`} aria-hidden={i !== index}>
                <Media media={c.image} alt={c.name} sizes="100vw" />
                <p className="colors__caption">
                  <span>{left}</span>
                  <span>{right}</span>
                </p>
              </div>
            );
          })}
          <button type="button" className="colors__arrow colors__arrow--prev" onClick={prev} aria-label="Previous colour">
            ←
          </button>
          <button type="button" className="colors__arrow colors__arrow--next" onClick={next} aria-label="Next colour">
            →
          </button>
          <div className="progress progress--light" role="tablist" aria-label="Colours">
            {colors.map((c, i) => (
              <button key={c.name} type="button" role="tab" aria-selected={i === index} aria-label={c.name} className={i <= index ? "is-done" : ""} onClick={() => goTo(i)}>
                <span />
              </button>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
