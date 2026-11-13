// Nội dung: địa danh (con dấu hộ chiếu), món ăn, nhiệm vụ, hội thoại
export const START_MONEY = 1000000;
export const vnd = (n) => n.toLocaleString('vi-VN') + '₫';

export const PLACES = {
  ga: {
    name: 'Ga Huế', short: 'Ga Huế', x: -60, z: 245, r: 22, icon: '🚉', color: '#c8322a',
    text: 'Nhà ga cổ kính mang dáng dấp kiến trúc Pháp đầu thế kỷ 20, nằm bên đường Bùi Thị Xuân. Với nhiều du khách, tiếng còi tàu ở đây là lời chào đầu tiên của xứ Huế.',
    photo: { x: -60, y: 9, z: 255, d: 90 },
  },
  trangTien: {
    name: 'Cầu Tràng Tiền', short: 'Tràng Tiền', x: 100, z: 0, r: 30, icon: '🌉', color: '#2d6fb0',
    text: 'Xây dựng năm 1897–1899 dưới triều vua Thành Thái, ban đầu mang tên cầu Thành Thái. Cây cầu thép "sáu vài mười hai nhịp" vắt qua sông Hương, gắn liền với câu hò: "Cầu Tràng Tiền sáu vài mười hai nhịp…". Tên Tràng Tiền đến từ xưởng đúc tiền của triều Nguyễn gần đó.',
    photo: { x: 100, y: 5, z: 0, d: 220 },
  },
  songHuong: {
    name: 'Sông Hương', short: 'Sông Hương', x: 40, z: 30, r: 18, icon: '🌊', color: '#2e8a8a',
    text: 'Dòng sông thơ mộng chảy qua lòng thành phố. Tương truyền nước sông thơm nhờ cỏ thạch xương bồ mọc ở thượng nguồn. Sông Hương và núi Ngự Bình là biểu tượng của Huế.',
    photo: null,
  },
  kyDai: {
    name: 'Kỳ Đài', short: 'Kỳ Đài', x: -70, z: -105, r: 24, icon: '🚩', color: '#c8322a',
    text: 'Kỳ Đài được xây năm 1807 thời vua Gia Long, nằm giữa mặt Nam Kinh Thành, gồm ba tầng đài chồng lên nhau. Trên đỉnh, cột cờ cao vút tung bay lá cờ, nhìn thẳng ra sông Hương.',
    photo: { x: -70, y: 30, z: -102, d: 170 },
  },
  ngoMon: {
    name: 'Ngọ Môn', short: 'Ngọ Môn', x: -70, z: -168, r: 22, icon: '🏯', color: '#d9a84a',
    text: 'Cổng chính của Hoàng Thành, xây năm 1833 dưới triều vua Minh Mạng. "Ngọ" là hướng Nam. Trên nền đài là lầu Ngũ Phụng với mái lợp ngói lưu ly vàng và xanh. Cửa giữa xưa chỉ dành riêng cho vua.',
    photo: { x: -70, y: 10, z: -182, d: 130 },
  },
  thaiHoa: {
    name: 'Điện Thái Hòa', short: 'Thái Hòa', x: -70, z: -236, r: 22, icon: '🏛️', color: '#d9a84a',
    text: 'Nơi diễn ra các đại lễ của triều đình như lễ đăng quang, lễ mừng thọ. Điện được xây năm 1805 thời Gia Long, nổi bật với 80 cột gỗ lim sơn son thếp vàng chạm rồng mây.',
    photo: { x: -70, y: 9, z: -242, d: 95 },
  },
  cuuDinh: {
    name: 'Cửu Đỉnh', short: 'Cửu Đỉnh', x: -100, z: -262, r: 16, icon: '⚱️', color: '#8a6a3a',
    text: 'Chín chiếc đỉnh đồng đúc dưới triều Minh Mạng (1835–1837), đặt trước Hiển Lâm Các. Trên đỉnh chạm khắc hình ảnh núi sông, sản vật của đất Việt — nay là Bảo vật Quốc gia.',
    photo: { x: -100, y: 2.2, z: -259, d: 45 },
  },
  dongBa: {
    name: 'Chợ Đông Ba', short: 'Đông Ba', x: 160, z: -92, r: 30, icon: '🛍️', color: '#e86a2a',
    text: 'Ngôi chợ hơn trăm tuổi, ban đầu nằm cạnh cửa Đông Ba, được vua Thành Thái cho dời về vị trí bên sông năm 1899. Ở đây có đủ cả nón lá, mè xửng, tôm chua, áo dài… và những bà mạ nói giọng Huế ngọt lịm.',
    photo: { x: 160, y: 9, z: -101, d: 120 },
  },
  thienMu: {
    name: 'Chùa Thiên Mụ', short: 'Thiên Mụ', x: -340, z: -105, r: 26, icon: '🛕', color: '#c98f6c',
    text: 'Ngôi chùa cổ do chúa Nguyễn Hoàng cho dựng năm 1601 trên đồi Hà Khê. Tháp Phước Duyên bảy tầng cao 21 mét xây năm 1844 thời vua Thiệu Trị. Đại Hồng Chung đúc năm 1710, nặng hơn 2 tấn, tiếng ngân vang khắp dòng sông.',
    photo: { x: -340, y: 18, z: -98, d: 220 },
  },
  khaiDinh: {
    name: 'Lăng Khải Định', short: 'Khải Định', x: -250, z: 320, r: 34, icon: '🏰', color: '#6f6c66',
    text: 'Ứng Lăng được xây từ 1920 đến 1931, kết hợp kiến trúc Đông – Tây độc đáo. Lên 127 bậc cấp là Cung Thiên Định, bên trong được trang trí bằng tranh khảm sành sứ và thủy tinh vô cùng tinh xảo.',
    photo: { x: -250, y: 20, z: 378, d: 130 },
  },
  benThuyen: {
    name: 'Bến thuyền rồng', short: 'Bến thuyền', x: 46, z: 48, r: 12, icon: '🐉', color: '#2f7a4a',
    text: 'Nơi những con thuyền rồng neo đậu, đưa khách ngược dòng lên chùa Thiên Mụ hay lênh đênh nghe ca Huế về đêm.',
    photo: null,
  },
};

export const FOODS = {
  bunbo: { name: 'Bún bò Huế', price: 45000, vendor: 'O Hoa', desc: 'Sợi bún to, nước dùng ninh xương thơm sả và mắm ruốc, kèm giò heo, chả cua, rau sống. Cay nồng đúng vị Huế!', colors: ['#c8402a', '#e8b878', '#5a9a3a', '#f0e6d0'] },
  comhen: { name: 'Cơm hến', price: 25000, vendor: 'Chú Ba', desc: 'Cơm nguội trộn hến xào, ruốc, tóp mỡ, đậu phộng, rau thơm, chan nước hến. Món ăn bình dân trứ danh của cồn Hến.', colors: ['#f0e8d0', '#8a6a3a', '#6aaa3a', '#d84a2a'] },
  banhbeo: { name: 'Bánh bèo', price: 35000, vendor: 'Mệ Tám', desc: 'Những chén bánh bèo nhỏ xinh, rắc tôm chấy đỏ, mỡ hành, chan nước mắm ngọt. Ăn bằng que tre cho đúng điệu.', colors: ['#f2ecdc', '#e8603a', '#7ab04a', '#c8a050'] },
  che: { name: 'Chè Huế', price: 20000, vendor: 'O Lài', desc: 'Chè bột lọc heo quay, chè hạt sen long nhãn… Huế có cả trăm loại chè, ngọt thanh mà không gắt.', colors: ['#f6efe0', '#c8a070', '#e8d8a0', '#8a5a3a'] },
};

export const PRICES = {
  daiNoi: 200000, khaiDinh: 150000, boat: 150000, cruise: 150000, lantern: 20000,
  nonLa: 60000, aoDai: 100000, bike: 40000, hotel: 300000, cyclo: 50000, meXung: 30000,
};

// Nhiệm vụ chính (hoàn thành tất cả = trọn hành trình)
export const QUESTS = [
  { id: 'arrive', title: 'Đến cố đô', desc: 'Đặt chân tới Ga Huế.', target: 'ga' },
  { id: 'bunbo', title: 'Tô bún bò đầu tiên', desc: 'Ăn bún bò Huế ở phố ẩm thực (O Hoa).', target: 'food:bunbo' },
  { id: 'bridge', title: 'Sáu vài mười hai nhịp', desc: 'Đi bộ trọn chiều dài cầu Tràng Tiền.', target: 'trangTien' },
  { id: 'kyDai', title: 'Cờ bay trên Kỳ Đài', desc: 'Leo lên tầng đài Kỳ Đài, ngắm sông Hương.', target: 'kyDai' },
  { id: 'ngoMon', title: 'Qua cửa Ngọ Môn', desc: 'Mua vé và bước vào Đại Nội qua cửa Ngọ Môn.', target: 'ticket:daiNoi' },
  { id: 'thaiHoa', title: 'Điện Thái Hòa & Cửu Đỉnh', desc: 'Thăm Điện Thái Hòa và chín chiếc đỉnh đồng.', target: 'thaiHoa' },
  { id: 'nonLa', title: 'Chiếc nón bài thơ', desc: 'Mua một chiếc nón lá ở chợ Đông Ba.', target: 'spot:nonLa' },
  { id: 'bell', title: 'Tiếng chuông Thiên Mụ', desc: 'Thỉnh Đại Hồng Chung ở chùa Thiên Mụ.', target: 'spot:bell' },
  { id: 'food', title: 'Ẩm thực xứ Huế', desc: 'Thưởng thức cơm hến, bánh bèo và chè Huế.', target: 'food:next', count: 3 },
  { id: 'khaiDinh', title: 'Lăng Khải Định', desc: 'Vào Cung Thiên Định ngắm tranh khảm sành sứ.', target: 'ticket:khaiDinh' },
  { id: 'caHue', title: 'Đêm nghe ca Huế', desc: 'Lên thuyền rồng nghe ca Huế trên sông Hương (từ 18:30).', target: 'spot:dock' },
  { id: 'hoaDang', title: 'Thả hoa đăng', desc: 'Thả một chiếc hoa đăng xuống dòng sông Hương.', target: 'spot:dock' },
  { id: 'photo', title: 'Nhiếp ảnh gia cố đô', desc: 'Chụp ảnh 6 địa danh khác nhau (phím C).', target: null, count: 6 },
];
export const SIDE = [
  { id: 'aoDai', title: 'Áo dài tím Huế', desc: 'Thuê một bộ áo dài tím ở tiệm trên đường Lê Lợi.', target: 'spot:aoDai' },
  { id: 'bike', title: 'Đạp xe phố Huế', desc: 'Thuê xe đạp ở khách sạn Hương Giang.', target: 'spot:hotel' },
  { id: 'meXung', title: 'Quà Huế', desc: 'Mua mè xửng ở chợ Đông Ba làm quà.', target: 'spot:nonLa' },
  { id: 'quiz', title: 'Người am hiểu', desc: 'Trả lời đúng 3 câu đố về lịch sử Huế.', target: null, count: 3 },
];

export const CHATTER = [
  'Trời Huế mưa lâm thâm rứa đó, nhớ mang theo áo mưa nghe!',
  'Đi mô rứa? Lên Đại Nội hả? Qua cầu Tràng Tiền rồi đi thẳng là tới.',
  'Huế đẹp nhất là lúc hoàng hôn buông xuống sông Hương đó.',
  'Ăn bún bò chưa? Chưa ăn bún bò là chưa tới Huế nghe!',
  'Mạ tui hồi xưa bán chè ở chợ Đông Ba, giờ tui bán tiếp nè.',
  'Tối ra cầu Tràng Tiền mà coi, đèn đổi màu đẹp lắm!',
  'Mua mè xửng về làm quà nghe, ngọt mà dẻo, ăn là nhớ Huế.',
  'Răng mà nắng rứa hè… Đội nón vô kẻo say nắng nghe.',
  'Người Huế nói chậm, ăn cay, sống chậm. Thong thả mà chơi nghe!',
  'Đi thuyền rồng lên chùa Thiên Mụ đi, ngắm sông mát lắm.',
  'O ni bán ở đây mấy chục năm rồi, khách mô cũng quý hết.',
  'Lăng Khải Định xa xa phía Nam đó, đi xe đạp cho khỏe nghe.',
];
export const TOURIST_CHATTER = [
  'Mình ở Sài Gòn ra chơi, Huế yên bình ghê!',
  'Bạn chụp giùm mình một tấm với Ngọ Môn được không? Cảm ơn nha!',
  'Hôm qua mình nghe ca Huế trên thuyền, nổi da gà luôn đó.',
  'Hello! Hue is so beautiful… Mình học tiếng Việt: "Cảm ơn"!',
  'Đi một vòng Đại Nội mất cả buổi sáng mà vẫn chưa hết.',
  'Bánh bèo ở đây ngon dữ, ăn ba mâm luôn!',
];

// Câu đố lịch sử
export const QUIZ = {
  thaiHoa: { q: 'Điện Thái Hòa có bao nhiêu cột gỗ lim sơn son thếp vàng?', a: ['40 cột', '80 cột', '120 cột'], correct: 1, explain: 'Đúng là 80 cột, chạm trổ rồng mây tinh xảo.' },
  ngoMon: { q: 'Chữ "Ngọ" trong Ngọ Môn chỉ hướng nào?', a: ['Hướng Bắc', 'Hướng Nam', 'Hướng Đông'], correct: 1, explain: 'Ngọ là hướng Nam — Ngọ Môn quay mặt về phía Nam.' },
  thienMu: { q: 'Chùa Thiên Mụ được dựng vào năm nào?', a: ['1601', '1802', '1945'], correct: 0, explain: 'Chúa Nguyễn Hoàng cho dựng chùa năm 1601.' },
  bridge: { q: 'Câu hò nổi tiếng: "Cầu Tràng Tiền sáu vài…"?', a: ['…mười hai nhịp', '…mười sáu nhịp', '…hai mươi nhịp'], correct: 0, explain: '"Sáu vài mười hai nhịp" — sáu vài, mỗi vài hai nhịp.' },
  caHue: { q: 'Nhã nhạc cung đình Huế được UNESCO công nhận năm nào?', a: ['1993', '2003', '2013'], correct: 1, explain: 'Năm 2003, Nhã nhạc cung đình Huế được UNESCO vinh danh.' },
};

export const HUE_WORDS = [
  ['mô', 'đâu'], ['tê', 'kia'], ['răng', 'sao'], ['rứa', 'vậy'], ['chi', 'gì'],
  ['ni', 'này'], ['mạ', 'mẹ'], ['o', 'cô'], ['mệ', 'bà'], ['eng', 'anh'], ['hỉ', 'nhỉ'],
];
