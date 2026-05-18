import os
import time
import json
import random
import paho.mqtt.client as mqtt

# Cấu hình MQTT Broker (Docker localhost)
MQTT_BROKER = "localhost"
MQTT_PORT = 1883

# Danh sách các thiết bị giả lập (Camera hoặc Drone)
DEVICES = [
    {"id": "CAM_001", "base_lat": 21.0285, "base_lon": 105.8048},
    {"id": "CAM_002", "base_lat": 21.0305, "base_lon": 105.8102},
    {"id": "DRONE_001", "base_lat": 21.0412, "base_lon": 105.7950},
    {"id": "DRONE_002", "base_lat": 21.0150, "base_lon": 105.8200}
]

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"✅ Đã kết nối MQTT Broker thành công tại {MQTT_BROKER}:{MQTT_PORT}")
    else:
        print(f"❌ Kết nối MQTT thất bại, mã lỗi: {rc}")

def generate_random_hotspot(device):
    """Tạo dữ liệu cảnh báo cháy ngẫu nhiên xung quanh toạ độ cơ sở của thiết bị"""
    # Xê dịch toạ độ ngẫu nhiên một chút
    lat_offset = random.uniform(-0.01, 0.01)
    lon_offset = random.uniform(-0.01, 0.01)
    
    return {
        "device_id": device["id"],
        "latitude": device["base_lat"] + lat_offset,
        "longitude": device["base_lon"] + lon_offset,
        "confidence": round(random.uniform(70.0, 99.9), 2),  # Tỉ lệ tự tin từ 70% đến 99.9%
        "snapshot_url": f"http://example.com/snapshots/{device['id']}_{int(time.time())}.jpg"
    }

if __name__ == '__main__':
    print("🚀 Khởi động trình giả lập Edge AI (Data Simulator)...")
    
    # Khởi tạo MQTT Client
    client = mqtt.Client(client_id="edge_ai_simulator")
    client.on_connect = on_connect
    
    try:
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
    except Exception as e:
        print(f"❌ Không thể kết nối tới MQTT Broker. Vui lòng đảm bảo Docker stack đang chạy. Chi tiết: {e}")
        exit(1)
        
    client.loop_start() # Chạy loop trong background

    try:
        while True:
            # Chọn ngẫu nhiên một thiết bị để phát hiện cháy
            device = random.choice(DEVICES)
            payload = generate_random_hotspot(device)
            
            # Đẩy lên topic dựa theo device_id
            topic = f"wildfire/alerts/{device['id'].lower()}"
            
            # Publish message
            client.publish(topic, json.dumps(payload))
            print(f"📡 Đã gửi cảnh báo từ {device['id']}: {payload['confidence']}% tự tin cháy.")
            
            # Đợi ngẫu nhiên 5 - 15 giây trước khi gửi tiếp
            sleep_time = random.uniform(5, 15)
            time.sleep(sleep_time)
            
    except KeyboardInterrupt:
        print("\n🛑 Dừng trình giả lập Edge AI.")
    finally:
        client.loop_stop()
        client.disconnect()
