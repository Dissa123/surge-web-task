"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { mediaUrl } from "@/lib/strapi";
import type { SiteSetting } from "@/lib/types";
import { SubscribeForm } from "./SubscribeForm";

const OrderContext = createContext<{ open: () => void }>({ open: () => {} });
export const useOrder = () => useContext(OrderContext);

/** Owns the Order / "Stay ahead" popup so the header and any section can open it. */
export function OrderProvider({ settings, children }: { settings: SiteSetting; children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  const open = useCallback(() => {
    lastFocused.current = document.activeElement as HTMLElement | null;
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);

  // <dialog> gives us focus trapping, ESC and an inert background for free.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
      document.documentElement.classList.add("is-locked");
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
    if (!isOpen) {
      document.documentElement.classList.remove("is-locked");
      lastFocused.current?.focus();
    }
  }, [isOpen]);

  const { orderPopupImage: img, orderPopupImageTablet: tablet, orderPopupImageMobile: mobile } = settings;

  return (
    <OrderContext.Provider value={{ open }}>
      {children}
      <dialog
        ref={dialogRef}
        className="order" data-lenis-prevent
        aria-labelledby="order-title"
        onClose={close}
        onClick={(e) => e.target === dialogRef.current && close()}
      >
        <div className="order__panel">
          <button className="order__close" type="button" onClick={close} aria-label={settings.closeLabel}>
            <span aria-hidden="true">×</span>
          </button>
          {img && (
            <picture className="order__media">
              {mobile && <source media="(max-width: 640px)" srcSet={mediaUrl(mobile.url)} />}
              {tablet && <source media="(max-width: 1024px)" srcSet={mediaUrl(tablet.url)} />}
              <img src={mediaUrl(img.url)} alt={img.alternativeText ?? settings.productName} />
            </picture>
          )}
          <div className="order__body">
            <p className="order__product">
              {settings.productName} <span>{settings.price}</span>
            </p>
            <h2 id="order-title" className="order__title">
              {settings.subscribeTitle}
            </h2>
            {settings.subscribeText && <p className="order__text">{settings.subscribeText}</p>}
            {isOpen && <SubscribeForm settings={settings} />}
          </div>
        </div>
      </dialog>
    </OrderContext.Provider>
  );
}
