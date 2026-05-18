# Tài liệu Đặc tả Yêu cầu Phần mềm (SRS)
## Dự án: Hệ thống Giám sát, Cảnh báo và Hỗ trợ Ứng phó Cháy rừng

**Phiên bản:** 1.0  
**Ngày:** 11/05/2026  
**Trạng thái:** Bản nháp

## 1. Giới thiệu

### 1.1 Mục đích tài liệu
Tài liệu này mô tả đầy đủ các yêu cầu chức năng và phi chức năng của hệ thống giám sát, phát hiện sớm, cảnh báo và hỗ trợ điều phối xử lý cháy rừng. Tài liệu được sử dụng làm cơ sở thống nhất giữa các bên liên quan gồm chủ đầu tư, đội phát triển, đội kiểm thử, đơn vị vận hành và cơ quan quản lý lâm nghiệp.

### 1.2 Phạm vi hệ thống
Hệ thống hỗ trợ theo dõi nguy cơ cháy rừng theo thời gian gần thực, tiếp nhận dữ liệu từ cảm biến và các nguồn dữ liệu ngoài, phát hiện bất thường, gửi cảnh báo, hiển thị bản đồ vùng cháy, quản lý sự cố và hỗ trợ điều phối lực lượng ứng cứu.

Phạm vi triển khai điển hình gồm:
- Khu vực rừng phòng hộ, rừng đặc dụng, rừng sản xuất.
- Trung tâm điều hành cấp tỉnh/huyện.
- Đội tuần tra rừng, kiểm lâm, lực lượng phản ứng nhanh.
- Người dân hoặc cộng tác viên báo cháy qua ứng dụng/web.

### 1.3 Định nghĩa và từ viết tắt
- **SRS:** Software Requirements Specification.
- **GIS:** Hệ thống thông tin địa lý.
- **IoT:** Internet vạn vật, gồm các thiết bị cảm biến hiện trường.
- **Cảnh báo mức độ:** Phân loại mức nghiêm trọng của nguy cơ hoặc sự cố cháy.
- **Sự cố cháy:** Một vụ việc có khả năng hoặc đã xảy ra cháy rừng.
- **Người dùng hiện trường:** Kiểm lâm, đội chữa cháy, cộng tác viên tại khu vực rừng.

### 1.4 Tài liệu tham chiếu
- Kế hoạch chuyển đổi số ngành lâm nghiệp của đơn vị triển khai.
- Quy trình nghiệp vụ phòng cháy chữa cháy rừng hiện hành.
- Tài liệu tích hợp cảm biến, bản đồ số, SMS, email, ứng dụng di động.

## 2. Tổng quan hệ thống

### 2.1 Bối cảnh nghiệp vụ
Cháy rừng gây thiệt hại lớn về tài nguyên, môi trường và an toàn cộng đồng. Việc phát hiện muộn, thông tin phân tán và thiếu phối hợp là các nguyên nhân chính làm giảm hiệu quả ứng phó. Hệ thống được xây dựng để tập trung dữ liệu, tự động hóa cảnh báo và hỗ trợ ra quyết định nhanh hơn.

### 2.2 Mục tiêu hệ thống
- Phát hiện sớm nguy cơ cháy hoặc dấu hiệu cháy.
- Cảnh báo kịp thời đến đúng đối tượng phụ trách.
- Hỗ trợ định vị, khoanh vùng và theo dõi diễn biến đám cháy.
- Quản lý quy trình xử lý sự cố từ phát hiện đến đóng vụ việc.
- Lưu trữ dữ liệu phục vụ thống kê, báo cáo và phân tích xu hướng.

### 2.3 Các bên liên quan
| Bên liên quan | Vai trò | Nhu cầu chính |
|---|---|---|
| Cơ quan quản lý lâm nghiệp | Quản trị và giám sát toàn cục | Theo dõi tình hình, nhận báo cáo, cấu hình hệ thống |
| Kiểm lâm/đội phản ứng | Xử lý hiện trường | Nhận cảnh báo, xác nhận sự cố, cập nhật trạng thái |
| Quản trị hệ thống | Vận hành kỹ thuật | Quản lý người dùng, cấu hình, nhật ký, tích hợp |
| Người dân/cộng tác viên | Báo tin | Gửi phản ánh nhanh, đính kèm ảnh/vị trí |
| Lãnh đạo địa phương | Chỉ đạo điều hành | Xem dashboard, báo cáo, mức độ rủi ro |

### 2.4 Giả định và ràng buộc
- Có kết nối mạng tại trung tâm điều hành; hiện trường có thể gián đoạn mạng.
- Một số cảm biến hoạt động bằng pin/năng lượng mặt trời.
- Hệ thống cần tích hợp bản đồ nền từ nhà cung cấp thứ ba.
- Dữ liệu vị trí và thông tin người dùng phải tuân thủ quy định bảo mật.

## 3. Mô tả tổng thể

### 3.1 Nhóm người dùng
- **Quản trị hệ thống:** cấu hình, phân quyền, theo dõi vận hành.
- **Điều hành viên:** giám sát dashboard, tiếp nhận và xử lý cảnh báo.
- **Kiểm lâm hiện trường:** nhận nhiệm vụ, cập nhật kết quả xử lý.
- **Lãnh đạo:** xem báo cáo tổng hợp, bản đồ nhiệt, thống kê.
- **Người báo cháy:** gửi thông tin ban đầu qua ứng dụng hoặc cổng web.

### 3.2 Môi trường vận hành
- Ứng dụng web cho trung tâm điều hành.
- Ứng dụng di động Android/iOS cho lực lượng hiện trường.
- Máy chủ ứng dụng, cơ sở dữ liệu, dịch vụ bản đồ và dịch vụ gửi thông báo.
- Kết nối với cảm biến nhiệt độ, độ ẩm, khói, camera hoặc vệ tinh nếu có.

### 3.3 Các ca sử dụng mức cao
- Theo dõi dữ liệu môi trường theo khu vực.
- Phát hiện bất thường và sinh cảnh báo.
- Tiếp nhận báo cháy từ người dùng.
- Xác minh cảnh báo và tạo sự cố.
- Phân công lực lượng xử lý.
- Theo dõi tiến độ ứng phó và đóng sự cố.
- Lập báo cáo thống kê định kỳ.

## 4. Yêu cầu chức năng

### FR-01 Quản lý người dùng và phân quyền
- Hệ thống cho phép tạo, sửa, khóa tài khoản.
- Hệ thống hỗ trợ các vai trò: quản trị, điều hành, kiểm lâm, lãnh đạo, cộng tác viên.
- Mỗi vai trò chỉ được truy cập các chức năng phù hợp.

**Tiêu chí chấp nhận:**
- Người dùng không có quyền không thể xem hoặc thao tác ngoài phạm vi được cấp.
- Hệ thống ghi log cho các thay đổi tài khoản và phân quyền.

### FR-02 Quản lý khu vực rừng
- Hệ thống cho phép khai báo khu vực rừng theo đơn vị hành chính hoặc tọa độ đa giác.
- Hệ thống lưu thông tin loại rừng, mức độ ưu tiên, đơn vị phụ trách, điểm tập kết gần nhất.
- Hệ thống hiển thị khu vực trên bản đồ.

### FR-03 Thu thập dữ liệu hiện trường
- Hệ thống tiếp nhận dữ liệu từ cảm biến theo chu kỳ cấu hình.
- Hệ thống lưu các chỉ số như nhiệt độ, độ ẩm, nồng độ khói, pin thiết bị, thời gian cập nhật.
- Hệ thống cảnh báo khi thiết bị mất kết nối hoặc gửi dữ liệu lỗi.

### FR-04 Phát hiện nguy cơ cháy
- Hệ thống phân tích dữ liệu đầu vào và xác định mức nguy cơ theo ngưỡng hoặc mô hình phân tích.
- Hệ thống gán mức nguy cơ: thấp, trung bình, cao, rất cao.
- Hệ thống hiển thị bản đồ nhiệt nguy cơ cháy theo khu vực.

### FR-05 Tiếp nhận báo cháy thủ công
- Người dùng được phép gửi báo cháy gồm vị trí, mô tả, thời gian quan sát, hình ảnh/video đính kèm.
- Hệ thống kiểm tra dữ liệu bắt buộc trước khi ghi nhận.
- Điều hành viên nhận được thông tin ngay sau khi báo cháy được gửi.

### FR-06 Sinh và gửi cảnh báo
- Khi có nguy cơ vượt ngưỡng hoặc tín hiệu cháy, hệ thống tạo cảnh báo tự động.
- Hệ thống gửi cảnh báo qua ứng dụng, SMS, email hoặc kênh tích hợp khác.
- Nội dung cảnh báo gồm mã cảnh báo, vị trí, thời gian, mức độ và đề xuất xử lý ban đầu.

**Ưu tiên:** Cao.

### FR-07 Quản lý sự cố cháy
- Điều hành viên có thể tạo sự cố từ cảnh báo hoặc từ báo cháy thủ công.
- Hệ thống cho phép cập nhật các trạng thái: mới tạo, đang xác minh, đang xử lý, đã khống chế, đã đóng.
- Mỗi sự cố phải có lịch sử xử lý và nhật ký thao tác.

### FR-08 Điều phối lực lượng
- Điều hành viên phân công đội xử lý theo khu vực, ca trực hoặc khoảng cách gần nhất.
- Hệ thống gửi nhiệm vụ đến thiết bị di động của lực lượng hiện trường.
- Lực lượng hiện trường có thể xác nhận đã nhận nhiệm vụ, đang di chuyển, đã đến nơi, hoàn tất.

### FR-09 Bản đồ và theo dõi thời gian thực
- Hệ thống hiển thị vị trí cảm biến, điểm báo cháy, khu vực nguy cơ và sự cố trên bản đồ.
- Hệ thống cho phép lọc theo thời gian, trạng thái, khu vực, mức độ.
- Hệ thống tự làm mới dữ liệu theo chu kỳ cấu hình.

### FR-10 Báo cáo và thống kê
- Hệ thống cung cấp báo cáo số lượng cảnh báo, sự cố, thời gian phản ứng, khu vực có rủi ro cao.
- Hệ thống hỗ trợ xuất báo cáo theo ngày, tuần, tháng, quý.
- Hệ thống cho phép xuất dữ liệu ra PDF/Excel.

### FR-11 Quản lý nhật ký hệ thống
- Hệ thống lưu nhật ký đăng nhập, thao tác người dùng, lỗi tích hợp và hoạt động gửi thông báo.
- Quản trị viên có thể tra cứu nhật ký theo thời gian và loại sự kiện.

### FR-12 Làm việc ngoại tuyến cho ứng dụng hiện trường
- Ứng dụng di động cho phép xem nhiệm vụ đã nhận khi mất mạng tạm thời.
- Người dùng có thể nhập cập nhật xử lý ngoại tuyến.
- Dữ liệu được đồng bộ khi có kết nối trở lại.

## 5. Yêu cầu phi chức năng

### NFR-01 Hiệu năng
- Hệ thống web hỗ trợ tối thiểu 500 người dùng đồng thời trong giai đoạn đầu.
- Thời gian phản hồi cho thao tác tra cứu thông thường không vượt quá 3 giây trong 95% yêu cầu.
- Cảnh báo quan trọng phải được xử lý và phát đi trong vòng tối đa 30 giây kể từ khi dữ liệu đầu vào hợp lệ được ghi nhận.

### NFR-02 Sẵn sàng và tin cậy
- Mục tiêu độ sẵn sàng hệ thống đạt 99.5% theo tháng.
- Có cơ chế sao lưu dữ liệu tự động hằng ngày.
- Có phương án khôi phục sau sự cố cho cơ sở dữ liệu và dịch vụ cốt lõi.

### NFR-03 Bảo mật
- Hệ thống yêu cầu đăng nhập và xác thực an toàn.
- Mật khẩu được mã hóa, phiên đăng nhập có thời hạn.
- Dữ liệu nhạy cảm như vị trí người dùng, thông tin liên hệ phải được bảo vệ khi truyền và lưu trữ.
- Các thao tác quan trọng cần được ghi vết phục vụ kiểm tra.

### NFR-04 Khả năng mở rộng
- Hệ thống có thể mở rộng số lượng cảm biến, khu vực giám sát và số người dùng mà không cần thay đổi lớn kiến trúc.
- Cho phép tích hợp thêm nguồn dữ liệu mới trong tương lai.

### NFR-05 Khả dụng và trải nghiệm người dùng
- Giao diện phải dễ sử dụng với cán bộ nghiệp vụ không chuyên CNTT.
- Các cảnh báo nghiêm trọng cần hiển thị nổi bật, dễ nhận biết.
- Ứng dụng di động tối ưu cho điều kiện dùng ngoài trời.

### NFR-06 Tương thích
- Web hỗ trợ các trình duyệt hiện đại như Chrome, Edge, Firefox.
- Ứng dụng di động hỗ trợ Android là bắt buộc; iOS là tùy phạm vi triển khai.

## 6. Quy tắc nghiệp vụ
- Một cảnh báo mức rất cao phải được chuyển đến điều hành viên phụ trách trong thời gian ngắn nhất theo cấu hình.
- Một sự cố cháy chỉ được đóng khi có xác nhận từ người có thẩm quyền.
- Người dùng hiện trường chỉ được cập nhật các sự cố thuộc phạm vi được phân công.
- Dữ liệu cảm biến quá ngưỡng nhưng thiếu tọa độ hợp lệ phải được đánh dấu để kiểm tra, không tự động hiển thị là điểm cháy xác thực.

## 7. Yêu cầu dữ liệu

### 7.1 Thực thể chính
- Người dùng.
- Vai trò.
- Khu vực rừng.
- Thiết bị cảm biến.
- Bản ghi cảm biến.
- Cảnh báo.
- Sự cố cháy.
- Phân công xử lý.
- Báo cáo.
- Nhật ký hệ thống.

### 7.2 Thuộc tính dữ liệu mẫu
| Thực thể | Thuộc tính chính |
|---|---|
| Người dùng | Mã, họ tên, số điện thoại, email, vai trò, đơn vị, trạng thái |
| Cảm biến | Mã thiết bị, loại thiết bị, tọa độ, khu vực, trạng thái, pin |
| Cảnh báo | Mã cảnh báo, nguồn, thời gian, mức độ, vị trí, trạng thái |
| Sự cố cháy | Mã sự cố, nguồn tạo, khu vực, mô tả, trạng thái, người phụ trách |
| Phân công | Mã phân công, sự cố, đội xử lý, thời gian giao, thời gian nhận |

## 8. Giao diện ngoài

### 8.1 Giao diện người dùng
- Dashboard tổng quan số cảnh báo, số sự cố đang mở, bản đồ vùng nguy cơ.
- Màn hình danh sách cảnh báo với bộ lọc nâng cao.
- Màn hình chi tiết sự cố với timeline xử lý.
- Ứng dụng di động có nút thao tác nhanh: nhận nhiệm vụ, cập nhật trạng thái, gửi ảnh hiện trường.

### 8.2 Giao diện phần cứng
- Kết nối cảm biến qua API hoặc giao thức do nhà cung cấp hỗ trợ.
- Có cơ chế xác thực thiết bị trước khi nhận dữ liệu.

### 8.3 Giao diện phần mềm
- Tích hợp dịch vụ bản đồ số.
- Tích hợp SMS gateway, email server, push notification.
- Có thể tích hợp camera AI hoặc dữ liệu vệ tinh trong giai đoạn mở rộng.

## 9. Kịch bản sử dụng chính

### UC-01 Xử lý cảnh báo tự động
1. Cảm biến gửi dữ liệu về hệ thống.
2. Hệ thống phân tích dữ liệu và xác định vượt ngưỡng nguy cơ.
3. Hệ thống tạo cảnh báo.
4. Hệ thống gửi thông báo đến điều hành viên.
5. Điều hành viên xác minh và tạo sự cố nếu cần.
6. Lực lượng hiện trường được phân công xử lý.
7. Sự cố được cập nhật đến khi đóng.

### UC-02 Người dân báo cháy
1. Người dùng mở ứng dụng hoặc web.
2. Người dùng nhập vị trí, mô tả và gửi ảnh.
3. Hệ thống ghi nhận báo cháy.
4. Điều hành viên tiếp nhận và xác minh.
5. Nếu hợp lệ, sự cố được tạo và chuyển xử lý.

## 10. Yêu cầu kiểm thử chấp nhận
- Kiểm thử đăng nhập, phân quyền theo vai trò.
- Kiểm thử nhận dữ liệu cảm biến hợp lệ/không hợp lệ.
- Kiểm thử sinh cảnh báo khi vượt ngưỡng.
- Kiểm thử gửi thông báo qua từng kênh cấu hình.
- Kiểm thử tạo, cập nhật, đóng sự cố.
- Kiểm thử bản đồ hiển thị đúng vị trí và bộ lọc.
- Kiểm thử đồng bộ ngoại tuyến của ứng dụng di động.
- Kiểm thử hiệu năng với tải người dùng và số lượng bản ghi lớn.

## 11. Rủi ro và vấn đề mở
- Chất lượng dữ liệu đầu vào từ cảm biến không ổn định.
- Khu vực rừng có thể mất sóng, ảnh hưởng cập nhật thời gian thực.
- Chi phí tích hợp bản đồ, SMS, camera hoặc vệ tinh có thể cao.
- Cần thống nhất rõ quy trình nghiệp vụ giữa các đơn vị trước khi triển khai chính thức.

## 12. Đề xuất phạm vi giai đoạn

### Giai đoạn 1
- Quản lý người dùng, khu vực rừng.
- Nhận dữ liệu cảm biến cơ bản.
- Cảnh báo tự động theo ngưỡng.
- Dashboard bản đồ.
- Quản lý sự cố và phân công xử lý.

### Giai đoạn 2
- Ứng dụng di động ngoại tuyến.
- Báo cháy từ người dân.
- Báo cáo nâng cao.
- Tích hợp camera hoặc mô hình AI.

## 13. Phụ lục: Gợi ý cấu trúc backlog
| Epic | User Story mẫu |
|---|---|
| Giám sát dữ liệu | Là điều hành viên, cần xem dữ liệu cảm biến theo khu vực để phát hiện nguy cơ sớm |
| Cảnh báo | Là kiểm lâm, cần nhận cảnh báo ngay trên điện thoại để phản ứng nhanh |
| Quản lý sự cố | Là điều hành viên, cần theo dõi toàn bộ vòng đời sự cố để điều phối hiệu quả |
| Báo cáo | Là lãnh đạo, cần xem thống kê theo tháng để đánh giá hiệu quả phòng cháy |

---

## Ghi chú sử dụng
Tài liệu SRS này là mẫu chuẩn hóa ban đầu. Khi triển khai thực tế, cần bổ sung thông tin cụ thể về phạm vi địa lý, số lượng cảm biến, quy trình phối hợp liên cơ quan, KPI vận hành, tiêu chuẩn bảo mật, và sơ đồ kiến trúc hệ thống.
