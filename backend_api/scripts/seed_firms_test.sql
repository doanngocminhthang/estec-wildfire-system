-- Seed test FIRMS satellite hotspot data for UI testing
-- Run: psql -U wildfire_admin -d wildfire_db -f seed_firms_test.sql
-- Or paste into pgAdmin / DBeaver query editor
--
-- source values match what firms_service.py writes: FIRMS_<SOURCE_KEY>
-- satellite values: actual satellite names from FIRMS CSV
-- firms_uid: must be unique; "seed_" prefix avoids collision with real data

INSERT INTO hotspots (device_id, confidence_score, detected_at, geom, frp, satellite, source, firms_uid)
VALUES
  -- VIIRS / Suomi NPP  (high confidence, strong fire)
  ('FIRMS_SNPP',  90.0, NOW() - INTERVAL '1 hour',
   ST_SetSRID(ST_MakePoint(105.3421, 19.8234), 4326),
   42.6, 'Suomi-NPP', 'FIRMS_VIIRS_SNPP_NRT', 'seed_snpp_001'),

  -- VIIRS / NOAA-20  (nominal confidence)
  ('FIRMS_NOAA20', 70.0, NOW() - INTERVAL '2 hours',
   ST_SetSRID(ST_MakePoint(104.9876, 20.1567), 4326),
   8.3, 'NOAA-20', 'FIRMS_VIIRS_NOAA20_NRT', 'seed_noaa_001'),

  -- MODIS / Terra  (medium confidence, lower resolution)
  ('FIRMS_MODIS', 80.0, NOW() - INTERVAL '3 hours',
   ST_SetSRID(ST_MakePoint(105.6543, 19.5012), 4326),
   22.1, 'Terra', 'FIRMS_MODIS_NRT', 'seed_modis_001'),

  -- VIIRS / NOAA-20  (second point, low confidence)
  ('FIRMS_NOAA20', 35.0, NOW() - INTERVAL '4 hours',
   ST_SetSRID(ST_MakePoint(105.1234, 19.3456), 4326),
   3.7, 'NOAA-20', 'FIRMS_VIIRS_NOAA20_NRT', 'seed_noaa_002'),

  -- MODIS / Aqua  (extreme confidence, large fire)
  ('FIRMS_MODIS', 95.0, NOW() - INTERVAL '5 hours',
   ST_SetSRID(ST_MakePoint(104.8765, 20.4321), 4326),
   78.4, 'Aqua', 'FIRMS_MODIS_NRT', 'seed_modis_002')

ON CONFLICT (firms_uid) DO NOTHING;

-- Verify
SELECT id, device_id, confidence_score, satellite, source, frp,
       ST_X(geom) AS lon, ST_Y(geom) AS lat
FROM hotspots
WHERE firms_uid LIKE 'seed_%'
ORDER BY detected_at DESC;
