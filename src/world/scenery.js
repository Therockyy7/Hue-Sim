// Thảm thực vật phủ lên cảnh: cỏ và hoa dại trên các bãi cỏ, sen trong hồ, lúa ngoài đồng
import { FOL, LEAF } from './foliage.js';
import { ROADS, CITADEL, IMPERIAL } from './layout.js';
import { terrainHeight, mulberry } from './terrain.js';

const GRASS_TINT = [0xd8f0b0, 0xc0e090, 0xe8f0c0, 0xb8d888, 0xcfe8a0];

export function buildScenery(W, density = 1) {
  const rnd = mulberry(4242);
  const onRoad = (x, z) => ROADS.some(([ax, az, bx, bz, w]) => {
    const vx = bx - ax, vz = bz - az, L2 = vx * vx + vz * vz;
    const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / L2));
    return Math.hypot(x - (ax + vx * t), z - (az + vz * t)) < w / 2 + 2.2;
  });
  const lawn = (x0, z0, x1, z1, dens, { y = null, skip = null, flowers = 0.07 } = {}) => {
    const n = Math.round((x1 - x0) * (z1 - z0) * dens * density);
    for (let i = 0; i < n; i++) {
      const x = x0 + rnd() * (x1 - x0), z = z0 + rnd() * (z1 - z0);
      if (onRoad(x, z) || (skip && skip(x, z))) continue;
      const gy = y ?? terrainHeight(x, z);
      if (W.physics.blocked(x, z, gy + 0.4)) continue;
      if (rnd() < flowers) FOL.tuft(x, gy, z, LEAF.flower, 0.8 + rnd() * 0.4, 0.45 + rnd() * 0.2, 0xffffff);
      else FOL.tuft(x, gy, z, LEAF.grass, 0.9 + rnd() * 0.7, 0.3 + rnd() * 0.3, GRASS_TINT[Math.floor(rnd() * GRASS_TINT.length)]);
    }
  };

  // hai bờ sông Hương
  lawn(-425, 52.8, 295, 65.2, 0.45);
  lawn(-425, -65.2, 295, -52.8, 0.45);
  lawn(-425, 45, 295, 47.6, 0.4, { flowers: 0.02 });
  lawn(-425, -47.6, 295, -45, 0.4, { flowers: 0.02 });
  // công viên cạnh ga
  lawn(-58, 162, 58, 222, 0.5, { skip: (x, z) => Math.abs(x) < 12.6 && z > 185 && z < 199, flowers: 0.12 });
  // thảm cỏ trước Ngọ Môn
  for (const sx of [-1, 1]) {
    lawn(-70 + sx * 22 - 13, -159, -70 + sx * 22 + 13, -125, 0.6, { y: 0.25, flowers: 0.03 });
    for (let i = 0; i < 6; i++) {
      const bx = -70 + sx * 22 + (i % 2 ? 6 : -6), bz = -128 - i * 5;
      for (let k = 0; k < 7; k++) FOL.tuft(bx + (rnd() - 0.5) * 1.8, 0.42, bz + (rnd() - 0.5) * 1.8, LEAF.flower, 0.9, 0.5, i % 3 === 0 ? 0xffd0e0 : 0xfff0b0);
    }
  }
  // trong Kinh Thành (trừ Hoàng Thành, quảng trường, hồ Tịnh Tâm)
  const { x0, x1, z0, z1 } = CITADEL;
  lawn(x0 + 7, z0 + 7, x1 - 7, z1 - 7, 0.15, {
    skip: (x, z) => (x > IMPERIAL.x0 - 3 && x < IMPERIAL.x1 + 3 && z > IMPERIAL.z0 - 3 && z < IMPERIAL.z1 + 3)
      || (x > -128 && x < -12 && z > -180 && z < -112) || (x > -22 && x < 32 && z > -293 && z < -257),
  });
  lawn(-116, -290.5, -24, -282, 0.4);
  // đồi Hà Khê
  lawn(-378, -168, -302, -86, 0.3, { skip: (x, z) => Math.abs(x + 340) < 11 && z > -150 });
  // đồi thông quanh lăng Khải Định
  lawn(-360, 285, -282, 410, 0.12, { flowers: 0.03 });
  lawn(-218, 285, -140, 410, 0.12, { flowers: 0.03 });

  // sen trong hồ
  for (const p of W.ponds) {
    if (p.paddy) continue;
    const n = Math.round(p.w * p.d / 7);
    for (let i = 0; i < n; i++) {
      const x = p.x + (rnd() - 0.5) * (p.w - 1.6), z = p.z + (rnd() - 0.5) * (p.d - 1.6);
      if (Math.abs(x - p.x) < 5 && Math.abs(z - p.z) < 5 && p.w > 40) continue; // đình giữa hồ Tịnh Tâm
      const a = rnd() * 3.14;
      FOL.frond([x, p.y - 0.05, z], [0, 1, 0], 0.85 + rnd() * 0.3, 0.9, LEAF.lotus, 0xffffff, { sway: 0.05, phase: rnd() * 6, side: [Math.cos(a), 0, Math.sin(a)] });
    }
  }
  // lúa ngoài đồng: cấy thành hàng
  for (const f of W.paddies) {
    const wet = f.kind < 0.35, gold = f.kind >= 0.75;
    const rows = wet ? 9 : 15, per = wet ? 16 : 30;
    for (let r = 0; r < rows; r++) for (let k = 0; k < per; k++) {
      if (wet && rnd() < 0.3) continue;
      const x = f.x - f.w / 2 + 0.6 + (k + rnd() * 0.5) * (f.w - 1.2) / per, z = f.z - f.d / 2 + 0.7 + r * (f.d - 1.4) / (rows - 1) + (rnd() - 0.5) * 0.15;
      FOL.tuft(x, wet ? 0.05 : 0.08, z, gold ? LEAF.riceGold : LEAF.rice, 0.75 + rnd() * 0.2, wet ? 0.3 : 0.55 + rnd() * 0.15, wet ? 0xd8f0a0 : 0xffffff);
    }
  }
}
