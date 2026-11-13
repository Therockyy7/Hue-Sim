# Đi Huế — Hành trình về cố đô

Game giả lập du lịch Huế **góc nhìn thứ nhất**, chạy trên trình duyệt (Three.js). Bạn xuống tàu ở Ga Huế với 1.000.000₫ và một cuốn hộ chiếu du lịch trống, rồi tự do khám phá cố đô: ăn bún bò, qua cầu Tràng Tiền, leo Kỳ Đài, vào Đại Nội, thỉnh chuông Thiên Mụ, đi thuyền rồng nghe ca Huế và thả hoa đăng trên sông Hương.

Mọi hình ảnh và âm thanh đều được tạo bằng code (không dùng file mô hình hay file âm thanh nào).

## Chạy game

```bash
npm install
npm run dev
```

Mở http://localhost:5174.

Bản đóng gói:

```bash
npm run build
```

Lệnh này tạo ra **một file duy nhất** `dist/index.html` (~900 KB): mở thẳng bằng trình duyệt hoặc gửi cho người khác. Phông chữ lấy từ Google Fonts nên cần mạng; nếu không có mạng thì game dùng phông dự phòng.

## Điều khiển

| Phím | Tác dụng |
|---|---|
| W A S D / phím mũi tên | Đi lại |
| Chuột | Nhìn quanh (bấm vào màn hình để khóa chuột) |
| Shift | Chạy |
| Space | Nhảy |
| E | Trò chuyện / tương tác |
| F | Thả hoa đăng |
| C | Bật/tắt máy ảnh; khi bật thì bấm chuột để chụp, lăn chuột để phóng to |
| B | Lên/xuống xe đạp (sau khi thuê) |
| Tab | Hộ chiếu: nhiệm vụ, con dấu, ẩm thực, album ảnh, hành lý |
| M | Bản đồ và gọi xích lô |
| 1–9 | Chọn câu trả lời khi trò chuyện |
| Esc | Tạm dừng, cài đặt |

Trên điện thoại/máy tính bảng có cần điều khiển ảo và nút bấm cảm ứng.

## Có gì trong game

- **Địa danh:** Ga Huế, cầu Tràng Tiền (6 nhịp vòm thép, đèn LED đổi màu ban đêm), Kinh Thành với cửa Thể Nhơn, Quảng Đức, Đông Ba, Kỳ Đài và cờ bay, Ngọ Môn với lầu Ngũ Phụng, hồ Thái Dịch, Điện Thái Hòa, Hiển Lâm Các và Cửu Đỉnh, Trường Lang, hồ Tịnh Tâm, chợ Đông Ba, chùa Thiên Mụ (tháp Phước Duyên, lầu chuông Đại Hồng Chung, tam quan, chánh điện), lăng Khải Định (tượng quan, Bi Đình, trụ biểu, Cung Thiên Định khảm sành sứ), phố Lê Lợi, phố ẩm thực, ruộng lúa và núi Ngự Bình phía xa.
- **13 nhiệm vụ chính và 4 việc phụ.** Hoàn thành hết sẽ nhận "Chứng nhận đã Đi Huế".
- **Hộ chiếu du lịch:** đến mỗi địa danh sẽ được đóng dấu và đọc một đoạn lịch sử ngắn.
- **Ẩm thực:** bún bò Huế, cơm hến, bánh bèo, chè Huế, mỗi món có người bán riêng.
- **Hội thoại giọng Huế** ("mô, tê, răng, rứa…") kèm câu đố lịch sử.
- **Thuyền rồng:** ban ngày đi lên chùa Thiên Mụ; từ 18:30 có chuyến nghe ca Huế với nghệ sĩ trên thuyền và nhạc đàn tranh, đàn bầu được tổng hợp trực tiếp.
- **Ngày/đêm và thời tiết:** mặt trời, trăng, sao, mưa Huế, đèn lồng và đèn phố về đêm, hoa đăng trôi trên sông.
- **Máy ảnh và album:** tự nhận ra địa danh có trong khung hình.
- **Phương tiện:** xích lô (đi nhanh đến nơi đã ghé), thuê xe đạp, xe máy chạy trên phố, đò trên sông.
- **Khách sạn:** nghỉ đến tối hoặc ngủ qua đêm. Game tự lưu vào trình duyệt (localStorage).

## Cấu trúc mã nguồn

```
src/
  main.js            khởi động, vòng lặp, menu chính, cài đặt
  core/              physics (va chạm 2.5D), player, input, sky (ngày/đêm), audio (Web Audio)
  world/             builder (gộp mesh theo màu đỉnh), terrain, citadel, pagoda, bridge,
                     market, tomb, city, people (NPC), vehicles (xe, thuyền, hoa đăng), world
  game/              data (địa danh, món ăn, nhiệm vụ), dialogs (hội thoại), game (logic)
  ui/                hud (giao diện), map (bản đồ giấy, bản đồ mini)
```

Bản đồ đã được thu nhỏ so với thực tế để đi bộ giữa các điểm chỉ mất khoảng 1 phút. Các thông tin lịch sử được viết ngắn gọn để đọc trong game.
