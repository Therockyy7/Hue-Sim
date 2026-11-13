// Bàn phím, chuột (pointer lock) và điều khiển cảm ứng
export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressed = new Set();
    this.dx = 0; this.dy = 0; this.wheel = 0;
    this.locked = false;
    this.click = false;
    this.joy = { x: 0, y: 0 };
    this.touchMode = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    this.onUnlock = null;
    this.enabled = true;

    addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
      if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());
    document.addEventListener('pointerlockchange', () => {
      const was = this.locked;
      this.locked = document.pointerLockElement === canvas;
      if (was && !this.locked && this.onUnlock) this.onUnlock();
    });
    addEventListener('mousemove', (e) => {
      if (!this.locked) return;
      this.dx += e.movementX; this.dy += e.movementY;
    });
    addEventListener('wheel', (e) => { if (this.locked) this.wheel += e.deltaY; }, { passive: true });
    canvas.addEventListener('mousedown', (e) => {
      if (this.locked && e.button === 0) this.click = true;
    });
    if (this.touchMode) this._setupTouch();
  }

  lock() {
    if (this.touchMode) return;
    try { const p = this.canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* bỏ qua */ }
  }
  unlock() { if (document.pointerLockElement) document.exitPointerLock(); }

  down(code) { return this.enabled && this.keys.has(code); }
  hit(code) { return this.enabled && this.pressed.has(code); }
  endFrame() { this.pressed.clear(); this.dx = 0; this.dy = 0; this.wheel = 0; this.click = false; }

  get move() {
    let f = 0, s = 0;
    if (this.down('KeyW') || this.down('ArrowUp')) f += 1;
    if (this.down('KeyS') || this.down('ArrowDown')) f -= 1;
    if (this.down('KeyD') || this.down('ArrowRight')) s += 1;
    if (this.down('KeyA') || this.down('ArrowLeft')) s -= 1;
    f += -this.joy.y; s += this.joy.x;
    return { f: Math.max(-1, Math.min(1, f)), s: Math.max(-1, Math.min(1, s)) };
  }

  _setupTouch() {
    document.body.classList.add('touch');
    const joyEl = document.getElementById('joy'), knob = document.getElementById('joy-knob');
    let joyId = null, lookId = null, jx = 0, jy = 0, lx = 0, ly = 0;
    const R = 50;
    const area = document.getElementById('touch-look');
    joyEl.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0]; joyId = t.identifier;
      const r = joyEl.getBoundingClientRect(); jx = r.left + r.width / 2; jy = r.top + r.height / 2;
      e.preventDefault();
    }, { passive: false });
    area.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0]; lookId = t.identifier; lx = t.clientX; ly = t.clientY; e.preventDefault();
    }, { passive: false });
    addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === joyId) {
          let x = t.clientX - jx, y = t.clientY - jy;
          const d = Math.hypot(x, y);
          if (d > R) { x *= R / d; y *= R / d; }
          this.joy.x = x / R; this.joy.y = y / R;
          knob.style.transform = `translate(${x}px, ${y}px)`;
        } else if (t.identifier === lookId) {
          this.dx += (t.clientX - lx) * 2.2; this.dy += (t.clientY - ly) * 2.2;
          lx = t.clientX; ly = t.clientY;
        }
      }
    }, { passive: false });
    const end = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === joyId) { joyId = null; this.joy.x = this.joy.y = 0; knob.style.transform = ''; }
        if (t.identifier === lookId) lookId = null;
      }
    };
    addEventListener('touchend', end); addEventListener('touchcancel', end);
    document.querySelectorAll('[data-key]').forEach((btn) => {
      const code = btn.dataset.key;
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        if (btn.dataset.toggle) { if (this.keys.has(code)) this.keys.delete(code); else this.keys.add(code); btn.classList.toggle('on', this.keys.has(code)); }
        else { this.keys.add(code); this.pressed.add(code); }
        if (code === 'Mouse0') this.click = true;
      }, { passive: false });
      btn.addEventListener('touchend', (e) => { e.preventDefault(); if (!btn.dataset.toggle) this.keys.delete(code); }, { passive: false });
    });
  }
}
