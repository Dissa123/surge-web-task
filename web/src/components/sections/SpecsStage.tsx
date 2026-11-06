"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { DustField } from "../DustField";
import { PhotoSheen } from "../PhotoSheen";

/**
 * Where each part sits on the pen photograph (% of width / height) and which side its label opens to.
 * The photograph is the CMS "Specifications" image: a vertical pen, nib up.
 */
const PARTS: Record<string, { x: number; y: number; side: "left" | "right" }> = {
  nib: { x: 46, y: 3.5, side: "right" },
  grip: { x: 40, y: 25, side: "left" },
  button: { x: 65, y: 32.5, side: "right" },
  body: { x: 46, y: 60, side: "left" },
  clip: { x: 83, y: 93, side: "right" },
  cap: { x: 30, y: 89, side: "left" },
};

export interface PartMark {
  part: string;
  label: string;
  text: string | null;
}

/**
 * Specifications scene on the real pen photo: a travelling specular glint plays over the metal and
 * editable part marks (pulse ring, drawn leader line, label card) animate in once the pen is on screen.
 * `children` is the static <img>; `src` is the same image's absolute URL for the shader.
 */
export function SpecsStage({ markers, src, children }: { markers: PartMark[]; src: string | null; children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

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
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`specs-stage${inView ? " is-in" : ""}`}>
      <DustField className="dust--specs" tone="dark" layer="front" count={34} />
      <div className="specs-stage__pen">
        <div className="specs-stage__photo">{src ? <PhotoSheen src={src} sheen={0.9} angle={1.45} scrollLink tilt>{children}</PhotoSheen> : children}</div>
        <div className="specs-stage__scan" aria-hidden="true" />
        <ul className="specs-stage__marks">
          {markers.map((m, i) => {
            const p = PARTS[m.part];
            if (!p) return null;
            return (
              <li key={`${m.part}-${i}`} className={`mark mark--${p.side}`} style={{ left: `${p.x}%`, top: `${p.y}%`, "--i": i } as CSSProperties}>
                <span className="mark__dot" />
                <span className="mark__line" />
                <span className="mark__card">
                  <strong>{m.label}</strong>
                  {m.text && <span>{m.text}</span>}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
