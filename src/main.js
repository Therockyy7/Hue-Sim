import * as THREE from 'three';
import { Pipeline } from './core/post.js';
import { Physics } from './core/physics.js';
import { Sky } from './core/sky.js';
import { Input } from './core/input.js';
import { Player } from './core/player.js';
import { AudioSys } from './core/audio.js';
import { terrainHeight } from './world/terrain.js';
import { buildWorld, updateWorld } from './world/world.js';
import { People } from './world/people.js';
import { Traffic, River, Lanterns } from './world/vehicles.js';
import { CITADEL, IMPERIAL } from './world/layout.js';
import { Game } from './game/game.js';
import { HUD } from './ui/hud.js';
import { MapArt } from './ui/map.js';

const $ = (s) => document.querySelector(s);
const SETTINGS_KEY = 'dihue-settings';
const defaults = { master: 0.8, music: 0.6, sfx: 0.8, amb: 0.7, sens: 1, fov: 72, quality: 'high', bloom: true };
let settings = { ...defaults };
try { settings = { ...defaults, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; } catch { /* mặc định */ }

// ===== Renderer
const canvas = $('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false; // mỗi khung hình chỉ dựng bóng một lần (dùng chung cho ảnh phản chiếu và cảnh chính)
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(settings.fov, innerWidth / innerHeight, 0.15, 5000);
scene.add(camera);

const pipeline = new Pipeline(renderer, scene, camera);
const bloom = pipeline.bloom;

let W, player, game, people, traffic, river, lanterns;

function resize() {
  if (!innerWidth || !innerHeight) return; // cửa sổ bị ẩn/thu nhỏ
  const q = settings.quality;
  const pr = q === 'low' ? 0.7 : q === 'mid' ? Math.min(devicePixelRatio, 1) : Math.min(devicePixelRatio, 1.75);
  renderer.setPixelRatio(pr);
  renderer.setSize(innerWidth, innerHeight, false);
  pipeline.setSize(innerWidth, innerHeight, pr);
  if (W) W.water.setSize(innerWidth * pr, innerHeight * pr);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

const physics = new Physics(terrainHeight);
const sky = new Sky(scene, renderer);
const input = new Input(canvas);
const audio = new AudioSys();
const hud = new HUD();

function applySettings(st) {
  settings = st;
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(st)); } catch { /* bỏ qua */ }
  Object.assign(audio.vol, { master: st.master, music: st.music, sfx: st.sfx, amb: st.amb });
  audio.applyVolumes();
  if (player) player.sens = 0.0022 * st.sens;
  if (game) { game.baseFov = st.fov; if (!game.photo) { camera.fov = st.fov; camera.updateProjectionMatrix(); } }
  bloom.enabled = st.bloom;
  renderer.shadowMap.enabled = st.quality !== 'low';
  sky.sun.castShadow = st.quality !== 'low';
  const ms = st.quality === 'high' ? 2048 : 1024;
  if (sky.sun.shadow.mapSize.x !== ms) { sky.sun.shadow.mapSize.set(ms, ms); if (sky.sun.shadow.map) { sky.sun.shadow.map.dispose(); sky.sun.shadow.map = null; } }
  resize();
}


async function boot() {
  const bar = $('.ld-bar i'), txt = $('.ld-text');
  // biển hiệu vẽ bằng canvas cần phông chữ đã tải xong (chờ tối đa 1,5 giây)
  if (document.fonts && document.fonts.load) await Promise.race([Promise.all([document.fonts.load('700 48px "Be Vietnam Pro"'), document.fonts.load('700 48px "Cormorant Garamond"')]).catch(() => {}), new Promise((r) => setTimeout(r, 1500))]);
  W = await buildWorld(scene, physics, (p, t) => { bar.style.width = (p * 100).toFixed(0) + '%'; txt.textContent = t; });
  people = new People(scene, W.mats.dyn, physics);
  traffic = new Traffic(W);
  river = new River(W);
  lanterns = new Lanterns(W);
  player = new Player(camera, physics);
  game = new Game({ scene, camera, renderer, W, physics, player, input, audio, sky, people, traffic, river, lanterns, hud });
  hud.game = game;
  hud.map = new MapArt(W);
  if (import.meta.env.DEV) window.DIHUE = { THREE, game, player, W, sky, camera, scene, renderer, people, audio, pipeline, frame: (n = 1, dt = 1 / 30) => { for (let i = 0; i < n; i++) frame(dt); } };
  applySettings(settings);
  input.onUnlock = () => { if ((game.mode === 'play' || game.mode === 'ride') && !hud.modalOpen()) openPause(); };
  setupMenus();
  // biên dịch shader trước để tránh giật
  sky.update(17.3, 0.016, camera.position, 0);
  renderer.compile(scene, camera);
  $('#loading').classList.add('done');
  setTimeout(() => $('#loading').remove(), 900);
  toTitle();
  requestAnimationFrame(loop);
}

// ===== Menu chính & tạm dừng
function toTitle() {
  game.mode = 'title';
  hud.show(false);
  hud.closeModal();
  hud.closeDialog();
  input.unlock();
  $('#title').classList.remove('hidden');
  $('#btn-continue').classList.toggle('hidden', !game.hasSave());
  $('#btn-new').classList.toggle('primary', !game.hasSave());
  audio.setMusic('title');
}
function startPlay(load) {
  audio.init();
  audio.setMusic('off');
  $('#title').classList.add('hidden');
  hud.show(true);
  if (load) game.loadGame(); else game.newGame();
}
function setupMenus() {
  $('#btn-new').onclick = () => {
    if (game.hasSave() && !confirm('Bắt đầu chuyến đi mới sẽ xóa hành trình đã lưu. Tiếp tục?')) return;
    startPlay(false);
  };
  $('#btn-continue').onclick = () => startPlay(true);
  $('#btn-help').onclick = () => { audio.init(); hud.openHelp(null); };
  $('#btn-settings').onclick = () => { audio.init(); hud.openSettings({ ...settings }, applySettings, null); };
  $('#title').addEventListener('pointerdown', () => { audio.init(); }, { once: true });
  $('#tb-pause').addEventListener('touchstart', (e) => { e.preventDefault(); if (game.mode === 'play' || game.mode === 'ride') openPause(); });
  canvas.addEventListener('click', () => { if ((game.mode === 'play' || game.mode === 'ride') && !input.locked) input.lock(); });
}
function openPause() {
  game.openUI();
  const back = () => game.closeUI();
  const sub = (fn) => () => { hud.onModalClose = null; fn(); };
  hud.openPause({
    onClose: back,
    resume: () => hud.closeModal(),
    journal: sub(() => hud.openJournal(back)),
    map: sub(() => hud.openMap(false, back)),
    settings: sub(() => hud.openSettings({ ...settings }, applySettings, back)),
    help: sub(() => hud.openHelp(back)),
    save: () => game.save(true),
    quit: sub(() => { game.save(); hud.closeModal(); toTitle(); }),
  });
}

// ===== Vòng lặp
const clock = new THREE.Clock();
let elapsed = 0, titleA = 0;
const lockHint = document.createElement('div');
lockHint.style.cssText = 'position:fixed;left:50%;top:58%;transform:translateX(-50%);z-index:12;padding:8px 16px;border-radius:999px;background:rgba(22,12,36,.7);border:1px solid rgba(226,180,83,.4);font-size:14px;pointer-events:none;display:none';
lockHint.textContent = 'Bấm chuột vào màn hình để điều khiển';
document.body.appendChild(lockHint);

function zoneMusic(p) {
  if (p.x > IMPERIAL.x0 && p.x < IMPERIAL.x1 && p.z > IMPERIAL.z0 && p.z < IMPERIAL.z1) return 'explore';
  if (Math.hypot(p.x + 340, p.z + 115) < 40) return 'explore';
  if (p.x > -280 && p.x < -220 && p.z > 285) return 'explore';
  return 'off';
}

function loop() {
  requestAnimationFrame(loop);
  frame(Math.min(0.05, clock.getDelta()));
}
function frame(dt) {
  elapsed += dt;
  let hour;
  if (game.mode === 'title') {
    titleA += dt * 0.025;
    const a = 1.25 + Math.sin(titleA) * 0.55;
    const C = new THREE.Vector3(-10, 4, -70);
    camera.position.set(C.x + Math.cos(a) * 200, 42 + Math.sin(titleA * 0.7) * 6, C.z + Math.sin(a) * 200);
    camera.lookAt(C);
    hour = 17.25;
  } else {
    game.update(dt);
    hour = game.state.time;
    hud.frame(dt, game);
    if (game.mode === 'play') audio.setMusic(zoneMusic(player.pos));
  }
  const camPos = camera.position;
  sky.update(hour, dt, game.mode === 'title' ? camPos : player.pos, elapsed, camera);
  updateWorld(W, dt, elapsed, sky, camPos);
  people.update(dt, game.mode === 'title' ? camPos : player.pos, elapsed);
  traffic.update(dt, player, game.mode === 'play' ? audio : null);
  river.update(dt, elapsed);
  lanterns.update(dt, elapsed);
  bloom.strength = 0.25 + sky.night * 0.75;
  if (audio.ctx && game.mode !== 'title') {
    const p = player.pos;
    audio.updateAmbience(dt, {
      wind: 0.3 + sky.rain * 0.5, river: Math.max(0, 1 - (Math.abs(p.z) - 40) / 70), city: p.z > 60 || (p.x > 60 && p.z < -60) ? 1 : 0.35,
      rain: sky.rain, night: sky.night, trees: 1,
    });
  }
  const showHint = !input.touchMode && (game.mode === 'play' || game.mode === 'ride') && !input.locked && !hud.modalOpen();
  lockHint.style.display = showHint ? 'block' : 'none';
  if (innerWidth && innerHeight) {
    renderer.shadowMap.needsUpdate = true;
    W.water.render(renderer, scene, camera);
    pipeline.render(elapsed);
  }
  if (game.pendingCapture) game.capture();
  input.endFrame();
}

boot().catch((e) => {
  console.error(e);
  $('.ld-text').textContent = 'Lỗi khi tải: ' + e.message;
});
