import requests
import json
import time

# --- CẤU HÌNH ---
GEOSERVER_URL = "http://localhost:8080/geoserver/rest"
AUTH = ('admin', 'admin') # Mặc định GeoServer user/pass
HEADERS_JSON = {'Content-type': 'application/json'}
HEADERS_XML = {'Content-type': 'text/xml'}

WORKSPACE = "wildfire_ws"
DATASTORE = "wildfire_postgis"

# Lưu ý: Script này chạy ở ngoài host (máy bạn), nhưng gọi REST API GeoServer để bảo GeoServer 
# (bên trong Docker) kết nối tới PostGIS (cũng bên trong Docker). 
# Do đó host ở đây phải là tên container: "db", và port nội bộ: "5432".
DB_HOST = "db" 
DB_PORT = "5432" 
DB_NAME = "wildfire_db"
DB_USER = "wildfire_admin"
DB_PASS = "wildfire_password"
# ---------------

def wait_for_geoserver():
    print("⏳ Đang chờ GeoServer khởi động hoàn tất (có thể mất 15-30 giây)...")
    for _ in range(30):
        try:
            r = requests.get(f"{GEOSERVER_URL}/workspaces", auth=AUTH)
            if r.status_code == 200:
                print("✅ GeoServer đã sẵn sàng!")
                return True
        except requests.exceptions.ConnectionError:
            pass
        time.sleep(2)
    print("❌ Lỗi: GeoServer không phản hồi trong thời gian chờ.")
    return False

def create_workspace():
    print(f"⏳ Đang tạo Workspace '{WORKSPACE}'...")
    url = f"{GEOSERVER_URL}/workspaces"
    data = {
        "workspace": {
            "name": WORKSPACE
        }
    }
    r = requests.post(url, auth=AUTH, headers=HEADERS_JSON, data=json.dumps(data))
    if r.status_code == 201:
        print(f"✅ Tạo thành công Workspace '{WORKSPACE}'.")
    else:
        # Kiểm tra xem đã tồn tại chưa
        check = requests.get(f"{url}/{WORKSPACE}", auth=AUTH)
        if check.status_code == 200:
            print(f"ℹ️ Workspace '{WORKSPACE}' đã tồn tại.")
        else:
            print(f"❌ Lỗi tạo Workspace: {r.status_code} - {r.text}")

def create_datastore():
    print(f"⏳ Đang cấu hình kết nối PostGIS DataStore '{DATASTORE}'...")
    url = f"{GEOSERVER_URL}/workspaces/{WORKSPACE}/datastores"
    xml_data = f"""<dataStore>
  <name>{DATASTORE}</name>
  <connectionParameters>
    <entry key="dbtype">postgis</entry>
    <entry key="host">{DB_HOST}</entry>
    <entry key="port">{DB_PORT}</entry>
    <entry key="database">{DB_NAME}</entry>
    <entry key="user">{DB_USER}</entry>
    <entry key="passwd">{DB_PASS}</entry>
    <entry key="Expose primary keys">true</entry>
  </connectionParameters>
</dataStore>"""
    r = requests.post(url, auth=AUTH, headers=HEADERS_XML, data=xml_data)
    if r.status_code == 201:
        print(f"✅ Tạo thành công DataStore '{DATASTORE}'.")
    else:
        check = requests.get(f"{url}/{DATASTORE}", auth=AUTH)
        if check.status_code == 200:
            print(f"ℹ️ DataStore '{DATASTORE}' đã tồn tại.")
        else:
            print(f"❌ Lỗi tạo DataStore: {r.status_code} - {r.text}")

def publish_layer(layer_name):
    print(f"⏳ Đang publish bảng '{layer_name}' thành lớp bản đồ (Map Layer)...")
    url = f"{GEOSERVER_URL}/workspaces/{WORKSPACE}/datastores/{DATASTORE}/featuretypes"
    xml_data = f"""<featureType>
  <name>{layer_name}</name>
  <nativeName>{layer_name}</nativeName>
  <title>Bản đồ Cảnh báo cháy rừng - {layer_name}</title>
  <srs>EPSG:4326</srs>
  <projectionPolicy>FORCE_DECLARED</projectionPolicy>
</featureType>"""
    r = requests.post(url, auth=AUTH, headers=HEADERS_XML, data=xml_data)
    if r.status_code == 201:
        print(f"✅ Publish thành công layer '{layer_name}'.")
    else:
        check = requests.get(f"{url}/{layer_name}", auth=AUTH)
        if check.status_code == 200:
            print(f"ℹ️ Layer '{layer_name}' đã được publish trước đó.")
        else:
            print(f"❌ Lỗi publish layer: {r.status_code} - {r.text}")

if __name__ == "__main__":
    print("-" * 50)
    print("🚀 BẮT ĐẦU CẤU HÌNH GEOSERVER QUA REST API 🚀")
    print("-" * 50)
    if wait_for_geoserver():
        create_workspace()
        create_datastore()
        publish_layer("hotspots")
        print("-" * 50)
        print("🎉 HOÀN TẤT CẤU HÌNH! GeoServer đã sẵn sàng phục vụ bản đồ.")
        print("-" * 50)
