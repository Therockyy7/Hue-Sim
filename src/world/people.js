// Người dân, du khách, người bán hàng: mô hình low-poly + hoạt ảnh đi/đứng/ngồi
import * as THREE from 'three';
import { Builder } from './builder.js';

const SKIN = [0xe0b48e, 0xd8a47a, 0xc89070, 0xe8c09a];
const AODAI = [0x6a3d9a, 0xf2efe6, 0x8a4ac0, 0xd84a6a, 0x2d6fb0, 0xe8b030, 0x3a8a6a, 0xc8322a, 0x5a2a80, 0xf0c8d8];
const SHIRT = [0xf2efe6, 0x2d6fb0, 0x5a7a5a, 0xc8322a, 0x3a3a3a, 0xe8d8a8, 0x6a8ab0, 0xd8a050];
const PANTS = [0x2a2a30, 0x3a3a48, 0x5a4a3a, 0x2a3a5a, 0xd8d0c0];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

function part(fn) {
  const b = new Builder();
  b.jitter = 0.02;
  fn(b);
  const m = b.build(null);
  m.matrixAutoUpdate = true;
  return m;
}

export function makePerson(mat, opt = {}) {
  const type = opt.type || pick(['aodai', 'aodai', 'man', 'man', 'tourist', 'vendor', 'elder']);
  const skin = opt.skin ?? pick(SKIN);
  let top = opt.top ?? (type === 'aodai' || type === 'singer' ? pick(AODAI) : type === 'monk' ? 0xb8742a : type === 'elder' ? pick([0x3a2a4a, 0x2a2a3a, 0x5a2a2a]) : pick(SHIRT));
  const pants = opt.pants ?? (type === 'aodai' ? pick([0xf2efe6, 0xf2efe6, 0x1a1a1a]) : type === 'monk' ? 0x8a5a2a : type === 'tourist' ? pick([0xc8b890, 0x3a5a7a, 0x2a2a2a]) : pick(PANTS));
  const hat = opt.hat ?? (type === 'vendor' || (type === 'aodai' && Math.random() < 0.6) ? 'non' : type === 'tourist' ? pick(['cap', 'none', 'sun']) : type === 'man' ? pick(['none', 'none', 'helmet', 'cap']) : type === 'elder' ? 'turban' : type === 'singer' ? 'khandong' : 'none');
  const female = opt.female ?? (type === 'aodai' || type === 'vendor' || type === 'singer' || (type === 'elder' && Math.random() < 0.7) || (type === 'tourist' && Math.random() < 0.5));
  const hair = type === 'monk' ? skin : type === 'tourist' && Math.random() < 0.5 ? pick([0x8a6a3a, 0xc8a060, 0x3a2a1a]) : 0x1a1410;
  const scale = opt.scale ?? (type === 'kid' ? 0.68 : 0.94 + Math.random() * 0.1);

  const group = new THREE.Group();
  const root = new THREE.Group(); // nâng lên/ hạ xuống khi ngồi
  group.add(root);

  const long = type === 'aodai' || type === 'singer' || type === 'monk' || (type === 'elder' && female);
  const body = part((b) => {
    // thân
    b.cyl(0.17, 0.2, 0.62, 0, 0.92, 0, top, 7);
    b.cyl(0.21, 0.17, 0.12, 0, 1.5, 0, top, 7); // vai
    if (long) {
      // vạt áo dài trước/sau
      b.boxR(0.32, 0.75, 0.04, 0, 0.55, 0.15, top, 0.08, 0, 0);
      b.boxR(0.34, 0.8, 0.04, 0, 0.52, -0.15, top, -0.06, 0, 0);
      if (type === 'monk') b.cyl(0.24, 0.32, 0.9, 0, 0.12, 0, top, 8);
    }
    if (type === 'tourist' && Math.random() < 0.6) b.box(0.3, 0.38, 0.14, 0, 0.98, -0.22, pick([0x2a5a8a, 0xc8322a, 0x3a3a3a, 0x5a7a3a]));
    if (opt.carry === 'basket') { b.box(1.4, 0.04, 0.04, 0.0, 1.62, 0, 0x8a6a3a); }
    // cổ + đầu
    b.cyl(0.06, 0.07, 0.12, 0, 1.56, 0, skin, 6);
    b.sphere(0.14, 0, 1.78, 0.01, skin, 8, 6, 1.12);
    // tóc
    if (type !== 'monk') {
      b.sphere(0.15, 0, 1.82, -0.02, hair, 8, 6, 1.0);
      if (female && type !== 'tourist') b.box(0.2, 0.5, 0.06, 0, 1.25, -0.13, hair);
    }
    // mũ
    if (hat === 'non') b.cone(0.38, 0.32, 0, 1.86, 0, 0xe9dcb0, 12);
    else if (hat === 'helmet') { b.sphere(0.19, 0, 1.9, 0, 0x4a5a3a, 8, 5, 0.75); b.cyl(0.24, 0.24, 0.03, 0, 1.86, 0, 0x4a5a3a, 10); }
    else if (hat === 'cap') { b.sphere(0.155, 0, 1.88, 0, pick([0xc8322a, 0x2d6fb0, 0xf2efe6]), 8, 5, 0.6); b.box(0.2, 0.03, 0.15, 0, 1.87, 0.13, 0x333333); }
    else if (hat === 'sun') b.cyl(0.18, 0.3, 0.12, 0, 1.86, 0, 0xe8d8a0, 10);
    else if (hat === 'turban') b.cyl(0.17, 0.16, 0.12, 0, 1.86, 0, 0x3a2a4a, 10);
    else if (hat === 'khandong') b.cyl(0.18, 0.17, 0.14, 0, 1.86, 0, 0xd8a83a, 10);
  });
  body.castShadow = true;
  root.add(body);

  const mkLeg = (side) => {
    const m = part((b) => {
      b.cyl(0.07, 0.065, 0.78, 0, -0.8, 0, pants, 6);
      b.box(0.11, 0.07, 0.2, 0, -0.84, 0.04, type === 'monk' ? 0x6a4a2a : 0x2a2420);
    });
    m.position.set(side * 0.09, 0.82, 0);
    m.castShadow = true;
    root.add(m);
    return m;
  };
  const mkArm = (side) => {
    const m = part((b) => {
      b.cyl(0.06, 0.05, 0.6, 0, -0.62, 0, top, 6);
      b.sphere(0.05, 0, -0.66, 0, skin, 5, 4);
    });
    m.position.set(side * 0.24, 1.5, 0);
    m.rotation.z = side * 0.08;
    m.castShadow = true;
    root.add(m);
    return m;
  };
  const legL = mkLeg(-1), legR = mkLeg(1), armL = mkArm(-1), armR = mkArm(1);
  group.scale.setScalar(scale);
  group.traverse((o) => { if (o.isMesh) o.material = mat; });

  return { group, root, legL, legR, armL, armR, type, female, phase: Math.random() * 10 };
}

// ===== Điều khiển NPC =====
export class People {
  constructor(scene, mat, physics) {
    this.scene = scene; this.mat = mat; this.physics = physics;
    this.list = [];
  }

  spawn(opt) {
    const p = makePerson(this.mat, opt);
    const npc = {
      ...p,
      name: opt.name || null,
      id: opt.id || null,
      mode: opt.mode || 'idle',
      path: opt.path || null,
      loop: opt.loop ?? true,
      seg: 0, dir: 1,
      speed: opt.speed || (0.9 + Math.random() * 0.5),
      pos: new THREE.Vector3(opt.x, 0, opt.z),
      face: opt.face ?? Math.random() * Math.PI * 2,
      home: new THREE.Vector3(opt.x, 0, opt.z),
      wanderR: opt.wanderR || 4,
      target: null, wait: Math.random() * 3,
      seated: opt.mode === 'sit',
      lookAtPlayer: opt.lookAtPlayer ?? true,
      gesture: opt.gesture || null,
      y: opt.y ?? null,
      bob: 0,
    };
    if (npc.path) { npc.pos.set(npc.path[0][0], 0, npc.path[0][1]); }
    if (npc.seated) {
      npc.root.position.y = -0.45;
      npc.legL.rotation.x = npc.legR.rotation.x = -1.45;
      npc.armL.rotation.x = npc.armR.rotation.x = -0.6;
    }
    this.scene.add(npc.group);
    this.list.push(npc);
    this._place(npc);
    return npc;
  }

  _place(n) {
    const y = n.y ?? this.physics.groundAt(n.pos.x, n.pos.z, 100).h;
    n.group.position.set(n.pos.x, y, n.pos.z);
    n.group.rotation.y = n.face;
  }

  update(dt, playerPos, t) {
    for (const n of this.list) {
      const dx = playerPos.x - n.pos.x, dz = playerPos.z - n.pos.z;
      const d2 = dx * dx + dz * dz;
      const far = d2 > 170 * 170;
      n.group.visible = !far && !n.hidden;
      if (far) continue;
      let moving = false;
      const near = d2 < 3.2 * 3.2;
      if (n.mode === 'walk' && n.path && !(near && n.lookAtPlayer)) {
        const tgt = n.path[n.seg];
        const tx = tgt[0] - n.pos.x, tz = tgt[1] - n.pos.z;
        const dist = Math.hypot(tx, tz);
        if (dist < 0.3) {
          if (n.loop) n.seg = (n.seg + 1) % n.path.length;
          else {
            if (n.seg + n.dir >= n.path.length || n.seg + n.dir < 0) n.dir *= -1;
            n.seg += n.dir;
          }
        } else {
          const step = Math.min(dist, n.speed * dt);
          n.pos.x += tx / dist * step; n.pos.z += tz / dist * step;
          const want = Math.atan2(tx, tz);
          n.face = lerpAngle(n.face, want, Math.min(1, dt * 6));
          moving = true;
        }
      } else if (n.mode === 'wander' && !(near && n.lookAtPlayer)) {
        if (!n.target) {
          n.wait -= dt;
          if (n.wait <= 0) {
            const a = Math.random() * Math.PI * 2, r = Math.random() * n.wanderR;
            n.target = [n.home.x + Math.cos(a) * r, n.home.z + Math.sin(a) * r];
          }
        } else {
          const tx = n.target[0] - n.pos.x, tz = n.target[1] - n.pos.z;
          const dist = Math.hypot(tx, tz);
          if (dist < 0.3 || this.physics.blocked(n.pos.x + tx / dist * 0.5, n.pos.z + tz / dist * 0.5, (n.y ?? 0) + 0.5)) { n.target = null; n.wait = 2 + Math.random() * 5; }
          else {
            const step = Math.min(dist, n.speed * 0.7 * dt);
            n.pos.x += tx / dist * step; n.pos.z += tz / dist * step;
            n.face = lerpAngle(n.face, Math.atan2(tx, tz), Math.min(1, dt * 5));
            moving = true;
          }
        }
      }
      if (near && n.lookAtPlayer && !moving) n.face = lerpAngle(n.face, Math.atan2(dx, dz), Math.min(1, dt * 4));

      // hoạt ảnh
      n.phase += dt * (moving ? n.speed * 5.2 : 1.5);
      if (!n.seated) {
        const sw = moving ? Math.sin(n.phase) * 0.55 : 0;
        n.legL.rotation.x = sw; n.legR.rotation.x = -sw;
        n.armL.rotation.x = -sw * 0.8; n.armR.rotation.x = sw * 0.8;
        n.root.position.y = moving ? Math.abs(Math.cos(n.phase)) * 0.04 : Math.sin(n.phase) * 0.008;
        if (n.gesture === 'photo' && !moving) { n.armL.rotation.x = n.armR.rotation.x = -1.4; }
        if (n.gesture === 'bend' && !moving) { n.root.rotation.x = 0.6 + Math.sin(t * 0.8 + n.phase) * 0.1; n.armL.rotation.x = n.armR.rotation.x = -0.9; }
        if (n.gesture === 'cook' && !moving) { n.armR.rotation.x = -0.9 + Math.sin(t * 3 + n.phase) * 0.3; }
      } else if (n.gesture === 'eat') {
        n.armR.rotation.x = -1.1 + Math.sin(t * 2.4 + n.phase) * 0.35;
      } else if (n.gesture === 'play') {
        n.armR.rotation.x = -0.9 + Math.sin(t * 6 + n.phase) * 0.15;
        n.armL.rotation.x = -0.8 + Math.sin(t * 4.3 + n.phase) * 0.1;
      } else if (n.gesture === 'sing') {
        n.armR.rotation.x = -0.6 + Math.sin(t * 1.3 + n.phase) * 0.4;
      }
      if (n.attach) {
        // gắn trên thuyền
        const wp = n.attach.localToWorld(n.local.clone());
        n.group.position.copy(wp);
        n.group.rotation.y = n.attach.rotation.y + n.localFace;
        continue;
      }
      this._place(n);
    }
  }

  nearest(pos, maxD = 3, filter = null) {
    let best = null, bd = maxD * maxD;
    for (const n of this.list) {
      if (!n.name || n.hidden || (filter && !filter(n))) continue;
      const d = (n.group.position.x - pos.x) ** 2 + (n.group.position.z - pos.z) ** 2;
      if (d < bd && Math.abs(n.group.position.y - pos.y) < 3) { bd = d; best = n; }
    }
    return best;
  }
}

export function lerpAngle(a, b, t) {
  let d = ((b - a + Math.PI) % (Math.PI * 2));
  if (d < 0) d += Math.PI * 2;
  d -= Math.PI;
  return a + d * t;
}
