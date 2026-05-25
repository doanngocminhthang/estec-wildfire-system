"""
Camera geometry utilities: coordinate calculation, slope/aspect, PTZ control.
Ported from HoanVo project's camera.py. Heavy dependencies (rasterio, geopandas)
are imported lazily so the service starts even when they are not installed.
"""
import math
import logging
from typing import Optional, Tuple

import requests
from requests.auth import HTTPDigestAuth

logger = logging.getLogger(__name__)


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return ground distance in metres between two WGS-84 points."""
    R = 6_371_000.0
    lat1_r, lon1_r, lat2_r, lon2_r = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2_r - lat1_r
    dlon = lon2_r - lon1_r
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))


def ptz_control(elevation: int, azimuth: int, absolute_zoom: int,
                ptz_url: str, username: str, password: str) -> int:
    """Send AbsoluteHigh PTZ command to a Hikvision camera. Returns HTTP status code."""
    auth = HTTPDigestAuth(username, password)
    body = f"""<?xml version="1.0" encoding="UTF-8"?>
<PTZData xmlns="http://www.hikvision.com/ver20/XMLSchema">
    <AbsoluteHigh>
        <elevation>{int(elevation)}</elevation>
        <azimuth>{int(azimuth)}</azimuth>
        <absoluteZoom>{int(absolute_zoom)}</absoluteZoom>
    </AbsoluteHigh>
</PTZData>"""
    try:
        resp = requests.put(ptz_url, data=body,
                            headers={"Content-Type": "application/xml"},
                            auth=auth, timeout=5)
        return resp.status_code
    except Exception as exc:
        logger.warning("PTZ control failed: %s", exc)
        return 0


def calculate_slope_aspect(dem_path: str, lat: float, lon: float) -> Tuple[float, float, float]:
    """
    Compute (elevation_m, slope_deg, aspect_deg) at (lat, lon) using Horn's method on a GeoTIFF DEM.
    Requires rasterio and pyproj.
    """
    try:
        import numpy as np
        import rasterio
        from rasterio import windows as rio_windows
        from pyproj import Transformer

        with rasterio.open(dem_path) as ds:
            if ds.crs.to_epsg() != 4326:
                xf = Transformer.from_crs("EPSG:4326", ds.crs, always_xy=True)
                lon_t, lat_t = xf.transform(lon, lat)
            else:
                lon_t, lat_t = lon, lat

            row, col = ds.index(lon_t, lat_t)
            if row <= 0 or col <= 0 or row >= ds.height - 1 or col >= ds.width - 1:
                raise ValueError("Point too close to DEM edge")

            win = rio_windows.Window(col_off=col - 1, row_off=row - 1, width=3, height=3)
            elev = ds.read(1, window=win).astype(float)
            nodata = ds.nodata
            if nodata is not None:
                elev[elev == nodata] = float("nan")
            if elev.shape != (3, 3) or np.isnan(elev).any():
                raise ValueError("Insufficient DEM data")
            dx, dy = ds.res

        dz_dx = ((elev[0, 2] + 2 * elev[1, 2] + elev[2, 2]) -
                 (elev[0, 0] + 2 * elev[1, 0] + elev[2, 0])) / (8 * dx)
        dz_dy = ((elev[2, 0] + 2 * elev[2, 1] + elev[2, 2]) -
                 (elev[0, 0] + 2 * elev[0, 1] + elev[0, 2])) / (8 * dy)

        slope_deg = math.degrees(math.atan(math.sqrt(dz_dx ** 2 + dz_dy ** 2)))
        aspect_deg = math.degrees(math.atan2(dz_dy, -dz_dx))
        if aspect_deg < 0:
            aspect_deg += 360.0

        return float(elev[1, 1]), slope_deg, aspect_deg

    except ImportError:
        logger.warning("rasterio/pyproj not installed; DEM elevation unavailable")
        return 0.0, 0.0, 0.0


def calculate_fire_coordinates(
    azimuth_tenths: float,
    x1: float, x2: float, y1: float, y2: float,
    camera_lon: float, camera_lat: float,
    image_width: float, image_height: float,
    field_of_view: float,   # horizontal FOV in degrees
    tilt_angle: float,      # camera center tilt (gocdung) in degrees
    cam_height_agl: float,  # camera height above ground in metres
    ground_elevation: float, # DEM elevation at station in metres
    dem_path: Optional[str] = None,
) -> Tuple[Optional[float], Optional[float], Optional[float], Optional[float], Optional[float]]:
    """
    Calculate approximate fire coordinates from camera bounding box using ray-casting on DEM.
    Returns (fire_lon, fire_lat, elevation_m, slope_deg, aspect_deg) or (None,...) on failure.
    """
    w1 = x2 - x1
    h1 = y2 - y1

    # Recompute field-of-view angle for this range (matches HoanVo formula)
    dophongdai = field_of_view
    if dophongdai < 10:
        gocanh = 54.5
    elif dophongdai < 30:
        gocanh = 369.78048 * (dophongdai ** -0.82958)
    elif dophongdai <= 90:
        gocanh = -0.2633 * dophongdai + 30.7
    elif dophongdai < 300:
        gocanh = 138.18748 * (dophongdai ** -0.66719)
    else:
        gocanh = 3.0

    x_day = x1 + w1 / 2
    y_day = y1 + h1

    gocngang = azimuth_tenths / 10.0   # convert tenths → degrees
    gocngangdc = gocngang - gocanh / 2 + gocanh * x_day / image_width + 15.0
    gocdungdc = tilt_angle + (image_height / 2) * gocanh / image_width - y_day * gocanh / image_width

    gocngang_rad = math.radians(gocngangdc)
    cos_val = math.cos(gocngang_rad)
    sin_val = math.sin(gocngang_rad)

    if dem_path:
        elev_station, _, _ = calculate_slope_aspect(dem_path, camera_lat, camera_lon)
    else:
        elev_station = ground_elevation or 0.0

    caotram = elev_station + cam_height_agl
    gocngam = gocdungdc - 90.0

    for n in range(1, 201):
        khoang_cach = n * 100.0  # metres
        caongam = caotram - math.tan(math.radians(abs(gocngam))) * khoang_cach
        vido_f = camera_lat + (khoang_cach * cos_val) * 0.000009
        kinhdo_f = camera_lon + (khoang_cach * sin_val) * 0.000009 / math.cos(math.radians(camera_lat))

        if dem_path:
            try:
                caodiahinh, slope_deg, aspect_deg = calculate_slope_aspect(dem_path, vido_f, kinhdo_f)
            except Exception:
                caodiahinh, slope_deg, aspect_deg = elev_station, 0.0, 0.0
        else:
            caodiahinh, slope_deg, aspect_deg = elev_station, 0.0, 0.0

        if caongam <= caodiahinh:
            return kinhdo_f, vido_f, caodiahinh, slope_deg, aspect_deg

    return None, None, None, None, None


def find_administrative_unit(lon: float, lat: float,
                              shapefile_path: Optional[str]) -> Tuple:
    """
    Point-in-Polygon lookup against an admin boundary shapefile.
    Returns (commune, commune_code, district, district_code, province, province_code).
    Requires geopandas and shapely.
    """
    if not shapefile_path:
        return None, None, None, None, None, None
    try:
        import geopandas as gpd
        from shapely.geometry import Point

        gdf = gpd.read_file(shapefile_path)
        point = Point(lon, lat)
        hit = gdf[gdf.geometry.contains(point)]
        if hit.empty:
            return None, None, None, None, None, None
        row = hit.iloc[0]
        return (
            row.get("NAME_3"), row.get("GID_3") or "1",
            row.get("NAME_2"), row.get("GID_2") or "1",
            row.get("NAME_1"), row.get("GID_1") or "1",
        )
    except ImportError:
        logger.warning("geopandas not installed; admin unit lookup unavailable")
        return None, None, None, None, None, None
    except Exception as exc:
        logger.warning("Admin unit lookup failed: %s", exc)
        return None, None, None, None, None, None


def calculate_fire_danger_index(temperature: float, humidity: float,
                                 wind_speed: float, rainfall_mm: float) -> Tuple[float, int]:
    """
    Simple fire danger index P and danger level (1-5).
    Based on Nesterov formula adapted for Vietnam conditions.
    """
    # Nesterov index increment: T*(T - Td) where Td ≈ T - (100 - RH)/5
    if rainfall_mm > 10:
        P = 0.0
    elif rainfall_mm > 3:
        P_prev = 0.0
        td = temperature - (100 - humidity) / 5
        P = max(0.0, P_prev + temperature * (temperature - td))
    else:
        td = temperature - (100 - humidity) / 5
        P = temperature * (temperature - td)

    P = max(0.0, P)

    if P < 300:
        level = 1
    elif P < 1000:
        level = 2
    elif P < 4000:
        level = 3
    elif P < 10000:
        level = 4
    else:
        level = 5

    return P, level
