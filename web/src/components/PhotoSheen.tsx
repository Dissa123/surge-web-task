"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type * as THREE from "three";

interface Props {
  /** Absolute image URL (the same CMS image as the fallback `children`). */
  src: string;
  fit?: "contain" | "cover";
  /** Strength of the metallic glint (0..1). */
  sheen?: number;
  /** Direction of the light band in radians. */
  angle?: number;
  /** Soft light that follows the cursor (disable when the element is rotated by CSS). */
  pointerLight?: boolean;
  /** Offset the sweep with page scroll so the light travels as you scroll. */
  scrollLink?: boolean;
  /** Tilt the photograph in 3D toward the cursor (leave off when the element is rotated by CSS). */
  tilt?: boolean;
  /** Static <img> from the CMS: SEO, first paint and fallback when WebGL/CORS is unavailable. */
  children: ReactNode;
}

const VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FRAG = `
uniform sampler2D uTex;
uniform float uTime, uSheen, uScroll, uAngle, uLightAmt;
uniform vec2 uScale, uOffset, uLight, uPointer;
varying vec2 vUv;
void main(){
  vec2 uv = vUv * uScale + uOffset;
  vec2 shifted = uv + uPointer * 0.0035;            // micro parallax so the photo feels dimensional
  vec4 t = texture2D(uTex, shifted);
  float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
  float lum = dot(t.rgb, vec3(0.299, 0.587, 0.114));
  vec2 d = vec2(cos(uAngle), sin(uAngle));
  float x = dot(vUv - 0.5, d) + 0.5;
  float pos = fract(uTime * 0.085 + uScroll) * 1.7 - 0.35;
  float band = smoothstep(0.17, 0.0, abs(x - pos));
  float glint = band * pow(clamp(lum, 0.0, 1.0), 1.5) * uSheen;       // only highlights catch the light
  float pl = smoothstep(0.5, 0.0, distance(vUv, uLight)) * pow(clamp(lum, 0.0, 1.0), 1.2) * 0.22 * uSheen * uLightAmt;
  vec3 col = t.rgb + vec3(1.0, 0.97, 0.92) * (glint + pl);
  gl_FragColor = vec4(col, t.a * inside);
  #include <colorspace_fragment>
}`;

/**
 * Premium photo treatment: renders the real product photograph through a small shader that adds a
 * travelling specular glint (highlights only), a cursor-following soft light and a micro-parallax.
 * The photograph itself is never replaced by generated art, so the brand imagery stays intact.
 */
export function PhotoSheen({ src, fit = "contain", sheen = 0.7, angle = 0.7, pointerLight = false, scrollLink = false, tilt = false, children }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "400px" });
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
        renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
      } catch {
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);

      const loader = new T.TextureLoader();
      loader.setCrossOrigin("anonymous");
      const tex = await new Promise<THREE.Texture | null>((res) => loader.load(src, res, undefined, () => res(null)));
      if (disposed || !tex) {
        tex?.dispose();
        renderer.dispose();
        return; // CORS/network problem: the static image simply stays
      }
      tex.colorSpace = T.SRGBColorSpace;
      tex.anisotropy = 8;

      const uniforms = {
        uTex: { value: tex },
        uTime: { value: 0 },
        uSheen: { value: sheen },
        uScroll: { value: 0 },
        uAngle: { value: angle },
        uLightAmt: { value: pointerLight ? 1 : 0 },
        uScale: { value: new T.Vector2(1, 1) },
        uOffset: { value: new T.Vector2(0, 0) },
        uLight: { value: new T.Vector2(0.5, 0.5) },
        uPointer: { value: new T.Vector2(0, 0) },
      };
      const material = new T.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true });
      material.depthWrite = false;
      const geometry = new T.PlaneGeometry(2, 2);
      const mesh = new T.Mesh(geometry, material);
      const scene = new T.Scene();
      scene.add(mesh);
      // Real perspective: the plane exactly fills the canvas at rest, so it can swing in depth.
      const fov = 35;
      const camera = new T.PerspectiveCamera(fov, 1, 0.1, 20);
      camera.position.z = 1 / Math.tan((fov * Math.PI) / 360);

      const img = tex.image as { width: number; height: number };
      const ia = img.width / img.height;
      let w = 1, h = 1;
      const layout = () => {
        w = wrap.clientWidth || 1;
        h = wrap.clientHeight || 1;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        const over = fit === "cover" ? 1.1 : 1; // overscan so tilting never reveals the edges of a photo
        mesh.scale.set((w / h) * over, over, 1);
        const ca = w / h;
        const wider = ca > ia;
        if (fit === "cover") {
          uniforms.uScale.value.set(wider ? 1 : ca / ia, wider ? ia / ca : 1);
        } else {
          uniforms.uScale.value.set(wider ? ca / ia : 1, wider ? 1 : ia / ca);
        }
        uniforms.uOffset.value.set((1 - uniforms.uScale.value.x) / 2, (1 - uniforms.uScale.value.y) / 2);
      };

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const pt = { x: 0, y: 0, sx: 0, sy: 0 };
      let visible = true;
      let raf = 0;
      const t0 = performance.now();

      const frame = (now: number) => {
        raf = 0;
        const k = reduced ? 1 : Math.min(Math.max(now - t0, 0) / 1700, 1);
        const e = 1 - Math.pow(1 - k, 4); // intro: swings in from depth
        const s = reduced ? 0 : now / 1000;
        mesh.rotation.y = Math.sin(s * 0.5) * 0.045 + (tilt ? pt.sx * 0.14 : 0) + (1 - e) * 0.55;
        mesh.rotation.x = Math.cos(s * 0.4) * 0.025 + (tilt ? -pt.sy * 0.09 : 0);
        mesh.position.z = Math.sin(s * 0.6) * 0.02 - (1 - e) * 0.5;
        uniforms.uTime.value = reduced ? 1.2 : now / 1000;
        if (scrollLink) uniforms.uScroll.value = window.scrollY / (window.innerHeight * 2.4);
        pt.sx += (pt.x - pt.sx) * 0.06;
        pt.sy += (pt.y - pt.sy) * 0.06;
        uniforms.uPointer.value.set(pt.sx, -pt.sy);
        renderer.render(scene, camera);
        if (visible && (!reduced || k < 1)) raf = requestAnimationFrame(frame);
      };
      const kick = () => {
        if (!raf) raf = requestAnimationFrame(frame);
      };
      const onMove = (e: PointerEvent) => {
        const r = wrap.getBoundingClientRect();
        pt.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
        pt.y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
        uniforms.uLight.value.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
        kick();
      };
      const onResize = () => {
        layout();
        kick();
      };
      const vis = new IntersectionObserver(([en]) => {
        visible = en.isIntersecting;
        if (visible) kick();
      });
      vis.observe(wrap);

      wrap.appendChild(renderer.domElement);
      layout();
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("resize", onResize);
      kick();
      setReady(true);

      cleanup = () => {
        if (raf) cancelAnimationFrame(raf);
        vis.disconnect();
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("resize", onResize);
        geometry.dispose();
        material.dispose();
        tex.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [near, src, fit, sheen, angle, pointerLight, scrollLink, tilt]);

  return (
    <div ref={wrapRef} className={`photo${ready ? " is-ready" : ""}`}>
      {children}
    </div>
  );
}
