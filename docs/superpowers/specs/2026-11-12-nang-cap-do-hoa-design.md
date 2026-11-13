# Nâng cấp đồ họa "Đi Huế" — bản thiết kế

Ngày: 2026-11-12. Đã được duyệt qua hỏi đáp trong phiên làm việc.

## Mục tiêu

Đưa game từ phong cách low-poly màu phẳng lên mức "cách điệu chân thực": bề mặt có vân vật liệu, ánh sáng và mặt nước thuyết phục, phố xá và cây cỏ dày chi tiết, NPC sống động. Vẫn chạy mượt trên trình duyệt.

## Ràng buộc đã chốt

- 100% hình ảnh sinh bằng code. Không tải texture, mô hình hay HDRI từ ngoài.
- Giữ bản đóng gói một file `dist/index.html`.
- Không đổi lối chơi, nhiệm vụ, dữ liệu lưu.
- NPC: có phản ứng khi người chơi đến gần, có sinh hoạt đời thường, hội thoại sinh động. Không thêm nhiệm vụ phụ từ NPC.

## Năm phần việc

1. **Nền tảng hiển thị**
   - `world/surfaces.js`: sinh mảng texture vật liệu (gạch, đá, ngói, vữa, gỗ, nhựa đường, lát vỉa hè, bê tông, cỏ…) và vá shader `MeshStandardMaterial` để chiếu vân theo toạ độ thế giới (triplanar), kèm pháp tuyến, độ nhám, rêu bẩn, mặt đường ướt khi mưa.
   - `Builder`: gắn loại bề mặt cho từng khối (tự suy từ màu, có thể ép), giữ pháp tuyến mượt cho khối cong, chia mesh theo ô lưới để cắt bỏ phần ngoài tầm nhìn.
   - `core/post.js`: khử răng cưa MSAA, đổ bóng tiếp xúc (SSAO từ depth), bloom, tone map ACES, chỉnh màu, tối góc, chống sọc màu.
   - Bầu trời: mây nhiều lớp có viền nắng; bóng đổ nét hơn.
2. **Sông Hương và thời tiết** — `world/water.js`: phản chiếu phẳng (vẽ cảnh lần hai qua camera đối xứng), Fresnel, lấp lánh nắng/trăng, gợn mưa.
3. **Phố xá và cảnh quan**
   - `world/foliage.js`: tán cây bằng thẻ lá có alpha, đung đưa theo gió; cỏ và hoa dạng instanced.
   - Nhà phố: trụ, ban công, cửa chớp, mái hiên, cục nóng điều hòa, bồn nước; biển hiệu tiếng Việt từ một atlas; cột điện và dây điện; vạch qua đường.
4. **NPC**
   - `world/person.js`: mô hình có xương (SkinnedMesh), tay chân có khớp, có mặt, tóc, nón, phụ kiện.
   - `world/people.js`: dáng đi theo chu kỳ, đầu quay theo người chơi, vẫy chào, né đường, nhóm trò chuyện, gánh hàng rong, quét sân, chụp ảnh, tập dưỡng sinh buổi sáng, trẻ con chạy chơi; xích lô chở khách và nữ sinh đạp xe trên đường.
   - `ui/bubbles.js`: bong bóng thoại giọng Huế trên đầu NPC.
   - Hội thoại: camera hướng vào NPC, thu hẹp góc nhìn nhẹ, NPC có cử chỉ khi nói.
5. **Độ mượt** — tự điều chỉnh độ phân giải để giữ khung hình, bốn mức đồ họa (Thấp, Vừa, Cao, Cực cao), camera lên xuống bậc thang êm, giảm cấp phát bộ nhớ mỗi khung hình.

## Kiểm tra

Sau mỗi phần: chạy bản dev, chụp ảnh tại ga, phố ẩm thực, Ngọ Môn, bờ sông (ngày và đêm), xem console không lỗi và đo thời gian khung hình. Cuối cùng chạy `npm run build`.
