"use client";

import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

/** Index state + arrow keys + horizontal swipe, shared by both carousels. */
export function useCarousel(length: number) {
  const [index, setIndex] = useState(0);
  const startX = useRef<number | null>(null);

  const goTo = useCallback((i: number) => setIndex(((i % length) + length) % length), [length]);
  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  const handlers = {
    onPointerDown: (e: PointerEvent) => {
      startX.current = e.clientX;
    },
    onPointerUp: (e: PointerEvent) => {
      if (startX.current === null) return;
      const dx = e.clientX - startX.current;
      startX.current = null;
      if (Math.abs(dx) > 48) (dx < 0 ? next : prev)();
    },
    onPointerCancel: () => {
      startX.current = null;
    },
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    },
  };

  return { index, goTo, next, prev, handlers };
}
