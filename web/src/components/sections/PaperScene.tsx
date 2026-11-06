"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type * as THREE from "three";
import { createStudio } from "@/lib/pen3d";

/**
 * "Looks like paper. Works like a system." as a scroll-scrubbed, photographic scene.
 * The sheet is a real page cropped from the CMS notebook photograph (dots and handwriting included),
 * lit and curled in 3D with a soft shadow. Scrolling tilts it into space; a scan of light then passes
 * down the page, red recognition boxes lock onto the real handwriting line by line, and the nearly
 * invisible dot map shimmers in behind the scan: the page being read.
 *   0 – .2   the page floats face-on: just paper
 *   .2 – .55 it lifts and tilts into 3D
 *   .3 – .8  scan + recognition
 * The CMS backdrop photo (the <img> child) stays dimmed behind the canvas.
 */

// Crop of the left page inside the 1920×1080 photograph (pixels) and the handwriting boxes inside it.
const RECT = [525, 222, 950, 850] as const;
const REF = { w: 1920, h: 1080 };
const BOXES: readonly (readonly [number, number, number, number])[] = [
  [578, 243, 652, 287], // Monday
  [568, 320, 778, 362], // Finish presentation
  [568, 370, 698, 412], // Call mom
  [568, 420, 724, 462], // Buy oat milk
  [568, 470, 804, 514], // Sketch homepage idea
  [568, 520, 764, 557], // Send files to Alex
  [576, 648, 760, 699], // Take it easy
];
const W = 3;
const H = (W * (RECT[3] - RECT[1])) / (RECT[2] - RECT[0]);
const ACCENT = 0xff4a3a;

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
// Faint dot map (each dot nudged in one of four directions), only where the scan has already passed.
const DOTS_FRAG = `
uniform float uBeam, uReveal, uTime; uniform vec2 uSize; varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main(){
  vec2 p = vUv * uSize;
  float cell = 0.07;
  vec2 id = floor(p / cell);
  vec2 f = fract(p / cell) - 0.5;
  float q = floor(hash(id) * 4.0);
  vec2 off = q < 1.0 ? vec2(0.22, 0.0) : q < 2.0 ? vec2(-0.22, 0.0) : q < 3.0 ? vec2(0.0, 0.22) : vec2(0.0, -0.22);
  float dotM = smoothstep(0.13, 0.05, length(f - off));
  float passed = step(vUv.y, uBeam) * uReveal;                                  // beam travels top -> bottom (vUv.y: 1 = top)
  float near = smoothstep(0.16, 0.0, abs(vUv.y - uBeam));
  float tw = 0.7 + 0.3 * sin(uTime * 2.2 + hash(id) * 25.0);
  float a = dotM * (passed * 0.34 * tw + near * 0.55);
  gl_FragColor = vec4(1.0, 0.29, 0.23, a);
}`;
const BEAM_FRAG = `
uniform float uAlpha; varying vec2 vUv;
void main(){
  float d = abs(vUv.y - 0.5) * 2.0;
  float core = pow(1.0 - d, 6.0);
  float glow = pow(1.0 - d, 2.0) * 0.22;
  gl_FragColor = vec4(mix(vec3(1.0, 0.32, 0.25), vec3(1.0, 0.92, 0.88), core), (core * 0.95 + glow) * uAlpha);
}`;

export function PaperScene({ paperSrc, children }: { paperSrc: string; children: ReactNode }) {
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
      const photo = await new Promise<THREE.Texture | null>((res) => loader.load(paperSrc, res, undefined, () => res(null)));
      if (disposed || !photo) {
        photo?.dispose();
        renderer.dispose();
        return; // CORS / network problem: the static backdrop photo simply stays
      }

      const scene = new T.Scene();
      const camera = new T.PerspectiveCamera(30, 1, 0.1, 100);
      camera.position.z = 22;
      const disposeStudio = await createStudio(T, renderer, scene);
      if (disposed) {
        disposeStudio();
        renderer.dispose();
        return;
      }
      scene.environmentIntensity = 0.35;
      const key = new T.DirectionalLight(0xfff3e6, 1.4);
      key.position.set(-5, 6, 9);
      scene.add(key);

      const disposables: { dispose: () => void }[] = [];
      const track = <D extends { dispose: () => void }>(d: D) => (disposables.push(d), d);

      // ---- the real page ----
      const map = track(photo.clone());
      map.colorSpace = T.SRGBColorSpace;
      map.anisotropy = 8;
      map.repeat.set((RECT[2] - RECT[0]) / REF.w, (RECT[3] - RECT[1]) / REF.h);
      map.offset.set(RECT[0] / REF.w, 1 - RECT[3] / REF.h);
      map.needsUpdate = true;
      const SX = 36, SY = 50;
      const sheetGeo = track(new T.PlaneGeometry(W, H, SX, SY));
      const sheetMat = track(
        new T.MeshStandardMaterial({ map, emissiveMap: map, emissive: new T.Color(0xffffff), emissiveIntensity: 0.78, roughness: 0.92, metalness: 0, side: T.DoubleSide }),
      );
      const sheet = new T.Mesh(sheetGeo, sheetMat);
      const base = (sheetGeo.attributes.position as THREE.BufferAttribute).array.slice() as Float32Array;

      // local position of a pixel of the photograph on the sheet
      const lx = (px: number) => ((px - RECT[0]) / (RECT[2] - RECT[0]) - 0.5) * W;
      const ly = (py: number) => (0.5 - (py - RECT[1]) / (RECT[3] - RECT[1])) * H;
      const vOf = (py: number) => (py - RECT[1]) / (RECT[3] - RECT[1]); // 0 top -> 1 bottom

      // ---- recognition boxes ----
      const PAD = 0.05;
      const boxes = BOXES.map((b) => {
        const x0 = lx(b[0]) - PAD, x1 = lx(b[2]) + PAD, y0 = ly(b[1]) + PAD, y1 = ly(b[3]) - PAD;
        const geo = track(new T.BufferGeometry().setFromPoints([new T.Vector3(x0, y0, 0), new T.Vector3(x1, y0, 0), new T.Vector3(x1, y1, 0), new T.Vector3(x0, y1, 0)]));
        const lineMat = track(new T.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0, depthTest: false }));
        const line = new T.LineLoop(geo, lineMat);
        line.renderOrder = 3;
        const fillGeo = track(new T.PlaneGeometry(x1 - x0, y0 - y1));
        const fillMat = track(new T.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0, depthTest: false, depthWrite: false }));
        const fill = new T.Mesh(fillGeo, fillMat);
        fill.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0.01);
        fill.renderOrder = 2;
        const tickGeo = track(new T.CircleGeometry(0.045, 20));
        const tickMat = track(new T.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0, depthTest: false }));
        const tick = new T.Mesh(tickGeo, tickMat);
        tick.position.set(x0, (y0 + y1) / 2, 0.02);
        tick.renderOrder = 4;
        sheet.add(line, fill, tick);
        return { lineMat, fillMat, tickMat, v: vOf((b[1] + b[3]) / 2), top: vOf(b[1]) };
      });

      // ---- dot map + scan beam (children of the sheet, drawn on top) ----
      const dotsU = { uBeam: { value: 1.2 }, uReveal: { value: 0 }, uTime: { value: 0 }, uSize: { value: new T.Vector2(W, H) } };
      const dotsMat = track(new T.ShaderMaterial({ uniforms: dotsU, vertexShader: VERT, fragmentShader: DOTS_FRAG, transparent: true, depthTest: false, depthWrite: false }));
      const dots = new T.Mesh(track(new T.PlaneGeometry(W, H)), dotsMat);
      dots.position.z = 0.015;
      dots.renderOrder = 1;
      sheet.add(dots);
      const beamU = { uAlpha: { value: 0 } };
      const beamMat = track(new T.ShaderMaterial({ uniforms: beamU, vertexShader: VERT, fragmentShader: BEAM_FRAG, transparent: true, depthTest: false, depthWrite: false }));
      const beam = new T.Mesh(track(new T.PlaneGeometry(W * 1.2, 0.9)), beamMat);
      beam.renderOrder = 5;
      sheet.add(beam);

      // ---- soft contact shadow ----
      const sc = document.createElement("canvas");
      sc.width = sc.height = 128;
      const sg = sc.getContext("2d")!;
      const grad = sg.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, "rgba(0,0,0,0.7)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      sg.fillStyle = grad;
      sg.fillRect(0, 0, 128, 128);
      const shadowTex = track(new T.CanvasTexture(sc));
      const shadowMat = track(new T.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.5 }));
      const shadow = new T.Mesh(track(new T.PlaneGeometry(W * 1.5, H * 1.15)), shadowMat);
      shadow.position.z = -1.4;

      const holder = new T.Group();
      holder.add(sheet);
      scene.add(shadow, holder);

      // ---- loop ----
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const section = wrap.closest<HTMLElement>(".scene--book");
      const pt = { x: 0, y: 0, sx: 0, sy: 0 };
      let target = reduced ? 1 : 0;
      let prog = target;
      let visible = true;
      let raf = 0;
      let w = 1, h = 1;
      const pos = sheetGeo.attributes.position as THREE.BufferAttribute;
      let lastFlex = -1;

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

        const lift = easeInOut(smooth(0.18, 0.55, p));
        const scan = smooth(0.3, 0.8, p);
        const mobile = w < 700;

        const viewH = 2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360);
        const viewW = viewH * camera.aspect;
        const scale = Math.min((0.74 * viewH) / H, (0.8 * viewW) / W) * (1 - (mobile ? 0.14 : 0.06) * lift);
        holder.scale.setScalar(scale);

        // paper curls a little more as it lifts, with a slow breathing wave
        const flex = 0.25 + 0.75 * lift;
        const wave = reduced ? 0 : Math.sin(s * 0.8) * 0.012;
        const key2 = Math.round((flex + wave) * 1000);
        if (key2 !== lastFlex) {
          lastFlex = key2;
          for (let i = 0; i < pos.count; i++) {
            const x = base[i * 3], y = base[i * 3 + 1];
            const u = x / W + 0.5, v = 0.5 - y / H;
            const z = (flex + wave) * (0.13 * Math.pow(u, 2.2) + 0.022 * Math.sin(v * Math.PI * 1.6 + s * 0.6));
            pos.setXYZ(i, x, y, z);
          }
          pos.needsUpdate = true;
          sheetGeo.computeVertexNormals();
        }

        pt.sx += (pt.x - pt.sx) * 0.06;
        pt.sy += (pt.y - pt.sy) * 0.06;
        holder.rotation.x = -0.62 * lift + 0.04 + Math.cos(s * 0.4) * 0.02 - pt.sy * 0.07;
        holder.rotation.y = 0.34 * lift - 0.06 + Math.sin(s * 0.5) * 0.03 + pt.sx * 0.12;
        holder.rotation.z = 0.2 * lift;
        holder.position.y = Math.sin(s * 0.9) * 0.08 * scale + 0.15 * lift * scale;
        holder.position.x = (mobile ? 0 : 0.1 - 0.035 * lift) * viewW;

        shadow.position.set(holder.position.x + 0.4 * lift, holder.position.y - 0.5 - 0.5 * lift, -1.4);
        shadow.scale.setScalar(scale * (0.85 + 0.3 * lift));
        shadowMat.opacity = 0.35 + 0.3 * lift;

        // scan: v goes 0 (top) -> 1 (bottom)
        const beamV = -0.06 + scan * 1.14;
        beam.position.y = (0.5 - beamV) * H;
        beam.position.z = 0.05;
        beamU.uAlpha.value = scan > 0.002 && scan < 0.998 ? 1 : 0;
        dotsU.uBeam.value = 1 - beamV;
        dotsU.uReveal.value = smooth(0.3, 0.9, p);
        dotsU.uTime.value = s;

        boxes.forEach((b) => {
          const seen = smooth(b.top - 0.01, b.top + 0.05, beamV);
          const pulse = Math.exp(-Math.pow((beamV - b.v) * 18, 2));
          b.lineMat.opacity = Math.min(1, seen * (0.78 + 0.22 * pulse));
          b.fillMat.opacity = seen * (0.07 + 0.2 * pulse);
          b.tickMat.opacity = seen;
        });

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
      prog = target;
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
        disposables.forEach((d) => d.dispose());
        photo.dispose();
        disposeStudio();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [near, paperSrc]);

  return (
    <div ref={wrapRef} className={`depth paper${ready ? " is-ready" : ""}`}>
      {children}
    </div>
  );
}
