# 1. Tên dự án và Các bên liên quan
- **Tên dự án:** Hệ thống Giám sát và Phát hiện Cháy rừng Tự động (tên thương mại: SmartFire / WildFire
- Trong giai đoạn mở rộng, dự án mang tên "Đầu tư bổ sung, nâng cấp hệ thống Camera chuyên dụng phục vụ công tác quản lý, bảo vệ rừng trên địa bàn tỉnh Thanh Hóa".
- **Đơn vị phát triển & Triển khai:** Công ty ESTEC (East Sea Technology Engineering Electrical Automation Co., Ltd).
- **Đơn vị thụ hưởng (Chủ đầu tư giai đoạn mở rộng):** Chi cục Kiểm lâm tỉnh Thanh Hóa, trực thuộc Sở Nông nghiệp và Phát triển Nông thôn.
# 2. Mục tiêu và Phạm vi triển khai
- **Mục tiêu cốt lõi:** Chuyển đổi số ngành Lâm nghiệp (xây dựng mô hình "Kiểm lâm số"). Ứng dụng Trí tuệ nhân tạo (AI), Internet vạn vật (IoT) và Hệ thống thông tin địa lý (GIS) để **phát hiện sớm khói/lửa 24/7**, tự động dự báo nguy cơ cháy rừng, và tự động đề xuất Phương án chữa cháy (PACCR).
- **Mục tiêu mở rộng:** Không chỉ báo cháy, hệ thống còn giám sát biến động rừng (phát hiện mất rừng, suy thoái qua ảnh vệ tinh) và giám sát an ninh rừng (nhận diện xe vận chuyển lâm sản trái phép).
- **Phạm vi triển khai:**
	- Đã triển khai mô hình thí điểm thành công tại **Sóc Sơn (Hà Nội)**
	- Đang trong giai đoạn triển khai mở rộng quy mô lớn tại **tỉnh Thanh Hóa**, tập trung vào các vùng rừng có nguy cơ cháy cao
# 3. Công nghệ Cốt lõi (Tech Stack)
Dự án là sự kết hợp phức tạp giữa Phần cứng công nghiệp và Phần mềm hiện đại:
- **Phần cứng (Hardware & IoT):** Sử dụng các Camera PTZ chuyên dụng (chủ yếu là Hikvision) có khả năng zoom quang học 53x, xoay 360 độ liên tục, có Laser ban đêm và tầm nhìn từ 5-13km. Hệ thống cũng tích hợp các Trạm thời tiết IoT tự động (cảm biến lượng mưa, tốc độ/hướng gió, nhiệt độ, độ ẩm) truyền dữ liệu qua PLC Siemens S7-1200 và bộ Gateway IOT2050
- **Trí tuệ nhân tạo (AI):** Chạy module độc lập bằng ngôn ngữ Python, sử dụng các mô hình học sâu **YOLOv5 và YOLOv8** (Computer Vision) để phân tích luồng Video (RTSP) nhằm nhận diện khói và lửa với độ tin cậy ≥ 80
- **Phần mềm & Web (Backend/Frontend):** Web portal được lập trình bằng React/TypeScript, hiển thị bản đồ đa lớp (GIS). Máy chủ Backend chạy bằng framework Django (Python) và lưu trữ dữ liệu không gian bằng PostgreSQL kết hợp PostGIS
# 4. Kiến trúc Hệ thống
Hệ thống được thiết kế đồng bộ theo mô hình 4 lớp:
1. **Lớp kết nối, thu thập dữ liệu:** Gồm Camera và các cảm biến IoT nằm ngoài hiện trường rừng núi.
2. **Lớp quản lý, lưu trữ:** Toàn bộ dữ liệu truyền về qua Internet/4G được lưu trữ tại máy chủ trung tâm (Server đặt tại Văn phòng Chi cục Kiểm lâm).
3. **Lớp xử lý dữ liệu (AI Engine):** Tập hợp dữ liệu, tự động phân tích hình ảnh để phát hiện khói lửa, lọc báo động giả.
4. **Lớp phân tích & Hiển thị:** Giao diện Web/App (Dashboard) cung cấp biểu đồ, bản đồ và gửi thông báo cho lực lượng kiểm lâm

# 5. Các Chức năng Trọng tâm
- **Phát hiện và cảnh báo cháy:** Camera quét 12 góc liên tục. Khi AI phát hiện cháy, hệ thống dùng thuật toán chiếu tia (kết hợp góc camera, tọa độ trạm và bản đồ độ cao DEM) để tính ra chính xác tọa độ GPS của đám cháy.
- **Thông báo khẩn cấp đa kênh:** Tự động gửi cảnh báo qua Email, SMS, Zalo đến chủ rừng và lực lượng chức năng kèm theo hình ảnh, vị trí và **Phương án chữa cháy tự động** (tính toán tốc độ lan truyền, chiều cao ngọn lửa, chiến thuật dập lửa).
- **Dự báo nguy cơ cháy:** Liên tục nội suy dữ liệu thời tiết thu thập được để tính toán **Chỉ số P (Nesterov)**, từ đó cảnh báo cấp nguy cơ cháy (Cấp I - V) trên bản đồ.
- _(Giai đoạn mở rộng)_ **Giám sát biến động & An ninh:** Tích hợp ảnh vệ tinh (Sentinel/Landsat) để phân tích chỉ số thực vật (NDVI) phát hiện khu vực mất rừng. Lắp thêm camera an ninh nhận diện biển số xe (ANPR) tại các cửa rừng.

# 6. Lộ trình & Ngân sách (Giai đoạn mở rộng tại Thanh Hóa)
- **Thời gian thực hiện:** Giai đoạn 2025 - 2026 (hoặc phân kỳ từ 2026 - 2029 theo một số phương án
- **Khối lượng đầu tư:** Lắp đặt mới 26 camera chuyên dụng giám sát cháy rừng và 14 camera an ninh
- **Tổng mức đầu tư dự kiến:** Khoảng **9,59 đến 9,94 tỷ đồng** từ nguồn kinh phí chi thường xuyên của ngân sách tỉnh

# 7 Máy chủ
- Máy chủ AI xử lý AI
- Máy chủ WEB/GIS/API để triển khai riêng

# 8 Code cũ 
- WildFire---Web---HoanVo

# 9 38 module chức năng dự án
#### I. NHÓM BẢN ĐỒ – GIS – ĐIỀU HƯỚNG

**1. Hiển thị bản đồ đa lớp**

- **Yêu cầu chức năng:** Cung cấp nền tảng bản đồ số không gian, cho phép hiển thị các định dạng bản đồ nền (OSM, Satellite, Topographic). Hỗ trợ chồng xếp (Overlay) linh hoạt các lớp dữ liệu Vector/Raster. Người dùng có thể tùy ý bật/tắt từng lớp dữ liệu độc lập. Hỗ trợ thao tác thu phóng (Zoom) và di chuyển (Pan) trơn tru trên mọi thiết bị.
    
- **Đặc tả kỹ thuật:** Tích hợp GIS Engine chuyên dụng (Mapbox GL, OpenLayers hoặc Cesium) hỗ trợ render qua WebGL. Ứng dụng công nghệ tải theo ô lưới chuẩn (XYZ, WMTS). Tối ưu băng thông bằng thuật toán Lazy Loading theo từng mức Zoom. Hỗ trợ đồng thời 2 hệ quy chiếu: EPSG:3857 (Web Mercator) và EPSG:4326 (WGS84). Tương thích các chuẩn dữ liệu GeoJSON, MBTiles, WMS/WFS.
    

**2. Quản lý và tùy chỉnh hiển thị các lớp dữ liệu**

- **Yêu cầu chức năng:** Giao diện điều khiển bản đồ nâng cao. Hỗ trợ sắp xếp thứ tự hiển thị của các lớp (Z-index). Cho phép cá nhân hóa màu sắc, biểu tượng (icon) và độ trong suốt (opacity). Đặc biệt hỗ trợ khả năng hiển thị bản đồ theo chủ đề (Thematic Map) tự động thay đổi style dựa trên thuộc tính của dữ liệu.
    
- **Đặc tả kỹ thuật:** Xây dựng cơ chế cấu hình Style JSON (Style Config JSON) linh hoạt. Tích hợp thuật toán kết xuất dựa trên quy tắc (Rule-based rendering). Lưu trữ bộ đệm cấu hình (Cache) tự động theo phiên làm việc của từng người dùng.
    

**3. Truy vấn thông tin thuộc tính**

- **Yêu cầu chức năng:** Cung cấp cơ chế tương tác trực tiếp lên thực thể (Click-to-View) để hiển thị Popup chứa siêu dữ liệu (Metadata). Hỗ trợ liên kết trực tiếp từ bản đồ đến hồ sơ cảnh báo/sự vụ chi tiết. Cho phép truy vấn khoanh vùng theo đa giác (Polygon query) để lấy danh sách thuộc tính hàng loạt.
    
- **Đặc tả kỹ thuật:** Khai thác sức mạnh truy vấn không gian (Spatial Query) trực tiếp từ PostgreSQL/PostGIS. Xây dựng Identify API chuyên dụng, đảm bảo thời gian phản hồi (Response time) luôn nhỏ hơn 500ms dưới tải cao.
    

**4. Công cụ điều hướng bản đồ nâng cao**

- **Yêu cầu chức năng:** Cung cấp tính năng Go-To để nhảy nhanh tới một tọa độ (Lat/Lng) cụ thể. Hỗ trợ đánh dấu (Bookmark) các địa điểm quan trọng để truy xuất nhanh. Giao diện hiển thị trực quan thước tỷ lệ (Scale) và la bàn (Compass).
    
- **Đặc tả kỹ thuật:** Phát triển Client-side controller xử lý logic điều hướng. Ứng dụng IndexedDB để lưu trữ cục bộ danh sách Bookmark, đảm bảo truy xuất mượt mà không cần gọi API.
    

**5. Công cụ vẽ và đo đạc trên bản đồ**

- **Yêu cầu chức năng:** Cung cấp bộ công cụ tương tác: vẽ điểm, vẽ đường (LineString) để tính toán chiều dài tuyến đường, vẽ vùng (Polygon) để đo đạc diện tích khoanh vùng. Hỗ trợ lưu trữ các nét vẽ dưới dạng phiên tạm thời (Session) hoặc lưu vĩnh viễn vào hệ thống.
    
- **Đặc tả kỹ thuật:** Tích hợp Geometry Engine hỗ trợ tính toán Geodesic (tính toán khoảng cách trên bề mặt cong của Trái đất) để đảm bảo độ chính xác tuyệt đối. Khả năng kết xuất (Export) đồ họa đã vẽ sang định dạng GeoJSON chuẩn.
    

**8. Định vị GPS và dẫn đường**

- **Yêu cầu chức năng:** Lấy chính xác vị trí hiện tại của thiết bị. Hỗ trợ thuật toán điều hướng, dẫn đường từ vị trí hiện tại tới tọa độ điểm cháy. Tối ưu hóa hoạt động cho các thiết bị Mobile của lực lượng kiểm lâm.
    
- **Đặc tả kỹ thuật:** Khai thác giao thức HTML5 Geolocation. Ứng dụng thuật toán Map Matching để bắt dính tọa độ vào mạng lưới giao thông. Hỗ trợ module định tuyến ngoại tuyến (Offline Routing) trong các khu vực mất sóng.
    

**35. Bản đồ & dữ liệu ngoại tuyến (Offline Maps)**

- **Yêu cầu chức năng:** Hỗ trợ tải trước (Pre-download) các gói bản đồ khu vực (AOI). Tự động đồng bộ hóa (Sync) dữ liệu khi thiết bị có lại kết nối mạng. Hệ thống tự động phát cảnh báo nhắc nhở khi gói dữ liệu ngoại tuyến đã lỗi thời.
    
- **Đặc tả kỹ thuật:** Đóng gói bản đồ dưới định dạng MBTiles. Quản lý lưu trữ cục bộ (Local cache) trên thiết bị di động bằng SQLite. Sử dụng thuật toán đồng bộ gia số (Delta Sync) để chỉ cập nhật các thay đổi, tiết kiệm dung lượng 3G/4G.
    

#### II. NHÓM NGƯỜI DÙNG – BẢO MẬT – HỆ THỐNG

**6. Hiển thị & cập nhật thông tin cá nhân**

- **Yêu cầu chức năng:** Quản lý hồ sơ định danh số. Cho phép xem và chỉnh sửa thông tin Profile, ảnh đại diện (Avatar), và các thông tin liên lạc nghiệp vụ.
    
- **Đặc tả kỹ thuật:** Triển khai luồng RESTful API. Tích hợp bộ lọc làm sạch và xác thực dữ liệu đầu vào (Data Validation). Hệ thống tự động ghi nhận nhật ký (Audit Log) cho mọi thao tác thay đổi thông tin hồ sơ.
    

**7. Đặt lại mật khẩu**

- **Yêu cầu chức năng:** Cung cấp cơ chế khôi phục quyền truy cập an toàn qua OTP (One Time Password) hoặc Email Reset Link. Thực thi chính sách bắt buộc mật khẩu mạnh (độ dài, ký tự đặc biệt).
    
- **Đặc tả kỹ thuật:** Áp dụng tiêu chuẩn xác thực JWT (JSON Web Token) / OAuth2. Mật khẩu lưu trong CSDL được băm hóa bảo mật bằng các thuật toán chuẩn công nghiệp (Bcrypt hoặc Argon2). Tích hợp cơ chế Rate Limiting để chống tấn công Brute-force.
    

**22. Quản lý người dùng & phân quyền (RBAC)**

- **Yêu cầu chức năng:** Phân quyền truy cập dựa trên vai trò nghiệp vụ (Role-based access). Kiểm soát quyền hạn tới từng chức năng chi tiết và từng tập dữ liệu cụ thể.
    
- **Đặc tả kỹ thuật:** Xây dựng ma trận phân quyền (RBAC Matrix). Tích hợp Policy Engine để xử lý logic kiểm tra quyền động. Kiến trúc thiết kế sẵn sàng hỗ trợ đa khách hàng/đa cơ quan (Multi-tenant support).
    

**23. Quản lý địa bàn phụ trách (AOR - Area of Responsibility)**

- **Yêu cầu chức năng:** Ánh xạ mối quan hệ giữa Người dùng/Tổ kiểm lâm với các vùng địa lý cụ thể (Xã, Hạt, Tiểu khu). Tự động giới hạn hiển thị dữ liệu cảnh báo theo đúng ranh giới địa bàn được giao.
    
- **Đặc tả kỹ thuật:** Áp dụng các rào cản không gian (Spatial Constraint). Cơ chế lọc dữ liệu bắt buộc thực thi ở tầng Server-side để đảm bảo tính bảo mật tuyệt đối, ngăn chặn can thiệp từ Client-side.
    

**24. Cấu hình hệ thống thông báo**

- **Yêu cầu chức năng:** Tùy chỉnh các kênh nhận cảnh báo (Email, Push Notifications, In-app message). Cho phép thiết lập các quy tắc kích hoạt thông báo (Rule-based trigger) dựa trên mức độ nghiêm trọng.
    
- **Đặc tả kỹ thuật:** Triển khai hệ thống hàng đợi tin nhắn (Message Queue) kết hợp với kiến trúc Notification Service độc lập để tránh gây nghẽn luồng xử lý chính.
    

**25. Audit Log (Nhật ký kiểm toán)**

- **Yêu cầu chức năng:** Ghi nhận tự động toàn bộ các hành động quan trọng (Đăng nhập, Thay đổi cấu hình, Xóa sự vụ). Cung cấp công cụ truy vấn và xuất (Export) dữ liệu nhật ký cho quản trị viên.
    
- **Đặc tả kỹ thuật:** Áp dụng cấu trúc Immutable Log (Dữ liệu chỉ ghi, không thể sửa/xóa). Lưu trữ trên CSDL chuỗi thời gian (Time-series DB) để tối ưu tốc độ ghi. Truy xuất log được kiểm soát chặt chẽ bởi RBAC.
    

**30. Đa ngôn ngữ (i18n)**

- **Yêu cầu chức năng:** Cung cấp giao diện linh hoạt hỗ trợ nhiều ngôn ngữ. Khả năng chuyển đổi ngôn ngữ tức thời (Switch runtime) mà không làm gián đoạn phiên làm việc.
    
- **Đặc tả kỹ thuật:** Xây dựng bộ từ điển i18n JSON. Đảm bảo hỗ trợ mã hóa UTF-8 Full-stack. Cơ chế Fallback Language tự động hiển thị ngôn ngữ mặc định nếu thiếu bản dịch.
    

#### III. NHÓM CẢNH BÁO – NHIỆM VỤ – HIỆN TRƯỜNG

**10. Bảng tin / Thông báo hệ thống**

- **Yêu cầu chức năng:** Công cụ phát sóng thông điệp từ Ban quản lý. Hỗ trợ CRUD (Tạo, Đọc, Cập nhật, Xóa) bản tin. Tính năng ghim (Pin) bài viết và thiết lập độ ưu tiên.
    
- **Đặc tả kỹ thuật:** Áp dụng Role-based visibility để xác định đối tượng nhận tin. (Gửi đích danh cho một đội kiểm lâm hoặc toàn hệ thống).
    

**11. Giao nhiệm vụ xác minh**

- **Yêu cầu chức năng:** Chuyển hóa một Cảnh báo hệ thống thành một Nhiệm vụ thực địa. Cho phép chỉ định (Assign) nhiệm vụ cho cá nhân hoặc đội/trạm. Thiết lập thời hạn (Deadline) và cam kết mức độ dịch vụ (SLA - Service Level Agreement).
    
- **Đặc tả kỹ thuật:** Tích hợp bộ đếm thời gian thực để theo dõi và tính toán chỉ số hoàn thành nhiệm vụ theo quy chuẩn SLA.
    

**12. Theo dõi & cập nhật trạng thái**

- **Yêu cầu chức năng:** Quản lý vòng đời nhiệm vụ qua luồng công việc (Workflow) trạng thái. Hiển thị dòng thời gian (Timeline) xử lý minh bạch. Hỗ trợ trao đổi qua bình luận (Comment) và đính kèm tệp tin.
    
- **Đặc tả kỹ thuật:** Quản lý trạng thái bằng State Machine. Lưu trữ bình luận và metadata file đính kèm tập trung có liên kết ID sự vụ.
    

**13–15. Dashboard & Quản lý cảnh báo**

- **Yêu cầu chức năng:** Trung tâm điều hành cung cấp bảng điều khiển (Dashboard) cập nhật thời gian thực. Tích hợp bộ lọc thông minh đa chiều. Truy xuất kho lịch sử cảnh báo chi tiết phục vụ điều tra.
    
- **Đặc tả kỹ thuật:** Kiến trúc Hướng sự kiện (Event-driven Architecture). Kỹ thuật lập chỉ mục nâng cao (Advanced Indexing) trên CSDL. Hỗ trợ truy vấn phân tích trực tuyến (OLAP query) đối với tập dữ liệu lớn để trích xuất báo cáo tốc độ cao.
    

**16. Đồng bộ nhiệm vụ (Mobile)**

- **Yêu cầu chức năng:** App Mobile hỗ trợ lưu trữ Offline, tự động đẩy (Push) cập nhật trạng thái từ hiện trường về trung tâm ngay khi có mạng lưới 3G/4G/Wifi.
    
- **Đặc tả kỹ thuật:** Kiến trúc Offline-first. Tích hợp thuật toán xử lý xung đột dữ liệu (Conflict Resolution) trong trường hợp đa tác vụ đồng bộ cùng lúc.
    

**17–18. Báo cáo hiện trường**

- **Yêu cầu chức năng:** Biểu mẫu số động (Dynamic Form) cho lực lượng thực địa. Cho phép tải lên đa phương tiện (Ảnh, Video, Audio) làm chứng cứ. Tự động gắn thẻ tọa độ địa lý (Auto Geotag) vào từng bức ảnh.
    
- **Đặc tả kỹ thuật:** Giao tiếp qua Mobile API, bóc tách metadata EXIF từ hình ảnh để xác minh chéo tọa độ thực tế nhằm phòng chống làm giả báo cáo hiện trường.
    

**19. Tự động kết xuất báo cáo**

- **Yêu cầu chức năng:** Tạo báo cáo tổng hợp tự động theo các biểu mẫu quy chuẩn định dạng PDF, Excel. Hỗ trợ lập lịch (Scheduler) kết xuất báo cáo (Cuối ngày, Cuối tuần).
    
- **Đặc tả kỹ thuật:** Tích hợp bộ công cụ Template Engine. Hỗ trợ API để tích hợp Chữ ký số (Digital Signature) và hệ thống nhúng Watermark chống sao chép bản quyền tài liệu.
    

**20. Dashboard thống kê**

- **Yêu cầu chức năng:** Trực quan hóa dữ liệu hiệu suất bằng Biểu đồ thời gian (Timeline Charts), Bản đồ nhiệt (Heatmap) thể hiện mức độ tập trung cháy rừng. Hỗ trợ tính năng Drill-down (Click vào biểu đồ tổng để xem chi tiết số liệu con).
    
- **Đặc tả kỹ thuật:** Render dữ liệu bằng các thư viện Charting chuyên sâu xử lý tập dữ liệu lớn.
    

**21. Xuất dữ liệu**

- **Yêu cầu chức năng:** Trích xuất dữ liệu gốc ra đa định dạng (CSV, XLSX, PDF, GeoJSON) phục vụ đối soát.
    
- **Đặc tả kỹ thuật:** Cơ chế Role-based export (Chỉ những tài khoản có thẩm quyền mới được quyền xuất Data gốc để đảm bảo an toàn thông tin).
    

**26. Tìm kiếm nâng cao**

- **Yêu cầu chức năng:** Công cụ tìm kiếm tổng hợp toàn hệ thống. Hỗ trợ lưu lại bộ lọc tìm kiếm (Saved Search) để dùng cho các lần sau.
    
- **Đặc tả kỹ thuật:** Kết hợp thuật toán Tìm kiếm toàn văn bản (Full-text Search) với các truy vấn không gian (Spatial Queries). Hỗ trợ logic truy vấn đa điều kiện (Multi-condition logic: AND, OR, NOT).
    

**28. Liên kết cảnh báo**

- **Yêu cầu chức năng:** Nhận diện và gom nhóm các báo cáo đơn lẻ có điểm chung. Hiển thị dưới dạng đồ thị liên kết (Graph View).
    
- **Đặc tả kỹ thuật:** Áp dụng thuật toán gom cụm (Root-cause grouping) dựa trên chuỗi thời gian và sự gần gũi về không gian (Spatial-temporal clustering) để xác định các đám cháy lan có chung một nguồn gốc.
    

**29. Dashboard hiệu suất cá nhân**

- **Yêu cầu chức năng:** Quản lý chỉ số năng lực. Hiển thị KPI, tỷ lệ tuân thủ thời gian xử lý (SLA compliance), bảng xếp hạng và xu hướng hiệu suất (Trending).
    

#### IV. NHÓM AI – ẢNH VỆ TINH – PHÂN TÍCH

**31. Thu thập & tiền xử lý ảnh vệ tinh**

- **Yêu cầu chức năng:** Hệ thống tự động truy xuất ảnh vệ tinh dựa trên vùng quan tâm (AOI - Area of Interest) và mốc thời gian chỉ định.
    
- **Đặc tả kỹ thuật:** Xây dựng luồng dữ liệu (Data pipeline) giao tiếp với các API ảnh vệ tinh (Sentinel/Landsat). Tích hợp thuật toán Tiền xử lý: Nhận diện và che lấp mây (Cloud Masking), chuẩn hóa bức xạ (Normalization) để đồng nhất chất lượng ảnh đầu vào cho AI.
    

**32. Phân tích phát hiện biến động**

- **Yêu cầu chức năng:** Cho phép người dùng chủ động yêu cầu phân tích một khu vực (On-demand AOI). Tính năng cấu hình ngưỡng nhạy cảm (Threshold config) để loại bỏ các cảnh báo sai.
    
- **Đặc tả kỹ thuật:** Áp dụng phương pháp Temporal Differencing (Trừ ảnh đa thời gian) kết hợp thuật toán tính toán chỉ số thực vật (NDVI/NBR) để đánh giá tỷ lệ mất rừng.
    

**33. AI so sánh ảnh**

- **Yêu cầu chức năng:** Cốt lõi trí tuệ nhân tạo. Tự động phân tích và so sánh các tập ảnh. Hỗ trợ chạy phân tích theo lô lớn (Batch) định kỳ hoặc thời gian thực (Realtime).
    
- **Đặc tả kỹ thuật:** Ứng dụng các kiến trúc Học sâu tiên tiến như Mạng nơ-ron tích chập (CNN) hoặc mô hình Transformer. Triển khai các Model Change Detection chuyên biệt cho ảnh vệ tinh.
    

**34. Khoanh vùng & độ tin cậy**

- **Yêu cầu chức năng:** Tự động vẽ ranh giới (Polygon) quanh khu vực có biến động do cháy. Đánh giá và gán điểm tin cậy (Confidence Score). Hỗ trợ cơ chế "Vòng lặp người dùng" (Human-in-the-loop) để kiểm lâm tinh chỉnh ranh giới do AI vẽ.
    
- **Đặc tả kỹ thuật:** Áp dụng kỹ thuật Auto-Segmentation (Phân đoạn ảnh tự động). Mô hình AI liên tục tự học và cải thiện độ chính xác thông qua dữ liệu tinh chỉnh phản hồi từ người dùng (Human-in-the-loop validation).
    

**36. Phân tích điểm nóng**

- **Yêu cầu chức năng:** Phân tích quy luật phân bố của các vụ cháy theo thời gian và không gian để dự báo rủi ro.
    
- **Đặc tả kỹ thuật:** Áp dụng các thuật toán Phân cụm không gian (Spatial Clustering) như KDE (Kernel Density Estimation) hoặc DBSCAN. Tích hợp phân tích chuỗi cửa sổ thời gian (Time-window analysis).
    

**37. Time-lapse**

- **Yêu cầu chức năng:** Tự động tạo ảnh động/video thể hiện quá trình biến đổi của khu vực rừng bị cháy.
    
- **Đặc tả kỹ thuật:** Thuật toán Image Sequencing (Xếp chuỗi ảnh). Hỗ trợ render video (Video export) và chèn nhãn đồ họa, lớp phủ thông tin (Annotation overlay) trực tiếp lên video báo cáo.
    

#### V. TÍCH HỢP & MỞ RỘNG

**27. Import dữ liệu không gian**

- **Yêu cầu chức năng:** Hệ thống hỗ trợ tải lên các tệp tin bản đồ sẵn có (Shapefile, GeoJSON, KML) để làm dữ liệu nền.
    
- **Đặc tả kỹ thuật:** Tích hợp bộ phân tích cú pháp (Parser) xử lý hình học. Tự động xác thực tính hợp lệ của dữ liệu (Validation) và chuyển đổi hệ quy chiếu (CRS transform) cho đồng nhất với lõi bản đồ hệ thống.
    

**38. Cung cấp API**

- **Yêu cầu chức năng:** Cung cấp cổng giao tiếp mở để kết nối với các phần mềm của bên thứ 3 (Ví dụ: Cổng thông tin điều hành của Tỉnh).
    
- **Đặc tả kỹ thuật:** Triển khai kiến trúc RESTful hoặc GraphQL. Áp dụng xác thực bằng Auth Token. Hỗ trợ quản lý phiên bản API (Versioning), cơ chế Webhook. Tuân thủ tiêu chuẩn đặc tả OpenAPI Spec. Hệ thống tích hợp Audit & Monitoring và Rate Limit để chống lạm dụng băng thông API.