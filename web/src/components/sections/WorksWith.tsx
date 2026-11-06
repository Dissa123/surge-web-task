"use client";

import { useEffect } from "react";
import { Media } from "../Media";
import { mediaUrl } from "@/lib/strapi";
import { useCarousel } from "../useCarousel";
import { PatternScene } from "./PatternScene";
import type { WorksWithSection } from "@/lib/types";

const AUTOPLAY_MS = 6000;

export function WorksWith({ section }: { section: WorksWithSection }) {
  const { slides } = section;
  const { index, goTo, next, handlers } = useCarousel(slides.length);
  const srcs = slides.map((s) => (s.desktopImage ? mediaUrl(s.desktopImage.url) : "")).filter(Boolean);

  // Autoplay; restarts whenever the slide changes (so manual navigation resets the timer).
  useEffect(() => {
    if (slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(next, AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [index, next, slides.length]);

  return (
    <>
      {section.label && (
        <section className="works-intro">
          <p>{section.label}</p>
        </section>
      )}
      <section id={section.anchor ?? undefined} className="works" role="group" aria-roledescription="carousel" aria-label={section.title} tabIndex={0} {...handlers}>
        <div className="works__stage">
          {srcs.length === slides.length && <PatternScene srcs={srcs} index={index} onPick={goTo} />}
          {slides.map((s, i) => (
            <figure key={i} className={`works__slide${i === index ? " is-active" : ""}`} aria-hidden={i !== index}>
              <picture>
                {s.mobileImage && <source media="(max-width: 640px)" srcSet={mediaUrl(s.mobileImage.url)} />}
                <Media media={s.desktopImage} alt={s.alt} sizes="100vw" />
              </picture>
            </figure>
          ))}
        </div>
        <h2 className="works__title">{section.title}</h2>
        <div className="works__card glass">
          {section.subtitle && <h3>{section.subtitle}</h3>}
          {section.body && <p>{section.body}</p>}
        </div>
        <div className="progress" role="tablist" aria-label="Slides">
          {slides.map((_, i) => (
            <button key={i} type="button" role="tab" aria-selected={i === index} aria-label={`Slide ${i + 1} of ${slides.length}`} className={i === index ? "is-active" : i < index ? "is-done" : ""} onClick={() => goTo(i)}>
              <span style={i === index ? { animationDuration: `${AUTOPLAY_MS}ms` } : undefined} />
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
