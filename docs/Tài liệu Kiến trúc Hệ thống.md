

## Dự án: Hệ thống Giám sát, Cảnh báo và Hỗ trợ Ứng phó Cháy rừng

  

**Phiên bản:** 1.0  

**Ngày:** 11/05/2026  

**Trạng thái:** Bản nháp kiến trúc giải pháp

  

## 1. Mục tiêu tài liệu

Tài liệu này mô tả kiến trúc tổng thể của hệ thống giám sát và cảnh báo cháy rừng, bao gồm kiến trúc nghiệp vụ, kiến trúc ứng dụng, kiến trúc dữ liệu, kiến trúc tích hợp, kiến trúc hạ tầng và các nguyên tắc thiết kế. Mục đích là tạo cơ sở chung cho đội phát triển, đội DevOps, kiểm thử, an toàn thông tin và chủ đầu tư trong quá trình triển khai.

  

## 2. Mục tiêu hệ thống

Hệ thống được thiết kế nhằm đạt các mục tiêu chính sau:

- Thu thập và hợp nhất dữ liệu từ hiện trường theo thời gian gần thực.

- Phát hiện sớm nguy cơ cháy hoặc tín hiệu cháy.

- Cảnh báo nhanh cho đơn vị phụ trách và lực lượng phản ứng.

- Quản lý vòng đời sự cố từ phát hiện, xác minh, xử lý đến báo cáo.

- Hỗ trợ theo dõi bản đồ, điều phối lực lượng và phân tích lịch sử.

  

## 3. Nguyên tắc kiến trúc

- **Mô-đun hóa:** Các thành phần được tách biệt theo chức năng để dễ phát triển và bảo trì.

- **Khả năng mở rộng:** Có thể mở rộng số lượng cảm biến, khu vực giám sát và người dùng.

- **Tích hợp mở:** Hệ thống ưu tiên giao tiếp qua API và hàng đợi sự kiện để dễ kết nối dịch vụ ngoài.

- **An toàn theo thiết kế:** Bảo mật được áp dụng từ tầng người dùng đến hạ tầng.

- **Khả dụng cao:** Các thành phần quan trọng có phương án giám sát, sao lưu và khôi phục.

- **Offline-first cho hiện trường:** Ứng dụng di động cần hỗ trợ mất mạng tạm thời.

  

## 4. Phạm vi kiến trúc

Tài liệu này bao phủ các thành phần sau:

- Cổng web điều hành.

- Ứng dụng di động cho lực lượng hiện trường.

- Dịch vụ backend và API.

- Dịch vụ xử lý dữ liệu cảm biến.

- Dịch vụ cảnh báo và thông báo.

- Hệ quản trị cơ sở dữ liệu.

- Hệ thống bản đồ/GIS.

- Tích hợp với SMS, email, push notification, camera hoặc vệ tinh.

  

## 5. Kiến trúc tổng thể

  

### 5.1 Mô hình kiến trúc đề xuất

Kiến trúc đề xuất theo hướng **layered architecture kết hợp event-driven**. Phần giao diện người dùng trao đổi với backend qua API Gateway. Dữ liệu cảm biến và sự kiện cảnh báo được tiếp nhận qua dịch vụ ingest và xử lý bất đồng bộ thông qua message broker.

  

### 5.2 Các lớp chính

1. **Lớp trình bày (Presentation Layer):** Web app cho trung tâm điều hành, mobile app cho hiện trường.

2. **Lớp dịch vụ nghiệp vụ (Application/Business Layer):** Quản lý cảnh báo, sự cố, điều phối, báo cáo, người dùng.

3. **Lớp tích hợp và xử lý sự kiện (Integration/Event Layer):** Nhận dữ liệu cảm biến, hàng đợi sự kiện, worker xử lý.

4. **Lớp dữ liệu (Data Layer):** Cơ sở dữ liệu giao dịch, kho log, cache, dữ liệu không gian địa lý.

5. **Lớp hạ tầng (Infrastructure Layer):** Máy chủ, container, giám sát, sao lưu, mạng, bảo mật.

  

### 5.3 Sơ đồ logic mức cao

```text

[Cảm biến/Camera/Nguồn ngoài]

            |

            v

   [Ingestion Service/API]

            |

            v

     [Message Broker/Queue]

            |

   -----------------------------

   |            |             |

   v            v             v

[Risk Engine] [Alert Service] [Data Processor]

   |            |             |

   --------------             |

          |                   |

          v                   v

      [Core Backend/API] --> [Database/GIS/Cache/Logs]

          |

   -------------------

   |                 |

   v                 v

[Web Portal]   [Mobile App]

```

  

## 6. Kiến trúc nghiệp vụ

  

### 6.1 Miền nghiệp vụ chính

- Quản lý người dùng và tổ chức.

- Quản lý khu vực rừng và bản đồ.

- Giám sát cảm biến và nguồn dữ liệu hiện trường.

- Phát hiện nguy cơ, tạo cảnh báo.

- Quản lý sự cố cháy.

- Điều phối lực lượng và cập nhật xử lý.

- Báo cáo, thống kê và phân tích xu hướng.

  

### 6.2 Luồng nghiệp vụ cốt lõi

1. Cảm biến hoặc người dùng gửi tín hiệu/báo cháy.

2. Hệ thống tiếp nhận và chuẩn hóa dữ liệu.

3. Dịch vụ phân tích đánh giá mức nguy cơ hoặc xác suất cháy.

4. Hệ thống tạo cảnh báo và gửi thông báo.

5. Điều hành viên xác minh, sau đó tạo sự cố.

6. Sự cố được phân công cho lực lượng hiện trường.

7. Quá trình xử lý được cập nhật liên tục đến khi đóng sự cố.

8. Dữ liệu cuối cùng được dùng cho báo cáo và phân tích lịch sử.

  

## 7. Kiến trúc ứng dụng

  

### 7.1 Danh sách dịch vụ chính

| Thành phần | Vai trò chính | Ghi chú |

|---|---|---|

| Web Portal | Giao diện điều hành và giám sát | Dùng cho trung tâm điều hành, lãnh đạo |

| Mobile App | Tác nghiệp hiện trường | Hỗ trợ vị trí, ảnh, offline sync |

| API Gateway | Cổng truy cập tập trung | Xác thực, định tuyến, giới hạn truy cập |

| Auth Service | Xác thực và phân quyền | Hỗ trợ RBAC |

| Forest Management Service | Quản lý khu vực rừng và đơn vị phụ trách | Tích hợp dữ liệu GIS |

| Sensor Ingestion Service | Nhận dữ liệu cảm biến | Validate, chuẩn hóa dữ liệu đầu vào |

| Risk Analysis Service | Phân tích nguy cơ cháy | Theo ngưỡng hoặc mô hình AI/ML |

| Alert Service | Quản lý cảnh báo | Sinh cảnh báo, escalation |

| Incident Service | Quản lý sự cố cháy | Vòng đời xử lý sự cố |

| Dispatch Service | Điều phối lực lượng | Giao việc, theo dõi trạng thái đội xử lý |

| Notification Service | Gửi SMS, email, push | Hỗ trợ retry và log kết quả |

| Reporting Service | Báo cáo và dashboard | Báo cáo quản trị và vận hành |

| Audit/Logging Service | Ghi nhật ký hệ thống | Phục vụ truy vết và giám sát |

  

### 7.2 Cách phân tách dịch vụ

Giai đoạn đầu có thể triển khai theo **modular monolith** để giảm độ phức tạp và tăng tốc phát triển. Khi số lượng tích hợp, lưu lượng dữ liệu cảm biến hoặc yêu cầu mở rộng tăng cao, các mô-đun ingest, alert, notification và analytics có thể tách thành microservices độc lập.

  

### 7.3 Nguyên tắc giao tiếp

- Giao tiếp đồng bộ qua REST API cho các thao tác nghiệp vụ người dùng.

- Giao tiếp bất đồng bộ qua queue/event bus cho luồng dữ liệu cảm biến và cảnh báo.

- Tất cả API nội bộ và bên ngoài cần xác thực và ghi log.

  

## 8. Kiến trúc dữ liệu

  

### 8.1 Thành phần dữ liệu

- **Relational Database:** lưu dữ liệu giao dịch như người dùng, cảnh báo, sự cố, phân công.

- **Time-series hoặc bảng tối ưu theo thời gian:** lưu dữ liệu cảm biến với tần suất lớn.

- **Geospatial data store:** lưu ranh giới khu vực rừng, tọa độ điểm cháy, lớp bản đồ.

- **Cache:** tăng tốc đọc dashboard, danh mục, session.

- **Object Storage:** lưu ảnh/video hiện trường, file báo cáo, tài liệu đính kèm.

- **Log Store:** lưu nhật ký ứng dụng, hạ tầng và bảo mật.

  

### 8.2 Mô hình dữ liệu mức khái niệm

| Thực thể | Quan hệ chính |

|---|---|

| User | Thuộc Role, thuộc Organization |

| ForestArea | Thuộc Organization, có nhiều Sensor |

| Sensor | Gửi nhiều SensorReading |

| Alert | Có thể sinh từ SensorReading hoặc ManualReport |

| Incident | Có thể được tạo từ Alert |

| Assignment | Thuộc Incident và gắn với ResponseTeam/User |

| Attachment | Thuộc ManualReport hoặc Incident |

| AuditLog | Ghi nhận thao tác trên các thực thể chính |

  

### 8.3 Chiến lược lưu trữ

- Dữ liệu giao dịch và dữ liệu cấu hình cần đảm bảo ACID.

- Dữ liệu cảm biến có thể partition theo ngày/tháng để tối ưu truy vấn.

- Ảnh/video cần lưu tách khỏi cơ sở dữ liệu giao dịch để giảm tải.

- Bản ghi log cần có chính sách lưu trữ nóng/lạnh theo thời gian.

  

## 9. Kiến trúc tích hợp

  

### 9.1 Nguồn tích hợp đầu vào

- Cảm biến IoT: nhiệt độ, độ ẩm, khói, gió.

- Camera AI hoặc camera IP.

- Dữ liệu vệ tinh hoặc dữ liệu thời tiết nếu có.

- Báo cáo thủ công từ ứng dụng/web.

  

### 9.2 Tích hợp đầu ra

- SMS gateway.

- Email server.

- Push notification service.

- API chia sẻ dữ liệu cho hệ thống điều hành cấp trên.

  

### 9.3 Mẫu tích hợp đề xuất

- Thiết bị gửi dữ liệu đến endpoint bảo mật hoặc broker trung gian.

- Dữ liệu được xác thực schema trước khi vào pipeline xử lý.

- Các sự kiện như `ALERT_CREATED`, `INCIDENT_ASSIGNED`, `NOTIFICATION_FAILED` được publish lên event bus.

- Các dịch vụ downstream subscribe theo nhu cầu riêng.

  

## 10. Kiến trúc hạ tầng

  

### 10.1 Mô hình triển khai

Kiến trúc triển khai đề xuất theo container hóa trên môi trường cloud hoặc on-premise có hỗ trợ orchestration. Với quy mô vừa, có thể dùng một cụm ứng dụng gồm web/API, worker xử lý nền, database, cache và monitoring.

  

### 10.2 Thành phần hạ tầng

- Load Balancer hoặc Reverse Proxy.

- Cụm ứng dụng backend.

- Cụm worker xử lý queue.

- Database chính và bản sao dự phòng.

- Redis hoặc hệ cache tương đương.

- Object storage cho tệp đính kèm.

- Hệ thống giám sát và cảnh báo vận hành.

- Hệ thống sao lưu và phục hồi.

  

### 10.3 Môi trường triển khai

| Môi trường | Mục đích |

|---|---|

| Development | Phát triển và kiểm thử nội bộ |

| SIT/UAT | Kiểm thử tích hợp và nghiệm thu |

| Production | Vận hành chính thức |

| DR (tùy chọn) | Khôi phục thảm họa |

  

## 11. Kiến trúc bảo mật

  

### 11.1 Kiểm soát truy cập

- Xác thực người dùng qua cơ chế đăng nhập an toàn.

- Phân quyền theo vai trò (RBAC) và phạm vi quản lý khu vực.

- Token truy cập có thời hạn và được làm mới theo chính sách.

  

### 11.2 Bảo vệ dữ liệu

- Mã hóa dữ liệu khi truyền bằng HTTPS/TLS.

- Mã hóa hoặc băm mật khẩu trong cơ sở dữ liệu.

- Hạn chế truy cập trực tiếp vào dữ liệu nhạy cảm như vị trí người dùng và thông tin liên lạc.

  

### 11.3 An ninh vận hành

- Ghi log các hành vi quan trọng như đăng nhập, thay đổi phân quyền, đóng/mở sự cố.

- Cảnh báo khi có truy cập bất thường, lỗi tích hợp lặp lại hoặc tăng đột biến lưu lượng.

- Áp dụng nguyên tắc phân quyền tối thiểu cho tài khoản hệ thống.

  

## 12. Kiến trúc sẵn sàng và mở rộng

  

### 12.1 Sẵn sàng cao

- Tách web/API và worker để tránh ảnh hưởng chéo khi tải tăng.

- Cấu hình health check cho các dịch vụ.

- Có cơ chế retry, dead-letter queue cho thông báo hoặc dữ liệu lỗi.

  

### 12.2 Mở rộng ngang

- Tăng số instance backend khi số lượng người dùng tăng.

- Tăng worker xử lý khi lượng dữ liệu cảm biến hoặc số cảnh báo tăng cao.

- Phân vùng dữ liệu theo khu vực hoặc thời gian khi quy mô mở rộng lớn.

  

## 13. Giám sát và vận hành

- Theo dõi CPU, RAM, dung lượng ổ đĩa, độ trễ API, số lượng message queue, lỗi gửi thông báo.

- Dashboard vận hành cần có chỉ số business và chỉ số kỹ thuật.

- Cần thiết lập log correlation theo request ID hoặc incident ID để dễ truy vết.

- Có quy trình backup định kỳ, kiểm tra restore và cập nhật bản vá bảo mật.

  

## 14. Quyết định công nghệ gợi ý

  

### 14.1 Frontend

- Web: React, Vue hoặc Angular.

- Mobile: Flutter hoặc React Native; nếu cần tối ưu sâu có thể native Android trước.

  

### 14.2 Backend

- Java Spring Boot, .NET, Node.js hoặc Python tùy năng lực đội ngũ.

- API Gateway: Kong, NGINX, hoặc giải pháp cloud-native.

- Message broker: RabbitMQ, Kafka hoặc tương đương.

  

### 14.3 Data và hạ tầng

- PostgreSQL/PostGIS cho dữ liệu giao dịch và không gian.

- Redis cho cache và hàng đợi nhẹ.

- MinIO/S3 cho object storage.

- Docker + Kubernetes hoặc Docker Compose ở giai đoạn đầu.

- Prometheus + Grafana + Loki/ELK cho giám sát và log.

  

## 15. Trade-off kiến trúc

| Lựa chọn | Ưu điểm | Hạn chế | Khuyến nghị |

|---|---|---|---|

| Modular Monolith | Đơn giản, nhanh triển khai, dễ kiểm soát | Khó mở rộng độc lập khi hệ thống lớn | Phù hợp giai đoạn 1 |

| Microservices | Mở rộng tốt, tách biệt rõ, linh hoạt tích hợp | Vận hành phức tạp, tăng chi phí | Phù hợp khi đã ổn định nghiệp vụ |

| On-premise | Chủ động dữ liệu, phù hợp một số yêu cầu nội bộ | Mở rộng và DR khó hơn | Dùng khi có ràng buộc hạ tầng nghiêm ngặt |

| Cloud | Linh hoạt, dễ mở rộng, có managed services | Phụ thuộc nhà cung cấp, cần kiểm soát chi phí | Phù hợp nếu ngân sách và chính sách cho phép |

  

## 16. Lộ trình kiến trúc đề xuất

  

### Giai đoạn 1

- Xây dựng web portal, backend lõi, cơ sở dữ liệu giao dịch, dashboard bản đồ.

- Tích hợp dữ liệu cảm biến cơ bản và cảnh báo theo rule engine.

- Hỗ trợ quản lý sự cố, phân công xử lý, gửi thông báo push/SMS.

  

### Giai đoạn 2

- Bổ sung mobile offline-first cho hiện trường.

- Tối ưu pipeline sự kiện và reporting nâng cao.

- Tích hợp camera AI, ảnh vệ tinh, mô hình dự báo nâng cao.

  

### Giai đoạn 3

- Tách dịch vụ thành microservices nếu tải tăng mạnh.

- Mở rộng liên thông dữ liệu đa tỉnh hoặc cấp quốc gia.

- Bổ sung data lake/BI cho phân tích chuyên sâu.

  

## 17. Rủi ro kiến trúc

- Dữ liệu cảm biến không đồng nhất giữa nhiều nhà cung cấp.

- Kết nối mạng hiện trường không ổn định làm ảnh hưởng dữ liệu thời gian thực.

- Độ chính xác cảnh báo phụ thuộc chất lượng dữ liệu và thuật toán.

- Tích hợp đa nguồn có thể làm tăng đáng kể độ phức tạp vận hành.

- Nếu tách microservices quá sớm, chi phí triển khai và giám sát có thể vượt nhu cầu thực tế.

  

## 18. Khuyến nghị triển khai

- Bắt đầu với kiến trúc mô-đun rõ ràng trong một codebase thống nhất.

- Ưu tiên chuẩn hóa dữ liệu và API ngay từ đầu.

- Thiết kế event schema dùng lâu dài để tránh sửa đổi dây chuyền.

- Triển khai logging, monitoring, backup và security baseline ngay từ bản đầu tiên.

- Xác định rõ SLA cảnh báo và thời gian phản ứng để dẫn dắt quyết định kỹ thuật.

  

## 19. Phụ lục: sơ đồ triển khai tham chiếu

```text

                    +----------------------+

                    |   Web Browser        |

                    +----------+-----------+

                               |

                    +----------v-----------+

                    | Load Balancer / WAF  |

                    +----------+-----------+

                               |

             +-----------------+-----------------+

             |                                   |

   +---------v---------+               +---------v---------+

   |  Web/API Instance |               |  Web/API Instance |

   +---------+---------+               +---------+---------+

             |                                   |

             +-----------------+-----------------+

                               |

                    +----------v-----------+

                    | Message Broker/Queue |

                    +----+------------+----+

                         |            |

              +----------v--+      +--v-----------+

              | Risk Worker |      | Notify Worker|

              +----------+--+      +--+-----------+

                         |            |

                         +------+- ---+

                                |

                    +-----------v-----------+

                    | PostgreSQL/PostGIS    |

                    +-----------+-----------+

                                |

                    +-----------v-----------+

                    | Object Storage / Logs |

                    +-----------------------+

```

  

---

  

## Ghi chú sử dụng

Tài liệu này là kiến trúc tham chiếu ở mức giải pháp. Khi vào triển khai thực tế, nên bổ sung thêm sơ đồ C4, sơ đồ sequence cho luồng cảnh báo, danh mục API, mô hình dữ liệu chi tiết, NFR định lượng và tài liệu triển khai DevOps.