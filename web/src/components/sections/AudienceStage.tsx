"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type * as THREE from "three";
import { PEN_CENTER_Y, PEN_LEN, buildPen, createStudio } from "@/lib/pen3d";

/**
 * "Who it's for" scene: the same live 3D pen as the hero, in a bright white studio so it keeps the
 * look of the product photograph it replaces. The pen flies in when the section is reached, then
 * rotates slowly around its own axis, floats, tilts toward the cursor and drifts with scroll. A soft
 * contact shadow breathes with the float. `children` is the CMS photo: first paint / no-WebGL fallback.
 */
export function AudienceStage({ children }: { src?: string | null; children?: ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const inViewRef = useRef(false);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const nearIO = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "500px" });
    const viewIO = new IntersectionObserver(([e]) => void (inViewRef.current = e.isIntersecting), { threshold: 0.3 });
    nearIO.observe(el);
    viewIO.observe(el);
    return () => {
      nearIO.disconnect();
      viewIO.disconnect();
    };
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    const stage = stageRef.current;
    if (!near || !mount || !stage) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const T = await import("three");
      if (disposed) return;
      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      } catch {
        return; // no WebGL: the CMS photo stays
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
      scene.add(rig);

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
      let scrollP = 0;
      let visible = true;
      let raf = 0;
      let w = 1, h = 1;
      let t0: number | null = null;

      const layout = () => {
        w = mount.clientWidth;
        h = mount.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };

      const frame = (now: number) => {
        raf = 0;
        if (t0 === null && inViewRef.current) t0 = now;
        const intro = reduced ? 1 : t0 === null ? 0 : Math.min(Math.max(now - t0, 0) / 2200, 1);
        const e = 1 - Math.pow(1 - intro, 4); // easeOutQuart
        const s = reduced ? 0 : now / 1000;

        const mobile = w < 700;
        const viewH = 2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360);
        const viewW = viewH * camera.aspect;
        const scale = ((mobile ? 1.55 : 1.14) * viewW) / PEN_LEN;
        rig.scale.setScalar(scale);
        const nibX = -viewW / 2 + viewW * (mobile ? 0.06 : 0.09);
        rig.position.x = nibX + (PEN_LEN * scale) / 2 - (scrollP - 0.5) * viewW * 0.12 + (1 - e) * viewW * 0.7;
        rig.position.y = Math.sin(s * 0.9) * 0.12 + (1 - e) * -viewH * 0.06;

        pointer.sx += (pointer.x - pointer.sx) * 0.06;
        pointer.sy += (pointer.y - pointer.sy) * 0.06;
        rig.rotation.z = -Math.PI / 2 + Math.sin(s * 0.6) * 0.025 + pointer.sy * 0.05; // nib on the left, gentle sway
        rig.rotation.y = pointer.sx * 0.12;
        // Slow continuous roll around the pen's own axis reveals the cap flutes, clip and button.
        spin.rotation.y = 0.35 + s * 0.28 + scrollP * Math.PI * 0.8 + pointer.sx * 0.3 + (1 - e) * Math.PI * 1.6;

        stage.style.setProperty("--float", Math.sin(s * 0.9).toFixed(3));
        renderer.render(scene, camera);
        if (visible && (intro < 1 || !reduced)) raf = requestAnimationFrame(frame);
      };
      const kick = () => {
        if (!raf) raf = requestAnimationFrame(frame);
      };
      const onMove = (ev: PointerEvent) => {
        const r = mount.getBoundingClientRect();
        pointer.x = Math.max(-1, Math.min(1, ((ev.clientX - r.left) / r.width) * 2 - 1));
        pointer.y = Math.max(-1, Math.min(1, ((ev.clientY - r.top) / r.height) * 2 - 1));
        kick();
      };
      const onScroll = () => {
        const r = stage.getBoundingClientRect();
        scrollP = Math.min(Math.max(1 - (r.top + r.height / 2) / window.innerHeight, 0), 1);
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
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onResize);
      kick();
      setReady(true);

      cleanup = () => {
        if (raf) cancelAnimationFrame(raf);
        io.disconnect();
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("scroll", onScroll);
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
  }, [near]);

  return (
    <div ref={stageRef} className={`aud-stage${ready ? " is-ready" : ""}`}>
      <div className="aud-stage__fallback">{children}</div>
      <div className="aud-stage__shadow" aria-hidden="true" />
      <div ref={mountRef} className="aud-stage__canvas" aria-hidden="true" />
    </div>
  );
}
