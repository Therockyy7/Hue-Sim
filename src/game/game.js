// Logic trò chơi: trạng thái, nhiệm vụ, tương tác, đi thuyền, chụp ảnh, xích lô, nghỉ ngơi, lưu
import * as THREE from 'three';
import { PLACES, FOODS, PRICES, QUESTS, SIDE, START_MONEY, vnd, CHATTER } from './data.js';
import { DIALOGS } from './dialogs.js';
import { P, RIVER } from '../world/layout.js';

const SAVE_KEY = 'dihue-save-v1';
const TIME_SCALE = 2 / 60; // giờ game mỗi giây thật (1 ngày ≈ 12 phút)

const ARRIVE = {
  ga: [-60, 236, 0], trangTien: [100, 67, 0], kyDai: [-60, -130, Math.PI], ngoMon: [-58, -150, 0],
  thaiHoa: [-58, -150, 0], cuuDinh: [-58, -150, 0], dongBa: [160, -77, 0], thienMu: [-332, -66, 0],
  khaiDinh: [-252, 268, Math.PI], songHuong: [52, 60, 0], benThuyen: [52, 60, 0],
  hotel: [154, 80, Math.PI], food: [46, 155, 0],
};

export class Game {
  constructor(ctx) {
    Object.assign(this, ctx); // scene, camera, renderer, W, physics, player, input, audio, sky, people, traffic, river, lanterns, hud
    this.mode = 'title';
    this.ride = null;
    this.photo = false;
    this.pendingCapture = false;
    this.album = [];
    this.interactTarget = null;
    this.saveT = 0;
    this.weatherT = 0;
    this.rainTarget = 0;
    this.ambientLanternT = 0;
    this.hintT = 0;
    this.baseFov = 72;
    this._spawnNPCs();
    this._setupInteractables();
  }

  // ================= Trạng thái =================
  freshState() {
    const q = {};
    for (const it of [...QUESTS, ...SIDE]) q[it.id] = { done: false, n: 0 };
    return {
      v: 1, money: START_MONEY, time: 7.0, day: 1,
      pos: [P.spawn.x, P.spawn.z], yaw: P.spawn.yaw,
      stamps: {}, quests: q, foods: {}, quiz: {}, photos: {},
      inv: { ticketDaiNoi: false, ticketKhaiDinh: false, nonLa: false, aoDai: false, bike: false, lantern: 0, meXung: false },
      bridge: { s: false, n: false }, tracked: null, finished: false, spent: 0, released: 0, bells: 0,
      hints: {},
    };
  }
  hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; } }

  newGame() {
    this.state = this.freshState();
    this.album = [];
    this._applyState();
    this.mode = 'intro';
    this.hud.intro(() => {
      this.mode = 'play';
      this.input.lock();
      this.completeQuest('arrive');
      this.stamp('ga');
      setTimeout(() => this.hud.toast('Mẹo: nhấn <b>Tab</b> mở Hộ chiếu & nhiệm vụ, <b>M</b> mở bản đồ, <b>C</b> để chụp ảnh.', '💡', 7000), 4500);
    });
  }

  loadGame() {
    try {
      const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
      const base = this.freshState();
      this.state = { ...base, ...raw, inv: { ...base.inv, ...raw.inv }, quests: { ...base.quests, ...raw.quests } };
      this.album = raw.album || [];
    } catch { this.state = this.freshState(); this.album = []; }
    this._applyState();
    this.mode = 'play';
    this.input.lock();
    this.hud.toast(`Chào mừng trở lại Huế! Ngày ${this.state.day}, ${this.clockStr()}.`, '🏯');
  }

  _applyState() {
    const s = this.state;
    this.player.setPosition(s.pos[0], s.pos[1], s.yaw);
    this.player.pitch = 0;
    this.player.mode = 'walk';
    this.player.bike.visible = false;
    this.player._applyCam(0, 0);
    this.W.gates.daiNoi.enabled = !s.inv.ticketDaiNoi;
    this.W.gates.khaiDinh.enabled = !s.inv.ticketKhaiDinh;
    this.hud.setMoney(s.money);
    this.hud.refresh();
  }

  save(manual = false) {
    if (!this.state || this.mode === 'title') return;
    const s = this.state;
    if (!this.ride) { s.pos = [this.player.pos.x, this.player.pos.z]; s.yaw = this.player.yaw; }
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ ...s, album: this.album.slice(-10) }));
      if (manual) this.hud.toast('Đã lưu hành trình.', '💾');
    } catch {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify({ ...s, album: this.album.slice(-3) })); } catch { /* đầy bộ nhớ */ }
    }
  }

  hour() { return this.state ? this.state.time : 17; }
  clockStr() { const h = Math.floor(this.state.time), m = Math.floor((this.state.time - h) * 60); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; }
  isCruiseTime() { const h = this.hour(); return h >= 18.5 && h < 23.5; }
  isNight() { return this.sky.night > 0.5; }

  // ================= Tiền & mua sắm =================
  pay(amount, what) {
    if (this.state.money < amount) {
      this.hud.toast(`Không đủ tiền cho ${what}! (cần ${vnd(amount)})`, '😥');
      return false;
    }
    this.state.money -= amount;
    this.state.spent += amount;
    this.hud.setMoney(this.state.money, -amount);
    this.audio.coin();
    return true;
  }

  eat(key) {
    const f = FOODS[key];
    if (!this.pay(f.price, f.name)) return;
    const first = !this.state.foods[key];
    this.state.foods[key] = (this.state.foods[key] || 0) + 1;
    this.advance(20 / 60);
    this.audio.eat();
    this.hud.foodCard(key, first);
    if (key === 'bunbo') this.completeQuest('bunbo');
    else {
      const n = ['comhen', 'banhbeo', 'che'].filter(k => this.state.foods[k]).length;
      this.progressQuest('food', n);
    }
    this.save();
  }

  buyTicket(which) {
    const price = which === 'daiNoi' ? PRICES.daiNoi : PRICES.khaiDinh;
    if (!this.pay(price, 'vé tham quan')) return;
    if (which === 'daiNoi') { this.state.inv.ticketDaiNoi = true; this.W.gates.daiNoi.enabled = false; }
    else { this.state.inv.ticketKhaiDinh = true; this.W.gates.khaiDinh.enabled = false; }
    this.hud.toast('Đã mua vé! Rào chắn đã mở, mời bạn vào tham quan.', '🎫');
    this.save();
  }

  buyItem(item) {
    const inv = this.state.inv;
    switch (item) {
      case 'nonLa':
        if (!this.pay(PRICES.nonLa, 'nón lá')) return;
        inv.nonLa = true; this.completeQuest('nonLa');
        this.hud.toast('Bạn đã có chiếc nón bài thơ! Nắng Huế không còn đáng sợ nữa.', '👒');
        break;
      case 'meXung':
        if (!this.pay(PRICES.meXung, 'mè xửng')) return;
        inv.meXung = true; this.completeQuest('meXung');
        this.hud.toast('Một hộp mè xửng dẻo thơm làm quà cho người thân.', '🍬');
        break;
      case 'aoDai':
        if (!this.pay(PRICES.aoDai, 'áo dài')) return;
        inv.aoDai = true; this.completeQuest('aoDai');
        this.hud.toast('Bạn đang mặc áo dài tím Huế — thật duyên dáng!', '👘');
        break;
      case 'bike':
        if (!this.pay(PRICES.bike, 'xe đạp')) return;
        inv.bike = true; this.completeQuest('bike');
        this.toggleBike(true);
        break;
      case 'lantern':
        if (!this.pay(PRICES.lantern, 'hoa đăng')) return;
        inv.lantern++;
        this.hud.toast('Bạn có một chiếc hoa đăng. Ra cuối bến hoặc lúc ngồi thuyền, nhấn <b>F</b> để thả.', '🪷');
        break;
    }
    this.hud.refresh();
    this.save();
  }

  toggleBike(on = null) {
    const p = this.player;
    const want = on ?? p.mode !== 'bike';
    p.mode = want ? 'bike' : 'walk';
    p.bike.visible = want;
    this.hud.toast(want ? 'Lên xe đạp! Nhấn <b>B</b> để xuống/lên xe bất cứ lúc nào.' : 'Đã xuống xe đạp.', '🚲');
  }

  // ================= Thời gian =================
  advance(hours) {
    this.state.time += hours;
    while (this.state.time >= 24) { this.state.time -= 24; this.state.day++; }
  }

  rest(target, nextDay = false) {
    if (!this.pay(PRICES.hotel, 'phòng nghỉ')) return;
    this.hud.fade(() => {
      if (nextDay || this.state.time > target) this.state.day++;
      this.state.time = target;
      this.rainTarget = 0; this.sky.rain = 0;
      this.hud.toast(nextDay ? `Một đêm ngon giấc. Chào buổi sáng ngày ${this.state.day}!` : 'Nghỉ ngơi xong. Hoàng hôn đang buông trên sông Hương…', nextDay ? '🌅' : '🌇');
      this.save();
    }, nextDay ? 'Ngủ ngon…' : 'Nghỉ ngơi…');
  }

  // ================= Con dấu & nhiệm vụ =================
  stamp(id) {
    if (this.state.stamps[id]) return;
    this.state.stamps[id] = { day: this.state.day, time: this.clockStr() };
    this.audio.stamp();
    this.hud.stampCard(id);
    if (this.state.stamps.thaiHoa && this.state.stamps.cuuDinh) this.completeQuest('thaiHoa');
    this.save();
  }

  completeQuest(id) {
    const q = this.state.quests[id];
    if (!q || q.done) return;
    q.done = true;
    const def = [...QUESTS, ...SIDE].find(x => x.id === id);
    if (def.count) q.n = def.count;
    this.audio.quest();
    this.hud.questDone(def);
    if (this.state.tracked === id) this.state.tracked = null;
    this.hud.refresh();
    this._checkEnding();
  }
  progressQuest(id, n) {
    const q = this.state.quests[id];
    const def = [...QUESTS, ...SIDE].find(x => x.id === id);
    if (q.done) return;
    q.n = Math.max(q.n, n);
    if (q.n >= def.count) this.completeQuest(id);
    else { this.hud.toast(`${def.title}: ${q.n}/${def.count}`, '📜'); this.hud.refresh(); }
  }
  answerQuiz(key, ok) {
    this.state.quiz[key] = ok ? 'ok' : 'no';
    if (ok) { this.audio.quest(); this.progressQuest('quiz', Object.values(this.state.quiz).filter(v => v === 'ok').length); }
  }
  mainDone() { return QUESTS.filter(q => this.state.quests[q.id].done).length; }
  _checkEnding() {
    if (this.state.finished) return;
    if (QUESTS.every(q => this.state.quests[q.id].done)) {
      this.state.finished = true;
      this.save();
      setTimeout(() => { this.openUI(); this.hud.ending(); }, 2500);
    }
  }

  trackedQuest() {
    const s = this.state;
    const all = [...QUESTS, ...SIDE];
    if (s.tracked && !s.quests[s.tracked].done) return all.find(q => q.id === s.tracked);
    return QUESTS.find(q => !s.quests[q.id].done && q.target) || null;
  }
  targetPos(q) {
    if (!q || !q.target) return null;
    const t = q.target, S = this.W.spots;
    if (PLACES[t]) return { x: PLACES[t].x, z: PLACES[t].z };
    const [kind, key] = t.split(':');
    if (kind === 'food') {
      const k = key === 'next' ? ['comhen', 'banhbeo', 'che'].find(f => !this.state.foods[f]) : key;
      return k ? S.food[k] : null;
    }
    if (kind === 'ticket') {
      if (key === 'daiNoi') return this.state.inv.ticketDaiNoi ? { x: -70, z: -205 } : S.ticketDaiNoi;
      return this.state.inv.ticketKhaiDinh ? S.khaiDinhInside : S.ticketKhaiDinh;
    }
    if (kind === 'spot') return S[key];
    return null;
  }

  // ================= NPC =================
  _spawnNPCs() {
    const S = this.W.spots, ppl = this.people;
    const named = (id, name, role, x, z, opt = {}) => ppl.spawn({ id, name, role, x, z, mode: 'idle', ...opt });
    named('xichlo', 'Bác Tư', 'Đạp xích lô', S.cyclo.x, S.cyclo.z - 0.5, { type: 'man', hat: 'helmet', face: Math.PI });
    const f = S.food;
    named('bunbo', 'O Hoa', 'Quán bún bò', f.bunbo.vendor.x, f.bunbo.vendor.z, { type: 'vendor', face: 0, gesture: 'cook', lookAtPlayer: false });
    named('comhen', 'Chú Ba', 'Quán cơm hến', f.comhen.vendor.x, f.comhen.vendor.z, { type: 'man', face: 0, gesture: 'cook', lookAtPlayer: false });
    named('banhbeo', 'Mệ Tám', 'Bánh bèo chén', f.banhbeo.vendor.x, f.banhbeo.vendor.z, { type: 'elder', female: true, face: 0, gesture: 'cook', lookAtPlayer: false });
    named('che', 'O Lài', 'Chè Huế', f.che.vendor.x, f.che.vendor.z, { type: 'vendor', face: 0, gesture: 'cook', lookAtPlayer: false });
    named('veDaiNoi', 'Anh Minh', 'Phòng vé Đại Nội', S.ticketDaiNoi.x + 1.6, S.ticketDaiNoi.z - 0.2, { type: 'man', top: 0x2d4a7a, face: 0 });
    named('huongDan', 'Cô Thảo', 'Hướng dẫn viên', -62, -224, { type: 'aodai', top: 0xd8a83a, hat: 'none', face: Math.PI });
    named('nonLa', 'Chị Lan', 'Sạp nón lá', S.nonLa.x, S.nonLa.z, { type: 'vendor', face: 0 });
    named('suThay', 'Sư thầy Minh Tâm', 'Chùa Thiên Mụ', -335, -106, { type: 'monk', face: 0 });
    named('laiDo', 'Bác Năm', 'Lái thuyền rồng', S.dock.x, S.dock.z + 2, { type: 'man', hat: 'non', face: 0, y: 0.25 });
    named('laiDo', 'Chú Sáu', 'Lái thuyền rồng', S.tmPier.x, S.tmPier.z, { type: 'man', hat: 'non', face: Math.PI, y: 0.25 });
    named('leTan', 'Chị Hương', 'Lễ tân khách sạn', S.hotel.x, S.hotel.z, { type: 'aodai', top: 0x5a2a80, hat: 'none', face: Math.PI });
    named('aoDai', 'Chị Mai', 'Tiệm áo dài', S.aoDai.x, S.aoDai.z, { type: 'aodai', top: 0x6a3d9a, hat: 'none', face: Math.PI });
    named('veKhaiDinh', 'Anh Hùng', 'Vé lăng Khải Định', S.ticketKhaiDinh.x, S.ticketKhaiDinh.z, { type: 'man', top: 0x3a5a3a, face: Math.PI });
    ppl.spawn({ id: 'bridgeGuy', name: 'Ông Khải', role: 'Người dân đi dạo', type: 'elder', female: false, hat: 'helmet', mode: 'walk', loop: false, speed: 0.8, path: [[30, 50], [88, 50]] });

    // người dân đi lại
    const names = ['Mệ Cúc', 'O Hằng', 'Chú Phúc', 'Anh Tuấn', 'Chị Thủy', 'Bác Lộc', 'Em Ngân', 'O Huyền', 'Ôn Đạt', 'Cô Hà', 'Anh Khoa', 'Chị Yến', 'Bé Na', 'Chú Tâm', 'O Nhi'];
    const tnames = ['Bạn Linh', 'Bạn Quân', 'Anna', 'Kenji', 'Bạn Vy', 'Tom', 'Bạn Hải', 'Mai Anh'];
    let ni = 0, ti = 0;
    const local = (opt) => ppl.spawn({ id: 'chatter', name: names[ni++ % names.length], role: 'Người dân Huế', ...opt });
    const tour = (opt) => ppl.spawn({ id: 'tourist', name: tnames[ti++ % tnames.length], role: 'Du khách', type: 'tourist', ...opt });
    // bờ sông
    const promen = [[-200, 50, 88], [110, 50, 270], [-300, -50, 88], [110, -50, 280]];
    for (const [a, z, b] of promen) for (let i = 0; i < 3; i++) {
      const s = a + Math.random() * (b - a - 20);
      local({ mode: 'walk', loop: false, path: [[s, z + (Math.random() - 0.5) * 2], [s + 15 + Math.random() * 40, z + (Math.random() - 0.5) * 2]].map(([x, zz]) => [Math.min(b, x), zz]) });
    }
    // vỉa hè quanh các khu phố
    const blocks = [[-40, 100, 72, 150], [100, 220, 72, 230], [-160, -40, 72, 230], [-40, 100, 150, 230]];
    for (const [x0, x1, z0, z1] of blocks) for (let i = 0; i < 3; i++) {
      const loop = [[x0 + 4.6, z0 + 5.2], [x1 - 5.2, z0 + 5.2], [x1 - 5.2, z1 - 4.8], [x0 + 4.6, z1 - 4.8]];
      if (i % 2) loop.reverse();
      const npc = local({ mode: 'walk', loop: true, path: loop });
      npc.seg = Math.floor(Math.random() * 4); npc.pos.set(loop[npc.seg][0], 0, loop[npc.seg][1]);
    }
    // du khách trong Kinh Thành & Đại Nội
    tour({ mode: 'walk', loop: false, path: [[-66, -122], [-66, -175], [-66, -200], [-66, -226]] });
    tour({ mode: 'walk', loop: false, path: [[-74, -228], [-74, -200], [-74, -170], [-74, -125]] });
    tour({ mode: 'idle', x: -78, z: -150, face: Math.PI, gesture: 'photo' });
    tour({ mode: 'idle', x: -60, z: -132, face: Math.PI, gesture: 'photo' });
    tour({ mode: 'wander', x: -100, z: -255, wanderR: 6 });
    tour({ mode: 'wander', x: -70, z: -215, wanderR: 8 });
    tour({ mode: 'idle', x: -78, y: 6.4, z: -110, face: Math.PI });
    tour({ mode: 'idle', x: -60, y: 6.4, z: -92, face: 0, gesture: 'photo' });
    // Thiên Mụ
    tour({ mode: 'walk', loop: false, path: [[-338, -70], [-338, -92], [-330, -100]] });
    tour({ mode: 'wander', x: -326, z: -108, wanderR: 4 });
    local({ mode: 'idle', x: -352, z: -122, type: 'monk', role: 'Chú tiểu', gesture: 'bend', lines: ['Con đang quét lá sân chùa. Lá rơi nhiều quá, quét hoài không hết!', 'A Di Đà Phật. Thí chủ đi nhẹ nhàng giúp con nghe.'] });
    // chợ Đông Ba
    for (const st of this.W.marketStalls) {
      if (Math.abs(st.x - S.nonLa.x) < 1 && Math.abs(st.z - S.nonLa.z) < 1) continue;
      local({ mode: 'idle', x: st.x + (Math.random() - 0.5), z: st.z, type: 'vendor', face: 0, role: 'Người bán hàng', lines: ['Mua chi không em? Rẻ mà ngon nè!', 'Tôm chua, mè xửng, ruốc Huế… mua về làm quà nghe!', 'Chợ Đông Ba đông vui nhất là buổi sáng sớm đó.', 'Trái cây tươi mới hái nè, ăn thử đi!'] });
    }
    for (let i = 0; i < 6; i++) local({ mode: 'wander', x: 140 + i * 8, z: -90, wanderR: 6, type: Math.random() < 0.5 ? 'aodai' : 'man' });
    // thực khách ở phố ẩm thực
    this.W.seats.forEach((s, i) => { if (i % 2 === 0) local({ mode: 'sit', x: s.x, z: s.z, face: s.face, gesture: 'eat', lookAtPlayer: false }); });
    // ga Huế
    for (let i = 0; i < 4; i++) tour({ mode: 'wander', x: -70 + i * 8, z: 238, wanderR: 3 });
    // Khải Định
    tour({ mode: 'wander', x: -250, z: 312, wanderR: 8, y: 4 });
    tour({ mode: 'wander', x: -250, z: 375, wanderR: 4, y: 13 });
    tour({ mode: 'idle', x: -244, z: 345, face: Math.PI, y: 8, gesture: 'photo' });
    // nông dân
    for (const fm of this.W.farmers) local({ mode: 'idle', x: fm.x, z: fm.z, type: 'vendor', role: 'Nông dân', gesture: 'bend', lines: ['Năm ni lúa tốt lắm con!', 'Ruộng ven đô ni trồng lúa từ thời ông bà tê.', 'Trưa nắng thì nghỉ, chiều mát ra đồng tiếp.'] });
    // nghệ sĩ ca Huế (ẩn, chỉ hiện trên thuyền đêm)
    this.performers = [
      ppl.spawn({ type: 'singer', top: 0x6a3d9a, x: 0, z: 0, mode: 'sit', gesture: 'sing', lookAtPlayer: false }),
      ppl.spawn({ type: 'man', top: 0x3a2a4a, hat: 'khandong', x: 0, z: 0, mode: 'sit', gesture: 'play', lookAtPlayer: false }),
      ppl.spawn({ type: 'singer', top: 0xd8a83a, x: 0, z: 0, mode: 'sit', gesture: 'play', lookAtPlayer: false }),
    ];
    const locs = [[0, 0.62, -2.6, 0], [-0.8, 0.62, -1.2, Math.PI / 2], [-0.8, 0.62, -3.6, Math.PI / 2]];
    this.performers.forEach((n, i) => { n.hidden = true; n.local = new THREE.Vector3(locs[i][0], locs[i][1], locs[i][2]); n.localFace = locs[i][3]; });
  }

  // ================= Tương tác =================
  _setupInteractables() {
    const S = this.W.spots;
    this.objects = [
      { x: S.bell.x, z: S.bell.z, r: 3.4, y: S.bell.y - 2, key: 'KeyE', label: 'Thỉnh chuông Đại Hồng Chung', act: () => this.ringBell() },
      { x: P.dock.x, z: 28, r: 4, y: 0.25, key: 'KeyF', label: 'Thả hoa đăng xuống sông', cond: () => this.state.inv.lantern > 0, act: () => this.releaseLantern(P.dock.x - 1.5, 24) },
      { x: S.bikeRack.x, z: S.bikeRack.z, r: 3, y: 0, key: 'KeyE', label: () => this.player.mode === 'bike' ? 'Gửi xe đạp' : 'Lấy xe đạp', cond: () => this.state.inv.bike, act: () => this.toggleBike() },
      { x: P.cuuDinh.x, z: -256, r: 4, y: 0, key: 'KeyE', label: 'Xem Cửu Đỉnh', act: () => { this.stamp('cuuDinh'); this.hud.placeInfo('cuuDinh'); } },
      { x: -70, z: -232, r: 4, y: 1.3, key: 'KeyE', label: 'Chiêm ngưỡng ngai vàng triều Nguyễn', act: () => this.hud.toast('Ngai vàng đặt giữa điện, nơi vua ngự trong các buổi đại triều. Trên cao là bức hoành phi chạm rồng.', '👑', 6000) },
    ];
  }

  ringBell() {
    this.audio.bell(0.6);
    this.state.bells++;
    this.completeQuest('bell');
    this.hud.toast('Boong… Tiếng chuông Thiên Mụ ngân vang trên dòng Hương Giang.', '🔔', 5000);
  }

  releaseLantern(x, z) {
    if (this.state.inv.lantern <= 0) return;
    this.state.inv.lantern--;
    this.state.released++;
    this.lanterns.release(x, z);
    this.audio.splash();
    this.completeQuest('hoaDang');
    this.hud.toast('Chiếc hoa đăng lặng lẽ trôi theo dòng sông Hương, mang theo lời nguyện ước của bạn.', '🪷', 6000);
    this.hud.refresh();
  }

  talk(npc) {
    const fn = DIALOGS[npc.id];
    if (!fn) return;
    this.openUI();
    const node = fn(this, npc);
    this.hud.dialog(node, () => this.closeUI());
  }

  openUI() {
    if (this.mode === 'play' || this.mode === 'ride') { this.prevMode = this.mode; this.mode = 'ui'; }
    this.input.unlock();
    if (this.photo) this.togglePhoto(false);
  }
  closeUI() {
    if (this.mode === 'ui') this.mode = this.ride ? 'ride' : (this.prevMode || 'play');
    if (this.mode === 'ui') this.mode = 'play';
    this.input.pressed.clear();
    this.input.lock();
  }

  openMap(travel = false) { this.openUI(); this.hud.openMap(travel, () => this.closeUI()); }

  fastTravel(id) {
    const a = ARRIVE[id];
    if (!a) return;
    if (!this.pay(PRICES.cyclo, 'xích lô')) return;
    this.hud.closePanels();
    this.hud.fade(() => {
      this.player.setPosition(a[0], a[1], a[2]);
      this.player.pitch = 0;
      this.advance(0.35);
      this.closeUI();
      this.hud.toast(`Bác Tư đã chở bạn đến ${PLACES[id] ? PLACES[id].name : 'nơi cần đến'}. "Đi vui nghe cháu!"`, '🛺');
    }, 'Ngồi xích lô dạo phố…');
  }

  // ================= Thuyền rồng =================
  startRide(kind) {
    const price = kind === 'cruise' ? PRICES.cruise : PRICES.boat;
    if (!this.pay(price, 'vé thuyền')) return;
    const pts = {
      toThienMu: [[40, 18], [20, 12], [-60, 4], [-200, -4], [-300, -14], [-332, -30]],
      toDock: [[-332, -30], [-300, -14], [-200, -4], [-60, 4], [20, 12], [40, 18]],
      cruise: [[40, 18], [0, 10], [-80, 2], [-150, -6], [-176, 4], [-150, 14], [-60, 16], [20, 20], [40, 18]],
    }[kind];
    const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
    this.hud.fade(() => {
      this.ride = { kind, curve, t: 0, len: curve.getLength(), speed: kind === 'cruise' ? 6 : 9, noted: false };
      this.river.riding = true;
      this.player.mode = 'ride';
      this.player.bike.visible = false;
      this.player.yaw = kind === 'toDock' ? -Math.PI / 2 : Math.PI / 2;
      this.player.pitch = -0.05;
      this.mode = 'ride';
      if (kind === 'cruise') {
        this.performers.forEach(n => { n.hidden = false; n.attach = this.river.ride; });
        this.audio.setMusic('cahue');
        this.hud.subtitle('🎶 Ca Huế trên sông Hương — điệu Nam Ai…', 6000);
      } else this.audio.setMusic('explore');
      this.stamp('songHuong');
      this.input.lock();
      this.hud.toast(kind === 'cruise' ? 'Thuyền rời bến. Nhấn <b>F</b> để thả hoa đăng, <b>E</b> để về bến ngay.' : 'Thuyền rồng rẽ sóng sông Hương. Nhấn <b>E</b> nếu muốn đến nơi ngay.', '🐉', 6000);
      this._updateRide(0);
    }, 'Lên thuyền rồng…');
  }

  _updateRide(dt) {
    const r = this.ride;
    r.t = Math.min(1, r.t + (r.speed * dt) / r.len);
    const p = r.curve.getPointAt(r.t), tg = r.curve.getTangentAt(Math.min(0.999, r.t));
    const boat = this.river.ride;
    boat.position.set(p.x, RIVER.water - 0.25 + Math.sin(performance.now() / 700) * 0.05, p.z);
    boat.rotation.y = Math.atan2(tg.x, tg.z);
    boat.updateMatrixWorld(true);
    const seat = boat.localToWorld(new THREE.Vector3(0.9, 0.62 - 0.5, 1.6));
    this.player.pos.copy(seat);
    if (r.kind === 'cruise' && r.t > 0.6 && !r.noted) { r.noted = true; this.completeQuest('caHue'); }
    if (r.t >= 1) this.endRide();
  }

  endRide() {
    const r = this.ride;
    if (!r || r.ending) return;
    r.ending = true;
    this.hud.fade(() => {
      const dest = r.kind === 'toThienMu' ? [P.tmPier.x, -39, 0] : [P.dock.x, 38, Math.PI];
      if (r.kind === 'cruise') this.completeQuest('caHue');
      this.ride = null;
      this.river.riding = false;
      this.river.ride.position.copy(this.river.rideBase);
      this.river.ride.rotation.set(0, Math.PI / 2, 0);
      this.performers.forEach(n => { n.hidden = true; n.attach = null; });
      this.audio.setMusic('off');
      this.player.mode = 'walk';
      this.player.setPosition(dest[0], dest[1], dest[2]);
      this.mode = 'play';
      this.hud.toast(r.kind === 'toThienMu' ? 'Đã đến bến chùa Thiên Mụ. Leo bậc đá lên đồi Hà Khê nhé!' : 'Thuyền đã về bến. Cảm ơn bạn đã đồng hành!', '⚓');
    }, 'Thuyền cập bến…');
  }

  // ================= Chụp ảnh =================
  togglePhoto(on = null) {
    this.photo = on ?? !this.photo;
    this.camera.fov = this.photo ? this.baseFov * 0.8 : this.baseFov;
    this.camera.updateProjectionMatrix();
    this.hud.photoMode(this.photo);
  }

  capture() {
    this.pendingCapture = false;
    const src = this.renderer.domElement;
    if (!src.width || !src.height) return;
    const W = 480, H = 300;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    const sr = src.width / src.height, tr = W / H;
    let sw = src.width, sh = src.height, sx = 0, sy = 0;
    if (sr > tr) { sw = sh * tr; sx = (src.width - sw) / 2; } else { sh = sw / tr; sy = (src.height - sh) / 2; }
    ctx.drawImage(src, sx, sy, sw, sh, 0, 0, W, H);
    const url = cv.toDataURL('image/jpeg', 0.82);
    // nhận diện địa danh trong khung hình
    let best = null, bs = 9;
    const v = new THREE.Vector3();
    for (const [id, pl] of Object.entries(PLACES)) {
      if (!pl.photo) continue;
      v.set(pl.photo.x, pl.photo.y, pl.photo.z);
      const d = v.distanceTo(this.camera.position);
      if (d > pl.photo.d) continue;
      v.project(this.camera);
      if (v.z > 1 || Math.abs(v.x) > 0.8 || Math.abs(v.y) > 0.85) continue;
      const score = Math.abs(v.x) + d / pl.photo.d;
      if (score < bs) { bs = score; best = id; }
    }
    const cap = best ? PLACES[best].name : 'Khoảnh khắc ở Huế';
    this.album.push({ url, cap, day: this.state.day, time: this.clockStr(), place: best });
    if (this.album.length > 30) this.album.shift();
    this.audio.shutter();
    this.hud.flash();
    if (best && !this.state.photos[best]) {
      this.state.photos[best] = true;
      const n = Object.keys(this.state.photos).length;
      this.hud.toast(`Ảnh đẹp: <b>${cap}</b>!${this.state.inv.aoDai ? ' (Áo dài tím thật hợp cảnh!)' : ''}`, '📸');
      this.progressQuest('photo', n);
    } else this.hud.toast(best ? `Thêm một tấm ảnh ${cap}.` : 'Đã lưu ảnh vào album.', '📷', 2500);
    this.hud.refresh();
  }

  // ================= Cập nhật mỗi khung hình =================
  update(dt) {
    const inp = this.input, pl = this.player;
    if (this.mode === 'ui' || this.mode === 'intro' || this.mode === 'title') { this.hud.prompt(null); return; }
    const s = this.state;
    // thời gian
    this.advance(dt * TIME_SCALE);
    this.hud.setClock(s.time, s.day, this.sky.rain > 0.3);
    // thời tiết
    this.weatherT -= dt;
    if (this.weatherT <= 0) {
      this.weatherT = 40 + Math.random() * 60;
      if (this.rainTarget > 0) { if (Math.random() < 0.5) { this.rainTarget = 0; this.hud.toast('Mưa đã tạnh. Trời Huế trong veo trở lại.', '🌤️'); } }
      else if (Math.random() < 0.12) { this.rainTarget = 0.6 + Math.random() * 0.4; this.hud.toast('Trời đổ mưa… "Mưa Huế" nổi tiếng đó!', '🌧️'); }
    }
    this.sky.rain += (this.rainTarget - this.sky.rain) * Math.min(1, dt * 0.15);

    // phím tắt
    if (inp.hit('Tab') || inp.hit('KeyJ')) { this.openUI(); this.hud.openJournal(() => this.closeUI()); return; }
    if (inp.hit('KeyM')) { this.openMap(false); return; }
    if (inp.hit('Escape') && this.photo) { this.togglePhoto(false); }
    if (inp.hit('KeyC')) this.togglePhoto();
    if (inp.hit('KeyB') && s.inv.bike && this.mode === 'play') this.toggleBike();

    if (this.mode === 'ride') {
      pl.update(dt, inp, { photo: this.photo });
      this._updateRide(dt);
      if (this.ride && this.ride.kind === 'cruise' && s.inv.lantern > 0) {
        this.hud.prompt('Thả hoa đăng', 'F');
        if (inp.hit('KeyF')) {
          const bp = this.river.ride.localToWorld(new THREE.Vector3(2.4, 0, 1));
          this.releaseLantern(bp.x, bp.z);
        }
      } else this.hud.prompt(this.photo ? null : 'Đến nơi ngay', 'E');
      if (inp.hit('KeyE') && this.ride && !this.photo) this.endRide();
      if (this.photo && inp.click) this.pendingCapture = true;
      this._ambient(dt);
      return;
    }

    const res = pl.update(dt, inp, { photo: this.photo });
    if (res.step) this.audio.footstep(pl.surface, res.running);
    if (res.fell) this.hud.toast('Ối! Cẩn thận kẻo té xuống sông nghe!', '💦');

    // chụp ảnh
    if (this.photo) {
      if (inp.wheel) { this.camera.fov = Math.max(25, Math.min(this.baseFov, this.camera.fov + inp.wheel * 0.02)); this.camera.updateProjectionMatrix(); }
      if (inp.click || inp.hit('Mouse0')) this.pendingCapture = true;
    }

    // vị trí → con dấu, nhiệm vụ
    const p = pl.pos;
    for (const [id, pc] of Object.entries(PLACES)) {
      if (s.stamps[id]) continue;
      if ((p.x - pc.x) ** 2 + (p.z - pc.z) ** 2 < pc.r * pc.r) {
        if (id === 'thaiHoa' && !s.inv.ticketDaiNoi) continue;
        if (id === 'khaiDinh' && !s.inv.ticketKhaiDinh && p.z > 282) continue;
        this.stamp(id);
      }
    }
    if (Math.abs(p.x - 100) < 6 && p.y > 2) {
      if (p.z > 38) s.bridge.s = true;
      if (p.z < -38) s.bridge.n = true;
      if (s.bridge.s && s.bridge.n) this.completeQuest('bridge');
    }
    if (Math.abs(p.x + 70) < 17.5 && Math.abs(p.z + 102) < 13.5 && p.y > 6) this.completeQuest('kyDai');
    if (s.inv.ticketDaiNoi && p.z < -193 && p.z > -290 && Math.abs(p.x + 70) < 50) this.completeQuest('ngoMon');
    const ki = this.W.spots.khaiDinhInside;
    if (Math.abs(p.x - ki.x) < 13 && Math.abs(p.z - ki.z) < 8 && p.y > 12) this.completeQuest('khaiDinh');
    if (p.z < -100 && p.z > -330 && p.x > -190 && p.x < 50 && !s.hints.citadel) { s.hints.citadel = true; this.hud.toast('Bạn đã vào Kinh Thành Huế — tòa thành được xây từ thời vua Gia Long.', '🏯'); }

    // tương tác
    this._updateInteract();
    this._ambient(dt);

    this.saveT += dt;
    if (this.saveT > 20) { this.saveT = 0; this.save(); }
  }

  _ambient(dt) {
    // người dân thả hoa đăng ban đêm
    if (this.isNight()) {
      this.ambientLanternT -= dt;
      if (this.ambientLanternT <= 0) {
        this.ambientLanternT = 4 + Math.random() * 6;
        const spots = [[30 + Math.random() * 30, 26], [-330 - Math.random() * 20, -30]];
        const sp = spots[Math.random() < 0.75 ? 0 : 1];
        this.lanterns.release(sp[0], sp[1] + (Math.random() - 0.5) * 6);
      }
    }
  }

  _updateInteract() {
    const pl = this.player, inp = this.input;
    if (this.photo) { this.hud.prompt(null); return; }
    const fwd = pl.forward();
    let best = null, bd = 1e9;
    // NPC
    for (const n of this.people.list) {
      if (!n.name || n.hidden || !n.group.visible) continue;
      const dx = n.group.position.x - pl.pos.x, dz = n.group.position.z - pl.pos.z;
      const d = Math.hypot(dx, dz);
      if (d > 3.5 || Math.abs(n.group.position.y - pl.pos.y) > 2.2) continue;
      const dot = (dx * fwd.x + dz * fwd.z) / (d * Math.hypot(fwd.x, fwd.z) + 1e-6);
      if (dot < 0.35) continue;
      const score = d - dot;
      if (score < bd) { bd = score; best = { label: `Nói chuyện với ${n.name}`, sub: n.role, key: 'KeyE', act: () => this.talk(n) }; }
    }
    // đồ vật
    for (const o of this.objects) {
      if (o.cond && !o.cond()) continue;
      const d = Math.hypot(o.x - pl.pos.x, o.z - pl.pos.z);
      if (d > o.r || Math.abs((o.y ?? 0) - pl.pos.y) > 3) continue;
      if (d - 1 < bd) { bd = d - 1; best = { label: typeof o.label === 'function' ? o.label() : o.label, key: o.key, act: o.act }; }
    }
    this.interactTarget = best;
    if (best) {
      this.hud.prompt(best.label, best.key === 'KeyF' ? 'F' : 'E', best.sub);
      if (inp.hit(best.key)) best.act();
    } else this.hud.prompt(null);
  }
}
