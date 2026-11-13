// Xe máy chạy trên phố, thuyền rồng, đò trên sông, hoa đăng trôi
import * as THREE from 'three';
import { Builder } from './builder.js';
import { motorbikeModel } from './city.js';
import { makePerson } from './people.js';
import { lantern } from './props.js';
import { RIVER } from './layout.js';

const BIKE_COLORS = [0xc8322a, 0x2d6fb0, 0x1a1a1a, 0xf2efe6, 0x3a8a4a, 0xe8b030, 0x7a3fa0];

// ===== Xe máy =====
export class Traffic {
  constructor(W) {
    this.W = W;
    this.bikes = [];
    // các vòng đường (theo chiều kim đồng hồ khi nhìn từ trên → đi bên phải)
    const loops = [
      [[-40, 72], [100, 72], [100, 150], [-40, 150]],
      [[100, 72], [220, 72], [220, 230], [100, 230]],
      [[-160, 72], [-40, 72], [-40, 230], [-160, 230]],
      [[-40, 150], [100, 150], [100, 230], [-40, 230]],
      [[-300, -72], [280, -72], [280, -72.01], [-300, -72.01]],
      [[80, -72], [80, -215], [280, -215], [280, -214.99], [80, -214.99], [80, -72.01]],
      [[-420, 72], [280, 72], [280, 72.01], [-420, 72.01]],
      [[-150, -150], [10, -150], [10, -315], [-150, -315]],
    ];
    let k = 0;
    for (const loop of loops) {
      const n = loop.length >= 6 ? 2 : 3;
      for (let i = 0; i < n; i++) this._add(loop, i / n, BIKE_COLORS[k++ % BIKE_COLORS.length]);
    }
  }

  _add(path, t0, color) {
    const b = new Builder();
    motorbikeModel(b, 0, 0, 0, color, 0);
    const mesh = b.build(this.W.mats.main);
    mesh.matrixAutoUpdate = true;
    const group = new THREE.Group();
    group.add(mesh);
    const rider = makePerson(this.W.mats.dyn, { type: Math.random() < 0.5 ? 'man' : 'aodai', hat: Math.random() < 0.7 ? 'helmet' : 'non' });
    rider.root.position.set(0, -0.15, -0.2);
    rider.legL.rotation.x = rider.legR.rotation.x = -1.2;
    rider.armL.rotation.x = rider.armR.rotation.x = -1.0;
    group.add(rider.group);
    if (Math.random() < 0.35) {
      const p2 = makePerson(this.W.mats.dyn, { type: 'aodai', hat: 'non' });
      p2.root.position.set(0, -0.1, -0.65);
      p2.legL.rotation.x = p2.legR.rotation.x = -1.2;
      group.add(p2.group);
    }
    this.W.scene.add(group);
    // độ dài đường
    const segs = [];
    let total = 0;
    for (let i = 0; i < path.length; i++) {
      const a = path[i], c = path[(i + 1) % path.length];
      const L = Math.hypot(c[0] - a[0], c[1] - a[1]);
      segs.push({ a, c, L, s: total }); total += L;
    }
    this.bikes.push({ group, segs, total, d: t0 * total, speed: 7 + Math.random() * 4, v: 0, honk: 0 });
  }

  _at(bk, d) {
    d = ((d % bk.total) + bk.total) % bk.total;
    for (const s of bk.segs) {
      if (d <= s.s + s.L || s === bk.segs[bk.segs.length - 1]) {
        const t = s.L > 0 ? (d - s.s) / s.L : 0;
        const dx = (s.c[0] - s.a[0]) / (s.L || 1), dz = (s.c[1] - s.a[1]) / (s.L || 1);
        // làn bên phải
        const lane = 2.0;
        return { x: s.a[0] + (s.c[0] - s.a[0]) * t - dz * lane, z: s.a[1] + (s.c[1] - s.a[1]) * t + dx * lane, dx, dz };
      }
    }
    return { x: 0, z: 0, dx: 0, dz: 1 };
  }

  update(dt, player, audio) {
    for (const bk of this.bikes) {
      const p = this._at(bk, bk.d);
      const dx = player.pos.x - p.x, dz = player.pos.z - p.z;
      const ahead = dx * p.dx + dz * p.dz;
      const side = Math.abs(dx * p.dz - dz * p.dx);
      let target = bk.speed;
      if (ahead > 0 && ahead < 7 && side < 1.6 && Math.abs(player.pos.y - (player.groundY ?? 0)) < 3) {
        target = 0;
        bk.honk -= dt;
        if (bk.honk <= 0 && audio) { audio.honk(Math.hypot(dx, dz)); bk.honk = 2.5 + Math.random() * 2; }
      }
      bk.v += (target - bk.v) * Math.min(1, dt * 3);
      bk.d += bk.v * dt;
      const q = this._at(bk, bk.d);
      const y = this.W.physics.groundAt(q.x, q.z, 100).h;
      bk.group.position.set(q.x, y, q.z);
      const want = Math.atan2(q.dx, q.dz);
      bk.group.rotation.y += angDiff(bk.group.rotation.y, want) * Math.min(1, dt * 8);
      const dd = dx * dx + dz * dz;
      bk.group.visible = dd < 200 * 200;
    }
  }
}
const angDiff = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };

// ===== Thuyền rồng =====
export function makeDragonBoat(W, { color = 0x2f7a4a, roof = 0xdca22c, len = 14 } = {}) {
  const b = new Builder();
  const g = new Builder(); g.jitter = 0;
  const half = len / 2;
  // thân thuyền: hình thoi kéo dài
  const shape = new THREE.Shape();
  shape.moveTo(0, -half - 1);
  shape.quadraticCurveTo(1.7, -half + 1.5, 1.7, 0);
  shape.quadraticCurveTo(1.7, half - 1.5, 0, half + 1.2);
  shape.quadraticCurveTo(-1.7, half - 1.5, -1.7, 0);
  shape.quadraticCurveTo(-1.7, -half + 1.5, 0, -half - 1);
  const hull = new THREE.ExtrudeGeometry(shape, { depth: 1.2, bevelEnabled: false, curveSegments: 6 });
  hull.rotateX(Math.PI / 2); // shape y → z ; extrude → -y
  hull.translate(0, 0.6, 0);
  b.geo(hull, color, 0, 0, 0); hull.dispose();
  b.box(3.0, 0.12, len - 1, 0, 0.55, 0, 0x7a5a3a); // sàn
  // dải trang trí vảy rồng
  b.box(3.5, 0.18, len - 2, 0, 0.25, 0, 0xd8a83a);
  b.box(3.45, 0.12, len - 2.4, 0, 0.0, 0, 0xc8322a);
  // đầu rồng
  b.save(); b.translate(0, 0.6, half + 0.6);
  b.boxR(0.7, 2.6, 0.8, 0, 1.2, 0.3, 0xd8a83a, 0.35, 0, 0);
  b.box(0.9, 0.8, 1.6, 0, 2.3, 1.0, 0xd8a83a);
  b.box(0.7, 0.3, 1.2, 0, 2.0, 1.6, 0xc8322a);
  for (const s of [-1, 1]) {
    b.boxR(0.12, 0.9, 0.12, s * 0.3, 3.0, 0.5, 0x2f7a4a, -0.6, 0, s * 0.3);
    b.sphere(0.12, s * 0.42, 2.55, 1.4, 0xf2efe6, 5, 4);
    b.boxR(0.06, 0.06, 1.2, s * 0.3, 2.0, 2.0, 0xd8a83a, 0.3, s * 0.4, 0); // râu
  }
  b.boxR(0.5, 0.2, 1.4, 0, 2.6, 0.2, 0x2f7a4a, -0.4, 0, 0); // bờm
  b.restore();
  // đuôi rồng
  b.save(); b.translate(0, 0.6, -half - 0.5);
  b.boxR(0.5, 2.2, 0.5, 0, 1.0, -0.4, 0xd8a83a, -0.5, 0, 0);
  b.boxR(0.12, 1.2, 1.2, 0, 2.2, -1.0, 0x2f7a4a, -0.3, 0, 0);
  b.restore();
  // mui thuyền
  const cl = len * 0.55;
  for (const sx of [-1.25, 1.25]) for (const sz of [-cl / 2, 0, cl / 2]) b.cyl(0.07, 0.07, 2.2, sx, 0.6, sz, 0x8e1d17, 6);
  b.box(2.8, 0.15, cl + 0.4, 0, 2.8, 0, 0x8e1d17);
  b.roof(3.6, cl + 1.6, 1.0, 0, 2.95, 0, roof, 0, 0.35);
  b.ridgeDragons(cl * 0.5, 0, 3.9, 0, 0xd8a83a, Math.PI / 2);
  // ghế ngồi nhỏ
  for (let i = 0; i < 4; i++) for (const sx of [-0.8, 0.8]) b.box(0.4, 0.3, 0.4, sx, 0.62, -cl / 2 + 0.8 + i * (cl - 1.6) / 3, 0x5a3a20);
  // bàn trà
  b.box(0.8, 0.45, 1.2, 0, 0.62, 0, 0x6a4226);
  // đèn lồng treo
  for (let i = 0; i < 4; i++) for (const sx of [-1.25, 1.25]) lantern(g, sx, 2.25, -cl / 2 + i * cl / 3, 0xd8322a, 0.55);
  g.box(0.25, 0.25, 0.25, 0, 0.75, 0.2, 0xffd080); // nến trên bàn
  const group = new THREE.Group();
  const m = b.build(W.mats.main); m.matrixAutoUpdate = true;
  const gm = g.build(W.mats.glow, { cast: false, receive: false }); gm.matrixAutoUpdate = true;
  group.add(m, gm);
  W.scene.add(group);
  return group;
}

// Đò nhỏ có người chèo
function makeSampan(W) {
  const b = new Builder();
  const shape = new THREE.Shape();
  shape.moveTo(0, -3.5); shape.quadraticCurveTo(0.9, -1.5, 0.9, 0); shape.quadraticCurveTo(0.9, 1.5, 0, 3.5);
  shape.quadraticCurveTo(-0.9, 1.5, -0.9, 0); shape.quadraticCurveTo(-0.9, -1.5, 0, -3.5);
  const hull = new THREE.ExtrudeGeometry(shape, { depth: 0.6, bevelEnabled: false, curveSegments: 5 });
  hull.rotateX(Math.PI / 2); hull.translate(0, 0.3, 0);
  b.geo(hull, 0x5a3a20, 0, 0, 0); hull.dispose();
  // mái che cong bằng tre
  b.save(); b.translate(0, 0.3, 0.2);
  for (let i = 0; i < 7; i++) { const a = -1.2 + i * 0.4; b.boxR(0.12, 0.04, 2.4, Math.sin(a) * 0.85, Math.cos(a) * 0.85, 0, 0x8a6a3a, 0, 0, -a); }
  b.restore();
  const group = new THREE.Group();
  const m = b.build(W.mats.main); m.matrixAutoUpdate = true;
  group.add(m);
  const rower = makePerson(W.mats.dyn, { type: 'vendor', hat: 'non' });
  rower.group.position.set(0, 0.3, -2.6);
  rower.armL.rotation.x = rower.armR.rotation.x = -0.8;
  group.add(rower.group);
  const oar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 3), W.mats.main);
  oar.geometry.setAttribute('color', new THREE.Float32BufferAttribute(new Array(oar.geometry.attributes.position.count * 3).fill(0.35), 3));
  oar.position.set(0.3, 1.0, -3.4); oar.rotation.x = 0.7;
  group.add(oar);
  group.userData.rower = rower; group.userData.oar = oar;
  W.scene.add(group);
  return group;
}

export class River {
  constructor(W) {
    this.W = W;
    this.moored = [];
    // thuyền rồng neo ở bến
    const colors = [[0x2f7a4a, 0xdca22c], [0x8e1d17, 0xdca22c], [0x2d5f8a, 0xdca22c]];
    const spots = [[34.5, 31, 0.02], [46.4, 30, -0.03], [52.2, 31.5, 0.04]];
    spots.forEach(([x, z, r], i) => {
      const g = makeDragonBoat(W, { color: colors[i][0], roof: colors[i][1], len: 13 });
      g.position.set(x, RIVER.water - 0.25, z);
      g.rotation.y = r + Math.PI;
      this.moored.push({ g, x, z, ph: Math.random() * 6 });
    });
    // thuyền ở bến chùa Thiên Mụ
    const tg = makeDragonBoat(W, { color: 0x8e1d17, len: 12 });
    tg.position.set(-346.5, RIVER.water - 0.25, -34); tg.rotation.y = 0.05;
    this.moored.push({ g: tg, x: -346.5, z: -34, ph: 1 });
    // đò chèo qua lại
    this.sampans = [];
    for (let i = 0; i < 5; i++) {
      const s = makeSampan(W);
      this.sampans.push({ g: s, x: -380 + i * 140, z: (i % 2 ? 1 : -1) * (12 + Math.random() * 18), dir: i % 2 ? 1 : -1, speed: 1.2 + Math.random() * 0.8, ph: Math.random() * 6 });
    }
    // thuyền rồng để đi
    this.ride = makeDragonBoat(W, { color: 0x2f7a4a, len: 14 });
    this.ride.position.set(40, RIVER.water - 0.25, 18);
    this.ride.rotation.y = Math.PI / 2;
    this.rideBase = this.ride.position.clone();
    this.riding = false;
  }

  update(dt, t) {
    const wy = RIVER.water - 0.25;
    for (const m of this.moored) {
      m.g.position.y = wy + Math.sin(t * 1.3 + m.ph) * 0.05;
      m.g.rotation.z = Math.sin(t * 0.9 + m.ph) * 0.015;
    }
    for (const s of this.sampans) {
      s.x += s.dir * s.speed * dt;
      if (s.x > 320) s.dir = -1; if (s.x < -440) s.dir = 1;
      if (Math.abs(s.x - 100) < 8) s.x += s.dir * 16; // né trụ cầu
      s.g.position.set(s.x, wy + 0.1 + Math.sin(t * 1.5 + s.ph) * 0.05, s.z);
      s.g.rotation.y = s.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      const r = s.g.userData.rower;
      r.root.rotation.x = Math.sin(t * 1.6 + s.ph) * 0.15;
      s.g.userData.oar.rotation.y = Math.sin(t * 1.6 + s.ph) * 0.4;
    }
    if (!this.riding) {
      this.ride.position.y = wy + Math.sin(t * 1.2) * 0.05;
    }
  }
}

// ===== Hoa đăng =====
export class Lanterns {
  constructor(W, max = 120) {
    this.W = W; this.max = max;
    const base = new THREE.CylinderGeometry(0.32, 0.22, 0.18, 6);
    const pet = new THREE.ConeGeometry(0.3, 0.35, 6);
    pet.translate(0, 0.25, 0);
    // gộp đế và cánh
    const merged = mergeSimple([base, pet]);
    this.lotus = new THREE.InstancedMesh(merged, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, emissive: 0xff7050, emissiveIntensity: 0.35 }), max);
    this.flame = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 6, 4), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 2.4, 0.8), toneMapped: false }), max);
    this.lotus.count = 0; this.flame.count = 0;
    this.lotus.frustumCulled = this.flame.frustumCulled = false;
    W.scene.add(this.lotus, this.flame);
    this.items = [];
    this.m = new THREE.Matrix4();
    this.colors = [0xf08aa8, 0xf2d06a, 0xff9a6a, 0xf2efe6];
  }
  release(x, z) {
    if (this.items.length >= this.max) this.items.shift();
    this.items.push({ x, z, ph: Math.random() * 6, vz: (Math.random() - 0.5) * 0.12, c: this.colors[Math.floor(Math.random() * 4)] });
    this._colors();
  }
  _colors() {
    const c = new THREE.Color();
    this.items.forEach((it, i) => this.lotus.setColorAt(i, c.set(it.c)));
    if (this.lotus.instanceColor) this.lotus.instanceColor.needsUpdate = true;
  }
  update(dt, t) {
    const wy = RIVER.water;
    let i = 0;
    for (const it of this.items) {
      it.x += dt * 0.45; it.z += it.vz * dt;
      if (Math.abs(it.z) > RIVER.half - 3) it.vz *= -1;
      const y = wy + 0.05 + Math.sin(t * 1.6 + it.ph) * 0.03;
      this.m.makeRotationY(it.ph + t * 0.05).setPosition(it.x, y, it.z);
      this.lotus.setMatrixAt(i, this.m);
      this.m.makeScale(1, 1.4 + Math.sin(t * 9 + it.ph) * 0.25, 1).setPosition(it.x, y + 0.42, it.z);
      this.flame.setMatrixAt(i, this.m);
      i++;
    }
    const before = this.items.length;
    this.items = this.items.filter(it => it.x < 340);
    if (this.items.length !== before) this._colors();
    this.lotus.count = this.flame.count = i;
    this.lotus.instanceMatrix.needsUpdate = true;
    this.flame.instanceMatrix.needsUpdate = true;
  }
}

function mergeSimple(geos) {
  const parts = geos.map(g => g.index ? g.toNonIndexed() : g);
  let n = 0; for (const g of parts) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
  let o = 0;
  for (const g of parts) { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return out;
}
