// Bầu trời, mặt trời/mặt trăng, mây, ánh sáng theo giờ trong ngày, sương mù, bóng đổ
import * as THREE from 'three';

const vert = /* glsl */`
varying vec3 vDir;
void main(){
  vDir = position;
  vec4 p = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * p;
  gl_Position.z = gl_Position.w; // luôn ở xa nhất
}`;
const frag = /* glsl */`
uniform vec3 topColor; uniform vec3 horizonColor; uniform vec3 groundColor;
uniform vec3 sunDir; uniform vec3 sunColor; uniform vec3 moonDir;
uniform vec3 cloudLit; uniform vec3 cloudDark;
uniform float starAmt; uniform float moonAmt; uniform float cloudAmt; uniform float time;
varying vec3 vDir;
float hash(vec3 p){ p = fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float n2(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f);
  float a=hash(vec3(i,1.0)), b=hash(vec3(i+vec2(1,0),1.0)), c=hash(vec3(i+vec2(0,1),1.0)), d=hash(vec3(i+vec2(1,1),1.0));
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y); }
float fbm(vec2 p){ float s=0.0, a=0.5; for(int i=0;i<5;i++){ s+=a*n2(p); p=p*2.03+vec2(17.3,9.1); a*=0.5; } return s; }
float cloudDens(vec2 uv){ return smoothstep(0.64 - cloudAmt*0.34, 0.92 - cloudAmt*0.22, fbm(uv) + fbm(uv*3.3 + 4.0)*0.22 - 0.05); }
void main(){
  vec3 d = normalize(vDir);
  float h = d.y;
  float hh = clamp(h, 0.0, 1.0);
  vec3 col = mix(horizonColor, topColor, pow(hh, 0.5));
  // quầng sáng quanh mặt trời, đậm hơn ở sát chân trời
  float s = max(dot(d, sunDir), 0.0);
  col += sunColor * (pow(s, 8.0) * 0.22 + pow(s, 2.5) * 0.07) * (1.0 - hh * 0.6);
  col = mix(col, groundColor, 1.0 - smoothstep(-0.22, 0.0, h));
  col += sunColor * (smoothstep(0.99965, 0.99985, s) * 9.0 + pow(s, 700.0) * 2.0);
  float m = max(dot(d, moonDir), 0.0);
  col += vec3(0.85,0.9,1.0) * (smoothstep(0.99955, 0.9997, m) * 1.8 + pow(m, 80.0) * 0.14 + pow(m, 8.0) * 0.03) * moonAmt;
  if (h > 0.0) {
    float cover = 0.0;
    // mây tích (thấp) có mặt sáng/mặt tối theo hướng nắng
    vec2 uv = d.xz / (h + 0.16) * 1.25 + vec2(time*0.0045, time*0.002);
    float dn = cloudDens(uv);
    if (dn > 0.001) {
      vec2 sd = normalize(sunDir.xz + vec2(1e-4)) * 0.11;
      float lit = clamp(0.55 + (dn - cloudDens(uv + sd)) * 1.6, 0.0, 1.0);
      vec3 cc = mix(cloudDark, cloudLit, lit * (0.55 + 0.45 * (1.0 - dn)));
      cc += sunColor * pow(s, 6.0) * 0.35 * (1.0 - dn);
      cover = dn * smoothstep(0.0, 0.16, h) * 0.94;
      col = mix(col, cc, cover);
    }
    // mây ti (cao), mỏng, kéo sợi
    vec2 uv2 = d.xz / (h + 0.45) * vec2(0.7, 2.6) + vec2(time*0.0015, 0.0) + 31.0;
    float ci = smoothstep(0.52, 0.85, fbm(uv2)) * smoothstep(0.08, 0.4, h) * (0.22 + cloudAmt * 0.2);
    col = mix(col, cloudLit, ci * (1.0 - cover));
    // sao
    vec3 sp = floor(d * 380.0);
    float st = hash(sp);
    float tw = 0.6 + 0.4*sin(time*2.0 + st*50.0);
    col += vec3(0.9, 0.95, 1.0) * step(0.9982, st) * (0.5 + fract(st*731.0)) * starAmt * tw * smoothstep(0.0, 0.25, h) * (1.0 - cover) * (1.0 - ci);
  }
  gl_FragColor = vec4(clamp(col, 0.0, 60.0), 1.0);
}`;

// Khoá màu theo giờ: [giờ, trời đỉnh, chân trời, nắng, cường độ nắng, cường độ ánh trời]
const KEYS = [
  [0, 0x050b1c, 0x0f1a33, 0x9bb0ff, 0.12, 0.2],
  [4.5, 0x060d22, 0x1a2240, 0x9bb0ff, 0.1, 0.2],
  [5.5, 0x2a3a6a, 0xd9846a, 0xff9a5a, 0.5, 0.32],
  [6.5, 0x4f7fc0, 0xf2c08a, 0xffc890, 2.4, 0.42],
  [9, 0x3f84d8, 0xb9d8ee, 0xffe9c8, 4.1, 0.5],
  [15, 0x3d80d4, 0xc2dcee, 0xffe6c0, 4.1, 0.5],
  [17, 0x5078b8, 0xf2c48a, 0xffb866, 3.1, 0.44],
  [18.1, 0x3b4a82, 0xe57a4f, 0xff7a3a, 1.3, 0.36],
  [19, 0x141d42, 0x5a3f5e, 0xb08aff, 0.25, 0.25],
  [20, 0x070e24, 0x1a2342, 0x9bb0ff, 0.12, 0.2],
  [24, 0x050b1c, 0x0f1a33, 0x9bb0ff, 0.12, 0.2],
];
const KC = KEYS.map((k) => [new THREE.Color(k[1]), new THREE.Color(k[2]), new THREE.Color(k[3])]);
const GRAY = new THREE.Color(0x8a96a0), WHITE = new THREE.Color(0xffffff), MOON = new THREE.Color(0x8aa0ff);

export class Sky {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.uniforms = {
      topColor: { value: new THREE.Color() }, horizonColor: { value: new THREE.Color() }, groundColor: { value: new THREE.Color(0x2a3328) },
      sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunColor: { value: new THREE.Color() }, moonDir: { value: new THREE.Vector3(0, -1, 0) },
      cloudLit: { value: new THREE.Color() }, cloudDark: { value: new THREE.Color() },
      starAmt: { value: 0 }, moonAmt: { value: 0 }, cloudAmt: { value: 0.4 }, time: { value: 0 },
    };
    const mat = new THREE.ShaderMaterial({ uniforms: this.uniforms, vertexShader: vert, fragmentShader: frag, side: THREE.BackSide, depthWrite: false, fog: false });
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(3000, 32, 16), mat);
    this.dome.frustumCulled = false;
    this.dome.renderOrder = -1;
    scene.add(this.dome);

    this.hemi = new THREE.HemisphereLight(0xbfd8ff, 0x4a5a3a, 0.8);
    scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffffff, 2.5);
    this.sun.castShadow = true;
    this.shadowSize = 62; // nửa cạnh vùng có bóng đổ (m)
    const S = this.shadowSize;
    Object.assign(this.sun.shadow.camera, { left: -S, right: S, top: S, bottom: -S, near: 1, far: 420 });
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.0005;
    this.sun.shadow.normalBias = 0.22;
    this.sun.shadow.radius = 2.2;
    scene.add(this.sun);
    scene.add(this.sun.target);

    scene.fog = new THREE.Fog(0xbfdcef, 120, 1300);
    this.night = 0; // 0 ngày → 1 đêm
    this.rain = 0;
    this.sunDir = new THREE.Vector3();
    this.moonDir = new THREE.Vector3();
    this.lightDir = this.sunDir;      // hướng nguồn sáng chính đang dùng (mặt trời hoặc trăng)
    this.top = new THREE.Color(); this.horizon = new THREE.Color(); this.sunColor = new THREE.Color();
    this.sunStrength = 0;             // cường độ nắng/trăng thực tế sau mưa, mây
    this._envTimer = 99;
    this._lastEnvHour = -10;
    // cảnh riêng để tạo envmap cho phản chiếu
    this.envScene = new THREE.Scene();
    this.envDome = new THREE.Mesh(this.dome.geometry, mat);
    this.envScene.add(this.envDome);
    this.pmrem = new THREE.PMREMGenerator(renderer);
    this.envRT = null;
    this._g = new THREE.Color(); this._r = new THREE.Vector3(); this._u = new THREE.Vector3(); this._c = new THREE.Vector3();
  }

  _key(hour) {
    let i = 0;
    while (i < KEYS.length - 2 && KEYS[i + 1][0] <= hour) i++;
    this._ki = i;
    this._kt = (hour - KEYS[i][0]) / (KEYS[i + 1][0] - KEYS[i][0]);
  }
  _col(out, idx) { return out.copy(KC[this._ki][idx]).lerp(KC[this._ki + 1][idx], this._kt); }
  _num(idx) { const a = KEYS[this._ki][idx]; return a + (KEYS[this._ki + 1][idx] - a) * this._kt; }

  update(hour, dt, playerPos, elapsed, camera = null) {
    const u = this.uniforms;
    u.time.value = elapsed;
    this._key(hour);
    const top = this._col(this.top, 0), hor = this._col(this.horizon, 1), sunC = this._col(this.sunColor, 2);
    let sunI = this._num(4), hemiI = this._num(5);
    // mưa: trời xám
    const gray = this._g.copy(GRAY).multiplyScalar(Math.max(0.15, 1 - this.night * 0.85));
    top.lerp(gray, this.rain * 0.75); hor.lerp(gray, this.rain * 0.7);
    sunI *= 1 - this.rain * 0.7;
    u.topColor.value.copy(top); u.horizonColor.value.copy(hor); u.sunColor.value.copy(sunC).multiplyScalar(1 - this.rain * 0.8);
    u.cloudAmt.value = 0.38 + this.rain * 0.62;

    // mặt trời mọc 5h45 ở phía Đông (+x), lặn 18h15 ở phía Tây
    const th = ((hour - 5.75) / 12.5) * Math.PI;
    this.sunDir.set(Math.cos(th), Math.sin(th), 0.38).normalize();
    u.sunDir.value.copy(this.sunDir);
    this.moonDir.set(-Math.cos(th), -Math.sin(th), -0.3).normalize();
    u.moonDir.value.copy(this.moonDir);

    this.night = 1 - Math.min(1, Math.max(0, (this.sunDir.y + 0.08) / 0.3));
    u.starAmt.value = this.night * (1 - this.rain);
    u.moonAmt.value = this.night * (1 - this.rain);
    // mây: mặt đón nắng nhuốm màu nắng lúc bình minh/hoàng hôn, mặt khuất ngả theo màu trời
    const day = 1 - this.night, low = 1 - Math.min(1, Math.max(0, this.sunDir.y * 3));
    u.cloudLit.value.copy(WHITE).lerp(sunC, 0.25 + low * 0.6).multiplyScalar((0.16 + day * 0.92) * (1 - this.rain * 0.45));
    u.cloudDark.value.copy(hor).lerp(top, 0.45).multiplyScalar(0.5 + day * 0.28).lerp(gray, this.rain * 0.6);

    // ánh sáng
    const isMoon = this.sunDir.y <= -0.02;
    const lightDir = this.lightDir = isMoon ? this.moonDir : this.sunDir;
    this.sun.color.copy(isMoon ? MOON : sunC);
    this.sunStrength = isMoon ? 0.4 * (1 - this.rain) : sunI * Math.min(1, (this.sunDir.y + 0.02) * 6);
    this.sun.intensity = this.sunStrength;
    // vùng bóng đổ đặt lệch về phía trước mắt nhìn, bắt theo lưới điểm ảnh của bản đồ bóng để bóng không rung
    const S = this.shadowSize;
    const c = this._c.copy(playerPos);
    if (camera) { c.x -= Math.sin(camera.rotation.y) * S * 0.55; c.z -= Math.cos(camera.rotation.y) * S * 0.55; }
    const r = this._r.set(lightDir.z, 0, -lightDir.x).normalize();
    const up = this._u.crossVectors(lightDir, r).normalize();
    const texel = (2 * S) / this.sun.shadow.mapSize.x;
    const a = Math.round(c.dot(r) / texel) * texel, b = Math.round(c.dot(up) / texel) * texel, d = c.dot(lightDir);
    c.set(r.x * a + up.x * b + lightDir.x * d, r.y * a + up.y * b + lightDir.y * d, r.z * a + up.z * b + lightDir.z * d);
    this.sun.target.position.copy(c);
    this.sun.position.copy(c).addScaledVector(lightDir, 200);
    this.sun.target.updateMatrixWorld();
    this.hemi.intensity = hemiI * (1 - this.rain * 0.25) + 0.06;
    this.hemi.color.copy(top).lerp(WHITE, 0.4);
    this.hemi.groundColor.set(0x5c5546).multiplyScalar(1 - this.night * 0.7);

    this.scene.fog.color.copy(hor).lerp(top, 0.12);
    this.scene.fog.far = 1500 - this.rain * 1100 - this.night * 350;
    this.scene.fog.near = 90 - this.rain * 70;
    this.dome.position.copy(playerPos);

    // cập nhật envmap phản chiếu thỉnh thoảng
    this._envTimer += dt;
    if (this._envTimer > 1.5 && Math.abs(hour - this._lastEnvHour) > 0.2) {
      this._envTimer = 0; this._lastEnvHour = hour;
      const rt = this.pmrem.fromScene(this.envScene, 0, 1, 4000);
      if (this.envRT) this.envRT.dispose();
      this.envRT = rt;
      this.scene.environment = rt.texture;
    }
  }
}
