// Hội thoại với các nhân vật (giọng Huế). Mỗi hàm trả về một "nút" hội thoại.
import { FOODS, PRICES, QUIZ, vnd, CHATTER, TOURIST_CHATTER, HUE_WORDS } from './data.js';

const close = { t: 'Tạm biệt!', go: () => null };

function foodVendor(G, key, name, role, greet, ask, askT) {
  const f = FOODS[key];
  const eaten = G.state.foods[key];
  return {
    name, role,
    text: eaten ? `Ăn nữa hả? Ngon thì ghé hoài nghe! ${f.name} ${vnd(f.price)} một phần.` : greet,
    choices: [
      { t: `Cho một phần ${f.name[0].toLowerCase() + f.name.slice(1)} (${vnd(f.price)})`, go: () => { G.eat(key); return null; } },
      { t: askT, go: () => ({ name, role, text: ask, choices: [{ t: `Cho một phần (${vnd(f.price)})`, go: () => { G.eat(key); return null; } }, close] }) },
      close,
    ],
  };
}

function quizNode(G, key, name, role) {
  const q = QUIZ[key];
  if (!q || G.state.quiz[key]) return null;
  return {
    t: '🎓 Đố vui lịch sử', go: () => ({
      name, role, text: q.q,
      choices: q.a.map((a, i) => ({
        t: a, go: () => {
          G.answerQuiz(key, i === q.correct);
          return { name, role, text: i === q.correct ? `Giỏi quá! ${q.explain}` : `Chưa đúng rồi. ${q.explain}`, choices: [close] };
        },
      })),
    }),
  };
}

export const DIALOGS = {
  xichlo: (G) => ({
    name: 'Bác Tư', role: 'Đạp xích lô',
    text: 'Chào cháu! Mới xuống tàu hả? Lần đầu ra Huế phải không? Bác chạy xích lô ở đây mấy chục năm rồi, chỗ mô trong thành phố bác cũng rành.',
    choices: [
      { t: 'Cháu nên đi đâu trước ạ?', go: () => ({ name: 'Bác Tư', role: 'Đạp xích lô', text: 'Đói thì ra phố ẩm thực ngay đường phía trước, ăn tô bún bò O Hoa cho ấm bụng. Rồi đi bộ qua cầu Tràng Tiền, bên tê sông là Kinh Thành có Kỳ Đài với Đại Nội. Chiều đi thuyền rồng lên chùa Thiên Mụ, tối ra bến nghe ca Huế. Rứa là đúng điệu!', choices: [close] }) },
      { t: `Bác chở cháu đi được không? (${vnd(PRICES.cyclo)})`, go: () => { G.openMap(true); return null; } },
      { t: 'Tiếng Huế nghe lạ quá bác ơi…', go: () => ({ name: 'Bác Tư', role: 'Đạp xích lô', text: 'Ha ha, dễ ợt: ' + HUE_WORDS.slice(0, 6).map(([a, b]) => `"${a}" là ${b}`).join(', ') + '. Ví dụ "Đi mô rứa?" là "Đi đâu vậy?". Nói riết rồi quen nờ!', choices: [close] }) },
      close,
    ],
  }),

  bunbo: (G) => foodVendor(G, 'bunbo', 'O Hoa', 'Quán bún bò',
    'Dạ mời con vô ngồi! Bún bò O nấu từ ba giờ sáng, nước lèo ninh xương, thơm sả với mắm ruốc. Ăn một tô nghe?',
    'Bún bò Huế phải có sợi bún to, nước dùng nêm mắm ruốc, thơm mùi sả, thêm chút sa tế. Ăn kèm giò heo, chả cua, rau sống, bắp chuối bào. Ăn cay mới đã nghe con!',
    'Bún bò Huế khác chỗ khác ra sao O?'),
  comhen: (G) => foodVendor(G, 'comhen', 'Chú Ba', 'Quán cơm hến',
    'Cơm hến đây! Hến bắt dưới cồn Hến trên sông Hương đó. Cơm nguội trộn hến xào, ruốc, tóp mỡ, đậu phộng, rau thơm, chan chút nước hến. Ngon mà rẻ!',
    'Người Huế nói ăn cơm hến mà không cay thì như chưa ăn. Mà cay thiệt đó nghe, nhớ uống nước. Món ni xưa là món của người nghèo, giờ thành đặc sản rồi.',
    'Ăn cơm hến có chi đặc biệt chú?'),
  banhbeo: (G) => foodVendor(G, 'banhbeo', 'Mệ Tám', 'Bánh bèo chén',
    'Bánh bèo chén nè cháu. Bột gạo hấp trong chén nhỏ, rắc tôm chấy, mỡ hành, chan nước mắm ngọt. Một mâm nho nhỏ ăn chơi mà nhớ hoài.',
    'Mệ bán ở đây hơn ba chục năm rồi. Bánh bèo phải ăn bằng que tre, xúc từng chén một. Ăn kèm bánh nậm, bánh lọc nữa là đủ bộ bánh Huế.',
    'Mệ bán ở đây lâu chưa mệ?'),
  che: (G) => foodVendor(G, 'che', 'O Lài', 'Chè Huế',
    'Chè Huế có cả trăm loại đó con: chè bột lọc heo quay, chè hạt sen long nhãn, chè đậu ván… Ăn một ly cho mát nghe!',
    'Nghe lạ hỉ? Bột lọc bọc miếng thịt heo quay, nấu với nước đường gừng. Mặn ngọt hòa nhau, chỉ ở Huế mới có. Còn hạt sen là sen hồ Tịnh Tâm, ngày xưa để tiến vua đó!',
    'Chè bột lọc heo quay là chi rứa O?'),

  veDaiNoi: (G) => {
    const has = G.state.inv.ticketDaiNoi;
    const quiz = quizNode(G, 'ngoMon', 'Anh Minh', 'Phòng vé Đại Nội');
    return {
      name: 'Anh Minh', role: 'Phòng vé Đại Nội',
      text: has ? 'Bạn có vé rồi đó, cứ đi qua cửa giữa Ngọ Môn là vào Đại Nội nghe. Chúc tham quan vui!' : `Chào bạn! Vé tham quan Đại Nội ${vnd(PRICES.daiNoi)} một người. Bạn mua vé không?`,
      choices: [
        ...(has ? [] : [{ t: `Mua vé (${vnd(PRICES.daiNoi)})`, go: () => { G.buyTicket('daiNoi'); return null; } }]),
        { t: 'Ngọ Môn có gì đặc biệt?', go: () => ({ name: 'Anh Minh', role: 'Phòng vé Đại Nội', text: 'Ngọ Môn xây năm 1833 dưới triều vua Minh Mạng. Có năm lối đi: lối giữa xưa chỉ dành cho vua, hai bên cho quan văn võ, hai lối ngoài cùng cho lính hầu và voi ngựa. Phía trên là lầu Ngũ Phụng — nơi vua ngự xem lễ.', choices: [close] }) },
        ...(quiz ? [quiz] : []),
        close,
      ],
    };
  },

  huongDan: (G) => {
    const quiz = quizNode(G, 'thaiHoa', 'Cô Thảo', 'Hướng dẫn viên');
    const quiz2 = quizNode(G, 'caHue', 'Cô Thảo', 'Hướng dẫn viên');
    return {
      name: 'Cô Thảo', role: 'Hướng dẫn viên Đại Nội',
      text: 'Chào mừng bạn đến Hoàng Thành! Đây là nơi làm việc của triều Nguyễn — triều đại phong kiến cuối cùng của Việt Nam, từ 1802 đến 1945. Quần thể di tích Cố đô Huế được UNESCO công nhận là Di sản Văn hóa Thế giới năm 1993.',
      choices: [
        { t: 'Kể về Điện Thái Hòa đi cô', go: () => ({ name: 'Cô Thảo', role: 'Hướng dẫn viên', text: 'Điện Thái Hòa là nơi vua thiết triều trong những dịp đại lễ. Quan lại đứng chầu ở sân Đại Triều Nghi theo phẩm trật — bạn thấy mấy tấm bia đá nhỏ hai bên sân không? Đó là bia ghi phẩm hàm, quan đứng đúng vị trí của mình.', choices: [close] }) },
        { t: 'Cửu Đỉnh để làm gì?', go: () => ({ name: 'Cô Thảo', role: 'Hướng dẫn viên', text: 'Chín chiếc đỉnh tượng trưng cho sự bền vững của vương triều, mỗi đỉnh mang tên một vị vua và khắc 17 hình ảnh: sông núi, chim muông, cây cỏ, vũ khí… như một bộ "bách khoa thư" bằng đồng về đất nước.', choices: [close] }) },
        ...(quiz ? [quiz] : []), ...(quiz2 ? [quiz2] : []),
        close,
      ],
    };
  },

  nonLa: (G) => {
    const has = G.state.inv.nonLa;
    return {
      name: 'Chị Lan', role: 'Sạp nón lá',
      text: has ? 'Nón đẹp hỉ? Đội đi nắng cho mát. Còn mua mè xửng về làm quà không em?' : `Nón bài thơ Huế đây em! Soi lên nắng là thấy bài thơ với hình cầu Tràng Tiền lồng bên trong. ${vnd(PRICES.nonLa)} một chiếc.`,
      choices: [
        ...(has ? [] : [{ t: `Mua nón lá (${vnd(PRICES.nonLa)})`, go: () => { G.buyItem('nonLa'); return null; } }]),
        ...(G.state.inv.meXung ? [] : [{ t: `Mua hộp mè xửng (${vnd(PRICES.meXung)})`, go: () => { G.buyItem('meXung'); return null; } }]),
        { t: 'Nón bài thơ làm thế nào chị?', go: () => ({ name: 'Chị Lan', role: 'Sạp nón lá', text: 'Lá cọ non đem phơi sương cho trắng, ủi phẳng, rồi chằm lên khung 16 vòng tre chuốt tròn. Giữa hai lớp lá lồng tranh và câu thơ cắt bằng giấy. Làng Tây Hồ, Phú Cam làm nón khéo nhất đó.', choices: [close] }) },
        close,
      ],
    };
  },

  suThay: (G) => {
    const quiz = quizNode(G, 'thienMu', 'Sư thầy Minh Tâm', 'Chùa Thiên Mụ');
    return {
      name: 'Sư thầy Minh Tâm', role: 'Chùa Thiên Mụ',
      text: 'A Di Đà Phật. Chào thí chủ. Tương truyền xưa có bà lão áo đỏ quần xanh hiện trên đồi này, nói rằng sẽ có vị chân chúa đến lập chùa để tụ linh khí. Năm 1601, chúa Nguyễn Hoàng cho dựng chùa, đặt tên Thiên Mụ — "bà mụ nhà trời".',
      choices: [
        { t: 'Con có thể thỉnh chuông không ạ?', go: () => ({ name: 'Sư thầy Minh Tâm', role: 'Chùa Thiên Mụ', text: 'Được chứ. Lầu chuông ở bên phải tháp. Thí chủ thỉnh nhẹ một tiếng, nguyện cho mình và mọi người được bình an. "Tiếng chuông Thiên Mụ, canh gà Thọ Xương" — tiếng chuông này đã đi vào ca dao đó.', choices: [close] }) },
        { t: 'Tháp Phước Duyên có ý nghĩa gì?', go: () => ({ name: 'Sư thầy Minh Tâm', role: 'Chùa Thiên Mụ', text: 'Tháp cao 21 mét, bảy tầng, do vua Thiệu Trị cho xây năm 1844. Mỗi tầng thờ một vị Phật. "Phước Duyên" là mong cầu phúc lành và duyên lành cho chúng sinh.', choices: [close] }) },
        ...(quiz ? [quiz] : []),
        close,
      ],
    };
  },

  laiDo: (G) => {
    const night = G.isCruiseTime();
    const atDock = G.player.pos.x > 0;
    const name = atDock ? 'Bác Năm' : 'Chú Sáu', role = 'Lái thuyền rồng';
    const ch = [];
    if (atDock) {
      if (night) {
        ch.push({ t: `Nghe ca Huế trên thuyền (${vnd(PRICES.cruise)})`, go: () => { G.startRide('cruise'); return null; } });
        ch.push({ t: `Mua hoa đăng (${vnd(PRICES.lantern)})`, go: () => { G.buyItem('lantern'); return DIALOGS.laiDo(G); } });
      } else ch.push({ t: `Đi thuyền lên chùa Thiên Mụ (${vnd(PRICES.boat)})`, go: () => { G.startRide('toThienMu'); return null; } });
    } else {
      ch.push({ t: `Về bến thuyền Tràng Tiền (${vnd(PRICES.boat)})`, go: () => { G.startRide('toDock'); return null; } });
    }
    ch.push({ t: 'Ca Huế là chi rứa bác?', go: () => ({ name, role, text: 'Ca Huế là lối hát thính phòng của xứ Huế, có từ thời các chúa Nguyễn, hát với đàn tranh, đàn nguyệt, đàn bầu, sáo trúc và song lang giữ nhịp. Mấy điệu nổi tiếng như Nam Ai, Nam Bình, Tứ Đại Cảnh. Nghe buồn mà sang lắm! Tối từ 6 rưỡi là có thuyền nghe ca.', choices: [close] }) });
    ch.push(close);
    return {
      name, role,
      text: atDock
        ? (night ? 'Tối ni trời đẹp, có ca Huế trên thuyền đó! Thả thêm chiếc hoa đăng xuống sông cầu may nữa. Lên thuyền không?' : 'Đi thuyền lên chùa Thiên Mụ không? Ngồi thuyền rồng ngược dòng Hương Giang, hai bên bờ xanh mướt, mát rượi.')
        : 'Thuyền về lại bến Tràng Tiền nè. Lên thuyền không?',
      choices: ch,
    };
  },

  leTan: (G) => {
    const h = G.hour();
    const ch = [];
    if (h < 18) ch.push({ t: `Nghỉ ngơi đến chiều tối 18:30 (${vnd(PRICES.hotel)})`, go: () => { G.rest(18.5); return null; } });
    ch.push({ t: `Ngủ một giấc đến 7:00 sáng mai (${vnd(PRICES.hotel)})`, go: () => { G.rest(7, true); return null; } });
    if (!G.state.inv.bike) ch.push({ t: `Thuê xe đạp (${vnd(PRICES.bike)})`, go: () => { G.buyItem('bike'); return null; } });
    else ch.push({ t: G.player.mode === 'bike' ? 'Gửi xe đạp lại' : 'Lấy xe đạp ra đi', go: () => { G.toggleBike(); return null; } });
    ch.push({ t: 'Lưu hành trình', go: () => { G.save(true); return null; } });
    ch.push(close);
    return { name: 'Chị Hương', role: 'Lễ tân khách sạn', text: 'Chào mừng quý khách đến khách sạn Hương Giang! Quý khách muốn nghỉ ngơi, thuê xe đạp hay cần chi nữa không ạ?', choices: ch };
  },

  aoDai: (G) => {
    const has = G.state.inv.aoDai;
    return {
      name: 'Chị Mai', role: 'Tiệm áo dài',
      text: has ? 'Mặc áo dài tím đẹp quá trời! Ra Ngọ Môn hay cầu Tràng Tiền chụp hình là đúng chất Huế luôn.' : `Áo dài tím Huế nè! Màu tím là màu của Huế mộng mơ, nữ sinh Đồng Khánh xưa mặc áo dài tím đi học. Thuê một bộ ${vnd(PRICES.aoDai)}, mặc đi chụp ảnh là đẹp hết ý!`,
      choices: [
        ...(has ? [] : [{ t: `Thuê áo dài tím (${vnd(PRICES.aoDai)})`, go: () => { G.buyItem('aoDai'); return null; } }]),
        { t: 'Vì sao tím lại là màu của Huế?', go: () => ({ name: 'Chị Mai', role: 'Tiệm áo dài', text: 'Người ta nói màu tím mang nét buồn man mác, dịu dàng như hoàng hôn trên sông Hương. Nữ sinh trường Đồng Khánh mặc áo dài tím, đội nón lá đi qua cầu Tràng Tiền — hình ảnh đó thành biểu tượng của Huế luôn.', choices: [close] }) },
        close,
      ],
    };
  },

  veKhaiDinh: (G) => {
    const has = G.state.inv.ticketKhaiDinh;
    return {
      name: 'Anh Hùng', role: 'Vé lăng Khải Định',
      text: has ? 'Vé có rồi, mời bạn lên. Nhớ vào tận Cung Thiên Định trên cùng nghe!' : `Vé tham quan lăng Khải Định ${vnd(PRICES.khaiDinh)}. Leo 127 bậc là lên tới Cung Thiên Định.`,
      choices: [
        ...(has ? [] : [{ t: `Mua vé (${vnd(PRICES.khaiDinh)})`, go: () => { G.buyTicket('khaiDinh'); return null; } }]),
        { t: 'Lăng có gì đặc biệt anh?', go: () => ({ name: 'Anh Hùng', role: 'Vé lăng Khải Định', text: 'Lăng xây từ 1920 đến 1931, dùng xi măng, sắt thép, kính màu… pha trộn kiến trúc Đông Tây. Bên trong Cung Thiên Định có tranh khảm từ mảnh sành sứ và thủy tinh, trần vẽ "Cửu long ẩn vân" — chín con rồng ẩn trong mây.', choices: [close] }) },
        close,
      ],
    };
  },

  bridgeGuy: (G) => {
    const quiz = quizNode(G, 'bridge', 'Ông Khải', 'Người dân đi dạo');
    return {
      name: 'Ông Khải', role: 'Người dân đi dạo',
      text: 'Chiều mô ông cũng ra bờ sông đi bộ. Sáng thì sông trong xanh, chiều thì tím biếc, tối thì cầu Tràng Tiền đổi màu lung linh. Huế đẹp mỗi lúc một kiểu.',
      choices: [...(quiz ? [quiz] : []), close],
    };
  },

  chatter: (G, npc) => ({
    name: npc.name, role: npc.role || 'Người dân',
    text: (npc.lines || CHATTER)[Math.floor(Math.random() * (npc.lines || CHATTER).length)],
    choices: [{ t: 'Dạ, cảm ơn!', go: () => null }],
  }),
  tourist: (G, npc) => ({
    name: npc.name, role: 'Du khách',
    text: TOURIST_CHATTER[Math.floor(Math.random() * TOURIST_CHATTER.length)],
    choices: [{ t: 'Chúc bạn đi chơi vui!', go: () => null }],
  }),
};
