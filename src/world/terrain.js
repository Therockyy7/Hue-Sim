import * as THREE from 'three';
import { RIVER, ROADS, WORLD, smoothstep } from './layout.js';
import { Builder } from './builder.js';

// ---- Nhiễu giá trị 2D
function hash(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
export function noise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, z) {
  return noise(x, z) * 0.5 + noise(x * 2.03, z * 2.03) * 0.25 + noise(x * 4.1, z * 4.1) * 0.125;
}

// Khu lăng Khải Định: 3 tầng sân + bậc cấp ở giữa, đồi phía sau
export const KD = { x0: -276, x1: -224, cx: -250 };
function khaiDinhTerrace(x, z) {
  const c = Math.abs(x - KD.cx);
  if (z < 290) return Math.max(0, (z - 280) / 10) * 4;
  if (z < 330) return 4;
  if (z < 336) return c < 5 ? 4 + (z - 330) / 6 * 4 : 8;
  if (z < 352) return 8;
  if (z < 362) return c < 5 ? 8 + (z - 352) / 10 * 5 : 13;
  return 13;
}
export function inKhaiDinh(x, z) {
  if (z >= 290 && z < 396) return x > KD.x0 && x < KD.x1;
  if (z > 280 && z < 290) return Math.abs(x - KD.cx) < 7;
  return false;
}

export function terrainHeight(x, z) {
  const az = Math.abs(z);
  if (az < RIVER.bank) {
    if (az < RIVER.half - 1) return RIVER.bed;
    return RIVER.bed + (az - (RIVER.half - 1)) / (RIVER.bank - RIVER.half + 1) * -RIVER.bed;
  }
  let h = 0;
  // Đồi Hà Khê - chùa Thiên Mụ
  if (z < -76) {
    const fz = smoothstep(-77, -94, z);           // sườn dốc hướng ra sông
    const fx = smoothstep(64, 38, Math.abs(x + 340));
    const fb = smoothstep(-178, -152, z);          // thoải dần phía Bắc
    h = Math.max(h, 7 * fz * fx * fb);
  }
  // Lăng Khải Định trên sườn đồi Châu Chữ
  if (z > 260) {
    if (inKhaiDinh(x, z)) return khaiDinhTerrace(x, z);
    const hs = 15 * smoothstep(272, 400, z) * (1 - smoothstep(55, 120, Math.abs(x + 250)));
    h = Math.max(h, hs);
  }
  // Ngoài biên: đồi núi bao quanh
  const ox = Math.max(WORLD.minX - x, x - WORLD.maxX, 0);
  const oz = Math.max(WORLD.minZ - z, z - WORLD.maxZ, 0);
  const out = Math.hypot(ox, oz);
  if (out > 0) h += smoothstep(0, 260, out) * (25 + 40 * fbm(x * 0.008, z * 0.008));
  return h;
}

// Chiều cao hiển thị (hạ thấp dưới các nền đá để không bị trồi lên)
function visualHeight(x, z) {
  let h = terrainHeight(x, z);
  if (inKhaiDinh(x, z)) h -= 3;
  return h;
}

export function buildTerrain(scene, mat) {
  const SIZE = 1500, SEG = 250;
  const g = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  g.rotateX(-Math.PI / 2);
  g.translate(-65, 0, 30);
  const pos = g.attributes.position;
  const col = new Float32Array(pos.count * 3);
  const tmix = new Float32Array(pos.count); // 0 = cỏ, 1 = đất/cát
  const c = new THREE.Color();
  const grassA = new THREE.Color(0x6e9a45), grassB = new THREE.Color(0x4f7f34), dry = new THREE.Color(0x9a9a55);
  const sand = new THREE.Color(0x8d7a58), mud = new THREE.Color(0x4d4535), hill = new THREE.Color(0x3f6b33);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const h = visualHeight(x, z);
    pos.setY(i, h);
    const n = fbm(x * 0.03, z * 0.03);
    c.copy(grassA).lerp(grassB, n);
    const n2 = noise(x * 0.11, z * 0.11);
    if (n2 > 0.72) { c.lerp(dry, (n2 - 0.72) * 2); tmix[i] = Math.min(0.6, (n2 - 0.72) * 2.4); }
    if (Math.abs(z) < RIVER.bank + 0.5) { c.copy(Math.abs(z) < RIVER.half ? mud : sand); tmix[i] = 1; }
    if (h > 8) c.lerp(hill, Math.min(1, (h - 8) / 20));
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('tmix', new THREE.BufferAttribute(tmix, 1));
  g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, mat);
  mesh.receiveShadow = true;
  mesh.name = 'terrain';
  scene.add(mesh);

  // Núi xa (Trường Sơn, núi Ngự Bình)
  const b = new Builder();
  b.jitter = 0.08;
  const rnd = mulberry(7);
  for (let i = 0; i < 70; i++) {
    const a = (i / 70) * Math.PI * 2 + rnd() * 0.05;
    const r = 820 + rnd() * 380;
    const x = -65 + Math.cos(a) * r, z = 30 + Math.sin(a) * r;
    const west = Math.cos(a) < 0 ? 1.6 : 1; // dãy Trường Sơn phía Tây cao hơn
    const h = (70 + rnd() * 120) * west;
    const R = Math.min(h * (1.6 + rnd()), r - 520);
    const geo = new THREE.ConeGeometry(R, h, 7, 2, true);
    jitterGeo(geo, rnd, R * 0.12);
    b.geo(geo, rnd() > 0.5 ? 0x4b6e4e : 0x557a55, x, h / 2 - 15, z, rnd() * 6);
    geo.dispose();
  }
  // Ngự Bình - "bức bình phong" phía Nam
  const ngu = new THREE.CylinderGeometry(70, 150, 110, 9, 2, true);
  jitterGeo(ngu, rnd, 6);
  b.geo(ngu, 0x4f7550, 110, 55 - 5, 640, 0.2);
  ngu.dispose();
  const mts = b.build(mat, { cast: false, receive: false });
  mts.name = 'mountains';
  scene.add(mts);
  return mesh;
}

export function buildRoads(scene, mat) {
  const b = new Builder();
  b.jitter = 0;
  const inOther = (x, z, self) => ROADS.some((r, j) => {
    if (j === self) return false;
    const [ax, az, bx, bz, w] = r;
    const vx = bx - ax, vz = bz - az, L2 = vx * vx + vz * vz;
    const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / L2));
    return Math.hypot(x - (ax + vx * t), z - (az + vz * t)) < w / 2 + 1.9;
  });
  ROADS.forEach(([x1, z1, x2, z2, w], idx) => {
    const dx = x2 - x1, dz = z2 - z1;
    const len = Math.hypot(dx, dz);
    const ang = Math.atan2(dx, dz);
    const n = Math.max(1, Math.ceil(len / 4));
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n;
      const ax = x1 + dx * t0, az = z1 + dz * t0, bx = x1 + dx * t1, bz = z1 + dz * t1;
      const mx = (ax + bx) / 2, mz = (az + bz) / 2;
      const ha = terrainHeight(ax, az), hb = terrainHeight(bx, bz);
      const segLen = len / n + 0.05;
      const slope = Math.atan2(hb - ha, len / n);
      b.save();
      b.translate(mx, (ha + hb) / 2 + 0.06, mz);
      b.rotateY(ang);
      b.rotateX(-slope);
      b.box(w, 0.1, segLen, 0, -0.05, 0, 0x4b4b52);
      // vỉa hè (bỏ qua ở giao lộ)
      const nx = Math.cos(ang), nz = -Math.sin(ang);
      for (const s of [-1, 1]) {
        const sx = mx + nx * s * (w / 2 + 0.9), sz = mz + nz * s * (w / 2 + 0.9);
        if (!inOther(sx, sz, idx) && Math.abs(sz) > 45) b.box(1.8, 0.16, segLen, s * (w / 2 + 0.9), -0.05, 0, 0xb3ab9a);
      }
      // vạch giữa đường
      if (w >= 8 && i % 2 === 0 && !inOther(mx, mz, idx)) b.box(0.18, 0.02, segLen * 0.6, 0, 0.05, 0, 0xe8e2c8);
      b.restore();
    }
  });
  const m = b.build(mat, { cast: false, chunk: 120 });
  m.name = 'roads';
  scene.add(m);
}

function jitterGeo(geo, rnd, amt) {
  // dịch chuyển theo hash vị trí để các đỉnh trùng nhau dịch giống nhau (không nứt)
  const p = geo.attributes.position;
  const seed = rnd() * 100;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (y > -geo.parameters.height / 2 + 0.01 && y < geo.parameters.height / 2 - 0.01) {
      const k = Math.round(x * 10) * 0.37 + Math.round(y * 10) * 0.73 + Math.round(z * 10) * 0.11 + seed;
      p.setX(i, x + (hash(k, 1) - 0.5) * amt);
      p.setZ(i, z + (hash(k, 2) - 0.5) * amt);
      p.setY(i, y + (hash(k, 3) - 0.5) * amt * 0.5);
    }
  }
}

export function mulberry(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
