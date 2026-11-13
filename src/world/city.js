// Thành phố: bờ kè sông Hương, phố Lê Lợi, Ga Huế, phố ẩm thực, khách sạn, tiệm áo dài, bến thuyền, nhà phố, ruộng lúa
import * as THREE from 'three';
import { Builder } from './builder.js';
import { ROADS, P, RIVER, WORLD, CITADEL } from './layout.js';
import { terrainHeight } from './terrain.js';
import { COL, tree, streetLamp, lantern, bench, railing, stairs } from './props.js';
import { makeSign } from './materials.js';
import { pier } from './pagoda.js';
import { stall } from './market.js';
import { shopHouse, powerLine, crosswalk, SIGNS } from './street.js';

const SIGN_COLORS = [0xc8322a, 0x2d6fb0, 0xe8b030, 0x3a8a4a, 0x7a3fa0, 0xe86a2a, 0x1a1a1a];

export function buildCity(W) {
  const b = new Builder(W.physics);
  const g = new Builder(); g.jitter = 0;
  const win = new Builder(); win.jitter = 0;
  b.link(g, win);
  const reserved = [];
  const res = (x0, z0, x1, z1) => reserved.push([Math.min(x0, x1), Math.min(z0, z1), Math.max(x0, x1), Math.max(z0, z1)]);

  // ===== Bờ kè & lan can sông =====
  W.riverGaps.push([P.dock.x - 2.6, P.dock.x + 2.6, 1]);
  const gaps = W.riverGaps;
  for (const s of [-1, 1]) {
    b.box(WORLD.maxX - WORLD.minX + 300, 2.6, 3, (WORLD.maxX + WORLD.minX) / 2, -2.3, s * 42.6, 0x8d877a);
    b.box(WORLD.maxX - WORLD.minX + 300, 0.3, 1.0, (WORLD.maxX + WORLD.minX) / 2, 0, s * 43.7, 0xa39d8e);
    // lan can có chừa lối xuống bến
    const cuts = gaps.filter(gp => gp[2] === s).map(gp => [gp[0], gp[1]]).sort((a, c) => a[0] - c[0]);
    let start = WORLD.minX - 20;
    for (const [ga, gb] of [...cuts, [WORLD.maxX + 20, WORLD.maxX + 20]]) {
      if (ga - start > 0.5) railing(b, start, s * 44.1, ga, s * 44.1, 0.3, 0x9aa0a0, 0.9, true, 3);
      start = gb;
    }
    // lối đi dạo
    b.box(WORLD.maxX - WORLD.minX + 40, 0.06, 4, (WORLD.maxX + WORLD.minX) / 2, -0.02, s * 50, 0xc2b8a2);
    for (let x = WORLD.minX + 6; x < WORLD.maxX; x += 13) {
      if (Math.abs(x - P.bridge.x) < 10 || Math.abs(x - P.dock.x) < 8 || Math.abs(x - P.tmPier.x) < 8) continue;
      if (s < 0 && x > -360 && x < -320) continue;
      const t = Math.floor((x + 1000) / 13) % 3;
      tree(b, x, s * 56, t === 0 ? 'phuong' : t === 1 ? 'bang' : 'round', 0.9 + Math.random() * 0.3);
      if (Math.floor((x + 1000) / 13) % 2 === 0) streetLamp(b, g, W.halos.list, x + 6.5, s * 46.5, s > 0 ? Math.PI : 0);
      else { bench(b, x + 6.5, s * 53, s > 0 ? Math.PI : 0); W.benches.push({ x: x + 6.5, z: s * 53, ry: s > 0 ? Math.PI : 0 }); }
    }
  }

  // ===== Ga Huế =====
  {
    const x = P.ga.x, z = P.ga.z;
    res(x - 40, 236, x + 40, 300);
    b.box(70, 0.3, 6, x, -0.05, 238, 0xb8b0a0); // sân ga
    // khối giữa có tháp
    b.box(14, 9, 14, x, 0, z, 0xeedcae);
    b.box(14.4, 0.5, 14.4, x, 9, z, 0xf6efe0);
    b.box(8, 4, 8, x, 9.5, z, 0xeedcae);
    b.roof(10.5, 10.5, 5, x, 13.4, z, 0x7a3a2a, 0, 0.3);
    b.cone(0.3, 2, x, 18.2, z, 0x7a3a2a, 6);
    // đồng hồ
    b.save(); b.translate(x, 11.5, z - 4.05); b.rotateX(Math.PI / 2); b.cyl(1, 1, 0.1, 0, 0, 0, 0xf8f4e8, 16); b.restore();
    b.box(0.08, 0.8, 0.05, x, 11.5, z - 4.15, 0x222222);
    // cánh hai bên
    for (const s of [-1, 1]) {
      b.box(22, 6, 11, x + s * 18, 0, z + 1, 0xeedcae);
      b.box(22.4, 0.4, 11.4, x + s * 18, 6, z + 1, 0xf6efe0);
      b.roof(24, 13, 3.4, x + s * 18, 6.3, z + 1, 0x8a3e2c, 0, 0.3);
      for (let i = 0; i < 5; i++) {
        b.box(2, 3.2, 0.1, x + s * (10 + i * 4), 0.6, z - 4.55, 0x3a4a52);
        b.box(2.4, 0.4, 0.2, x + s * (10 + i * 4), 3.8, z - 4.55, 0xf6efe0);
        if (Math.random() > 0.3) win.box(1.8, 3, 0.04, x + s * (10 + i * 4), 0.7, z - 4.62, 0xffd59a);
      }
    }
    b.solid(58, 10, 12, x, 0, z + 1);
    // cửa chính
    b.box(5, 5, 0.1, x, 0, z - 7.03, 0x3a3026);
    b.box(10, 0.6, 3, x, 5, z - 8, 0xf6efe0); // mái hiên
    for (const s of [-1, 1]) b.cyl(0.25, 0.25, 5, x + s * 4.6, 0, z - 9.2, 0xf6efe0, 8);
    win.box(4.6, 4.6, 0.04, x, 0.1, z - 7.08, 0xffe0a8);
    const s = makeSign('GA HUẾ', 7, 1.4, { bg: '#f6efe0', fg: '#7a1a14', border: null, font: 'bold 100px "Be Vietnam Pro"' });
    s.position.set(x, 7.2, z - 7.06);
    s.rotation.y = Math.PI;
    W.scene.add(s); W.signs.push(s);
    // sân ga + đoàn tàu Thống Nhất
    b.box(150, 0.8, 8, x + 10, 0, 272, 0xa8a090);
    b.floor(150, 8, x + 10, 272, 0.8);
    res(-130, 266, 75, 290);
    for (const rz of [282, 286]) {
      b.box(220, 0.15, 0.2, x + 20, 0.1, rz - 0.75, 0x5a5a5a);
      b.box(220, 0.15, 0.2, x + 20, 0.1, rz + 0.75, 0x5a5a5a);
      for (let i = -100; i < 120; i += 1.5) b.box(0.4, 0.1, 2.4, x + 20 + i, 0, rz, 0x4a3a2a);
    }
    for (let i = 0; i < 6; i++) {
      const tx = x - 50 + i * 21;
      b.box(20, 3.2, 3, tx, 0.8, 282, i === 0 ? 0x2c4a7a : 0x2b4f86);
      b.box(20.2, 0.5, 3.2, tx, 4, 282, 0x5a6a7a);
      b.box(20.1, 0.35, 3.1, tx, 2.2, 282, 0xf0f0f0);
      for (let k = 0; k < 7; k++) { b.box(1.4, 0.9, 3.12, tx - 8 + k * 2.6, 2.6, 282, 0xb8d0e0); win.box(1.3, 0.8, 3.14, tx - 8 + k * 2.6, 2.65, 282, 0xffe6b0); }
      b.solid(20, 4.5, 3, tx, 0, 282);
    }
    for (let i = 0; i < 6; i++) { b.cyl(0.15, 0.15, 3.5, x - 40 + i * 16, 0.8, 268.5, 0x3a3a3a, 6); }
    b.box(100, 0.2, 4, x + 10, 4.3, 270, 0x7a3a2a);
    // xích lô đợi khách
    for (let i = 0; i < 4; i++) cyclo(b, x - 26 + i * 4.2, 233.5 - (i % 2) * 0.3, Math.PI / 2 * (i % 2 ? 1 : -1) + Math.PI / 2);
    W.spots.cyclo = { x: x - 20, z: 236 };
    for (const sx of [-30, 30]) tree(b, x + sx, 240, 'palm');
  }

  // ===== Phố ẩm thực =====
  {
    res(4, 118, 88, 146);
    const pz = 133;
    b.box(84, 0.08, 26, 46, -0.02, pz, 0xa8a290);
    const shops = [
      ['bunbo', 'BÚN BÒ HUẾ O HOA', 0xc8322a, '#c8322a'],
      ['comhen', 'CƠM HẾN CHÚ BA', 0x2d6fb0, '#1f4f80'],
      ['banhbeo', 'BÁNH BÈO MỆ TÁM', 0x3a8a4a, '#2a6a3a'],
      ['che', 'CHÈ HUẾ O LÀI', 0x7a3fa0, '#5a2a80'],
    ];
    W.spots.food = {};
    shops.forEach(([key, name, col, css], i) => {
      const sx = 16 + i * 20, sz = 124;
      // quầy
      b.box(6, 1.0, 2.2, sx, 0, sz, 0x8a6a48);
      b.box(6.4, 0.1, 2.6, sx, 1.0, sz, 0xd8d0c0);
      b.solid(6.4, 1.4, 2.6, sx, 0, sz);
      // mái bạt
      b.boxR(7.5, 0.1, 4.2, sx, 3.2, sz + 0.6, col, -0.18, 0, 0);
      for (const ox of [-3.4, 3.4]) { b.cyl(0.06, 0.06, 3.4, sx + ox, 0, sz + 2.4, 0x555555, 5); b.cyl(0.06, 0.06, 3.6, sx + ox, 0, sz - 1.2, 0x555555, 5); }
      // nồi nước dùng
      b.cyl(0.6, 0.55, 0.9, sx - 1.8, 1.05, sz - 0.2, 0xb8b8b8, 10);
      b.cyl(0.62, 0.62, 0.05, sx - 1.8, 1.95, sz - 0.2, 0x8a8a8a, 10);
      W.steam.push([sx - 1.8, 2.1, sz - 0.2]);
      // đồ ăn bày quầy
      for (let k = 0; k < 5; k++) b.cyl(0.18, 0.13, 0.12, sx - 0.4 + k * 0.45, 1.05, sz + 0.5, 0xf2efe6, 8);
      // bàn ghế nhựa
      for (let t = 0; t < 2; t++) {
        const tx = sx - 1.6 + t * 3.2, tz = sz + 6 + (i % 2) * 0.6;
        b.cyl(0.55, 0.55, 0.06, tx, 0.6, tz, t % 2 ? 0x2d6fb0 : 0xc8322a, 10);
        b.cyl(0.05, 0.05, 0.6, tx, 0, tz, 0x666666, 5);
        for (let c = 0; c < 4; c++) {
          const a = c * Math.PI / 2 + 0.4;
          b.cyl(0.18, 0.2, 0.32, tx + Math.cos(a) * 0.85, 0, tz + Math.sin(a) * 0.85, [0xc8322a, 0x2d6fb0, 0x3a8a4a][c % 3], 8);
        }
        b.circleSolid(0.6, 1, tx, 0, tz);
        W.seats.push({ x: tx + Math.cos(0.4 + Math.PI) * 0.85, z: tz + Math.sin(0.4 + Math.PI) * 0.85, face: Math.atan2(tx - (tx + Math.cos(0.4 + Math.PI) * 0.85), tz - (tz + Math.sin(0.4 + Math.PI) * 0.85)) });
      }
      // đèn lồng
      for (let k = 0; k < 3; k++) lantern(g, sx - 2.2 + k * 2.2, 2.6, sz + 2.2, [0xd8322a, 0xe8b33a, 0xd8322a][k], 0.75);
      W.halos.list.push([sx, 0.08, sz + 3.5, 7]);
      const s = makeSign(name, 6.2, 1.0, { bg: css, fg: '#fff3c4', border: '#f0d27a' });
      s.position.set(sx, 3.75, sz + 2.75); s.rotation.x = -0.18;
      W.scene.add(s); W.signs.push(s);
      W.spots.food[key] = { x: sx, z: sz + 2.2, vendor: { x: sx + 1.2, z: sz - 1.45 } };
    });
    // dây đèn giăng
    for (let i = 0; i < 30; i++) lantern(g, 8 + i * 2.6, 5 + Math.sin(i * 0.7) * 0.25, 138, [0xd8322a, 0xe8b33a, 0xe85a8a, 0x8a5ad8][i % 4], 0.6);
    for (const x of [8, 84]) { b.cyl(0.1, 0.12, 5.9, x, 0, 138, 0x3a3a3a, 6); }
    b.box(76, 0.05, 0.05, 46, 5.62, 138, 0x2a2a2a);
    tree(b, 4, 128, 'phuong'); tree(b, 88, 128, 'phuong');
  }

  // ===== Khách sạn Hương Giang =====
  {
    const { x, z } = P.hotel; // mặt tiền hướng ra sông (z nhỏ)
    res(x - 18, 78, x + 18, 112);
    const H = 19;
    b.box(30, H, 16, x, 0, z + 8, 0xf2ece0);
    b.solid(30, H + 2, 16, x, 0, z + 8);
    for (let f = 1; f < 6; f++) for (let i = 0; i < 8; i++) {
      const wx = x - 12.25 + i * 3.5, wy = f * 3.3;
      b.box(2.2, 2, 0.1, wx, wy, z - 0.02, 0x3a5060);
      b.box(3, 0.15, 0.9, wx, wy - 0.1, z - 0.4, 0xd8d0c0);
      if (Math.random() > 0.4) win.box(2.0, 1.8, 0.04, wx, wy + 0.1, z - 0.08, 0xffd59a);
    }
    b.box(32, 0.6, 18, x, H, z + 8, 0xc8b898);
    b.box(12, 0.3, 4, x, 3.2, z - 2, 0x7a1a14); // mái sảnh
    for (const s of [-1, 1]) b.cyl(0.15, 0.15, 3.2, x + s * 5.6, 0, z - 3.8, 0xd8d0c0, 6);
    b.box(6, 2.8, 0.1, x, 0, z - 0.05, 0x3a3026);
    win.box(5.6, 2.6, 0.04, x, 0.1, z - 0.1, 0xffe6b0);
    const s = makeSign('KHÁCH SẠN HƯƠNG GIANG', 16, 1.6, { bg: '#5a2a80', fg: '#f6e3a8', border: '#e8c25a' });
    s.position.set(x, H - 1.6, z - 0.08); s.rotation.y = Math.PI;
    W.scene.add(s); W.signs.push(s);
    W.spots.hotel = { x: x - 2, z: z - 4.5 };
    // giá xe đạp cho thuê
    for (let i = 0; i < 5; i++) bicycle(b, x + 9 + i * 1.0, z - 3, Math.PI / 2, [0x2d6fb0, 0xc8322a, 0xe8b030, 0x3a8a4a, 0x7a3fa0][i]);
    W.spots.bikeRack = { x: x + 11, z: z - 5 };
    for (let i = 0; i < 4; i++) lantern(g, x - 4.5 + i * 3, 2.8, z - 3.8, 0xe8b33a, 0.7);
  }

  // ===== Tiệm áo dài =====
  {
    const { x, z } = P.aoDai;
    res(x - 9, 78, x + 9, 98);
    b.box(14, 7, 12, x, 0, z + 6, 0xe8dcc8);
    b.solid(14, 8, 12, x, 0, z + 6);
    b.box(12, 3, 0.1, x, 0.3, z - 0.02, 0xc8d8e0);
    win.box(11.6, 2.8, 0.04, x, 0.4, z - 0.06, 0xfff0d0);
    // ma-nơ-canh mặc áo dài
    const ad = [0x6a3d9a, 0xf2efe6, 0x8a4ac0, 0xd84a6a, 0x5a2a80];
    for (let i = 0; i < 5; i++) {
      const mx = x - 4.8 + i * 2.4, mz = z - 1.4;
      b.circleSolid(0.45, 3, mx, 0, mz);
      b.cyl(0.2, 0.42, 1.6, mx, 0.3, mz, ad[i], 6);
      b.cyl(0.24, 0.2, 0.6, mx, 1.9, mz, ad[i], 6);
      b.sphere(0.16, mx, 2.7, mz, 0xe8d0b8, 6, 5);
    }
    b.box(14, 0.4, 2, x, 3.6, z - 0.8, 0x5a2a80);
    const s = makeSign('ÁO DÀI TÍM HUẾ', 9, 1.3, { bg: '#5a2a80', fg: '#fff3d6', border: '#e8c25a', font: 'bold 76px "Cormorant Garamond", serif' });
    s.position.set(x, 5.2, z - 0.06); s.rotation.y = Math.PI;
    W.scene.add(s); W.signs.push(s);
    W.spots.aoDai = { x: x + 3, z: z - 3 };
  }

  // ===== Bến thuyền rồng =====
  {
    pier(b, P.dock.x, P.dock.z, W, 18);
    res(P.dock.x - 15, 60, P.dock.x + 15, 70);
    const hx = P.dock.x + 11, hz = 52;
    b.box(4, 2.6, 3, hx, 0, hz, 0x7a4a2a);
    b.solid(4, 3, 3, hx, 0, hz);
    b.roof(5.4, 4.4, 1.3, hx, 2.6, hz, COL.yellowRoof);
    const s = makeSign('BẾN THUYỀN RỒNG', 4.2, 0.8, { bg: '#7a1a14', fg: '#f6d77a' });
    s.position.set(hx, 2.25, hz - 1.56); s.rotation.y = Math.PI;
    W.scene.add(s); W.signs.push(s);
    W.spots.dock = { x: P.dock.x + 1.2, z: 31 };
    W.spots.dockTicket = { x: hx, z: hz - 2.6 };
    for (let i = 0; i < 6; i++) lantern(g, P.dock.x + (i % 2 ? 2.3 : -2.3), 1.9, 42 - Math.floor(i / 2) * 6, 0xd8322a, 0.6);
    for (let i = 0; i < 6; i++) b.cyl(0.06, 0.06, 1.7, P.dock.x + (i % 2 ? 2.3 : -2.3), 0.25, 42 - Math.floor(i / 2) * 6, 0x5a3a20, 5);
  }

  // ===== Nhà phố dọc các con đường =====
  // vùng không xây nhà
  res(-200, -335, 60, -74);                    // Kinh Thành (cả dải cỏ trước tường thành)
  res(120, -140, 200, -76);                    // chợ Đông Ba
  res(-400, -160, -280, -76);                  // chùa Thiên Mụ
  res(KD_X0 - 20, 270, KD_X1 + 20, 420);       // lăng
  res(-430, 160, -200, 222);                   // ruộng lúa
  res(-60, 160, 60, 222);                      // công viên
  const roadRects = ROADS.map(([x1, z1, x2, z2, w]) => [Math.min(x1, x2) - w / 2 - 1.9, Math.min(z1, z2) - w / 2 - 1.9, Math.max(x1, x2) + w / 2 + 1.9, Math.max(z1, z2) + w / 2 + 1.9]);
  const placed = [];
  const overlap = (a, c) => a[0] < c[2] && a[2] > c[0] && a[1] < c[3] && a[3] > c[1];
  const freeRect = (r) => Math.abs(r[1]) > 0 && !(r[1] < 70 && r[3] > -70) && r[0] > WORLD.minX && r[2] < WORLD.maxX && r[1] > WORLD.minZ && r[3] < WORLD.maxZ &&
    !reserved.some(q => overlap(r, q)) && !roadRects.some(q => overlap(r, q)) && !placed.some(q => overlap(r, q));
  ROADS.forEach(([x1, z1, x2, z2, w]) => {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const dx = (x2 - x1) / len, dz = (z2 - z1) / len;
    for (const s of [-1, 1]) {
      const nx = dz * s, nz = -dx * s; // pháp tuyến hướng ra khỏi đường
      let t = 4;
      while (t < len - 4) {
        const hw = 4.2 + Math.random() * 3, hd = 11 + Math.random() * 5;
        const off = w / 2 + 2.3 + hd / 2;
        const cx = x1 + dx * (t + hw / 2) + nx * off, cz = z1 + dz * (t + hw / 2) + nz * off;
        const ex = Math.abs(dx) > 0.5 ? hw / 2 : hd / 2, ez = Math.abs(dx) > 0.5 ? hd / 2 : hw / 2;
        const r = [cx - ex, cz - ez, cx + ex, cz + ez];
        if (freeRect(r) && Math.random() > 0.08) {
          placed.push(r); W.mapRects.push(r);
          const ry = Math.atan2(-nx, -nz);
          shopHouse(b, win, cx, cz, ry, hw, hd, 1 + Math.floor(Math.random() * 3.4), W);
          t += hw + 0.15;
        } else t += 2;
      }
    }
  });

  // ===== Cột điện, dây điện dọc phố (không kéo vào trong Kinh Thành) =====
  ROADS.forEach(([x1, z1, x2, z2, w], i) => { if (i < 14 || i === 19) powerLine(b, x1, z1, x2, z2, i % 2 ? 1 : -1, w); });
  // ===== Vạch qua đường =====
  for (const cx of [-46, 34, 92, 108, 160]) crosswalk(b, cx, 72, true, 9);
  for (const cx of [20, 62, 92]) crosswalk(b, cx, 150, true, 8);
  for (const cx of [-60, 92]) crosswalk(b, cx, 230, true, 8);
  for (const cx of [-150, -70, 10, 92, 160]) crosswalk(b, cx, -72, true, 9);
  for (const cz of [80, 142, 222]) crosswalk(b, 100, cz, false, 9);

  // ===== Ruộng lúa & làng quê phía Tây Nam =====
  {
    const fx0 = -420, fx1 = -205, fz0 = 162, fz1 = 220;
    const cw = 21, cd = 14;
    for (let x = fx0; x < fx1 - cw + 1; x += cw + 1.2) for (let z = fz0; z < fz1 - cd + 1; z += cd + 1.2) {
      const kind = Math.random();
      if (kind < 0.35) W.ponds.push({ x: x + cw / 2, z: z + cd / 2, w: cw, d: cd, y: 0.06, paddy: true });
      b.box(cw, 0.12, cd, x + cw / 2, -0.04, z + cd / 2, kind < 0.35 ? 0x5a6a4a : kind < 0.75 ? 0x5a8a3a : 0x9a8a40);
      W.paddies.push({ x: x + cw / 2, z: z + cd / 2, w: cw, d: cd, kind });
      b.box(cw + 1.2, 0.3, 0.6, x + cw / 2, 0, z - 0.6, 0x7a6a4a); // bờ ruộng
    }
    // trâu & người làm đồng
    for (const [x, z] of [[-330, 190], [-262, 176]]) buffalo(b, x, z, Math.random() * 6);
    W.farmers.push({ x: -300, z: 184 }, { x: -380, z: 205 }, { x: -240, z: 200 });
    for (let i = 0; i < 10; i++) tree(b, -415 + Math.random() * 200, 156 + (i % 2) * 70, i % 2 ? 'palm' : 'bamboo');
  }
  // công viên nhỏ cạnh ga
  {
    for (let i = 0; i < 16; i++) tree(b, -55 + Math.random() * 110, 165 + Math.random() * 52, ['round', 'phuong', 'bang', 'palm'][i % 4]);
    for (let i = 0; i < 6; i++) bench(b, -40 + i * 16, 192, 0);
    // bồn sen
    W.ponds.push({ x: 0, z: 192, w: 22, d: 12, y: 0.15 });
    b.box(23, 0.4, 13, 0, -0.1, 192, 0x8d877a);
    railing(b, -11.5, 186, 11.5, 186, 0.3, 0x8d877a, 0.5, true, 3); railing(b, -11.5, 198, 11.5, 198, 0.3, 0x8d877a, 0.5, true, 3);
    railing(b, -11.5, 186, -11.5, 198, 0.3, 0x8d877a, 0.5, true, 3); railing(b, 11.5, 186, 11.5, 198, 0.3, 0x8d877a, 0.5, true, 3);
    for (let i = 0; i < 30; i++) { const x = -10 + Math.random() * 20, z = 187 + Math.random() * 10; b.cyl(0.4 + Math.random() * 0.25, 0.5, 0.03, x, 0.16, z, 0x3f7a35, 9); }
  }
  // cây xanh dọc phố
  ROADS.forEach(([x1, z1, x2, z2, w], ri) => {
    const len = Math.hypot(x2 - x1, z2 - z1);
    if (len < 30) return;
    const dx = (x2 - x1) / len, dz = (z2 - z1) / len;
    for (let t = 10; t < len - 10; t += 22) {
      for (const s of [-1, 1]) {
        const x = x1 + dx * t + dz * s * (w / 2 + 1.2), z = z1 + dz * t - dx * s * (w / 2 + 1.2);
        if (Math.abs(z) < 70 || reserved.some(q => x > q[0] && x < q[2] && z > q[1] && z < q[3])) continue;
        if (W.physics.blocked(x, z) || roadRects.some((q, i) => i !== ri && x > q[0] + 1.2 && x < q[2] - 1.2 && z > q[1] + 1.2 && z < q[3] - 1.2)) continue;
        if ((t / 22) % 2 < 1) tree(b, x, z, Math.random() > 0.5 ? 'bang' : 'phuong', 0.8);
        else streetLamp(b, g, W.halos.list, x, z, Math.atan2(-dz * s, dx * s));
      }
    }
  });
  // xe máy dựng bên đường
  for (let i = 0; i < 40; i++) {
    const r = ROADS[Math.floor(Math.random() * ROADS.length)];
    const [x1, z1, x2, z2, w] = r;
    const t = Math.random();
    const len = Math.hypot(x2 - x1, z2 - z1), dx = (x2 - x1) / len, dz = (z2 - z1) / len;
    const s = Math.random() > 0.5 ? 1 : -1;
    const x = x1 + (x2 - x1) * t + dz * s * (w / 2 + 1.1), z = z1 + (z2 - z1) * t - dx * s * (w / 2 + 1.1);
    if (Math.abs(z) < 70 || W.physics.blocked(x, z)) continue;
    motorbikeModel(b, x, z, Math.atan2(dz * s, -dx * s) + (Math.random() - 0.5) * 0.3, SIGN_COLORS[i % SIGN_COLORS.length]);
  }

  SIGNS.build(W);
  W.scene.add(b.build(W.mats.main, { chunk: 80 }));
  W.scene.add(g.build(W.mats.glow, { cast: false, receive: false, chunk: 80 }));
  const wm = win.build(W.mats.win, { cast: false, receive: false, chunk: 80 });
  W.scene.add(wm);
  W.windowMesh = wm;
}

const KD_X0 = -276, KD_X1 = -224;

export function cyclo(b, x, z, ry) {
  b.save(); b.translate(x, 0, z); b.rotateY(ry);
  // ghế khách phía trước
  b.box(1.0, 0.5, 0.8, 0, 0.55, 0.6, 0x2a3a6a);
  b.box(1.0, 0.7, 0.12, 0, 1.0, 0.25, 0x2a3a6a);
  b.boxR(1.1, 0.06, 0.9, 0, 1.75, 0.5, 0x1a1a1a, -0.3, 0, 0);
  // bánh xe
  for (const sx of [-0.55, 0.55]) { b.save(); b.translate(sx, 0.35, 0.8); b.rotateZ(Math.PI / 2); b.cyl(0.35, 0.35, 0.05, 0, -0.025, 0, 0x222222, 10); b.restore(); }
  b.save(); b.translate(0, 0.35, -1.0); b.rotateZ(Math.PI / 2); b.cyl(0.35, 0.35, 0.05, 0, -0.025, 0, 0x222222, 10); b.restore();
  b.box(0.08, 0.08, 1.8, 0, 0.45, -0.1, 0x8a2a1a);
  b.box(0.4, 0.08, 0.3, 0, 1.15, -0.8, 0x111111); // yên người đạp
  b.boxR(0.06, 0.8, 0.06, 0, 0.75, -0.75, 0x8a2a1a, 0.2, 0, 0);
  b.restore();
  b.solid(1.4, 1.4, 2.4, x, 0, z, ry);
}

export function bicycle(b, x, z, ry, color) {
  b.save(); b.translate(x, 0, z); b.rotateY(ry);
  for (const sz of [-0.55, 0.55]) { b.save(); b.translate(0, 0.33, sz); b.rotateZ(Math.PI / 2); b.cyl(0.33, 0.33, 0.04, 0, -0.02, 0, 0x222222, 12); b.restore(); }
  b.boxR(0.05, 0.05, 1.1, 0, 0.6, 0, color, 0.1, 0, 0);
  b.boxR(0.05, 0.6, 0.05, 0, 0.6, -0.2, color, 0.3, 0, 0);
  b.box(0.18, 0.05, 0.28, 0, 0.92, -0.25, 0x222222);
  b.box(0.5, 0.04, 0.04, 0, 1.0, 0.5, 0x333333);
  b.box(0.35, 0.2, 0.3, 0, 0.8, 0.65, 0x8a6a3a);
  b.restore();
}

export function motorbikeModel(b, x, z, ry, color, y = null) {
  const gy = y ?? terrainHeight(x, z);
  b.save(); b.translate(x, gy, z); b.rotateY(ry);
  for (const sz of [-0.62, 0.62]) { b.save(); b.translate(0, 0.3, sz); b.rotateZ(Math.PI / 2); b.cyl(0.3, 0.3, 0.12, 0, -0.06, 0, 0x1a1a1a, 10); b.restore(); }
  b.box(0.36, 0.45, 1.1, 0, 0.35, -0.05, color);
  b.box(0.3, 0.14, 0.7, 0, 0.82, -0.25, 0x1a1a1a);
  b.boxR(0.3, 0.8, 0.12, 0, 0.75, 0.55, color, -0.3, 0, 0);
  b.box(0.6, 0.06, 0.06, 0, 1.15, 0.62, 0x333333);
  b.box(0.2, 0.15, 0.1, 0, 1.0, 0.72, 0xf0f0e0);
  b.restore();
}

function buffalo(b, x, z, ry) {
  const y = terrainHeight(x, z);
  b.save(); b.translate(x, y, z); b.rotateY(ry);
  b.box(1.1, 1.0, 2.2, 0, 0.75, 0, 0x3a3a3c);
  for (const sx of [-0.4, 0.4]) for (const sz of [-0.8, 0.8]) b.box(0.22, 0.8, 0.22, sx, 0, sz, 0x2a2a2c);
  b.box(0.7, 0.6, 0.8, 0, 1.0, 1.3, 0x3a3a3c);
  for (const sx of [-1, 1]) b.boxR(0.9, 0.12, 0.12, sx * 0.55, 1.45, 1.2, 0x8a8070, 0, 0, sx * 0.4);
  b.restore();
  b.solid(1.4, 2, 2.6, x, y, z, ry);
}
