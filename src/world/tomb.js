// Lăng Khải Định (Ứng Lăng): kiến trúc Đông - Tây, 3 tầng sân, tượng quan, Bi Đình, trụ biểu, Cung Thiên Định
import { Builder } from './builder.js';
import { KD, terrainHeight } from './terrain.js';
import { COL, tree, statue, stairs, lantern, columns, range, streetLamp } from './props.js';
import { makeSign } from './materials.js';

const CON = 0x6f6c66, CON_D = 0x55534e, CON_L = 0x8a877f;

export function buildTomb(W) {
  const b = new Builder(W.physics);
  const g = new Builder(); g.jitter = 0;
  b.link(g);
  const cx = KD.cx, x0 = KD.x0, x1 = KD.x1;

  // --- Nền các tầng
  b.box(x1 - x0, 7, 40, cx, -3, 310, CON);                      // tầng 1 (y=4)
  for (const s of [-1, 1]) {
    b.box(21, 11, 22, cx + s * 15.5, -3, 341, CON);               // tầng 2 hai bên (y=8)
    b.box(21, 16, 44, cx + s * 15.5, -3, 374, CON);               // tầng 3 hai bên (y=13)
  }
  b.box(10, 11, 16, cx, -3, 344, CON);
  b.box(10, 16, 34, cx, -3, 379, CON);
  // bậc cấp với lan can rồng
  stairs(b, cx, 285, 14, 10, 0, 4, CON_L, 0, 18);
  stairs(b, cx, 333, 10, 6, 4, 8, CON_L, 0, 18);
  stairs(b, cx, 357, 10, 10, 8, 13, CON_L, 0, 22);
  const dragonRail = (x, za, zb, ya, yb) => {
    const L = Math.hypot(zb - za, yb - ya), ang = Math.atan2(yb - ya, zb - za);
    b.boxR(0.8, 1.0, L, x, (ya + yb) / 2 + 0.6, (za + zb) / 2, CON_D, -ang, 0, 0);
    b.box(1.0, 1.6, 1.2, x, ya, za - 0.4, CON_D); // đầu rồng
    b.boxR(0.6, 0.6, 1.0, x, ya + 1.6, za - 0.9, CON_D, 0.5, 0, 0);
    b.solid(0.9, yb - ya + 3.5, zb - za + 1.2, x, ya - 1, (za + zb) / 2 - 0.6);
  };
  dragonRail(cx - 7.4, 280, 290, 0, 4); dragonRail(cx + 7.4, 280, 290, 0, 4);
  dragonRail(cx - 5.4, 330, 336, 4, 8); dragonRail(cx + 5.4, 330, 336, 4, 8);
  dragonRail(cx - 5.4, 352, 362, 8, 13); dragonRail(cx + 5.4, 352, 362, 8, 13);

  // --- Tường chắn & va chạm
  const wall = (ax, az, bx, bz, y0, y1, vis = true, top = 1.2) => {
    const len = Math.hypot(bx - ax, bz - az), ang = Math.atan2(bx - ax, bz - az);
    b.save(); b.translate((ax + bx) / 2, 0, (az + bz) / 2); b.rotateY(ang);
    if (vis) { b.box(0.8, top, len, 0, y1 - top + 0.01 + 1.2, 0, CON_D); }
    b.solid(0.8, y1 - y0 + 1.2, len, 0, y0, 0);
    b.restore();
  };
  wall(x0, 290, cx - 7.8, 290, -1, 4);
  wall(cx + 7.8, 290, x1, 290, -1, 4);
  wall(x0, 330, cx - 5.8, 330, 3, 8, false); wall(cx + 5.8, 330, x1, 330, 3, 8, false);
  wall(cx - 5.8, 330, cx - 5.8, 336, 3, 8, false); wall(cx + 5.8, 330, cx + 5.8, 336, 3, 8, false);
  wall(x0, 352, cx - 5.8, 352, 7, 13, false); wall(cx + 5.8, 352, x1, 352, 7, 13, false);
  wall(cx - 5.8, 352, cx - 5.8, 362, 7, 13, false); wall(cx + 5.8, 352, cx + 5.8, 362, 7, 13, false);
  // tường bao
  for (const [ax, az, bx, bz] of [[x0, 290, x0, 396], [x1, 290, x1, 396], [x0, 396, x1, 396]]) {
    const len = Math.hypot(bx - ax, bz - az), ang = Math.atan2(bx - ax, bz - az);
    b.save(); b.translate((ax + bx) / 2, 0, (az + bz) / 2); b.rotateY(ang);
    b.solid(0.9, 30, len, 0, -2, 0);
    b.restore();
  }
  // tường hoa ở mép tầng (trang trí)
  for (const [z, y] of [[292, 4], [328, 4]]) for (const s of [-1, 1]) b.box(18, 1.0, 0.5, cx + s * 17, y, z, CON_D);
  for (const s of [-1, 1]) {
    b.box(0.6, 1.2, 104, x0 + 0.3 + (s > 0 ? x1 - x0 - 0.6 : 0), 4, 343, CON_D);
  }

  // --- Tầng 1: Sân Bái Đình với tượng quan văn võ, voi, ngựa
  for (const s of [-1, 1]) {
    statue(b, cx + s * 7, 4, 298, -s * Math.PI / 2, 0x77736a, 'elephant');
    statue(b, cx + s * 7, 4, 304, -s * Math.PI / 2, 0x77736a, 'horse');
    for (let i = 0; i < 4; i++) statue(b, cx + s * 7, 4, 310 + i * 4.5, -s * Math.PI / 2, 0x7d786d);
    for (let i = 0; i < 4; i++) statue(b, cx + s * 11, 4, 310 + i * 4.5, -s * Math.PI / 2, 0x736f66);
  }
  // trụ biểu
  for (const s of [-1, 1]) {
    const x = cx + s * 20, z = 341;
    b.box(2.2, 1, 2.2, x, 8, z, CON_D);
    b.box(1.5, 11, 1.5, x, 9, z, CON_L);
    b.box(1.9, 0.6, 1.9, x, 20, z, CON_D);
    b.sphere(0.8, x, 21.4, z, CON, 6, 4);
    b.cone(0.4, 1.4, x, 22, z, CON_D, 6);
    b.solid(2.2, 14, 2.2, x, 8, z);
  }

  // --- Tầng 2: Bi Đình (nhà bia bát giác)
  {
    const z = 344, y = 8;
    b.smooth = false; // nhà bia bát giác
    b.cyl(5.6, 5.8, 0.5, cx, y, z, CON_L, 8);
    W.physics.addFloor(cx, z, 5.6, 5.6, 0, y + 0.5);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; b.box(0.8, 5.4, 0.8, cx + Math.cos(a) * 4.6, y + 0.5, z + Math.sin(a) * 4.6, CON); b.circleSolid(0.5, 6, cx + Math.cos(a) * 4.6, y, z + Math.sin(a) * 4.6); }
    b.cyl(5.8, 5.4, 1.4, cx, y + 5.9, z, CON_D, 8);
    b.cone(6.6, 3.2, cx, y + 7.3, z, 0x4e4c47, 8);
    b.cyl(0.5, 0.8, 1.2, cx, y + 10.3, z, CON_D, 8);
    b.smooth = true;
    // bia
    b.box(1.8, 0.8, 0.9, cx, y + 0.5, z, CON_D);
    b.box(1.5, 3.2, 0.35, cx, y + 1.3, z, 0x8a867c);
    b.solid(1.8, 4, 0.9, cx, y, z);
  }

  // --- Tầng 3: Cung Thiên Định
  {
    const y = 13, z0 = 368, z1 = 386, hw = 14;
    const fz = z0;
    // hiên trước
    columns(b, range(cx - 12, cx + 12, 7), [fz - 3], y, 5.2, CON_L, 0.35);
    b.box(hw * 2 + 2, 0.6, 5, cx, y + 5.2, fz - 2.4, CON_D);
    b.roof(hw * 2 + 3, 6.4, 1.6, cx, y + 5.8, fz - 2.4, 0x4e4c47, 0, 0.5, 0x5a5650);
    // tường
    b.box(hw * 2, 8, 0.6, cx, y, z1, CON); b.solid(hw * 2, 9, 0.8, cx, y, z1);
    for (const s of [-1, 1]) { b.box(0.6, 8, z1 - z0, cx + s * hw, y, (z0 + z1) / 2, CON); b.solid(0.8, 9, z1 - z0, cx + s * hw, y, (z0 + z1) / 2); }
    for (const s of [-1, 1]) { b.box(hw - 1.8, 8, 0.6, cx + s * (hw + 1.8) / 2, y, fz, CON); b.solid(hw - 1.8, 9, 0.8, cx + s * (hw + 1.8) / 2, y, fz); }
    b.box(3.6, 2.6, 0.6, cx, y + 5.4, fz, CON);
    // cửa vòm và hoa văn mặt tiền
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) b.box(2.2, 3.6, 0.2, cx + s * (5 + i * 4.5), y + 1.2, fz - 0.4, 0x3a3834);
    // mái chính
    b.box(hw * 2 + 0.6, 0.8, z1 - z0 + 0.6, cx, y + 8, (z0 + z1) / 2, CON_D);
    b.roof(hw * 2 + 3, z1 - z0 + 3, 4, cx, y + 8.8, (z0 + z1) / 2, 0x4e4c47, 0, 0.6, 0x5a5650);
    b.ridgeDragons(8, cx, y + 12.7, (z0 + z1) / 2, 0x6a6760);
    b.floor(hw * 2, z1 - z0, cx, (z0 + z1) / 2, y + 0.05);
    // nội thất khảm sành sứ
    const tiles = [0x2f8f8a, 0xe8c25a, 0xd85a4a, 0x5aa8d8, 0xf0ead8, 0x7ac06a, 0xd88ac0, 0x3a6ab0];
    const rr = Math.random;
    b.jitter = 0.15;
    for (let i = 0; i < 220; i++) {
      const side = i % 3;
      const yy = y + 0.5 + rr() * 6.8;
      if (side === 0) b.box(0.5 + rr() * 0.6, 0.4 + rr() * 0.5, 0.06, cx - hw + 1 + rr() * (hw * 2 - 2), yy, z1 - 0.34, tiles[i % tiles.length]);
      else {
        const s = side === 1 ? -1 : 1;
        b.box(0.06, 0.4 + rr() * 0.5, 0.5 + rr() * 0.6, cx + s * (hw - 0.34), yy, z0 + 1 + rr() * (z1 - z0 - 2), tiles[i % tiles.length]);
      }
    }
    b.jitter = 0.035;
    // trần khảm "Cửu long ẩn vân"
    b.box(hw * 2 - 1, 0.1, z1 - z0 - 1, cx, y + 7.8, (z0 + z1) / 2, 0x3a5a6a);
    for (let i = 0; i < 9; i++) b.boxR(2.6, 0.08, 0.5, cx - 10 + i * 2.5, y + 7.7, (z0 + z1) / 2 + Math.sin(i) * 3, 0xe8c25a, 0, i * 0.7, 0);
    // tượng vua dưới bửu tán
    const sz = z1 - 3;
    b.box(4, 1.0, 3, cx, y, sz, 0x2f8f8a);
    b.box(1.4, 1.2, 1.2, cx, y + 1.0, sz, 0xd8a83a);
    b.cyl(0.55, 0.7, 1.4, cx, y + 2.0, sz, 0xd8a83a, 8);
    b.sphere(0.42, cx, y + 3.75, sz, 0xd8a83a, 8, 6);
    for (const s of [-1, 1]) for (const t of [-1, 1]) b.cyl(0.1, 0.1, 5, cx + s * 1.8, y + 1, sz + t * 1.3, 0xd8a83a, 6);
    b.box(4.2, 0.4, 3.2, cx, y + 6, sz, 0xe8c25a);
    b.solid(4, 6, 3, cx, y, sz);
    g.box(1.2, 0.2, 1.2, cx, y + 7.6, (z0 + z1) / 2, 0xfff0c0);
    lantern(g, cx - 4, y + 3.5, fz - 2.6, 0xe8b33a); lantern(g, cx + 4, y + 3.5, fz - 2.6, 0xe8b33a);
    W.spots.khaiDinhInside = { x: cx, z: (z0 + z1) / 2 };
    const s = makeSign('啟定', 2, 0.9, { bg: '#3a3834', fg: '#e8d29a', border: '#8a826a', font: 'bold 70px serif' });
    s.position.set(cx, y + 6.6, fz - 0.35);
    W.scene.add(s); W.signs.push(s);
  }

  // --- Phòng vé + cổng
  {
    const kx = cx + 14, kz = 276;
    b.box(4, 2.8, 3, kx, 0, kz, 0xd9c79a);
    b.solid(4, 3, 3, kx, 0, kz);
    b.roof(5.4, 4.4, 1.3, kx, 2.8, kz, 0x4e4c47);
    const s = makeSign('VÉ THAM QUAN LĂNG KHẢI ĐỊNH', 3.8, 0.6, { bg: '#3a3834', fg: '#f2e2b0' });
    s.position.set(kx, 2.4, kz - 1.56); s.rotation.y = Math.PI;
    W.scene.add(s); W.signs.push(s);
    W.spots.ticketKhaiDinh = { x: kx, z: kz - 2.6 };
    const bar = b.solid(14, 3, 0.6, cx, 0, 280.6);
    W.gates.khaiDinh = bar;
    b.box(14, 1, 0.15, cx, 0, 280.6, 0xc4a24a);
    // cổng tam quan
    for (const s2 of [-1, 1]) { b.box(1.2, 6, 1.2, cx + s2 * 8.2, 0, 278, CON_L); b.circleSolid(0.8, 6, cx + s2 * 8.2, 0, 278); }
    b.box(17.6, 1.2, 1.4, cx, 6, 278, CON_D);
    const s3 = makeSign('ỨNG LĂNG', 4.2, 0.9, { bg: '#4a4844', fg: '#efd9a0', border: '#8a826a', font: 'bold 72px "Cormorant Garamond"' });
    s3.position.set(cx, 6.6, 277.25); s3.rotation.y = Math.PI;
    W.scene.add(s3); W.signs.push(s3);
    streetLamp(b, g, W.halos.list, cx - 11, 274, Math.PI); streetLamp(b, g, W.halos.list, cx + 20, 270, Math.PI);
  }

  // cây thông trên đồi
  for (let i = 0; i < 70; i++) {
    const x = cx - 110 + Math.random() * 220, z = 282 + Math.random() * 135;
    if (x > x0 - 6 && x < x1 + 6 && z < 400) continue;
    if (Math.abs(x + 250) < 10 && z < 285) continue;
    tree(b, x, z, Math.random() > 0.25 ? 'pine' : 'round', 1 + Math.random() * 0.5);
  }

  W.scene.add(b.build(W.mats.main, { chunk: 80 }));
  W.scene.add(g.build(W.mats.glow, { cast: false, receive: false, chunk: 80 }));
}
