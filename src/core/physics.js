// Va chạm 2.5D đơn giản: hộp xoay (OBB) + hình tròn trên mặt phẳng XZ có khoảng Y,
// và các "sàn" (mặt phẳng/dốc) để đi lên cầu, đài, bến thuyền.
const CELL = 16;

export class Physics {
  constructor(heightFn) {
    this.heightFn = heightFn;
    this.grid = new Map();
    this.colliders = [];
    this.floors = [];
  }

  _key(ix, iz) { return (ix + 2048) * 4096 + (iz + 2048); }
  _insert(obj, minx, maxx, minz, maxz) {
    const x0 = Math.floor(minx / CELL), x1 = Math.floor(maxx / CELL);
    const z0 = Math.floor(minz / CELL), z1 = Math.floor(maxz / CELL);
    for (let ix = x0; ix <= x1; ix++) for (let iz = z0; iz <= z1; iz++) {
      const k = this._key(ix, iz);
      let c = this.grid.get(k);
      if (!c) { c = []; this.grid.set(k, c); }
      c.push(obj);
    }
  }
  _cell(x, z) { return this.grid.get(this._key(Math.floor(x / CELL), Math.floor(z / CELL))); }

  addBox(cx, cz, hw, hd, angle, yMin, yMax, tag) {
    const c = Math.cos(angle), s = Math.sin(angle);
    const o = { type: 'box', cx, cz, hw, hd, c, s, yMin, yMax, enabled: true, tag };
    const ex = Math.abs(hw * c) + Math.abs(hd * s), ez = Math.abs(hw * s) + Math.abs(hd * c);
    this._insert(o, cx - ex, cx + ex, cz - ez, cz + ez);
    this.colliders.push(o);
    return o;
  }
  addCircle(cx, cz, r, yMin, yMax, tag) {
    const o = { type: 'circle', cx, cz, r, yMin, yMax, enabled: true, tag };
    this._insert(o, cx - r, cx + r, cz - r, cz + r);
    this.colliders.push(o);
    return o;
  }
  // Sàn: chiều cao biến thiên tuyến tính theo trục z cục bộ từ y0 (phía -hd) đến y1 (phía +hd)
  addFloor(cx, cz, hw, hd, angle, y0, y1 = y0) {
    const c = Math.cos(angle), s = Math.sin(angle);
    const o = { type: 'floor', cx, cz, hw, hd, c, s, y0, y1, enabled: true };
    const ex = Math.abs(hw * c) + Math.abs(hd * s), ez = Math.abs(hw * s) + Math.abs(hd * c);
    this._insert(o, cx - ex, cx + ex, cz - ez, cz + ez);
    this.floors.push(o);
    return o;
  }

  // Chiều cao mặt đất tại (x,z) đối với người có bàn chân ở feetY
  groundAt(x, z, feetY = 1e9, step = 0.75) {
    let h = this.heightFn(x, z);
    let surface = 'ground';
    const cell = this._cell(x, z);
    if (cell) {
      for (const f of cell) {
        if (f.type !== 'floor' || !f.enabled) continue;
        const dx = x - f.cx, dz = z - f.cz;
        const lx = dx * f.c - dz * f.s, lz = dx * f.s + dz * f.c;
        if (lx < -f.hw || lx > f.hw || lz < -f.hd || lz > f.hd) continue;
        const t = (lz + f.hd) / (2 * f.hd);
        const fy = f.y0 + (f.y1 - f.y0) * t;
        if (fy <= feetY + step && fy > h) { h = fy; surface = 'wood'; }
      }
    }
    return { h, surface };
  }

  // Đẩy hình tròn (người chơi) ra khỏi vật cản
  resolve(pos, radius, height) {
    const feet = pos.y, head = pos.y + height;
    let hit = false;
    const seen = new Set();
    const cells = [];
    for (const ox of [-radius, radius]) for (const oz of [-radius, radius]) {
      const c = this._cell(pos.x + ox, pos.z + oz);
      if (c && !cells.includes(c)) cells.push(c);
    }
    for (const cell of cells) for (const o of cell) {
      if (o.type === 'floor' || !o.enabled || seen.has(o)) continue;
      seen.add(o);
      if (feet >= o.yMax - 0.3 || head <= o.yMin) continue;
      if (o.type === 'circle') {
        const dx = pos.x - o.cx, dz = pos.z - o.cz;
        const d2 = dx * dx + dz * dz, rr = o.r + radius;
        if (d2 < rr * rr) {
          const d = Math.sqrt(d2) || 0.0001;
          const push = rr - d;
          pos.x += (dx / d) * push; pos.z += (dz / d) * push; hit = true;
        }
      } else {
        const dx = pos.x - o.cx, dz = pos.z - o.cz;
        const lx = dx * o.c - dz * o.s, lz = dx * o.s + dz * o.c;
        const qx = Math.max(-o.hw, Math.min(o.hw, lx));
        const qz = Math.max(-o.hd, Math.min(o.hd, lz));
        let px = 0, pz = 0;
        if (qx === lx && qz === lz) {
          // bên trong: đẩy theo trục có độ xuyên ít nhất
          const penX = o.hw - Math.abs(lx), penZ = o.hd - Math.abs(lz);
          if (penX < penZ) px = (lx >= 0 ? 1 : -1) * (penX + radius);
          else pz = (lz >= 0 ? 1 : -1) * (penZ + radius);
        } else {
          const ddx = lx - qx, ddz = lz - qz;
          const d2 = ddx * ddx + ddz * ddz;
          if (d2 >= radius * radius) continue;
          const d = Math.sqrt(d2) || 0.0001;
          const push = radius - d;
          px = (ddx / d) * push; pz = (ddz / d) * push;
        }
        // về toạ độ thế giới
        pos.x += px * o.c + pz * o.s;
        pos.z += -px * o.s + pz * o.c;
        hit = true;
      }
    }
    return hit;
  }

  // Kiểm tra một điểm có nằm trong vật cản không (để đặt NPC, xe...)
  blocked(x, z, y = 0.5) {
    const cell = this._cell(x, z);
    if (!cell) return false;
    for (const o of cell) {
      if (o.type === 'floor' || !o.enabled) continue;
      if (y > o.yMax || y < o.yMin) continue;
      if (o.type === 'circle') { if ((x - o.cx) ** 2 + (z - o.cz) ** 2 < o.r * o.r) return true; }
      else {
        const dx = x - o.cx, dz = z - o.cz;
        const lx = dx * o.c - dz * o.s, lz = dx * o.s + dz * o.c;
        if (Math.abs(lx) <= o.hw && Math.abs(lz) <= o.hd) return true;
      }
    }
    return false;
  }
}
