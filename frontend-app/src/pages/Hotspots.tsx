import { useEffect, useState } from 'react'
import dataApi from '../api/dataClient'
import { downloadCSVRaw } from '../utils/exportUtils'

interface Hotspot {
  id: number
  device_id: string
  latitude: number
  longitude: number
  confidence_score: number
  snapshot_url: string | null
  detected_at: string
}

const LEVEL = (c: number) =>
  c > 90 ? { label: 'Cực cao', cls: 'text-red-600 bg-red-50 border-red-200' }
  : c > 70 ? { label: 'Cao',    cls: 'text-amber-600 bg-amber-50 border-amber-200' }
  :          { label: 'Thấp',   cls: 'text-emerald-600 bg-emerald-50 border-emerald-200' }

export default function Hotspots() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [level, setLevel]       = useState('')   // extreme | high | low | ''

  useEffect(() => {
    dataApi.get('/hotspots')
      .then((r) => setHotspots(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = hotspots.filter((h) => {
    const matchSearch = !search || h.device_id.toLowerCase().includes(search.toLowerCase())
    const matchLevel  = !level
      || (level === 'extreme' && h.confidence_score > 90)
      || (level === 'high'    && h.confidence_score > 70 && h.confidence_score <= 90)
      || (level === 'low'     && h.confidence_score <= 70)
    return matchSearch && matchLevel
  })

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg font-bold text-[#1e293b]">Điểm cháy (Hotspots)</h1>
        <p className="text-xs text-[#64748b] mt-0.5">Danh sách điểm cháy phát hiện từ cảm biến và vệ tinh</p>
      </div>

      {/* Summary cards */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Cực cao (>90%)', count: hotspots.filter(h => h.confidence_score > 90).length,            color: 'text-red-600',     bg: 'bg-red-50',     icon: 'local_fire_department' },
            { label: 'Cao (70–90%)',   count: hotspots.filter(h => h.confidence_score > 70 && h.confidence_score <= 90).length, color: 'text-amber-600',   bg: 'bg-amber-50',   icon: 'warning' },
            { label: 'Thấp (<70%)',    count: hotspots.filter(h => h.confidence_score <= 70).length,            color: 'text-emerald-600', bg: 'bg-emerald-50', icon: 'info' },
          ].map(({ label, count, color, bg, icon }) => (
            <div key={label} className={`${bg} border border-[#e2e8f0] rounded-xl p-4 flex items-center gap-3`}>
              <span className={`material-symbols-outlined ${color} text-2xl`}>{icon}</span>
              <div>
                <p className="text-xs text-[#64748b]">{label}</p>
                <p className={`text-xl font-bold ${color}`}>{count}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters + Export */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-sm">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo thiết bị..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#1565c0] text-[#1e293b]"
          />
        </div>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="bg-white border border-[#e2e8f0] text-sm text-[#1e293b] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1565c0]"
        >
          <option value="">Tất cả mức độ</option>
          <option value="extreme">Cực cao (&gt;90%)</option>
          <option value="high">Cao (70–90%)</option>
          <option value="low">Thấp (&lt;70%)</option>
        </select>
        <span className="text-xs text-[#94a3b8] self-center">{filtered.length} kết quả</span>
        <button
          onClick={() => downloadCSVRaw(
            `hotspots-${Date.now()}.csv`,
            ['id', 'device_id', 'latitude', 'longitude', 'confidence_score', 'detected_at'],
            ['ID', 'Thiết bị', 'Vĩ độ', 'Kinh độ', 'Độ tin cậy (%)', 'Thời gian phát hiện'],
            filtered.map((h) => ({
              id: h.id,
              device_id: h.device_id,
              latitude: h.latitude,
              longitude: h.longitude,
              confidence_score: h.confidence_score,
              detected_at: new Date(h.detected_at).toLocaleString('vi-VN'),
            }))
          )}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#1565c0] border border-[#1565c0] rounded-lg hover:bg-[#e8f0fe] transition-colors ml-auto"
        >
          <span className="material-symbols-outlined text-sm">download</span>
          Xuất CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
              {['ID', 'Thiết bị', 'Tọa độ', 'Độ tin cậy', 'Ảnh', 'Thời gian phát hiện'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[#f1f5f9]">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-[#f1f5f9] rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[#94a3b8] text-xs">Không có dữ liệu</td></tr>
            ) : (
              filtered.map((h) => {
                const lv = LEVEL(h.confidence_score)
                return (
                  <tr key={h.id} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-[#94a3b8]">#{h.id}</td>
                    <td className="px-4 py-3 font-medium text-[#1e293b]">{h.device_id}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#64748b]">
                      {h.latitude?.toFixed(4)}, {h.longitude?.toFixed(4)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-[#1565c0]" style={{ width: `${h.confidence_score}%` }} />
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${lv.cls}`}>
                          {h.confidence_score}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {h.snapshot_url
                        ? <a href={h.snapshot_url} target="_blank" rel="noreferrer" className="text-xs text-[#1565c0] hover:underline flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">image</span>Xem
                          </a>
                        : <span className="text-xs text-[#94a3b8]">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-xs text-[#64748b] whitespace-nowrap">
                      {new Date(h.detected_at).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
