// Vẽ bản đồ giấy của Huế (tĩnh) + bản đồ mini xoay theo hướng nhìn
import { WORLD, ROADS, CITADEL, IMPERIAL, RIVER, P } from '../world/layout.js';
import { PLACES } from '../game/data.js';

const S = 2; // px / đơn vị thế giới

export class MapArt {
  constructor(W) {
    this.W = W;
    const cw = (WORLD.maxX - WORLD.minX) * S, ch = (WORLD.maxZ - WORLD.minZ) * S;
    const cv = document.createElement('canvas');
    cv.width = cw; cv.height = ch;
    this.cv = cv;
    this._draw(cv.getContext('2d'));
  }
  m(x, z) { return [(x - WORLD.minX) * S, (z - WORLD.minZ) * S]; }

  _draw(c) {
    const W = this.W, m = (x, z) => this.m(x, z);
    c.fillStyle = '#e9e0c6'; c.fillRect(0, 0, this.cv.width, this.cv.height);
    // vân giấy
    for (let i = 0; i < 2500; i++) { c.fillStyle = `rgba(120,90,40,${Math.random() * 0.05})`; c.fillRect(Math.random() * this.cv.width, Math.random() * this.cv.height, 2, 2); }
    const rect = (x0, z0, x1, z1, fill, stroke, lw = 1) => {
      const [a, b] = m(x0, z0), [d, e] = m(x1, z1);
      if (fill) { c.fillStyle = fill; c.fillRect(a, b, d - a, e - b); }
      if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.strokeRect(a, b, d - a, e - b); }
    };
    // vùng xanh
    rect(-430, 160, -200, 222, '#cfdba6');
    rect(-60, 160, 60, 222, '#d4dcae');
    rect(CITADEL.x0, CITADEL.z0, CITADEL.x1, CITADEL.z1, '#dde0b6');
    c.fillStyle = '#c9d49c';
    let [hx, hz] = m(-340, -118); c.beginPath(); c.arc(hx, hz, 50 * S, 0, 7); c.fill();
    c.fillStyle = '#c5cf96';
    [hx, hz] = m(-250, 360); c.beginPath(); c.ellipse(hx, hz, 100 * S, 70 * S, 0, 0, 7); c.fill();
    // ruộng
    c.strokeStyle = 'rgba(110,140,60,.35)'; c.lineWidth = 1;
    for (let x = -420; x < -205; x += 22) for (let z = 162; z < 220; z += 15) { const [a, b] = m(x, z); c.strokeRect(a, b, 21 * S, 14 * S); }
    // sông Hương
    rect(WORLD.minX - 10, -RIVER.half, WORLD.maxX + 10, RIVER.half, '#9cc6cf');
    c.strokeStyle = '#6f9aa6'; c.lineWidth = 2;
    for (const s of [-1, 1]) { const [a, b] = m(WORLD.minX, s * RIVER.bank), [d] = m(WORLD.maxX, 0); c.beginPath(); c.moveTo(a, b); c.lineTo(d, b); c.stroke(); }
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.5;
    for (let i = 0; i < 40; i++) { const x = WORLD.minX + Math.random() * 720, z = -30 + Math.random() * 60; const [a, b] = m(x, z); c.beginPath(); c.moveTo(a, b); c.quadraticCurveTo(a + 8, b - 3, a + 16, b); c.stroke(); }
    // hồ nước
    for (const p of W.ponds) rect(p.x - p.w / 2, p.z - p.d / 2, p.x + p.w / 2, p.z + p.d / 2, p.paddy ? '#b9d4c4' : '#9cc6cf');
    // đường
    for (const pass of [0, 1]) for (const [x1, z1, x2, z2, w] of ROADS) {
      const [a, b] = m(x1, z1), [d, e] = m(x2, z2);
      c.strokeStyle = pass ? '#fbf7ec' : '#b8ab90';
      c.lineWidth = w * S + (pass ? 0 : 3);
      c.lineCap = 'square';
      c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke();
    }
    // cầu Tràng Tiền
    { const [a, b] = m(P.bridge.x, -60), [, e] = m(P.bridge.x, 60); c.strokeStyle = '#7a7a82'; c.lineWidth = 12 * S + 3; c.beginPath(); c.moveTo(a, b); c.lineTo(a, e); c.stroke(); c.strokeStyle = '#d8d8dc'; c.lineWidth = 12 * S - 3; c.stroke(); }
    // nhà
    c.fillStyle = '#d6c4a0'; c.strokeStyle = '#b8a47e'; c.lineWidth = 1;
    for (const r of W.mapRects) { const [a, b] = m(r[0], r[1]), [d, e] = m(r[2], r[3]); c.fillRect(a, b, d - a, e - b); c.strokeRect(a, b, d - a, e - b); }
    // công trình lớn
    rect(125, -135, 195, -101, '#e0b878', '#a07a40', 2);   // chợ
    rect(-89, 248, -31, 262, '#e8c890', '#a07a40', 2);     // ga
    rect(145, 92, 175, 108, '#c8a8d8', '#7a5a9a', 2);      // khách sạn
    rect(-19, 88, -5, 100, '#c8a8d8', '#7a5a9a', 2);       // áo dài
    rect(-125, 268, 25, 276, '#cfc6b0');                   // sân ga
    // Kinh Thành
    c.strokeStyle = '#7a5a3a'; c.lineWidth = CITADEL.thick * S;
    { const [a, b] = m(CITADEL.x0 + 3, CITADEL.z0 + 3), [d, e] = m(CITADEL.x1 - 3, CITADEL.z1 - 3); c.strokeRect(a, b, d - a, e - b); }
    c.strokeStyle = '#a8743a'; c.lineWidth = 2.4 * S;
    { const [a, b] = m(IMPERIAL.x0, IMPERIAL.z0), [d, e] = m(IMPERIAL.x1, IMPERIAL.z1); c.strokeRect(a, b, d - a, e - b); }
    // cổng thành (khoảng hở)
    c.fillStyle = '#fbf7ec';
    for (const [x, z, w, h] of [[-150, -103, 10, 8], [10, -103, 10, 8], [47, -215, 8, 10]]) rect(x - w / 2, z - h / 2, x + w / 2, z + h / 2, '#fbf7ec');
    rect(-87, -115, -53, -89, '#a88a64', '#6a4a2a', 2);   // Kỳ Đài
    rect(-99, -192, -41, -178, '#c8a060', '#7a5a2a', 2);  // Ngọ Môn
    rect(-95, -252, -45, -231, '#d8a83a', '#8a5a1a', 2);  // Thái Hòa
    // Thiên Mụ
    c.fillStyle = '#c98f6c'; [hx, hz] = m(P.tower.x, P.tower.z); c.beginPath(); c.arc(hx, hz, 5 * S, 0, 7); c.fill();
    rect(-351, -139, -329, -125, '#b89a7a');
    // Khải Định
    rect(-276, 290, -224, 396, '#bdb8ac', '#6f6c66', 2);
    rect(-264, 368, -236, 386, '#8a877f');
    // nhãn
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const label = (x, z, t, size = 22, color = '#3a2a1a', italic = true) => {
      const [a, b] = m(x, z);
      c.font = `${italic ? 'italic ' : ''}700 ${size}px "Cormorant Garamond", serif`;
      c.lineWidth = 5; c.strokeStyle = 'rgba(246,238,220,.85)'; c.strokeText(t, a, b); c.fillStyle = color; c.fillText(t, a, b);
    };
    label(-160, 0, 'S ô n g   H ư ơ n g', 40, '#3f6f7a');
    label(-70, -310, 'KINH THÀNH HUẾ', 30, '#6a4a2a', false);
    label(-70, -265, 'Đại Nội', 26, '#7a4a1a');
    label(-330, 165, 'Ruộng lúa', 22, '#5a7a3a');
    label(-250, 410, 'Đồi Châu Chữ', 20, '#5a6a3a');
    label(0, 210, 'Công viên', 18, '#5a7a3a');
    label(60, 102, 'Lê Lợi', 20, '#7a6a5a');
    label(46, 112, 'Phố ẩm thực', 20, '#a52a1e');
    label(160, 112, 'KS Hương Giang', 18, '#5a2a80');
    for (const [id, p] of Object.entries(PLACES)) {
      if (id === 'songHuong' || id === 'benThuyen') continue;
      label(p.x, p.z + (id === 'trangTien' ? 0 : -14), p.name, 24, '#2b1d14');
    }
    // hoa hồng la bàn
    const [ra, rb] = m(250, 380);
    c.save(); c.translate(ra, rb);
    c.fillStyle = '#7a5a3a'; c.beginPath(); c.moveTo(0, -46); c.lineTo(10, 0); c.lineTo(0, 46); c.lineTo(-10, 0); c.closePath(); c.fill();
    c.fillStyle = '#a52a1e'; c.beginPath(); c.moveTo(0, -46); c.lineTo(10, 0); c.lineTo(-10, 0); c.closePath(); c.fill();
    c.font = '700 22px "Be Vietnam Pro"'; c.fillStyle = '#3a2a1a'; c.fillText('B', 0, -62);
    c.restore();
  }

  drawMini(ctx, px, pz, heading, target) {
    const C = ctx.canvas.width, R = C / 2;
    const k = 1.5;
    ctx.save();
    ctx.clearRect(0, 0, C, C);
    ctx.beginPath(); ctx.arc(R, R, R, 0, 7); ctx.clip();
    ctx.fillStyle = '#e9e0c6'; ctx.fillRect(0, 0, C, C);
    ctx.translate(R, R);
    ctx.rotate(-heading);
    ctx.scale(k / S, k / S);
    const [mx, mz] = this.m(px, pz);
    ctx.drawImage(this.cv, -mx, -mz);
    ctx.restore();
    // mục tiêu
    if (target) {
      const dx = target.x - px, dz = target.z - pz;
      const c = Math.cos(-heading), s = Math.sin(-heading);
      let x = (dx * c - dz * s) * k, y = (dx * s + dz * c) * k;
      const d = Math.hypot(x, y);
      if (d > R - 12) { x *= (R - 12) / d; y *= (R - 12) / d; }
      ctx.save(); ctx.translate(R + x, R + y);
      ctx.fillStyle = '#e2b453'; ctx.strokeStyle = '#4a2a6a'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(7, 0); ctx.lineTo(0, 8); ctx.lineTo(-7, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    // người chơi
    ctx.save(); ctx.translate(R, R);
    ctx.fillStyle = 'rgba(74,42,106,.18)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 46, -Math.PI / 2 - 0.55, -Math.PI / 2 + 0.55); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#a52a1e'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(7, 7); ctx.lineTo(0, 3); ctx.lineTo(-7, 7); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    // chữ B (Bắc)
    const nx = Math.sin(-heading) * (R - 12), ny = -Math.cos(-heading) * (R - 12);
    ctx.font = '700 13px "Be Vietnam Pro"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#a52a1e'; ctx.fillText('B', R + nx, R + ny);
  }

  drawFull(canvas, px, pz, heading, target, stamps) {
    const ctx = canvas.getContext('2d');
    canvas.width = this.cv.width / 1.5; canvas.height = this.cv.height / 1.5;
    ctx.drawImage(this.cv, 0, 0, canvas.width, canvas.height);
    const k = 1 / 1.5;
    const toC = (x, z) => { const [a, b] = this.m(x, z); return [a * k, b * k]; };
    for (const [id, p] of Object.entries(PLACES)) {
      const [a, b] = toC(p.x, p.z);
      ctx.font = '26px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.globalAlpha = stamps[id] ? 1 : 0.45;
      ctx.fillText(p.icon, a, b);
      ctx.globalAlpha = 1;
    }
    if (target) {
      const [a, b] = toC(target.x, target.z);
      ctx.fillStyle = '#e2b453'; ctx.strokeStyle = '#4a2a6a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(a, b - 12); ctx.lineTo(a + 10, b); ctx.lineTo(a, b + 12); ctx.lineTo(a - 10, b); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    const [a, b] = toC(px, pz);
    ctx.save(); ctx.translate(a, b); ctx.rotate(heading);
    ctx.fillStyle = '#a52a1e'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(11, 11); ctx.lineTo(0, 5); ctx.lineTo(-11, 11); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}
