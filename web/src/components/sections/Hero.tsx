"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Media } from "../Media";
import { PenScene } from "./PenScene";
import type { HeroSection } from "@/lib/types";

/**
 * Cinematic hero: grey studio scene with grain, vignette and a slow light sweep; a live three.js pen
 * (see PenScene) that flies in, spins on scroll and carries editable callouts; masked headline reveal.
 * The CMS pen image is the fallback for no-WebGL and the first paint.
 * Scroll progress through the taller-than-viewport hero is exposed as the CSS variable --p (0..1).
 */
export function Hero({ section }: { section: HeroSection }) {
  const ref = useRef<HTMLElement>(null);
  const [webgl, setWebgl] = useState(false);
  const onReady = useCallback(() => setWebgl(true), []);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const range = el.offsetHeight - window.innerHeight;
      const p = range > 0 ? Math.min(Math.max(-el.getBoundingClientRect().top / range, 0), 1) : 0;
      el.style.setProperty("--p", p.toFixed(4));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section id="top" ref={ref} className={`hero${webgl ? " hero--webgl" : ""}`}>
      <div className="hero__stage">
        <div className="hero__light" aria-hidden="true" />
        <div className="hero__pen">
          <Media media={section.image} alt={section.imageAlt} priority sizes="40vw" />
        </div>
        <PenScene onReady={onReady} />

        {webgl &&
          section.callouts.slice(0, 3).map((c, i) => (
            <div key={c.label} className={`callout callout--${i}`} aria-hidden="true">
              <div className="callout__inner">
                <i />
                <p>
                  <strong>{c.label}</strong>
                  {c.text && <span>{c.text}</span>}
                </p>
              </div>
            </div>
          ))}

        <h1 className="hero__title">
          {section.eyebrow && (
            <span className="line">
              <span>{section.eyebrow}</span>
            </span>
          )}
          <span className="line">
            <span>{section.title}</span>
          </span>
        </h1>

        {section.scrollLabel && (
          <a className="hero__scroll" href="#specifications">
            <span>{section.scrollLabel}</span>
            <i aria-hidden="true" />
          </a>
        )}
      </div>
    </section>
  );
}
