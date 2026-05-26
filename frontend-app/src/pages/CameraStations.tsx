import { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'

interface Station {
  id: number
  station_code: string
  name: string
  province: string | null
  latitude: number
  longitude: number
  rtsp_url: string | null
  ptz_url: string | null
  image_width: number
  image_height: number
  absolute_zoom: number
  field_of_view: number | null
  tilt_angle: number | null
  cam_height_agl: number | null
  ground_elevation: number | null
  is_active: boolean
  created_at: string
}

interface FireDetection {
  id: number
  station_code: string
  detected_at: string
  confidence: number
  azimuth: number | null
  fire_longitude: number | null
  fire_latitude: number | null
  fire_elevation_m: number | null
  slope_deg: number | null
  aspect_deg: number | null
  distance_m: number | null
  commune: string | null
  district: string | null
  province: string | null
  snapshot_path: string | null
  status: string
  created_at: string
}

const BLANK_STATION: Omit<Station, 'id' | 'created_at'> = {
  station_code: '', name: '', province: null,
  latitude: 0, longitude: 0,
  rtsp_url: null, ptz_url: null,
  cam_username: null, cam_password: null,
  image_width: 1920, image_height: 1080, absolute_zoom: 1000,
  field_of_view: null, tilt_angle: null,
  cam_height_agl: null, ground_elevation: null,
  is_active: true,
} as any

const STATUS_CLS: Record<string, string> = {
  pending:   'text-amber-700 bg-amber-50 border-amber-200',
  confirmed: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  rejected:  'text-slate-500 bg-slate-50 border-slate-200',
}

const STATUS_VI: Record<string, string> = {
  pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', rejected: 'Đã từ chối',
}

function fmtCoord(v: number | null, decimals = 5) {
  return v != null ? v.toFixed(decimals) : '—'
}

function fmtDate(s: string) {
  return new Date(s).toLocaleString('vi-VN')
}

export default function CameraStations() {
  const { hasRole } = useAuthStore()
  const isAdmin = hasRole('admin')

  const [tab, setTab] = useState<'stations' | 'detections'>('stations')
  const [stations, setStations] = useState<Station[]>([])
  const [detections, setDetections] = useState<FireDetection[]>([])
  const [loading, setLoading] = useState(true)
  const [detLoading, setDetLoading] = useState(false)
  const [filterStation, setFilterStation] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  // Station modal
  const [showModal, setShowModal] = useState(false)
  const [editStation, setEditStation] = useState<Partial<Station> | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadStations() }, [])
  useEffect(() => { if (tab === 'detections') loadDetections() }, [tab, filterStation, filterStatus])

  function loadStations() {
    setLoading(true)
    api.get('/cameras/stations')
      .then(r => setStations(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  function loadDetections() {
    setDetLoading(true)
    const params: Record<string, string> = {}
    if (filterStation) params.station_code = filterStation
    if (filterStatus) params.status = filterStatus
    api.get('/cameras/detections', { params })
      .then(r => setDetections(r.data))
      .catch(console.error)
      .finally(() => setDetLoading(false))
  }

  function openCreate() {
    setEditStation({ ...BLANK_STATION })
    setShowModal(true)
  }

  function openEdit(s: Station) {
    setEditStation({ ...s })
    setShowModal(true)
  }

  async function saveStation() {
    if (!editStation) return
    setSaving(true)
    try {
      if (editStation.id) {
        await api.put(`/cameras/stations/${editStation.id}`, editStation)
      } else {
        await api.post('/cameras/stations', editStation)
      }
      setShowModal(false)
      loadStations()
    } catch (e) {
      alert('Lỗi lưu trạm. Kiểm tra lại thông tin.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteStation(s: Station) {
    if (!confirm(`Xóa trạm "${s.name}"?`)) return
    await api.delete(`/cameras/stations/${s.id}`)
    loadStations()
  }

  async function updateDetectionStatus(id: number, status: 'confirmed' | 'rejected') {
    await api.patch(`/cameras/detections/${id}`, { status })
    loadDetections()
  }

  return (
    <div className="p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg font-bold text-[#1e293b]">Trạm Camera & Phát hiện Cháy</h1>
        <p className="text-xs text-[#64748b] mt-0.5">Quản lý trạm camera quan sát và xác nhận kết quả phát hiện cháy rừng từ AI</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#f1f5f9] p-1 rounded-lg w-fit">
        {([['stations', 'Trạm Camera'], ['detections', 'Phát hiện Cháy']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === key ? 'bg-white text-[#1565c0] shadow-sm' : 'text-[#64748b] hover:text-[#1e293b]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB: STATIONS ── */}
      {tab === 'stations' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-[#64748b]">{stations.length} trạm</p>
            {isAdmin && (
              <button
                onClick={openCreate}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#1565c0] text-white text-sm font-medium rounded-lg hover:bg-[#1251a3]"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Thêm trạm
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><span className="material-symbols-outlined animate-spin text-[#1565c0] text-3xl">progress_activity</span></div>
          ) : stations.length === 0 ? (
            <div className="text-center py-16 text-[#94a3b8]">
              <span className="material-symbols-outlined text-4xl mb-2 block">videocam_off</span>
              Chưa có trạm camera nào
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {stations.map(s => (
                <div key={s.id} className="bg-white rounded-xl border border-[#e2e8f0] p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-[#94a3b8] uppercase tracking-wider">{s.station_code}</span>
                      <h3 className="text-sm font-semibold text-[#1e293b]">{s.name}</h3>
                      {s.province && <p className="text-xs text-[#64748b]">{s.province}</p>}
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${s.is_active ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-500 bg-slate-50 border-slate-200'}`}>
                      {s.is_active ? 'Hoạt động' : 'Tắt'}
                    </span>
                  </div>

                  <div className="text-xs text-[#64748b] grid grid-cols-2 gap-x-3 gap-y-1">
                    <span><b>Lat:</b> {s.latitude.toFixed(5)}</span>
                    <span><b>Lon:</b> {s.longitude.toFixed(5)}</span>
                    <span><b>Ảnh:</b> {s.image_width}×{s.image_height}</span>
                    <span><b>Zoom:</b> {s.absolute_zoom}</span>
                    {s.field_of_view && <span><b>FOV:</b> {s.field_of_view}°</span>}
                    {s.cam_height_agl && <span><b>Cao:</b> {s.cam_height_agl} m</span>}
                  </div>

                  <div className="flex gap-1 text-[11px]">
                    {s.rtsp_url && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">RTSP</span>
                    )}
                    {s.ptz_url && (
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-200">PTZ</span>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex gap-2 pt-1 border-t border-[#f1f5f9]">
                      <button onClick={() => openEdit(s)} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-[#1565c0] hover:bg-blue-50 rounded-lg">
                        <span className="material-symbols-outlined text-sm">edit</span> Sửa
                      </button>
                      <button onClick={() => deleteStation(s)} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg">
                        <span className="material-symbols-outlined text-sm">delete</span> Xóa
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── TAB: DETECTIONS ── */}
      {tab === 'detections' && (
        <>
          <div className="flex gap-3 mb-4 flex-wrap">
            <input
              value={filterStation}
              onChange={e => setFilterStation(e.target.value)}
              placeholder="Mã trạm..."
              className="px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#1565c0]"
            />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#1565c0]"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="rejected">Đã từ chối</option>
            </select>
            <button onClick={loadDetections} className="px-3 py-2 text-sm text-[#1565c0] border border-[#e2e8f0] rounded-lg hover:bg-blue-50">
              <span className="material-symbols-outlined text-base">refresh</span>
            </button>
          </div>

          {detLoading ? (
            <div className="flex justify-center py-16"><span className="material-symbols-outlined animate-spin text-[#1565c0] text-3xl">progress_activity</span></div>
          ) : detections.length === 0 ? (
            <div className="text-center py-16 text-[#94a3b8]">
              <span className="material-symbols-outlined text-4xl mb-2 block">local_fire_department</span>
              Không có kết quả phát hiện nào
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#e2e8f0]">
              <table className="w-full text-sm">
                <thead className="bg-[#f8fafc] text-[#64748b] text-xs uppercase tracking-wider">
                  <tr>
                    {['#', 'Trạm', 'Thời gian', 'Độ tin cậy', 'Tọa độ cháy', 'Khoảng cách', 'Địa điểm', 'Trạng thái', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {detections.map(d => (
                    <tr key={d.id} className="hover:bg-[#f8fafc]">
                      <td className="px-4 py-3 font-mono text-[#94a3b8] text-xs">{d.id}</td>
                      <td className="px-4 py-3 font-medium text-[#1e293b]">{d.station_code}</td>
                      <td className="px-4 py-3 text-[#64748b] text-xs">{fmtDate(d.detected_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${
                          d.confidence >= 0.9 ? 'text-red-700 bg-red-50 border-red-200'
                          : d.confidence >= 0.7 ? 'text-amber-700 bg-amber-50 border-amber-200'
                          : 'text-slate-600 bg-slate-50 border-slate-200'
                        }`}>
                          {(d.confidence * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#64748b] font-mono">
                        {d.fire_latitude ? `${fmtCoord(d.fire_latitude)}°N` : '—'}<br />
                        {d.fire_longitude ? `${fmtCoord(d.fire_longitude)}°E` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#64748b]">
                        {d.distance_m ? `${(d.distance_m / 1000).toFixed(2)} km` : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#64748b]">
                        {[d.commune, d.district].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full border text-xs font-medium ${STATUS_CLS[d.status] || ''}`}>
                          {STATUS_VI[d.status] || d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {d.status === 'pending' && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => updateDetectionStatus(d.id, 'confirmed')}
                              className="px-2 py-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100"
                            >
                              Xác nhận
                            </button>
                            <button
                              onClick={() => updateDetectionStatus(d.id, 'rejected')}
                              className="px-2 py-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100"
                            >
                              Từ chối
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Station Modal ── */}
      {showModal && editStation && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#e2e8f0]">
              <h2 className="font-semibold text-[#1e293b]">
                {editStation.id ? 'Chỉnh sửa trạm camera' : 'Thêm trạm camera mới'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-[#94a3b8] hover:text-[#1e293b]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                { label: 'Mã trạm *', key: 'station_code', type: 'text' },
                { label: 'Tên trạm *', key: 'name', type: 'text' },
                { label: 'Tỉnh/Thành', key: 'province', type: 'text' },
                { label: 'Vĩ độ (lat) *', key: 'latitude', type: 'number' },
                { label: 'Kinh độ (lon) *', key: 'longitude', type: 'number' },
                { label: 'RTSP URL', key: 'rtsp_url', type: 'text' },
                { label: 'PTZ URL', key: 'ptz_url', type: 'text' },
                { label: 'Username camera', key: 'cam_username', type: 'text' },
                { label: 'Password camera', key: 'cam_password', type: 'password' },
                { label: 'Chiều rộng ảnh (px)', key: 'image_width', type: 'number' },
                { label: 'Chiều cao ảnh (px)', key: 'image_height', type: 'number' },
                { label: 'Absolute Zoom', key: 'absolute_zoom', type: 'number' },
                { label: 'FOV (độ ngang)', key: 'field_of_view', type: 'number' },
                { label: 'Góc ngẩng (tilt_angle)', key: 'tilt_angle', type: 'number' },
                { label: 'Chiều cao AGL (m)', key: 'cam_height_agl', type: 'number' },
                { label: 'Cao độ địa hình (m)', key: 'ground_elevation', type: 'number' },
              ].map(({ label, key, type }) => (
                <div key={key} className={key === 'rtsp_url' || key === 'ptz_url' ? 'col-span-2' : ''}>
                  <label className="block text-xs text-[#64748b] mb-1">{label}</label>
                  <input
                    type={type}
                    value={(editStation as any)[key] ?? ''}
                    onChange={e => setEditStation(prev => ({
                      ...prev!,
                      [key]: type === 'number'
                        ? (e.target.value === '' ? null : Number(e.target.value))
                        : (e.target.value || null)
                    }))}
                    className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#1565c0]"
                  />
                </div>
              ))}

              <div className="col-span-2 flex items-center gap-2">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={editStation.is_active !== false}
                  onChange={e => setEditStation(prev => ({ ...prev!, is_active: e.target.checked }))}
                  className="w-4 h-4 text-[#1565c0]"
                />
                <label htmlFor="is_active" className="text-sm text-[#1e293b]">Đang hoạt động</label>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-[#e2e8f0] justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-[#64748b] border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc]">
                Hủy
              </button>
              <button
                onClick={saveStation}
                disabled={saving}
                className="px-4 py-2 text-sm bg-[#1565c0] text-white rounded-lg hover:bg-[#1251a3] disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
