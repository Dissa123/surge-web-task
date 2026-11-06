"use client";

import { useEffect, useRef, useState } from "react";
import type * as THREE from "three";

/**
 * "We use special paper with a nearly invisible pattern" — the three CMS slides become sheets floating in
 * 3D space. The active sheet comes forward and a red scan reveals its near-invisible dot lattice (the
 * "precise map" for the pen); neighbours sit angled back in depth. Behind them a coordinate lattice ripples.
 * The scene follows the carousel `index` (autoplay, swipe, arrows, progress bar) and the pointer tilts it.
 * The DOM slides stay underneath as the SEO / no-WebGL / reduced-motion fallback.
 */

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const SHEET_FRAG = /* glsl */ `
uniform sampler2D map;
uniform float uTime;
uniform float uFocus;
uniform float uOpacity;
uniform float uPhase;
varying vec2 vUv;
void main() {
  vec4 c = texture2D(map, vUv);
  vec2 e = smoothstep(0.0, 0.2, vUv) * smoothstep(0.0, 0.2, 1.0 - vUv);
  float a = e.x * e.y;

  // the nearly invisible pattern: a fine dot lattice, only legible where the scan passes
  vec2 g = vUv * vec2(36.0, 48.0);
  float d = length(fract(g) - 0.5);
  float dots = smoothstep(0.2, 0.07, d);
  float s = fract(uTime * 0.14 + uPhase);
  float band = exp(-pow((vUv.y - s) * 7.0, 2.0));
  float faint = 0.045 * uFocus;

  vec3 red = vec3(1.0, 0.18, 0.1);
  vec3 col = c.rgb;
  col += red * dots * (band * 1.25 * uFocus + faint);
  col += red * band * 0.07 * uFocus;
  col += vec3(1.0) * dots * faint * 0.5;
  gl_FragColor = vec4(col, a * uOpacity);
  #include <colorspace_fragment>
}`;

const LATTICE_VERT = /* glsl */ `
uniform float uTime;
uniform float uPx;
uniform vec2 uMouse;
varying float vGlow;
void main() {
  vec3 p = position;
  float r = length(p.xy - uMouse);
  float wave = sin(r * 1.3 - uTime * 1.4);
  float ring = exp(-pow((mod(uTime * 2.2, 22.0) - length(p.xy)) * 0.55, 2.0));
  p.z += wave * 0.14 * exp(-r * 0.12) + ring * 0.5;
  vGlow = ring + max(wave, 0.0) * exp(-r * 0.35) * 0.6;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = uPx * (1.0 + vGlow * 1.6) / -mv.z * 22.0;
  gl_Position = projectionMatrix * mv;
}`;

const LATTICE_FRAG = /* glsl */ `
varying float vGlow;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.1, d);
  vec3 col = mix(vec3(0.5, 0.5, 0.55), vec3(1.0, 0.22, 0.12), clamp(vGlow, 0.0, 1.0));
  gl_FragColor = vec4(col, a * (0.18 + vGlow * 0.75));
}`;

const wrap = (d: number, n: number) => ((((d + n / 2) % n) + n) % n) - n / 2;
const ease = (t: number) => t * t * (3 - 2 * t);

export function PatternScene({ srcs, index, onPick }: { srcs: string[]; index: number; onPick: (i: number) => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(index);
  const pickRef = useRef(onPick);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    indexRef.current = index;
    pickRef.current = onPick;
  });

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "500px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const key = srcs.join("|");

  useEffect(() => {
    const host = hostRef.current;
    if (!near || !host || !srcs.length) return;
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

      const loader = new T.TextureLoader();
      loader.setCrossOrigin("anonymous");
      const textures = await Promise.all(srcs.map((u) => new Promise<THREE.Texture | null>((res) => loader.load(u, res, undefined, () => res(null)))));
      if (disposed || textures.some((t) => !t)) {
        textures.forEach((t) => t?.dispose());
        renderer.dispose();
        return; // CORS / network problem: the DOM slides simply stay
      }
      const maps = textures as THREE.Texture[];
      maps.forEach((t) => {
        t.colorSpace = T.SRGBColorSpace;
        t.anisotropy = 8;
      });

      const scene = new T.Scene();
      const camera = new T.PerspectiveCamera(32, 1, 0.1, 100);
      camera.position.z = 16;
      const rig = new T.Group();
      scene.add(rig);

      // ---- sheets ----
      const SH = 5.2; // sheet height
      const sheets = maps.map((m, i) => {
        const aspect = (m.image as HTMLImageElement).width / (m.image as HTMLImageElement).height || 0.75;
        const mat = new T.ShaderMaterial({
          uniforms: { map: { value: m }, uTime: { value: 0 }, uFocus: { value: 0 }, uOpacity: { value: 1 }, uPhase: { value: i * 0.31 } },
          vertexShader: VERT,
          fragmentShader: SHEET_FRAG,
          transparent: true,
          depthWrite: false,
        });
        const mesh = new T.Mesh(new T.PlaneGeometry(SH * aspect, SH), mat);
        mesh.userData.w = SH * aspect;
        rig.add(mesh);
        return { mesh, mat };
      });

      // ---- coordinate lattice behind the sheets ----
      const COLS = 64, ROWS = 36, STEP = 0.62;
      const pos = new Float32Array(COLS * ROWS * 3);
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        const k = (y * COLS + x) * 3;
        pos[k] = (x - COLS / 2) * STEP;
        pos[k + 1] = (y - ROWS / 2) * STEP;
        pos[k + 2] = 0;
      }
      const lg = new T.BufferGeometry();
      lg.setAttribute("position", new T.BufferAttribute(pos, 3));
      const lu = { uTime: { value: 0 }, uPx: { value: renderer.getPixelRatio() }, uMouse: { value: new T.Vector2(0, 0) } };
      const lattice = new T.Points(lg, new T.ShaderMaterial({ uniforms: lu, vertexShader: LATTICE_VERT, fragmentShader: LATTICE_FRAG, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
      lattice.position.z = -7;
      lattice.scale.setScalar(1.5);
      rig.add(lattice);

      // ---- loop ----
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const n = sheets.length;
      const pt = { x: 0, y: 0, sx: 0, sy: 0 };
      let pos0 = indexRef.current;
      let visible = true;
      let raf = 0;
      let w = 1, h = 1;
      const t0 = performance.now();

      const layout = () => {
        w = host.clientWidth || 1;
        h = host.clientHeight || 1;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };

      const frame = (now: number) => {
        raf = 0;
        const s = reduced ? 0 : (now - t0) / 1000;
        pos0 += wrap(indexRef.current - pos0, n) * (reduced ? 1 : 0.09);

        const viewH = 2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360);
        const viewW = viewH * camera.aspect;
        const mobile = w < 700;
        const fit = Math.min((1.12 * viewH) / SH, (mobile ? 1.15 : 0.7) * viewW / (SH * 0.75));
        const gap = (mobile ? 0.62 : 0.78) * SH * 0.75 * fit;

        sheets.forEach(({ mesh, mat }, i) => {
          const d = wrap(i - pos0, n);
          const ad = Math.min(Math.abs(d), 1.6);
          const front = 1 - Math.min(Math.abs(d), 1);
          const f = ease(front);
          mesh.scale.setScalar(fit * (0.78 + 0.22 * f));
          mesh.position.x = d * gap * 1.25;
          mesh.position.y = Math.sin(s * 0.8 + i * 1.7) * 0.12 * (0.4 + f);
          mesh.position.z = -ad * 2.6 + f * 0.6;
          mesh.rotation.y = -Math.sign(d) * Math.min(Math.abs(d), 1.2) * 0.62;
          mesh.rotation.x = Math.sin(s * 0.5 + i) * 0.03;
          mesh.renderOrder = Math.round((1 - ad) * 10);
          mat.uniforms.uOpacity.value = 0.28 + 0.72 * f;
          mat.uniforms.uFocus.value = f;
          mat.uniforms.uTime.value = s;
        });

        lu.uTime.value = s;
        lu.uMouse.value.set(pt.sx * 9, -pt.sy * 5);
        pt.sx += (pt.x - pt.sx) * 0.06;
        pt.sy += (pt.y - pt.sy) * 0.06;
        rig.rotation.y = pt.sx * 0.12 + Math.sin(s * 0.3) * 0.03;
        rig.rotation.x = pt.sy * 0.07 + Math.cos(s * 0.25) * 0.015;

        renderer.render(scene, camera);
        const settling = Math.abs(wrap(indexRef.current - pos0, n)) > 0.002;
        if (visible && (!reduced || settling)) raf = requestAnimationFrame(frame);
      };
      const kick = () => {
        if (!raf) raf = requestAnimationFrame(frame);
      };
      const onMove = (e: PointerEvent) => {
        pt.x = (e.clientX / window.innerWidth) * 2 - 1;
        pt.y = (e.clientY / window.innerHeight) * 2 - 1;
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
      io.observe(host);

      host.appendChild(renderer.domElement);
      layout();
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("resize", onResize);
      // keep the loop alive for index changes made while reduced-motion has parked it
      const poll = window.setInterval(() => {
        if (Math.abs(wrap(indexRef.current - pos0, n)) > 0.002) kick();
      }, 200);
      kick();
      setReady(true);

      cleanup = () => {
        if (raf) cancelAnimationFrame(raf);
        window.clearInterval(poll);
        io.disconnect();
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("resize", onResize);
        scene.traverse((o) => {
          const m = o as THREE.Mesh;
          m.geometry?.dispose();
          (m.material as THREE.Material | undefined)?.dispose();
        });
        maps.forEach((t) => t.dispose());
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [near, key]);

  return <div ref={hostRef} className={`pattern3d${ready ? " is-ready" : ""}`} aria-hidden="true" />;
}
