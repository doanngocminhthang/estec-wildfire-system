"""
Fire alert email service. Ported from HoanVo project's notification.py.
"""
import logging
import os
import smtplib
from email.mime.image import MIMEImage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

logger = logging.getLogger(__name__)


_COMPASS_24 = [
    "Bắc", "Bắc Đông Bắc", "Đông Bắc", "Đông Đông Bắc",
    "Đông", "Đông Đông Nam", "Đông Nam", "Nam Đông Nam",
    "Nam", "Nam Tây Nam", "Tây Nam", "Tây Tây Nam",
    "Tây", "Tây Tây Bắc", "Tây Bắc", "Bắc Tây Bắc",
]


def _compass_name(degrees: float) -> str:
    idx = int((degrees % 360 + 7.5) // 15) % 16
    return _COMPASS_24[idx]


def send_fire_alert_email(
    smtp_host: str,
    smtp_port: int,
    sender_email: str,
    sender_password: str,
    receiver_emails: list[str],
    detection_id: int,
    station_code: str,
    detected_at_str: str,
    fire_lon: Optional[float],
    fire_lat: Optional[float],
    azimuth_deg: Optional[float],
    distance_m: Optional[float],
    elevation_m: Optional[float],
    slope_deg: Optional[float],
    aspect_deg: Optional[float],
    commune: Optional[str],
    district: Optional[str],
    province: Optional[str],
    confidence: float,
    snapshot_path: Optional[str] = None,
) -> bool:
    """Send a fire alert email. Returns True on success."""
    if not sender_email or not sender_password or not receiver_emails:
        logger.warning("Email alert skipped: SMTP credentials not configured")
        return False

    try:
        direction = _compass_name(azimuth_deg) if azimuth_deg is not None else "không xác định"
        location_parts = [x for x in [commune, district, province] if x]
        location_str = ", ".join(location_parts) if location_parts else "chưa xác định"
        dist_str = f"{distance_m:.0f} m" if distance_m else "chưa xác định"
        elev_str = f"{elevation_m:.0f} m" if elevation_m else "chưa xác định"

        subject = f"🔥 CẢNH BÁO CHÁY RỪNG #{detection_id} — Trạm {station_code}"
        body = f"""
<h2>PHÁT HIỆN CHÁY RỪNG #{detection_id}</h2>
<table border="0" cellpadding="6" style="font-family:sans-serif">
  <tr><td><b>Trạm phát hiện</b></td><td>{station_code}</td></tr>
  <tr><td><b>Thời gian</b></td><td>{detected_at_str}</td></tr>
  <tr><td><b>Độ tin cậy AI</b></td><td>{confidence*100:.1f}%</td></tr>
  <tr><td><b>Tọa độ đám cháy</b></td><td>{fire_lat:.5f}°N, {fire_lon:.5f}°E</td></tr>
  <tr><td><b>Vị trí hành chính</b></td><td>{location_str}</td></tr>
  <tr><td><b>Hướng so với trạm</b></td><td>{direction} ({azimuth_deg:.0f}°)</td></tr>
  <tr><td><b>Khoảng cách từ trạm</b></td><td>{dist_str}</td></tr>
  <tr><td><b>Độ cao địa hình</b></td><td>{elev_str}</td></tr>
  <tr><td><b>Độ dốc</b></td><td>{slope_deg:.1f}°</td></tr>
</table>
{"<br><img src='cid:fire_image'>" if snapshot_path and os.path.exists(snapshot_path) else ""}
<p style="color:#888;font-size:12px">Email tự động từ Hệ thống Phòng cháy chữa cháy rừng Thanh Hóa</p>
"""
        msg = MIMEMultipart("related")
        msg["From"] = sender_email
        msg["To"] = ", ".join(receiver_emails)
        msg["Subject"] = subject

        alt = MIMEMultipart("alternative")
        msg.attach(alt)
        alt.attach(MIMEText(body, "html"))

        if snapshot_path and os.path.exists(snapshot_path):
            with open(snapshot_path, "rb") as f:
                img = MIMEImage(f.read(), name=os.path.basename(snapshot_path))
                img.add_header("Content-ID", "<fire_image>")
                img.add_header("Content-Disposition", "inline",
                               filename=os.path.basename(snapshot_path))
                msg.attach(img)

        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(msg)

        logger.info("Fire alert email sent for detection #%d", detection_id)
        return True

    except Exception as exc:
        logger.error("Failed to send fire alert email: %s", exc)
        return False
