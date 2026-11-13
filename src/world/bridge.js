// Cầu Tràng Tiền: "sáu vài mười hai nhịp" — dầm thép vòm, đèn LED đổi màu ban đêm
import * as THREE from 'three';
import { Builder } from './builder.js';
import { P } from './layout.js';
import { stairs, railing, lantern } from './props.js';

const STEEL = 0xb9bdc2;

export function buildBridge(W) {
  const b = new Builder(W.physics);
  const led = new Builder(); led.jitter = 0;
  const { x, z0, z1, deck, ramp } = P.bridge;
  const len = z1 - z0;
  const HW = 6; // nửa bề rộng mặt cầu

  // mặt cầu
  b.box(HW * 2, 0.7, len, x, deck - 0.7, 0, 0x8a8780);
  b.box(HW * 2 - 0.4, 0.04, len, x, deck - 0.02, 0, 0x55555a);
  W.physics.addFloor(x, 0, HW, len / 2, 0, deck, deck);
  // dốc hai đầu cầu
  stairs(b, x, z1 + ramp / 2, HW * 2, ramp, deck, 0, 0x8a8780, 0, 30);
  stairs(b, x, z0 - ramp / 2, HW * 2, ramp, 0, deck, 0x8a8780, 0, 30);
  for (const sx of [-1, 1]) {
    for (const [za, zb] of [[z1, z1 + ramp], [z0 - ramp, z0]]) {
      b.save(); b.translate(x + sx * (HW + 0.2), 0, (za + zb) / 2);
      b.box(0.4, 1.2, ramp, 0, deck * 0.5, 0, 0xa8a8a0);
      b.solid(0.5, deck + 1.4, ramp, 0, 0, 0);
      b.restore();
    }
  }

  // trụ cầu
  const spans = 6, sl = len / spans;
  for (let i = 0; i <= spans; i++) {
    const z = z0 + i * sl;
    b.box(HW * 2 + 1, deck + 4.5, 2.6, x, -4.6, z, 0x8b877c);
    b.box(HW * 2 + 1.6, 0.3, 3, x, deck - 0.8, z, 0x9a968a);
  }

  // dàn thép vòm 6 nhịp × 2 bên
  for (const sx of [-4.2, 4.2]) {
    const tx = x + sx;
    for (let i = 0; i < spans; i++) {
      const za = z0 + i * sl, zb = za + sl;
      const N = 8;
      const pts = [];
      for (let k = 0; k <= N; k++) {
        const t = k / N;
        pts.push([za + sl * t, deck + 0.7 + Math.sin(Math.PI * t) * 4.2]);
      }
      // thanh biên dưới
      b.box(0.45, 0.6, sl, tx, deck, (za + zb) / 2, STEEL);
      for (let k = 0; k < N; k++) {
        const [ax, ay] = pts[k], [bx, by] = pts[k + 1];
        const L = Math.hypot(bx - ax, by - ay);
        const ang = Math.atan2(by - ay, bx - ax);
        // thanh biên trên (cong)
        b.boxR(0.5, 0.5, L + 0.1, tx, (ay + by) / 2, (ax + bx) / 2, STEEL, -ang, 0, 0);
        led.boxR(0.12, 0.12, L + 0.1, tx + Math.sign(sx) * 0.3, (ay + by) / 2 + 0.3, (ax + bx) / 2, 0xffffff, -ang, 0, 0);
        // thanh đứng
        if (k > 0) b.box(0.25, ay - deck - 0.6, 0.25, tx, deck + 0.6, ax, STEEL);
        // thanh chéo
        const dl = Math.hypot(bx - ax, (k < N / 2 ? by : ay) - deck - 0.6);
        const da = Math.atan2(k < N / 2 ? (by - deck - 0.6) : (ay - deck - 0.6), (bx - ax) * (k < N / 2 ? 1 : -1));
        b.boxR(0.18, 0.18, dl, tx, (deck + 0.6 + (k < N / 2 ? by : ay)) / 2, (ax + bx) / 2, STEEL, -da, 0, 0);
      }
      // thanh giằng ngang phía trên
      for (const t of [0.35, 0.5, 0.65]) {
        const zz = za + sl * t, yy = deck + 0.7 + Math.sin(Math.PI * t) * 4.2;
        if (sx > 0) b.box(8.4, 0.22, 0.22, x, yy - 0.1, zz, STEEL);
      }
    }
    b.solid(0.6, 6, len, tx, deck - 0.5, 0);
  }
  // lan can ngoài + đèn
  const g = new Builder(); g.jitter = 0;
  for (const sx of [-1, 1]) {
    railing(b, x + sx * HW, z0, x + sx * HW, z1, deck, 0xb0b3b6, 1.0, true, 2);
    for (let z = z0 + 4; z < z1; z += sl) {
      b.cyl(0.07, 0.1, 3.4, x + sx * HW, deck, z, 0x2e3a35, 6);
      g.sphere(0.22, x + sx * HW, deck + 3.5, z, 0xffe3a8, 6, 4);
      W.halos.list.push([x + sx * (HW - 1.5), deck + 0.05, z, 4]);
    }
  }

  W.scene.add(b.build(W.mats.main, { chunk: 80 }));
  W.scene.add(g.build(W.mats.glow, { cast: false, receive: false, chunk: 80 }));
  const ledMesh = led.build(W.mats.led, { cast: false, receive: false, chunk: 80 });
  W.scene.add(ledMesh);
}
