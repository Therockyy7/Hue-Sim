// Builder: gom nhiều hình khối nhỏ thành một mesh duy nhất (màu theo đỉnh)
// để giảm số draw call. API giống canvas: save/restore/translate/rotate.
import * as THREE from 'three';
import { S, autoSurf } from './surfaces.js';

const _m = new THREE.Matrix4();
const _c = new THREE.Color();
const _v = new THREE.Vector3();

export class Builder {
  constructor(physics = null) {
    this.chunks = [];
    this.stack = [new THREE.Matrix4()];
    this.physics = physics;
    this.jitter = 0.035;
    this.surf = null;    // ép loại bề mặt cho các khối kế tiếp (null: tự suy từ màu)
    this.smooth = true;  // giữ pháp tuyến mượt cho khối cong (trụ, cầu, nón)
    this.shade = 0.16;   // làm tối dần về chân các khối hộp cao (giả bóng tiếp đất)
    this.bone = 0;       // chỉ số xương cho mesh có khung xương (nhân vật)
  }

  get matrix() { return this.stack[this.stack.length - 1]; }
  // Liên kết: các builder phụ (đèn phát sáng, cửa sổ) đi theo phép biến đổi của builder chính
  link(...others) { this.links = (this.links || []).concat(others); return this; }
  _l(fn) { if (this.links) for (const l of this.links) fn(l); }
  save() { this.stack.push(this.matrix.clone()); this._l(l => l.save()); return this; }
  restore() { this.stack.pop(); this._l(l => l.restore()); return this; }
  translate(x, y, z) { this.matrix.multiply(_m.makeTranslation(x, y, z)); this._l(l => l.translate(x, y, z)); return this; }
  rotateY(a) { this.matrix.multiply(_m.makeRotationY(a)); this._l(l => l.rotateY(a)); return this; }
  rotateX(a) { this.matrix.multiply(_m.makeRotationX(a)); this._l(l => l.rotateX(a)); return this; }
  rotateZ(a) { this.matrix.multiply(_m.makeRotationZ(a)); this._l(l => l.rotateZ(a)); return this; }
  scale(x, y, z) { this.matrix.multiply(_m.makeScale(x, y, z)); this._l(l => l.scale(x, y, z)); return this; }
  // chạy fn với loại bề mặt bị ép, rồi trả lại như cũ
  withSurf(surf, fn) { const old = this.surf; this.surf = surf; fn(); this.surf = old; return this; }

  // Thêm một BufferGeometry (sẽ được clone + biến đổi) với màu cho trước
  add(geo, color, local, smooth = false, gradH = 0) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    const m = this.matrix.clone();
    if (local) m.multiply(local);
    const n = g.attributes.position.count;
    const col = new Float32Array(n * 3);
    _c.set(color);
    if (this.jitter) _c.multiplyScalar(1 + (Math.random() * 2 - 1) * this.jitter);
    if (gradH > 1.2 && this.shade) {
      // khối hộp cao: đỉnh dưới tối hơn đỉnh trên
      const py = g.attributes.position.array, k = Math.min(this.shade, 0.05 + gradH * 0.025);
      for (let i = 0; i < n; i++) {
        const f = py[i * 3 + 1] < 0 ? 1 - k : 1;
        col[i * 3] = _c.r * f; col[i * 3 + 1] = _c.g * f; col[i * 3 + 2] = _c.b * f;
      }
    } else for (let i = 0; i < col.length; i += 3) { col[i] = _c.r; col[i + 1] = _c.g; col[i + 2] = _c.b; }
    g.applyMatrix4(m);
    if (!(smooth && this.smooth) || !g.attributes.normal) g.computeVertexNormals();
    this.chunks.push({
      pos: Float32Array.from(g.attributes.position.array), nor: Float32Array.from(g.attributes.normal.array), col,
      surf: this.surf ?? autoSurf(color), bone: this.bone,
    });
    g.dispose();
    if (geo.userData.temp) geo.dispose();
    return this;
  }

  // Hộp: (w,h,d) — đáy tại y
  box(w, h, d, x, y, z, color, ry = 0) {
    const g = getBox(w, h, d);
    const l = new THREE.Matrix4().makeRotationY(ry).setPosition(x, y + h / 2, z);
    return this.add(g, color, l, false, h);
  }
  // Hộp xoay tuỳ ý (tâm tại x,y,z)
  boxR(w, h, d, x, y, z, color, rx = 0, ry = 0, rz = 0) {
    const g = getBox(w, h, d);
    const l = new THREE.Matrix4().compose(_v.set(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(1, 1, 1));
    return this.add(g, color, l);
  }
  cyl(rt, rb, h, x, y, z, color, seg = 8, ry = 0) {
    // khối tròn được chia mịn hơn khi tô bóng mượt
    if (this.smooth && seg >= 7 && seg < 12 && Math.max(rt, rb) > 0.14) seg = 12;
    const g = new THREE.CylinderGeometry(rt, rb, h, seg, 1);
    g.userData.temp = true;
    const l = new THREE.Matrix4().makeRotationY(ry).setPosition(x, y + h / 2, z);
    return this.add(g, color, l, true);
  }
  cone(r, h, x, y, z, color, seg = 8, ry = 0) { return this.cyl(0.001, r, h, x, y, z, color, seg, ry); }
  sphere(r, x, y, z, color, ws = 7, hs = 5, sy = 1) {
    if (this.smooth && r > 0.15 && ws < 12) { ws = 12; hs = Math.max(hs, 8); }
    const g = new THREE.SphereGeometry(r, ws, hs);
    g.userData.temp = true;
    const l = new THREE.Matrix4().makeScale(1, sy, 1).setPosition(x, y, z);
    return this.add(g, color, l, true);
  }
  ico(r, x, y, z, color, detail = 0, sx = 1, sy = 1, sz = 1) {
    const g = new THREE.IcosahedronGeometry(r, detail);
    g.userData.temp = true;
    const l = new THREE.Matrix4().makeScale(sx, sy, sz).setPosition(x, y, z);
    return this.add(g, color, l, detail > 0);
  }
  geo(g, color, x = 0, y = 0, z = 0, ry = 0, s = 1, smooth = false) {
    const l = new THREE.Matrix4().makeRotationY(ry).scale(_v.set(s, s, s)).setPosition(x, y, z);
    return this.add(g, color, l, smooth);
  }

  // Mái chái kiểu Huế: (w theo x, d theo z), đầu đao cong lên ở 4 góc. y = chân mái
  roof(w, d, h, x, y, z, color, ry = 0, curl = 0.6, under = 0x5a3820) {
    const g = hipRoofGeometry(w, d, h, curl);
    const l = new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z);
    const old = this.surf;
    this.surf = S.TILE;
    this.add(g, color, l);
    if (under) {
      const l2 = new THREE.Matrix4().makeRotationY(ry).setPosition(x, y - 0.18, z);
      this.surf = S.WOOD;
      this.add(g, under, l2);
    }
    this.surf = old;
    g.dispose();
    return this;
  }
  // Mái hai dốc (nhà phố)
  gable(w, d, h, x, y, z, color, ry = 0) {
    const g = gableGeometry(w, d, h);
    const l = new THREE.Matrix4().makeRotationY(ry).setPosition(x, y, z);
    const old = this.surf;
    this.surf = S.TILE;
    this.add(g, color, l);
    this.surf = old;
    g.dispose();
    return this;
  }
  // Rồng/ trang trí bờ nóc
  ridgeDragons(w, x, y, z, color = 0xc9a24a, ry = 0) {
    this.save(); this.translate(x, y, z); this.rotateY(ry);
    this.box(w, 0.35, 0.35, 0, 0, 0, color);
    for (const s of [-1, 1]) {
      this.boxR(0.35, 1.1, 0.35, s * w / 2, 0.55, 0, color, 0, 0, -s * 0.5);
      this.boxR(0.3, 0.5, 0.3, s * (w / 2 + 0.35), 1.05, 0, color, 0, 0, -s * 1.1);
    }
    // lưỡng long chầu nguyệt
    this.sphere(0.45, 0, 0.75, 0, 0xe8c25a, 6, 4);
    this.restore();
    return this;
  }

  // ---- Va chạm (toạ độ theo ma trận hiện tại; chỉ hỗ trợ xoay quanh trục Y)
  _world(x, y, z) {
    _v.set(x, y, z).applyMatrix4(this.matrix);
    const e = this.matrix.elements;
    const a = Math.atan2(-e[2], e[0]);
    return { x: _v.x, y: _v.y, z: _v.z, a };
  }
  solid(w, h, d, x, y, z, ry = 0, tag) {
    if (!this.physics) return this;
    const p = this._world(x, y, z);
    return this.physics.addBox(p.x, p.z, w / 2, d / 2, p.a + ry, p.y, p.y + h, tag);
  }
  solidBox(w, h, d, x, y, z, color, ry = 0) {
    this.box(w, h, d, x, y, z, color, ry);
    this.solid(w, h, d, x, y, z, ry);
    return this;
  }
  circleSolid(r, h, x, y, z) {
    if (!this.physics) return this;
    const p = this._world(x, y, z);
    this.physics.addCircle(p.x, p.z, r, p.y, p.y + h);
    return this;
  }
  floor(w, d, x, z, y0, y1 = y0, ry = 0) {
    if (!this.physics) return this;
    const p = this._world(x, 0, z);
    const base = p.y;
    return this.physics.addFloor(p.x, p.z, w / 2, d / 2, p.a + ry, base + y0, base + y1);
  }

  // opts.chunk = cạnh ô lưới (m): chia thành nhiều mesh theo vùng để cắt bỏ phần ngoài tầm nhìn
  build(material, opts = {}) {
    const chunks = this.chunks;
    this.chunks = [];
    if (!opts.chunk) return meshOf(chunks, material, opts);
    const cells = new Map();
    for (const c of chunks) {
      const p = c.pos;
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
      for (let i = 0; i < p.length; i += 3) {
        if (p[i] < x0) x0 = p[i]; if (p[i] > x1) x1 = p[i];
        if (p[i + 2] < z0) z0 = p[i + 2]; if (p[i + 2] > z1) z1 = p[i + 2];
      }
      const k = Math.floor((x0 + x1) / 2 / opts.chunk) + '|' + Math.floor((z0 + z1) / 2 / opts.chunk);
      let list = cells.get(k);
      if (!list) cells.set(k, list = []);
      list.push(c);
    }
    const group = new THREE.Group();
    group.matrixAutoUpdate = false;
    for (const list of cells.values()) group.add(meshOf(list, material, opts));
    return group;
  }
  get empty() { return this.chunks.length === 0; }
}

function meshOf(chunks, material, opts) {
  let n = 0;
  for (const c of chunks) n += c.pos.length;
  const nv = n / 3;
  const pos = new Float32Array(n), nor = new Float32Array(n), col = new Float32Array(n);
  const surf = opts.skin ? null : new Float32Array(nv);
  const skin = opts.skin ? new Uint16Array(nv * 4) : null;
  let o = 0;
  for (const c of chunks) {
    pos.set(c.pos, o); nor.set(c.nor, o); col.set(c.col, o);
    const a = o / 3, b = (o + c.pos.length) / 3;
    if (surf) surf.fill(c.surf, a, b);
    if (skin) for (let i = a; i < b; i++) skin[i * 4] = c.bone;
    o += c.pos.length;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  if (skin) {
    const w = new Float32Array(nv * 4);
    for (let i = 0; i < w.length; i += 4) w[i] = 1;
    g.setAttribute('skinIndex', new THREE.BufferAttribute(skin, 4));
    g.setAttribute('skinWeight', new THREE.BufferAttribute(w, 4));
  } else g.setAttribute('surf', new THREE.BufferAttribute(surf, 1));
  g.computeBoundingSphere();
  g.computeBoundingBox();
  const mesh = opts.skin ? new THREE.SkinnedMesh(g, material) : new THREE.Mesh(g, material);
  mesh.castShadow = opts.cast !== false;
  mesh.receiveShadow = opts.receive !== false;
  if (!opts.skin) { mesh.matrixAutoUpdate = false; mesh.updateMatrix(); }
  return mesh;
}

const boxCache = new Map();
function getBox(w, h, d) {
  const k = `${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}`;
  let g = boxCache.get(k);
  if (!g) {
    g = new THREE.BoxGeometry(w, h, d);
    if (boxCache.size > 4000) boxCache.clear();
    boxCache.set(k, g);
  }
  return g;
}

export function hipRoofGeometry(w, d, h, curl = 0.6) {
  const hw = w / 2, hd = d / 2;
  const rl = Math.max(0, (w - d) / 2) * 0.85;
  const sag = h * 0.18; // độ võng của mái
  const A = [-hw, curl, -hd], B = [hw, curl, -hd], C = [hw, curl, hd], D = [-hw, curl, hd];
  const Mab = [0, 0, -hd], Mbc = [hw, 0, 0], Mcd = [0, 0, hd], Mda = [-hw, 0, 0];
  const R1 = [-rl, h, 0], R2 = [rl, h, 0];
  // điểm giữa dốc (tạo độ võng)
  const mid = (p, q, s = sag) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2 - s, (p[2] + q[2]) / 2];
  const tris = [];
  const T = (a, b, c) => tris.push(...a, ...b, ...c);
  // mặt sau
  const Sb = mid(Mab, [0, h, 0]);
  T(A, Mab, Sb); T(A, Sb, R1); T(Mab, B, Sb); T(Sb, B, R2); T(Sb, R2, R1);
  // mặt trước
  const Sf = mid(Mcd, [0, h, 0]);
  T(D, R1, Sf); T(D, Sf, Mcd); T(Mcd, Sf, C); T(Sf, R2, C); T(Sf, R1, R2);
  // hồi trái
  const Sl = mid(Mda, R1);
  T(A, R1, Sl); T(A, Sl, Mda); T(Mda, Sl, D); T(Sl, R1, D);
  // hồi phải
  const Sr = mid(Mbc, R2);
  T(B, Mbc, Sr); T(B, Sr, R2); T(Mbc, C, Sr); T(Sr, C, R2);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(tris, 3));
  g.computeVertexNormals();
  return g;
}

export function gableGeometry(w, d, h) {
  const hw = w / 2, hd = d / 2;
  const v = [
    // dốc trước
    -hw, 0, hd, hw, 0, hd, hw, h, 0,
    -hw, 0, hd, hw, h, 0, -hw, h, 0,
    // dốc sau
    hw, 0, -hd, -hw, 0, -hd, -hw, h, 0,
    hw, 0, -hd, -hw, h, 0, hw, h, 0,
    // hồi
    -hw, 0, -hd, -hw, 0, hd, -hw, h, 0,
    hw, 0, hd, hw, 0, -hd, hw, h, 0,
  ];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.computeVertexNormals();
  return g;
}

// Tường có cổng vòm (Shape + Extrude), đáy tại y=0, mặt trước tại z = depth/2
export function archWallGeometry(w, h, depth, arches) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.lineTo(-w / 2, 0);
  for (const a of arches) {
    const p = new THREE.Path();
    const r = a.w / 2;
    const y0 = a.y0 ?? 0.03;
    p.moveTo(a.x - r, y0);
    p.lineTo(a.x + r, y0);
    p.lineTo(a.x + r, a.h - r);
    p.absarc(a.x, a.h - r, r, 0, Math.PI, false);
    p.lineTo(a.x - r, y0);
    s.holes.push(p);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 8 });
  g.translate(0, 0, -depth / 2);
  g.deleteAttribute('uv');
  return g;
}
