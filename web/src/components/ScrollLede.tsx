"use client";

import { useEffect, useRef } from "react";

/** Paragraph whose words light up one after another as it scrolls through the viewport. */
export function ScrollLede({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = text.split(/\s+/);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const spans = Array.from(el.querySelectorAll<HTMLElement>("[data-w]"));
    const n = spans.length;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(Math.max((vh * 0.88 - r.top) / (r.height + vh * 0.3), 0), 1);
      spans.forEach((s, i) => {
        const o = Math.min(Math.max(((p * (1 + 6 / n) - i / n) * n) / 6, 0), 1);
        s.style.opacity = String(0.16 + 0.84 * o);
      });
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
    <p ref={ref} className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} data-w aria-hidden="true">
          {w}{" "}
        </span>
      ))}
    </p>
  );
}
