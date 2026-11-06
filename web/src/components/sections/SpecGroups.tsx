"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";

interface Group {
  title: string;
  items: { text: string }[];
}

/** Line icons, cycled by group index (nib / capture target / sync). Decorative only. */
const ICONS = [
  <svg key="nib" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 6.5 10c-.8 1.2-.8 2.8 0 4l5.5 7.5L17.5 14c.8-1.2.8-2.8 0-4L12 2.5Z" /><circle cx="12" cy="11" r="1.4" /><path d="M12 12.5V19" /></svg>,
  <svg key="target" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>,
  <svg key="sync" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 0 0-14.3-4.6L4 8.5M4 13a8 8 0 0 0 14.3 4.6L20 15.5" /><path d="M4 4v4.5h4.5M20 20v-4.5h-4.5" /></svg>,
];

/**
 * Animated spec cards. Rows reveal in a stagger when the grid scrolls into view, the cursor drives a
 * soft spotlight and a rotating border on hover, and on small screens the cards become an accordion.
 */
export function SpecGroups({ groups }: { groups: Group[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [open, setOpen] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const track = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <div ref={ref} className={`sg-grid${inView ? " is-in" : ""}`}>
      {groups.map((g, gi) => {
        const isOpen = open === gi;
        return (
          <article key={g.title} className={`sg${isOpen ? " is-open" : ""}`} style={{ "--ci": gi } as CSSProperties} onPointerMove={track}>
            <button className="sg__head" type="button" aria-expanded={isOpen} aria-controls={`sg-${gi}`} onClick={() => setOpen(isOpen ? -1 : gi)}>
              <span className="sg__num">{String(gi + 1).padStart(2, "0")}</span>
              <span className="sg__icon">{ICONS[gi % ICONS.length]}</span>
              <h3 className="sg__title">{g.title}</h3>
              <span className="sg__count">{String(g.items.length).padStart(2, "0")}</span>
              <span className="sg__chev" aria-hidden="true" />
            </button>
            <ul id={`sg-${gi}`} className="sg__list">
              {g.items.map((it, i) => (
                <li key={it.text} style={{ "--i": i } as CSSProperties}>
                  <span className="sg__idx">{String.fromCharCode(97 + i)}</span>
                  <span className="sg__text">{it.text}</span>
                  <span className="sg__arrow" aria-hidden="true">→</span>
                </li>
              ))}
            </ul>
          </article>
        );
      })}
    </div>
  );
}
