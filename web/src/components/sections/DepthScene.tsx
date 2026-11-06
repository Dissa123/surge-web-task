"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type * as THREE from "three";

/**
 * Premium 3D treatment for the "synced to your phone" photograph (1920×1080, phone screen centred
 * near u .51 / v .50). The photo lives on a perspective plane; its own blurred luminance is used as a
 * pseudo depth map so the bright phone parallaxes against the dark set when the camera drifts with
 * the cursor. Glowing sync streams arc through real 3D space from the notebook side into the phone,
 * ring pulses mark the arrival, and a specular glint sweeps over the highlights.
 * The static <img> (`children`) is the SEO / first paint / no-WebGL / CORS fallback.
 */
const PHONE = { u: 0.513, v: 0.5 };
const SOURCE = { u: 0.17, v: 0.8 };
const STREAMS = 4;
const COMETS = 2;
const TRAIL = 22;
const COUNT = STREAMS * COMETS * TRAIL;
const ACCENT = 0xff4a3a;

const S = [
  { su: 0.0, sv: -0.04, du: -0.04, dv: -0.12, arc: 0.36, z: 0.26, speed: 0.11 },
  { su: 0.03, sv: 0.02, du: 0.03, dv: -0.04, arc: 0.5, z: 0.36, speed: 0.09 },
  { su: -0.02, sv: 0.06, du: -0.02, dv: 0.08, arc: 0.28, z: 0.2, speed: 0.13 },
  { su: 0.015, sv: -0.08, du: 0.05, dv: 0.16, arc: 0.42, z: 0.3, speed: 0.1 },
];

const PLANE_VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const PLANE_FRAG = `
uniform sampler2D uTex;
uniform vec2 uScale, uOffset, uPointer;
uniform float uTime, uSheen, uFade;
varying vec2 vUv;
void main(){
  vec2 uv = vUv * uScale + uOffset;
  float d = dot(texture2D(uTex, uv, 3.0).rgb, vec3(0.299, 0.587, 0.114));   // blurred luminance = pseudo depth
  d = smoothstep(0.12, 0.7, d);
  vec2 shift = uPointer * (0.0015 + 0.0075 * d);                                 // bright phone shifts more than the set
  vec4 t = texture2D(uTex, clamp(uv + shift, 0.001, 0.999));
  float lum = dot(t.rgb, vec3(0.299, 0.587, 0.114));
  float x = dot(vUv - 0.5, vec2(cos(0.6), sin(0.6))) + 0.5;
  float pos = fract(uTime * 0.07) * 1.8 - 0.4;
  float band = smoothstep(0.13, 0.0, abs(x - pos));
  vec3 col = t.rgb + vec3(1.0, 0.97, 0.92) * band * pow(clamp(lum, 0.0, 1.0), 1.6) * uSheen;
  col *= mix(0.8, 1.0, smoothstep(1.15, 0.35, distance(vUv, vec2(0.5))));       // soft vignette
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;
const PT_VERT = `
attribute float aSize; attribute float aAlpha; attribute float aHot;
uniform float uPx;
varying float vAlpha; varying float vHot;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = uPx * aSize / -mv.z;
  vAlpha = aAlpha; vHot = aHot;
  gl_Position = projectionMatrix * mv;
}`;
const PT_FRAG = `
uniform vec3 uColor;
varying float vAlpha; varying float vHot;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = pow(1.0 - smoothstep(0.0, 0.5, d), 1.7) * vAlpha;
  gl_FragColor = vec4(mix(uColor, vec3(1.0, 0.72, 0.66), vHot * 0.7), a);
}`;

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

export function DepthScene({ src, children }: { src: string; children: ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "500px" });
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
        renderer = new T.WebGLRenderer({ antialias: true, alpha: false });
      } catch {
        return;
      }
      const dpr = Math.min(window.devicePixelRatio, 2);
      renderer.setPixelRatio(dpr);

      const loader = new T.TextureLoader();
      loader.setCrossOrigin("anonymous");
      const tex = await new Promise<THREE.Texture | null>((res) => loader.load(src, res, undefined, () => res(null)));
      if (disposed || !tex) {
        tex?.dispose();
        renderer.dispose();
        return; // CORS / network problem: the static photo simply stays
      }
      tex.colorSpace = T.SRGBColorSpace;
      tex.anisotropy = 8;

      const fov = 35;
      const camera = new T.PerspectiveCamera(fov, 1, 0.1, 20);
      const camZ = 1 / Math.tan((fov * Math.PI) / 360);
      camera.position.set(0, 0, camZ);
      const scene = new T.Scene();
      const world = new T.Group();
      scene.add(world);

      // ---- photo plane ----
      const planeU = {
        uTex: { value: tex },
        uScale: { value: new T.Vector2(1, 1) },
        uOffset: { value: new T.Vector2(0, 0) },
        uPointer: { value: new T.Vector2(0, 0) },
        uTime: { value: 0 },
        uSheen: { value: 0.55 },
        uFade: { value: 1 },
      };
      const planeMat = new T.ShaderMaterial({ uniforms: planeU, vertexShader: PLANE_VERT, fragmentShader: PLANE_FRAG, depthWrite: false });
      const planeGeo = new T.PlaneGeometry(2, 2);
      const plane = new T.Mesh(planeGeo, planeMat);
      world.add(plane);

      // ---- sync streams (comets with trails) ----
      const pos = new Float32Array(COUNT * 3);
      const size = new Float32Array(COUNT);
      const alpha = new Float32Array(COUNT);
      const hot = new Float32Array(COUNT);
      const ptGeo = new T.BufferGeometry();
      ptGeo.setAttribute("position", new T.BufferAttribute(pos, 3));
      ptGeo.setAttribute("aSize", new T.BufferAttribute(size, 1));
      ptGeo.setAttribute("aAlpha", new T.BufferAttribute(alpha, 1));
      ptGeo.setAttribute("aHot", new T.BufferAttribute(hot, 1));
      const ptU = { uPx: { value: 1 }, uColor: { value: new T.Color(ACCENT) } };
      const ptMat = new T.ShaderMaterial({ uniforms: ptU, vertexShader: PT_VERT, fragmentShader: PT_FRAG, transparent: true, depthWrite: false });
      const points = new T.Points(ptGeo, ptMat);
      points.frustumCulled = false;
      world.add(points);

      // ---- arrival / departure pulse rings ----
      const ringGeo = new T.RingGeometry(0.97, 1, 80);
      const makeRing = (color: number) => {
        const m = new T.Mesh(ringGeo, new T.MeshBasicMaterial({ color, transparent: true, depthWrite: false, opacity: 0 }));
        world.add(m);
        return m;
      };
      const rings = [0, 1, 2].map(() => makeRing(ACCENT));
      const srcRings = [0, 1].map(() => makeRing(ACCENT));

      // ---- image-uv -> world mapping (cover fit) ----
      const img = tex.image as { width: number; height: number };
      const ia = img.width / img.height;
      const OVER = 1.1; // overscan so camera drift never reveals the edge
      let aspect = 1;
      let w = 1, h = 1;
      const toWorld = (u: number, v: number, out: THREE.Vector3) => {
        const sx = planeU.uScale.value.x, sy = planeU.uScale.value.y;
        const vx = (u - planeU.uOffset.value.x) / sx;
        const vy = (1 - v - planeU.uOffset.value.y) / sy;
        return out.set((vx * 2 - 1) * aspect * OVER, (vy * 2 - 1) * OVER, 0);
      };

      const layout = () => {
        w = wrap.clientWidth || 1;
        h = wrap.clientHeight || 1;
        aspect = w / h;
        renderer.setSize(w, h, false);
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
        plane.scale.set(aspect * OVER, OVER, 1);
        const wider = aspect > ia;
        planeU.uScale.value.set(wider ? 1 : aspect / ia, wider ? ia / aspect : 1);
        planeU.uOffset.value.set((1 - planeU.uScale.value.x) / 2, (1 - planeU.uScale.value.y) / 2);
        ptU.uPx.value = (h * dpr) / (2 * Math.tan((fov * Math.PI) / 360));
      };

      const A = new T.Vector3(), B = new T.Vector3(), C = new T.Vector3(), P = new T.Vector3();
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const pt = { x: 0, y: 0, sx: 0, sy: 0 };
      let visible = true;
      let raf = 0;
      let scrollP = 0;
      const t0 = performance.now();

      const frame = (now: number) => {
        raf = 0;
        const time = reduced ? 4.2 : now / 1000;
        const k = reduced ? 1 : Math.min(Math.max(now - t0, 0) / 1800, 1);
        const intro = 1 - Math.pow(1 - k, 4);

        // stream particles
        for (let s = 0; s < STREAMS; s++) {
          const c = S[s];
          toWorld(SOURCE.u + c.su, SOURCE.v + c.sv, A);
          toWorld(PHONE.u + c.du, PHONE.v + c.dv, B);
          C.set((A.x + B.x) / 2, (A.y + B.y) / 2 + c.arc, 0);
          for (let m = 0; m < COMETS; m++) {
            const head = (time * c.speed + m / COMETS + s * 0.17) % 1;
            for (let j = 0; j < TRAIL; j++) {
              const i = (s * COMETS + m) * TRAIL + j;
              const tt = head - j * 0.009;
              if (tt < 0) {
                alpha[i] = 0;
                continue;
              }
              const u = 1 - tt;
              P.set(u * u * A.x + 2 * u * tt * C.x + tt * tt * B.x, u * u * A.y + 2 * u * tt * C.y + tt * tt * B.y, 0.04 + Math.sin(Math.PI * tt) * c.z);
              pos.set([P.x, P.y, P.z], i * 3);
              const fall = Math.pow(1 - j / TRAIL, 1.5);
              alpha[i] = smooth(0, 0.08, tt) * (1 - smooth(0.9, 1, tt)) * fall * intro;
              size[i] = (0.008 + 0.014 * Math.sin(Math.PI * tt)) * (1 - (j / TRAIL) * 0.55) * (j === 0 ? 1.8 : 1);
              hot[i] = 1 - j / TRAIL;
            }
          }
        }
        ptGeo.attributes.position.needsUpdate = true;
        ptGeo.attributes.aSize.needsUpdate = true;
        ptGeo.attributes.aAlpha.needsUpdate = true;
        ptGeo.attributes.aHot.needsUpdate = true;

        // pulse rings
        toWorld(PHONE.u, PHONE.v, A);
        rings.forEach((r, i) => {
          const ph = (time * 0.32 + i / rings.length) % 1;
          r.position.set(A.x, A.y, 0.03);
          r.scale.setScalar(0.04 + ph * 0.34);
          (r.material as THREE.MeshBasicMaterial).opacity = (1 - ph) * (1 - ph) * 0.55 * intro;
        });
        toWorld(SOURCE.u, SOURCE.v, B);
        srcRings.forEach((r, i) => {
          const ph = (time * 0.4 + i / srcRings.length) % 1;
          r.position.set(B.x, B.y, 0.03);
          r.scale.setScalar(0.02 + ph * 0.14);
          (r.material as THREE.MeshBasicMaterial).opacity = (1 - ph) * 0.45 * intro;
        });

        // camera drift (real parallax) + gentle idle sway of the whole set
        pt.sx += (pt.x - pt.sx) * 0.05;
        pt.sy += (pt.y - pt.sy) * 0.05;
        camera.position.x = pt.sx * 0.1;
        camera.position.y = -pt.sy * 0.065 + (scrollP - 0.5) * -0.05;
        camera.position.z = camZ - (1 - intro) * -0.25;
        camera.lookAt(0, 0, 0);
        world.rotation.y = reduced ? 0 : Math.sin(time * 0.45) * 0.022;
        world.rotation.x = reduced ? 0 : Math.cos(time * 0.37) * 0.012;
        planeU.uPointer.value.set(pt.sx, -pt.sy);
        planeU.uTime.value = time;

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
        kick();
      };
      const onScroll = () => {
        const r = wrap.getBoundingClientRect();
        scrollP = Math.min(Math.max(1 - (r.top + r.height / 2) / window.innerHeight, 0), 1);
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
      onScroll();
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onResize);
      kick();
      setReady(true);

      cleanup = () => {
        if (raf) cancelAnimationFrame(raf);
        vis.disconnect();
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onResize);
        planeGeo.dispose();
        planeMat.dispose();
        ptGeo.dispose();
        ptMat.dispose();
        ringGeo.dispose();
        [...rings, ...srcRings].forEach((r) => (r.material as THREE.Material).dispose());
        tex.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [near, src]);

  return (
    <div ref={wrapRef} className={`depth${ready ? " is-ready" : ""}`}>
      {children}
    </div>
  );
}
