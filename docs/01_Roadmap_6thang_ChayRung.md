# ROADMAP TRIỂN KHAI 6 THÁNG

## Phần mềm Phát hiện & Quản lý Cháy rừng

> **Forest Fire Detection & Management System**
>
> Quy mô: 5 nhân sự — Thời gian: 6 tháng — Phương pháp: Agile/Scrum
>
> Phạm vi: Web dashboard + Mobile app + Backend API + AI/CV + IoT integration
>
> *Phiên bản 1.0 — Tháng 5/2026*

---

## Mục lục

1. Tổng quan dự án
2. Kiến trúc kỹ thuật
3. Roadmap chi tiết 6 tháng (6 sprints)
4. Milestones & Deliverables
5. Cơ cấu & vai trò nhân sự
6. Công cụ & quy trình làm việc
7. Quản lý rủi ro
8. KPI & tiêu chí thành công
9. Sử dụng công cụ AI (tóm tắt)
10. Kết luận & bước tiếp theo

---

# 1. TỔNG QUAN DỰ ÁN

## 1.1. Bối cảnh & động lực

Cháy rừng là một trong những thảm họa nghiêm trọng nhất do biến đổi khí hậu, gây thiệt hại lớn về kinh tế, môi trường và sinh mạng. Việt Nam có hơn 14 triệu hecta rừng, trong đó nhiều khu vực thuộc nguy cơ cháy cao vào mùa khô. Việc phát hiện sớm và điều phối ứng cứu hiệu quả có thể giảm 60–80% thiệt hại.

Dự án này xây dựng một nền tảng phần mềm tích hợp giúp phát hiện sớm cháy rừng bằng AI, dự báo nguy cơ, điều phối lực lượng ứng cứu và tiếp nhận báo cáo từ cộng đồng — tất cả trong một hệ sinh thái thống nhất.

## 1.2. Mục tiêu dự án

### Mục tiêu kinh doanh

- Giảm thời gian phát hiện cháy rừng từ trung bình 30 phút xuống dưới 5 phút.
- Tăng tỷ lệ ứng cứu đúng vị trí và đúng thời điểm lên trên 90%.
- Cung cấp công cụ ra quyết định dựa trên dữ liệu cho cơ quan kiểm lâm.
- Huy động cộng đồng tham gia giám sát và báo cáo sự cố.

### Mục tiêu kỹ thuật

- Mô hình AI phát hiện khói/lửa đạt độ chính xác ≥ 92% trên tập kiểm thử.
- API backend xử lý ≥ 100 yêu cầu/giây với độ trễ p95 dưới 300ms.
- Mobile app hỗ trợ Android 8+ và iOS 14+, hoạt động offline-first.
- Hệ thống có thể tích hợp tối thiểu 3 nguồn dữ liệu IoT/Camera.
- Triển khai trên Docker, có thể scale ngang khi lưu lượng tăng.

## 1.3. Phạm vi dự án (Scope)

| Module | Mô tả |
|---|---|
| **M1 — Detection AI** | Hệ thống phát hiện khói và lửa từ ảnh camera/drone/vệ tinh dùng mô hình computer vision (YOLOv8 / RetinaNet). Inference real-time, gửi cảnh báo qua MQTT. |
| **M2 — Risk Forecast** | Mô hình dự báo chỉ số nguy cơ cháy (Fire Weather Index) theo thời gian thực, kết hợp dữ liệu thời tiết, độ ẩm, NDVI, lịch sử cháy. |
| **M3 — Response Mgmt** | Web dashboard cho ban chỉ huy: bản đồ GIS, điều phối đội cứu hỏa, theo dõi tài nguyên, báo cáo sau sự cố. |
| **M4 — Community App** | Mobile app cho người dân: báo cáo cháy bằng ảnh + GPS, nhận cảnh báo theo vùng, hướng dẫn di tản. |
| **M5 — IoT Integration** | Lớp tiếp nhận dữ liệu từ camera giám sát, trạm thời tiết, cảm biến khói (LoRaWAN/MQTT). |

## 1.4. Ngoài phạm vi (Out of scope)

- Sản xuất thiết bị phần cứng (camera, cảm biến) — chỉ tích hợp.
- Hệ thống điều khiển drone tự động — phiên bản v2.
- Tích hợp với hệ thống ngân sách/tài chính nội bộ.
- Hỗ trợ ngôn ngữ ngoài tiếng Việt và tiếng Anh.

## 1.5. Các bên liên quan (Stakeholders)

- **Nhà tài trợ:** Cơ quan/đơn vị chủ quản hoặc giảng viên hướng dẫn (đối với dự án học thuật).
- **Người dùng nghiệp vụ:** Lực lượng kiểm lâm, ban chỉ huy phòng cháy chữa cháy rừng cấp tỉnh/huyện.
- **Người dùng cuối:** Người dân sống gần rừng, du khách, đội tình nguyện.
- **Đội phát triển:** 5 thành viên (Tech Lead, Backend, AI/ML, Frontend, Mobile).

---

# 2. KIẾN TRÚC KỸ THUẬT

## 2.1. Sơ đồ tổng thể (Logical view)

Hệ thống được tổ chức theo kiến trúc microservices nhẹ với 4 tầng:

```
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION                                                │
│  Web Dashboard (Next.js)  •  Mobile App (Flutter)           │
└──────────────┬──────────────────────────────┬───────────────┘
               │ REST + WebSocket             │ REST + Push
┌──────────────▼──────────────────────────────▼───────────────┐
│  API GATEWAY  (Nginx + Rate-Limit + Auth)                   │
└──────────────┬──────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────┐
│  SERVICES (FastAPI microservices)                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ auth-api │ │incident  │ │ai-detect │ │forecast- │       │
│  │          │ │ -api     │ │ -or      │ │engine    │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└──────────────┬──────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────┐
│  DATA LAYER                                                 │
│  PostgreSQL+PostGIS  •  TimescaleDB  •  Redis  •  MinIO    │
│  RabbitMQ / NATS  •  MQTT (Mosquitto/EMQX)                 │
└──────────────▲──────────────────────────────────────────────┘
               │
┌──────────────┴──────────────────────────────────────────────┐
│  INGESTION                                                   │
│  IoT Sensors (LoRaWAN)  •  Cameras (ONVIF/RTSP)             │
│  Weather API  •  Satellite (Sentinel/MODIS)                 │
└──────────────────────────────────────────────────────────────┘
```

## 2.2. Stack công nghệ đề xuất

| Tầng | Công nghệ chính | Lý do chọn |
|---|---|---|
| **Frontend Web** | React + Next.js + TailwindCSS + MapLibre GL | Hệ sinh thái lớn, render bản đồ GIS hiệu quả, SSR cho SEO. |
| **Mobile** | Flutter (khuyến nghị) hoặc React Native | Một codebase Android+iOS, hiệu năng native, hỗ trợ offline tốt. |
| **Backend API** | FastAPI (Python) + Pydantic + SQLAlchemy | Đồng bộ stack với AI/ML, async hiệu năng cao, OpenAPI tự động. |
| **AI/ML** | PyTorch + Ultralytics YOLOv8 + ONNX Runtime | SOTA cho object detection, hỗ trợ edge inference qua ONNX. |
| **Database** | PostgreSQL 15 + PostGIS + TimescaleDB | Lưu trữ địa lý + chuỗi thời gian + quan hệ — tất cả trong một. |
| **Cache & Queue** | Redis + RabbitMQ / NATS | Cache phiên + hàng đợi xử lý ảnh và cảnh báo. |
| **IoT Layer** | MQTT (Mosquitto/EMQX) + LoRaWAN gateway | Chuẩn công nghiệp cho IoT, băng thông thấp. |
| **Storage** | MinIO (S3-compatible) | Tự host, tương thích AWS S3 SDK, miễn phí. |
| **DevOps** | Docker + Docker Compose, GitHub Actions, Nginx | Đóng gói nhất quán, CI/CD đơn giản. |
| **Monitoring** | Prometheus + Grafana + Loki | Open-source, đủ dùng cho dự án quy mô vừa. |

## 2.3. Mô hình dữ liệu cốt lõi (high-level)

- `users` (id, role, region_id, ...) — kiểm lâm, công dân, admin.
- `regions` (id, geom POLYGON, name, fire_class) — đơn vị quản lý rừng.
- `incidents` (id, region_id, geom POINT, severity, status, detected_by, started_at).
- `detections` (id, source, image_url, confidence, bbox, model_version, created_at).
- `sensor_readings` (sensor_id, ts, temperature, humidity, smoke_ppm) — TimescaleDB hypertable.
- `forecasts` (region_id, ts, fwi_score, model_version).
- `alerts` (id, incident_id, channel, status, recipients[]).
- `response_units` (id, type, location, status, current_incident_id).

## 2.4. Ranh giới bảo mật

- OAuth2 + JWT cho user; mTLS cho IoT gateway.
- RBAC: roles = `admin`, `ranger`, `dispatcher`, `citizen`, `analyst`.
- Mã hoá at-rest cho database (pgcrypto cho cột nhạy cảm).
- Rate-limit theo IP/user; logging mọi action thay đổi trạng thái sự cố.

---

# 3. ROADMAP CHI TIẾT 6 THÁNG

Dự án chia thành **6 sprint × 4 tuần** theo Scrum. Mỗi sprint kết thúc bằng demo có thể chạy được (potentially shippable increment).

## Sprint 1 — Tháng 1: Khởi tạo & Thiết kế

**Mục tiêu:** Hoàn thiện đặc tả yêu cầu, thiết kế UX/UI sơ bộ, dựng khung backend/frontend rỗng, thiết lập CI/CD và môi trường phát triển. Kết thúc sprint phải có một "hello world" end-to-end chạy trên Docker.

**Deliverables:**

- Tài liệu SRS (Software Requirements Specification) — 30–40 trang.
- User stories backlog (≥ 80 stories) trong GitHub Projects/Jira.
- Wireframe Figma cho Web dashboard và Mobile app (5–8 màn hình chính).
- Repo GitHub với cấu trúc monorepo (`apps/web`, `apps/mobile`, `services/api`, `services/ai`, `infra/`).
- `docker-compose.yml` chạy: PostgreSQL+PostGIS, Redis, MinIO, FastAPI skeleton, Next.js skeleton.
- Pipeline GitHub Actions: lint + test + build cho mỗi PR.
- Tài liệu kiến trúc (Architecture Decision Records — ADR).

**Definition of Done:**

- Mọi service khởi động sạch trên `docker compose up`.
- Test coverage ban đầu cho health-check endpoint ≥ 80%.
- Wireframe được review và phê duyệt bởi stakeholder.

## Sprint 2 — Tháng 2: Backend Core, Auth & Data Model

**Mục tiêu:** Xây dựng các API CRUD nền tảng, hệ thống đăng nhập/phân quyền, mô hình dữ liệu chuẩn hóa, và lớp tiếp nhận dữ liệu cảm biến IoT đầu tiên qua MQTT.

**Deliverables:**

- Migrations PostgreSQL/PostGIS (Alembic) cho 8 bảng cốt lõi.
- API: `/auth` (login, refresh, register), `/users`, `/regions`, `/incidents` (CRUD).
- OpenAPI docs tự sinh, Postman collection.
- Service ingestion MQTT: nhận message từ broker → ghi vào TimescaleDB.
- Seed data: 3 vùng rừng mẫu, 10 sensor giả, 50 incident lịch sử.
- Test suite: unit (≥ 60% coverage) + integration cho các flow auth/CRUD.

## Sprint 3 — Tháng 3: AI Detection (Smoke & Fire CV)

**Mục tiêu:** Huấn luyện và triển khai mô hình computer vision phát hiện khói + lửa, đóng gói thành microservice inference. Sprint chuyên sâu kỹ thuật, AI/ML Engineer dẫn dắt.

**Deliverables:**

- Bộ dataset đã gán nhãn (≥ 5,000 ảnh): D-Fire, FLAME, scrape thêm từ camera giám sát + tự gán bằng CVAT.
- Notebook huấn luyện YOLOv8 (s và m) — log experiment trên Weights & Biases.
- Mô hình export ONNX, đạt **mAP@0.5 ≥ 0.85** trên tập validation.
- Service `ai-detector` (FastAPI + ONNX Runtime) expose endpoint `/detect`.
- Pipeline: ảnh từ MinIO → queue → detector → ghi `detections` table → publish event "incident_candidate".
- Báo cáo đánh giá: confusion matrix, false positive rate, edge cases (mây, sương, đèn xe).

**Rủi ro cần lưu ý:**

- Dataset không đủ đa dạng → false positive cao. **Mitigate:** hard negative mining.
- GPU không sẵn → train chậm. **Mitigate:** Google Colab Pro / Kaggle Kernels free.

## Sprint 4 — Tháng 4: Web Dashboard + GIS Map + Forecast Model

**Mục tiêu:** Hoàn thiện giao diện web dashboard cho ban chỉ huy với bản đồ GIS thời gian thực, đồng thời triển khai mô hình dự báo chỉ số nguy cơ cháy.

**Deliverables:**

- Web dashboard (Next.js) với 6 module: Bản đồ trực tiếp, Danh sách sự cố, Quản lý nguồn lực, Cảnh báo, Báo cáo, Cài đặt.
- Bản đồ MapLibre GL: ranh giới vùng (PostGIS), heatmap nguy cơ, marker incident, real-time qua WebSocket.
- Mô hình forecast: tính FWI hàng giờ từ Open-Meteo API + NDVI Sentinel Hub.
- Service `forecast-engine` chạy job định kỳ (cron + Celery), ghi vào `forecasts`.
- Hệ thống thông báo qua email (SMTP) và webhook Slack/Telegram.
- E2E test cho 3 user flow chính: xem incident → điều động đội → đóng incident.

## Sprint 5 — Tháng 5: Mobile App + Community Reporting + IoT

**Mục tiêu:** Hoàn thiện app cho công dân và mở rộng tích hợp IoT. Đảm bảo app hoạt động ngay cả khi mất sóng (offline-first).

**Deliverables:**

- Mobile app (Flutter): Báo cáo, Cảnh báo, Bản đồ gần tôi, Hướng dẫn di tản, Hồ sơ.
- Báo cáo cháy: chụp ảnh + GPS + ghi chú → upload (queue khi offline).
- Push notification (FCM) theo geofencing — chỉ gửi đến user trong bán kính ảnh hưởng.
- Tích hợp 2 thiết bị IoT thật: trạm thời tiết Davis + camera CCTV ONVIF.
- Trang quản lý sensor trong web dashboard (sức khỏe, pin, last-seen).
- Triển khai staging đầy đủ trên VPS/Cloud (Docker Swarm hoặc K3s).

## Sprint 6 — Tháng 6: Hardening, UAT, Triển khai & Đào tạo

**Mục tiêu:** Sprint cuối tập trung chất lượng, hiệu năng, bảo mật và chuẩn bị go-live. **Không thêm feature mới** — chỉ bug fix, polish và tài liệu.

**Deliverables:**

- Báo cáo load test (k6/Locust): hệ thống chịu 100 RPS với p95 < 300ms.
- Báo cáo penetration test sơ bộ (OWASP ZAP, Bandit cho Python).
- Tài liệu vận hành: runbook, backup/restore, disaster recovery.
- Tài liệu người dùng: hướng dẫn cho ranger (PDF) + 3 video screencast (mỗi 5 phút).
- Hoàn thành 2 vòng UAT với người dùng thật, fix mọi bug "showstopper".
- Triển khai production, monitoring dashboard hoạt động.
- Buổi training chính thức cho người dùng cuối (4 giờ).
- Báo cáo tổng kết dự án + kế hoạch bảo trì 3 tháng.

---

# 4. MILESTONES & DELIVERABLES TỔNG HỢP

| Mốc | Thời điểm | Deliverable chính | Phê duyệt bởi |
|---|---|---|---|
| **M0** | Tuần 1 | Project Charter, team kick-off | Stakeholder |
| **M1** | Cuối tháng 1 | SRS, Wireframe, Skeleton chạy được trên Docker | Tech Lead + Stakeholder |
| **M2** | Cuối tháng 2 | Backend API CRUD, Auth, MQTT ingestion | Tech Lead |
| **M3** | Cuối tháng 3 | AI Detection model triển khai, đạt mAP ≥ 0.85 | Tech Lead + AI Lead |
| **M4** | Cuối tháng 4 | Web dashboard MVP + Forecast engine | Stakeholder |
| **M5** | Cuối tháng 5 | Mobile app công khai (TestFlight/Play Internal) + 2 IoT tích hợp | Stakeholder |
| **M6** | Cuối tháng 6 | Production go-live + đào tạo + handover | Tất cả các bên |

---

# 5. CƠ CẤU & VAI TRÒ NHÂN SỰ (5 NGƯỜI)

Đội nhỏ buộc mỗi thành viên phải đa năng (T-shaped). Phân vai trò dưới đây là vai trò chính, mỗi người sẽ hỗ trợ chéo trong 20–30% thời gian. **Chi tiết phân công theo sprint nằm ở file Excel kèm theo.**

| Vai trò chính | Trách nhiệm cốt lõi | Kỹ năng cần có |
|---|---|---|
| **Tech Lead / PM** (1) | Kiến trúc, code review, planning, đối thoại stakeholder, quản trị rủi ro. Code 30–40% thời gian. | Kiến trúc microservices, đã làm Scrum master, Python/TypeScript, kỹ năng giao tiếp. |
| **Backend Engineer** (1) | Phát triển FastAPI services, PostgreSQL/PostGIS, MQTT ingestion, queue/cron job. | Python async, SQLAlchemy/Alembic, hiểu PostGIS cơ bản, Redis, Docker. |
| **AI/ML Engineer** (1) | Dataset, huấn luyện YOLOv8, ONNX export, service inference, mô hình forecast FWI. | PyTorch, Ultralytics, OpenCV, scikit-learn, MLflow/W&B, ONNX, kinh nghiệm CV. |
| **Frontend Engineer** (1) | Web dashboard Next.js, MapLibre GL, real-time WebSocket, component library. | React/Next.js, TypeScript, Tailwind, GIS frontend (MapLibre/Leaflet), Storybook. |
| **Mobile Engineer** (1) | Flutter app, offline-first, FCM, geofencing, camera/GPS API. | Flutter/Dart, SQLite/Hive, REST + WebSocket, FCM, Android/iOS deployment. |

---

# 6. CÔNG CỤ & QUY TRÌNH LÀM VIỆC

## 6.1. Cộng tác & quản lý dự án

- **GitHub:** source code, Issues, Projects (Kanban), Actions (CI/CD).
- **Obsidian** (cá nhân) + **GitHub Wiki** (chung): tài liệu kỹ thuật, ADR, knowledge base.
- **Figma:** wireframe, design system, prototype tương tác.
- **Discord/Slack:** kênh `#general`, `#engineering`, `#incidents`, `#bots`.

## 6.2. Phát triển & chất lượng

- VS Code (hoặc JetBrains) + **GitHub Copilot** làm IDE chính.
- Pre-commit hooks: `ruff` (Python), `eslint+prettier` (JS/TS), `commitlint`.
- Code review bắt buộc 1 reviewer cho PR thường, 2 reviewer cho PR core.
- Test pyramid: unit > integration > e2e (Playwright cho web, Patrol cho Flutter).
- **Sourcetrail / GraphCode** để khám phá codebase khi onboard module mới.

## 6.3. Hạ tầng vận hành

- **Docker** + Docker Compose cho dev/staging.
- Production: Docker Swarm trên 2–3 VPS, hoặc K3s nếu nhu cầu mở rộng.
- **PostgreSQL:** backup hằng ngày bằng `pg_dump`, lưu trữ ở object storage.
- Monitoring: Grafana dashboard cho 4 chỉ số vàng — latency, traffic, errors, saturation.

## 6.4. Nhịp điệu Scrum

- Sprint 4 tuần. Daily standup 15 phút lúc 9h00.
- Sprint planning: ngày đầu sprint (2h).
- Sprint review + demo: chiều thứ 6 cuối sprint (1.5h).
- Retrospective: sau review (1h).
- Backlog refinement: chiều thứ 4 hằng tuần (1h).

---

# 7. QUẢN LÝ RỦI RO

| Rủi ro | Khả năng | Tác động | Biện pháp giảm thiểu |
|---|:---:|:---:|---|
| Dataset cháy/khói không đủ đa dạng → false positive cao | Cao | Cao | Kết hợp dataset công khai (D-Fire, FLAME) + scrape camera + augmentation; hard negative mining; threshold điều chỉnh được. |
| Thiếu GPU để train | TB | TB | Google Colab Pro, Kaggle, hoặc spot instance AWS/GCP. Checkpoint định kỳ. |
| Thành viên rời dự án giữa chừng | TB | Cao | Pair programming, tài liệu hóa ADR, code review nghiêm ngặt; cross-skill từ Sprint 1. |
| Stakeholder thay đổi yêu cầu | Cao | TB | Bám sát Scope; mọi thay đổi đi qua Change Request; buffer 15%/sprint. |
| Tích hợp IoT bị block do nhà cung cấp | TB | Cao | Tiếp xúc nhà cung cấp từ Sprint 1; chuẩn bị mock IoT thay thế cho dev. |
| Vấn đề pháp lý/quyền riêng tư khi thu ảnh từ camera | TB | Cao | Tham vấn pháp chế từ đầu; mã hóa, RBAC chặt; chỉ lưu metadata cần thiết. |
| Vượt ngân sách hạ tầng cloud | TB | TB | Theo dõi billing hằng tuần; ưu tiên self-host cho dev/staging; cloud chỉ cho production. |

---

# 8. KPI & TIÊU CHÍ THÀNH CÔNG

## 8.1. KPI sản phẩm

- Thời gian phát hiện trung bình (MTTD) ≤ 5 phút từ khi xuất hiện khói.
- Tỉ lệ true positive ≥ 90% trên tập kiểm thử thực địa.
- Tỉ lệ false positive ≤ 5% trên 1,000 ảnh ngẫu nhiên không cháy.
- Độ phủ vùng giám sát ≥ 80% diện tích rừng đăng ký.
- Số báo cáo cộng đồng được xử lý trong 30 phút ≥ 95%.

## 8.2. KPI kỹ thuật

- Uptime hệ thống ≥ 99.5% trong tháng vận hành đầu tiên.
- Latency p95 của API < 300ms.
- Test coverage tổng ≥ 70%.
- Số bug nghiêm trọng (P0/P1) sau go-live ≤ 3 trong 30 ngày.

## 8.3. KPI quản lý dự án

- Velocity ổn định sau Sprint 2 (sai lệch ≤ 20% giữa các sprint).
- Số story carry-over qua sprint kế tiếp ≤ 15%.
- 100% milestone đạt đúng hạn hoặc trễ tối đa 1 tuần.

---

# 9. SỬ DỤNG CÔNG CỤ AI - TÓM TẮT

Dự án này tận dụng tối đa các công cụ AI để tăng tốc 3–5 lần ở từng giai đoạn. **Cẩm nang chi tiết** ở file riêng `03_Cam_nang_AI_tools.md`. Phần dưới đây chỉ tóm tắt phân vai trò chính.

| Công cụ | Vai trò chính | Khi nào dùng nhiều nhất |
|---|---|---|
| **Claude** (Sonnet/Opus) | Code agent, refactor, viết test, tài liệu, ADR, debug khó | Mọi sprint — đặc biệt Sprint 2/3, Sprint 6. |
| **GitHub Copilot** | Autocomplete trong IDE, sinh boilerplate, viết unit test | Mọi sprint, mọi developer. |
| **Gemini** (1.5/2.0) | Phân tích ảnh/video lớn (multimodal), tóm tắt PDF spec dài | Sprint 1 (đọc spec), Sprint 3 (review false positive). |
| **Antigravity / Codex CLI** | Agentic coding, chạy task dài hạn (refactor lớn, migration) | Sprint 4–5 khi codebase lớn. |
| **Perplexity** | Tra cứu kỹ thuật mới, so sánh thư viện, tìm reference paper | Sprint 1 (chọn stack), Sprint 3 (model SOTA). |
| **Google AI Studio** | Prototype prompt nhanh, test mô hình Gemini, schema JSON | Khi cần thử nghiệm prompt cho LLM-driven feature. |
| **NotebookLM** | Đọc, hỏi đáp, podcast hoá tài liệu nội bộ + paper nghiên cứu | Onboarding, học bài báo về fire detection, review SRS. |
| **Figma + AI plugin** | Wireframe nhanh, sinh component theo mô tả, export to code | Sprint 1 — thiết kế UX/UI; rải rác khi cần mockup. |
| **Sourcetrail / GraphCode** | Khám phá codebase đã có, hiểu dependency | Khi onboard module mới, refactor lớn. |
| **Obsidian** (+ AI plugin) | Knowledge base cá nhân, ghi chú meeting, link kiến thức | Hằng ngày cho mỗi thành viên. |
| **Docker** | Đóng gói nhất quán, dev = staging = prod | Mọi sprint. |
| **PostgreSQL + PostGIS** | Database chính (quan hệ + GIS + time-series qua TimescaleDB) | Toàn dự án. |

---

# 10. KẾT LUẬN & BƯỚC TIẾP THEO

Dự án phần mềm cháy rừng với 5 nhân sự trong 6 tháng là **khả thi** nếu đội tuân thủ kỷ luật Agile, ưu tiên các tính năng cốt lõi và biết khai thác công cụ AI để tăng tốc. Chìa khoá thành công nằm ở 3 yếu tố:

1. **Sprint 1 phải đặt nền móng vững** (CI/CD, kiến trúc, dataset).
2. **Mô hình AI phải có dataset đủ tốt** và quy trình đánh giá rõ ràng.
3. **Giao tiếp liên tục với người dùng cuối** để tránh xây sai.

## Bước tiếp theo (tuần 1)

- [ ] Họp kick-off với toàn đội — review tài liệu này.
- [ ] Khoá lại scope với stakeholder bằng văn bản (Project Charter).
- [ ] Tạo repo GitHub + Project board, mời 5 thành viên.
- [ ] Phân vai trò chính thức theo bảng Excel kèm theo (`02_Phan_cong_nhan_su.csv`).
- [ ] Đọc cẩm nang AI tools (`03_Cam_nang_AI_tools.md`) và chia sẻ với cả đội.
- [ ] Bắt đầu Sprint 1 ngay đầu tuần 2.

---

*— Hết tài liệu Roadmap —*
