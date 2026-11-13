// Bố cục bản đồ Huế (đã thu nhỏ). Trục x: Đông(+) / Tây(-); trục z: Nam(+) / Bắc(-)
export const WORLD = { minX: -430, maxX: 300, minZ: -360, maxZ: 420 };
export const RIVER = { half: 41, bank: 44, water: -1.35, bed: -4.5 };

export const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Đường phố: [x1,z1,x2,z2,width]
export const ROADS = [
  // Bờ Nam
  [-430, 72, 300, 72, 9],      // Lê Lợi (dọc sông)
  [-200, 150, 300, 150, 8],    // đường Hà Nội/ phố ẩm thực
  [-300, 230, 300, 230, 8],    // Bùi Thị Xuân (ga)
  [-160, 72, -160, 270, 7],    // đường đi lăng
  [-40, 72, -40, 230, 7],
  [100, 62, 100, 300, 9],      // Hùng Vương (đầu cầu Tràng Tiền)
  [220, 72, 220, 230, 7],
  [-300, 230, -300, 268, 6],
  [-300, 268, -160, 268, 6],
  [-250, 268, -250, 282, 6],   // vào lăng Khải Định
  // Bờ Bắc
  [-430, -72, 300, -72, 9],    // Trần Hưng Đạo / Lê Duẩn
  [100, -62, 100, -72, 9],     // đầu cầu phía Bắc
  [80, -72, 80, -330, 7],      // dọc tường thành phía Đông
  [80, -215, 300, -215, 7],    // qua cửa Đông Ba
  [-70, -122, -70, -168, 10],  // trục Kỳ Đài - Ngọ Môn (bên trong thành)
  [-150, -100, -150, -330, 6], // trong Kinh Thành
  [10, -100, 10, -330, 6],
  [-190, -315, 50, -315, 6],
  [-150, -150, 10, -150, 7],
  [50, -215, 80, -215, 7],     // cửa Đông
  [-150, -95, -150, -72, 8],   // cửa Thể Nhơn
  [10, -95, 10, -72, 8],       // cửa Quảng Đức
];

// Kinh Thành
export const CITADEL = { x0: -190, x1: 50, z0: -330, z1: -100, wallH: 6, thick: 6 };
export const IMPERIAL = { x0: -120, x1: -20, z0: -292, z1: -178 };

// Các điểm quan trọng
export const P = {
  spawn: { x: -60, z: 236, yaw: 0 },
  ga: { x: -60, z: 255 },
  bridge: { x: 100, z0: -46, z1: 46, deck: 2.4, ramp: 15 },
  kyDai: { x: -70, z: -102 },
  ngoMon: { x: -70, z: -178 },
  thaiHoa: { x: -70, z: -232 },
  cuuDinh: { x: -100, z: -262 },
  dongBa: { x: 160, z: -118 },
  thienMu: { x: -340, z: -118 },
  tower: { x: -340, z: -98 },
  bell: { x: -321, z: -100 },
  khaiDinh: { x: -250, z: 378 },
  dock: { x: 40, z: 44 },
  tmPier: { x: -340, z: -44 },
  hotel: { x: 160, z: 92 },
  food: { x: 40, z: 140 },
  aoDai: { x: -12, z: 88 },
  dongBaStalls: { x: 160, z: -90 },
};
