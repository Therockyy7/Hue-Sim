// Lắp ráp toàn bộ thế giới + hiệu ứng (nước, mưa, hơi nước, đèn đêm)
import * as THREE from 'three';
import { makeMaterials, radialTexture } from './materials.js';
import { buildTerrain, buildRoads } from './terrain.js';
import { buildCitadel } from './citadel.js';
import { buildPagoda } from './pagoda.js';
import { buildBridge } from './bridge.js';
import { buildMarket } from './market.js';
import { buildTomb } from './tomb.js';
import { buildCity } from './city.js';
import { Halos } from './props.js';
import { surfaceUniforms } from './surfaces.js';
import { Water } from './water.js';
import { FOL } from './foliage.js';
import { buildScenery } from './scenery.js';

const nextFrame = () => new Promise((r) => setTimeout(r, 30));

export async function buildWorld(scene, physics, progress = () => {}) {
  const mats = makeMaterials();
  const surf = surfaceUniforms();
  mats.led = new THREE.MeshBasicMaterial({ color: 0x8a8d90, toneMapped: false });
  mats.win = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  const W = {
    scene, physics, mats, surf, halos: new Halos(scene, mats.halo), signs: [], gates: {}, spots: {},
    ponds: [], paddies: [], benches: [], riverGaps: [], steam: [], seats: [], farmers: [], marketStalls: [], mapRects: [],
  };
  const steps = [
    ['Đắp đất, khơi dòng sông Hương…', () => { buildTerrain(scene, mats.terrain); buildRoads(scene, mats.road); }],
    ['Xây Kinh Thành và Đại Nội…', () => buildCitadel(W)],
    ['Dựng chùa Thiên Mụ trên đồi Hà Khê…', () => buildPagoda(W)],
    ['Bắc cầu Tràng Tiền sáu vài mười hai nhịp…', () => buildBridge(W)],
    ['Họp chợ Đông Ba…', () => buildMarket(W)],
    ['Xây lăng Khải Định…', () => buildTomb(W)],
    ['Lên đèn phố xá…', () => buildCity(W)],
    ['Thả thuyền xuống sông…', () => { buildWater(W); W.halos.build(); buildEffects(W); buildNightLights(W); buildScenery(W); FOL.build(scene); W.foliage = FOL; }],
  ];
  for (let i = 0; i < steps.length; i++) {
    progress(i / steps.length, steps[i][0]);
    await nextFrame();
    steps[i][1]();
  }
  progress(1, 'Sẵn sàng!');
  return W;
}

function buildWater(W) {
  const riverNormals = W.mats.water.normalMap.clone();
  riverNormals.repeat.set(1, 1);
  riverNormals.needsUpdate = true;
  W.water = new Water(W, riverNormals);
  const pondMat = W.mats.water.clone();
  pondMat.normalMap = W.mats.water.normalMap.clone();
  pondMat.normalMap.repeat.set(4, 4);
  pondMat.normalMap.needsUpdate = true;
  pondMat.color.set(0x3a6a5a);
  W.mats.pond = pondMat;
  for (const p of W.ponds) {
    const pg = new THREE.PlaneGeometry(p.w, p.d);
    pg.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(pg, pondMat);
    m.position.set(p.x, p.y, p.z);
    m.receiveShadow = true;
    W.scene.add(m);
  }
}

// đèn chiếu sáng các công trình về đêm
function buildNightLights(W) {
  W.nightLights = [];
  const L = [
    [-70, 9, -84, 0xffc27a, 500, 55], [-70, 10, -158, 0xffcf7a, 700, 70], [-70, 9, -222, 0xffc070, 450, 50],
    [-340, 14, -82, 0xffb870, 520, 50], [160, 10, -86, 0xffd090, 600, 65], [46, 5, 134, 0xffa860, 380, 45],
    [40, 5, 42, 0xffb070, 260, 35], [-60, 9, 236, 0xffd8a0, 380, 45], [-250, 20, 360, 0xffc890, 520, 55],
  ];
  for (const [x, y, z, c, i, d] of L) {
    const l = new THREE.PointLight(c, 0, d, 1.6);
    l.position.set(x, y, z);
    l.userData.base = i;
    W.scene.add(l);
    W.nightLights.push(l);
  }
}

function buildEffects(W) {
  // hơi nước bốc lên từ nồi bún
  const per = 7;
  const n = W.steam.length * per;
  const pos = new Float32Array(n * 3);
  W.steamData = [];
  W.steam.forEach(([x, y, z], i) => { for (let k = 0; k < per; k++) W.steamData.push({ x, y, z, t: k / per }); });
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  W.steamPts = new THREE.Points(sg, new THREE.PointsMaterial({ map: radialTexture(), size: 0.9, transparent: true, opacity: 0.28, depthWrite: false, color: 0xffffff }));
  W.steamPts.frustumCulled = false;
  W.scene.add(W.steamPts);
  // mưa
  const RN = 2200;
  const rp = new Float32Array(RN * 6);
  W.rainDrops = [];
  for (let i = 0; i < RN; i++) W.rainDrops.push({ x: (Math.random() - 0.5) * 60, y: Math.random() * 30, z: (Math.random() - 0.5) * 60, v: 18 + Math.random() * 6 });
  const rg = new THREE.BufferGeometry();
  rg.setAttribute('position', new THREE.BufferAttribute(rp, 3));
  W.rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xc8d4e0, transparent: true, opacity: 0.0, depthWrite: false }));
  W.rain.frustumCulled = false;
  W.scene.add(W.rain);
  W.water.hide.push(W.rain, W.steamPts);
}

const _c = new THREE.Color();
export function updateWorld(W, dt, t, sky, cam) {
  const n = sky.night;
  W.mats.glow.color.setScalar(0.62 + n * 2.6);
  W.mats.win.color.setScalar(0.2 + n * 1.5);
  if (W.windowMesh) W.windowMesh.visible = n > 0.2;
  W.mats.halo.opacity = n * 0.6;
  if (W.nightLights) for (const l of W.nightLights) l.intensity = n * l.userData.base;
  if (n > 0.3) { _c.setHSL((t * 0.04) % 1, 0.9, 0.55).multiplyScalar(1 + n * 2.2); W.mats.led.color.copy(_c); }
  else W.mats.led.color.setRGB(0.55, 0.57, 0.6);
  for (const s of W.signs) s.material.emissiveIntensity = 0.04 + n * 0.55;
  if (W.flag) W.flag.userData.update(t);
  W.water.update(t, sky, W.scene);
  W.foliage.update(t, sky, cam);
  W.surf.uWet.value += (sky.rain - W.surf.uWet.value) * Math.min(1, dt * 0.25);
  if (W.mats.pond) W.mats.pond.normalMap.offset.set(t * 0.004, t * 0.003);
  // hơi nước
  if (W.steamPts) {
    const a = W.steamPts.geometry.attributes.position;
    W.steamData.forEach((p, i) => {
      p.t += dt * 0.35; if (p.t > 1) p.t -= 1;
      a.setXYZ(i, p.x + Math.sin(p.t * 6 + i) * 0.15 * p.t, p.y + p.t * 1.6, p.z + Math.cos(p.t * 5 + i) * 0.1 * p.t);
    });
    a.needsUpdate = true;
  }
  // mưa quanh camera
  const r = sky.rain;
  W.rain.visible = r > 0.03;
  if (W.rain.visible) {
    W.rain.material.opacity = r * 0.42;
    const a = W.rain.geometry.attributes.position;
    let i = 0;
    for (const d of W.rainDrops) {
      d.y -= d.v * dt;
      if (d.y < -2) { d.y = 28; d.x = (Math.random() - 0.5) * 60; d.z = (Math.random() - 0.5) * 60; }
      const x = cam.x + d.x, y = cam.y - 4 + d.y, z = cam.z + d.z;
      a.setXYZ(i++, x, y, z); a.setXYZ(i++, x + 0.05, y + 0.7, z);
    }
    a.needsUpdate = true;
  }
}
