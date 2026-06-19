/**
 * inner-compass main.js
 * Three.js 3D scene: coordinate system, axes, sphere, and controls.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { initSliders, setOnCoordsChange } from './sliders.js';

// ============================================================
// Scale factors: raw formula output → scene units
// ============================================================
const SCALE_X = 0.01;   // 1–1000 → 0.01–10
const SCALE_Y = 0.1;    // 1–100  → 0.1–10
const SCALE_Z = 0.1;    // −90–10 → −9–1

// Axes extent in scene units
const AXIS_MIN_X = 0;
const AXIS_MAX_X = 10;
const AXIS_MIN_Y = 0;
const AXIS_MAX_Y = 10;
const AXIS_MIN_Z = -9;
const AXIS_MAX_Z = 1;

// ============================================================
// Scene setup
// ============================================================
const container = document.getElementById('canvas-container');
const canvas = document.getElementById('three-canvas');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0f);
scene.fog = new THREE.Fog(0x0a0a0f, 20, 60);

const camera = new THREE.PerspectiveCamera(
  50,
  container.clientWidth / container.clientHeight,
  0.1,
  100
);
camera.position.set(8, 6, 10);
camera.lookAt(5, 3, -3);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

// ============================================================
// Lights
// ============================================================
scene.add(new THREE.AmbientLight(0x404060, 2.5));
const dirLight = new THREE.DirectionalLight(0xffffff, 3);
dirLight.position.set(10, 15, 10);
scene.add(dirLight);

// ============================================================
// OrbitControls
// ============================================================
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(5, 3, -3);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 3;
controls.maxDistance = 30;
controls.update();

// ============================================================
// Helpers: create axis, ticks, labels
// ============================================================

function createAxis(from, to, color) {
  const material = new THREE.LineBasicMaterial({ color, linewidth: 1 });
  const points = [new THREE.Vector3(...from), new THREE.Vector3(...to)];
  const geom = new THREE.BufferGeometry().setFromPoints(points);
  return new THREE.Line(geom, material);
}

function createTick(origin, direction, color, length = 0.15) {
  const half = length / 2;
  const dx = direction[0] === 0 ? half : 0;
  const dy = direction[1] === 0 ? half : 0;
  const dz = direction[2] === 0 ? half : 0;
  const from = [
    origin[0] - dx,
    origin[1] - dy,
    origin[2] - dz,
  ];
  const to = [
    origin[0] + dx,
    origin[1] + dy,
    origin[2] + dz,
  ];
  return createAxis(from, to, color);
}

function createLabelSprite(text, position, color = '#ffffff') {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size / 2;
  const ctx = c.getContext('2d');
  ctx.fillStyle = color;
  ctx.font = 'bold 36px -apple-system, "Noto Sans SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, size / 2, size / 4);

  const texture = new THREE.CanvasTexture(c);
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.position.set(...position);
  sprite.scale.set(1.2, 0.6, 1);
  return sprite;
}

function addAxisSystem() {
  const group = new THREE.Group();

  // Axes
  group.add(createAxis([AXIS_MIN_X, 0, 0], [AXIS_MAX_X, 0, 0], 0xff4444)); // X red
  group.add(createAxis([0, AXIS_MIN_Y, 0], [0, AXIS_MAX_Y, 0], 0x44ff44)); // Y green
  group.add(createAxis([0, 0, AXIS_MIN_Z], [0, 0, AXIS_MAX_Z], 0x4444ff)); // Z blue

  // Tick marks for X (0–1000 raw, 0–10 scene)
  for (let raw = 0; raw <= 1000; raw += 100) {
    const sx = raw * SCALE_X;
    group.add(createTick([sx, 0, 0], [0, 1, 0], 0xff4444));
    group.add(createTick([sx, 0, 0], [0, 0, 1], 0xff4444));
    group.add(createLabelSprite(String(raw), [sx, -0.4, -0.4], '#ff6666'));
  }

  // Tick marks for Y (0–100 raw, 0–10 scene)
  for (let raw = 0; raw <= 100; raw += 10) {
    const sy = raw * SCALE_Y;
    group.add(createTick([0, sy, 0], [1, 0, 0], 0x44ff44));
    group.add(createTick([0, sy, 0], [0, 0, 1], 0x44ff44));
    group.add(createLabelSprite(String(raw), [-0.4, sy, -0.4], '#66ff66'));
  }

  // Tick marks for Z (−90–10 raw, −9–1 scene)
  for (let raw = -90; raw <= 10; raw += 10) {
    const sz = raw * SCALE_Z;
    group.add(createTick([0, 0, sz], [1, 0, 0], 0x4444ff));
    group.add(createTick([0, 0, sz], [0, 1, 0], 0x4444ff));
    group.add(createLabelSprite(String(raw), [-0.4, -0.4, sz], '#6666ff'));
  }

  // Axis labels at ends
  group.add(createLabelSprite('认知实践轴 X', [AXIS_MAX_X + 0.6, 0.5, 0], '#ff6666'));
  group.add(createLabelSprite('连接轴 Y', [0.5, AXIS_MAX_Y + 0.6, 0], '#66ff66'));
  group.add(createLabelSprite('心灵自由轴 Z', [0.5, 0, AXIS_MIN_Z - 0.8], '#6666ff'));

  return group;
}

function addReferencePlanes() {
  const group = new THREE.Group();

  // XY plane at Z=0 (the bottom reference — but Z ranges from -9 to 1)
  // Use a thin grid on the "ground" at Z=-9, Z=0, Z=1
  const planeMat = new THREE.MeshBasicMaterial({
    color: 0x333344,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.08,
    depthWrite: false,
  });

  // XY plane at Z=0
  const xyGeom = new THREE.PlaneGeometry(AXIS_MAX_X, AXIS_MAX_Y);
  const xyPlane = new THREE.Mesh(xyGeom, planeMat.clone());
  xyPlane.position.set(AXIS_MAX_X / 2, AXIS_MAX_Y / 2, 0);
  xyPlane.material.opacity = 0.06;
  group.add(xyPlane);

  // XZ plane at Y=0
  const xzGeom = new THREE.PlaneGeometry(AXIS_MAX_X, AXIS_MAX_Z - AXIS_MIN_Z);
  const xzPlane = new THREE.Mesh(xzGeom, planeMat.clone());
  xzPlane.rotation.x = -Math.PI / 2;
  xzPlane.position.set(AXIS_MAX_X / 2, 0, (AXIS_MAX_Z + AXIS_MIN_Z) / 2);
  xzPlane.material.opacity = 0.06;
  group.add(xzPlane);

  // YZ plane at X=0
  const yzGeom = new THREE.PlaneGeometry(AXIS_MAX_Y, AXIS_MAX_Z - AXIS_MIN_Z);
  const yzPlane = new THREE.Mesh(yzGeom, planeMat.clone());
  yzPlane.rotation.y = Math.PI / 2;
  yzPlane.position.set(0, AXIS_MAX_Y / 2, (AXIS_MAX_Z + AXIS_MIN_Z) / 2);
  yzPlane.material.opacity = 0.06;
  group.add(yzPlane);

  return group;
}

function addOriginSphere() {
  const geom = new THREE.SphereGeometry(0.12, 32, 32);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x444444, roughness: 0.3 });
  const sphere = new THREE.Mesh(geom, mat);
  sphere.position.set(0, 0, 0);
  scene.add(sphere);
}

// ============================================================
// Position sphere
// ============================================================
const sphereGeom = new THREE.SphereGeometry(0.2, 48, 48);
const sphereMat = new THREE.MeshStandardMaterial({
  color: 0xffcc00,
  emissive: 0xff8800,
  emissiveIntensity: 1.5,
  roughness: 0.2,
  metalness: 0.1,
});
const positionSphere = new THREE.Mesh(sphereGeom, sphereMat);
positionSphere.castShadow = true;

// Glow ring around the sphere
const ringGeom = new THREE.TorusGeometry(0.28, 0.04, 16, 32);
const ringMat = new THREE.MeshBasicMaterial({ color: 0xffcc00, transparent: true, opacity: 0.6, depthWrite: false });
const ring = new THREE.Mesh(ringGeom, ringMat);
positionSphere.add(ring);

// Projection lines from sphere to planes
const projLineMatX = new THREE.LineDashedMaterial({ color: 0xff4444, dashSize: 0.3, gapSize: 0.2, transparent: true, opacity: 0.4 });
const projLineMatY = new THREE.LineDashedMaterial({ color: 0x44ff44, dashSize: 0.3, gapSize: 0.2, transparent: true, opacity: 0.4 });
const projLineMatZ = new THREE.LineDashedMaterial({ color: 0x4444ff, dashSize: 0.3, gapSize: 0.2, transparent: true, opacity: 0.4 });

let projLineX, projLineY, projLineZ;

function updateProjectionLine(line, mat, from, to) {
  if (line) scene.remove(line);
  const points = [new THREE.Vector3(...from), new THREE.Vector3(...to)];
  const geom = new THREE.BufferGeometry().setFromPoints(points);
  const newLine = new THREE.Line(geom, mat);
  newLine.computeLineDistances();
  return newLine;
}

// ============================================================
// Build scene
// ============================================================
scene.add(addAxisSystem());
scene.add(addReferencePlanes());
addOriginSphere();
scene.add(positionSphere);

// Initial position (default params: X=125, Y=25, Z=-20)
const defaultCoords = { x: 125, y: 25, z: -20 };
updateSpherePosition(defaultCoords);

// ============================================================
// Sphere position update
// ============================================================
function updateSpherePosition(coords) {
  const sx = coords.x * SCALE_X;
  const sy = coords.y * SCALE_Y;
  const sz = coords.z * SCALE_Z;

  positionSphere.position.set(sx, sy, sz);

  // Update projection lines
  projLineX = updateProjectionLine(projLineX, projLineMatX, [sx, sy, sz], [sx, 0, 0]);   // to XZ plane (Y=0)
  projLineY = updateProjectionLine(projLineY, projLineMatY, [sx, sy, sz], [0, sy, 0]);   // to YZ plane (X=0)
  projLineZ = updateProjectionLine(projLineZ, projLineMatZ, [sx, sy, sz], [0, 0, sz]);   // to XY plane (Z=0)

  scene.add(projLineX);
  scene.add(projLineY);
  scene.add(projLineZ);
}

// ============================================================
// Render loop
// ============================================================
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  // Pulse the ring
  ring.rotation.x += 0.01;
  ring.rotation.y += 0.02;
  ring.scale.setScalar(1 + Math.sin(Date.now() * 0.005) * 0.05);

  renderer.render(scene, camera);
}

// ============================================================
// Resize handler
// ============================================================
window.addEventListener('resize', () => {
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
});

// ============================================================
// Wire up sliders
// ============================================================
setOnCoordsChange((coords) => {
  updateSpherePosition(coords);
});

initSliders();

// Start render
animate();
