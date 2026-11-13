// Vật liệu bề mặt sinh bằng code. Mỗi loại vật liệu là một lớp trong mảng texture
// (R: sắc độ, G: độ nhám, B/A: pháp tuyến), được chiếu lên hình khối theo toạ độ
// không gian (triplanar) nên các mesh gộp không cần UV.
import * as THREE from 'three';

export const S = {
  PLAIN: 0, PLASTER: 1, BRICK: 2, STONE: 3, TILE: 4, WOOD: 5, ASPHALT: 6, PAVER: 7, CONCRETE: 8,
  GRASS: 9, BARK: 10, METAL: 11, FABRIC: 12, GLASS: 13, LEAF: 14, LACQUER: 15, GOLD: 16, EARTH: 17,
};
const NS = 18;
const N = 256;

// [khổ vân (m), độ đậm vân, độ nổi, kim loại, nhám gốc, biên độ nhám, rêu bẩn, độ ướt khi mưa, hệ số pháp tuyến]
const PARAMS = [
  [2.0, 0.35, 0.25, 0.0, 0.85, 0.2, 0.0, 0.0, 2],   // PLAIN
  [3.0, 0.9, 0.5, 0.0, 0.9, 0.15, 0.3, 0.0, 3],     // PLASTER
  [2.0, 1.0, 1.0, 0.0, 0.9, 0.2, 0.75, 0.0, 6],     // BRICK
  [2.4, 1.0, 0.9, 0.0, 0.85, 0.25, 0.5, 0.6, 5],    // STONE
  [1.2, 1.0, 1.0, 0.0, 0.48, 0.3, 0.3, 0.0, 5],     // TILE
  [1.5, 0.9, 0.5, 0.0, 0.7, 0.3, 0.15, 0.3, 3],     // WOOD
  [4.0, 1.0, 0.7, 0.0, 0.9, 0.2, 0.15, 1.0, 4],     // ASPHALT
  [2.0, 1.0, 0.8, 0.0, 0.8, 0.25, 0.3, 0.9, 5],     // PAVER
  [3.0, 1.0, 0.6, 0.0, 0.9, 0.15, 0.6, 0.5, 4],     // CONCRETE
  [3.0, 1.0, 0.6, 0.0, 0.95, 0.1, 0.0, 0.0, 4],     // GRASS
  [1.0, 1.0, 1.0, 0.0, 0.95, 0.1, 0.2, 0.0, 6],     // BARK
  [2.0, 0.8, 0.3, 0.7, 0.45, 0.4, 0.2, 0.3, 2],     // METAL
  [0.5, 0.8, 0.5, 0.0, 0.95, 0.1, 0.1, 0.0, 3],     // FABRIC
  [2.0, 0.3, 0.05, 0.4, 0.08, 0.1, 0.0, 0.0, 1],    // GLASS
  [1.6, 1.0, 1.0, 0.0, 0.8, 0.2, 0.0, 0.0, 6],      // LEAF
  [1.5, 0.6, 0.25, 0.0, 0.38, 0.25, 0.1, 0.0, 2],   // LACQUER
  [0.6, 0.6, 0.4, 0.85, 0.35, 0.3, 0.0, 0.0, 3],    // GOLD
  [2.5, 1.0, 0.7, 0.0, 0.95, 0.1, 0.0, 0.8, 4],     // EARTH
];

// ---- Suy loại bề mặt từ màu (bảng màu đang dùng trong các file dựng cảnh)
const AUTO = new Map();
const reg = (s, list) => { for (const c of list) AUTO.set(c, s); };
reg(S.LACQUER, [0x8e1d17, 0x6b1410, 0x8a2a18, 0x6b1a12, 0x7a1a12, 0x8a3a22, 0x7a1a14, 0x8e3a26]);
reg(S.GOLD, [0xd2a23c, 0xc9a24a, 0xe8c25a, 0xd8a83a, 0xd8b04e, 0xb89a4a, 0xb8902f, 0xd9a83a, 0xe0b84a, 0xc4a24a]);
reg(S.STONE, [0x8c877c, 0x5f5b52, 0x9a917c, 0xa49c88, 0xaaa290, 0x9c947f, 0xa59d88, 0x8d8775, 0x8f897b, 0x9a9282, 0x777164, 0x8d877a,
  0xa39d8e, 0x6d6858, 0x8a8472, 0xa8a08c, 0x8a8270, 0x8d8675, 0x6d685e, 0x7d786d, 0x77736a, 0x736f66, 0x6a6352, 0x7d776a, 0x625d54,
  0x68635a, 0x6a675c, 0x8b877a, 0x7a766a, 0x8b877c, 0x9a968a, 0x8a8780, 0xa8a8a0]);
reg(S.BRICK, [0x6c6855, 0x8a8470, 0x7a6450, 0x76705c, 0x6e6a58, 0x726c5a, 0x837a68, 0x8a6a4c, 0xa38a62, 0xc98f6c, 0x9d5a3e, 0x8c8a6a]);
reg(S.CONCRETE, [0x6f6c66, 0x55534e, 0x8a877f, 0x4e4c47, 0x5a5650, 0x6a6760]);
reg(S.WOOD, [0x6e4226, 0x3e2414, 0x7a5a3a, 0x8a6a48, 0x6a4a2a, 0x5a3a20, 0x6e4a2c, 0x4a301c, 0x7a4a2a, 0x6a4226, 0x8a5a36, 0x3a2414,
  0x8a6a3a, 0x4a3a2a, 0x3a2a14, 0x8a5a3a]);
reg(S.BARK, [0x5a3d26, 0x7a6a55]);
reg(S.ASPHALT, [0x4b4b52, 0x55555a]);
reg(S.PAVER, [0xb3ab9a, 0xc2b8a2, 0xa8a290, 0xb8b0a0, 0xa8a090]);
reg(S.PLASTER, [0xe8d9a8, 0xf0e6d2, 0xd5e2e6, 0xe8c8b8, 0xcadcbf, 0xf2efe6, 0xe6b98a, 0xbccbe0, 0xf0d8a0, 0xd8c0e0, 0xeedcae, 0xf6efe0,
  0xf2ece0, 0xe8dcc8, 0xe2cf98, 0xead9a6, 0xf3ead2, 0xd9c79a, 0xd8cbb0, 0xe6dcc4, 0xf1ede2, 0xe9dcc2, 0xd8d0c0, 0xc8b898, 0xe6d8bc]);
reg(S.GLASS, [0x3a4a52, 0x3a5060, 0x2e3e4e, 0xb8d0e0, 0xc8d8e0, 0x2a3540, 0x3a5a6a]);
reg(S.METAL, [0xb9bdc2, 0xb0b3b6, 0x9aa0a0, 0x2b3a33, 0x555555, 0x666666, 0x3a3a3a, 0x333333, 0x5a5a5a, 0xd8dcde, 0xb8b8b8, 0x8a8a8a,
  0x2e3a35, 0x5a6a7a, 0x2c4a7a, 0x2b4f86, 0x222222, 0x1a1a1a, 0x3c4a3a, 0x5a4628, 0x4a4a32, 0x5a5034, 0x4a3a22, 0x5a4a2a, 0x6a6a6a]);
reg(S.LEAF, [0x3f7a2e, 0x2e5e25, 0x5f9a3a, 0x4f7f34, 0x5e8f3e, 0x6aaa3a, 0x7cbc4a, 0xc8b040, 0xd8c050]);
reg(S.FABRIC, [0xe9dcb0, 0xefe3bc, 0x2a3a6a]);
reg(S.EARTH, [0x7a6a4a, 0x5a6a4a]);
export const autoSurf = (color) => AUTO.get(color) ?? S.PLAIN;

// ---- Nhiễu tuần hoàn (để texture lặp liền mạch)
const PERM = new Uint8Array(512);
{
  let s = 20261112;
  const r = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = p[i]; p[i] = p[j]; p[j] = t; }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
}
const lat = (x, y) => PERM[PERM[x & 255] + (y & 255)] / 255;
function vn(x, y, px, py) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const x0 = ((ix % px) + px) % px, x1 = (x0 + 1) % px, y0 = ((iy % py) + py) % py, y1 = (y0 + 1) % py;
  const a = lat(x0, y0), b = lat(x1, y0), c = lat(x0, y1), d = lat(x1, y1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(u, v, f, oct = 4) {
  let s = 0, a = 0.5, n = 0;
  for (let i = 0; i < oct && f <= 256; i++) { s += vn(u * f + i * 7, v * f + i * 13, f, f) * a; n += a; a *= 0.5; f *= 2; }
  return s / n;
}
// khoảng cách tới điểm gần nhất trong lưới g×g (kiểu Worley), lặp liền mạch
function worley(u, v, g) {
  const x = u * g, y = v * g, ix = Math.floor(x), iy = Math.floor(y);
  let best = 9;
  for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
    const cx = ix + ox, cy = iy + oy;
    const wx = ((cx % g) + g) % g, wy = ((cy % g) + g) % g;
    const px = cx + lat(wx + 31, wy + 7), py = cy + lat(wx + 5, wy + 59);
    const d = Math.hypot(px - x, py - y);
    if (d < best) best = d;
  }
  return best;
}
const sst = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const fr = (x) => x - Math.floor(x);
const mix = (a, b, t) => a + (b - a) * t;

// khối xây so le: trả về [độ phủ viên (0 = mạch vữa), số ngẫu nhiên của viên]
function bond(u, v, cols, rows, mt, o) {
  const row = Math.floor(v * rows);
  const bx = u * cols + (row % 2) * 0.5;
  const col = ((Math.floor(bx) % cols) + cols) % cols;
  const fx = fr(bx), fy = fr(v * rows);
  const e = Math.min(Math.min(fx, 1 - fx) / cols, Math.min(fy, 1 - fy) / rows);
  o[0] = sst(mt * 0.5, mt * 2, e);
  o[1] = lat(col * 3 + 11, row * 5 + 3);
  o[2] = e;
}

const _b = [0, 0, 0];
// mỗi hàm ghi o = [sắc độ, độ nhám, chiều cao] trong khoảng 0..1 (0.5 là trung tính)
const GEN = [
  (u, v, o) => { const n = fbm(u, v, 8, 4); o[0] = 0.5 + (n - 0.5) * 1.5; o[1] = 0.5 + (fbm(u + 0.3, v + 0.7, 16, 3) - 0.5) * 0.6; o[2] = fbm(u, v, 32, 3); },
  (u, v, o) => { // vữa quét vôi: loang, vệt nước mưa chảy dọc
    const m = fbm(u, v, 4, 4), g = fbm(u, v, 64, 2), st = Math.pow(vn(u * 20, v * 2, 20, 2), 3);
    o[0] = 0.5 + (m - 0.5) * 0.24 + (g - 0.5) * 0.08 - st * 0.12; o[1] = 0.55 + (m - 0.5) * 0.3; o[2] = g * 0.6 + m * 0.4;
  },
  (u, v, o) => { // gạch vồ thành cổ
    bond(u, v, 6, 16, 0.006, _b);
    const n = fbm(u, v, 32, 3), chip = _b[1] > 0.9 ? 1 : 0;
    o[0] = mix(0.43, 0.5 + (_b[1] - 0.5) * 0.3 + (n - 0.5) * 0.22 - chip * 0.08, _b[0]);
    o[1] = mix(0.8, 0.5 + (_b[1] - 0.5) * 0.3, _b[0]);
    o[2] = mix(0.15, 0.75 + (fbm(u, v, 64, 2) - 0.5) * 0.3 - chip * 0.2, _b[0]);
  },
  (u, v, o) => { // đá khối
    bond(u, v, 3, 6, 0.004, _b);
    const n = fbm(u, v, 16, 4), bev = sst(0, 0.016, _b[2]);
    o[0] = mix(0.38, 0.5 + (_b[1] - 0.5) * 0.16 + (n - 0.5) * 0.28, _b[0]);
    o[1] = mix(0.8, 0.5 + (n - 0.5) * 0.5, _b[0]);
    o[2] = 0.2 + bev * 0.6 + (fbm(u, v, 64, 2) - 0.5) * 0.2;
  },
  (u, v, o) => { // ngói âm dương: sống ngói chạy dọc, hàng ngói chồng nhau
    const fu = fr(u * 6), fv = fr(v * 4), tile = lat(Math.floor(u * 6) + 3, Math.floor(v * 4) * 7 + 1);
    let h, pan = 0;
    if (fu < 0.56) { const t = fu / 0.56 * 2 - 1; h = 0.45 + 0.55 * Math.sqrt(Math.max(0, 1 - t * t)); }
    else { const t = (fu - 0.56) / 0.44 * 2 - 1; h = 0.45 - 0.3 * Math.sqrt(Math.max(0, 1 - t * t)); pan = 1; }
    const gr = sst(0, 0.07, Math.min(fv, 1 - fv)), n = fbm(u, v, 16, 3);
    o[0] = 0.5 + (tile - 0.5) * 0.2 + (n - 0.5) * 0.2 - (1 - gr) * 0.14 - pan * 0.1;
    o[1] = 0.4 + (n - 0.5) * 0.5 + pan * 0.2;
    o[2] = h * (0.82 + 0.18 * gr);
  },
  (u, v, o) => { // gỗ: vân chạy dọc
    const g = vn(u * 48 + fbm(u, v, 4, 2) * 6, v * 4, 48, 4);
    o[0] = 0.5 + (g - 0.5) * 0.26 + (fbm(u, v, 8, 2) - 0.5) * 0.1; o[1] = 0.5 + (g - 0.5) * 0.4; o[2] = g * 0.5 + 0.25;
  },
  (u, v, o) => { // nhựa đường: hạt đá dăm, vết nứt, miếng vá
    const sp = fbm(u, v, 128, 2), bl = fbm(u, v, 6, 3);
    const cr = 1 - sst(0, 0.006, Math.abs(fbm(u + 0.5, v + 0.2, 5, 3) - 0.5));
    const pa = sst(0.6, 0.66, fbm(u + 0.1, v + 0.9, 3, 2));
    o[0] = 0.5 + (sp - 0.5) * 0.3 + (bl - 0.5) * 0.14 - cr * 0.07 - pa * 0.05;
    o[1] = 0.6 + (bl - 0.5) * 0.3 - pa * 0.1; o[2] = sp * 0.7 + 0.3 - cr * 0.3;
  },
  (u, v, o) => { // gạch lát vỉa hè 40 cm
    const n = 5, fx = fr(u * n), fy = fr(v * n), cx = Math.floor(u * n), cy = Math.floor(v * n);
    const e = Math.min(Math.min(fx, 1 - fx), Math.min(fy, 1 - fy)) / n;
    const m = sst(0.002, 0.008, e), rnd = lat(cx + 9, cy + 4);
    const sub = sst(0.4, 0.48, Math.max(Math.abs(fr(fx * 4) - 0.5), Math.abs(fr(fy * 4) - 0.5)));
    o[0] = mix(0.4, 0.5 + (rnd - 0.5) * 0.14 + (fbm(u, v, 32, 2) - 0.5) * 0.12 - sub * 0.05 + (((cx + cy) & 1) ? 0.03 : -0.03), m);
    o[1] = mix(0.8, 0.5 + (rnd - 0.5) * 0.3, m); o[2] = mix(0.2, 0.8 - sub * 0.15, m);
  },
  (u, v, o) => { // bê tông phong hoá
    const bl = fbm(u, v, 3, 5), dr = vn(u * 16, v * 2, 16, 2), pit = sst(0.72, 0.9, fbm(u, v, 64, 2));
    o[0] = 0.5 + (bl - 0.5) * 0.5 - dr * dr * 0.18 - pit * 0.1; o[1] = 0.6 + (bl - 0.5) * 0.3;
    o[2] = 0.6 + (fbm(u, v, 32, 3) - 0.5) * 0.5 - pit * 0.4;
  },
  (u, v, o) => { // cỏ
    const w = fbm(u, v, 8, 2) * 4;
    const b1 = vn(u * 96 + w, v * 24, 96, 24), b2 = vn(u * 24, v * 96 + w, 24, 96), cl = fbm(u, v, 6, 3);
    const b = Math.max(b1, b2);
    o[0] = 0.5 + (b - 0.55) * 0.45 + (cl - 0.5) * 0.3; o[1] = 0.6; o[2] = b;
  },
  (u, v, o) => { // vỏ cây
    const rg = 1 - Math.abs(vn(u * 12 + fbm(u, v, 4, 2) * 2, v * 2, 12, 2) * 2 - 1);
    o[0] = 0.34 + rg * 0.32 + (fbm(u, v, 32, 2) - 0.5) * 0.15; o[1] = 0.6; o[2] = rg;
  },
  (u, v, o) => { // kim loại sơn, lốm đốm gỉ
    const n = fbm(u, v, 8, 3), sc = vn(u * 4, v * 128, 4, 128), ru = sst(0.66, 0.8, fbm(u + 0.4, v + 0.4, 5, 4));
    o[0] = 0.5 + (n - 0.5) * 0.12 + (sc - 0.5) * 0.05 - ru * 0.09; o[1] = 0.45 + ru * 0.45 + (n - 0.5) * 0.2; o[2] = 0.5 + (sc - 0.5) * 0.1 - ru * 0.1;
  },
  (u, v, o) => { // vải, lá nón đan
    const w = Math.sin(u * Math.PI * 80) * Math.sin(v * Math.PI * 80);
    o[0] = 0.5 + w * 0.06 + (fbm(u, v, 8, 2) - 0.5) * 0.1; o[1] = 0.6; o[2] = 0.5 + w * 0.5;
  },
  (u, v, o) => { const n = fbm(u, v, 4, 3); o[0] = 0.5 + (n - 0.5) * 0.1; o[1] = 0.5 + (n - 0.5) * 0.5; o[2] = 0.5; }, // kính
  (u, v, o) => { // tán lá
    const h = 1 - sst(0, 0.75, worley(u, v, 10));
    o[0] = 0.3 + h * 0.42 + (fbm(u, v, 32, 2) - 0.5) * 0.12; o[1] = 0.5; o[2] = h;
  },
  (u, v, o) => { const n = fbm(u, v, 6, 3); o[0] = 0.5 + (n - 0.5) * 0.14; o[1] = 0.5 + (n - 0.5) * 0.6; o[2] = 0.5 + (fbm(u, v, 48, 2) - 0.5) * 0.2; }, // sơn son
  (u, v, o) => { const h = 1 - sst(0, 0.8, worley(u, v, 24)); o[0] = 0.5 + (h - 0.5) * 0.16; o[1] = 0.5 + (fbm(u, v, 8, 3) - 0.5) * 0.5; o[2] = h; }, // thếp vàng
  (u, v, o) => { // đất, cát bồi
    const a = fbm(u, v, 6, 4), g = fbm(u, v, 96, 2);
    o[0] = 0.5 + (a - 0.5) * 0.4 + (g - 0.5) * 0.26; o[1] = 0.6; o[2] = fbm(u, v, 64, 3);
  },
];

let shared = null;
export function surfaceUniforms() {
  if (shared) return shared;
  const data = new Uint8Array(N * N * 4 * NS);
  const H = new Float32Array(N * N);
  const o = [0, 0, 0];
  const c8 = (x) => Math.max(0, Math.min(255, Math.round(x * 255)));
  for (let l = 0; l < NS; l++) {
    const base = l * N * N * 4, gen = GEN[l], nk = PARAMS[l][8];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      gen(x / N, y / N, o);
      const i = y * N + x;
      data[base + i * 4] = c8(o[0]); data[base + i * 4 + 1] = c8(o[1]);
      H[i] = o[2];
    }
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const nx = (H[y * N + ((x - 1 + N) % N)] - H[y * N + ((x + 1) % N)]) * nk;
      const ny = (H[((y - 1 + N) % N) * N + x] - H[((y + 1) % N) * N + x]) * nk;
      const k = 1 / Math.hypot(nx, ny, 1), i = base + (y * N + x) * 4;
      data[i + 2] = c8(nx * k * 0.5 + 0.5); data[i + 3] = c8(ny * k * 0.5 + 0.5);
    }
  }
  const tex = new THREE.DataArrayTexture(data, N, N, NS);
  tex.format = THREE.RGBAFormat; tex.type = THREE.UnsignedByteType;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true; tex.anisotropy = 8;
  tex.colorSpace = THREE.NoColorSpace;
  tex.needsUpdate = true;
  shared = {
    surfTex: { value: tex },
    surfA: { value: PARAMS.map((p) => new THREE.Vector4(1 / p[0], p[1], p[2], p[3])) },
    surfB: { value: PARAMS.map((p) => new THREE.Vector4(p[4], p[5], p[6], p[7])) },
    uWet: { value: 0 },
  };
  return shared;
}

const FRAG_PARS = /* glsl */`
uniform sampler2DArray surfTex;
uniform vec4 surfA[${NS}];
uniform vec4 surfB[${NS}];
uniform float uWet;
uniform mat3 normalMatrix;
varying float vSurf;
varying vec3 vWPos;
varying vec3 vWNrm;
#ifdef SURF_TERRAIN
varying float vTmix;
#endif
`;
const FRAG_COLOR = /* glsl */`
#include <color_fragment>
vec3 sN = normalize(vWNrm) * (gl_FrontFacing ? 1.0 : -1.0);
#ifdef SURF_TERRAIN
  vec4 sa = mix(surfA[${S.GRASS}], surfA[${S.EARTH}], vTmix);
  vec4 sb = mix(surfB[${S.GRASS}], surfB[${S.EARTH}], vTmix);
  vec4 sG = texture(surfTex, vec3(vWPos.xz * surfA[${S.GRASS}].x, ${S.GRASS}.0));
  vec4 sG2 = texture(surfTex, vec3(vWPos.zx * surfA[${S.GRASS}].x * 0.23 + 0.31, ${S.GRASS}.0));
  vec4 sE = texture(surfTex, vec3(vWPos.xz * surfA[${S.EARTH}].x, ${S.EARTH}.0));
  sG.r = sG.r * 0.6 + sG2.r * 0.4;
  vec4 sT = mix(sG, sE, vTmix);
  vec3 sPert = vec3(sT.b * 2.0 - 1.0, 0.0, sT.a * 2.0 - 1.0);
#else
  int sid = int(vSurf + 0.5);
  vec4 sa = surfA[sid];
  vec4 sb = surfB[sid];
  vec3 sp = vWPos * sa.x;
  vec3 sw = abs(sN); sw = sw * sw; sw = sw * sw * sw; sw /= (sw.x + sw.y + sw.z + 1e-5);
  float sl = float(sid);
  // ngói: sống ngói luôn chạy xuôi theo dốc mái
  bool sSwap = sid == ${S.TILE} && abs(sN.x) > abs(sN.z);
  vec4 tX = texture(surfTex, vec3(sp.zy, sl));
  vec4 tY = texture(surfTex, vec3(sSwap ? sp.zx : sp.xz, sl));
  vec4 tZ = texture(surfTex, vec3(sp.xy, sl));
  vec4 sT = tX * sw.x + tY * sw.y + tZ * sw.z;
  vec2 pY = tY.ba * 2.0 - 1.0;
  vec3 sPert = vec3(0.0, tX.a * 2.0 - 1.0, tX.b * 2.0 - 1.0) * sw.x
    + (sSwap ? vec3(pY.y, 0.0, pY.x) : vec3(pY.x, 0.0, pY.y)) * sw.y
    + vec3(tZ.b * 2.0 - 1.0, tZ.a * 2.0 - 1.0, 0.0) * sw.z;
#endif
float sMacro = texture(surfTex, vec3(vWPos.xz * 0.021 + vWPos.y * 0.013, 0.0)).r;
float sMacro2 = texture(surfTex, vec3(vWPos.zx * 0.0057 + vWPos.y * 0.004 + 0.37, 0.0)).r;
diffuseColor.rgb *= mix(1.0, sT.r * 2.0, sa.y) * (0.84 + 0.32 * sMacro);
float sGrime = smoothstep(0.42, 0.8, sMacro2 * 0.75 + sT.r * 0.25) * sb.z;
diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.55, 0.62, 0.42), sGrime);
`;
const FRAG_ROUGH = /* glsl */`
#include <roughnessmap_fragment>
roughnessFactor = clamp(sb.x + (sT.g - 0.5) * sb.y + sGrime * 0.2, 0.04, 1.0);
float sWet = uWet * sb.w * clamp(sN.y, 0.0, 1.0);
float sPud = smoothstep(0.48, 0.66, sMacro) * sWet;
roughnessFactor = mix(roughnessFactor, 0.06, max(sWet * 0.5, sPud));
diffuseColor.rgb *= 1.0 - 0.3 * sWet;
`;
const FRAG_METAL = /* glsl */`
#include <metalnessmap_fragment>
metalnessFactor = sa.w;
`;
const FRAG_NORMAL = /* glsl */`
#include <normal_fragment_maps>
normal = normalize(normalMatrix * normalize(sN + sPert * sa.z * (1.0 - 0.8 * sPud)));
`;

// MeshStandardMaterial có thêm vân bề mặt. Dùng toạ độ cục bộ của mesh nên vân bám theo vật khi nó di chuyển.
export function makeSurfaceMaterial(opts = {}, terrain = false) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0, ...opts });
  if (terrain) mat.defines = { ...mat.defines, SURF_TERRAIN: '' };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, surfaceUniforms());
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
attribute float surf;
varying float vSurf;
varying vec3 vWPos;
varying vec3 vWNrm;
#ifdef SURF_TERRAIN
attribute float tmix;
varying float vTmix;
#endif`)
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nvWNrm = objectNormal;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
vWPos = position;
vSurf = surf;
#ifdef SURF_TERRAIN
vTmix = tmix;
#endif`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + FRAG_PARS)
      .replace('#include <color_fragment>', FRAG_COLOR)
      .replace('#include <roughnessmap_fragment>', FRAG_ROUGH)
      .replace('#include <metalnessmap_fragment>', FRAG_METAL)
      .replace('#include <normal_fragment_maps>', FRAG_NORMAL);
  };
  return mat;
}
