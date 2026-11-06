"use client";

import { useEffect, useRef } from "react";
import type * as THREE from "three";
import { PEN_CENTER_Y, PEN_LEN, buildPen, createStudio } from "@/lib/pen3d";

/** Pen-local Y of the points the hero callouts attach to (all on the pen axis, so spin doesn't move them). */
const ANCHORS_Y = [-3.9, 0.2, 9.9];

/**
 * Hero pen: lies horizontally with the nib on the left, flies in on load, spins around its own axis as
 * the hero is scrolled and tilts toward the pointer. The screen position of three anchor points is
 * written to CSS variables (--a0x/--a0y …) on the hero so DOM callouts can follow the pen.
 * three.js is loaded lazily; `onReady` lets the hero hide the static fallback image.
 */
export function PenScene({ onReady }: { onReady: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const T = await import("three");
      if (disposed) return;

      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      } catch {
        return; // no WebGL: the static image stays
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = T.ACESFilmicToneMapping;
      mount.appendChild(renderer.domElement);

      const scene = new T.Scene();
      const camera = new T.PerspectiveCamera(24, 1, 0.1, 100);
      camera.position.z = 20;
      const disposeStudio = await createStudio(T, renderer, scene);
      if (disposed) {
        disposeStudio();
        renderer.dispose();
        return;
      }

      const model = buildPen(T);
      const { pen } = model;
      pen.position.y = -PEN_CENTER_Y;
      const spin = new T.Group();
      spin.add(pen);
      const rig = new T.Group();
      rig.add(spin);
      rig.rotation.z = -Math.PI / 2; // nib on the left
      scene.add(rig);

      const hero = document.getElementById("top");
      const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
      const anchor = new T.Vector3();
      let progress = 0;
      let visible = true;
      let raf = 0;
      let w = 1, h = 1;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const introMs = reduced ? 0 : 2000;
      let t0 = performance.now();

      const layout = () => {
        w = mount.clientWidth;
        h = mount.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };

      const frame = (now: number) => {
        raf = 0;
        const mobile = w < 860;
        const intro = introMs ? Math.min(Math.max(now - t0, 0) / introMs, 1) : 1;
        const e = 1 - Math.pow(1 - intro, 4); // easeOutQuart
        const viewH = 2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360);
        const viewW = viewH * camera.aspect;
        const s = ((mobile ? 1.75 : 0.98) * viewW) / PEN_LEN;
        rig.scale.setScalar(s);
        const nibX = -viewW / 2 + viewW * (mobile ? 0.08 : 0.23);
        rig.position.x = nibX + (PEN_LEN * s) / 2 - progress * viewW * (mobile ? 0.5 : 0.34) + (1 - e) * viewW * 0.55;
        rig.position.y = (mobile ? viewH * 0.06 : 0) + (1 - e) * viewH * 0.04;

        pointer.sx += (pointer.x - pointer.sx) * 0.06;
        pointer.sy += (pointer.y - pointer.sy) * 0.06;
        spin.rotation.y = 0.25 + progress * Math.PI * 1.1 + pointer.sx * 0.35 + (1 - e) * Math.PI * 1.4;
        rig.rotation.x = pointer.sy * 0.08;
        rig.rotation.y = pointer.sx * 0.12;

        renderer.render(scene, camera);

        // Publish anchor screen positions for the DOM callouts.
        if (hero) {
          rig.updateMatrixWorld(true);
          ANCHORS_Y.forEach((y, i) => {
            anchor.set(0, y, 0);
            pen.localToWorld(anchor).project(camera);
            hero.style.setProperty(`--a${i}x`, `${((anchor.x * 0.5 + 0.5) * w).toFixed(1)}px`);
            hero.style.setProperty(`--a${i}y`, `${((-anchor.y * 0.5 + 0.5) * h).toFixed(1)}px`);
          });
        }
        if (visible && (intro < 1 || !reduced)) raf = requestAnimationFrame(frame);
      };
      const kick = () => {
        if (!raf) raf = requestAnimationFrame(frame);
      };

      const onScroll = () => {
        if (!hero) return;
        const range = hero.offsetHeight - window.innerHeight;
        progress = range > 0 ? Math.min(Math.max(-hero.getBoundingClientRect().top / range, 0), 1) : 0;
        kick();
      };
      const onMove = (ev: PointerEvent) => {
        pointer.x = (ev.clientX / window.innerWidth) * 2 - 1;
        pointer.y = (ev.clientY / window.innerHeight) * 2 - 1;
        kick();
      };
      const onResize = () => {
        layout();
        kick();
      };

      const io = new IntersectionObserver(([en]) => {
        visible = en.isIntersecting;
        if (visible) kick();
      });
      io.observe(mount);

      layout();
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("resize", onResize);
      t0 = performance.now();
      kick();
      onReady();

      cleanup = () => {
        if (raf) cancelAnimationFrame(raf);
        io.disconnect();
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("resize", onResize);
        model.dispose();
        disposeStudio();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [onReady]);

  return <div ref={mountRef} className="hero__canvas" aria-hidden="true" />;
}
