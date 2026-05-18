import os

translations = {
    # General UI / Sidebar
    "IGNIS MONITOR": "HỆ THỐNG GIÁM SÁT CHÁY RỪNG",
    "COMMAND CENTER": "TRUNG TÂM ĐIỀU HÀNH",
    "SECTOR 7-G ACTIVE": "KHU VỰC 7-G (ĐANG HOẠT ĐỘNG)",
    "ISSUE EMERGENCY ALERT": "PHÁT TÍN HIỆU KHẨN CẤP",
    "Overview": "Tổng quan",
    "Live Map": "Bản đồ trực tuyến",
    "Incidents": "Quản lý Sự cố",
    "Analytics": "Thống kê & Báo cáo",
    "System Settings": "Cài đặt hệ thống",
    "Support": "Hỗ trợ",
    "Search coordinates, units...": "Tìm kiếm tọa độ, đơn vị...",
    "Query telemetry data...": "Tra cứu dữ liệu viễn trắc...",
    
    # Dashboard
    "HEATMAP": "BẢN ĐỒ NHIỆT",
    "WIND": "SỨC GIÓ",
    "TERRAIN": "ĐỊA HÌNH",
    "Fire Weather Index": "Chỉ số Thời tiết Cháy (FWI)",
    "Temp": "Nhiệt độ",
    "Wind": "Gió",
    "Humidity": "Độ ẩm",
    "Active Incidents": "Sự cố đang hoạt động",
    "EXTREME": "NGHIÊM TRỌNG",
    "HIGH": "MỨC CAO",
    "LOW": "MỨC THẤP",
    "TOTAL": "TỔNG",

    # Analytics
    "Historical Reports": "Báo cáo Lịch sử",
    "DATA SYNTHESIS & TREND ANALYSIS": "TỔNG HỢP DỮ LIỆU & PHÂN TÍCH XU HƯỚNG",
    "Last 30 Days": "30 Ngày Qua",
    "YTD": "Từ đầu năm",
    "Custom": "Tùy chỉnh",
    "All Regions": "Tất cả Khu vực",
    "Northern Sector": "Khu vực Phía Bắc",
    "Western Ridge": "Sườn Tây",
    "Eastern Valley": "Thung lũng Phía Đông",
    "All Causes": "Tất cả Nguyên nhân",
    "Lightning Strike": "Sét đánh",
    "Human Activity": "Hoạt động con người",
    "Equipment Failure": "Lỗi thiết bị",
    "EXPORT CSV": "XUẤT FILE CSV",
    "TOTAL INCIDENTS": "TỔNG SỐ SỰ CỐ",
    "ACRES AFFECTED": "DIỆN TÍCH ẢNH HƯỞNG (HA)",
    "AVG CONTAINMENT": "T/G KHỐNG CHẾ TB",
    "ACTIVE SENSORS": "CẢM BIẾN HOẠT ĐỘNG",
    "vs last month": "so với tháng trước",
    "Stable": "Ổn định",
    "improvement": "cải thiện",
    "operational": "đang hoạt động",
    "Hotspot Frequency Trends": "Biểu đồ Tần suất Điểm cháy",
    "30-Day trailing thermal anomalies detected.": "Biến động cảnh báo nhiệt trong 30 ngày qua.",
    "Damage by Land Type": "Thiệt hại theo Loại đất",
    "Distribution of affected zones.": "Phân bổ các khu vực bị ảnh hưởng.",
    "Forest Canopy": "Tán rừng",
    "Grassland/Scrub": "Đồng cỏ/Bụi rậm",
    "Residential Proximity": "Gần khu dân cư",
    "YoY Severity Index": "Chỉ số Mức độ nghiêm trọng (YoY)",
    "Current year vs historical avg.": "Năm nay so với trung bình lịch sử.",
    "Recent Telemetry Anomalies": "Các điểm cháy và bất thường gần đây",
    "VIEW ALL": "XEM TẤT CẢ",
    "TIMESTAMP (UTC)": "THỜI GIAN",
    "COORDINATES": "TỌA ĐỘ (X, Y)",
    "CONFIDENCE": "ĐỘ TIN CẬY",
    "STATUS": "TRẠNG THÁI",
    "CRITICAL": "NGUY HIỂM",
    "WARNING": "CẢNH BÁO",
    "INVESTIGATING": "ĐANG XÁC MINH",
    "CLEARED": "ĐÃ XỬ LÝ",

    # Incidents
    "Incident Management": "Quản lý Sự cố",
    "ACTIVE RESPONSE & RESOURCE DEPLOYMENT": "PHẢN ỨNG NHANH & ĐIỀU PHỐI NGUỒN LỰC",
    "Active (8)": "Đang xử lý (8)",
    "Contained (3)": "Đã khống chế (3)",
    "Patrol (2)": "Tuần tra (2)",
    "Filter By": "Lọc theo",
    "INCIDENT ID": "MÃ SỰ CỐ",
    "SEVERITY": "MỨC ĐỘ",
    "LOCATION": "VỊ TRÍ",
    "RESOURCES": "NGUỒN LỰC",
    "INCIDENT DETAILS": "CHI TIẾT SỰ CỐ",
    "STATUS:": "TRẠNG THÁI:",
    "COMMANDER:": "CHỈ HUY:",
    "EST. CONTAINMENT:": "DỰ KIẾN KHỐNG CHẾ:",
    "WEATHER CONDITIONS": "ĐIỀU KIỆN THỜI TIẾT",
    "DEPLOYED RESOURCES": "NGUỒN LỰC ĐÃ ĐIỀU ĐỘNG",
    "Air Tankers": "Trực thăng/Máy bay",
    "Ground Crews": "Đội tuần tra bộ",
    "Bulldozers": "Xe ủi đất",
    "Engines": "Xe chữa cháy",
    "ACTION LOG": "NHẬT KÝ HÀNH ĐỘNG",
    "Fire retardant drop successful on Sector 4": "Thả chất làm chậm cháy thành công tại Khu 4",
    "Ground crew Bravo reached containment line": "Đội Bravo tiếp cận tuyến phòng lửa",
    "Incident upgraded to Critical": "Mức độ sự cố nâng lên Nguy hiểm",
    "ADD LOG ENTRY": "THÊM NHẬT KÝ",
    "REQUEST AIR SUPPORT": "YÊU CẦU TRỰC THĂNG",
    "DISPATCH CREW": "ĐIỀU ĐỘNG ĐỘI",

    # Map
    "Satellite Topography Map": "Bản đồ Địa hình Vệ tinh",
    "TOPOGRAPHICAL & THERMAL DATA": "DỮ LIỆU ĐỊA HÌNH & NHIỆT ĐỘ",
    "MAP LAYERS": "LỚP BẢN ĐỒ",
    "Satellite Imagery": "Ảnh vệ tinh",
    "Topographic": "Địa hình",
    "Thermal (IR)": "Nhiệt hồng ngoại",
    "Vegetation (NDVI)": "Thảm thực vật (NDVI)",
    "Wind Vectors": "Hướng gió",
    "Active Fires": "Đám cháy",
    "Fire Perimeters": "Vành đai cháy",
    "Sensor Network": "Mạng lưới cảm biến",
    "Water Sources": "Nguồn nước",
    "Evacuation Routes": "Tuyến sơ tán",
    "SELECTED ENTITY": "ĐỐI TƯỢNG ĐƯỢC CHỌN",
    "THERMAL ANOMALY": "ĐIỂM NÓNG BẤT THƯỜNG",
    "ID:": "MÃ:",
    "DETECTED:": "PHÁT HIỆN:",
    "CONFIDENCE:": "ĐỘ TIN CẬY:",
    "COORD:": "TỌA ĐỘ:",
    "INTENSITY:": "CƯỜNG ĐỘ:",
    "SPREAD RATE:": "TỐC ĐỘ LAN:",
    "DISPATCH UNITS": "ĐIỀU ĐỘNG LỰC LƯỢNG",
    "TRACK MOVEMENT": "THEO DÕI DI CHUYỂN"
}

html_files = ["dashboard.html", "analytic.html", "map.html", "incidents.html"]
base_dir = r"d:\workspace\workspace\dev\projects\estec-wildfire-code\estec---wildfire---code\frontend-code"

for file in html_files:
    file_path = os.path.join(base_dir, file)
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        for eng, vie in translations.items():
            content = content.replace(eng, vie)
            
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Translated {file}")
