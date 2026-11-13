// Mặt nước sông Hương: phản chiếu phẳng (vẽ cảnh lần hai qua camera đối xứng), Fresnel, gợn sóng, lấp lánh nắng/trăng
import * as THREE from 'three';
import { RIVER } from './layout.js';

const VERT = /* glsl */`
uniform mat4 uTexMat;
varying vec3 vW; varying vec4 vR;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz; vR = uTexMat * w;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const FRAG = /* glsl */`
uniform sampler2D tRefl; uniform sampler2D tNormal;
uniform float uTime; uniform float uRefl; uniform float uRain; uniform float uHalf;
uniform vec3 uSunDir; uniform vec3 uSunColor; uniform vec3 uDeep; uniform vec3 uShallow; uniform vec3 uLight; uniform vec3 uSky;
uniform vec3 uFogColor; uniform float uFogNear; uniform float uFogFar;
varying vec3 vW; varying vec4 vR;
void main(){
  vec3 V = cameraPosition - vW;
  float dist = length(V); V /= dist;
  vec2 p = vW.xz;
  vec2 n1 = texture2D(tNormal, p * 0.045 + vec2(uTime * 0.010, uTime * 0.004)).xy * 2.0 - 1.0;
  vec2 n2 = texture2D(tNormal, p * 0.13 + vec2(-uTime * 0.016, uTime * 0.009)).xy * 2.0 - 1.0;
  vec2 n3 = texture2D(tNormal, p * 0.008 + vec2(uTime * 0.002, -uTime * 0.001)).xy * 2.0 - 1.0;
  vec2 n4 = texture2D(tNormal, p * 0.55 + vec2(uTime * 0.06, -uTime * 0.08)).xy * 2.0 - 1.0;
  float near = 1.0 / (1.0 + dist * 0.012);
  vec2 nn = n1 * 0.55 + n2 * 0.4 * near + n3 * 0.4 + n4 * uRain * 0.7 * near;
  vec3 N = normalize(vec3(nn.x * 0.45, 1.0, nn.y * 0.45));
  float ndv = max(dot(N, V), 0.0);
  float fres = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);
  vec2 ruv = vR.xy / vR.w + nn * 0.045 * clamp(10.0 / dist, 0.12, 1.0);
  vec3 refl = mix(uSky, texture2D(tRefl, ruv).rgb, uRefl);
  float shore = smoothstep(uHalf - 16.0, uHalf, abs(vW.z));
  vec3 body = mix(uDeep, uShallow, shore * 0.8) * uLight;
  vec3 H = normalize(V + uSunDir);
  float nh = max(dot(N, H), 0.0);
  float spec = pow(nh, 480.0) * 7.0 + pow(nh, 70.0) * 0.22;
  vec3 col = mix(body, refl, fres) + uSunColor * spec * (1.0 - uRain * 0.8);
  col = mix(col, uFogColor, smoothstep(uFogNear, uFogFar, dist));
  gl_FragColor = vec4(col, 1.0);
}`;

const _n = new THREE.Vector3(0, 1, 0), _p = new THREE.Vector3(), _t = new THREE.Vector3(), _up = new THREE.Vector3();
const _rot = new THREE.Matrix4(), _plane = new THREE.Plane(), _clip = new THREE.Vector4(), _q = new THREE.Vector4();
const _fr = new THREE.Frustum(), _pm = new THREE.Matrix4();

export class Water {
  constructor(W, normalMap) {
    this.reflect = true;
    this.scale = 0.5;
    this.rt = new THREE.WebGLRenderTarget(512, 512, { type: THREE.HalfFloatType });
    this.cam = new THREE.PerspectiveCamera();
    this.texMat = new THREE.Matrix4();
    this.uniforms = {
      tRefl: { value: this.rt.texture }, tNormal: { value: normalMap }, uTexMat: { value: this.texMat },
      uTime: { value: 0 }, uRefl: { value: 1 }, uRain: { value: 0 }, uHalf: { value: RIVER.half },
      uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunColor: { value: new THREE.Color() },
      uDeep: { value: new THREE.Color(0x16423e) }, uShallow: { value: new THREE.Color(0x4a7a5e) },
      uLight: { value: new THREE.Color() }, uSky: { value: new THREE.Color() },
      uFogColor: { value: new THREE.Color() }, uFogNear: { value: 100 }, uFogFar: { value: 1500 },
    };
    const g = new THREE.PlaneGeometry(2200, RIVER.half * 2 + 6, 1, 1);
    g.rotateX(-Math.PI / 2);
    this.mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: this.uniforms, vertexShader: VERT, fragmentShader: FRAG }));
    this.mesh.position.set(-65, RIVER.water, 0);
    this.mesh.updateMatrixWorld();
    this.box = new THREE.Box3().setFromObject(this.mesh);
    W.scene.add(this.mesh);
    this.hide = []; // các vật không cần hiện trong ảnh phản chiếu (mưa, hơi nước…)
  }

  setSize(w, h) { this.rt.setSize(Math.max(2, Math.round(w * this.scale)), Math.max(2, Math.round(h * this.scale))); }

  update(t, sky, scene) {
    const u = this.uniforms;
    u.uTime.value = t;
    u.uRain.value = sky.rain;
    u.uSunDir.value.copy(sky.lightDir);
    u.uSunColor.value.copy(sky.sun.color).multiplyScalar(Math.min(1, sky.sunStrength * 0.45) * (sky.lightDir === sky.sunDir ? 1 : 0.5));
    const k = sky.sunStrength * Math.max(0, sky.lightDir.y) * 0.22, sc = sky.sun.color, L = u.uLight.value;
    L.copy(sky.hemi.color).multiplyScalar(sky.hemi.intensity * 0.5);
    L.r += sc.r * k; L.g += sc.g * k; L.b += sc.b * k;
    u.uSky.value.copy(sky.horizon).lerp(sky.top, 0.5);
    u.uFogColor.value.copy(scene.fog.color); u.uFogNear.value = scene.fog.near; u.uFogFar.value = scene.fog.far;
  }

  // vẽ ảnh phản chiếu; gọi trước khi vẽ cảnh chính
  render(renderer, scene, camera) {
    const h = RIVER.water;
    camera.updateMatrixWorld();
    _pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    _fr.setFromProjectionMatrix(_pm);
    const cp = _p.setFromMatrixPosition(camera.matrixWorld);
    if (!this.reflect || cp.y <= h + 0.05) { this.uniforms.uRefl.value = 0; return false; }
    this.uniforms.uRefl.value = 1;
    if (!_fr.intersectsBox(this.box)) return false; // không nhìn thấy sông thì khỏi vẽ
    const cam = this.cam;
    _rot.extractRotation(camera.matrixWorld);
    _t.set(0, 0, -1).applyMatrix4(_rot).add(cp);
    cam.position.set(cp.x, 2 * h - cp.y, cp.z);
    _up.set(0, 1, 0).applyMatrix4(_rot); _up.y = -_up.y;
    cam.up.copy(_up);
    cam.lookAt(_t.x, 2 * h - _t.y, _t.z);
    cam.near = camera.near; cam.far = camera.far;
    cam.updateMatrixWorld();
    cam.projectionMatrix.copy(camera.projectionMatrix);
    this.texMat.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    this.texMat.multiply(cam.projectionMatrix).multiply(cam.matrixWorldInverse);
    // cắt xiên mặt gần theo mặt nước để vật dưới nước không lọt vào ảnh
    _plane.setFromNormalAndCoplanarPoint(_n, _p.set(0, h, 0)).applyMatrix4(cam.matrixWorldInverse);
    _clip.set(_plane.normal.x, _plane.normal.y, _plane.normal.z, _plane.constant);
    const pe = cam.projectionMatrix.elements;
    _q.set((Math.sign(_clip.x) + pe[8]) / pe[0], (Math.sign(_clip.y) + pe[9]) / pe[5], -1, (1 + pe[10]) / pe[14]);
    _clip.multiplyScalar(2 / _clip.dot(_q));
    pe[2] = _clip.x; pe[6] = _clip.y; pe[10] = _clip.z + 1 - 0.003; pe[14] = _clip.w;
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();

    const old = renderer.getRenderTarget();
    this.mesh.visible = false;
    const vis = this.hide.map((o) => o.visible);
    for (const o of this.hide) o.visible = false;
    renderer.setRenderTarget(this.rt);
    renderer.render(scene, cam);
    renderer.setRenderTarget(old);
    this.hide.forEach((o, i) => { o.visible = vis[i]; });
    this.mesh.visible = true;
    return true;
  }
}
