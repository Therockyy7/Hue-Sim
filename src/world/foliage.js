// Cây cỏ: tán lá ghép từ nhiều "thẻ lá" (tấm phẳng có ảnh lá trong suốt), cỏ và lúa dạng instanced.
// Ảnh lá vẽ bằng canvas rồi gom vào một atlas 4×4; lá đung đưa theo gió trong vertex shader.
import * as THREE from 'three';

const CELL = 256, GRID = 4;
export const LEAF = { broad: 0, phuong: 1, palm: 2, pine: 3, bamboo: 4, banana: 5, grass: 6, flower: 7, lotus: 8, bougain: 9, bang: 10, shrub: 11, rice: 12, su: 13, riceGold: 14, reed: 15 };

function rng(seed) {
  let a = seed | 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const hsl = (h, s, l) => `hsl(${h.toFixed(0)},${s.toFixed(0)}%,${l.toFixed(0)}%)`;

// một chiếc lá nhọn hai đầu, gốc tại (x,y), hướng ang
function leaf(ctx, x, y, len, wid, ang, fill, rib = 'rgba(255,255,255,.16)') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.45, -wid, len, 0); ctx.quadraticCurveTo(len * 0.45, wid, 0, 0);
  ctx.fillStyle = fill; ctx.fill();
  if (rib) { ctx.strokeStyle = rib; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len * 0.92, 0); ctx.stroke(); }
  ctx.restore();
}
function blossom(ctx, x, y, r, col, core) {
  for (let i = 0; i < 5; i++) { const a = i * 1.2566 + x; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.55, r * 0.38, a, 0, 6.3); ctx.fillStyle = col; ctx.fill(); }
  ctx.beginPath(); ctx.arc(x, y, r * 0.25, 0, 6.3); ctx.fillStyle = core; ctx.fill();
}
function blade(ctx, x0, y0, x1, y1, bend, w, col) {
  const mx = (x0 + x1) / 2 + bend, my = (y0 + y1) / 2;
  ctx.beginPath(); ctx.moveTo(x0 - w, y0); ctx.quadraticCurveTo(mx - w * 0.5, my, x1, y1); ctx.quadraticCurveTo(mx + w * 0.5, my, x0 + w, y0);
  ctx.fillStyle = col; ctx.fill();
}

const DRAW = [
  (c, r) => { // lá bản rộng (cây bóng mát chung)
    for (let i = 0; i < 190; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * 104; leaf(c, 128 + Math.cos(a) * d, 128 + Math.sin(a) * d, 32 + r() * 18, 10 + r() * 6, r() * 6.28, hsl(96 + r() * 26, 42 + r() * 18, 15 + (i / 190) * 22 + r() * 6)); }
  },
  (c, r) => { // phượng vĩ: lá kép lông chim nhỏ li ti + chùm hoa đỏ
    for (let i = 0; i < 46; i++) {
      const a = r() * 6.28, d = Math.sqrt(r()) * 92, x = 128 + Math.cos(a) * d, y = 128 + Math.sin(a) * d, dir = r() * 6.28, L = 44 + r() * 20;
      const col = hsl(92 + r() * 20, 48, 24 + r() * 14);
      for (let k = 0; k < 13; k++) { const t = k / 13; for (const s of [-1, 1]) leaf(c, x + Math.cos(dir) * L * t, y + Math.sin(dir) * L * t, 12 - t * 4, 3.4, dir + s * 1.15, col, null); }
    }
    for (let i = 0; i < 30; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * 92; blossom(c, 128 + Math.cos(a) * d, 128 + Math.sin(a) * d, 8 + r() * 6, hsl(4 + r() * 16, 86, 46 + r() * 10), '#ffd070'); }
  },
  (c, r) => { // tàu dừa/cau: sống lá dọc giữa, lá chét xuôi hai bên
    c.strokeStyle = '#6a7a2a'; c.lineWidth = 4; c.beginPath(); c.moveTo(128, 252); c.lineTo(128, 8); c.stroke();
    for (let i = 0; i < 60; i++) { const t = i / 60, y = 246 - t * 232, L = (78 - t * 48) * (0.85 + r() * 0.3); for (const s of [-1, 1]) leaf(c, 128, y, L, 7.5, -Math.PI / 2 + s * (1.0 + t * 0.25) + (r() - 0.5) * 0.15, hsl(84 + r() * 18, 50, 24 + r() * 14), null); }
  },
  (c, r) => { // thông: chùm lá kim
    for (let i = 0; i < 120; i++) {
      const a = r() * 6.28, d = Math.sqrt(r()) * 100, x = 128 + Math.cos(a) * d, y = 128 + Math.sin(a) * d;
      c.strokeStyle = hsl(118 + r() * 24, 34, 13 + r() * 15); c.lineWidth = 2.2;
      for (let k = 0; k < 16; k++) { const b = r() * 6.28, L = 12 + r() * 12; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(b) * L, y + Math.sin(b) * L); c.stroke(); }
    }
  },
  (c, r) => { // tre: lá thon dài thành chùm
    for (let i = 0; i < 70; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * 94, x = 128 + Math.cos(a) * d, y = 128 + Math.sin(a) * d, dir = r() * 6.28; for (let k = 0; k < 4; k++) leaf(c, x, y, 34 + r() * 18, 4.5, dir + (k - 1.5) * 0.36, hsl(76 + r() * 20, 50, 28 + r() * 16)); }
  },
  (c, r) => { // lá chuối
    c.beginPath(); c.moveTo(128, 250); c.bezierCurveTo(40, 190, 50, 60, 128, 8); c.bezierCurveTo(206, 60, 216, 190, 128, 250); c.fillStyle = '#4f8a32'; c.fill();
    c.strokeStyle = 'rgba(190,220,120,.75)'; c.lineWidth = 4; c.beginPath(); c.moveTo(128, 250); c.lineTo(128, 12); c.stroke();
    c.strokeStyle = 'rgba(30,70,20,.35)'; c.lineWidth = 1.2;
    for (let i = 0; i < 30; i++) { const y = 240 - i * 7.6; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(128, y); c.lineTo(128 + s * 76, y - 16); c.stroke(); } }
    c.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 7; i++) { const y = 40 + r() * 180, s = r() > 0.5 ? 1 : -1; c.beginPath(); c.moveTo(128 + s * 86, y - 20); c.lineTo(128 + s * 30, y); c.lineTo(128 + s * 86, y - 14); c.fill(); }
    c.globalCompositeOperation = 'source-over';
  },
  (c, r) => { for (let i = 0; i < 58; i++) { const x = 128 + (r() - 0.5) * 150; blade(c, x, 256, x + (r() - 0.5) * 110, 40 + r() * 130, (r() - 0.5) * 50, 2.2 + r() * 2.6, hsl(82 + r() * 30, 44 + r() * 16, 20 + r() * 22)); } }, // cỏ
  (c, r) => { // cỏ lẫn hoa dại
    for (let i = 0; i < 36; i++) { const x = 128 + (r() - 0.5) * 150; blade(c, x, 256, x + (r() - 0.5) * 90, 90 + r() * 110, (r() - 0.5) * 40, 2.2 + r() * 2.4, hsl(86 + r() * 26, 46, 22 + r() * 20)); }
    const cols = ['#f6d24a', '#ffffff', '#f08ab0', '#f6a23a', '#c89af0'];
    for (let i = 0; i < 13; i++) blossom(c, 40 + r() * 176, 50 + r() * 120, 7 + r() * 5, cols[i % 5], '#f2c030');
  },
  (c, r) => { // sen: cuống + bông hồng + nụ
    c.strokeStyle = '#5a8a3a'; c.lineWidth = 5; c.beginPath(); c.moveTo(128, 256); c.quadraticCurveTo(120, 190, 128, 130); c.stroke();
    c.beginPath(); c.moveTo(60, 256); c.quadraticCurveTo(70, 200, 62, 150); c.stroke();
    for (let i = 0; i < 11; i++) { const a = -Math.PI / 2 + (i - 5) * 0.27; leaf(c, 128, 132, 78 - Math.abs(i - 5) * 5, 20, a, hsl(334 + r() * 10, 72, 66 + Math.abs(i - 5) * 3 + r() * 6), 'rgba(255,255,255,.3)'); }
    c.beginPath(); c.ellipse(128, 124, 13, 8, 0, 0, 6.3); c.fillStyle = '#f0d060'; c.fill();
    leaf(c, 62, 152, 46, 15, -Math.PI / 2, '#e878a4'); leaf(c, 62, 150, 40, 9, -Math.PI / 2 + 0.15, '#f29abc');
  },
  (c, r) => { // hoa giấy
    for (let i = 0; i < 26; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * 96; leaf(c, 128 + Math.cos(a) * d, 128 + Math.sin(a) * d, 22 + r() * 10, 8, r() * 6.28, hsl(104 + r() * 20, 44, 20 + r() * 12)); }
    for (let i = 0; i < 120; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * 100; leaf(c, 128 + Math.cos(a) * d, 128 + Math.sin(a) * d, 13 + r() * 8, 6.5, r() * 6.28, hsl(318 + r() * 22, 76, 42 + r() * 20), 'rgba(255,255,255,.25)'); }
  },
  (c, r) => { // bàng: lá to bầu, lác đác lá đỏ
    for (let i = 0; i < 100; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * 100, red = r() > 0.92; leaf(c, 128 + Math.cos(a) * d, 128 + Math.sin(a) * d, 42 + r() * 18, 18 + r() * 7, r() * 6.28, red ? hsl(12 + r() * 14, 62, 38) : hsl(92 + r() * 22, 46, 16 + (i / 100) * 20 + r() * 6), 'rgba(255,255,220,.22)'); }
  },
  (c, r) => { for (let i = 0; i < 240; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * 104; leaf(c, 128 + Math.cos(a) * d, 128 + Math.sin(a) * d, 13 + r() * 8, 6, r() * 6.28, hsl(100 + r() * 30, 40 + r() * 16, 14 + (i / 240) * 22 + r() * 5), null); } }, // bụi cây lá nhỏ
  (c, r) => { for (let i = 0; i < 42; i++) { const x = 128 + (r() - 0.5) * 120; blade(c, x, 256, x + (r() - 0.5) * 80, 20 + r() * 90, (r() - 0.5) * 36, 2 + r() * 2, hsl(86 + r() * 16, 62, 32 + r() * 16)); } }, // mạ non
  (c, r) => { // sứ (đại): lá dày thưa + hoa trắng nhụy vàng
    for (let i = 0; i < 26; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * 90; leaf(c, 128 + Math.cos(a) * d, 128 + Math.sin(a) * d, 46 + r() * 14, 12, r() * 6.28, hsl(104 + r() * 16, 40, 22 + r() * 12), 'rgba(255,255,220,.3)'); }
    for (let i = 0; i < 16; i++) blossom(c, 36 + r() * 184, 36 + r() * 184, 10 + r() * 4, '#fbf6ea', '#f2c634');
  },
  (c, r) => { // lúa chín: lá vàng, bông trĩu
    for (let i = 0; i < 40; i++) { const x = 128 + (r() - 0.5) * 120, tx = x + (r() - 0.5) * 100, ty = 30 + r() * 90; blade(c, x, 256, tx, ty, (r() - 0.5) * 40, 2 + r() * 2, hsl(48 + r() * 16, 62, 40 + r() * 14)); if (i % 2) for (let k = 0; k < 7; k++) { c.beginPath(); c.ellipse(tx + (r() - 0.5) * 8 + (tx - x) * 0.04 * k, ty + k * 5, 3.4, 2, 0.6, 0, 6.3); c.fillStyle = hsl(42 + r() * 8, 72, 52); c.fill(); } }
  },
  (c, r) => { for (let i = 0; i < 26; i++) { const x = 128 + (r() - 0.5) * 100; blade(c, x, 256, x + (r() - 0.5) * 60, 6 + r() * 60, (r() - 0.5) * 30, 3 + r() * 2.5, hsl(70 + r() * 30, 34, 30 + r() * 18)); } }, // lau sậy ven sông
];

let atlas = null;
function makeAtlas() {
  if (atlas) return atlas;
  const size = CELL * GRID;
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  DRAW.forEach((fn, i) => {
    ctx.save(); ctx.translate((i % GRID) * CELL, Math.floor(i / GRID) * CELL);
    ctx.beginPath(); ctx.rect(2, 2, CELL - 4, CELL - 4); ctx.clip();
    fn(ctx, rng(100 + i * 31)); ctx.restore();
  });
  const img = ctx.getImageData(0, 0, size, size), d = img.data;
  // điểm ảnh trong suốt mang màu trung bình của ô để mipmap không viền đen
  for (let cell = 0; cell < GRID * GRID; cell++) {
    const ox = (cell % GRID) * CELL, oy = Math.floor(cell / GRID) * CELL;
    let r = 0, g = 0, b = 0, n = 0;
    for (let y = 0; y < CELL; y += 2) for (let x = 0; x < CELL; x += 2) { const i = ((oy + y) * size + ox + x) * 4; if (d[i + 3] > 200) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; } }
    if (!n) continue;
    r /= n; g /= n; b /= n;
    for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) { const i = ((oy + y) * size + ox + x) * 4; if (d[i + 3] < 12) { d[i] = r; d[i + 1] = g; d[i + 2] = b; } }
  }
  atlas = new THREE.DataTexture(new Uint8Array(d.buffer), size, size, THREE.RGBAFormat);
  atlas.colorSpace = THREE.SRGBColorSpace;
  atlas.minFilter = THREE.LinearMipmapLinearFilter; atlas.magFilter = THREE.LinearFilter;
  atlas.generateMipmaps = true; atlas.anisotropy = 4;
  atlas.needsUpdate = true;
  return atlas;
}
// toạ độ uv của ô (hàng 0 của DataTexture là mép trên canvas)
function cellUV(cell) {
  const e = 3 / (CELL * GRID), cx = cell % GRID, cy = Math.floor(cell / GRID);
  return [cx / GRID + e, (cx + 1) / GRID - e, cy / GRID + e, (cy + 1) / GRID - e]; // u0,u1,vTop,vBottom
}

const windU = { uTime: { value: 0 }, uWind: { value: new THREE.Vector2(1, 0.4) } };
function windPatch(sh) {
  Object.assign(sh.uniforms, windU);
  sh.vertexShader = sh.vertexShader
    .replace('#include <common>', '#include <common>\nattribute vec3 windA;\nuniform float uTime;\nuniform vec2 uWind;')
    .replace('#include <begin_vertex>', `#include <begin_vertex>
float wph = windA.y;
#ifdef USE_INSTANCING
wph += instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.23;
#endif
float wt = uTime * 1.2 + wph;
transformed.xz += uWind * ((sin(wt) * 0.7 + sin(wt * 2.3 + 1.7) * 0.3) * windA.x);
transformed.y += sin(uTime * 3.3 + wph * 5.0 + position.x * 1.7) * windA.z;`);
}
let mats = null;
function makeMats() {
  if (mats) return mats;
  const map = makeAtlas();
  const leafMat = new THREE.MeshStandardMaterial({ map, alphaTest: 0.36, alphaToCoverage: true, side: THREE.DoubleSide, vertexColors: true, roughness: 0.82, metalness: 0, envMapIntensity: 0.2 });
  leafMat.onBeforeCompile = (sh) => {
    windPatch(sh);
    // pháp tuyến do ta tự đặt (toả tròn quanh tán) nên không lật theo mặt sau
    sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', 'float faceDirection = 1.0;\nvec3 normal = normalize(vNormal);\nvec3 nonPerturbedNormal = normal;');
  };
  const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map, alphaTest: 0.36 });
  depth.onBeforeCompile = windPatch;
  mats = { leaf: leafMat, depth };
  return mats;
}

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _n = new THREE.Vector3(), _col = new THREE.Color();
const CHUNK = 80;

class FoliageSys {
  constructor() { this.reset(); }
  reset() { this.cells = new Map(); this.inst = new Map(); this.meshes = []; this.grass = []; }
  _cell(x, z) {
    const k = Math.floor(x / CHUNK) + '|' + Math.floor(z / CHUNK);
    let c = this.cells.get(k);
    if (!c) this.cells.set(k, c = { pos: [], nor: [], uv: [], col: [], wind: [] });
    return c;
  }
  // Một thẻ lá: tâm c, nửa cạnh ngang R, nửa cạnh dọc U (vec3 dạng mảng). nc = tâm tán để tính pháp tuyến toả tròn (null: hướng lên)
  card(c, R, U, cell, tint, { nc = null, sway = 0.05, y0 = 0, hgt = 1, phase = 0, flutter = 0.012, flip = false, bright = 1 } = {}) {
    const out = this._cell(c[0], c[2]);
    let [u0, u1, vt, vb] = cellUV(cell);
    if (flip) { const t = u0; u0 = u1; u1 = t; }
    const P = [[-1, -1, u0, vb], [1, -1, u1, vb], [1, 1, u1, vt], [-1, -1, u0, vb], [1, 1, u1, vt], [-1, 1, u0, vt]];
    _col.set(tint);
    for (const [sx, sy, u, v] of P) {
      const x = c[0] + R[0] * sx + U[0] * sy, y = c[1] + R[1] * sx + U[1] * sy, z = c[2] + R[2] * sx + U[2] * sy;
      out.pos.push(x, y, z);
      if (nc) { _n.set(x - nc[0], (y - nc[1]) * 0.8 + 0.35, z - nc[2]).normalize(); out.nor.push(_n.x, _n.y, _n.z); } else out.nor.push(0, 1, 0);
      out.uv.push(u, v);
      const hf = Math.min(1, Math.max(0, (y - y0) / hgt)), k = bright * (0.62 + 0.38 * hf);
      out.col.push(_col.r * k, _col.g * k, _col.b * k);
      out.wind.push(sway * (0.25 + 0.75 * hf), phase, flutter);
    }
  }
  // Tán cây: n thẻ rải trong khối ellipsoid (rx,ry,rz) quanh tâm
  crown(cx, cy, cz, rx, ry, rz, cell, n, size, tint, { flat = 0, sway = 0.06, rnd = Math.random, tints = null } = {}) {
    const phase = rnd() * 6.28, nc = [cx, cy - ry * 0.3, cz];
    for (let i = 0; i < n; i++) {
      const a = rnd() * 6.28, yy = rnd() * 1.5 - 0.5, rr = Math.sqrt(Math.max(0, 1 - Math.min(1, yy * yy)));
      const k = 0.5 + 0.5 * Math.sqrt(rnd());
      const dx = Math.cos(a) * rr, dz = Math.sin(a) * rr;
      const p = [cx + dx * rx * k, cy + Math.min(1, yy) * ry * k, cz + dz * rz * k];
      // pháp tuyến thẻ: hướng ra ngoài tán, lệch ngẫu nhiên; flat kéo thẻ nằm ngang
      _n.set(dx + (rnd() - 0.5) * 0.9, yy * 0.6 + flat * 2.5 + (rnd() - 0.5) * 0.9, dz + (rnd() - 0.5) * 0.9).normalize();
      _a.set(-_n.z, 0, _n.x); if (_a.lengthSq() < 1e-4) _a.set(1, 0, 0); _a.normalize();
      _b.crossVectors(_n, _a).normalize();
      const s = size * (0.8 + rnd() * 0.45), rot = rnd() * 6.28, cs = Math.cos(rot) * s, sn = Math.sin(rot) * s;
      const R = [_a.x * cs + _b.x * sn, _a.y * cs + _b.y * sn, _a.z * cs + _b.z * sn];
      const U = [_b.x * cs - _a.x * sn, _b.y * cs - _a.y * sn, _b.z * cs - _a.z * sn];
      this.card(p, R, U, cell, tints ? tints[i % tints.length] : tint, { nc, sway, y0: cy - ry, hgt: ry * 2, phase, flip: rnd() > 0.5, bright: 0.72 + k * 0.33 });
    }
  }
  // Thẻ đứng (lá dài, sen…): gốc tại p, vươn theo hướng dir (vec3), rộng w
  frond(p, dir, len, w, cell, tint, { sway = 0.1, phase = 0, side = null, bright = 1 } = {}) {
    _b.set(dir[0], dir[1], dir[2]).normalize();
    if (side) _a.set(side[0], side[1], side[2]); else { _a.set(-_b.z, 0, _b.x); if (_a.lengthSq() < 1e-4) _a.set(1, 0, 0); }
    _a.normalize();
    const h = len / 2, c = [p[0] + _b.x * h, p[1] + _b.y * h, p[2] + _b.z * h];
    this.card(c, [_a.x * w / 2, _a.y * w / 2, _a.z * w / 2], [_b.x * h, _b.y * h, _b.z * h], cell, tint, { sway, y0: p[1], hgt: Math.max(0.3, Math.abs(_b.y) * len), phase, flutter: 0.02, bright });
  }
  // Cỏ, lúa, hoa dại: mỗi bụi là 2 thẻ chéo nhau, dựng bằng InstancedMesh theo ô để cắt theo khoảng cách
  tuft(x, y, z, cell, w, h, tint) {
    const k = cell + '|' + Math.floor(x / 64) + '|' + Math.floor(z / 64);
    let c = this.inst.get(k);
    if (!c) this.inst.set(k, c = { cell, list: [] });
    c.list.push(x, y, z, w, h, tint);
  }

  build(scene) {
    const { leaf, depth } = makeMats();
    for (const c of this.cells.values()) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(c.pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(c.nor, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(c.uv, 2));
      g.setAttribute('color', new THREE.Float32BufferAttribute(c.col, 3));
      g.setAttribute('windA', new THREE.Float32BufferAttribute(c.wind, 3));
      g.computeBoundingSphere();
      const m = new THREE.Mesh(g, leaf);
      m.customDepthMaterial = depth;
      m.castShadow = true; m.receiveShadow = true;
      m.matrixAutoUpdate = false;
      scene.add(m); this.meshes.push(m);
    }
    this.cells.clear();
    const mat4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    for (const c of this.inst.values()) {
      const [u0, u1, vt, vb] = cellUV(c.cell);
      const pos = [], uv = [], nor = [], wind = [], col = [];
      for (const a of [0, Math.PI / 2]) {
        const cx = Math.cos(a) * 0.5, cz = Math.sin(a) * 0.5;
        for (const [sx, sy, u, v] of [[-1, 0, u0, vb], [1, 0, u1, vb], [1, 1, u1, vt], [-1, 0, u0, vb], [1, 1, u1, vt], [-1, 1, u0, vt]]) {
          pos.push(cx * sx, sy, cz * sx); uv.push(u, v); nor.push(0, 1, 0); wind.push(sy * 0.16, 0, sy * 0.015);
          const k = 0.7 + sy * 0.3; col.push(k, k, k); // gốc bụi tối hơn ngọn
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setAttribute('windA', new THREE.Float32BufferAttribute(wind, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      const n = c.list.length / 6;
      const im = new THREE.InstancedMesh(g, leaf, n);
      let sx = 0, sy = 0, sz = 0;
      for (let i = 0; i < n; i++) {
        const o = i * 6;
        ps.set(c.list[o], c.list[o + 1], c.list[o + 2]); sx += ps.x; sy += ps.y; sz += ps.z;
        q.setFromAxisAngle(up, Math.random() * 6.28);
        sc.set(c.list[o + 3], c.list[o + 4], c.list[o + 3]);
        im.setMatrixAt(i, mat4.compose(ps, q, sc));
        im.setColorAt(i, _col.set(c.list[o + 5]));
      }
      im.instanceMatrix.needsUpdate = true;
      im.castShadow = false; im.receiveShadow = true;
      im.userData.c = new THREE.Vector3(sx / n, sy / n, sz / n);
      scene.add(im); this.grass.push(im);
    }
    this.inst.clear();
  }

  update(t, sky, cam, grassDist = 120) {
    windU.uTime.value = t;
    const w = 0.6 + sky.rain * 0.9;
    windU.uWind.value.set(w, w * 0.4);
    const d2 = grassDist * grassDist;
    for (const g of this.grass) { const c = g.userData.c; g.visible = (c.x - cam.x) ** 2 + (c.z - cam.z) ** 2 < d2; }
  }
}

export const FOL = new FoliageSys();
