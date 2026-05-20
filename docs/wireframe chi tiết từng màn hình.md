<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# 1

Dưới đây là **wireframe chi tiết từng màn hình** cho ứng dụng cảnh báo cháy rừng theo phong cách phù hợp với cơ quan nhà nước Việt Nam: bố cục rõ ràng, trạng thái hành chính minh bạch, điều hướng đơn giản và có khả năng tích hợp đăng nhập bằng tài khoản định danh/công vụ như xu hướng hiện nay trên Cổng Dịch vụ công và VNeID.[^1][^2][^3]

## Kiến trúc tổng thể

Ứng dụng nên chia theo 3 nhóm người dùng: người dân, cán bộ hiện trường và trung tâm điều hành, tương tự cách các nền tảng công vụ phân luồng theo đối tượng sử dụng và tác vụ chính.[^4][^1]
Thanh điều hướng dưới nên có 5 mục: Trang chủ, Bản đồ, Báo cháy, Thông báo, Tài khoản; cách này dễ hiểu trên di động và gần với mô hình thao tác của các ứng dụng dịch vụ công phổ biến.[^5][^6]

## Luồng màn hình

### 1. Khởi động

```text
┌─────────────────────────────────────┐
│ [Quốc huy/Logo cơ quan]             │
│ HỆ THỐNG CẢNH BÁO CHÁY RỪNG         │
│ Cơ quan quản lý: Bộ/UBND/Sở         │
│                                     │
│ [Biểu tượng rừng + sóng cảnh báo]   │
│                                     │
│ Đang tải dữ liệu cảnh báo...        │
└─────────────────────────────────────┘
```

Màn hình này cần tạo cảm giác chính thống và đáng tin cậy, nên chỉ có logo, tên hệ thống và dòng cơ quan chủ quản.[^7]

### 2. Đăng nhập

```text
┌─────────────────────────────────────┐
│ ĐĂNG NHẬP HỆ THỐNG                  │
│                                     │
│ ( ) Người dân                       │
│ ( ) Cán bộ hiện trường              │
│ ( ) Trung tâm điều hành             │
│                                     │
│ [Đăng nhập bằng VNeID]              │
│ [Đăng nhập tài khoản công vụ]       │
│ [Tiếp tục không đăng nhập]          │
│                                     │
│ Hướng dẫn sử dụng                   │
└─────────────────────────────────────┘
```

Việc ưu tiên VNeID và tài khoản công vụ là hợp lý vì Cổng Dịch vụ công hiện hỗ trợ đăng nhập bằng tài khoản VNeID trong nhiều luồng truy cập.[^2][^8]

### 3. Trang chủ

```text
┌─────────────────────────────────────┐
│ [☰] CẢNH BÁO CHÁY RỪNG      [🔔]     │
│ Xin chào, Nguyễn Văn A              │
│ Khu vực theo dõi: Đà Nẵng           │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ CẢNH BÁO HÔM NAY              │   │
│ │ 03 điểm nghi cháy mới         │   │
│ │ 01 điểm đang xử lý            │   │
│ │ Cấp nguy cơ: CAO              │   │
│ └───────────────────────────────┘   │
│                                     │
│ [Xem bản đồ nguy cơ]                │
│ [Báo cháy ngay]                     │
│                                     │
│ Tin điều hành mới nhất              │
│ - Công điện số ...                  │
│ - Khuyến cáo thời tiết hanh khô     │
│                                     │
│ [Trang chủ][Bản đồ][Báo cháy][TB][TK]│
└─────────────────────────────────────┘
```

Trang chủ nên ưu tiên thông tin ngắn, hành động nhanh và thông báo chính thức, giống định hướng của các cổng dịch vụ công tập trung vào tiện ích thiết yếu.[^9][^1]

### 4. Bản đồ cảnh báo

```text
┌─────────────────────────────────────┐
│ BẢN ĐỒ CẢNH BÁO                     │
│ [Tìm theo xã/huyện/tọa độ]          │
│                                     │
│ [Lọc] Cấp độ | Trạng thái | Nguồn   │
│                                     │
│ ┌───────────────────────────────┐   │
│ │                               │   │
│ │          BẢN ĐỒ               │   │
│ │   • Vàng: nguy cơ TB          │   │
│ │   • Cam: nguy cơ cao          │   │
│ │   • Đỏ: nghi cháy/đã cháy     │   │
│ │   • Xanh: an toàn             │   │
│ │                               │   │
│ └───────────────────────────────┘   │
│                                     │
│ Điểm gần nhất: Tiểu khu 42          │
│ Trạng thái: Đang xác minh           │
│ [Xem chi tiết]                      │
└─────────────────────────────────────┘
```

Màn hình này là trung tâm nghiệp vụ nên cần rõ lớp dữ liệu, trạng thái và lọc theo địa bàn, thay vì dùng hiệu ứng đồ họa nặng.[^1]

### 5. Chi tiết cảnh báo

```text
┌─────────────────────────────────────┐
│ CHI TIẾT CẢNH BÁO                   │
│                                     │
│ Mức độ: RẤT CAO                     │
│ Khu vực: Xã Hòa Bắc                 │
│ Tọa độ: 16.xxxx / 108.xxxx          │
│ Thời gian phát hiện: 09:20          │
│ Nguồn: Vệ tinh + người dân báo      │
│ Trạng thái: Đã xác minh             │
│                                     │
│ [Ảnh vệ tinh / ảnh hiện trường]     │
│                                     │
│ Diễn biến xử lý                     │
│ - 09:20 tiếp nhận tín hiệu          │
│ - 09:28 cán bộ xác minh             │
│ - 09:40 điều động lực lượng         │
│                                     │
│ [Gọi kiểm lâm] [Chỉ đường]          │
└─────────────────────────────────────┘
```

Việc hiển thị nguồn dữ liệu, mốc thời gian và trạng thái xử lý giúp tăng tính chính thống và minh bạch cho ứng dụng nhà nước.[^10]

### 6. Báo cháy ngay

```text
┌─────────────────────────────────────┐
│ BÁO CÁO SỰ CỐ CHÁY RỪNG             │
│                                     │
│ Vị trí hiện tại: [Tự động lấy]      │
│ [Chọn lại trên bản đồ]              │
│                                     │
│ Hình ảnh hiện trường                │
│ [Chụp ảnh] [Tải video]              │
│                                     │
│ Mức độ quan sát                     │
│ ( ) Có khói                         │
│ ( ) Cháy nhỏ                        │
│ ( ) Cháy lớn                        │
│                                     │
│ Nguy cơ lan sang khu dân cư         │
│ ( ) Có   ( ) Không                  │
│                                     │
│ Mô tả ngắn                          │
│ [................................]  │
│                                     │
│ [Gửi báo cáo]                       │
└─────────────────────────────────────┘
```

Biểu mẫu nên ngắn, chuẩn hóa và dễ thao tác trên điện thoại để phù hợp với tinh thần phục vụ đại chúng của nền tảng công.[^1]

### 7. Kết quả gửi báo cáo

```text
┌─────────────────────────────────────┐
│ GỬI BÁO CÁO THÀNH CÔNG              │
│                                     │
│ Mã tiếp nhận: CR-2026-001245        │
│ Thời gian tiếp nhận: 09:42          │
│ Trạng thái: Chờ xác minh            │
│                                     │
│ [Theo dõi xử lý]                    │
│ [Quay về Trang chủ]                 │
└─────────────────────────────────────┘
```

Cấp mã hồ sơ và trạng thái theo dõi sẽ tạo cảm giác rất “dịch vụ công”, giúp người dùng tin rằng thông tin đã được tiếp nhận chính thức.[^4][^1]

### 8. Thông báo

```text
┌─────────────────────────────────────┐
│ THÔNG BÁO                           │
│                                     │
│ [Khẩn] Nguy cơ cháy rất cao         │
│ Khu vực: Hòa Vang                   │
│ 08:45 hôm nay                       │
│                                     │
│ [Điều hành] Công điện mới           │
│ Về tăng cường trực phòng cháy       │
│                                     │
│ [Cập nhật] Điểm cháy đã khống chế   │
│ Tiểu khu 15                         │
└─────────────────────────────────────┘
```

Thông báo nên phân cấp bằng nhãn như Khẩn, Điều hành, Cập nhật để người dùng xử lý nhanh hơn.[^1]

### 9. Tài khoản và phân quyền

```text
┌─────────────────────────────────────┐
│ TÀI KHOẢN                           │
│                                     │
│ Họ tên: Nguyễn Văn A                │
│ Vai trò: Cán bộ hiện trường         │
│ Đơn vị: Hạt Kiểm lâm Liên Chiểu     │
│                                     │
│ [Khu vực phụ trách]                 │
│ [Lịch sử báo cáo]                   │
│ [Cài đặt thông báo]                 │
│ [Tăng cỡ chữ]                       │
│ [Đăng xuất]                         │
└─────────────────────────────────────┘
```

Khả năng đọc rõ và hỗ trợ người dùng nhiều độ tuổi là quan trọng, và ứng dụng Chính phủ Việt Nam trên App Store nêu rõ hỗ trợ nhiều cỡ chữ.[^11]

## Màn hình cán bộ điều hành

Dành riêng cho cấp huyện/tỉnh, giao diện nên nghiêng về dashboard quản trị nhưng vẫn giữ phong cách công vụ, đơn giản và chặt chẽ.[^1]

```text
┌────────────────────────────────────────────┐
│ TRUNG TÂM ĐIỀU HÀNH                        │
│                                            │
│ [Hôm nay] 12 điểm cảnh báo                 │
│ [Đã xác minh] 5    [Đang xử lý] 3          │
│ [Đã khống chế] 4                           │
│                                            │
│ ┌───────────────┐ ┌──────────────────────┐ │
│ │ Danh sách vụ  │ │ Bản đồ tổng hợp      │ │
│ │ - Hòa Bắc     │ │                      │ │
│ │ - Nam Đông    │ │                      │ │
│ │ - Phú Lộc     │ │                      │ │
│ └───────────────┘ └──────────────────────┘ │
│                                            │
│ [Phân công lực lượng] [Xuất báo cáo nhanh] │
└────────────────────────────────────────────┘
```


## Quy chuẩn UI nên áp dụng

- Header có tên hệ thống và cơ quan quản lý để khẳng định nguồn chính thức.[^7]
- Nút chính dùng màu xanh đậm; màu đỏ chỉ dùng cho cảnh báo hoặc hành động khẩn.
- Trạng thái luôn có nhãn chữ, không chỉ dựa vào màu.
- Font lớn, khoảng cách rộng, nút bấm cao để dễ thao tác trên mobile; điều này phù hợp với định hướng dễ dùng của ứng dụng công và hỗ trợ cỡ chữ.[^11]
- Mọi sự cố và báo cáo đều có mã tiếp nhận để đồng bộ với tư duy xử lý hồ sơ hành chính.[^1]


## Sơ đồ điều hướng

```text
Khởi động
  → Đăng nhập
    → Trang chủ
      → Bản đồ cảnh báo
        → Chi tiết cảnh báo
      → Báo cháy ngay
        → Kết quả tiếp nhận
      → Thông báo
      → Tài khoản
```

Tôi có thể làm tiếp bước 2 là chuyển bộ wireframe này thành **UI mockup hoàn chỉnh theo style cơ quan nhà nước Việt Nam**.
<span style="display:none">[^12][^13][^14][^15][^16][^17][^18]</span>

<div align="center">⁂</div>

[^1]: https://dichvucong.gov.vn

[^2]: https://ttpvhcc.hanoi.gov.vn/video/huong-dan-cong-dan-nop-ho-so-truc-tuyen-tren-cong-dich-vu-cong-quoc-gia-2850260116085159336.htm

[^3]: https://play.google.com/store/apps/details?id=com.vnid\&hl=vi

[^4]: https://dichvucong.gov.vn/p/home/dvc-gioi-thieu.html

[^5]: https://www.youtube.com/watch?v=9lQUk4DGyqs

[^6]: https://www.youtube.com/watch?v=FshJ7tffIC8

[^7]: https://vietnamnet.vn/nguoi-viet-da-de-dang-nhan-dien-ung-dung-cua-co-quan-nha-nuoc-tren-google-play-2354550.html

[^8]: https://dichvucong.bocongan.gov.vn/bocongan/tintuc/chitiet?matin=221

[^9]: https://dichvucong.gov.vn/p/home/dvc-huong-dan-cong-dan-doanh-nghiep.html

[^10]: https://bocongan.gov.vn/bai-viet/hieu-qua-cua-viec-to-giac-toi-pham-thong-qua-ung-dung-vneid-d22-t36752

[^11]: https://apps.apple.com/vn/app/chính-phủ-việt-nam/id1547397401?l=vi

[^12]: https://www.youtube.com/watch?v=HSmgjZ4Q6dM

[^13]: https://play.google.com/store/apps/details?id=com.eco.bigfont\&hl=vi

[^14]: https://www.thegioididong.com/game-app/cach-dang-ky-tai-khoan-cong-dich-vu-cong-quoc-gia-don-gian-1308213

[^15]: https://laodong.vn/video/bo-cong-an-phat-hanh-ung-dung-vneid-phien-ban-cap-nhat-moi-1399600.ldo

[^16]: https://support.vndirect.com.vn/hc/vi/articles/4402948260121-Hướng-dẫn-khách-hàng-điều-chỉnh-cỡ-chữ

[^17]: https://www.samsung.com/vn/support/mobile-devices/how-to-adjust-the-font-size-and-style-on-your-galaxy-phone/

[^18]: https://tantien.thanhhoa.gov.vn/chuyen-doi-so/huong-dan-cai-dat-vneid-va-su-dung-vneid-cua-bo-cong-an-500181

