import os
import json
import time
import psycopg2
import paho.mqtt.client as mqtt

# Cấu hình Database từ biến môi trường
DB_HOST = os.getenv('DB_HOST', 'db')
DB_PORT = os.getenv('DB_PORT', '5432')
DB_NAME = os.getenv('DB_NAME', 'wildfire_db')
DB_USER = os.getenv('DB_USER', 'wildfire_admin')
DB_PASS = os.getenv('DB_PASSWORD', 'wildfire_password')

# Cấu hình MQTT từ biến môi trường
MQTT_BROKER = os.getenv('MQTT_BROKER', 'mqtt')
MQTT_PORT = int(os.getenv('MQTT_PORT', 1883))
MQTT_TOPIC = os.getenv('MQTT_TOPIC', 'wildfire/alerts/#')

def get_db_connection():
    while True:
        try:
            conn = psycopg2.connect(
                host=DB_HOST,
                port=DB_PORT,
                database=DB_NAME,
                user=DB_USER,
                password=DB_PASS
            )
            print("Đã kết nối thành công tới PostGIS.")
            return conn
        except psycopg2.OperationalError as e:
            print(f"Chưa thể kết nối tới DB, thử lại sau 5 giây... Lỗi: {e}")
            time.sleep(5)

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"Đã kết nối MQTT Broker thành công tại {MQTT_BROKER}:{MQTT_PORT}")
        client.subscribe(MQTT_TOPIC)
        print(f"Đã đăng ký (subscribe) topic: {MQTT_TOPIC}")
    else:
        print(f"Kết nối MQTT thất bại, mã lỗi: {rc}")

def on_message(client, userdata, msg):
    print(f"Nhận được tin nhắn từ topic {msg.topic}: {msg.payload.decode('utf-8')}")
    conn = None
    try:
        # Phân tích JSON payload
        data = json.loads(msg.payload.decode('utf-8'))
        device_id = data.get('device_id')
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        confidence = data.get('confidence', 0.0)
        snapshot_url = data.get('snapshot_url', '')

        if not all([device_id, latitude, longitude]):
            print("Payload bị thiếu thông tin bắt buộc (device_id, latitude, longitude). Bỏ qua.")
            return

        # Lưu vào Database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        insert_query = """
            INSERT INTO hotspots (device_id, confidence_score, geom, snapshot_url)
            VALUES (%s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326), %s)
        """
        cursor.execute(insert_query, (device_id, confidence, longitude, latitude, snapshot_url))
        conn.commit()
        cursor.close()
        print(f"✅ Đã lưu cảnh báo cháy từ {device_id} vào cơ sở dữ liệu.")
        
    except json.JSONDecodeError:
        print("Lỗi: Payload không phải là định dạng JSON hợp lệ.")
    except Exception as e:
        print(f"Lỗi khi xử lý tin nhắn: {e}")
    finally:
        if conn is not None:
            conn.close()

if __name__ == '__main__':
    print("Bắt đầu khởi động Data Ingestion Worker...")
    
    # Khởi tạo MQTT Client
    client = mqtt.Client(client_id="ingestion_worker")
    client.on_connect = on_connect
    client.on_message = on_message

    # Chờ MQTT broker khởi động (trong môi trường docker-compose)
    connected = False
    while not connected:
        try:
            client.connect(MQTT_BROKER, MQTT_PORT, 60)
            connected = True
        except Exception as e:
            print(f"Không thể kết nối tới MQTT Broker ({MQTT_BROKER}:{MQTT_PORT}), thử lại sau 5s... Lỗi: {e}")
            time.sleep(5)

    # Chạy vòng lặp lắng nghe vô hạn
    client.loop_forever()
