// Chuỗi dựng hình: cảnh (MSAA + depth) → bóng tiếp xúc (SSAO nửa độ phân giải) → bloom → tone map + chỉnh màu
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

const VERT = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const AO_FRAG = /* glsl */`
uniform sampler2D tDepth; uniform vec2 uRes; uniform mat4 uProj; uniform mat4 uProjInv;
uniform float uRadius; uniform float uIntensity;
varying vec2 vUv;
vec3 vpos(vec2 uv){
  float d = texture2D(tDepth, uv).x;
  vec4 v = uProjInv * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
  return v.xyz / v.w;
}
void main(){
  float d = texture2D(tDepth, vUv).x;
  if (d >= 0.99999) { gl_FragColor = vec4(1.0); return; }
  vec3 p = vpos(vUv);
  vec2 px = 1.0 / uRes;
  vec3 pr = vpos(vUv + vec2(px.x, 0.0)), pl = vpos(vUv - vec2(px.x, 0.0));
  vec3 pu = vpos(vUv + vec2(0.0, px.y)), pd = vpos(vUv - vec2(0.0, px.y));
  vec3 dx = abs(pr.z - p.z) < abs(p.z - pl.z) ? pr - p : p - pl;
  vec3 dy = abs(pu.z - p.z) < abs(p.z - pd.z) ? pu - p : p - pd;
  vec3 n = normalize(cross(dx, dy));
  float dist = -p.z;
  float rad = uRadius * (1.0 + dist * 0.03);
  float ruv = min(rad * uProj[1][1] / dist * 0.5, 0.1);
  float noise = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  float occ = 0.0;
  const int NSAMP = 10;
  for (int i = 0; i < NSAMP; i++) {
    float fi = (float(i) + 0.5) / float(NSAMP);
    float a = float(i) * 2.399963 + noise * 6.2831853;
    vec2 o = vec2(cos(a), sin(a)) * ruv * sqrt(fi);
    o.x *= uRes.y / uRes.x;
    vec3 v = vpos(vUv + o) - p;
    float l = length(v) + 1e-4;
    occ += max(dot(n, v) / l - 0.1, 0.0) * (1.0 - smoothstep(rad * 0.6, rad * 1.6, l));
  }
  float ao = clamp(1.0 - uIntensity * occ / float(NSAMP), 0.0, 1.0);
  ao = mix(ao, 1.0, smoothstep(90.0, 200.0, dist));
  gl_FragColor = vec4(ao, ao, ao, 1.0);
}`;

// làm mờ 3×3 có xét độ sâu để xoá nhiễu mà không lem qua mép vật
const BLUR_FRAG = /* glsl */`
uniform sampler2D tAO; uniform sampler2D tDepth; uniform vec2 uRes; uniform float uNear; uniform float uFar;
varying vec2 vUv;
float lin(float d){ return uNear * uFar / (uFar - d * (uFar - uNear)); }
void main(){
  float zc = lin(texture2D(tDepth, vUv).x);
  float s = 0.0, w = 0.0;
  for (int y = -1; y <= 2; y++) for (int x = -1; x <= 2; x++) {
    vec2 uv = vUv + (vec2(float(x), float(y)) - 0.5) / uRes;
    float k = 1.0 / (1.0 + abs(lin(texture2D(tDepth, uv).x) - zc) * 6.0 / (0.3 + zc * 0.05));
    s += texture2D(tAO, uv).r * k; w += k;
  }
  gl_FragColor = vec4(vec3(s / w), 1.0);
}`;

const CombineShader = {
  uniforms: { tScene: { value: null }, tAO: { value: null }, uAO: { value: 1 } },
  vertexShader: VERT,
  fragmentShader: /* glsl */`
uniform sampler2D tScene; uniform sampler2D tAO; uniform float uAO; varying vec2 vUv;
void main(){
  vec3 c = texture2D(tScene, vUv).rgb;
  float ao = mix(1.0, texture2D(tAO, vUv).r, uAO);
  // vùng rất sáng (đèn, bầu trời) ít bị AO làm tối
  float l = max(c.r, max(c.g, c.b));
  ao = mix(ao, 1.0, smoothstep(1.2, 3.0, l));
  gl_FragColor = vec4(c * ao, 1.0);
}`,
};

const FinalShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uExposure: { value: 1 }, uSat: { value: 1.08 }, uContrast: { value: 0.22 }, uVig: { value: 0.32 }, uWarm: { value: 0 } },
  vertexShader: VERT,
  fragmentShader: /* glsl */`
uniform sampler2D tDiffuse; uniform float uTime; uniform float uExposure; uniform float uSat; uniform float uContrast; uniform float uVig; uniform float uWarm;
varying vec2 vUv;
vec3 RRTAndODTFit(vec3 v){ vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
vec3 aces(vec3 color){
  const mat3 I = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
  const mat3 O = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
  color *= uExposure / 0.6;
  color = I * color; color = RRTAndODTFit(color); color = O * color;
  return clamp(color, 0.0, 1.0);
}
vec3 toSRGB(vec3 c){ return mix(pow(c, vec3(0.41666)) * 1.055 - 0.055, c * 12.92, vec3(lessThanEqual(c, vec3(0.0031308)))); }
void main(){
  vec3 c = aces(texture2D(tDiffuse, vUv).rgb);
  c = toSRGB(c);
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(vec3(l), c, uSat);
  c = mix(c, c * c * (3.0 - 2.0 * c), uContrast);
  // tách tông: vùng tối ngả lam, vùng sáng ngả ấm
  c += (vec3(-0.012, 0.0, 0.02) * (1.0 - l) + vec3(0.02, 0.008, -0.016) * l) * (1.0 + uWarm);
  vec2 q = vUv - 0.5;
  c *= 1.0 - uVig * pow(dot(q, q) * 2.0, 1.3);
  float n = fract(sin(dot(gl_FragCoord.xy + fract(uTime) * 61.0, vec2(12.9898, 78.233))) * 43758.5453);
  gl_FragColor = vec4(c + (n - 0.5) / 255.0, 1.0);
}`,
};

export class Pipeline {
  constructor(renderer, scene, camera) {
    this.renderer = renderer; this.scene = scene; this.camera = camera;
    renderer.toneMapping = THREE.NoToneMapping; // tone map làm ở bước cuối
    this.samples = 4;
    this.ao = true;
    this.w = 2; this.h = 2; this.pr = 1;
    this.aoMat = new THREE.ShaderMaterial({
      uniforms: { tDepth: { value: null }, uRes: { value: new THREE.Vector2() }, uProj: { value: new THREE.Matrix4() }, uProjInv: { value: new THREE.Matrix4() }, uRadius: { value: 0.7 }, uIntensity: { value: 1.9 } },
      vertexShader: VERT, fragmentShader: AO_FRAG, depthTest: false, depthWrite: false,
    });
    this.blurMat = new THREE.ShaderMaterial({
      uniforms: { tAO: { value: null }, tDepth: { value: null }, uRes: { value: new THREE.Vector2() }, uNear: { value: 0.1 }, uFar: { value: 5000 } },
      vertexShader: VERT, fragmentShader: BLUR_FRAG, depthTest: false, depthWrite: false,
    });
    this.quad = new FullScreenQuad(this.aoMat);
    this.aoRT = new THREE.WebGLRenderTarget(2, 2, { depthBuffer: false });
    this.aoRT2 = new THREE.WebGLRenderTarget(2, 2, { depthBuffer: false });
    this.composer = new EffectComposer(renderer);
    this.combine = new ShaderPass(CombineShader, 'unused');
    this.bloom = new UnrealBloomPass(new THREE.Vector2(2, 2), 0.5, 0.55, 0.92);
    this.final = new ShaderPass(FinalShader);
    this.composer.addPass(this.combine);
    this.composer.addPass(this.bloom);
    this.composer.addPass(this.final);
    this._makeSceneRT();
  }

  _makeSceneRT() {
    if (this.sceneRT) { this.sceneRT.depthTexture.dispose(); this.sceneRT.dispose(); }
    const W = Math.max(2, Math.round(this.w * this.pr)), H = Math.max(2, Math.round(this.h * this.pr));
    this.sceneRT = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: this.samples, depthTexture: new THREE.DepthTexture(W, H) });
    this._samplesMade = this.samples;
    const aw = Math.max(2, W >> 1), ah = Math.max(2, H >> 1);
    this.aoRT.setSize(aw, ah); this.aoRT2.setSize(aw, ah);
    this.aoMat.uniforms.uRes.value.set(aw, ah);
    this.blurMat.uniforms.uRes.value.set(aw, ah);
  }

  setSize(w, h, pr) {
    this.w = w; this.h = h; this.pr = pr;
    this.composer.setPixelRatio(pr);
    this.composer.setSize(w, h);
    this._makeSceneRT();
  }
  setQuality({ samples, ao }) {
    this.ao = ao;
    if (samples !== this._samplesMade) { this.samples = samples; this._makeSceneRT(); }
  }

  render(time = 0) {
    const r = this.renderer, cam = this.camera;
    r.setRenderTarget(this.sceneRT);
    r.render(this.scene, cam);
    const depth = this.sceneRT.depthTexture;
    if (this.ao) {
      const u = this.aoMat.uniforms;
      u.tDepth.value = depth; u.uProj.value.copy(cam.projectionMatrix); u.uProjInv.value.copy(cam.projectionMatrixInverse);
      this.quad.material = this.aoMat; r.setRenderTarget(this.aoRT); this.quad.render(r);
      const b = this.blurMat.uniforms;
      b.tAO.value = this.aoRT.texture; b.tDepth.value = depth; b.uNear.value = cam.near; b.uFar.value = cam.far;
      this.quad.material = this.blurMat; r.setRenderTarget(this.aoRT2); this.quad.render(r);
    }
    const c = this.combine.uniforms;
    c.tScene.value = this.sceneRT.texture; c.tAO.value = this.aoRT2.texture; c.uAO.value = this.ao ? 1 : 0;
    this.final.uniforms.uTime.value = time;
    this.composer.render();
  }
}
