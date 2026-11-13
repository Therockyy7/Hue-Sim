// Đồ vật dùng chung: cây, đèn, đèn lồng, ghế, đình, cột...
import * as THREE from 'three';
import { terrainHeight } from './terrain.js';
import { FOL, LEAF } from './foliage.js';
import { S } from './surfaces.js';

export const COL = {
  redCol: 0x8e1d17, lacquer: 0x6b1410, gold: 0xd2a23c, yellowRoof: 0xdca22c, greenRoof: 0x3f7a58,
  stone: 0x8c877c, stoneDark: 0x5f5b52, moss: 0x6a6e55, brick: 0x9d5a3e, wood: 0x6e4226, darkWood: 0x3e2414,
  plaster: 0xe6dcc4, white: 0xf1ede2, trunk: 0x5a3d26, leaf: 0x3f7a2e, leafDark: 0x2e5e25, leafLight: 0x5f9a3a,
  tileRed: 0xa94c2f, bronze: 0x5a4628, purple: 0x6a3d9a,
};

// Cành/thân: khối trụ thuôn nối hai điểm (toạ độ cục bộ của builder)
function limb(b, x0, y0, z0, x1, y1, z1, r0, r1, color, seg = 7) {
  const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0, len = Math.hypot(dx, dy, dz);
  b.save(); b.translate(x0, y0, z0); b.rotateY(Math.atan2(dx, dz)); b.rotateX(Math.acos(Math.max(-1, Math.min(1, dy / len))));
  b.cyl(r1, r0, len, 0, 0, 0, color, seg);
  b.restore();
}
const _tv = new THREE.Vector3();

// Cây: thân và cành bằng khối trụ (vân vỏ cây), tán bằng các thẻ lá đung đưa theo gió
export function tree(b, x, z, type = 'round', s = 1, y = null) {
  const gy = y ?? terrainHeight(x, z);
  const r = Math.random;
  const oldSurf = b.surf;
  b.surf = S.BARK;
  b.save(); b.translate(x, gy, z); b.scale(s, s, s); b.rotateY(r() * 6.28);
  const wp = (lx, ly, lz) => { _tv.set(lx, ly, lz).applyMatrix4(b.matrix); return [_tv.x, _tv.y, _tv.z]; };
  const crown = (lx, ly, lz, rx, ry, rz, cell, n, size, tint, opt) => { const c = wp(lx, ly, lz); FOL.crown(c[0], c[1], c[2], rx * s, ry * s, rz * s, cell, n, size * s, tint, opt); };
  const core = (rad, lx, ly, lz, sy, col = 0x24401f) => { b.surf = S.LEAF; b.ico(rad, lx, ly, lz, col, 1, 1, sy, 1); b.surf = S.BARK; };
  let solidR = 0.45;
  switch (type) {
    case 'phuong': { // phượng vĩ: tán xoè rộng như chiếc ô, rực hoa đỏ
      limb(b, 0, 0, 0, 0.15, 2.7, 0.1, 0.36, 0.26, COL.trunk, 8);
      for (let i = 0; i < 4; i++) { const a = i * 1.57 + r() * 0.6; limb(b, 0.15, 2.5, 0.1, Math.cos(a) * 2.7, 4.2 + r() * 0.5, Math.sin(a) * 2.7, 0.17, 0.07, COL.trunk, 6); }
      crown(0, 4.6, 0, 4.0, 0.9, 4.0, LEAF.broad, 16, 1.5, 0x9cb48c, { flat: 0.6 });
      crown(0, 5.2, 0, 5.0, 1.4, 5.0, LEAF.phuong, 54, 1.75, 0xffffff, { flat: 0.5 });
      break;
    }
    case 'bang': { // bàng: tán xếp tầng
      limb(b, 0, 0, 0, 0, 5.6, 0, 0.3, 0.14, COL.trunk, 8);
      for (let i = 0; i < 3; i++) {
        const yy = 2.7 + i * 1.35, R = 3.3 - i * 0.75;
        for (let k = 0; k < 5; k++) { const a = k * 1.257 + i; limb(b, 0, yy - 0.2, 0, Math.cos(a) * R * 0.8, yy + 0.1, Math.sin(a) * R * 0.8, 0.09, 0.04, COL.trunk, 5); }
        crown(0, yy + 0.25, 0, R, 0.55, R, LEAF.bang, 20, 1.5, 0xffffff, { flat: 1.3, sway: 0.05 });
      }
      break;
    }
    case 'palm': { // dừa/cau
      const h = 7 + r() * 3, lx = (r() - 0.5) * 1.4, lz = (r() - 0.5) * 1.4;
      limb(b, 0, 0, 0, lx * 0.3, h * 0.5, lz * 0.3, 0.26, 0.2, 0x7a6a55, 8);
      limb(b, lx * 0.3, h * 0.5, lz * 0.3, lx, h, lz, 0.2, 0.15, 0x7a6a55, 8);
      b.sphere(0.34, lx, h - 0.15, lz, 0x5a6a30, 6, 4);
      const top = wp(lx, h, lz), ph = r() * 6.28;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * 6.28 + r() * 0.3, el = i % 3 === 0 ? 0.55 : i % 3 === 1 ? 0.05 : -0.45;
        FOL.frond(top, [Math.cos(a), el, Math.sin(a)], (3.4 + r() * 0.8) * s, 1.5 * s, LEAF.palm, 0xffffff, { sway: 0.14, phase: ph + i, bright: 0.85 + r() * 0.25 });
      }
      solidR = 0.3;
      break;
    }
    case 'pine': { // thông
      limb(b, 0, 0, 0, 0, 6.4, 0, 0.26, 0.07, 0x5a4030, 7);
      b.surf = S.LEAF; b.cone(1.5, 4.4, 0, 2.1, 0, 0x1f3a20, 8); b.surf = S.BARK;
      for (let i = 0; i < 5; i++) crown(0, 2.3 + i * 1.0, 0, 2.5 - i * 0.46, 0.5, 2.5 - i * 0.46, LEAF.pine, 14 - i, 1.3 - i * 0.1, 0xffffff, { flat: 0.5, sway: 0.04 });
      break;
    }
    case 'bamboo': { // khóm tre
      for (let i = 0; i < 9; i++) {
        const a = r() * 6.28, d = r() * 0.9, h = 6 + r() * 4, ex = Math.cos(a) * (d + 1.2 + r()), ez = Math.sin(a) * (d + 1.2 + r());
        b.surf = S.PLAIN;
        limb(b, Math.cos(a) * d, 0, Math.sin(a) * d, ex * 0.5, h * 0.6, ez * 0.5, 0.06, 0.05, 0x8aa040, 5);
        limb(b, ex * 0.5, h * 0.6, ez * 0.5, ex, h, ez, 0.05, 0.02, 0x9ab048, 5);
        crown(ex * 0.75, h * 0.8, ez * 0.75, 1.0, 1.3, 1.0, LEAF.bamboo, 5, 0.85, 0xffffff, { sway: 0.16 });
        crown(ex, h, ez, 0.8, 0.6, 0.8, LEAF.bamboo, 3, 0.8, 0xffffff, { sway: 0.2 });
      }
      solidR = 0.9;
      break;
    }
    case 'banana': { // chuối
      b.surf = S.PLAIN;
      limb(b, 0, 0, 0, 0, 2.1, 0, 0.2, 0.13, 0x7f9a4a, 7);
      const top = wp(0, 2.0, 0), ph = r() * 6.28;
      for (let i = 0; i < 7; i++) { const a = i * 0.9 + r() * 0.3; FOL.frond(top, [Math.cos(a) * 0.8, 0.9 - (i % 3) * 0.5, Math.sin(a) * 0.8], (2.2 + r() * 0.5) * s, 1.0 * s, LEAF.banana, 0xffffff, { sway: 0.1, phase: ph + i }); }
      solidR = 0.3;
      break;
    }
    case 'su': { // sứ (đại) trong sân chùa, lăng tẩm
      limb(b, 0, 0, 0, 0.1, 1.2, 0, 0.2, 0.16, 0x8a8478, 7);
      for (let i = 0; i < 4; i++) { const a = i * 1.57 + r(); limb(b, 0.1, 1.1, 0, Math.cos(a) * 1.1, 2.3 + r() * 0.4, Math.sin(a) * 1.1, 0.11, 0.06, 0x8a8478, 5); }
      crown(0, 2.8, 0, 1.8, 0.9, 1.8, LEAF.su, 18, 0.9, 0xffffff, { flat: 0.3 });
      solidR = 0.3;
      break;
    }
    case 'shrub': case 'bougain': { // bụi thấp, hoa giấy
      core(0.5, 0, 0.5, 0, 0.9);
      crown(0, 0.75, 0, 0.85, 0.7, 0.85, type === 'shrub' ? LEAF.shrub : LEAF.bougain, 9, 0.6, 0xffffff, { sway: 0.03 });
      solidR = 0;
      break;
    }
    default: { // cây bóng mát tán tròn
      limb(b, 0, 0, 0, 0.1, 2.5, 0, 0.32, 0.22, COL.trunk, 8);
      for (let i = 0; i < 3; i++) { const a = i * 2.09 + r(); limb(b, 0.1, 2.3, 0, Math.cos(a) * 1.3, 3.7, Math.sin(a) * 1.3, 0.14, 0.06, COL.trunk, 5); }
      core(1.5, 0, 4.1, 0, 0.85);
      crown(0, 4.3, 0, 2.7, 2.1, 2.7, LEAF.broad, 44, 1.5, 0xffffff, { tints: [0xffffff, 0xe8f0d0, 0xd8e8c8, 0xf4f0c8] });
    }
  }
  b.restore();
  b.surf = oldSurf;
  if (solidR) b.circleSolid(solidR * s, 4, x, gy, z);
}

// Đèn đường + quầng sáng
export function streetLamp(b, g, halos, x, z, ry = 0, y = null) {
  const gy = y ?? terrainHeight(x, z);
  b.save(); b.translate(x, gy, z); b.rotateY(ry);
  b.cyl(0.08, 0.13, 5, 0, 0, 0, 0x2b3a33, 6);
  b.box(0.06, 0.06, 1.1, 0, 4.9, 0.5, 0x2b3a33);
  b.cyl(0.25, 0.18, 0.25, 0, 4.6, 1.0, 0x2b3a33, 6);
  b.restore();
  g.save(); g.translate(x, gy, z); g.rotateY(ry);
  g.sphere(0.2, 0, 4.55, 1.0, 0xffd08a, 6, 4);
  g.restore();
  b.circleSolid(0.2, 5, x, gy, z);
  const wx = x + Math.sin(ry) * 1.0, wz = z + Math.cos(ry) * 1.0;
  halos.push([wx, gy + 0.08, wz, 6]);
}

// Đèn lồng Hội An/Huế
export function lantern(g, x, y, z, color = 0xd8322a, s = 1) {
  g.sphere(0.32 * s, x, y, z, color, 8, 6, 1.25);
  g.cyl(0.15 * s, 0.15 * s, 0.08, x, y + 0.36 * s, z, 0xe8b84a, 6);
  g.cyl(0.15 * s, 0.15 * s, 0.08, x, y - 0.44 * s, z, 0xe8b84a, 6);
}

export function bench(b, x, z, ry = 0) {
  const y = terrainHeight(x, z);
  b.save(); b.translate(x, y, z); b.rotateY(ry);
  b.box(1.8, 0.08, 0.5, 0, 0.45, 0, 0x6a4a2a);
  b.box(1.8, 0.4, 0.06, 0, 0.6, -0.22, 0x6a4a2a);
  for (const s of [-0.75, 0.75]) b.box(0.08, 0.45, 0.45, s, 0, 0, 0x333333);
  b.restore();
  b.solid(1.8, 0.8, 0.5, x, y, z, ry);
}

// Hàng cột tròn sơn son
export function columns(b, xs, zs, y, h, color = COL.redCol, r = 0.32, solid = true) {
  for (const x of xs) for (const z of zs) {
    b.cyl(r, r * 1.08, h, x, y, z, color, 8);
    b.cyl(r * 1.5, r * 1.6, 0.3, x, y, z, COL.stone, 8);
    if (solid) b.circleSolid(r + 0.05, h, x, y, z);
  }
}

export function range(a, b, n) { const out = []; for (let i = 0; i < n; i++) out.push(a + (b - a) * (n === 1 ? 0.5 : i / (n - 1))); return out; }

// Đình/ lầu: nền + cột + mái (1 hoặc 2 tầng mái)
export function pavilion(b, x, y, z, w, d, colH, roofColor, { tiers = 1, ry = 0, colsX = 2, colsZ = 2, base = 0.6, baseColor = COL.stone, walls = false, wallColor = COL.lacquer, solid = true, ridge = true } = {}) {
  b.save(); b.translate(x, y, z); b.rotateY(ry);
  if (base > 0) { b.box(w + 1.6, base, d + 1.6, 0, 0, 0, baseColor); if (solid) b.floor(w + 1.6, d + 1.6, 0, 0, base); }
  const xs = range(-w / 2, w / 2, colsX), zs = range(-d / 2, d / 2, colsZ);
  columns(b, xs, zs, base, colH, COL.redCol, 0.28, solid);
  if (walls) {
    b.box(w, colH * 0.92, 0.25, 0, base, -d / 2, wallColor);
    if (solid) b.solid(w, colH, 0.3, 0, base, -d / 2);
  }
  // xà ngang
  b.box(w + 0.4, 0.45, 0.35, 0, base + colH - 0.2, -d / 2, COL.lacquer);
  b.box(w + 0.4, 0.45, 0.35, 0, base + colH - 0.2, d / 2, COL.lacquer);
  b.box(0.35, 0.45, d + 0.4, -w / 2, base + colH - 0.2, 0, COL.lacquer);
  b.box(0.35, 0.45, d + 0.4, w / 2, base + colH - 0.2, 0, COL.lacquer);
  const ry0 = base + colH + 0.2;
  b.roof(w + 3.2, d + 3.2, Math.min(w, d) * 0.42 + 1, 0, ry0, 0, roofColor);
  let top = ry0 + Math.min(w, d) * 0.42 + 1;
  if (tiers >= 2) {
    const w2 = w * 0.62, d2 = d * 0.62, y2 = ry0 + Math.min(w, d) * 0.22;
    b.box(w2, 1.6, d2, 0, y2, 0, COL.lacquer);
    b.roof(w2 + 2.4, d2 + 2.4, Math.min(w2, d2) * 0.45 + 0.8, 0, y2 + 1.5, 0, roofColor);
    top = y2 + 1.5 + Math.min(w2, d2) * 0.45 + 0.8;
  }
  if (ridge) b.ridgeDragons(Math.max(0.5, (w - d) * 0.5), 0, top - 0.1, 0);
  b.restore();
  return top;
}

// Bậc thang bằng các hộp
export function stairs(b, x, z, w, len, y0, y1, color = COL.stone, ry = 0, steps = null) {
  const n = steps ?? Math.max(2, Math.round(Math.abs(y1 - y0) / 0.22));
  b.save(); b.translate(x, 0, z); b.rotateY(ry);
  for (let i = 0; i < n; i++) {
    const t = (i + 1) / n;
    const h = y0 + (y1 - y0) * t;
    const zz = -len / 2 + len * (i + 0.5) / n;
    b.box(w, h - Math.min(y0, y1) + 0.3, len / n + 0.02, 0, Math.min(y0, y1) - 0.3, zz, color);
  }
  b.floor(w, len, 0, 0, y0, y1);
  b.restore();
}

// Lan can đá/ gỗ chạy dọc từ (x1,z1) đến (x2,z2)
export function railing(b, x1, z1, x2, z2, y = 0, color = COL.stone, h = 1, solid = true, postGap = 2.5) {
  const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz);
  const ang = Math.atan2(dx, dz);
  b.save(); b.translate((x1 + x2) / 2, y, (z1 + z2) / 2); b.rotateY(ang);
  b.box(0.22, 0.18, len, 0, h - 0.18, 0, color);
  b.box(0.16, 0.12, len, 0, 0.15, 0, color);
  const n = Math.max(1, Math.round(len / postGap));
  for (let i = 0; i <= n; i++) b.box(0.26, h, 0.26, 0, 0, -len / 2 + (len * i) / n, color);
  if (solid) b.solid(0.4, h + 1.6, len, 0, -0.5, 0);
  b.restore();
}

// Người ngồi/ tượng đơn giản dùng cho tượng quan lại ở lăng
export function statue(b, x, y, z, ry, color = 0x7d786d, kind = 'mandarin') {
  b.save(); b.translate(x, y, z); b.rotateY(ry);
  b.box(1.1, 0.4, 1.1, 0, 0, 0, 0x6d685e);
  if (kind === 'elephant') {
    b.box(1.4, 1.3, 2.4, 0, 1.1, 0, color);
    for (const sx of [-0.5, 0.5]) for (const sz of [-0.8, 0.8]) b.cyl(0.25, 0.28, 0.8, sx, 0.35, sz, color, 6);
    b.box(1.1, 1.0, 0.9, 0, 1.6, 1.4, color);
    b.boxR(0.3, 1.3, 0.3, 0, 1.3, 1.95, color, 0.3, 0, 0);
  } else if (kind === 'horse') {
    b.box(0.8, 0.9, 2, 0, 1.2, 0, color);
    for (const sx of [-0.25, 0.25]) for (const sz of [-0.7, 0.7]) b.cyl(0.12, 0.12, 0.9, sx, 0.35, sz, color, 5);
    b.boxR(0.5, 1.1, 0.5, 0, 2.1, 1, color, 0.5, 0, 0);
  } else {
    b.cyl(0.42, 0.55, 1.5, 0, 0.4, 0, color, 7);
    b.cyl(0.3, 0.42, 0.5, 0, 1.9, 0, color, 7);
    b.sphere(0.28, 0, 2.6, 0, color, 6, 5);
    b.cyl(0.32, 0.3, 0.3, 0, 2.75, 0, 0x625d54, 6);
    b.box(0.12, 0.7, 0.08, 0, 1.8, 0.42, 0x68635a);
  }
  b.restore();
  b.solid(1.2, 3, 1.2, x, y, z, ry);
}

export class Halos {
  constructor(scene, mat) { this.list = []; this.scene = scene; this.mat = mat; }
  build() {
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.rotateX(-Math.PI / 2);
    const im = new THREE.InstancedMesh(geo, this.mat, this.list.length);
    const m = new THREE.Matrix4();
    this.list.forEach(([x, y, z, s], i) => { m.makeScale(s * 2, 1, s * 2).setPosition(x, y, z); im.setMatrixAt(i, m); });
    im.frustumCulled = false;
    im.renderOrder = 2;
    this.scene.add(im);
    this.mesh = im;
  }
}
