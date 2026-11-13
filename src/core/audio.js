// Âm thanh tổng hợp hoàn toàn bằng Web Audio: không cần file âm thanh.
// Gồm: nền (gió, sông, mưa, chim, dế), bước chân, chuông chùa, còi xe, và nhạc ca Huế (đàn tranh, đàn bầu, giọng ca).
export class AudioSys {
  constructor() {
    this.ctx = null;
    this.vol = { master: 0.8, music: 0.6, sfx: 0.8, amb: 0.7 };
    this.mode = 'off';
    this.ksCache = new Map();
  }

  init() {
    if (this.ctx) { this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    this.master = ctx.createGain(); this.master.connect(ctx.destination);
    this.musicG = ctx.createGain(); this.sfxG = ctx.createGain(); this.ambG = ctx.createGain();
    this.musicG.connect(this.master); this.sfxG.connect(this.master); this.ambG.connect(this.master);
    // hồi âm
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this._impulse(3.2, 2.4);
    this.revG = ctx.createGain(); this.revG.gain.value = 0.45;
    this.reverb.connect(this.revG); this.revG.connect(this.master);
    this.applyVolumes();
    // nguồn nhiễu
    this.white = this._noise('white', 3); this.brown = this._noise('brown', 4);
    // gió
    this.wind = this._loop(this.brown, 'lowpass', 500, 0.7, this.ambG, 0.18);
    // sông
    this.riverN = this._loop(this.white, 'bandpass', 520, 0.5, this.ambG, 0);
    // tiếng phố
    this.city = this._loop(this.brown, 'bandpass', 260, 0.8, this.ambG, 0);
    // mưa
    this.rainN = this._loop(this.white, 'highpass', 1400, 0.3, this.ambG, 0);
    this.rainLow = this._loop(this.brown, 'lowpass', 300, 0.5, this.ambG, 0);
    // dế kêu
    const cr = ctx.createOscillator(); cr.type = 'sine'; cr.frequency.value = 4700;
    const am = ctx.createGain(); am.gain.value = 0;
    const lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 28;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.5;
    lfo.connect(lfoG); lfoG.connect(am.gain);
    const gate = ctx.createGain(); gate.gain.value = 0;
    const lfo2 = ctx.createOscillator(); lfo2.frequency.value = 0.7;
    const lfo2G = ctx.createGain(); lfo2G.gain.value = 0.5;
    lfo2.connect(lfo2G); lfo2G.connect(gate.gain);
    this.crickG = ctx.createGain(); this.crickG.gain.value = 0;
    cr.connect(am); am.connect(gate); gate.connect(this.crickG); this.crickG.connect(this.ambG);
    cr.start(); lfo.start(); lfo2.start();
    this.birdT = 2; this.frogT = 3;
    this._sched = setInterval(() => this._musicTick(), 90);
  }

  applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.vol.master, t, 0.1);
    this.musicG.gain.setTargetAtTime(this.vol.music * 0.9, t, 0.1);
    this.sfxG.gain.setTargetAtTime(this.vol.sfx, t, 0.1);
    this.ambG.gain.setTargetAtTime(this.vol.amb, t, 0.1);
  }

  _noise(kind, sec) {
    const ctx = this.ctx, n = ctx.sampleRate * sec;
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
    }
    return buf;
  }
  _impulse(sec, decay) {
    const ctx = this.ctx, n = ctx.sampleRate * sec;
    const buf = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
    }
    return buf;
  }
  _loop(buf, type, freq, q, out, gain) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); g.gain.value = gain;
    src.connect(f); f.connect(g); g.connect(out); src.start(0, Math.random() * 2);
    return { src, f, g };
  }
  _env(g, t, a, peak, dec) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }

  // ===== Nền theo môi trường
  updateAmbience(dt, s) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.wind.g.gain.setTargetAtTime(0.12 + s.wind * 0.2, t, 0.5);
    this.riverN.g.gain.setTargetAtTime(s.river * 0.09, t, 0.5);
    this.city.g.gain.setTargetAtTime(s.city * (1 - s.night * 0.7) * 0.25, t, 0.8);
    this.rainN.g.gain.setTargetAtTime(s.rain * 0.22, t, 0.8);
    this.rainLow.g.gain.setTargetAtTime(s.rain * 0.3, t, 0.8);
    this.crickG.gain.setTargetAtTime(s.night * (1 - s.rain) * 0.025, t, 1);
    // chim hót ban ngày
    this.birdT -= dt;
    if (this.birdT <= 0) {
      this.birdT = 1.5 + Math.random() * 5;
      if (s.night < 0.4 && s.rain < 0.5 && s.trees > 0.2) this.bird();
    }
    // ếch kêu ban đêm
    this.frogT -= dt;
    if (this.frogT <= 0) {
      this.frogT = 0.6 + Math.random() * 2.5;
      if (s.night > 0.6 && s.river > 0.2) this.frog();
    }
  }

  bird() {
    const ctx = this.ctx, t = ctx.currentTime;
    const pan = ctx.createStereoPanner(); pan.pan.value = Math.random() * 2 - 1; pan.connect(this.ambG);
    const base = 2200 + Math.random() * 2000;
    const n = 2 + Math.floor(Math.random() * 5);
    for (let i = 0; i < n; i++) {
      const o = ctx.createOscillator(); o.type = 'sine';
      const g = ctx.createGain();
      const st = t + i * (0.09 + Math.random() * 0.06);
      o.frequency.setValueAtTime(base * (0.9 + Math.random() * 0.2), st);
      o.frequency.exponentialRampToValueAtTime(base * (1.2 + Math.random() * 0.4), st + 0.06);
      this._env(g, st, 0.01, 0.04, 0.08);
      o.connect(g); g.connect(pan); o.start(st); o.stop(st + 0.15);
    }
  }
  frog() {
    const ctx = this.ctx, t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = 180 + Math.random() * 80;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 600; f.Q.value = 4;
    const g = ctx.createGain(); const pan = ctx.createStereoPanner(); pan.pan.value = Math.random() * 2 - 1;
    o.connect(f); f.connect(g); g.connect(pan); pan.connect(this.ambG);
    for (let i = 0; i < 2; i++) { g.gain.setValueAtTime(0.0001, t + i * 0.12); g.gain.exponentialRampToValueAtTime(0.03, t + i * 0.12 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.12 + 0.08); }
    o.start(t); o.stop(t + 0.3);
  }

  // ===== Hiệu ứng
  _burst(dur, type, freq, q, gain, out = this.sfxG, t0 = 0) {
    const ctx = this.ctx, t = ctx.currentTime + t0;
    const src = ctx.createBufferSource(); src.buffer = this.white;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    this._env(g, t, 0.004, gain, dur);
    src.connect(f); f.connect(g); g.connect(out);
    src.start(t, Math.random() * 2); src.stop(t + dur + 0.05);
  }
  footstep(surface = 'ground', run = false) {
    if (!this.ctx) return;
    const v = run ? 0.16 : 0.11;
    if (surface === 'wood') { this._burst(0.08, 'bandpass', 420, 2.5, v * 1.2); this._tone(110, 0.06, v * 0.6, 'sine'); }
    else if (surface === 'water') this._burst(0.15, 'lowpass', 1200, 0.5, v);
    else this._burst(0.06, 'bandpass', 900 + Math.random() * 400, 0.9, v);
  }
  _tone(freq, dur, gain, type = 'sine', t0 = 0, out = this.sfxG) {
    const ctx = this.ctx, t = ctx.currentTime + t0;
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq;
    const g = ctx.createGain();
    this._env(g, t, 0.005, gain, dur);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
    return o;
  }
  coin() { if (!this.ctx) return; this._tone(1318, 0.12, 0.12, 'triangle'); this._tone(1760, 0.25, 0.1, 'triangle', 0.08); }
  click() { if (!this.ctx) return; this._tone(880, 0.04, 0.05, 'triangle'); }
  stamp() { if (!this.ctx) return; const o = this._tone(140, 0.25, 0.35, 'sine'); o.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.2); this._burst(0.05, 'lowpass', 2000, 0.5, 0.2); }
  shutter() { if (!this.ctx) return; this._burst(0.03, 'highpass', 3000, 0.7, 0.25); this._burst(0.04, 'highpass', 2000, 0.7, 0.2, this.sfxG, 0.07); }
  eat() { if (!this.ctx) return; for (let i = 0; i < 3; i++) this._burst(0.07, 'bandpass', 500 + i * 120, 3, 0.12, this.sfxG, i * 0.18); }
  splash() { if (!this.ctx) return; this._burst(0.35, 'lowpass', 900, 0.7, 0.2); }
  quest() {
    if (!this.ctx) return;
    [587.33, 739.99, 880, 1174.66].forEach((f, i) => this._tone(f, 0.5, 0.08, 'triangle', i * 0.11));
  }
  honk(dist = 5) {
    if (!this.ctx) return;
    const g = Math.max(0.02, 0.14 - dist * 0.008);
    for (let i = 0; i < 2; i++) {
      const ctx = this.ctx, t = ctx.currentTime + i * 0.18;
      const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = 415;
      const o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = 520;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1800;
      const gg = ctx.createGain(); gg.gain.setValueAtTime(0.0001, t); gg.gain.exponentialRampToValueAtTime(g, t + 0.01); gg.gain.setValueAtTime(g, t + 0.11); gg.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      o.connect(f); o2.connect(f); f.connect(gg); gg.connect(this.sfxG);
      o.start(t); o2.start(t); o.stop(t + 0.16); o2.stop(t + 0.16);
    }
  }
  // Chuông Đại Hồng Chung: các bội âm không điều hoà, ngân dài
  bell(gain = 0.5) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime;
    const f0 = 98;
    const partials = [[0.5, 1, 14], [1, 0.8, 11], [1.19, 0.5, 8], [1.5, 0.4, 7], [2.0, 0.45, 6], [2.51, 0.25, 4], [2.66, 0.2, 4], [3.01, 0.18, 3], [4.17, 0.1, 2], [5.43, 0.06, 1.5]];
    const out = ctx.createGain(); out.gain.value = gain;
    out.connect(this.sfxG); out.connect(this.reverb);
    for (const [r, a, d] of partials) {
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.value = f0 * r * (1 + (Math.random() - 0.5) * 0.003);
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f0 * r * 1.0025; // nhịp đập
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(a * 0.25, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); o2.connect(g); g.connect(out);
      o.start(t); o2.start(t); o.stop(t + d + 0.1); o2.stop(t + d + 0.1);
    }
    this._burst(0.12, 'lowpass', 600, 0.8, 0.4, out);
  }

  // ===== Nhạc
  // Karplus-Strong cho tiếng đàn tranh
  _ks(freq) {
    const key = Math.round(freq * 10);
    if (this.ksCache.has(key)) return this.ksCache.get(key);
    const sr = this.ctx.sampleRate, len = Math.floor(sr * 2.6);
    const buf = this.ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    const N = Math.max(2, Math.round(sr / freq));
    const ring = new Float32Array(N);
    let prev = 0;
    for (let i = 0; i < N; i++) { const w = Math.random() * 2 - 1; prev = prev * 0.5 + w * 0.5; ring[i] = prev; }
    let idx = 0;
    const decay = 0.9965 - Math.min(0.004, freq / 400000);
    for (let i = 0; i < len; i++) {
      const a = ring[idx], b = ring[(idx + 1) % N];
      const v = (a + b) * 0.5 * decay;
      ring[idx] = v;
      d[i] = a;
      idx = (idx + 1) % N;
    }
    this.ksCache.set(key, buf);
    return buf;
  }
  pluck(freq, t, gain = 0.3, bend = 0) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this._ks(freq);
    if (bend) {
      // kỹ thuật "nhấn" của đàn tranh: nhấn lên rồi nhả
      src.playbackRate.setValueAtTime(1, t + 0.15);
      src.playbackRate.linearRampToValueAtTime(Math.pow(2, bend / 12), t + 0.32);
      src.playbackRate.linearRampToValueAtTime(1, t + 0.7);
    }
    const g = ctx.createGain(); g.gain.value = gain;
    const pan = ctx.createStereoPanner(); pan.pan.value = -0.3;
    src.connect(g); g.connect(pan); pan.connect(this.musicG); pan.connect(this.reverb);
    src.start(t); src.stop(t + 2.6);
  }
  // đàn bầu / giọng ca: âm liền, vuốt và rung
  voice(freq, t, dur, gain = 0.12, kind = 'bau', from = null) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = kind === 'bau' ? 'triangle' : 'sawtooth';
    const start = from ?? freq * Math.pow(2, (Math.random() < 0.5 ? -1 : 1) * 1.5 / 12);
    o.frequency.setValueAtTime(start, t);
    o.frequency.exponentialRampToValueAtTime(freq, t + 0.18);
    // rung (vibrato) tăng dần
    const lfo = ctx.createOscillator(); lfo.frequency.value = kind === 'bau' ? 5.2 : 5.8;
    const lg = ctx.createGain();
    lg.gain.setValueAtTime(0, t);
    lg.gain.linearRampToValueAtTime(freq * (kind === 'bau' ? 0.012 : 0.018), t + dur * 0.8);
    lfo.connect(lg); lg.connect(o.frequency);
    let node = o;
    const g = ctx.createGain();
    if (kind === 'voice') {
      const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 750; f1.Q.value = 6;
      const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1150; f2.Q.value = 7;
      const m = ctx.createGain(); m.gain.value = 1.6;
      o.connect(f1); o.connect(f2); f1.connect(m); f2.connect(m); node = m;
    } else {
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
      o.connect(lp); node = lp;
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.12);
    g.gain.setValueAtTime(gain, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25);
    const pan = ctx.createStereoPanner(); pan.pan.value = kind === 'voice' ? 0.05 : 0.3;
    node.connect(g); g.connect(pan); pan.connect(this.musicG); pan.connect(this.reverb);
    o.start(t); lfo.start(t); o.stop(t + dur + 0.3); lfo.stop(t + dur + 0.3);
  }
  woodblock(t, gain = 0.15) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(1100, t); o.frequency.exponentialRampToValueAtTime(700, t + 0.04);
    const g = ctx.createGain(); this._env(g, t, 0.002, gain, 0.07);
    o.connect(g); g.connect(this.musicG); o.start(t); o.stop(t + 0.1);
  }

  setMusic(mode) {
    if (this.mode === mode) return;
    this.mode = mode;
    if (!this.ctx) return;
    this.nextBeat = this.ctx.currentTime + 0.3;
    this.beat = 0;
    this.melIdx = 4;
  }

  _musicTick() {
    if (!this.ctx || this.mode === 'off') return;
    const ctx = this.ctx;
    // Thang âm điệu Nam (gần đúng): Hò - Xự - Xang - Xê - Cống
    const root = 196; // G3
    const steps = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24];
    const note = (i) => root * Math.pow(2, steps[Math.max(0, Math.min(steps.length - 1, i))] / 12);
    const bpm = this.mode === 'cahue' ? 64 : this.mode === 'title' ? 58 : 52;
    const spb = 60 / bpm;
    while (this.nextBeat < ctx.currentTime + 0.5) {
      const t = this.nextBeat, b = this.beat;
      const full = this.mode === 'cahue', title = this.mode === 'title';
      const density = full ? 0.85 : title ? 0.7 : 0.35;
      // giai điệu: bước ngẫu nhiên trên thang âm
      if (Math.random() < density) {
        const r = Math.random();
        this.melIdx += r < 0.35 ? 1 : r < 0.7 ? -1 : r < 0.85 ? 2 : -2;
        if (this.melIdx < 2) this.melIdx = 3; if (this.melIdx > 9) this.melIdx = 7;
        const f = note(this.melIdx);
        const bend = Math.random() < 0.3 ? (Math.random() < 0.5 ? 1 : 2) : 0;
        this.pluck(f * 2, t, full ? 0.28 : 0.22, bend);
        // láy nhanh
        if (Math.random() < 0.25) { this.pluck(note(this.melIdx + 1) * 2, t + spb * 0.5, 0.16); this.pluck(f * 2, t + spb * 0.75, 0.14); }
        if ((full || title) && b % 2 === 0 && Math.random() < 0.6) {
          const dur = spb * (1.5 + Math.random() * 1.5);
          if (full && Math.floor(b / 16) % 2 === 1) this.voice(f * 2, t, dur, 0.07, 'voice');
          else this.voice(f * 2, t + 0.05, dur, title ? 0.06 : 0.08, 'bau');
        }
      }
      // bè trầm
      if (b % 4 === 0) { this.pluck(note(0), t, 0.25); if (full) this.pluck(note(3), t + spb * 2, 0.18); }
      // song lang giữ nhịp
      if (full && b % 2 === 0) this.woodblock(t, b % 8 === 0 ? 0.16 : 0.09);
      this.beat++;
      this.nextBeat += spb * (Math.random() < 0.1 ? 1.5 : 1);
    }
  }
}
