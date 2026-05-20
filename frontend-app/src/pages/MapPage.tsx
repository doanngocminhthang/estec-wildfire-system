import { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

// ── Basemaps ──────────────────────────────────────────────────────────────────
const BASEMAPS = [
  { id: 'dark',    label: 'Tối',    style: 'https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json' },
  { id: 'light',   label: 'Sáng',   style: 'https://tiles.openfreemap.org/styles/positron' },
  { id: 'voyager', label: 'Địa lý', style: 'https://tiles.openfreemap.org/styles/liberty' },
] as const

// ── Layer definitions ─────────────────────────────────────────────────────────
const LAYER_DEFS = [
  { id: 'province-fill',   label: 'Vùng tỉnh Thanh Hóa', color: '#3b82f6', icon: 'map' },
  { id: 'province-line',   label: 'Ranh giới tỉnh',       color: '#1d4ed8', icon: 'straighten' },
  { id: 'districts-line',  label: 'Ranh giới huyện',      color: '#60a5fa', icon: 'grid_on' },
  { id: 'hotspots-heat',   label: 'Nhiệt độ điểm cháy',   color: '#ef4444', icon: 'whatshot' },
  { id: 'hotspots-points', label: 'Vị trí điểm cháy',     color: '#fbbf24', icon: 'crisis_alert' },
  { id: 'incidents',       label: 'Sự cố cháy rừng',      color: '#60a5fa', icon: 'local_fire_department' },
] as const

type LayerId = typeof LAYER_DEFS[number]['id']
type Visibility = Record<LayerId, boolean>

const DEFAULT_VIS: Visibility = {
  'province-fill': true, 'province-line': true, 'districts-line': true,
  'hotspots-heat': true, 'hotspots-points': true, 'incidents': true,
}

// ── Popup helpers ─────────────────────────────────────────────────────────────
function hotspotHtml(p: Record<string, unknown>) {
  const c = Number(p['confidence_score'])
  const color = c > 90 ? '#ef4444' : c > 70 ? '#fbbf24' : '#34d399'
  return `<div class="wf-popup">
    <div class="wf-title" style="color:#fbbf24">🔥 Điểm cháy #${p['id']}</div>
    <div class="wf-row"><span>Thiết bị</span><b>${p['device_id']}</b></div>
    <div class="wf-row"><span>Độ tin cậy</span><b style="color:${color}">${c}%</b></div>
    <div class="wf-row"><span>Phát hiện</span><b>${new Date(String(p['detected_at'])).toLocaleString('vi-VN')}</b></div>
  </div>`
}

function incidentHtml(p: Record<string, unknown>) {
  const SL: Record<string, string> = { uncontrolled: 'Chưa kiểm soát', containing: 'Đang kiểm soát', controlled: 'Đã kiểm soát' }
  const SC: Record<string, string> = { uncontrolled: '#ef4444', containing: '#fbbf24', controlled: '#34d399' }
  const s = String(p['status'])
  return `<div class="wf-popup">
    <div class="wf-title" style="color:#60a5fa">${p['incident_code']}</div>
    <div class="wf-sub">${p['title']}</div>
    <div class="wf-row"><span>Trạng thái</span><b style="color:${SC[s] ?? '#64748b'}">${SL[s] ?? s}</b></div>
    <div class="wf-row"><span>Diện tích</span><b>${p['burn_area_acres']} ha</b></div>
    <div class="wf-row"><span>Mức độ</span><b style="text-transform:uppercase">${p['priority']}</b></div>
  </div>`
}

// ── Sample data (dùng tạm, sau thay bằng API) ─────────────────────────────────
const HOTSPOTS_DATA: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [105.08, 19.66] }, properties: { id: 1, device_id: 'CAM-01', confidence_score: 95, detected_at: '2025-05-20T08:00:00Z' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [105.27, 19.97] }, properties: { id: 2, device_id: 'CAM-02', confidence_score: 82, detected_at: '2025-05-20T09:15:00Z' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [105.07, 20.37] }, properties: { id: 3, device_id: 'CAM-03', confidence_score: 76, detected_at: '2025-05-20T10:30:00Z' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [105.49, 19.89] }, properties: { id: 4, device_id: 'CAM-04', confidence_score: 91, detected_at: '2025-05-20T11:00:00Z' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [105.36, 20.08] }, properties: { id: 5, device_id: 'CAM-05', confidence_score: 68, detected_at: '2025-05-20T11:45:00Z' } },
  ],
}

const INCIDENTS_DATA: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [105.08, 19.66] }, properties: { incident_code: 'INC-001', title: 'Cháy rừng Thường Xuân', status: 'uncontrolled', priority: 'critical', burn_area_acres: 45 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [105.27, 19.97] }, properties: { incident_code: 'INC-002', title: 'Cháy rừng Lang Chánh', status: 'containing',   priority: 'high',     burn_area_acres: 22 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [105.49, 19.89] }, properties: { incident_code: 'INC-003', title: 'Cháy rừng Thọ Xuân',   status: 'controlled',  priority: 'medium',   burn_area_acres: 10 } },
  ],
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MapPage() {
  // containerRef đặt trực tiếp trên div có kích thước — KHÔNG dùng absolute inset-0 child
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<maplibregl.Map | null>(null)
  const popupRef     = useRef<maplibregl.Popup | null>(null)
  const visRef       = useRef<Visibility>(DEFAULT_VIS)

  const [basemap,  setBasemap]  = useState<string>('dark')
  const [visible,  setVisible]  = useState<Visibility>(DEFAULT_VIS)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => { visRef.current = visible }, [visible])

  const loadDataLayers = useCallback((map: maplibregl.Map) => {
    const vis = visRef.current

    // Ranh giới — file tĩnh từ /public
    if (!map.getSource('province-src'))
      map.addSource('province-src', { type: 'geojson', data: '/thanh_hoa_province.geojson' })
    if (!map.getSource('districts-src'))
      map.addSource('districts-src', { type: 'geojson', data: '/thanh_hoa_districts.geojson' })

    if (!map.getLayer('province-fill')) map.addLayer({ id: 'province-fill', type: 'fill', source: 'province-src',
      layout: { visibility: vis['province-fill'] ? 'visible' : 'none' },
      paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.06 },
    })
    if (!map.getLayer('province-line')) map.addLayer({ id: 'province-line', type: 'line', source: 'province-src',
      layout: { visibility: vis['province-line'] ? 'visible' : 'none' },
      paint: { 'line-color': '#1d4ed8', 'line-width': 2.5, 'line-opacity': 0.9 },
    })
    if (!map.getLayer('districts-line')) map.addLayer({ id: 'districts-line', type: 'line', source: 'districts-src',
      layout: { visibility: vis['districts-line'] ? 'visible' : 'none' },
      paint: { 'line-color': '#60a5fa', 'line-width': 1, 'line-opacity': 0.6, 'line-dasharray': [3, 2] },
    })
    if (!map.getLayer('districts-label')) map.addLayer({ id: 'districts-label', type: 'symbol', source: 'districts-src',
      minzoom: 8,
      layout: {
        visibility: vis['districts-line'] ? 'visible' : 'none',
        'text-field': ['get', 'NAME_2'], 'text-size': 10, 'text-max-width': 8,
        'text-font': ['Noto Sans Regular', 'Open Sans Regular', 'Arial Unicode MS Regular'],
      },
      paint: { 'text-color': '#1d4ed8', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 },
    })

    // Hotspots
    if (!map.getSource('hotspots'))
      map.addSource('hotspots', { type: 'geojson', data: HOTSPOTS_DATA })
    if (!map.getLayer('hotspots-heat')) map.addLayer({ id: 'hotspots-heat', type: 'heatmap', source: 'hotspots',
      layout: { visibility: vis['hotspots-heat'] ? 'visible' : 'none' },
      paint: {
        'heatmap-weight': ['interpolate', ['linear'], ['get', 'confidence_score'], 0, 0, 100, 1],
        'heatmap-intensity': 1.5,
        'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(0,0,0,0)', 0.3, 'rgba(21,101,192,0.5)', 0.7, 'rgba(251,191,36,0.8)', 1, 'rgba(239,68,68,1)',
        ],
        'heatmap-radius': 30, 'heatmap-opacity': 0.85,
      },
    })
    if (!map.getLayer('hotspots-points')) map.addLayer({ id: 'hotspots-points', type: 'circle', source: 'hotspots',
      minzoom: 11,
      layout: { visibility: vis['hotspots-points'] ? 'visible' : 'none' },
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 5, 16, 9],
        'circle-color': '#fbbf24', 'circle-stroke-width': 1.5, 'circle-stroke-color': '#ffffff', 'circle-opacity': 0.9,
      },
    })

    // Incidents
    if (!map.getSource('incidents-src'))
      map.addSource('incidents-src', { type: 'geojson', data: INCIDENTS_DATA })
    if (!map.getLayer('incidents')) map.addLayer({ id: 'incidents', type: 'circle', source: 'incidents-src',
      layout: { visibility: vis['incidents'] ? 'visible' : 'none' },
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 8, 14, 18],
        'circle-color': ['match', ['get', 'status'],
          'uncontrolled', '#ef4444', 'containing', '#fbbf24', 'controlled', '#34d399', '#60a5fa',
        ],
        'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff', 'circle-opacity': 0.9,
      },
    })

    setMapReady(true)
  }, [])

  // Mount map một lần
  useEffect(() => {
    const el = containerRef.current
    if (!el || mapRef.current) return

    const map = new maplibregl.Map({
      container: el,
      style: BASEMAPS[0].style,
      center: [105.78, 19.80],
      zoom: 8,
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.addControl(new maplibregl.ScaleControl(), 'bottom-left')
    map.addControl(new maplibregl.FullscreenControl(), 'top-right')

    popupRef.current = new maplibregl.Popup({ closeButton: true, maxWidth: '300px', className: 'wf-maplibre-popup' })

    map.on('click', 'hotspots-points', (e) => {
      if (!e.features?.[0]) return
      popupRef.current!.setLngLat(e.lngLat).setHTML(hotspotHtml(e.features[0].properties as Record<string, unknown>)).addTo(map)
    })
    map.on('click', 'incidents', (e) => {
      if (!e.features?.[0]) return
      popupRef.current!.setLngLat(e.lngLat).setHTML(incidentHtml(e.features[0].properties as Record<string, unknown>)).addTo(map)
    })
    map.on('mouseenter', 'hotspots-points', () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', 'hotspots-points', () => { map.getCanvas().style.cursor = '' })
    map.on('mouseenter', 'incidents',       () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', 'incidents',       () => { map.getCanvas().style.cursor = '' })

    map.on('load', () => loadDataLayers(map))

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null; setMapReady(false) }
  }, [loadDataLayers])

  // Sync visibility
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    LAYER_DEFS.forEach(({ id }) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visible[id] ? 'visible' : 'none')
    })
    if (map.getLayer('districts-label'))
      map.setLayoutProperty('districts-label', 'visibility', visible['districts-line'] ? 'visible' : 'none')
  }, [visible, mapReady])

  function switchBasemap(bmId: string) {
    const map = mapRef.current
    if (!map || bmId === basemap) return
    const bm = BASEMAPS.find((b) => b.id === bmId)
    if (!bm) return
    setBasemap(bmId)
    setMapReady(false)
    map.setStyle(bm.style)
    map.once('style.load', () => loadDataLayers(map))
  }

  function toggleLayer(id: LayerId) {
    setVisible((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    // containerRef đặt trực tiếp trên div toàn màn hình — panels overlay bên trong
    <div ref={containerRef} style={{ width: '100%', height: 'calc(100vh - 44px)', position: 'relative' }}>

      {/* ── Layer control panel ──────────────────────────────────────────────── */}
      <div className="absolute top-3 left-3 z-10 w-52 bg-white/95 border border-[#e2e8f0] rounded-xl shadow-lg backdrop-blur-sm overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#e2e8f0] bg-[#f8fafc]">
          <span className="material-symbols-outlined text-[#1565c0] text-base">layers</span>
          <span className="text-xs font-semibold text-[#1e293b]">Lớp bản đồ</span>
        </div>

        <div className="p-3 space-y-3">
          {/* Basemap */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#94a3b8] mb-1.5">Nền bản đồ</p>
            <div className="flex gap-1">
              {BASEMAPS.map((bm) => (
                <button key={bm.id} onClick={() => switchBasemap(bm.id)}
                  className={`flex-1 py-1.5 text-[10px] rounded-lg border transition-all ${
                    basemap === bm.id
                      ? 'bg-[#1565c0] border-[#1565c0] text-white font-semibold'
                      : 'border-[#e2e8f0] text-[#64748b] hover:text-[#1e293b] hover:border-[#1565c0]'
                  }`}
                >{bm.label}</button>
              ))}
            </div>
          </div>

          {/* Layer toggles */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#94a3b8] mb-1">Lớp dữ liệu</p>
            <div className="space-y-0.5">
              {LAYER_DEFS.map(({ id, label, color, icon }) => {
                const on = visible[id]
                return (
                  <button key={id} onClick={() => toggleLayer(id)}
                    className="w-full flex items-center gap-2.5 px-1.5 py-2 rounded-lg hover:bg-[#f1f5f9] transition-colors"
                  >
                    <div className="w-4 h-4 rounded-sm border-2 flex items-center justify-center flex-shrink-0 transition-all"
                      style={{ backgroundColor: on ? color : 'transparent', borderColor: on ? color : '#cbd5e1' }}>
                      {on && (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                          <path d="M1.5 5 L4 7.5 L8.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className="material-symbols-outlined text-sm flex-shrink-0" style={{ color: on ? color : '#cbd5e1' }}>{icon}</span>
                    <span className={`text-xs flex-1 text-left leading-tight ${on ? 'text-[#1e293b]' : 'text-[#94a3b8]'}`}>{label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {!mapReady && (
            <div className="flex items-center gap-2 text-[10px] text-[#94a3b8]">
              <div className="w-2 h-2 rounded-full bg-[#1565c0] animate-pulse" />
              Đang tải dữ liệu...
            </div>
          )}
        </div>
      </div>

      {/* ── Legend ───────────────────────────────────────────────────────────── */}
      <div className="absolute bottom-8 left-3 z-10 bg-white/95 border border-[#e2e8f0] rounded-xl p-3 shadow-lg backdrop-blur-sm">
        <p className="text-[10px] uppercase tracking-widest text-[#94a3b8] mb-2.5">Chú giải</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-2.5 flex-shrink-0 rounded-sm border-2 border-[#1d4ed8]" style={{ backgroundColor: 'rgba(59,130,246,0.15)' }} />
            <span className="text-[10px] text-[#64748b]">Ranh giới tỉnh</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0 flex-shrink-0 border-t border-dashed border-[#60a5fa]" style={{ borderTopWidth: 1.5 }} />
            <span className="text-[10px] text-[#64748b]">Ranh giới huyện</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-2 rounded-full flex-shrink-0"
              style={{ background: 'linear-gradient(to right, rgba(21,101,192,0.6), rgba(251,191,36,0.9), rgba(239,68,68,1))' }} />
            <span className="text-[10px] text-[#64748b]">Mật độ nhiệt</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0 bg-[#fbbf24]" />
            <span className="text-[10px] text-[#64748b]">Điểm cháy (zoom &gt;11)</span>
          </div>
          {[
            { color: '#ef4444', label: 'Chưa kiểm soát' },
            { color: '#fbbf24', label: 'Đang kiểm soát' },
            { color: '#34d399', label: 'Đã kiểm soát'   },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border border-[#e2e8f0] flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-[#64748b]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
