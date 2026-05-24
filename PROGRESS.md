# Tiến độ triển khai — Wildfire Alert System

> Cập nhật lần cuối: 2026-05-23  
> Branch: `develop`  
> Stack: React + Vite + TypeScript + Tailwind + MapLibre GL (frontend) | FastAPI (backend)

---

## Pages & Routes hiện tại

| Route | File | Trạng thái |
|---|---|---|
| `/login` | `Login.tsx` | ✅ JWT auth |
| `/dashboard` | `Dashboard.tsx` | ✅ Stats API + incidents gần đây + quick actions |
| `/map` | `MapPage.tsx` | ✅ 3 basemaps, 6 layers, goto/measure/draw/heatmap/bookmark, click popup |
| `/incidents` | `Incidents.tsx` | ✅ List + filter + update status realtime |
| `/hotspots` | `Hotspots.tsx` | ✅ Table + search/filter |
| `/analytics` | `Analytics.tsx` | ✅ Recharts: bar/pie/area |
| `/users` | `Users.tsx` | ✅ CRUD admin + toggle active |
| `/profile` | `Profile.tsx` | ✅ Tab thông tin + tab đổi mật khẩu |
| `/aor` | `AOR.tsx` | ✅ Gán địa bàn huyện/xã/tiểu khu cho kiểm lâm (admin) |
| `/audit-log` | `AuditLog.tsx` | ✅ Nhật ký kiểm toán, filter theo loại |
| `/bulletins` | `Bulletins.tsx` | ✅ Bảng tin CRUD, pin/unpin |
| `/search` | `Search.tsx` | ✅ Tìm kiếm đa thuộc tính nâng cao |

---

## 38 Modules — Trạng thái chi tiết

### I. Bản đồ & GIS

| # | Module | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | Hiển thị bản đồ đa lớp | ✅ Hoàn thành | MapLibre GL, 3 basemaps, OSM/Satellite/Topo |
| 2 | Quản lý & tùy chỉnh hiển thị lớp | ✅ Hoàn thành | Panel bật/tắt từng layer, icon + label |
| 3 | Truy vấn thông tin thuộc tính (click popup) | ✅ Hoàn thành | Click hotspot/incident → popup + link xem danh sách |
| 4 | Công cụ điều hướng bản đồ | ✅ Hoàn thành | GoTo tọa độ, Bookmark lưu LocalStorage, Compass |
| 5 | Công cụ vẽ và đo đạc | ✅ Hoàn thành | Vẽ điểm/đường/vùng, đo geodesic, export GeoJSON |
| 6 | Định vị GPS & dẫn đường (Mobile) | ❌ Chưa làm | Dành cho mobile app kiểm lâm |
| 7 | Bản đồ ngoại tuyến Offline Maps | ❌ Chưa làm | Dành cho mobile app kiểm lâm |
| 8 | Import Shapefile/GeoJSON/KML | ✅ Hoàn thành | Upload/kéo thả → parse client-side → layer tạm trên bản đồ |

### II. Quản trị & Bảo mật

| # | Module | Trạng thái | Ghi chú |
|---|---|---|---|
| 9 | Quản lý người dùng & RBAC | ✅ Hoàn thành | `/users` — CRUD, role, toggle active |
| 10 | Quản lý địa bàn phụ trách (AOR) | ✅ Hoàn thành | `/aor` — gán huyện/xã/tiểu khu cho ranger, lưu localStorage |
| 11 | Thông tin cá nhân | ✅ Hoàn thành | `/profile` — xem, sửa, ảnh đại diện |
| 12 | Đặt lại mật khẩu qua OTP/Email | ✅ Hoàn thành | `/forgot-password` — 3 bước: nhập account → OTP → mật khẩu mới |
| 13 | Cấu hình kênh thông báo | ✅ Hoàn thành | Tab "Thông báo" trong /profile — kênh, mức độ, sự kiện, lưu localStorage |
| 14 | Audit Log — nhật ký kiểm toán | ✅ Hoàn thành | `/audit-log` — immutable log + filter |

### III. Cảnh báo & Xử lý sự vụ

| # | Module | Trạng thái | Ghi chú |
|---|---|---|---|
| 15 | Dashboard cảnh báo realtime | ✅ Hoàn thành | `/dashboard` + NotificationBell polling |
| 16 | Giao nhiệm vụ xác minh | ✅ Hoàn thành | Assign ranger + deadline từ incident |
| 17 | Theo dõi & cập nhật trạng thái | ✅ Hoàn thành | `/incidents` — workflow status |
| 18 | Đồng bộ nhiệm vụ Mobile (Offline-first) | ❌ Chưa làm | Dành cho mobile app |
| 19 | Báo cáo hiện trường đa phương tiện | ❌ Chưa làm | Ảnh/video + geotag |
| 20 | Tạo sự vụ từ hiện trường | ❌ Chưa làm | Mobile form |
| 21 | Bộ lọc & sắp xếp cảnh báo | ✅ Hoàn thành | Filter trên incidents và hotspots |
| 22 | Lưu trữ & tra cứu lịch sử | ✅ Hoàn thành | Hotspots.tsx + date filter |
| 23 | Tìm kiếm nâng cao đa thuộc tính | ✅ Hoàn thành | `/search` — full-text + spatial |
| 24 | Liên kết cảnh báo liên quan (clustering) | ✅ Hoàn thành | MapLibre cluster source — gom cụm theo maxConf, click expand, toggle on/off, legend |
| 25 | Bảng tin / Thông báo chung | ✅ Hoàn thành | `/bulletins` — CRUD + pin |

### IV. Thống kê & Báo cáo

| # | Module | Trạng thái | Ghi chú |
|---|---|---|---|
| 26 | Tự động kết xuất báo cáo PDF/Excel | ✅ Hoàn thành | Backend scheduler + template engine |
| 27 | Dashboard thống kê trực quan | ✅ Hoàn thành | `/analytics` — bar/pie/area charts |
| 28 | Xuất dữ liệu CSV/XLSX/GeoJSON | ✅ Hoàn thành | Export button trên các trang list |
| 29 | Dashboard hiệu suất cá nhân (KPI) | ✅ Hoàn thành | `/performance` — KPI cards, charts, leaderboard (admin) |
| 30 | Time-lapse (video biến đổi rừng) | ❌ Chưa làm | Image sequencing |
| 31 | Hướng dẫn sử dụng / FAQ | ✅ Hoàn thành | `/faq` — search, categories, accordion Q&A, quick links |
| 32 | Đa ngôn ngữ (i18n) | ✅ Hoàn thành | VI/EN switch — i18next, LangSwitcher, dịch toàn bộ pages: Login/Dashboard/Incidents/Hotspots/Analytics + Sidebar/Layout |

### V. AI & Viễn thám

| # | Module | Trạng thái | Ghi chú |
|---|---|---|---|
| 33 | Thu thập ảnh vệ tinh tự động | ❌ Chưa làm | Sentinel/Landsat pipeline |
| 34 | Phân tích phát hiện biến động | ❌ Chưa làm | NDVI/NBR temporal differencing |
| 35 | AI so sánh ảnh (CNN/Transformer) | ❌ Chưa làm | Change detection model |
| 36 | Khoanh vùng & gán độ tin cậy (AI) | ❌ Chưa làm | Auto-segmentation + human-in-the-loop |
| 37 | Phân tích điểm nóng — Hotspot Analysis | ✅ Hoàn thành | KDE heatmap trong `/map` + bộ điều chỉnh |
| 38 | Cung cấp API tích hợp hệ thống | ❌ Chưa làm | OpenAPI + webhook + rate limit |

---

## Tóm tắt

| Nhóm | Tổng | Hoàn thành | Còn lại |
|---|---|---|---|
| Bản đồ & GIS | 8 | 5 | 3 |
| Quản trị & Bảo mật | 6 | 4 | 2 |
| Cảnh báo & Xử lý | 11 | 8 | 3 |
| Thống kê & Báo cáo | 7 | 6 | 1 |
| AI & Viễn thám | 6 | 1 | 5 |
| **Tổng** | **38** | **24** | **14** |

---

## Ưu tiên tiếp theo (web app)

✅ Tất cả module web ưu tiên đã hoàn thành!

**Còn tiềm năng mở rộng:**
- Module 30 — Time-lapse video biến đổi rừng (phụ thuộc dữ liệu ảnh)
- Module 38 — OpenAPI docs / webhook integration
- Hoàn thiện i18n cho các pages còn lại: Users, Profile, AuditLog, Bulletins, Search, AOR, Performance

## Không ưu tiên (mobile/AI)

- Modules 6, 7, 18–20: Dành cho mobile app kiểm lâm (ngoài scope web)
- Modules 33–36: AI/satellite — phụ thuộc backend ML pipeline
- Module 38: API integration — phụ thuộc yêu cầu bên thứ ba

---

## Cấu trúc key files

```
frontend-app/src/
├── pages/
│   ├── Dashboard.tsx    — realtime stats + notifications
│   ├── MapPage.tsx      — MapLibre + tools + click popup
│   ├── Incidents.tsx    — list + filter + status update
│   ├── Hotspots.tsx     — table + search
│   ├── Analytics.tsx    — recharts
│   ├── Users.tsx        — admin CRUD
│   ├── Profile.tsx      — profile + change password
│   ├── AuditLog.tsx     — immutable log viewer
│   ├── Bulletins.tsx    — broadcast messages
│   └── Search.tsx       — advanced search
├── components/
│   ├── Layout.tsx       — header + NotificationBell
│   ├── Sidebar.tsx      — nav links
│   └── NotificationBell.tsx — polling /api/hotspots 30s
└── api/
    ├── client.ts        — baseURL /api/v1 (JWT required)
    └── dataClient.ts    — baseURL /api (public data)

backend_api/
├── main.py              — legacy /api/... endpoints
└── app/                 — /api/v1/... endpoints (FastAPI)
```
