// Chùa Thiên Mụ trên đồi Hà Khê: tháp Phước Duyên 7 tầng, lầu chuông Đại Hồng Chung, nhà bia, tam quan, chánh điện
import * as THREE from 'three';
import { Builder } from './builder.js';
import { P } from './layout.js';
import { terrainHeight } from './terrain.js';
import { COL, tree, pavilion, railing, lantern, columns, range, streetLamp } from './props.js';
import { makeSign } from './materials.js';

export function buildPagoda(W) {
  const b = new Builder(W.physics);
  const g = new Builder(); g.jitter = 0;
  b.link(g);
  const cx = P.thienMu.x;
  const top = 7;

  // Bậc đá từ đường lên đồi
  for (let z = -78; z > -97; z -= 0.6) {
    const h = terrainHeight(cx, z);
    b.box(8, h + 0.4, 0.62, cx, -0.4, z, 0x8f897b);
  }
  for (const sx of [-4.3, 4.3]) {
    for (let z = -79; z > -96; z -= 2) b.box(0.5, terrainHeight(cx, z) + 0.9, 2, cx + sx, -0.3, z, 0x777164);
  }
  // Bến thuyền dưới chân chùa
  pier(b, P.tmPier.x, P.tmPier.z, W);
  W.spots.tmPier = { x: P.tmPier.x - 0.8, z: -32.5 };

  // Tháp Phước Duyên
  {
    const { x, z } = P.tower;
    const y0 = terrainHeight(x, z);
    b.box(14, 1.0, 14, x, y0 - 0.3, z, 0x9a9282);
    b.floor(14, 14, x, z, y0 + 0.7);
    let y = y0 + 0.7, r = 4.4;
    b.smooth = false; // tháp bát giác: giữ cạnh sắc
    for (let i = 0; i < 7; i++) {
      const h = 2.9 - i * 0.12;
      b.cyl(r, r, h, x, y, z, 0xc98f6c, 8, Math.PI / 8);
      // cửa vòm trên mỗi mặt
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        const ap = r * 0.93;
        b.save(); b.translate(x + Math.sin(a) * ap, y + 0.4, z + Math.cos(a) * ap); b.rotateY(a);
        if (k % 2 === 0) { b.box(r * 0.42, h * 0.55, 0.12, 0, 0, 0, 0x2a1d16); b.cyl(r * 0.21, r * 0.21, 0.12, 0, h * 0.55, 0, 0x2a1d16, 8); }
        else b.box(r * 0.3, h * 0.35, 0.1, 0, h * 0.15, 0, 0xe6d8bc);
        b.restore();
      }
      // gờ mái
      b.cyl(r + 0.7, r + 0.35, 0.45, x, y + h, z, 0xe9dcc2, 8, Math.PI / 8);
      b.cyl(r + 0.2, r + 0.75, 0.25, x, y + h - 0.25, z, 0x8a4a32, 8, Math.PI / 8);
      y += h + 0.45;
      r -= 0.42;
    }
    b.smooth = true;
    // bầu tháp (pháp luân)
    b.cyl(0.9, 1.2, 0.8, x, y, z, 0xc9a24a, 8);
    b.sphere(0.9, x, y + 1.4, z, 0xd8b04e, 8, 6);
    b.cyl(0.08, 0.2, 2.4, x, y + 2.2, z, 0xd8b04e, 6);
    b.circleSolid(5.0, 30, x, y0, z);
    // đèn chiếu tháp
    for (let k = 0; k < 4; k++) { const a = k * 1.57 + 0.78; W.halos.list.push([x + Math.cos(a) * 6, y0 + 0.8, z + Math.sin(a) * 6, 4]); }
    const s = makeSign('PHƯỚC DUYÊN BẢO THÁP', 3.2, 0.6, { bg: '#3a2a1a', fg: '#efd38a', border: null, font: 'bold 54px "Be Vietnam Pro"' });
    s.position.set(x, y0 + 0.62, z + 7.05);
    W.scene.add(s); W.signs.push(s);
  }

  // Lầu chuông (Đại Hồng Chung) & nhà bia
  {
    const { x, z } = P.bell;
    const y = terrainHeight(x, z);
    pavilion(b, x, y, z, 4.2, 4.2, 3.4, 0x6f6a55, { tiers: 2, base: 0.5 });
    // chuông lớn
    const pts = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector2(0.72 + Math.pow(1 - t, 2.4) * 0.62, t * 2.2)); }
    const lathe = new THREE.LatheGeometry(pts, 14);
    b.geo(lathe, 0x4a3a22, x, y + 1.3, z); lathe.dispose();
    b.cyl(0.25, 0.25, 0.6, x, y + 3.5, z, 0x3a2a14, 6);
    b.box(4.2, 0.25, 0.25, x, y + 3.95, z, COL.lacquer);
    // chày gỗ treo
    b.boxR(0.25, 0.25, 2.2, x + 1.7, y + 2.4, z, 0x7a5a3a, 0, Math.PI / 2, 0);
    b.circleSolid(1.4, 3.5, x, y, z);
    W.spots.bell = { x, z, y: y + 2.2 };
    const s = makeSign('ĐẠI HỒNG CHUNG', 2.6, 0.5, { bg: '#3a2a1a', fg: '#efd38a', border: null });
    s.position.set(x, y + 4.4, z + 2.3);
    W.scene.add(s); W.signs.push(s);

    const sx = cx - 19, sz = z;
    const sy = terrainHeight(sx, sz);
    pavilion(b, sx, sy, sz, 4.2, 4.2, 3.4, 0x6f6a55, { tiers: 2, base: 0.5 });
    // rùa đội bia
    b.box(1.6, 0.6, 2.4, sx, sy + 0.5, sz, 0x6a675c);
    b.sphere(0.4, sx, sy + 0.95, sz + 1.3, 0x6a675c, 6, 4);
    b.box(1.3, 2.4, 0.3, sx, sy + 1.1, sz, 0x8b877a);
    b.box(1.5, 0.3, 0.4, sx, sy + 3.5, sz, 0x7a766a);
  }

  // Tam quan
  {
    const z = -112, y = terrainHeight(cx, z);
    b.save(); b.translate(cx, y, z);
    b.box(16, 0.5, 4, 0, 0, 0, 0x9a9282);
    b.floor(16, 4, 0, 0, 0.5);
    for (const sx of [-1, 1]) {
      b.box(2.2, 4.6, 2.2, sx * 3.1, 0.5, 0, 0xd8cbb0);
      b.solid(2.2, 5, 2.2, sx * 3.1, 0.5, 0);
      b.box(3.4, 3.8, 0.8, sx * 6, 0.5, 0, 0xd8cbb0);
      b.solid(3.4, 4, 0.8, sx * 6, 0.5, 0);
      b.roof(4.6, 3, 1.4, sx * 6, 4.3, 0, 0x6f6a55);
    }
    b.box(8.4, 1.6, 2.4, 0, 4.4, 0, 0xd8cbb0);
    b.roof(9.6, 4, 2, 0, 6, 0, 0x6f6a55);
    b.ridgeDragons(4, 0, 8, 0, 0xb89a4a);
    b.restore();
    const s = makeSign('THIÊN MỤ TỰ', 3.4, 0.9, { bg: '#2a2418', fg: '#f0d48a', border: '#a8884a', font: 'bold 70px "Cormorant Garamond", serif' });
    s.position.set(cx, y + 5.2, z + 1.25);
    W.scene.add(s); W.signs.push(s);
  }

  // Chánh điện Đại Hùng
  {
    const z = -132, y = terrainHeight(cx, z);
    b.save(); b.translate(cx, y, z);
    b.box(22, 0.8, 15, 0, -0.2, 0, 0x9a9282);
    b.floor(22, 15, 0, 0, 0.6);
    columns(b, range(-9, 9, 6), [6], 0.6, 4, COL.redCol, 0.28);
    b.box(19, 4, 0.3, 0, 0.6, -6, COL.lacquer); b.solid(19, 5, 0.5, 0, 0.6, -6);
    for (const sx of [-1, 1]) { b.box(0.3, 4, 12, sx * 9.5, 0.6, 0, COL.lacquer); b.solid(0.5, 5, 12, sx * 9.5, 0.6, 0); }
    // tượng Phật
    b.box(4, 1.2, 2.4, 0, 0.6, -4.4, 0x7a1a12);
    b.cyl(0.9, 1.2, 1.4, 0, 1.8, -4.4, 0xd9a83a, 8);
    b.sphere(0.6, 0, 3.7, -4.4, 0xd9a83a, 8, 6);
    b.sphere(1.6, 0, 3.4, -5.0, 0xe0b84a, 10, 8, 1.3);
    lantern(g, -2.5, 3.2, 2, 0xe8b33a); lantern(g, 2.5, 3.2, 2, 0xe8b33a);
    g.box(0.3, 0.3, 0.3, -1.4, 1.9, -3.4, 0xffc070); g.box(0.3, 0.3, 0.3, 1.4, 1.9, -3.4, 0xffc070);
    b.roof(25, 18, 4, 0, 4.7, 0, 0x5f6a55);
    b.ridgeDragons(6, 0, 8.6, 0, 0xb89a4a);
    b.restore();
  }

  // Cây thông, cây cảnh quanh chùa
  for (let i = 0; i < 26; i++) {
    const a = Math.random() * Math.PI * 2, d = 14 + Math.random() * 18;
    const x = cx + Math.cos(a) * d, z = -118 + Math.sin(a) * d;
    if (z > -84 || (Math.abs(x - cx) < 13 && z > -145)) continue;
    if (W.physics.blocked(x, z, terrainHeight(x, z) + 0.5)) continue;
    tree(b, x, z, Math.random() > 0.3 ? 'pine' : 'round', 0.9 + Math.random() * 0.4);
  }
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) {
    const x = cx + sx * (7 + i * 2.2), z = -104;
    const y = terrainHeight(x, z);
    b.cyl(0.6, 0.45, 0.6, x, y, z, 0x8a5a3a, 8);
    b.ico(0.6, x, y + 1.0, z, COL.leafDark, 0, 1, 0.7, 1);
  }
  for (const sx of [-12, 12]) streetLamp(b, g, W.halos.list, cx + sx, -76, 0);

  W.scene.add(b.build(W.mats.main, { chunk: 80 }));
  W.scene.add(g.build(W.mats.glow, { cast: false, receive: false, chunk: 80 }));
}

// Bến thuyền bằng gỗ nhô ra sông (dùng chung)
export function pier(b, x, z, W, len = 16) {
  const dir = z < 0 ? 1 : -1; // nhô về phía lòng sông
  const zEnd = z + dir * len;
  const cz = (z + zEnd) / 2;
  b.box(5, 0.35, len + 2, x, -0.1, cz - dir, 0x6e4a2c);
  for (let i = 0; i <= len; i += 3) for (const sx of [-2.2, 2.2]) b.cyl(0.18, 0.18, 4, x + sx, -3.8, z + dir * i, 0x4a301c, 6);
  W.physics.addFloor(x, cz - dir, 2.5, (len + 2) / 2, 0, 0.25, 0.25);
  railing(b, x - 2.4, z, x - 2.4, zEnd, 0.25, 0x5a3a20, 0.9, true, 2);
  railing(b, x + 2.4, z, x + 2.4, zEnd - dir * 4, 0.25, 0x5a3a20, 0.9, true, 2);
  railing(b, x - 2.4, zEnd, x + 2.4, zEnd, 0.25, 0x5a3a20, 0.9, true, 2);
  // khoảng hở ở bờ đê cho lối xuống bến
  W.riverGaps.push([x - 2.6, x + 2.6, Math.sign(z)]);
}
