// Mô hình người có khung xương (SkinnedMesh): tay chân có khớp, có mặt, tóc, nón, phụ kiện.
// Mỗi khối hình học gắn cứng vào một xương; tư thế được đặt bằng các "kênh" góc xoay.
import * as THREE from 'three';
import { Builder } from './builder.js';

const SKIN = [0xe0b48e, 0xd8a47a, 0xc89070, 0xe8c09a];
const AODAI = [0x6a3d9a, 0xf2efe6, 0x8a4ac0, 0xd84a6a, 0x2d6fb0, 0xe8b030, 0x3a8a6a, 0xc8322a, 0x5a2a80, 0xf0c8d8];
const SHIRT = [0xf2efe6, 0x2d6fb0, 0x5a7a5a, 0xc8322a, 0x3a3a3a, 0xe8d8a8, 0x6a8ab0, 0xd8a050];
const TEE = [0xe85a4a, 0x3a9ad8, 0xf2c230, 0x4ab07a, 0xf2efe6, 0xe87ab0, 0x2a2a30];
const PANTS = [0x2a2a30, 0x3a3a48, 0x5a4a3a, 0x2a3a5a, 0x4a4a40];
const BABA = [0x5a3a2a, 0x4a2a5a, 0x2a4a3a, 0x3a3a4a, 0x6a4a3a];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// Thứ tự xương
export const BN = { hips: 0, spine: 1, head: 2, armL: 3, foreL: 4, armR: 5, foreR: 6, legL: 7, shinL: 8, legR: 9, shinR: 10, flapF: 11, flapB: 12 };
// Kênh tư thế
export const CH = {
  HY: 0, HRX: 1, HRZ: 2, SPX: 3, SPY: 4, SPZ: 5, HDX: 6, HDY: 7,
  ALX: 8, ALZ: 9, FLX: 10, ARX: 11, ARZ: 12, FRX: 13, FRZ: 14,
  LLX: 15, SLX: 16, LRX: 17, SRX: 18, FFX: 19, FBX: 20, N: 21,
};

export function makePerson(mat, opt = {}) {
  const type = opt.type || pick(['aodai', 'aodai', 'man', 'man', 'tourist', 'vendor', 'elder']);
  const female = opt.female ?? (type === 'aodai' || type === 'vendor' || type === 'singer' || type === 'student' || (type === 'elder' && Math.random() < 0.6) || ((type === 'tourist' || type === 'kid') && Math.random() < 0.5));
  const skin = opt.skin ?? pick(SKIN);
  const longDress = type === 'aodai' || type === 'singer' || type === 'student' || (type === 'elder' && !female);
  const top = opt.top ?? (type === 'student' ? 0xf4f2ec : type === 'aodai' || type === 'singer' ? pick(AODAI) : type === 'monk' ? 0xb8742a : type === 'elder' ? (female ? pick(BABA) : pick([0x3a2a4a, 0x2a2a3a, 0x4a2a2a]))
    : type === 'vendor' ? pick(BABA) : type === 'tourist' || type === 'kid' ? pick(TEE) : type === 'worker' ? 0xe8742a : pick(SHIRT));
  const pants = opt.pants ?? (type === 'student' ? 0xf4f2ec : type === 'aodai' || type === 'singer' ? pick([0xf2efe6, 0xf2efe6, 0x1a1a1a]) : type === 'monk' ? 0x8a5a2a : type === 'tourist' ? pick([0xc8b890, 0x3a5a7a, 0x2a2a2a])
    : type === 'vendor' || type === 'elder' ? 0x1e1e22 : type === 'worker' ? 0x3a4a5a : pick(PANTS));
  const hat = opt.hat ?? (type === 'vendor' || type === 'student' || (type === 'aodai' && Math.random() < 0.55) ? 'non' : type === 'tourist' ? pick(['cap', 'none', 'sun'])
    : type === 'man' ? pick(['none', 'none', 'none', 'cap']) : type === 'elder' ? (female ? 'none' : 'turban') : type === 'singer' ? 'khandong' : type === 'worker' ? 'cap' : 'none');
  const blond = type === 'tourist' && Math.random() < 0.45;
  const hair = type === 'elder' ? pick([0x8a8a88, 0x5a5a58, 0xb8b8b4]) : blond ? pick([0x8a6a3a, 0xc8a060, 0x6a4a2a]) : 0x16110d;
  const shortSleeve = type === 'man' || type === 'tourist' || type === 'kid' || type === 'worker';
  const shorts = (type === 'tourist' && Math.random() < 0.6) || type === 'kid';
  const scale = opt.scale ?? (type === 'kid' ? 0.66 : (female ? 0.9 : 0.96) + Math.random() * 0.08);
  const shoe = type === 'monk' ? 0x6a4a2a : type === 'tourist' || type === 'kid' ? 0xeeeeea : longDress ? pick([0x1a1a1a, 0xf2efe6]) : 0x2a2420;

  const b = new Builder();
  b.jitter = 0; b.shade = 0;
  const sh = female ? 0.185 : 0.21; // nửa bề ngang vai
  // ----- chân
  for (const [side, leg, shin] of [[-1, BN.legL, BN.shinL], [1, BN.legR, BN.shinR]]) {
    const x = side * 0.09;
    b.bone = leg;
    b.cyl(0.084, 0.064, 0.44, x, 0.47, 0, pants, 8);
    b.sphere(0.064, x, 0.48, 0, shorts ? skin : pants, 8, 6);
    b.bone = shin;
    b.cyl(0.06, 0.046, 0.4, x, 0.08, 0, shorts ? skin : pants, 8);
    b.box(0.095, 0.075, 0.24, x, 0, 0.045, shoe);
  }
  // ----- hông, thân
  b.bone = BN.hips;
  b.sphere(0.16, 0, 0.95, 0, longDress || type === 'monk' ? top : pants, 10, 6, 0.72);
  if (type === 'monk') b.cyl(0.165, 0.27, 0.9, 0, 0.06, 0, top, 10);
  b.bone = BN.spine;
  const cw = female ? 0.15 : 0.17, ww = female ? 0.125 : 0.145;
  b.cyl(cw, ww, 0.4, 0, 1.02, 0, top, 10);
  b.sphere(cw, 0, 1.405, 0, top, 10, 6, 0.42);
  for (const s of [-1, 1]) b.sphere(0.072, s * sh, 1.405, 0, top, 8, 6);
  b.cyl(0.046, 0.052, 0.1, 0, 1.43, 0, longDress ? top : skin, 8);
  if (type === 'worker') { b.box(0.36, 0.05, 0.02, 0, 1.2, cw * 0.98, 0xf0f0c0); b.box(0.36, 0.05, 0.02, 0, 1.2, -cw * 0.98, 0xf0f0c0); }
  if (type === 'monk') b.boxR(0.5, 0.11, 0.36, 0, 1.25, 0, 0x8a4a1a, 0, 0, 0.75);
  if ((type === 'tourist' && Math.random() < 0.6) || opt.carry === 'backpack') { b.box(0.27, 0.34, 0.13, 0, 1.03, -0.21, pick([0x2a5a8a, 0xc8322a, 0x3a3a3a, 0x5a7a3a])); for (const s of [-1, 1]) b.box(0.04, 0.3, 0.3, s * 0.13, 1.12, -0.04, 0x2a2a2a); }
  // ----- vạt áo dài (đung đưa khi bước)
  if (longDress) {
    b.bone = BN.flapF; b.box(0.27, 0.74, 0.022, 0, 0.26, 0.105, top);
    b.bone = BN.flapB; b.box(0.28, 0.76, 0.022, 0, 0.24, -0.105, top);
  }
  // ----- tay
  for (const [side, arm, fore] of [[-1, BN.armL, BN.foreL], [1, BN.armR, BN.foreR]]) {
    const x = side * (sh + 0.012);
    b.bone = arm;
    b.cyl(0.05, 0.042, 0.27, x, 1.15, 0, top, 8);
    b.sphere(0.043, x, 1.15, 0, shortSleeve ? skin : top, 7, 5);
    b.bone = fore;
    b.cyl(0.04, 0.032, 0.24, x, 0.91, 0, shortSleeve ? skin : top, 8);
    b.sphere(0.04, x, 0.885, 0, skin, 7, 5, 1.25);
  }
  // ----- đầu, mặt, tóc
  b.bone = BN.head;
  b.sphere(0.108, 0, 1.62, 0.005, skin, 12, 9, 1.15);
  for (const s of [-1, 1]) {
    b.sphere(0.013, s * 0.038, 1.636, 0.099, 0x1a1410, 6, 4);
    b.box(0.036, 0.007, 0.01, s * 0.038, 1.66, 0.098, hair);
    b.sphere(0.021, s * 0.106, 1.62, 0, skin, 5, 4);
  }
  b.sphere(0.015, 0, 1.612, 0.108, skin, 6, 4);
  b.box(0.036, 0.008, 0.008, 0, 1.573, 0.097, 0x9a4a42);
  if (type !== 'monk') {
    const cap = new THREE.SphereGeometry(0.115, 12, 7, 0, Math.PI * 2, 0, Math.PI * 0.56);
    cap.scale(1, 1.14, 1); cap.rotateX(-0.42);
    b.geo(cap, hair, 0, 1.628, -0.006, 0, 1, true); cap.dispose();
    if (female && type !== 'kid') {
      if (type === 'elder' || type === 'vendor') b.sphere(0.052, 0, 1.64, -0.115, hair, 7, 5);
      else b.cyl(0.075, 0.1, 0.3, 0, 1.3, -0.085, hair, 8);
    }
  }
  if (hat === 'non') { b.cone(0.37, 0.2, 0, 1.69, 0, 0xe9dcb0, 14); b.box(0.012, 0.16, 0.012, -0.1, 1.56, 0.03, 0xd8c8f0); b.box(0.012, 0.16, 0.012, 0.1, 1.56, 0.03, 0xd8c8f0); }
  else if (hat === 'helmet') { const h = new THREE.SphereGeometry(0.128, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2); b.geo(h, pick([0x4a5a3a, 0xc8322a, 0x2d6fb0, 0xf2efe6, 0x2a2a2a]), 0, 1.655, 0, 0, 1, true); h.dispose(); b.box(0.2, 0.014, 0.1, 0, 1.66, 0.12, 0x222222); }
  else if (hat === 'cap') { const h = new THREE.SphereGeometry(0.119, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2); const c = type === 'worker' ? 0xe8742a : pick([0xc8322a, 0x2d6fb0, 0xf2efe6, 0x3a3a3a]); b.geo(h, c, 0, 1.672, 0, 0, 1, true); h.dispose(); b.box(0.16, 0.012, 0.11, 0, 1.676, 0.14, c); }
  else if (hat === 'sun') { b.cyl(0.118, 0.122, 0.08, 0, 1.69, 0, 0xe8d8a0, 12); b.cyl(0.25, 0.26, 0.012, 0, 1.688, 0, 0xe8d8a0, 14); }
  else if (hat === 'turban') b.cyl(0.128, 0.124, 0.075, 0, 1.675, 0, 0x2a2238, 12);
  else if (hat === 'khandong') b.cyl(0.132, 0.126, 0.085, 0, 1.672, 0, opt.top === 0xd8a83a ? 0x8a2a5a : 0xd8a83a, 12);
  // ----- đồ mang theo
  if (opt.carry === 'pole') { // quang gánh trên vai
    b.bone = BN.spine;
    b.box(0.036, 0.03, 1.56, sh - 0.02, 1.475, 0, 0xb89a5a);
    for (const sz of [-1, 1]) {
      for (const sx of [-0.13, 0.13]) b.boxR(0.008, 0.72, 0.008, sh - 0.02 + sx * 0.5, 1.12, sz * 0.72, 0x6a5a3a, 0, 0, sx * 1.4);
      b.cyl(0.21, 0.16, 0.14, sh - 0.02, 0.66, sz * 0.72, 0xc8a868, 10);
      const goods = opt.goods || [0xf2efe6, 0x8ac040, 0xf09a2a];
      for (let i = 0; i < 5; i++) b.sphere(0.055, sh - 0.02 + Math.cos(i * 1.26) * 0.1, 0.83, sz * 0.72 + Math.sin(i * 1.26) * 0.1, goods[(i + (sz > 0 ? 1 : 0)) % goods.length], 6, 4);
    }
  } else if (opt.carry === 'broom') { // chổi tre
    b.bone = BN.foreR;
    b.boxR(0.026, 1.25, 0.026, sh + 0.012, 0.5, 0.2, 0x8a6a3a, 0.45, 0, 0);
    b.boxR(0.3, 0.26, 0.07, sh + 0.012, 0.06, 0.48, 0xb89a4a, 0.45, 0, 0);
  } else if (opt.carry === 'camera') {
    b.bone = BN.foreR; b.box(0.13, 0.085, 0.07, sh + 0.012, 0.83, 0.05, 0x1e1e22); b.cyl(0.035, 0.035, 0.05, sh + 0.012, 0.85, 0.09, 0x2a2a30, 8);
  } else if (opt.carry === 'phone') {
    b.bone = BN.foreR; b.box(0.07, 0.13, 0.012, sh + 0.012, 0.8, 0.045, 0x1a1a1e);
  }

  const mesh = b.build(mat, { skin: true });
  // khung xương ở tư thế nghỉ
  const mk = (x, y, z, parent) => { const bone = new THREE.Bone(); bone.position.set(x, y, z); if (parent) parent.add(bone); return bone; };
  const hips = mk(0, 0.92, 0);
  const spine = mk(0, 0.1, 0, hips), head = mk(0, 0.48, 0, spine);
  const armL = mk(-sh, 0.4, 0, spine), foreL = mk(-0.012, -0.27, 0, armL);
  const armR = mk(sh, 0.4, 0, spine), foreR = mk(0.012, -0.27, 0, armR);
  const legL = mk(-0.09, -0.01, 0, hips), shinL = mk(0, -0.43, 0, legL);
  const legR = mk(0.09, -0.01, 0, hips), shinR = mk(0, -0.43, 0, legR);
  const flapF = mk(0, 0.08, 0.1, hips), flapB = mk(0, 0.08, -0.1, hips);
  const bones = [hips, spine, head, armL, foreL, armR, foreR, legL, shinL, legR, shinR, flapF, flapB];
  mesh.add(hips);
  mesh.bind(new THREE.Skeleton(bones));
  mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.9, 0), 1.5);

  const group = new THREE.Group();
  const root = new THREE.Group(); // nâng/hạ khi ngồi, lên xe
  root.add(mesh);
  group.add(root);
  group.scale.setScalar(scale);
  return {
    group, root, mesh, bones, hips, spine, head, armL, foreL, armR, foreR, legL, shinL, legR, shinR, flapF, flapB,
    type, female, hat, carry: opt.carry || null, scale, height: 1.75 * scale,
    phase: Math.random() * 10, cur: new Float32Array(CH.N),
  };
}

// Áp các kênh tư thế lên xương. k = 1: đặt ngay; k < 1: tiến dần tới (làm mượt chuyển động)
export function applyPose(p, tgt, k = 1) {
  const c = p.cur;
  for (let i = 0; i < CH.N; i++) c[i] += (tgt[i] - c[i]) * k;
  p.hips.position.y = 0.92 + c[CH.HY]; p.hips.rotation.set(c[CH.HRX], 0, c[CH.HRZ]);
  p.spine.rotation.set(c[CH.SPX], c[CH.SPY], c[CH.SPZ]);
  p.head.rotation.set(c[CH.HDX], c[CH.HDY], 0);
  p.armL.rotation.set(c[CH.ALX], 0, c[CH.ALZ]); p.foreL.rotation.x = c[CH.FLX];
  p.armR.rotation.set(c[CH.ARX], 0, c[CH.ARZ]); p.foreR.rotation.set(c[CH.FRX], 0, c[CH.FRZ]);
  p.legL.rotation.x = c[CH.LLX]; p.shinL.rotation.x = c[CH.SLX];
  p.legR.rotation.x = c[CH.LRX]; p.shinR.rotation.x = c[CH.SRX];
  p.flapF.rotation.x = c[CH.FFX]; p.flapB.rotation.x = c[CH.FBX];
}

const _t = new Float32Array(CH.N);
// Tư thế tĩnh dùng cho người ngồi xe, chèo đò
export function staticPose(p, name) {
  _t.fill(0);
  if (name === 'ride' || name === 'sit') {
    _t[CH.LLX] = _t[CH.LRX] = -1.35; _t[CH.SLX] = _t[CH.SRX] = name === 'sit' ? 1.45 : 1.1;
    _t[CH.ALX] = _t[CH.ARX] = name === 'sit' ? -0.5 : -1.0; _t[CH.FLX] = _t[CH.FRX] = -0.45;
    if (name === 'ride') { _t[CH.SPX] = 0.12; _t[CH.HDX] = -0.1; }
  } else if (name === 'row') {
    _t[CH.ALX] = _t[CH.ARX] = -0.9; _t[CH.FLX] = _t[CH.FRX] = -0.5; _t[CH.SPX] = 0.1;
  }
  applyPose(p, _t, 1);
}
