# Wildfire System - Docker Deployment Architecture (Edge AI Integration)

Sơ đồ dưới đây mô tả kiến trúc triển khai thực tế (Physical/Deployment Architecture) của hệ thống quản lý cháy rừng. **Đặc biệt, toàn bộ quá trình xử lý AI (nhận diện cháy) được đẩy xuống thiết bị biên (Edge Computing)** nhằm giảm tải băng thông và độ trễ. Máy chủ trung tâm chỉ đóng vai trò thu thập siêu dữ liệu (metadata), lưu trữ, GIS và hiển thị giao diện.

```mermaid
graph TD
    %% Edge AI Layer
    subgraph "Edge Computing Layer (Xử lý AI tại biên)"
        Camera["📹 Camera / Drone (IoT Sensor)"]
        EdgeNode["🧠 Edge AI Node<br/>(Jetson/NPU - Chạy Model AI Nhận diện cháy)"]
    end

    subgraph "Public Network / Internet"
        Users["👥 Users (Web/Mobile App)"]
        ExternalData["🛰️ External Data Sources<br/>(NASA/Landsat)"]
        Developer["👨‍💻 Developer / DevOps"]
    end

    subgraph "CI/CD Pipeline & Registry"
        GitRepo["🐙 Git Repository"]
        CICD["🤖 CI/CD Runner"]
        Registry["🐳 Docker Registry"]
    end

    subgraph "Docker Host (Central Cloud Server)"
        
        %% Reverse Proxy Network
        subgraph "Frontend & Gateway Network"
            Nginx["🌐 Nginx / Traefik Container<br/>(Reverse Proxy, SSL, Load Balancer)"]
            WebUI["🖥️ Web App Container<br/>(React/Vue - Giao diện người dùng)"]
        end

        %% Application Network
        subgraph "Application Services Network"
            BackendAPI["⚙️ Backend API Container<br/>(Xử lý nghiệp vụ, Phục vụ dữ liệu)"]
            Ingestion["📥 Ingestion / Worker Container<br/>(Nhận Data từ Edge & Đồng bộ External)"]
        end

        %% GIS Network
        subgraph "GIS Service Layer"
            GeoServer["🗺️ GeoServer Container<br/>(Map Services: WMS, WFS)"]
        end

        %% Data Network
        subgraph "Data Storage & Cache Layer"
            PostGIS["🐘 PostgreSQL + PostGIS Container<br/>(Cơ sở dữ liệu không gian)"]
            Redis["🔴 Redis / MQTT Broker Container<br/>(Message Queue & Nhận Data thời gian thực)"]
        end
        
        %% Monitoring Network
        subgraph "Monitoring & Logging Layer"
            Prometheus["📈 Prometheus Container"]
            Grafana["📊 Grafana Container"]
            Cadvisor["🐳 cAdvisor Container"]
        end

        %% Docker Volumes
        subgraph "Docker Persistent Volumes"
            GeoDataVol[("📁 GeoData Volume")]
            DBDataVol[("💾 Database Volume")]
            PrometheusVol[("📉 Prometheus Volume")]
        end
    end

    %% Edge AI Flow
    Camera -- "Stream Video / Hình ảnh gốc" --> EdgeNode
    ExternalData -. "Tải ảnh vệ tinh (Tùy chọn)" .-> EdgeNode
    EdgeNode -- "Gửi cảnh báo & Tọa độ cháy (MQTT/REST)" --> Nginx

    %% CI/CD Flow
    Developer -- "Push Code" --> GitRepo
    GitRepo -- "Trigger Build" --> CICD
    CICD -- "Build & Push Image" --> Registry
    Registry -. "Pull Images" .-> Nginx
    Registry -. "Pull Images" .-> WebUI
    Registry -. "Pull Images" .-> BackendAPI
    Registry -. "Pull Images" .-> Ingestion

    %% External Connections
    Users -- "HTTPS (443)" --> Nginx
    Ingestion -- "Fetch API/FTP" --> ExternalData

    %% Proxy Routing (Internal network)
    Nginx -- "/ (Static Files)" --> WebUI
    Nginx -- "/api" --> BackendAPI
    Nginx -- "/edge-ingest (hoặc Port 1883)" --> Ingestion
    Nginx -- "/geoserver" --> GeoServer
    Nginx -- "/grafana" --> Grafana

    %% App to App / DB
    WebUI -. "Gọi API" .-> BackendAPI
    WebUI -. "Tải bản đồ" .-> GeoServer
    
    BackendAPI -- "Read/Write Data" --> PostGIS
    BackendAPI -- "Publish Jobs/Cache" --> Redis
    BackendAPI -- "Cấu hình tự động" --> GeoServer

    %% Ingestion to DB, MQ & Storage
    Ingestion -- "Consume MQTT Queue / HTTP" --> Redis
    Ingestion -- "Lưu siêu dữ liệu cháy" --> PostGIS
    Ingestion -. "Lưu ảnh chụp từ Edge" .-> GeoDataVol

    %% GIS to DB & Storage
    GeoServer -- "Query Spatial Data" --> PostGIS
    GeoServer -. "Mount & Read" .-> GeoDataVol
    
    %% Database Persistence
    PostGIS -. "Mount & Persist" .-> DBDataVol
    Prometheus -. "Mount & Persist" .-> PrometheusVol

    %% Monitoring Flow
    Prometheus -- "Scrape Metrics" --> Cadvisor
    Prometheus -- "Scrape Metrics" --> BackendAPI
    Prometheus -- "Scrape Metrics" --> PostGIS
    Grafana -- "Query Data" --> Prometheus

    %% Styling
    classDef container fill:#e1f5fe,stroke:#0288d1,stroke-width:2px,color:#000
    classDef database fill:#f1f8e9,stroke:#689f38,stroke-width:2px,color:#000
    classDef proxy fill:#fff3e0,stroke:#f57c00,stroke-width:2px,color:#000
    classDef external fill:#f3e5f5,stroke:#8e24aa,stroke-width:2px,color:#000
    classDef volume fill:#eceff1,stroke:#607d8b,stroke-width:2px,color:#000
    classDef monitor fill:#fff9c4,stroke:#fbc02d,stroke-width:2px,color:#000
    classDef cicd fill:#e8eaf6,stroke:#3f51b5,stroke-width:2px,color:#000
    classDef edge fill:#ffe0b2,stroke:#ef6c00,stroke-width:2px,color:#000
    
    class WebUI,BackendAPI,Ingestion,GeoServer container
    class PostGIS,Redis database
    class Nginx proxy
    class Users,ExternalData,Developer external
    class GeoDataVol,DBDataVol,PrometheusVol volume
    class Prometheus,Grafana,Cadvisor monitor
    class GitRepo,CICD,Registry cicd
    class Camera,EdgeNode edge
```

### 📋 Chi tiết các thành phần và tương tác (Docker Level):

#### 1. Lớp Edge Computing (Xử lý AI tại biên)
Trong kiến trúc mới, máy chủ trung tâm (Central Server) được giải phóng hoàn toàn khỏi các tác vụ chạy Model AI tốn kém tài nguyên.
- **Edge AI Node**: Là các thiết bị biên (ví dụ: NVIDIA Jetson Nano, Xavier hoặc NPU trên Camera).
  - Trực tiếp nhận luồng dữ liệu thô (Video stream, hình ảnh liên tục) từ **Camera/Drone**.
  - Chạy mô hình AI (Deep Learning, Computer Vision) ngay tại bìa rừng/trạm kiểm lâm để phát hiện khói và lửa.
  - Khi phát hiện cháy, thiết bị chỉ gửi **Siêu dữ liệu (Metadata)** bao gồm: tọa độ điểm cháy, thời gian, mức độ tin cậy (confidence score) và 1 bức ảnh chụp khung hình cháy (snapshot) về máy chủ trung tâm thông qua băng thông hẹp.

#### 2. Lớp Cổng Giao Tiếp Trung Tâm (Reverse Proxy)
- **Nginx / Traefik Container**: 
  - Phân luồng cho người dùng (vào giao diện, xem bản đồ).
  - Đồng thời mở cổng tiếp nhận dữ liệu từ Edge Devices truyền về (thường qua API `/edge-ingest` hoặc định tuyến port MQTT `1883`).

#### 3. Lớp Dịch vụ Ứng dụng & Đồng bộ (Application Layer)
- **Ingestion Container (Thay thế Worker xử lý AI cũ)**: 
  - Nhiệm vụ bây giờ rất nhẹ: Nhận tín hiệu cảnh báo từ Edge Node, xác thực dữ liệu.
  - Lưu ảnh snapshot vào `GeoDataVol`.
  - Ghi nhận tọa độ vào **PostGIS**.
  - Đồng bộ thêm dữ liệu thời tiết hoặc ảnh tĩnh từ NASA nếu cần thiết, chứ KHÔNG nhận diện ảnh.
- **Backend API Container**: Cung cấp API cho hệ thống Web quản lý cháy rừng (Xem danh sách điểm cháy, quản lý người dùng, xuất báo cáo).
- **Web App Container**: Chứa Frontend tĩnh (React/Vue).

#### 4. Lớp GIS (Bản đồ)
- **GeoServer Container**: Đọc tọa độ từ PostGIS (điểm cháy do Edge Node gửi lên) và Polygon (các vùng rừng) để kết xuất thành bản đồ WMS/WFS phục vụ theo dõi trực quan cho Frontend. 

#### 5. Lớp Dữ liệu (Stateful Containers)
- **PostGIS**: Chứa dữ liệu không gian cốt lõi.
- **Redis / MQTT Broker**: Do các thiết bị ở xa gửi cảnh báo bất chợt, việc sử dụng kiến trúc Message Queue (Kafka/RabbitMQ hoặc Mosquitto MQTT) giúp hệ thống trung tâm nhận và xử lý cảnh báo mượt mà, không bị sót khi có lượng lớn request đồng thời (Ví dụ: 1000 camera cùng gửi log lỗi).

#### 6. Lớp Giám Sát & CI/CD
- **Prometheus & Grafana**: Theo dõi RAM/CPU của Server trung tâm.
- Hệ thống CI/CD quản lý việc đẩy code và build Docker images mỗi khi có cập nhật, đảm bảo triển khai không downtime.

