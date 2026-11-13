// Người chơi góc nhìn thứ nhất: đi bộ, chạy, nhảy, đạp xe; va chạm và leo bậc
import * as THREE from 'three';
import { WORLD } from '../world/layout.js';

const STEP = 0.75;

export class Player {
  constructor(camera, physics) {
    this.camera = camera;
    this.physics = physics;
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.yaw = 0; this.pitch = 0;
    this.eye = 1.62; this.radius = 0.35; this.height = 1.75;
    this.onGround = true;
    this.mode = 'walk'; // walk | bike | ride | frozen
    this.sens = 0.0022;
    this.bobPhase = 0; this.bob = 0; this.stepAcc = 0;
    this.surface = 'ground';
    this.lastSafe = new THREE.Vector3();
    this.safeT = 0;
    this.distance = 0;
    camera.rotation.order = 'YXZ';
    this.bike = this._makeBike();
    this.bike.visible = false;
    camera.add(this.bike);
  }

  _makeBike() {
    const g = new THREE.Group();
    const m = new THREE.MeshStandardMaterial({ color: 0x2d6fb0, roughness: 0.5, metalness: 0.4 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 });
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.62, 8), dark);
    bar.rotation.z = Math.PI / 2; bar.position.set(0, -0.42, -0.55);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.35, 8), m);
    stem.position.set(0, -0.6, -0.62); stem.rotation.x = 0.3;
    const basket = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.18, 0.24), new THREE.MeshStandardMaterial({ color: 0x9a7a4a, roughness: 0.9 }));
    basket.position.set(0, -0.62, -0.82);
    const flower = new THREE.Mesh(new THREE.IcosahedronGeometry(0.06, 0), new THREE.MeshStandardMaterial({ color: 0xd84a6a }));
    flower.position.set(0.08, -0.5, -0.8);
    for (const s of [-1, 1]) {
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.12, 8), dark);
      grip.rotation.z = Math.PI / 2; grip.position.set(s * 0.3, -0.42, -0.55);
      g.add(grip);
    }
    g.add(bar, stem, basket, flower);
    g.traverse(o => { o.renderOrder = 10; });
    return g;
  }

  setPosition(x, z, yaw = null) {
    this.pos.set(x, 0, z);
    this.pos.y = this.physics.groundAt(x, z, 100).h;
    this.vel.set(0, 0, 0);
    if (yaw !== null) this.yaw = yaw;
    this.lastSafe.copy(this.pos);
  }

  update(dt, input, opts = {}) {
    // nhìn
    const lookScale = opts.photo ? 0.55 : 1;
    this.yaw -= input.dx * this.sens * lookScale;
    this.pitch -= input.dy * this.sens * lookScale;
    this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch));

    if (this.mode === 'ride' || this.mode === 'frozen') {
      this._applyCam(dt, 0);
      return { moved: 0 };
    }
    const mv = input.move;
    const running = input.down('ShiftLeft') || input.down('ShiftRight') || input.down('Run');
    const bike = this.mode === 'bike';
    const speed = bike ? (running ? 13 : 10) : running ? 7.2 : 4.2;
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    let wx = -sin * mv.f + cos * mv.s, wz = -cos * mv.f - sin * mv.s;
    const wl = Math.hypot(wx, wz);
    if (wl > 1) { wx /= wl; wz /= wl; }
    const acc = this.onGround ? (bike ? 3.5 : 10) : 2;
    this.vel.x += (wx * speed - this.vel.x) * Math.min(1, dt * acc);
    this.vel.z += (wz * speed - this.vel.z) * Math.min(1, dt * acc);

    const ox = this.pos.x, oz = this.pos.z;
    const wasGround = this.onGround;
    this.pos.x += this.vel.x * dt; this.pos.z += this.vel.z * dt;
    for (let i = 0; i < 2; i++) this.physics.resolve(this.pos, this.radius, this.height);
    // không leo được vách quá cao
    let g = this.physics.groundAt(this.pos.x, this.pos.z, this.pos.y, STEP);
    if (g.h - this.pos.y > STEP) {
      const nx = this.pos.x, nz = this.pos.z;
      this.pos.x = nx; this.pos.z = oz;
      if (this.physics.groundAt(this.pos.x, this.pos.z, this.pos.y, STEP).h - this.pos.y > STEP) {
        this.pos.x = ox; this.pos.z = nz;
        if (this.physics.groundAt(this.pos.x, this.pos.z, this.pos.y, STEP).h - this.pos.y > STEP) { this.pos.x = ox; this.pos.z = oz; }
      }
      g = this.physics.groundAt(this.pos.x, this.pos.z, this.pos.y, STEP);
    }
    // giới hạn bản đồ
    this.pos.x = Math.max(WORLD.minX + 3, Math.min(WORLD.maxX - 3, this.pos.x));
    this.pos.z = Math.max(WORLD.minZ + 3, Math.min(WORLD.maxZ - 3, this.pos.z));

    // trọng lực & nhảy
    if (this.onGround && input.hit('Space') && !bike) { this.vel.y = 6.0; this.onGround = false; }
    this.vel.y -= 22 * dt;
    this.pos.y += this.vel.y * dt;
    g = this.physics.groundAt(this.pos.x, this.pos.z, this.pos.y, STEP);
    if (this.pos.y <= g.h) { this.pos.y = g.h; this.vel.y = 0; this.onGround = true; }
    else if (wasGround && this.vel.y <= 0 && this.pos.y - g.h < 0.6) { this.pos.y = g.h; this.vel.y = 0; this.onGround = true; }
    else this.onGround = false;
    this.surface = g.surface;

    const moved = Math.hypot(this.pos.x - ox, this.pos.z - oz);
    this.distance += moved;
    // điểm an toàn (khi rơi xuống sông)
    this.safeT += dt;
    if (this.onGround && this.pos.y > -0.6 && this.safeT > 1) { this.lastSafe.copy(this.pos); this.safeT = 0; }
    let fell = false;
    if (this.pos.y < -1.2) { this.pos.copy(this.lastSafe); this.vel.set(0, 0, 0); fell = true; }

    // nhún bước chân
    let step = false;
    if (this.onGround && moved > 0.001) {
      const stride = bike ? 3.2 : running ? 1.05 : 0.78;
      this.stepAcc += moved;
      this.bobPhase += moved / stride * Math.PI;
      if (this.stepAcc > stride) { this.stepAcc = 0; step = !bike; }
    }
    const spd = Math.hypot(this.vel.x, this.vel.z);
    this.bob += ((this.onGround ? Math.min(1, spd / 5) : 0) - this.bob) * Math.min(1, dt * 6);
    this._applyCam(dt, this.bob * (bike ? 0.25 : 1));
    return { moved, step, running, fell };
  }

  _applyCam(dt, bobAmt) {
    const by = Math.abs(Math.sin(this.bobPhase)) * 0.06 * bobAmt;
    const bx = Math.cos(this.bobPhase) * 0.03 * bobAmt;
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    this.camera.position.set(this.pos.x + cos * bx, this.pos.y + this.eye + by, this.pos.z - sin * bx);
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }

  forward() { return new THREE.Vector3(-Math.sin(this.yaw) * Math.cos(this.pitch), Math.sin(this.pitch), -Math.cos(this.yaw) * Math.cos(this.pitch)); }
}
