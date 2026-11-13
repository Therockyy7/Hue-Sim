import * as THREE from 'three';
import { makeSurfaceMaterial } from './surfaces.js';

export function makeMaterials() {
  // công trình, đồ vật: màu theo đỉnh + vân bề mặt theo loại vật liệu
  const main = makeSurfaceMaterial({ side: THREE.DoubleSide, envMapIntensity: 0.26 });
  const terrain = makeSurfaceMaterial({ envMapIntensity: 0.14 }, true);
  const road = makeSurfaceMaterial({ polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, envMapIntensity: 0.26 });
  // nhân vật có khung xương: không dùng vân theo toạ độ (vân sẽ trôi khi cử động)
  const dyn = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0, envMapIntensity: 0.26 });
  // vật phát sáng (đèn lồng, cửa sổ): màu nhân hệ số theo đêm
  const glow = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, side: THREE.DoubleSide });
  glow.color.setScalar(1);
  // nước sông Hương
  const normalMap = makeWaterNormals();
  const water = new THREE.MeshStandardMaterial({ color: 0x2c6466, roughness: 0.06, metalness: 0.15, normalMap, normalScale: new THREE.Vector2(0.45, 0.45), envMapIntensity: 1.0 });
  // quầng sáng đèn trên mặt đất
  const halo = new THREE.MeshBasicMaterial({ map: radialTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffb860, opacity: 0, toneMapped: false });
  return { main, terrain, road, dyn, glow, water, halo };
}

function makeWaterNormals() {
  const N = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = N;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(N, N);
  const H = new Float32Array(N * N);
  const waves = [];
  for (let i = 0; i < 14; i++) waves.push([1 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 7) - 3, Math.random() * 6.28, 0.5 + Math.random()]);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let h = 0;
    for (const [fx, fy, ph, a] of waves) h += Math.sin(((x * fx + y * fy) / N) * Math.PI * 2 + ph) * a / (fx + Math.abs(fy) + 1);
    H[y * N + x] = h;
  }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const hL = H[y * N + ((x - 1 + N) % N)], hR = H[y * N + ((x + 1) % N)];
    const hD = H[((y - 1 + N) % N) * N + x], hU = H[((y + 1) % N) * N + x];
    const nx = (hL - hR) * 2.5, ny = (hD - hU) * 2.5, nz = 1;
    const l = Math.hypot(nx, ny, nz);
    const i = (y * N + x) * 4;
    img.data[i] = (nx / l * 0.5 + 0.5) * 255;
    img.data[i + 1] = (ny / l * 0.5 + 0.5) * 255;
    img.data[i + 2] = (nz / l * 0.5 + 0.5) * 255;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(60, 6);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

export function radialTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, inner); g.addColorStop(0.35, 'rgba(255,255,255,0.45)'); g.addColorStop(1, outer);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Biển hiệu chữ (canvas texture)
export function signTexture(text, { bg = '#7a1a14', fg = '#f6d77a', w = 512, h = 128, font = 'bold 64px "Be Vietnam Pro", sans-serif', border = '#d9a84a', sub = null } = {}) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  if (border) { ctx.strokeStyle = border; ctx.lineWidth = Math.max(4, h * 0.05); ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, w - ctx.lineWidth * 2, h - ctx.lineWidth * 2); }
  ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = font;
  // chừa chỗ cho dấu tiếng Việt phía trên chữ hoa
  let size = Math.min(parseInt(font.match(/(\d+)px/)[1]), Math.floor(h * (sub ? 0.46 : 0.62)));
  ctx.font = font.replace(/\d+px/, size + 'px');
  while (ctx.measureText(text).width > w * 0.9 && size > 10) { size -= 2; ctx.font = font.replace(/\d+px/, size + 'px'); }
  ctx.fillText(text, w / 2, sub ? h * 0.4 : h / 2);
  if (sub) { ctx.font = `500 ${Math.round(size * 0.42)}px "Be Vietnam Pro", sans-serif`; ctx.fillText(sub, w / 2, h * 0.78); }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function makeSign(text, width, height, opts = {}) {
  const tex = signTexture(text, { w: 512, h: Math.round(512 * height / width), ...opts });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, side: THREE.DoubleSide, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.05 }));
  m.userData.sign = true;
  return m;
}
