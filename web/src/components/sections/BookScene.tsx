"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type * as THREE from "three";
import { createStudio } from "@/lib/pen3d";

/**
 * Scroll-driven 3D notebook. The section is pinned (sticky) and the scroll position scrubs a timeline:
 *   0 – .16  the closed cover floats at a three-quarter angle (real photo of the cover as texture)
 *   .16 – .64 the cover swings open on its spine while the book straightens to a top-down view
 *   .64 – 1  the open spread (real photo of the pages) holds; the CMS card fades in via --bp
 * Cover and pages are crops of the two CMS photographs, so the brand imagery is never replaced by
 * generated art. `children` is the static fallback photo (SEO / first paint / no-WebGL).
 */

// Crops (pixels in the 1920×1080 source photographs).
const COVER_RECT = [722, 152, 1236, 872] as const; // closed notebook, top-down
const LEFT_RECT = [505, 208, 960, 866] as const; // open spread: left page
const RIGHT_RECT = [962, 208, 1432, 866] as const; // open spread: right page
const REF = { w: 1920, h: 1080 };

const W = 3; // page width
const H = 4.2; // page height (matches the photographed notebook, ~0.714)
const B = 0.15; // thickness of each page stack
const C = 0.07; // cover board thickness

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function BookScene({ coverSrc, pagesSrc, children }: { coverSrc: string; pagesSrc: string; children: ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!near || !wrap) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const T = await import("three");
      if (disposed) return;
      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      } catch {
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = T.ACESFilmicToneMapping;

      const loader = new T.TextureLoader();
      loader.setCrossOrigin("anonymous");
      const load = (u: string) => new Promise<THREE.Texture | null>((res) => loader.load(u, res, undefined, () => res(null)));
      const [coverTex, pagesTex] = await Promise.all([load(coverSrc), load(pagesSrc)]);
      if (disposed || !coverTex || !pagesTex) {
        coverTex?.dispose();
        pagesTex?.dispose();
        renderer.dispose();
        return; // CORS / network problem: the static photograph simply stays
      }

      const scene = new T.Scene();
      const camera = new T.PerspectiveCamera(30, 1, 0.1, 100);
      camera.position.z = 22;
      const disposeStudio = await createStudio(T, renderer, scene);
      scene.environmentIntensity = 0.45;
      const spot = new T.PointLight(0xffffff, 0, 60);
      spot.position.set(-3, 5, 9);
      scene.add(spot);

      // ---- textures: crop the photographs ----
      const crop = (src: THREE.Texture, r: readonly [number, number, number, number]) => {
        const t = src.clone();
        t.colorSpace = T.SRGBColorSpace;
        t.anisotropy = 8;
        t.repeat.set((r[2] - r[0]) / REF.w, (r[3] - r[1]) / REF.h);
        t.offset.set(r[0] / REF.w, 1 - r[3] / REF.h);
        t.needsUpdate = true;
        return t;
      };
      const coverMap = crop(coverTex, COVER_RECT);
      const leftMap = crop(pagesTex, LEFT_RECT);
      const rightMap = crop(pagesTex, RIGHT_RECT);

      // paper edge: fine horizontal lines
      const ec = document.createElement("canvas");
      ec.width = 64;
      ec.height = 256;
      const eg = ec.getContext("2d")!;
      eg.fillStyle = "#e9e5db";
      eg.fillRect(0, 0, 64, 256);
      for (let y = 0; y < 256; y += 3) {
        eg.fillStyle = `rgba(90,85,70,${0.1 + ((y * 7) % 5) * 0.03})`;
        eg.fillRect(0, y, 64, 1);
      }
      const edgeTex = new T.CanvasTexture(ec);
      edgeTex.colorSpace = T.SRGBColorSpace;

      const matCover = new T.MeshPhysicalMaterial({ map: coverMap, roughness: 0.55, metalness: 0, clearcoat: 0.3, clearcoatRoughness: 0.45 });
      const matDark = new T.MeshStandardMaterial({ color: 0x0d0d0f, roughness: 0.65 });
      const matEdge = new T.MeshStandardMaterial({ map: edgeTex, roughness: 0.95 });
      const matLeft = new T.MeshBasicMaterial({ map: leftMap });
      const matRight = new T.MeshBasicMaterial({ map: rightMap });

      // ---- the book (spine at x = 0, lying in the XY plane, thickness along Z) ----
      const holder = new T.Group();
      const book = new T.Group();
      holder.add(book);
      scene.add(holder);

      const backCover = new T.Mesh(new T.BoxGeometry(W, H, C), matDark);
      backCover.position.set(W / 2, 0, -B - C / 2);
      book.add(backCover);

      // right page stack: +z face carries the right-hand page
      const rightStack = new T.Mesh(new T.BoxGeometry(W * 0.985, H * 0.985, B), [matEdge, matEdge, matEdge, matEdge, matRight, matDark]);
      rightStack.position.set(W / 2 - 0.02, 0, -B / 2);
      book.add(rightStack);

      // the leaf = left page stack (faces -z) + front cover (faces +z), hinged on the spine
      const leaf = new T.Group();
      const leftStack = new T.Mesh(new T.BoxGeometry(W * 0.985, H * 0.985, B), [matEdge, matEdge, matEdge, matEdge, matDark, matLeft]);
      leftStack.position.set(W / 2 - 0.02, 0, B / 2 + 0.002);
      const frontCover = new T.Mesh(new T.BoxGeometry(W, H, C), [matDark, matDark, matDark, matDark, matCover, matDark]);
      frontCover.position.set(W / 2, 0, B + C / 2 + 0.002);
      leaf.add(leftStack, frontCover);
      book.add(leaf);

      // ---- loop ----
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const section = wrap.closest<HTMLElement>(".scene--book");
      const pt = { x: 0, y: 0, sx: 0, sy: 0 };
      let target = reduced ? 1 : 0;
      let prog = target;
      let visible = true;
      let raf = 0;
      let w = 1, h = 1;

      const layout = () => {
        w = wrap.clientWidth || 1;
        h = wrap.clientHeight || 1;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };

      const frame = (now: number) => {
        raf = 0;
        prog += (target - prog) * (reduced ? 1 : 0.14);
        const p = prog;
        const s = now / 1000;

        const open = easeInOut(smooth(0.16, 0.64, p)); // cover angle
        const straight = smooth(0.1, 0.7, p); // camera framing: 3/4 view -> flat top-down

        // framing
        const viewH = 2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360);
        const viewW = viewH * camera.aspect;
        const sClosed = Math.min((0.62 * viewH) / H, (0.62 * viewW) / W);
        const sOpen = Math.min(((w < 700 ? 0.94 : 0.56) * viewW) / (2 * W), (0.7 * viewH) / H);
        const scale = sClosed + (sOpen - sClosed) * straight;
        holder.scale.setScalar(scale);

        book.position.x = (-W / 2) * (1 - open); // closed: cover centred; open: spread centred
        leaf.rotation.y = -Math.PI * open;
        leaf.position.z = Math.sin(Math.PI * open) * 0.5; // lifts as it swings so it never intersects the stack
        matLeft.color.setScalar(0.5 + 0.5 * smooth(0.5, 0.95, open)); // page face catches the light as it turns toward us

        pt.sx += (pt.x - pt.sx) * 0.06;
        pt.sy += (pt.y - pt.sy) * 0.06;
        const calm = 1 - straight * 0.7;
        holder.rotation.y = (-0.5 + 0.5 * straight) + Math.sin(s * 0.5) * 0.05 * calm + pt.sx * 0.14 * calm;
        holder.rotation.x = (0.28 - 0.28 * straight) + Math.cos(s * 0.4) * 0.025 * calm - pt.sy * 0.08 * calm;
        holder.position.y = Math.sin(s * 0.9) * 0.1 * calm * scale + (1 - straight) * 0.1;

        spot.intensity = 90 * (1 - straight * 0.6);
        section?.style.setProperty("--bp", p.toFixed(4));

        renderer.render(scene, camera);
        const settling = Math.abs(target - prog) > 0.0005;
        if (visible && (!reduced || settling)) raf = requestAnimationFrame(frame);
      };
      const kick = () => {
        if (!raf) raf = requestAnimationFrame(frame);
      };
      const onScroll = () => {
        if (!section || reduced) return;
        const range = section.offsetHeight - window.innerHeight;
        target = range > 0 ? Math.min(Math.max(-section.getBoundingClientRect().top / range, 0), 1) : 1;
        kick();
      };
      const onMove = (e: PointerEvent) => {
        pt.x = (e.clientX / window.innerWidth) * 2 - 1;
        pt.y = (e.clientY / window.innerHeight) * 2 - 1;
        kick();
      };
      const onResize = () => {
        layout();
        onScroll();
        kick();
      };
      const io = new IntersectionObserver(([en]) => {
        visible = en.isIntersecting;
        if (visible) kick();
      });
      io.observe(wrap);

      wrap.appendChild(renderer.domElement);
      layout();
      onScroll();
      prog = target; // no catch-up animation on first paint
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("resize", onResize);
      kick();
      setReady(true);

      cleanup = () => {
        if (raf) cancelAnimationFrame(raf);
        io.disconnect();
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("resize", onResize);
        scene.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
        [matCover, matDark, matEdge, matLeft, matRight, edgeTex, coverMap, leftMap, rightMap, coverTex, pagesTex].forEach((d) => d.dispose());
        disposeStudio();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [near, coverSrc, pagesSrc]);

  return (
    <div ref={wrapRef} className={`depth book${ready ? " is-ready" : ""}`}>
      {children}
    </div>
  );
}
