// Phố xá: nhà ống có trụ, ban công, cửa chớp, mái hiên, cục nóng điều hoà, bồn nước;
// biển hiệu tiếng Việt lấy từ một atlas; cột điện và dây điện; vạch qua đường.
import * as THREE from 'three';
import { S } from './surfaces.js';
import { FOL, LEAF } from './foliage.js';
import { terrainHeight } from './terrain.js';

const NAMES = [
  'TẠP HÓA CÔ BA', 'CÀ PHÊ MUỐI', 'BÁNH MÌ O THO', 'PHỞ BÒ GIA TRUYỀN', 'BÚN THỊT NƯỚNG', 'NHÀ THUỐC TÂY', 'MAY ĐO ÁO DÀI', 'SỬA XE MÁY',
  'TRÀ SỮA', 'HỚT TÓC THANH NIÊN', 'ĐIỆN THOẠI', 'VÀNG BẠC ĐÁ QUÝ', 'SÁCH CŨ', 'CƠM ÂM PHỦ', 'BÁNH KHOÁI', 'NEM LỤI',
  'CHÈ HẺM', 'TRÀ CUNG ĐÌNH', 'MÈ XỬNG THIÊN HƯƠNG', 'TÔM CHUA HUẾ', 'NHA KHOA', 'PHOTOCOPY - IN ẤN', 'GIẶT ỦI', 'KARAOKE',
  'HOMESTAY', 'KHÁCH SẠN MINI', 'THUÊ XE MÁY', 'MẮT KÍNH', 'HOA TƯƠI', 'TRANH THÊU XQ', 'NÓN LÁ BÀI THƠ', 'ĐẶC SẢN HUẾ',
  'BÁNH BỘT LỌC', 'BÚN BÒ MỆ KÉO', 'CÀ PHÊ SÁCH', 'NƯỚC MÍA', 'KEM BƠ', 'GẠO - NẾP', 'VẢI SỢI', 'ĐỒNG HỒ',
  'BÁNH ÉP', 'CƠM HẾN', 'BÚN HẾN', 'VẢ TRỘN', 'BÁNH CANH NAM PHỔ', 'CHÁO LÒNG', 'XÔI THỊT HON', 'BÁNH NẬM - BÁNH LỌC',
  'ÁO MƯA - NÓN BẢO HIỂM', 'ĐỒ GỖ MỸ NGHỆ', 'PHÁP LAM HUẾ', 'HƯƠNG TRẦM', 'TRÀ SEN', 'MẮM RUỐC', 'TIỆM VÀNG', 'IN ẢNH LẤY LIỀN',
  'CHÈ HEO QUAY', 'TRÀ ĐÁ VỈA HÈ', 'CHO THUÊ ÁO DÀI', 'MASSAGE CHÂN', 'DU LỊCH - VÉ TÀU XE', 'SIM THẺ', 'TẠP HÓA', 'QUÁN NHẬU',
];
const SIGN_BG = [['#b3261e', '#fff3c4'], ['#1f4f80', '#ffffff'], ['#f2c230', '#7a1a14'], ['#2a6a3a', '#fff3c4'], ['#f6f0e0', '#b3261e'], ['#222222', '#f6d77a'], ['#e86a2a', '#ffffff'], ['#5a2a80', '#f6e3a8'], ['#f6f0e0', '#1f4f80'], ['#0e7a7a', '#ffffff']];
const COLS = 4, ROWS = 16, CW = 512, CH = 128;

class SignSys {
  constructor() { this.pos = []; this.nor = []; this.uv = []; this.n = 0; }
  texture() {
    const cv = document.createElement('canvas'); cv.width = COLS * CW; cv.height = ROWS * CH;
    const ctx = cv.getContext('2d');
    NAMES.forEach((name, i) => {
      const x = (i % COLS) * CW, y = Math.floor(i / COLS) * CH, [bg, fg] = SIGN_BG[(i * 7) % SIGN_BG.length];
      ctx.fillStyle = bg; ctx.fillRect(x, y, CW, CH);
      ctx.strokeStyle = fg; ctx.globalAlpha = 0.55; ctx.lineWidth = 3; ctx.strokeRect(x + 7, y + 7, CW - 14, CH - 14); ctx.globalAlpha = 1;
      ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      let size = 58; ctx.font = `700 ${size}px "Be Vietnam Pro", sans-serif`;
      while (ctx.measureText(name).width > CW * 0.86 && size > 16) { size -= 2; ctx.font = `700 ${size}px "Be Vietnam Pro", sans-serif`; }
      ctx.fillText(name, x + CW / 2, y + CH * 0.45);
      ctx.font = '500 17px "Be Vietnam Pro", sans-serif'; ctx.globalAlpha = 0.85;
      ctx.fillText(`${10 + (i * 37) % 180} ${['Lê Lợi', 'Hùng Vương', 'Trần Hưng Đạo', 'Bùi Thị Xuân', 'Hà Nội'][i % 5]} · ĐT 0234.38${String(10000 + (i * 7919) % 89999)}`, x + CW / 2, y + CH * 0.82);
      ctx.globalAlpha = 1;
    });
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  }
  // biển chữ nhật trong mặt phẳng XY cục bộ (quay mặt về +Z), biến đổi theo ma trận m
  add(m, x, y, z, w, h, idx, back = false) {
    const cx = idx % COLS, cy = Math.floor(idx / COLS) % ROWS;
    const u0 = cx / COLS, u1 = (cx + 1) / COLS, v1 = 1 - cy / ROWS, v0 = 1 - (cy + 1) / ROWS;
    const s = back ? -1 : 1;
    const P = [[-1, -1, u0, v0], [1, -1, u1, v0], [1, 1, u1, v1], [-1, -1, u0, v0], [1, 1, u1, v1], [-1, 1, u0, v1]];
    const v = new THREE.Vector3(), n = new THREE.Vector3(0, 0, s).transformDirection(m);
    for (const [sx, sy, u, vv] of P) {
      v.set(x + sx * s * w / 2, y + sy * h / 2, z).applyMatrix4(m);
      this.pos.push(v.x, v.y, v.z); this.nor.push(n.x, n.y, n.z); this.uv.push(u, vv);
    }
    this.n++;
  }
  build(W) {
    if (!this.n) return;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    const tex = this.texture();
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.05, envMapIntensity: 0.3 });
    const mesh = new THREE.Mesh(g, mat);
    mesh.receiveShadow = true; mesh.matrixAutoUpdate = false;
    W.scene.add(mesh); W.signs.push(mesh);
    this.pos = []; this.nor = []; this.uv = []; this.n = 0;
  }
}
export const SIGNS = new SignSys();

// [tường, gờ chỉ, cửa chớp]
const PAL = [
  [0xe8d29a, 0xf4ecd8, 0x4a6a4a], [0xf0e6d2, 0xd8c8a8, 0x7a5a3a], [0xe6c88a, 0xfaf2de, 0x5a7a8a], [0xd9e0d0, 0xf4f0e4, 0x3a5a4a],
  [0xe8c8b0, 0xf6eee2, 0x6a4a3a], [0xf2efe6, 0xd0c8b8, 0x2d5a7a], [0xdcd2be, 0xf2ecde, 0x8a3a2a], [0xc8d8dc, 0xf0f0ea, 0x4a5a6a],
  [0xecdcae, 0xf8f0dc, 0x2f6a5a], [0xe0b48a, 0xf4e8d4, 0x5a3a2a],
];
const AWN = [[0xc8322a, 0xf2efe6], [0x2d6fb0, 0xf2efe6], [0x3a8a4a, 0xf0e8c0], [0xe8b030, 0xf2efe6], [0x7a3fa0, 0xf2efe6]];
const GOODS = [0xc8322a, 0xe8b030, 0x2d6fb0, 0x3a8a4a, 0xf2efe6, 0xe86a2a, 0x7a3fa0];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const _p = new THREE.Vector3();

export function shopHouse(b, win, x, z, ry, w, d, floors, W) {
  const r = Math.random;
  const fh = 3.3, H = floors * fh + 0.5;
  const [wall, trim, shut] = pick(PAL);
  const y = terrainHeight(x, z);
  const oldSurf = b.surf;
  b.save(); b.translate(x, y, z); b.rotateY(ry);
  const world = (lx, ly, lz) => { _p.set(lx, ly, lz).applyMatrix4(b.matrix); return [_p.x, _p.y, _p.z]; };
  const fz = d / 2;
  b.surf = S.PLASTER;
  b.box(w, H, d, 0, -0.3, 0, wall);
  b.solid(w, H + 1, d, 0, -0.3, 0);
  for (const sx of [-1, 1]) b.box(0.34, H - 0.2, 0.16, sx * (w / 2 - 0.17), -0.2, fz + 0.08, trim); // trụ hai bên
  b.surf = S.PAVER;
  b.box(w - 0.1, 0.16, 0.8, 0, 0, fz + 0.4, 0xb0a898); // bậc thềm
  // ----- tầng trệt: cửa hàng
  const ow = w - 0.9, oh = 2.8, kind = r();
  if (kind < 0.42) {
    // quán mở: khoang tối, quầy và hàng hoá bày phía trước
    b.surf = S.PLAIN; b.box(ow, oh, 0.08, 0, 0.12, fz - 0.01, 0x1c1814);
    win.box(ow - 0.3, oh - 0.9, 0.03, 0, 0.7, fz + 0.04, 0xffd9a0);
    b.surf = S.WOOD; b.box(ow * 0.5, 0.85, 0.5, -ow * 0.2, 0.16, fz + 0.45, 0x7a5a3a);
    b.surf = S.PLAIN;
    for (let i = 0; i < 5; i++) b.box(0.22, 0.2 + r() * 0.2, 0.22, -ow * 0.2 - ow * 0.2 + i * ow * 0.1, 1.01, fz + 0.45, pick(GOODS));
    for (let k = 0; k < 2; k++) for (let i = 0; i < 6; i++) b.box(ow / 7, 0.28, 0.06, -ow / 2 + ow / 12 + i * ow / 6, 1.5 + k * 0.5, fz + 0.03, pick(GOODS));
  } else if (kind < 0.72) {
    // cửa cuốn đóng
    b.surf = S.METAL; b.box(ow, oh, 0.07, 0, 0.12, fz + 0.01, 0x9aa0a4);
    for (let i = 0; i < 10; i++) b.box(ow, 0.035, 0.03, 0, 0.3 + i * 0.26, fz + 0.06, 0x70767a);
  } else {
    // mặt tiền kính
    b.surf = S.GLASS; b.box(ow, oh, 0.06, 0, 0.12, fz + 0.01, 0x3a5060);
    b.surf = S.METAL;
    for (const fx of [-ow / 2, -ow / 6, ow / 6, ow / 2]) b.box(0.07, oh, 0.1, fx, 0.12, fz + 0.04, 0x33383c);
    b.box(ow, 0.07, 0.1, 0, 2.2, fz + 0.04, 0x33383c);
    if (r() > 0.4) win.box(ow - 0.2, oh - 0.3, 0.03, 0, 0.25, fz + 0.06, 0xffe6b8);
  }
  // ----- biển hiệu
  b.surf = S.METAL; b.box(w - 0.5, 0.86, 0.12, 0, oh + 0.14, fz + 0.12, 0x2a2a2a);
  SIGNS.add(b.matrix, 0, oh + 0.57, fz + 0.19, w - 0.62, 0.74, Math.floor(r() * NAMES.length));
  if (r() < 0.22) { // hộp đèn vẫy ngang ra phố
    const sx = (r() > 0.5 ? 1 : -1) * (w / 2 - 0.4), idx = Math.floor(r() * NAMES.length);
    b.box(0.1, 0.5, 1.5, sx, fh + 0.5, fz + 0.9, 0x2a2a2a);
    b.save(); b.translate(sx, fh + 0.75, fz + 0.9); b.rotateY(Math.PI / 2);
    SIGNS.add(b.matrix, 0, 0, 0.06, 1.4, 0.42, idx); SIGNS.add(b.matrix, 0, 0, -0.06, 1.4, 0.42, idx, true);
    b.restore();
  }
  // ----- mái hiên bạt sọc
  if (r() < 0.5) {
    const [c1, c2] = pick(AWN), n = Math.max(4, Math.round(w / 0.6)), sw = (w - 0.3) / n;
    b.surf = S.FABRIC;
    for (let i = 0; i < n; i++) b.boxR(sw, 0.04, 1.7, -w / 2 + 0.15 + sw * (i + 0.5), oh + 0.02, fz + 0.95, i % 2 ? c1 : c2, 0.3, 0, 0);
    b.surf = S.METAL;
    for (const sx of [-1, 1]) b.boxR(0.04, 0.04, 1.8, sx * (w / 2 - 0.2), oh - 0.02, fz + 0.95, 0x555555, 0.3, 0, 0);
  }
  // ----- các tầng trên
  for (let f = 1; f < floors; f++) {
    const yy = f * fh;
    b.surf = S.PLASTER;
    b.box(w + 0.06, 0.16, 0.24, 0, yy - 0.2, fz + 0.1, trim); // gờ chỉ ngăn tầng
    const bays = w > 5.6 ? [-w / 4, w / 4] : [0];
    const balcony = r() < 0.72;
    if (balcony) {
      b.box(w - 0.24, 0.14, 1.05, 0, yy - 0.06, fz + 0.52, trim);
      if (r() < 0.5) {
        // lan can sắt
        b.surf = S.METAL;
        const col = pick([0x2e3a35, 0x3a3a3a, 0x6a6a6a, shut]);
        b.box(w - 0.3, 0.05, 0.05, 0, yy + 0.98, fz + 1.0, col);
        b.box(w - 0.3, 0.04, 0.04, 0, yy + 0.2, fz + 1.0, col);
        const n = Math.max(4, Math.round((w - 0.3) / 0.42));
        for (let i = 0; i <= n; i++) b.box(0.035, 0.8, 0.035, -(w - 0.3) / 2 + (w - 0.3) * i / n, yy + 0.2, fz + 1.0, col);
        for (const sx of [-1, 1]) b.box(0.04, 0.05, 1.0, sx * (w / 2 - 0.15), yy + 0.98, fz + 0.5, col);
      } else {
        // lan can xây có ô thoáng
        b.surf = S.PLASTER;
        b.box(w - 0.3, 0.9, 0.1, 0, yy + 0.08, fz + 1.0, wall);
        b.box(w - 0.24, 0.07, 0.16, 0, yy + 0.98, fz + 1.0, trim);
        const n = Math.max(2, Math.round(w / 1.6));
        for (let i = 0; i < n; i++) b.box((w - 0.9) / n - 0.2, 0.45, 0.02, -(w - 0.9) / 2 + (w - 0.9) * (i + 0.5) / n, yy + 0.32, fz + 1.06, 0x8a8478);
      }
      if (r() < 0.45) { // chậu cây, hoa giấy trên ban công
        const px = (r() > 0.5 ? 1 : -1) * (w / 2 - 0.6);
        b.surf = S.PLAIN; b.cyl(0.2, 0.15, 0.3, px, yy + 0.08, fz + 0.7, 0x9a5a3a, 8);
        const c = world(px, yy + 0.75, fz + 0.7);
        FOL.crown(c[0], c[1], c[2], 0.45, 0.45, 0.45, r() < 0.5 ? LEAF.bougain : LEAF.shrub, 5, 0.42, 0xffffff, { sway: 0.03 });
      }
    }
    for (const bx of bays) {
      const ww = bays.length > 1 ? 1.15 : Math.min(1.5, w * 0.3), hh = balcony ? 2.3 : 1.5, y0 = yy + (balcony ? 0.1 : 0.95);
      b.surf = S.PLASTER; b.box(ww + 0.24, hh + 0.2, 0.08, bx, y0 - 0.06, fz + 0.02, trim);
      b.surf = S.GLASS; b.box(ww, hh, 0.06, bx, y0, fz + 0.05, 0x2e3e4e);
      b.surf = S.WOOD;
      if (r() < 0.75) for (const sx of [-1, 1]) { // cửa chớp mở sang hai bên
        b.box(ww / 2, hh, 0.05, bx + sx * (ww * 0.75 + 0.06), y0, fz + 0.06, shut);
        for (let k = 0; k < 4; k++) b.box(ww / 2 - 0.08, 0.03, 0.02, bx + sx * (ww * 0.75 + 0.06), y0 + 0.25 + k * (hh - 0.4) / 3.5, fz + 0.09, 0x1c1814);
      }
      if (r() > 0.5) win.box(ww - 0.1, hh - 0.1, 0.03, bx, y0 + 0.05, fz + 0.09, r() > 0.25 ? 0xffd59a : 0xbfe0ff);
    }
    if (r() < 0.38) { // cục nóng điều hoà
      const ax = (r() > 0.5 ? 1 : -1) * (w / 2 - 0.75);
      b.surf = S.METAL; b.box(0.78, 0.52, 0.3, ax, yy + 2.4, fz + 0.16, 0xdad8d0);
      b.save(); b.translate(ax - 0.12, yy + 2.66, fz + 0.32); b.rotateX(Math.PI / 2); b.cyl(0.19, 0.19, 0.02, 0, 0, 0, 0x3a3a3a, 10); b.restore();
    }
  }
  // ----- mái
  const rk = r();
  b.surf = S.PLASTER;
  if (rk < 0.45) {
    b.gable(d + 0.5, w + 0.4, 1.7, 0, H - 0.3, 0, pick([0xa94c2f, 0x9a4630, 0xb05a3a, 0x8a4a38]), Math.PI / 2);
    b.box(w + 0.1, 0.2, 0.3, 0, H - 0.4, fz + 0.1, trim);
  } else {
    b.box(w, 0.7, 0.18, 0, H - 0.3, fz - 0.09, wall);
    b.box(w + 0.1, 0.1, 0.3, 0, H + 0.4, fz - 0.05, trim);
    for (const sx of [-1, 1]) b.box(0.16, 0.5, d, sx * (w / 2 - 0.08), H - 0.3, 0, wall);
    if (rk > 0.62) { // bồn nước inox trên giá sắt
      const tx = w * 0.2 * (r() > 0.5 ? 1 : -1), tz = -d * 0.2;
      b.surf = S.METAL;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(0.06, 0.9, 0.06, tx + sx * 0.4, H - 0.3, tz + sz * 0.4, 0x5a5a5a);
      b.cyl(0.5, 0.5, 1.3, tx, H + 0.6, tz, 0xd8dcde, 12);
      b.cyl(0.2, 0.52, 0.18, tx, H + 1.9, tz, 0xc8ccd0, 12);
    }
    if (rk > 0.85) { b.surf = S.PLASTER; b.box(w * 0.5, 2.3, d * 0.3, -w * 0.2, H - 0.3, -d * 0.25, wall); b.surf = S.METAL; b.box(w * 0.5 + 0.3, 0.08, d * 0.3 + 0.3, -w * 0.2, H + 2.0, -d * 0.25, 0x7a8088); }
  }
  b.restore();
  b.surf = oldSurf;
}

// Cột điện bê tông và dây điện chùng dọc theo một đoạn phố
export function powerLine(b, x1, z1, x2, z2, side, w) {
  const len = Math.hypot(x2 - x1, z2 - z1);
  if (len < 50) return;
  const dx = (x2 - x1) / len, dz = (z2 - z1) / len, nx = dz * side, nz = -dx * side;
  const off = w / 2 + 1.55, H = 8.2, span = 34;
  const n = Math.floor((len - 16) / span);
  const old = b.surf;
  let prev = null;
  for (let i = 0; i <= n; i++) {
    let t = 8 + i * span, px = 0, pz = 0, ok = false;
    for (const o of [0, 3.5, -3.5, 7]) { // né cây và đèn đường
      px = x1 + dx * (t + o) + nx * off; pz = z1 + dz * (t + o) + nz * off;
      if (Math.abs(pz) > 68 && !b.physics.blocked(px, pz, 1)) { ok = true; break; }
    }
    if (!ok) { prev = null; continue; }
    const gy = terrainHeight(px, pz);
    b.surf = S.CONCRETE;
    b.cyl(0.11, 0.17, H, px, gy, pz, 0x8a877f, 8);
    b.surf = S.METAL;
    b.save(); b.translate(px, gy, pz); b.rotateY(Math.atan2(nx, nz));
    b.box(0.07, 0.07, 1.5, 0, H - 0.5, 0, 0x4a4a4a); b.box(0.07, 0.07, 1.1, 0, H - 1.3, 0, 0x4a4a4a);
    for (const k of [-0.65, 0, 0.65]) b.cyl(0.04, 0.05, 0.14, 0, H - 0.43, k, 0xd8d0c0, 6);
    if (i % 3 === 1) { b.box(0.5, 0.7, 0.4, 0.3, H - 2.6, 0, 0x6a6e70); b.box(0.06, 0.06, 0.5, 0.3, H - 1.9, 0, 0x4a4a4a); }
    b.restore();
    b.circleSolid(0.2, 4, px, gy, pz);
    if (prev) {
      // dây chùng giữa hai cột
      const wires = [[H - 0.36, -0.65, 0.5, 0.012], [H - 0.36, 0, 0.6, 0.012], [H - 0.36, 0.65, 0.5, 0.012], [H - 1.25, 0.4, 0.8, 0.02], [H - 1.9, -0.1, 0.95, 0.035]];
      for (const [wy, wo, sag, th] of wires) {
        const ax = prev[0] + nx * wo, az = prev[1] + nz * wo, bx = px + nx * wo, bz = pz + nz * wo, SEG = 6;
        for (let k = 0; k < SEG; k++) {
          const t0 = k / SEG, t1 = (k + 1) / SEG;
          const y0 = prev[2] + (gy - prev[2]) * t0 + wy - sag * 4 * t0 * (1 - t0), y1 = prev[2] + (gy - prev[2]) * t1 + wy - sag * 4 * t1 * (1 - t1);
          const sx = ax + (bx - ax) * t0, sz = az + (bz - az) * t0, ex = ax + (bx - ax) * t1, ez = az + (bz - az) * t1;
          const L = Math.hypot(ex - sx, y1 - y0, ez - sz);
          b.save(); b.translate((sx + ex) / 2, (y0 + y1) / 2, (sz + ez) / 2); b.rotateY(Math.atan2(ex - sx, ez - sz)); b.rotateX(-Math.atan2(y1 - y0, Math.hypot(ex - sx, ez - sz)));
          b.box(th, th, L + 0.02, 0, -th / 2, 0, 0x1a1a1a);
          b.restore();
        }
      }
    }
    prev = [px, pz, gy];
  }
  b.surf = old;
}

// Vạch qua đường tại một điểm trên trục đường
export function crosswalk(b, cx, cz, alongX, w) {
  const old = b.surf, y = terrainHeight(cx, cz) + 0.12;
  b.surf = S.PLAIN;
  const n = Math.floor(w / 0.9);
  for (let i = 0; i < n; i++) {
    const o = -w / 2 + 0.45 + i * (w - 0.9) / Math.max(1, n - 1);
    if (alongX) b.box(2.6, 0.02, 0.45, cx, y, cz + o, 0xe8e4d4); else b.box(0.45, 0.02, 2.6, cx + o, y, cz, 0xe8e4d4);
  }
  b.surf = old;
}
