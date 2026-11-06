import type * as THREE from "three";

type ThreeNS = typeof import("three");

/** Pen axis = Y, nib at -Y. Nib tip sits at y = -3.9, cap end at y = 10.18. */
export const PEN_LEN = 14.08;
export const PEN_CENTER_Y = 3.14;

export interface PenModel {
  pen: THREE.Group;
  dispose: () => void;
}

/** Procedural fountain pen: fluted aluminium cap, slim clip, graphite grip, control button, shouldered steel nib. */
export function buildPen(T: ThreeNS): PenModel {
  const aluminium = new T.MeshPhysicalMaterial({ color: 0xc9ccd1, metalness: 1, roughness: 0.3, clearcoat: 0.2, clearcoatRoughness: 0.35 });
  const brushed = new T.MeshPhysicalMaterial({ color: 0xb8bcc3, metalness: 1, roughness: 0.2 });
  const graphite = new T.MeshPhysicalMaterial({ color: 0x131416, metalness: 0.25, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.04 });
  const steel = new T.MeshPhysicalMaterial({ color: 0xaeb2b9, metalness: 1, roughness: 0.16 });

  const R = 1;
  const lathe = (pts: [number, number][], segs = 96) =>
    new T.LatheGeometry(pts.map(([r, y]) => new T.Vector2(r, y)), segs);
  const pen = new T.Group();

  pen.add(new T.Mesh(lathe([[0, 0.9], [R * 0.99, 0.9], [R, 1.0], [R, 3.6], [R * 0.99, 3.7], [0, 3.7]]), aluminium));
  pen.add(new T.Mesh(lathe([[0, -1.1], [R * 0.34, -1.1], [R * 0.42, -0.95], [R * 0.74, -0.25], [R * 0.86, 0.45], [R * 0.9, 0.9], [0, 0.9]]), graphite));
  pen.add(new T.Mesh(lathe([[R * 0.88, 0.82], [R * 1.012, 0.82], [R * 1.012, 0.98], [R * 0.88, 0.98]]), steel));

  // Fluted cap: dense lathe whose radius is modulated around the circumference.
  const capGeo = lathe(
    [[0, 3.6], [R * 1.02, 3.6], [R * 1.02, 8.3], [R * 0.98, 9.2], [R * 0.82, 9.8], [R * 0.45, 10.1], [0, 10.18]],
    260,
  );
  const pos = capGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (y > 4.2 && y < 8.6) {
      const k = 1 + 0.012 * Math.sin(Math.atan2(z, x) * 96);
      pos.setX(i, x * k);
      pos.setZ(i, z * k);
    }
  }
  capGeo.computeVertexNormals();
  pen.add(new T.Mesh(capGeo, brushed));
  pen.add(new T.Mesh(lathe([[R * 1.0, 3.5], [R * 1.05, 3.5], [R * 1.05, 3.72], [R * 1.0, 3.72]]), graphite));

  // Slim clip sitting flush on the cap
  const clipShape = new T.Shape();
  clipShape.moveTo(0, 0);
  clipShape.lineTo(0.07, 0);
  clipShape.lineTo(0.07, 5.35);
  clipShape.quadraticCurveTo(0.07, 5.55, 0, 5.55);
  clipShape.lineTo(0, 0);
  const clip = new T.Mesh(new T.ExtrudeGeometry(clipShape, { depth: 0.36, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2 }), brushed);
  clip.position.set(R * 1.02, 4.25, -0.18);
  pen.add(clip);

  // Control button
  const button = new T.Mesh(new T.CylinderGeometry(0.17, 0.17, 0.12, 32), brushed);
  button.rotation.z = Math.PI / 2;
  button.position.set(R * 0.86, 0.35, 0);
  pen.add(button);

  // Nib: shouldered plate with centre slit and breather hole
  const nibShape = new T.Shape();
  nibShape.moveTo(-0.5, 0);
  nibShape.bezierCurveTo(-0.62, -0.7, -0.5, -1.4, -0.16, -2.2);
  nibShape.lineTo(0, -2.9);
  nibShape.lineTo(0.16, -2.2);
  nibShape.bezierCurveTo(0.5, -1.4, 0.62, -0.7, 0.5, 0);
  nibShape.lineTo(-0.5, 0);
  const slit = new T.Path();
  slit.moveTo(-0.014, -1.05);
  slit.lineTo(0.014, -1.05);
  slit.lineTo(0.006, -2.82);
  slit.lineTo(-0.006, -2.82);
  nibShape.holes.push(slit);
  const hole = new T.Path();
  hole.absarc(0, -0.95, 0.075, 0, Math.PI * 2, true);
  nibShape.holes.push(hole);
  const nibGeo = new T.ExtrudeGeometry(nibShape, { depth: 0.06, bevelEnabled: true, bevelSize: 0.014, bevelThickness: 0.014, bevelSegments: 2, curveSegments: 24 });
  const np = nibGeo.attributes.position;
  for (let i = 0; i < np.count; i++) np.setZ(i, np.getZ(i) + 0.13 * (np.getX(i) / 0.6) ** 2); // curl the wings around the section
  nibGeo.computeVertexNormals();
  const nib = new T.Mesh(nibGeo, steel);
  nib.position.set(0, -1.0, -0.05);
  pen.add(nib);

  return {
    pen,
    dispose: () => {
      pen.traverse((o) => (o as THREE.Mesh).geometry?.dispose());
      [aluminium, brushed, graphite, steel].forEach((m) => m.dispose());
    },
  };
}

/** Studio-style image based lighting shared by pen scenes. */
export async function createStudio(T: ThreeNS, renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
  const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
  const pmrem = new T.PMREMGenerator(renderer);
  const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTexture;
  scene.environmentIntensity = 1.15;
  const key = new T.DirectionalLight(0xffffff, 2.4);
  key.position.set(-4, 6, 8);
  const rim = new T.DirectionalLight(0xa9c2ff, 1.6);
  rim.position.set(6, -4, -7);
  scene.add(key, rim);
  return () => {
    envTexture.dispose();
    pmrem.dispose();
  };
}
