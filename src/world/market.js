// Chợ Đông Ba: mặt tiền vàng kem với tháp đồng hồ, các sạp hàng phía trước
import * as THREE from 'three';
import { Builder, archWallGeometry } from './builder.js';
import { P } from './layout.js';
import { COL, lantern, streetLamp, tree } from './props.js';
import { makeSign } from './materials.js';

export function buildMarket(W) {
  const b = new Builder(W.physics);
  const g = new Builder(); g.jitter = 0;
  b.link(g);
  const { x: cx, z: cz } = P.dongBa;
  const W2 = 70, D = 34;
  const front = cz + D / 2; // z = -101

  // thân chợ
  b.box(W2, 7, D, cx, 0, cz, 0xe2cf98);
  b.box(W2 - 0.4, 6.6, 0.1, cx, 0.2, front + 0.02, 0x2e261e);
  b.solid(W2, 9, D, cx, 0, cz);
  // mái răng cưa
  for (let i = 0; i < 5; i++) b.gable(D + 1, 14.4, 3.2, cx - W2 / 2 + 7 + i * 14, 7, cz, 0x9a4a30, Math.PI / 2);
  // mặt tiền có cửa vòm
  const arches = [];
  for (let i = 0; i < 11; i++) { const ax = -W2 / 2 + 4 + i * ((W2 - 8) / 10); if (Math.abs(ax) > 7) arches.push({ x: ax, w: 3.2, h: 4.6 }); }
  const fa = archWallGeometry(W2, 7.6, 0.8, arches);
  b.geo(fa, 0xead9a6, cx, 0, front + 0.45); fa.dispose();
  b.box(W2 + 0.6, 0.5, 1.2, cx, 7.4, front + 0.4, 0xf3ead2);
  b.box(W2 + 0.4, 0.4, 1.0, cx, 3.6, front + 0.5, 0xf3ead2);
  // các đầu hồi tam giác trên mặt tiền
  for (let i = 0; i < 6; i++) {
    const gx = cx - W2 / 2 + 6 + i * ((W2 - 12) / 5);
    if (Math.abs(gx - cx) < 8) continue;
    b.gable(7, 0.6, 2.4, gx, 7.6, front + 0.5, 0xead9a6);
    b.box(7.2, 0.3, 0.8, gx, 7.6, front + 0.6, 0xf3ead2);
  }
  // tháp đồng hồ trung tâm
  b.box(14, 10.5, 4, cx, 0, front + 1.6, 0xead9a6);
  b.box(14.6, 0.5, 4.6, cx, 10.5, front + 1.6, 0xf3ead2);
  b.box(9, 2.6, 3.4, cx, 11, front + 1.6, 0xead9a6);
  b.box(4.5, 1.8, 3, cx, 13.6, front + 1.6, 0xead9a6);
  b.cone(0.4, 1.2, cx, 15.4, front + 1.6, COL.gold, 6);
  b.solid(14, 15, 4, cx, 0, front + 1.6);
  const door = archWallGeometry(13.6, 5.8, 0.3, [{ x: 0, w: 4.4, h: 5.2 }, { x: -4.4, w: 2.4, h: 4 }, { x: 4.4, w: 2.4, h: 4 }]);
  b.geo(door, 0xf3ead2, cx, 0, front + 3.82); door.dispose();
  b.box(13.4, 5.6, 0.04, cx, 0, front + 3.63, 0x2e261e);
  // đồng hồ
  b.save(); b.translate(cx, 12.3, front + 3.68); b.rotateX(Math.PI / 2);
  b.cyl(1.0, 1.0, 0.12, 0, 0, 0, 0xf8f4e8, 16);
  b.restore();
  g.box(0.08, 0.8, 0.05, cx, 12.3, front + 3.78, 0x111111);
  g.boxR(0.08, 0.6, 0.05, cx + 0.2, 12.5, front + 3.78, 0x111111, 0, 0, -1);
  const s = makeSign('CHỢ ĐÔNG BA', 9, 1.5, { bg: '#f3ead2', fg: '#8a1c14', border: null, font: 'bold 96px "Be Vietnam Pro"' });
  s.position.set(cx, 8.9, front + 3.66);
  W.scene.add(s); W.signs.push(s);

  // ===== Sạp hàng =====
  const kinds = ['fruit', 'veg', 'flower', 'non', 'sweets', 'cloth', 'fish', 'fruit', 'sweets', 'veg', 'flower', 'cloth'];
  const umb = [0x2d6fb0, 0xc8322a, 0x3a8a4a, 0xe8b030, 0x7a3fa0, 0xe86a2a];
  let k = 0;
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 6; i++) {
      const sx = cx - 30 + i * 12 + (row ? 6 : 0), sz = front + 6 + row * 8;
      const kind = kinds[k++ % kinds.length];
      stall(b, g, sx, sz, kind, umb[(i + row * 2) % umb.length]);
      if (kind === 'non' && !W.spots.nonLa) W.spots.nonLa = { x: sx, z: sz - 1.6 };
      W.marketStalls.push({ x: sx, z: sz - 1.8, kind });
    }
  }
  // dây đèn lồng giăng ngang
  for (let i = 0; i < 26; i++) {
    const lx = cx - 32 + i * 2.6;
    lantern(g, lx, 5.3 + Math.sin(i * 0.8) * 0.3, front + 10, [0xd8322a, 0xe8b33a, 0xd84a8a][i % 3], 0.7);
  }
  for (let i = 0; i < 6; i++) W.halos.list.push([cx - 30 + i * 12, 0.1, front + 10, 6]);
  for (const sx of [-38, 38]) streetLamp(b, g, W.halos.list, cx + sx, front + 22, Math.PI);
  for (const sx of [-44, 44]) tree(b, cx + sx, front + 6, 'phuong');

  W.scene.add(b.build(W.mats.main, { chunk: 80 }));
  W.scene.add(g.build(W.mats.glow, { cast: false, receive: false, chunk: 80 }));
}

export function stall(b, g, x, z, kind, umbColor, ry = 0) {
  b.save(); b.translate(x, 0, z); b.rotateY(ry);
  // bàn
  b.box(3.2, 0.8, 1.6, 0, 0, 0, 0x7a5a3a);
  b.box(3.4, 0.08, 1.8, 0, 0.8, 0, 0x8a6a48);
  // dù/ ô che
  b.cyl(0.05, 0.05, 2.6, 1.2, 0, 0.6, 0x666666, 5);
  b.cone(2.4, 0.8, 1.2, 2.5, 0.6, umbColor, 8);
  const r = Math.random;
  const Y = 0.88;
  switch (kind) {
    case 'non':
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) b.cone(0.38, 0.32, -1.1 + i * 0.75, Y + j * 0.08, -0.2, 0xe9dcb0, 10);
      for (let i = 0; i < 3; i++) b.cone(0.38, 0.32, -1 + i * 0.9, Y, 0.45, 0xe9dcb0, 10);
      // nón treo
      for (let i = 0; i < 4; i++) { b.save(); b.translate(-1.2 + i * 0.8, 1.9, -0.8); b.rotateX(-1.3); b.cone(0.38, 0.32, 0, 0, 0, 0xefe3bc, 10); b.restore(); }
      break;
    case 'fruit':
      for (let i = 0; i < 18; i++) b.sphere(0.13 + r() * 0.05, -1.3 + (i % 6) * 0.5, Y + 0.15 + Math.floor(i / 12) * 0.2, -0.5 + Math.floor(i / 6) % 2 * 0.5, [0xf09a2a, 0xd8445a, 0x8ac040, 0xf0d040][Math.floor(i / 3) % 4], 5, 4);
      for (let i = 0; i < 3; i++) b.boxR(0.6, 0.1, 0.2, -0.8 + i * 0.7, Y + 0.1, 0.5, 0xf0d040, 0, r(), 0.3);
      break;
    case 'veg':
      for (let i = 0; i < 6; i++) b.cyl(0.3, 0.32, 0.12, -1.2 + i * 0.48, Y, 0, 0xa07a4a, 8);
      for (let i = 0; i < 6; i++) b.ico(0.25, -1.2 + i * 0.48, Y + 0.25, 0, [0x4a9a3a, 0x7ac04a, 0x3a7a2a][i % 3], 0, 1, 0.8, 1);
      break;
    case 'flower':
      for (let i = 0; i < 14; i++) b.ico(0.16, -1.3 + (i % 7) * 0.42, Y + 0.3 + r() * 0.2, -0.3 + Math.floor(i / 7) * 0.6, [0xe84a6a, 0xf0e040, 0xffffff, 0xd86ad8, 0xff8a3a][i % 5], 0);
      break;
    case 'sweets':
      for (let i = 0; i < 10; i++) b.box(0.4, 0.2, 0.25, -1.2 + (i % 5) * 0.55, Y + Math.floor(i / 5) * 0.21, 0, i % 2 ? 0xc8322a : 0xe8b030);
      break;
    case 'cloth':
      for (let i = 0; i < 8; i++) b.box(0.6, 0.12, 0.5, -1.1 + (i % 4) * 0.72, Y + Math.floor(i / 4) * 0.13, 0, [0x6a3d9a, 0xe8e0d0, 0x2d6fb0, 0xd8445a][i % 4]);
      for (let i = 0; i < 3; i++) b.box(0.7, 1.6, 0.04, -1 + i * 1, 0.6, -0.9, [0x6a3d9a, 0xd8445a, 0xf0f0f0][i]);
      break;
    case 'fish':
      for (let i = 0; i < 3; i++) b.cyl(0.45, 0.45, 0.06, -1 + i, Y, 0, 0x6a6a6a, 10);
      for (let i = 0; i < 9; i++) b.boxR(0.4, 0.07, 0.12, -1 + (i % 3) + (r() - 0.5) * 0.3, Y + 0.08, (Math.floor(i / 3) - 1) * 0.18, 0xc0c8cc, 0, r() * 3, 0);
      break;
  }
  b.restore();
  b.solid(3.4, 1.2, 1.8, x, 0, z, ry);
}
