"use client";

import { useEffect, useState } from "react";
import { Media } from "./Media";
import { useOrder } from "./OrderModal";
import type { SiteSetting } from "@/lib/types";

export function Header({ settings }: { settings: SiteSetting }) {
  const { open: openOrder } = useOrder();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("is-locked", menuOpen);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className={`header${menuOpen ? " header--menu" : ""}`}>
      {/* Brand + nav use mix-blend-mode: difference so they stay legible over dark and white scenes. */}
      <div className="header__brand">
        <a className="header__wordmark" href="#top" aria-label={settings.siteName}>
          {settings.siteName}
        </a>
        <nav id="primary-nav" className="header__nav" aria-label="Primary" data-lenis-prevent>
          {settings.navLinks.map((l) => (
            <a key={l.url} href={l.url} onClick={() => setMenuOpen(false)}>
              {l.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="header__right">
        <div className="orderbar">
          {settings.logo && <Media className="orderbar__logo" media={settings.logo} alt="" priority />}
          <button
            className="orderbar__btn"
            type="button"
            onPointerMove={(e) => {
              // Magnetic pull toward the cursor.
              const r = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
            }}
            onPointerLeave={(e) => (e.currentTarget.style.transform = "")}
            onClick={() => {
              setMenuOpen(false);
              openOrder();
            }}
          >
            {settings.orderLabel} <span className="orderbar__name">{settings.productName}</span>
            <i aria-hidden="true" />
            {settings.price}
          </button>
        </div>
        <button
          className="header__burger"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="primary-nav"
          aria-label={menuOpen ? settings.closeLabel : "Menu"}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
