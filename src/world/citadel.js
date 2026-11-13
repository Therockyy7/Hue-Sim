// Kinh Thành Huế: tường thành, Kỳ Đài, Ngọ Môn, Hoàng Thành, Điện Thái Hòa, Hiển Lâm Các & Cửu Đỉnh
import * as THREE from 'three';
import { Builder, archWallGeometry } from './builder.js';
import { CITADEL, IMPERIAL, P } from './layout.js';
import { COL, tree, columns, range, pavilion, stairs, railing, lantern, streetLamp } from './props.js';
import { makeSign } from './materials.js';

const WALL = 0x6c6855, WALL_TOP = 0x8a8470, BRICK_OLD = 0x7a6450;

export function buildCitadel(W) {
  const b = new Builder(W.physics);
  const g = new Builder(); g.jitter = 0;
  b.link(g);

  // ===== Tường Kinh Thành =====
  const { x0, x1, z0, z1, wallH, thick } = CITADEL;
  const wallSeg = (ax, az, bx, bz) => {
    const len = Math.hypot(bx - ax, bz - az);
    const ang = Math.atan2(bx - ax, bz - az);
    b.save(); b.translate((ax + bx) / 2, 0, (az + bz) / 2); b.rotateY(ang);
    b.box(thick, wallH, len, 0, -1, 0, WALL);
    b.box(thick + 0.4, 0.4, len, 0, wallH - 1, 0, WALL_TOP);
    // lỗ châu mai phía ngoài
    const n = Math.floor(len / 3);
    for (let i = 0; i < n; i++) b.box(0.6, 1.1, 1.6, thick / 2 - 0.3, wallH - 0.6, -len / 2 + 1.5 + i * 3, WALL);
    b.solid(thick, wallH + 2, len, 0, -1, 0);
    b.restore();
  };
  const sz = z1 - thick / 2, nz = z0 + thick / 2, wx = x0 + thick / 2, ex = x1 - thick / 2;
  // phía Nam (mặt tiền hướng sông Hương), chừa cửa Thể Nhơn, Quảng Đức và Kỳ Đài
  wallSeg(x0, sz, -155, sz); wallSeg(-145, sz, -87, sz); wallSeg(-53, sz, 5, sz); wallSeg(15, sz, x1, sz);
  wallSeg(x0, nz, x1, nz);
  wallSeg(wx, z0, wx, z1);
  wallSeg(ex, z0, ex, -220); wallSeg(ex, -210, ex, z1);

  // Cửa thành có vọng lâu
  const gate = (x, z, ry, name) => {
    b.save(); b.translate(x, 0, z); b.rotateY(ry);
    const geo = archWallGeometry(14, 7.5, thick + 1, [{ x: 0, w: 5, h: 5.2 }]);
    b.geo(geo, BRICK_OLD, 0, 0, 0);
    geo.dispose();
    b.solid(4.5, 8, thick + 1, -4.75, 0, 0);
    b.solid(4.5, 8, thick + 1, 4.75, 0, 0);
    b.box(14.6, 0.5, thick + 1.6, 0, 7.5, 0, WALL_TOP);
    pavilion(b, 0, 8, 0, 6, 3.6, 2.6, COL.yellowRoof, { tiers: 2, colsX: 3, base: 0.3, solid: false });
    b.restore();
    const s = makeSign(name, 4.6, 1.1, { bg: '#2b2b28', fg: '#e9d39a', border: '#9b8350', font: 'bold 70px "Cormorant Garamond", serif' });
    s.position.set(x + Math.sin(ry) * (thick / 2 + 0.55), 6.1, z + Math.cos(ry) * (thick / 2 + 0.55));
    s.rotation.y = ry;
    W.scene.add(s); W.signs.push(s);
  };
  gate(-150, sz, 0, 'THỂ NHƠN MÔN');
  gate(10, sz, 0, 'QUẢNG ĐỨC MÔN');
  gate(ex, -215, Math.PI / 2, 'ĐÔNG BA MÔN');

  // ===== Kỳ Đài =====
  {
    const { x, z } = P.kyDai;
    b.save(); b.translate(x, 0, z);
    b.box(34, 6.3, 26, 0, -0.3, 0, 0x76705c);
    b.box(34.6, 0.4, 26.6, 0, 6, 0, WALL_TOP);
    b.solid(34, 6, 26, 0, 0, 0);
    b.floor(34, 26, 0, 0, 6.4);
    // lan can tầng 1
    for (const [ax, az, bx2, bz] of [[-17, -13, -4, -13], [4, -13, 17, -13], [17, -13, 17, 13], [17, 13, -17, 13], [-17, 13, -17, -13]]) {
      railing(b, ax, az, bx2, bz, 6.4, 0x8d8775, 1.0, true, 2);
    }
    b.box(25, 4.5, 18, 0, 6.4, 0, 0x6e6a58);
    b.box(25.6, 0.35, 18.6, 0, 10.8, 0, WALL_TOP);
    b.solid(25, 5, 18, 0, 6.4, 0);
    b.box(16, 3.5, 11, 0, 11.1, 0, 0x726c5a);
    b.box(16.6, 0.35, 11.6, 0, 14.5, 0, WALL_TOP);
    // nhà nhỏ trên đỉnh
    b.box(2.6, 2, 2.6, 0, 14.8, 0, 0x8e3a26);
    // cột cờ
    b.cyl(0.18, 0.38, 32, 0, 14.8, 0, 0xd8d3c8, 8);
    b.sphere(0.5, 0, 46.9, 0, COL.gold, 8, 6);
    b.restore();
    // bậc lên từ phía trong thành
    stairs(b, x, z - 13 - 7, 7, 14, 0, 6.4, 0x8a8472, 0);
    railing(b, x - 3.7, z - 13, x - 3.7, z - 27, 0, 0x8d8775, 1, true);
    railing(b, x + 3.7, z - 13, x + 3.7, z - 27, 0, 0x8d8775, 1, true);
    // cờ đỏ sao vàng (bay phấp phới)
    W.flag = makeFlag();
    W.flag.position.set(x + 0.2, 40, z);
    W.scene.add(W.flag);
    // đèn chiếu sáng quanh chân Kỳ Đài
    for (const sx of [-14, 14]) for (const szz of [16, -30]) streetLamp(b, g, W.halos.list, x + sx, z + szz, 0);
  }

  // ===== Quảng trường Ngọ Môn =====
  {
    for (const sx of [-1, 1]) {
      // thảm cỏ & bồn hoa
      b.box(26, 0.25, 34, -70 + sx * 22, 0, -142, 0x5e8f3e);
      for (let i = 0; i < 6; i++) b.box(2.2, 0.45, 2.2, -70 + sx * 22 + (i % 2 ? 6 : -6), 0, -128 - i * 5, i % 3 === 0 ? 0xd8467a : 0xe8b030);
      for (let i = 0; i < 5; i++) tree(b, -70 + sx * 36, -124 - i * 9, 'round', 0.9);
    }
    // Cửu vị thần công (súng thần công)
    for (const sx of [-1, 1]) {
      const cx = -70 + sx * 50;
      pavilion(b, cx, 0, -140, 6, 14, 3.2, COL.yellowRoof, { colsX: 2, colsZ: 4, base: 0.4, ridge: false });
      for (let i = 0; i < 4; i++) {
        const zz = -146 + i * 4;
        b.box(1.6, 0.8, 1.2, cx, 0.4, zz, 0x5a3a20);
        b.save(); b.translate(cx, 1.5, zz); b.rotateZ(Math.PI / 2);
        b.cyl(0.32, 0.45, 4.8, 0, -2.4, 0, 0x3c4a3a, 10);
        b.restore();
      }
    }
    // Phòng vé
    const kx = -44, kz = -158;
    b.box(4.2, 2.8, 3, kx, 0, kz, 0xd9c79a);
    b.solid(4.2, 3, 3, kx, 0, kz);
    b.roof(5.6, 4.4, 1.4, kx, 2.8, kz, COL.yellowRoof);
    b.box(2.4, 1, 0.1, kx, 1.2, kz + 1.55, 0x2a3540);
    const s = makeSign('PHÒNG VÉ ĐẠI NỘI', 3.6, 0.7, { bg: '#7a1a14' });
    s.position.set(kx, 2.45, kz + 1.56);
    W.scene.add(s); W.signs.push(s);
    W.spots.ticketDaiNoi = { x: kx, z: kz + 2.6 };
  }

  // ===== Ngọ Môn =====
  {
    const cx = P.ngoMon.x, fz = P.ngoMon.z; // mặt tiền tại z = -178
    const bodyZ = fz - 7;
    b.save(); b.translate(cx, 0, bodyZ);
    const geo = archWallGeometry(58, 7, 14, [{ x: 0, w: 4.6, h: 5.4 }, { x: -9.5, w: 3.4, h: 4.4 }, { x: 9.5, w: 3.4, h: 4.4 }]);
    b.geo(geo, 0x837a68, 0, 0, 0); geo.dispose();
    // cửa đóng ở hai cửa bên
    for (const sx of [-9.5, 9.5]) b.box(3.4, 4.4, 0.3, sx, 0, 0, 0x6b1a12);
    // đường viền đá
    b.box(58.8, 0.6, 14.6, 0, 6.8, 0, 0x9a917c);
    b.box(58, 0.8, 0.5, 0, 0, 7.05, 0x6a6352);
    b.solid(26.7, 8, 14, -15.65, 0, 0);
    b.solid(26.7, 8, 14, 15.65, 0, 0);
    // cánh chữ U (dịch môn)
    for (const sx of [-1, 1]) {
      b.box(10, 7, 12, sx * 24, 0, 13, 0x837a68);
      b.box(10.6, 0.6, 12.6, sx * 24, 6.8, 13, 0x9a917c);
      b.solid(10, 8, 12, sx * 24, 0, 13);
    }
    // Lầu Ngũ Phụng
    const Y = 7.4;
    pavilion(b, 0, Y, 0, 18, 9, 4.4, COL.yellowRoof, { tiers: 2, colsX: 6, colsZ: 3, base: 0.2, solid: false });
    for (const sx of [-1, 1]) {
      pavilion(b, sx * 17, Y, 0, 10, 8, 4, COL.greenRoof, { tiers: 2, colsX: 4, colsZ: 3, base: 0.2, solid: false });
      pavilion(b, sx * 24, Y, 13, 7, 8, 3.6, COL.greenRoof, { tiers: 2, colsX: 3, colsZ: 3, base: 0.2, solid: false });
    }
    // lan can gỗ quanh lầu
    for (const sx of [-1, 1]) b.box(0.2, 0.9, 14, sx * 29.2, Y, 0, COL.lacquer);
    b.box(58, 0.9, 0.2, 0, Y, -7.1, COL.lacquer);
    // đèn lồng
    for (let i = -3; i <= 3; i++) lantern(g, i * 3, Y + 3.2, 5.2, 0xe8b33a, 0.8);
    b.restore();
    const s = makeSign('午門', 2.6, 1.3, { bg: '#2c3a6a', fg: '#f0cf6a', border: '#d9a84a', font: 'bold 90px serif' });
    s.position.set(cx, 6.1, fz + 0.05);
    W.scene.add(s); W.signs.push(s);
    // rào vé ở cửa giữa
    const bar = b.solid(4.6, 4, 0.6, cx, 0, fz - 0.8);
    bar.tag = 'gateDaiNoi';
    W.gates.daiNoi = bar;
    b.box(4.4, 1.0, 0.15, cx, 0, fz - 0.8, 0xc4a24a);
    // đèn chiếu vàng ban đêm
    for (let i = -2; i <= 2; i++) W.halos.list.push([cx + i * 11, 0.1, fz + 3, 7]);
  }

  // ===== Tường Hoàng Thành =====
  {
    const { x0: hx0, x1: hx1, z0: hz0, z1: hz1 } = IMPERIAL;
    const seg = (ax, az, bx, bz) => {
      const len = Math.hypot(bx - ax, bz - az), ang = Math.atan2(bx - ax, bz - az);
      b.save(); b.translate((ax + bx) / 2, 0, (az + bz) / 2); b.rotateY(ang);
      b.box(2.4, 4.6, len, 0, 0, 0, 0x8a6a4c);
      b.box(2.8, 0.35, len, 0, 4.6, 0, 0xa38a62);
      b.solid(2.4, 6, len, 0, 0, 0);
      b.restore();
    };
    seg(hx0, hz1, -99, hz1); seg(-41, hz1, hx1, hz1);
    seg(hx0, hz0, hx1, hz0); seg(hx0, hz0, hx0, hz1); seg(hx1, hz0, hx1, hz1);
  }

  // ===== Hồ Thái Dịch & cầu Trung Đạo =====
  {
    const z = -201;
    for (const [ax, bx2] of [[-112, -74], [-66, -28]]) {
      const w = bx2 - ax, cx = (ax + bx2) / 2;
      b.box(w + 1, 0.5, 12, cx, -0.6, z, 0x6d6858);
      W.ponds.push({ x: cx, z, w: w - 0.6, d: 11.4, y: 0.05 });
      railing(b, ax, z - 6, bx2, z - 6, 0, 0x9a917c, 0.7, true, 2);
      railing(b, ax, z + 6, bx2, z + 6, 0, 0x9a917c, 0.7, true, 2);
      railing(b, ax, z - 6, ax, z + 6, 0, 0x9a917c, 0.7, true, 2);
      railing(b, bx2, z - 6, bx2, z + 6, 0, 0x9a917c, 0.7, true, 2);
      // sen
      for (let i = 0; i < 26; i++) {
        const lx = ax + 1 + Math.random() * (w - 2), lz = z - 5 + Math.random() * 10;
        b.cyl(0.4 + Math.random() * 0.3, 0.55, 0.03, lx, 0.07, lz, 0x3f7a35, 9);
      }
    }
    // cầu
    b.box(6, 0.5, 13, -70, 0, z, 0x9a917c);
    b.floor(6, 13, -70, z, 0.5);
    railing(b, -73, z - 6.5, -73, z + 6.5, 0.5, 0x8a3a22, 0.8, true, 1.6);
    railing(b, -67, z - 6.5, -67, z + 6.5, 0.5, 0x8a3a22, 0.8, true, 1.6);
    // Nghi môn bằng đồng
    for (const sx of [-2.6, -1, 1, 2.6]) b.cyl(0.22, 0.22, 4.4, -70 + sx, 0.5, z + 6.2, 0x5a4a2a, 6);
    b.box(6.2, 0.7, 0.4, -70, 4.4, z + 6.2, 0xb8902f);
    b.box(2.6, 0.9, 0.3, -70, 5.0, z + 6.2, 0x3a6a8a);
    b.sphere(0.35, -70, 6.1, z + 6.2, COL.gold, 6, 4);
  }

  // ===== Sân Đại Triều Nghi + Điện Thái Hòa =====
  {
    const cx = -70;
    b.box(52, 0.35, 12, cx, -0.05, -213, 0xa49c88);
    b.floor(52, 12, cx, -213, 0.3);
    b.box(52, 0.8, 10, cx, -0.05, -224, 0xaaa290);
    b.floor(52, 10, cx, -224, 0.75);
    // bia phẩm cấp quan lại
    for (const sx of [-1, 1]) for (let i = 0; i < 5; i++) {
      b.box(0.5, 0.8, 0.25, cx + sx * (4 + i * 3.4), 0.3, -211, 0x8d8675);
      b.box(0.5, 0.8, 0.25, cx + sx * (4 + i * 3.4), 0.75, -222, 0x8d8675);
    }
    // nền điện
    b.box(52, 1.35, 26, cx, -0.05, -242, 0x9c947f);
    b.floor(52, 26, cx, -242, 1.3);
    b.solid(52, 1.2, 0.4, cx, 0, -255.2);
    const Y = 1.3;
    columns(b, range(cx - 20, cx + 20, 8), range(-233, -251, 4), Y, 6.4, COL.redCol, 0.36);
    // vách sau & hai bên
    b.box(42, 6, 0.4, cx, Y, -252, COL.lacquer); b.solid(42, 7, 0.6, cx, Y, -252);
    for (const sx of [-1, 1]) { b.box(0.4, 6, 18, cx + sx * 21, Y, -242.5, COL.lacquer); b.solid(0.6, 7, 18, cx + sx * 21, Y, -242.5); }
    // cửa bức bàn mặt trước (để ngỏ ở giữa)
    for (const sx of [-1, 1]) for (let i = 0; i < 2; i++) b.box(4.8, 4.2, 0.2, cx + sx * (8.6 + i * 5.7), Y, -233.5, 0x8a2a18);
    // ngai vàng
    b.box(8, 0.5, 4, cx, Y, -248, 0x7a1a12);
    b.box(1.8, 1.4, 1.2, cx, Y + 0.5, -248.5, COL.gold);
    b.box(1.8, 1.4, 0.3, cx, Y + 1.9, -249, COL.gold);
    b.box(4, 0.3, 3, cx, Y + 5.2, -248, COL.gold);
    lantern(g, cx - 3, Y + 4.2, -247, 0xe8b33a, 0.9); lantern(g, cx + 3, Y + 4.2, -247, 0xe8b33a, 0.9);
    // mái trùng thiềm điệp ốc
    b.box(46, 0.5, 22, cx, Y + 6.3, -242, COL.lacquer);
    b.roof(50, 26, 3.6, cx, Y + 6.6, -242, COL.yellowRoof);
    b.box(32, 2.3, 12, cx, Y + 8.3, -242, COL.lacquer);
    b.roof(38, 18, 5, cx, Y + 10.4, -242, COL.yellowRoof);
    b.ridgeDragons(16, cx, Y + 15.3, -242);
    // bậc thềm
    stairs(b, cx, -229.6, 8, 1.2, 0.75, 1.3, 0xa8a08c, 0, 3);
    for (const sx of [-1, 1]) b.box(0.6, 1.0, 1.4, cx + sx * 4.3, 0.75, -229.6, 0x8a8270);
  }

  // ===== Hiển Lâm Các & Cửu Đỉnh =====
  {
    const hx = P.cuuDinh.x, hz = -272;
    pavilion(b, hx, 0, hz, 9, 7, 3.6, COL.yellowRoof, { tiers: 2, colsX: 4, colsZ: 3, base: 0.8, walls: true, ridge: false });
    b.box(5, 2.6, 4, hx, 8.8, hz, COL.lacquer);
    b.roof(7, 6, 2.6, hx, 11.4, hz, COL.yellowRoof);
    b.ridgeDragons(1, hx, 14.0, hz);
    // sân đá
    b.box(34, 0.2, 16, hx, -0.05, -258, 0xa59d88);
    for (let i = 0; i < 9; i++) {
      const ux = hx - 14 + i * 3.5, uz = -259;
      urn(b, ux, uz, i === 4 ? 1.15 : 1);
      b.circleSolid(1.0, 3, ux, 0, uz);
    }
    tree(b, hx - 16, -264, 'round'); tree(b, hx + 18, -264, 'round');
  }

  // ===== Trường Lang (hành lang dài) =====
  pavilion(b, -36, 0, -268, 4, 34, 3.4, COL.yellowRoof, { colsX: 2, colsZ: 10, base: 0.4, ridge: false });

  // ===== Vườn trong Đại Nội =====
  for (let i = 0; i < 10; i++) tree(b, -90 + Math.random() * 46, -290 + Math.random() * 8, i % 3 ? 'round' : 'bang');
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) tree(b, -70 + sx * (31 + i * 6), -214 - (i % 2) * 9, 'bang', 0.8);

  // ===== Bên trong Kinh Thành: vườn, nhà, hồ Tịnh Tâm =====
  {
    // Hồ Tịnh Tâm
    const lx = 5, lz = -275;
    b.box(52, 0.5, 34, lx, -0.6, lz, 0x6d6858);
    W.ponds.push({ x: lx, z: lz, w: 50, d: 32, y: 0.05 });
    railing(b, lx - 26, lz - 17, lx + 26, lz - 17, 0, 0x8d8775, 0.6, true, 3);
    railing(b, lx - 26, lz + 17, lx + 26, lz + 17, 0, 0x8d8775, 0.6, true, 3);
    railing(b, lx - 26, lz - 17, lx - 26, lz + 17, 0, 0x8d8775, 0.6, true, 3);
    railing(b, lx + 26, lz - 17, lx + 26, lz + 17, 0, 0x8d8775, 0.6, true, 3);
    for (let i = 0; i < 70; i++) {
      const x = lx - 24 + Math.random() * 48, z = lz - 15 + Math.random() * 30;
      if (Math.abs(x - lx) < 5 && Math.abs(z - lz) < 5) continue;
      b.cyl(0.45 + Math.random() * 0.3, 0.6, 0.03, x, 0.07, z, 0x3f7a35, 9);
    }
    b.box(8, 0.6, 8, lx, -0.3, lz, 0x8d8775);
    pavilion(b, lx, 0.3, lz, 4, 4, 2.6, COL.yellowRoof, { tiers: 2, base: 0.2, solid: false });
  }
  // nhà vườn của dân trong thành
  const rnd = Math.random;
  const placed = [];
  for (let i = 0, tries = 0; i < 24 && tries < 600; tries++) {
    const x = x0 + 16 + rnd() * (x1 - x0 - 32), z = z0 + 16 + rnd() * (z1 - z0 - 32);
    if ((x > IMPERIAL.x0 - 14 && x < IMPERIAL.x1 + 14 && z > IMPERIAL.z0 - 14) || (x > -30 && x < 40 && z > -300 && z < -250) ||
      Math.abs(x + 150) < 11 || Math.abs(x - 10) < 11 || Math.abs(z + 315) < 11 || Math.abs(z + 150) < 11 ||
      placed.some(([px, pz]) => Math.abs(px - x) < 20 && Math.abs(pz - z) < 20)) continue;
    placed.push([x, z]); i++;
    W.mapRects.push([x - 9, z - 9, x + 9, z + 9]);
    gardenHouse(b, x, z, Math.round(rnd() * 3) * Math.PI / 2);
  }
  for (let i = 0; i < 90; i++) {
    const x = x0 + 10 + rnd() * (x1 - x0 - 20), z = z0 + 10 + rnd() * (z1 - z0 - 20);
    if (x > IMPERIAL.x0 - 6 && x < IMPERIAL.x1 + 6 && z > IMPERIAL.z0 - 6 && z < -110) continue;
    if (Math.abs(x + 150) < 6 || Math.abs(x - 10) < 6 || Math.abs(z + 315) < 6 || Math.abs(z + 150) < 7) continue;
    if (x > -25 && x < 35 && z > -296 && z < -254) continue;
    if (W.physics.blocked(x, z)) continue;
    tree(b, x, z, ['round', 'bang', 'banana', 'palm', 'bamboo'][Math.floor(rnd() * 5)], 0.8 + rnd() * 0.4);
  }
  // đèn đường trong thành
  for (let z = -130; z > -320; z -= 26) { streetLamp(b, g, W.halos.list, -145, z, -Math.PI / 2); streetLamp(b, g, W.halos.list, 15, z, Math.PI / 2); }

  W.scene.add(b.build(W.mats.main, { chunk: 80 }));
  W.scene.add(g.build(W.mats.glow, { cast: false, receive: false, chunk: 80 }));
}

function urn(b, x, z, s = 1) {
  // Đỉnh đồng: thân tròn, 3 chân, 2 quai
  b.save(); b.translate(x, 0, z); b.scale(s, s, s);
  b.box(1.6, 0.4, 1.6, 0, 0, 0, 0x7d776a);
  for (let i = 0; i < 3; i++) { const a = i * 2.094; b.cyl(0.12, 0.16, 0.7, Math.cos(a) * 0.5, 0.4, Math.sin(a) * 0.5, COL.bronze, 5); }
  const pts = [];
  for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push(new THREE.Vector2(0.45 + Math.sin(t * Math.PI) * 0.45 + t * 0.1, t * 1.3)); }
  const lathe = new THREE.LatheGeometry(pts, 10);
  b.geo(lathe, 0x4a4a32, 0, 1.0, 0); lathe.dispose();
  b.cyl(0.6, 0.6, 0.12, 0, 2.3, 0, 0x5a5034, 10);
  for (const sx of [-1, 1]) b.box(0.12, 0.6, 0.4, sx * 0.62, 2.35, 0, 0x4a4a32);
  b.restore();
}

function gardenHouse(b, x, z, ry) {
  b.save(); b.translate(x, 0, z); b.rotateY(ry);
  // tường rào, cổng
  const W2 = 9;
  for (const [ax, az, bx2, bz] of [[-W2, -W2, W2, -W2], [W2, -W2, W2, W2], [-W2, W2, -1.5, W2], [1.5, W2, W2, W2], [-W2, -W2, -W2, W2]]) {
    const len = Math.hypot(bx2 - ax, bz - az), ang = Math.atan2(bx2 - ax, bz - az);
    b.save(); b.translate((ax + bx2) / 2, 0, (az + bz) / 2); b.rotateY(ang);
    b.box(0.3, 1.2, len, 0, 0, 0, 0x8c8a6a);
    b.box(0.6, 0.6, len, 0, 1.2, 0, 0x4f7f34);
    b.solid(0.5, 2, len, 0, 0, 0);
    b.restore();
  }
  // nhà rường
  b.box(9, 0.4, 6, 0, 0, -3, 0x9a917c);
  b.box(8, 2.6, 5, 0, 0.4, -3, 0x8a5a36);
  b.solid(8, 3.5, 5, 0, 0, -3);
  b.box(1.4, 2, 0.1, 0, 0.4, -0.45, 0x3a2414);
  b.roof(10.5, 7.5, 2.6, 0, 3, -3, 0x8a4a32);
  b.restore();
}

function makeFlag() {
  const cv = document.createElement('canvas');
  cv.width = 300; cv.height = 200;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#da251d'; ctx.fillRect(0, 0, 300, 200);
  ctx.fillStyle = '#ffde00';
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 60 : 23;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(150 + Math.cos(a) * r, 100 + Math.sin(a) * r);
  }
  ctx.closePath(); ctx.fill();
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.PlaneGeometry(9, 6, 18, 6);
  geo.translate(4.5, 0, 0);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.8 }));
  m.castShadow = true;
  const base = Float32Array.from(geo.attributes.position.array);
  m.userData.update = (t) => {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = base[i * 3], y = base[i * 3 + 1];
      const k = x / 9;
      p.setZ(i, Math.sin(x * 0.9 - t * 5 + y * 0.2) * 0.55 * k + Math.sin(x * 2.1 - t * 8) * 0.12 * k);
      p.setY(i, y - k * k * 0.4);
    }
    p.needsUpdate = true;
    geo.computeVertexNormals();
  };
  return m;
}
