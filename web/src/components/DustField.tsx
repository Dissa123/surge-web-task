"use client";

import { useEffect, useRef } from "react";
import type * as THREE from "three";

interface Props {
  /** `light` suits dark/grey scenes, `dark` suits white scenes. */
  tone?: "light" | "dark";
  count?: number;
  /** Which side of the product photo this canvas sits on: behind it, in front of it, or both. */
  layer?: "back" | "front";
  className?: string;
}

const VERT = `
attribute float aSize; attribute float aSeed;
uniform float uTime, uPx, uScroll, uLayer;
varying float vAlpha;
void main(){
  vec3 p = position;
  float speed = 0.5 + aSeed;
  p.y = mod(p.y + uTime * 0.028 * speed + uScroll * (0.6 + 0.5 * abs(p.z)) + 1.3, 2.6) - 1.3;
  p.x += sin(uTime * 0.25 + aSeed * 6.2831) * 0.05;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float coc = clamp(abs(p.z) / 1.5, 0.0, 1.0);                 // distance from the focal plane -> bokeh size
  gl_PointSize = uPx * aSize * (1.0 + coc * 2.2) / -mv.z;
  float twinkle = 0.55 + 0.45 * sin(uTime * 0.7 + aSeed * 12.0);
  vAlpha = mix(0.75, 0.16, coc) * twinkle;
  gl_Position = projectionMatrix * mv;
}`;
const FRAG = `
uniform vec3 uColor;
varying float vAlpha;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.18, d) * vAlpha;
  gl_FragColor = vec4(uColor, a);
}`;

/**
 * Floating bokeh dust in real 3D: points live at different depths around the product photo, are
 * blurred in proportion to their distance from the focal plane, and the camera drifts with the cursor
 * so the layers parallax against each other and against the photograph.
 */
export function DustField({ tone = "light", count = 60, layer = "front", className = "" }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;
    let cleanup = () => {};

    const start = async () => {
      const T = await import("three");
      if (disposed) return;
      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
      } catch {
        return;
      }
      const dpr = Math.min(window.devicePixelRatio, 2);
      renderer.setPixelRatio(dpr);
      renderer.setClearColor(0x000000, 0);
      mount.appendChild(renderer.domElement);

      const fov = 35;
      const camera = new T.PerspectiveCamera(fov, 1, 0.1, 20);
      const camZ = 1 / Math.tan((fov * Math.PI) / 360);
      camera.position.set(0, 0, camZ);

      const scene = new T.Scene();
      const pos = new Float32Array(count * 3);
      const size = new Float32Array(count);
      const seed = new Float32Array(count);
      const zMin = layer === "back" ? -1.5 : 0.25;
      const zMax = layer === "back" ? -0.2 : 1.6;
      for (let i = 0; i < count; i++) {
        pos.set([(Math.random() - 0.5) * 4.4, (Math.random() - 0.5) * 2.6, zMin + Math.random() * (zMax - zMin)], i * 3);
        size[i] = 0.006 + Math.random() * 0.014;
        seed[i] = Math.random();
      }
      const geometry = new T.BufferGeometry();
      geometry.setAttribute("position", new T.BufferAttribute(pos, 3));
      geometry.setAttribute("aSize", new T.BufferAttribute(size, 1));
      geometry.setAttribute("aSeed", new T.BufferAttribute(seed, 1));
      const uniforms = {
        uTime: { value: 0 },
        uPx: { value: 1 },
        uScroll: { value: 0 },
        uLayer: { value: layer === "back" ? 0 : 1 },
        uColor: { value: new T.Color(tone === "light" ? 0xffffff : 0x0d0d0e) },
      };
      const material = new T.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false });
      const points = new T.Points(geometry, material);
      scene.add(points);

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const pt = { x: 0, y: 0, sx: 0, sy: 0 };
      let visible = true;
      let raf = 0;
      let w = 1, h = 1;

      const layout = () => {
        w = mount.clientWidth || 1;
        h = mount.clientHeight || 1;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        points.scale.x = Math.max(camera.aspect / 1.6, 0.6);
        uniforms.uPx.value = (h * dpr) / (2 * Math.tan((fov * Math.PI) / 360));
      };
      const frame = (now: number) => {
        raf = 0;
        uniforms.uTime.value = reduced ? 3 : now / 1000;
        uniforms.uScroll.value = window.scrollY * 0.0004;
        pt.sx += (pt.x - pt.sx) * 0.05;
        pt.sy += (pt.y - pt.sy) * 0.05;
        camera.position.x = pt.sx * 0.22;
        camera.position.y = -pt.sy * 0.14;
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
        if (visible && !reduced) raf = requestAnimationFrame(frame);
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
      io.observe(mount);

      layout();
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("resize", onResize);
      kick();

      cleanup = () => {
        if (raf) cancelAnimationFrame(raf);
        io.disconnect();
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("resize", onResize);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    };

    const near = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          near.disconnect();
          void start();
        }
      },
      { rootMargin: "400px" },
    );
    near.observe(mount);

    return () => {
      disposed = true;
      near.disconnect();
      cleanup();
    };
  }, [tone, count, layer]);

  return <div ref={mountRef} className={`dust ${className}`} aria-hidden="true" />;
}
