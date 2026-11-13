// Giao diện: HUD, la bàn, bản đồ mini, hội thoại, hộ chiếu, bản đồ, menu
import { PLACES, FOODS, QUESTS, SIDE, vnd, HUE_WORDS, PRICES } from '../game/data.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function stampSVG(id, date = '', size = 96, faded = false) {
  const p = PLACES[id];
  const col = faded ? '#9a8a6a' : p.color || '#a52a1e';
  const uid = 'sp' + id + Math.random().toString(36).slice(2, 6);
  const rot = (id.length * 37) % 24 - 12;
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" style="transform:rotate(${rot}deg)">
    <defs><path id="${uid}" d="M50,50 m-35,0 a35,35 0 1,1 70,0 a35,35 0 1,1 -70,0"/></defs>
    <g opacity="${faded ? 0.6 : 0.88}">
    <circle cx="50" cy="50" r="46" fill="none" stroke="${col}" stroke-width="3.2"/>
    <circle cx="50" cy="50" r="40.5" fill="none" stroke="${col}" stroke-width="1.2"/>
    <circle cx="50" cy="50" r="24" fill="none" stroke="${col}" stroke-width="1" stroke-dasharray="2 2"/>
    <text font-family="Be Vietnam Pro" font-size="8.6" font-weight="700" fill="${col}" letter-spacing="0.6"><textPath href="#${uid}" startOffset="25%" text-anchor="middle">${esc(p.name.toUpperCase())}</textPath></text>
    <text x="50" y="58" font-size="22" text-anchor="middle">${faded ? '' : p.icon}</text>
    ${faded ? `<text x="50" y="57" font-size="18" text-anchor="middle" fill="${col}" font-family="Cormorant Garamond" font-weight="700">?</text>` : ''}
    <text x="50" y="84" font-family="Be Vietnam Pro" font-size="7" font-weight="700" fill="${col}" text-anchor="middle" letter-spacing="1">${esc(date || 'HUẾ')}</text>
    </g></svg>`;
}

export function foodSVG(key, size = 92) {
  const c = FOODS[key].colors;
  const dots = Array.from({ length: 9 }, (_, i) => {
    const a = i * 2.39, r = 6 + (i % 3) * 7;
    return `<circle cx="${50 + Math.cos(a) * r * 1.6}" cy="${44 + Math.sin(a) * r * 0.55}" r="${3 + (i % 2) * 2}" fill="${c[1 + (i % 3)]}"/>`;
  }).join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100">
    <ellipse cx="50" cy="82" rx="34" ry="6" fill="rgba(60,40,20,.18)"/>
    <path d="M12 44 Q14 80 50 80 Q86 80 88 44 Z" fill="#f4f0e6" stroke="#2d5f9a" stroke-width="2"/>
    <path d="M20 58 Q50 66 80 58" fill="none" stroke="#2d5f9a" stroke-width="1.5" stroke-dasharray="4 3"/>
    <ellipse cx="50" cy="44" rx="38" ry="12" fill="${c[0]}" stroke="#2d5f9a" stroke-width="2"/>
    ${dots}
    ${key === 'bunbo' || key === 'comhen' ? '<path d="M64 20 L86 46 M70 18 L90 42" stroke="#8a5a2a" stroke-width="2.4" stroke-linecap="round"/>' : ''}
    <path d="M40 24 q-4 -8 0 -14 M52 22 q-4 -8 0 -14 M64 24 q-4 -8 0 -14" stroke="rgba(255,255,255,.7)" stroke-width="2" fill="none"/>
  </svg>`;
}

export class HUD {
  constructor() {
    this.game = null;
    this.el = {
      hud: $('#hud'), clock: $('#clock'), money: $('#money b'), delta: $('#money-delta'),
      strip: $('#compass .c-strip'), obj: $('#objective'), mini: $('#minimap'),
      prompt: $('#prompt'), toasts: $('#toasts'), banner: $('#banner'), sub: $('#subtitle'),
      side: $('#side-card'), dialog: $('#dialog'), modal: $('#modal'), box: $('#modal .m-box'),
      fade: $('#fade'), flash: $('#flash'), photo: $('#photo-ui'),
    };
    this.miniCtx = this.el.mini.getContext('2d');
    this.lastPrompt = '';
    this.journalTab = 'trip';
    this.onModalClose = null;
    this._miniT = 0;
    addEventListener('keydown', (e) => this._keys(e));
  }

  show(on) { this.el.hud.classList.toggle('hidden', !on); document.getElementById('touch').classList.toggle('on', on); }

  // ===== Đồng hồ, tiền
  setClock(t, day, rain) {
    const h = Math.floor(t), m = Math.floor((t - h) * 60);
    const icon = rain ? '🌧️' : t >= 5.5 && t < 17.5 ? '☀️' : t >= 17.5 && t < 19 ? '🌇' : t >= 5 && t < 5.5 ? '🌅' : '🌙';
    const s = `<span class="ic">${icon}</span><b>${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}</b><small>Ngày ${day}</small>`;
    if (s !== this._clk) { this.el.clock.innerHTML = s; this._clk = s; }
  }
  setMoney(n, delta = 0) {
    this.el.money.textContent = vnd(n);
    if (delta) {
      this.el.delta.textContent = (delta > 0 ? '+' : '−') + vnd(Math.abs(delta));
      this.el.delta.classList.remove('show'); void this.el.delta.offsetWidth; this.el.delta.classList.add('show');
    }
  }

  // ===== Thông báo
  toast(html, icon = '✦', ms = 4500) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<span class="ti">${icon}</span><span>${html}</span>`;
    this.el.toasts.appendChild(t);
    while (this.el.toasts.children.length > 4) this.el.toasts.firstChild.remove();
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, ms);
  }
  banner(kicker, title) {
    const b = this.el.banner;
    b.innerHTML = `<div class="b-k">${kicker}</div><div class="b-t">${esc(title)}</div><div class="b-l"></div>`;
    b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
  }
  questDone(def) { this.banner(SIDE.includes(def) ? 'Hoàn thành việc phụ' : 'Hoàn thành hành trình', def.title); }
  subtitle(text, ms = 4000) {
    this.el.sub.textContent = text; this.el.sub.classList.add('show');
    clearTimeout(this._subT); this._subT = setTimeout(() => this.el.sub.classList.remove('show'), ms);
  }
  prompt(label, key = 'E', sub = '') {
    const p = this.el.prompt;
    const k = label ? `${key}|${label}|${sub}` : '';
    if (k === this.lastPrompt) return;
    this.lastPrompt = k;
    if (!label) { p.classList.remove('show'); return; }
    p.querySelector('kbd').textContent = key;
    p.querySelector('.p-label').textContent = label;
    p.querySelector('small').textContent = sub || '';
    p.classList.remove('show'); void p.offsetWidth; p.classList.add('show');
  }
  _sideCard(html, ms = 9000) {
    const s = this.el.side;
    s.innerHTML = `<div class="card">${html}<button class="x" title="Đóng">×</button></div>`;
    const card = s.firstChild;
    card.querySelector('.x').onclick = () => { card.classList.add('out'); setTimeout(() => card.remove(), 400); };
    clearTimeout(this._sideT);
    this._sideT = setTimeout(() => { card.classList.add('out'); setTimeout(() => card.remove(), 400); }, ms);
  }
  stampCard(id) {
    const p = PLACES[id], st = this.game.state.stamps[id];
    this._sideCard(`<div class="stamp-big">${stampSVG(id, `NGÀY ${st.day} · ${st.time}`, 96)}</div><div class="k">Đóng dấu hộ chiếu</div><h3>${esc(p.name)}</h3><p>${esc(p.text)}</p>`, 11000);
    this.refresh();
  }
  placeInfo(id) {
    const p = PLACES[id];
    this._sideCard(`<div class="k">${p.icon} Tìm hiểu</div><h3>${esc(p.name)}</h3><p>${esc(p.text)}</p>`, 10000);
  }
  foodCard(key, first) {
    const f = FOODS[key];
    this._sideCard(`<div class="food-art">${foodSVG(key)}</div><div class="k">${first ? 'Món mới!' : 'Ăn thêm một phần'}</div><h3>${esc(f.name)}</h3><p>${esc(f.desc)}</p><p style="margin-top:8px;font-size:12px;color:#8a7a62">${vnd(f.price)} · ${esc(f.vendor)}</p>`, 9000);
    this.refresh();
  }
  flash() { const f = this.el.flash; f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); }
  photoMode(on) { this.el.photo.classList.toggle('hidden', !on); document.body.classList.toggle('photo', on); }
  fade(cb, text = '') {
    const f = this.el.fade;
    f.querySelector('span').textContent = text;
    f.classList.add('on');
    setTimeout(() => {
      try { cb(); } catch (e) { console.error(e); }
      setTimeout(() => f.classList.remove('on'), 650);
    }, 600);
  }

  // ===== La bàn, mục tiêu, bản đồ mini (mỗi khung hình)
  frame(dt, G) {
    const pl = G.player;
    const heading = -pl.yaw;
    const q = G.trackedQuest();
    const tgt = G.targetPos(q);
    // la bàn
    const deg = (a) => ((a * 180 / Math.PI) % 360 + 360) % 360;
    const H = deg(heading);
    const items = [];
    const dirs = [['B', 0, 'card n'], ['ĐB', 45, ''], ['Đ', 90, 'card'], ['ĐN', 135, ''], ['N', 180, 'card'], ['TN', 225, ''], ['T', 270, 'card'], ['TB', 315, '']];
    for (const [t, a, c] of dirs) items.push([a, t, c]);
    for (let a = 15; a < 360; a += 15) if (a % 45) items.push([a, '·', '']);
    for (const [id, p] of Object.entries(PLACES)) {
      const dx = p.x - pl.pos.x, dz = p.z - pl.pos.z;
      if (dx * dx + dz * dz < 420 * 420 && dx * dx + dz * dz > 400) items.push([deg(Math.atan2(dx, -dz)), p.icon, 'poi']);
    }
    let dist = null;
    if (tgt) {
      const dx = tgt.x - pl.pos.x, dz = tgt.z - pl.pos.z;
      dist = Math.hypot(dx, dz);
      items.push([deg(Math.atan2(dx, -dz)), '◆', 'obj']);
    }
    let html = '';
    for (const [a, t, c] of items) {
      let d = a - H; if (d > 180) d -= 360; if (d < -180) d += 360;
      if (Math.abs(d) > 75) continue;
      html += `<span class="${c}" style="left:${50 + (d / 75) * 50}%">${t}</span>`;
    }
    this.el.strip.innerHTML = html;
    const ob = q ? `◆ <b>${esc(q.title)}</b>${dist !== null ? `<small>${dist < 1000 ? Math.round(dist) + ' m' : (dist / 1000).toFixed(1) + ' km'}</small>` : ''}` : (G.state.finished ? '✦ Bạn đã trọn vẹn hành trình — cứ thong thả dạo Huế nhé' : '');
    if (ob !== this._ob) { this.el.obj.innerHTML = ob; this._ob = ob; }
    this._miniT += dt;
    if (this._miniT > 1 / 30 && this.map) { this._miniT = 0; this.map.drawMini(this.miniCtx, pl.pos.x, pl.pos.z, heading, tgt); }
  }

  // ===== Hội thoại
  dialog(node, onClose) {
    const d = this.el.dialog;
    this._dlgClose = onClose;
    if (!node) { this.closeDialog(); return; }
    d.classList.remove('hidden');
    d.querySelector('.d-name').textContent = node.name;
    d.querySelector('.d-role').textContent = node.role || '';
    const tEl = d.querySelector('.d-text');
    const full = node.text;
    let i = 0;
    clearInterval(this._typeT);
    tEl.textContent = '';
    this._typeT = setInterval(() => { i += 2; tEl.textContent = full.slice(0, i); if (i >= full.length) clearInterval(this._typeT); }, 14);
    this._skipType = () => { clearInterval(this._typeT); tEl.textContent = full; };
    const ch = d.querySelector('.d-choices');
    ch.innerHTML = '';
    this._choices = node.choices.map((c, k) => {
      const b = document.createElement('button');
      b.innerHTML = `<i>${k + 1}</i><span>${esc(c.t)}</span>`;
      b.onclick = () => this._choose(c);
      ch.appendChild(b);
      return c;
    });
  }
  _choose(c) {
    this.game.audio.click();
    const next = c.go();
    if (next) this.dialog(next, this._dlgClose);
    else this.closeDialog();
  }
  closeDialog() {
    clearInterval(this._typeT);
    if (this.el.dialog.classList.contains('hidden')) return;
    this.el.dialog.classList.add('hidden');
    const cb = this._dlgClose; this._dlgClose = null;
    if (cb && this.el.modal.classList.contains('hidden')) cb();
  }
  _keys(e) {
    if (!this.el.dialog.classList.contains('hidden')) {
      const n = parseInt(e.key);
      if (n >= 1 && n <= (this._choices || []).length) { this._skipType && this._skipType(); this._choose(this._choices[n - 1]); e.preventDefault(); }
      else if (e.code === 'Escape') this.closeDialog();
      else if (e.code === 'Space' || e.code === 'Enter') this._skipType && this._skipType();
      return;
    }
    if (!this.el.modal.classList.contains('hidden')) {
      if (e.code === 'Escape' || (e.code === 'Tab' && this._modalKind === 'journal') || (e.code === 'KeyM' && this._modalKind === 'map')) { e.preventDefault(); this.closeModal(); }
    }
  }

  // ===== Modal chung
  openModal(html, kind, onClose, cls = 'panel-dark') {
    this.closeDialog();
    this._modalKind = kind;
    this.onModalClose = onClose;
    this.el.box.className = 'm-box ' + cls;
    this.el.box.innerHTML = html;
    this.el.modal.classList.remove('hidden');
    this.el.box.scrollTop = 0;
    const x = this.el.box.querySelector('.m-close');
    if (x) x.onclick = () => this.closeModal();
  }
  closeModal() {
    if (this.el.modal.classList.contains('hidden')) return;
    this.el.modal.classList.add('hidden');
    this._modalKind = null;
    const cb = this.onModalClose; this.onModalClose = null;
    if (cb) cb();
  }
  closePanels() { this.closeModal(); }
  modalOpen() { return !this.el.modal.classList.contains('hidden') || !this.el.dialog.classList.contains('hidden'); }

  intro(cb) {
    this.openModal(`<div class="intro">
      <div class="k">Ngày 1 · 07:00 sáng</div>
      <h2>Chào mừng đến <em>Huế</em></h2>
      <p>Chuyến tàu Thống Nhất dừng lại ở Ga Huế khi nắng sớm vừa lên. Trong ví bạn có <b>${vnd(1000000)}</b>, một cuốn hộ chiếu du lịch còn trống trang, và cả cố đô đang chờ phía trước.</p>
      <p style="font-size:14px;color:rgba(246,238,220,.65)">Đi bộ bằng <b>WASD</b>, nhìn bằng <b>chuột</b>, <b>Shift</b> để chạy, <b>E</b> để trò chuyện. Mở <b>Hộ chiếu</b> bằng phím <b>Tab</b> để xem các việc nên làm. La bàn phía trên màn hình luôn chỉ đường ◆ đến mục tiêu.</p>
      <button class="btn primary" id="intro-go">Bước ra khỏi nhà ga</button>
    </div>`, 'intro', cb);
    $('#intro-go').onclick = () => this.closeModal();
  }

  // ===== Hộ chiếu / nhật ký
  openJournal(onClose, tab = null) {
    if (tab) this.journalTab = tab;
    this.openModal(`<button class="m-close dark">×</button>
      <div class="pp-head"><div class="pp-emblem">順</div><div><h2>Hộ chiếu du lịch Huế</h2><div class="sub">Passport · Cố đô Huế · Di sản Thế giới</div></div></div>
      <div class="tabs">
        ${[['trip', 'Hành trình'], ['stamps', 'Con dấu'], ['food', 'Ẩm thực'], ['album', 'Album ảnh'], ['bag', 'Hành lý']].map(([k, t]) => `<button data-tab="${k}" class="${this.journalTab === k ? 'on' : ''}">${t}</button>`).join('')}
      </div>
      <div class="tab-body" id="tab-body"></div>`, 'journal', onClose, 'passport');
    this.el.box.querySelectorAll('.tabs button').forEach(b => b.onclick = () => {
      this.journalTab = b.dataset.tab;
      this.el.box.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b));
      this._renderTab();
    });
    this._renderTab();
  }
  refresh() { if (this._modalKind === 'journal') this._renderTab(); }

  _renderTab() {
    const G = this.game, s = G.state, body = $('#tab-body');
    if (!body) return;
    const tr = G.trackedQuest();
    if (this.journalTab === 'trip') {
      const n = G.mainDone();
      const item = (q) => {
        const st = s.quests[q.id];
        return `<div class="q-item ${st.done ? 'done' : ''} ${tr && tr.id === q.id ? 'tracked' : ''}" data-q="${q.id}">
          <div class="q-check">${st.done ? '✓' : ''}</div>
          <div><div class="q-t">${esc(q.title)}</div><div class="q-d">${esc(q.desc)}</div></div>
          ${q.count ? `<div class="q-n">${st.n}/${q.count}</div>` : (tr && tr.id === q.id && !st.done ? '<div class="q-n">◆ đang theo</div>' : '')}
        </div>`;
      };
      body.innerHTML = `<div class="q-cols"><div>
        <h4>Hành trình chính</h4><div class="progress"><i style="width:${n / QUESTS.length * 100}%"></i></div>
        ${QUESTS.map(item).join('')}</div>
        <div><h4>Việc nên thử</h4>${SIDE.map(item).join('')}
        <p style="font-size:12px;color:#8a7a62;margin-top:14px">Bấm vào một việc để la bàn chỉ đường đến đó.</p></div></div>`;
      body.querySelectorAll('.q-item').forEach(el => el.onclick = () => {
        const id = el.dataset.q;
        if (s.quests[id].done) return;
        s.tracked = id; G.audio.click(); this._renderTab();
      });
    } else if (this.journalTab === 'stamps') {
      const ids = Object.keys(PLACES);
      body.innerHTML = `<p style="margin:0 0 12px;color:#6a5a44;font-size:14px">Đã đóng ${ids.filter(i => s.stamps[i]).length}/${ids.length} con dấu. Bấm vào con dấu để đọc thêm.</p>
        <div class="stamps">${ids.map(id => {
          const st = s.stamps[id];
          return `<div class="st ${st ? '' : 'off'}" data-p="${id}">${stampSVG(id, st ? `NGÀY ${st.day} · ${st.time}` : '', 104, !st)}<div class="nm">${esc(PLACES[id].name)}</div><div class="dt">${st ? `Ngày ${st.day}, ${st.time}` : 'Chưa ghé thăm'}</div></div>`;
        }).join('')}</div><div id="pdetail"></div>`;
      body.querySelectorAll('.st').forEach(el => el.onclick = () => {
        const id = el.dataset.p, p = PLACES[id];
        $('#pdetail').innerHTML = `<div class="place-detail"><h4>${p.icon} ${esc(p.name)}</h4>${s.stamps[id] ? esc(p.text) : '<i>Hãy đến tận nơi để mở khóa câu chuyện về địa danh này.</i>'}</div>`;
      });
    } else if (this.journalTab === 'food') {
      body.innerHTML = `<p style="margin:0 0 12px;color:#6a5a44;font-size:14px">Ẩm thực Huế từng là ẩm thực cung đình — tinh tế, nhiều món nhỏ, cay và đậm đà. Các quán nằm ở phố ẩm thực bên đường Hà Nội.</p>
        <div class="foods">${Object.entries(FOODS).map(([k, f]) => `<div class="fd ${s.foods[k] ? '' : 'off'}">${foodSVG(k, 70)}<div><div class="nm">${esc(f.name)}</div><div class="pr">${vnd(f.price)} · ${esc(f.vendor)}</div><div style="font-size:12px;margin-top:4px">${s.foods[k] ? `Đã ăn ${s.foods[k]} lần ✓` : 'Chưa thưởng thức'}</div></div></div>`).join('')}</div>`;
    } else if (this.journalTab === 'album') {
      const al = G.album;
      body.innerHTML = al.length ? `<div class="album">${al.map((a, i) => `<div class="ph" style="--r:${(i * 37 % 7) - 3}deg" data-i="${i}"><img src="${a.url}" alt=""><div class="cap">${esc(a.cap)}</div><div class="tm">Ngày ${a.day} · ${a.time}</div></div>`).join('')}</div>`
        : '<div class="empty">Chưa có tấm ảnh nào. Nhấn phím C để mở máy ảnh, rồi nhấn chuột để chụp các địa danh.</div>';
      body.querySelectorAll('.ph').forEach(el => el.onclick = () => {
        const a = al[+el.dataset.i];
        body.innerHTML = `<div class="lightbox"><img src="${a.url}"><p style="font:italic 600 22px var(--serif);margin:10px 0 0">${esc(a.cap)}</p><button class="btn small" style="margin-top:10px;color:var(--muc)" id="lb-back">← Quay lại album</button></div>`;
        $('#lb-back').onclick = () => this._renderTab();
      });
    } else {
      const inv = s.inv;
      const items = [
        ['🎫', 'Vé Đại Nội', inv.ticketDaiNoi], ['🎟️', 'Vé lăng Khải Định', inv.ticketKhaiDinh], ['👒', 'Nón bài thơ', inv.nonLa],
        ['👘', 'Áo dài tím', inv.aoDai], ['🚲', 'Xe đạp thuê', inv.bike], ['🍬', 'Mè xửng', inv.meXung], ['🪷', `Hoa đăng × ${inv.lantern}`, inv.lantern > 0],
      ];
      body.innerHTML = `<div class="inv">${items.map(([i, t, on]) => `<div class="it ${on ? '' : 'off'}"><b>${i}</b>${t}</div>`).join('')}</div>
        <h4 style="font:700 20px var(--serif);color:var(--tim);margin:20px 0 4px">Thống kê chuyến đi</h4>
        <div class="stats">
          <div><b>${vnd(s.money)}</b>Tiền còn lại</div><div><b>${vnd(s.spent)}</b>Đã chi tiêu</div>
          <div><b>${(G.player.distance / 1000).toFixed(2)} km</b>Quãng đường</div><div><b>${s.day}</b>Ngày ở Huế</div>
          <div><b>${Object.keys(s.stamps).length}</b>Con dấu</div><div><b>${G.album.length}</b>Tấm ảnh</div>
        </div>
        <h4 style="font:700 20px var(--serif);color:var(--tim);margin:20px 0 4px">Từ điển tiếng Huế bỏ túi</h4>
        <div class="dict">${HUE_WORDS.map(([a, b]) => `<span><b>${a}</b> = ${b}</span>`).join('')}</div>`;
    }
  }

  // ===== Bản đồ
  openMap(travel, onClose) {
    const G = this.game, s = G.state;
    const dests = [['ga', 'Ga Huế'], ['food', 'Phố ẩm thực'], ['hotel', 'Khách sạn Hương Giang'], ['benThuyen', 'Bến thuyền rồng'], ['trangTien', 'Cầu Tràng Tiền'], ['kyDai', 'Kỳ Đài'], ['ngoMon', 'Ngọ Môn'], ['dongBa', 'Chợ Đông Ba'], ['thienMu', 'Chùa Thiên Mụ'], ['khaiDinh', 'Lăng Khải Định']];
    const known = (id) => id === 'food' || id === 'hotel' || s.stamps[id];
    this.openModal(`<button class="m-close">×</button><h2>Bản đồ <em>Huế</em></h2>
      <div class="sub">◆ mục tiêu hiện tại · ▲ vị trí của bạn · biểu tượng mờ là nơi chưa ghé</div>
      <div class="mapwrap"><canvas class="map-canvas" id="fullmap"></canvas>
      <div class="travel"><div class="hint">🛺 <b>Gọi xích lô</b> — bác Tư chở bạn đến nơi đã ghé (${vnd(PRICES.cyclo)} / cuốc, mất khoảng 20 phút).</div>
      ${dests.map(([id, name]) => `<button data-d="${id}" ${known(id) ? '' : 'disabled'}>${PLACES[id] ? PLACES[id].icon : id === 'food' ? '🍜' : '🏨'} ${name}<small>${known(id) ? vnd(PRICES.cyclo) : 'chưa ghé'}</small></button>`).join('')}
      </div></div>`, 'map', onClose);
    const tgt = G.targetPos(G.trackedQuest());
    this.map.drawFull($('#fullmap'), G.player.pos.x, G.player.pos.z, -G.player.yaw, tgt, s.stamps);
    this.el.box.querySelectorAll('.travel button[data-d]').forEach(b => b.onclick = () => G.fastTravel(b.dataset.d));
  }

  // ===== Tạm dừng, cài đặt, hướng dẫn
  openPause(h) {
    this.openModal(`<button class="m-close">×</button><h2>Tạm <em>dừng</em></h2><div class="sub">Huế vẫn chờ bạn…</div>
      <div class="menu-list">
        <button class="btn primary" data-a="resume">Tiếp tục</button>
        <button class="btn" data-a="journal">Hộ chiếu & nhiệm vụ</button>
        <button class="btn" data-a="map">Bản đồ</button>
        <button class="btn" data-a="settings">Cài đặt</button>
        <button class="btn" data-a="help">Hướng dẫn</button>
        <button class="btn" data-a="save">Lưu hành trình</button>
        <button class="btn ghost" data-a="quit">Lưu & về màn hình chính</button>
      </div>`, 'pause', h.onClose);
    this.el.box.querySelectorAll('[data-a]').forEach(b => b.onclick = () => h[b.dataset.a]());
  }
  openSettings(st, onChange, onClose) {
    const seg = (key, opts) => `<div class="seg" data-k="${key}">${opts.map(([v, t]) => `<button data-v="${v}" class="${st[key] === v ? 'on' : ''}">${t}</button>`).join('')}</div>`;
    const range = (key, label, min, max, step) => `<label>${label}<input type="range" data-k="${key}" min="${min}" max="${max}" step="${step}" value="${st[key]}"></label>`;
    this.openModal(`<button class="m-close">×</button><h2>Cài <em>đặt</em></h2><div class="sub">Thay đổi được áp dụng ngay</div>
      <div class="set-grid">
        ${range('master', 'Âm lượng tổng', 0, 1, 0.05)}${range('music', 'Âm nhạc', 0, 1, 0.05)}
        ${range('sfx', 'Hiệu ứng', 0, 1, 0.05)}${range('amb', 'Âm thanh môi trường', 0, 1, 0.05)}
        ${range('sens', 'Độ nhạy chuột', 0.5, 2.5, 0.05)}${range('fov', 'Góc nhìn (FOV)', 60, 95, 1)}
        <label>Chất lượng đồ họa ${seg('quality', [['low', 'Thấp'], ['mid', 'Vừa'], ['high', 'Cao']])}</label>
        <label>Hiệu ứng phát sáng (bloom) ${seg('bloom', [[true, 'Bật'], [false, 'Tắt']])}</label>
      </div>`, 'settings', onClose);
    this.el.box.querySelectorAll('input[type=range]').forEach(i => i.oninput = () => { st[i.dataset.k] = +i.value; onChange(st); });
    this.el.box.querySelectorAll('.seg').forEach(sg => sg.querySelectorAll('button').forEach(b => b.onclick = () => {
      const v = b.dataset.v === 'true' ? true : b.dataset.v === 'false' ? false : b.dataset.v;
      st[sg.dataset.k] = v;
      sg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
      onChange(st);
    }));
  }
  openHelp(onClose) {
    this.openModal(`<button class="m-close">×</button><h2>Hướng <em>dẫn</em></h2><div class="sub">Thong thả mà chơi, như người Huế</div>
      <div class="help-grid">
        <div><h4>Điều khiển</h4>
          <kbd>W A S D</kbd> Đi lại<br><kbd>Chuột</kbd> Nhìn quanh<br><kbd>Shift</kbd> Chạy<br><kbd>Space</kbd> Nhảy<br>
          <kbd>E</kbd> Trò chuyện / tương tác<br><kbd>F</kbd> Thả hoa đăng<br><kbd>C</kbd> Máy ảnh (nhấn chuột để chụp)<br>
          <kbd>B</kbd> Lên/xuống xe đạp<br><kbd>Tab</kbd> Hộ chiếu & nhiệm vụ<br><kbd>M</kbd> Bản đồ & gọi xích lô<br><kbd>1–9</kbd> Chọn câu trả lời<br><kbd>Esc</kbd> Tạm dừng</div>
        <div><h4>Mẹo du lịch</h4>
          • La bàn phía trên chỉ ◆ đến việc đang theo dõi.<br>
          • Đến gần một địa danh để đóng dấu hộ chiếu và đọc lịch sử.<br>
          • Vé Đại Nội mua ở phòng vé trước Ngọ Môn; vé lăng Khải Định ở chân lăng.<br>
          • Thuyền rồng ban ngày đưa bạn lên chùa Thiên Mụ; từ 18:30 có ca Huế trên sông.<br>
          • Mệt thì về khách sạn Hương Giang nghỉ, hoặc thuê xe đạp cho nhanh.<br>
          • Ban đêm cầu Tràng Tiền đổi màu và hoa đăng trôi đầy sông — đừng bỏ lỡ!</div>
      </div>`, 'help', onClose);
  }

  ending() {
    const G = this.game, s = G.state;
    this.openModal(`<div class="cert">
      <div class="k">Chứng nhận</div>
      <h2>Đã "Đi Huế" trọn vẹn</h2>
      <p>Bạn đã ăn bún bò, qua cầu Tràng Tiền, đứng dưới cờ Kỳ Đài, bước qua Ngọ Môn, nghe chuông Thiên Mụ, leo 127 bậc lăng Khải Định và thả hoa đăng trong đêm ca Huế. Huế cảm ơn bạn đã ghé thăm — "Đi mô cũng nhớ về Huế nghe!"</p>
      <div class="stats">
        <div><b>${s.day}</b>Ngày ở Huế</div><div><b>${(G.player.distance / 1000).toFixed(1)} km</b>Đã đi bộ</div>
        <div><b>${Object.keys(s.stamps).length}/${Object.keys(PLACES).length}</b>Con dấu</div><div><b>${Object.values(s.foods).reduce((a, b) => a + b, 0)}</b>Món đã ăn</div>
        <div><b>${G.album.length}</b>Tấm ảnh</div><div><b>${vnd(s.spent)}</b>Đã chi tiêu</div>
      </div>
      <div class="btns"><button class="btn primary" id="end-go">Tiếp tục dạo Huế</button><button class="btn" id="end-album">Xem album ảnh</button></div>
    </div>`, 'ending', () => G.closeUI(), 'cert-wrap');
    $('#end-go').onclick = () => this.closeModal();
    $('#end-album').onclick = () => { this.onModalClose = null; this.openJournal(() => G.closeUI(), 'album'); };
  }
}
