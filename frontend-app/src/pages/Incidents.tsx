import { useEffect, useState } from 'react'
import api from '../api/client'

interface Incident {
  id: number
  incident_code: string
  title: string
  status: string
  priority: string
  burn_area_acres: number
  latitude: number | null
  longitude: number | null
  created_at: string
  updated_at: string
}

const STATUS_STYLE: Record<string, string> = {
  uncontrolled: 'text-red-600 bg-red-50 border-red-200',
  containing:   'text-amber-600 bg-amber-50 border-amber-200',
  controlled:   'text-emerald-600 bg-emerald-50 border-emerald-200',
}
const STATUS_LABEL: Record<string, string> = {
  uncontrolled: 'Chưa kiểm soát',
  containing:   'Đang kiểm soát',
  controlled:   'Đã kiểm soát',
}
const PRIORITY_STYLE: Record<string, string> = {
  critical: 'text-red-600 font-semibold',
  high:     'text-amber-600 font-semibold',
  medium:   'text-[#64748b]',
  low:      'text-emerald-600',
}

export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('')

  useEffect(() => {
    const url = filter ? `/incidents?status=${filter}` : '/incidents'
    api.get(url)
      .then((r) => setIncidents(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [filter])

  async function updateStatus(id: number, status: string) {
    await api.patch(`/incidents/${id}/status`, { status })
    setIncidents((prev) => prev.map((i) => i.id === id ? { ...i, status } : i))
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-lg font-bold text-[#1e293b]">Quản lý sự cố</h1>
        <p className="text-xs text-[#64748b] mt-0.5">Theo dõi và cập nhật trạng thái các sự cố cháy rừng</p>
      </div>

      <div className="flex justify-end mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-white border border-[#e2e8f0] text-sm text-[#1e293b] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1565c0] focus:ring-1 focus:ring-[#1565c0]/20 shadow-sm"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="uncontrolled">Chưa kiểm soát</option>
          <option value="containing">Đang kiểm soát</option>
          <option value="controlled">Đã kiểm soát</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-[#e2e8f0] rounded-xl h-20 animate-pulse" />
          ))}
        </div>
      ) : incidents.length === 0 ? (
        <p className="text-[#94a3b8] text-sm">Không có sự cố nào</p>
      ) : (
        <div className="space-y-3">
          {incidents.map((inc) => (
            <div key={inc.id} className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-[#94a3b8]">{inc.incident_code}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[inc.status]}`}>
                    {STATUS_LABEL[inc.status]}
                  </span>
                  <span className={`text-xs ${PRIORITY_STYLE[inc.priority]}`}>
                    {inc.priority.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm font-medium text-[#1e293b] truncate">{inc.title}</p>
                <p className="text-xs text-[#94a3b8] mt-0.5">
                  {inc.burn_area_acres} ha •{' '}
                  {new Date(inc.updated_at).toLocaleString('vi-VN')}
                </p>
              </div>
              <select
                value={inc.status}
                onChange={(e) => updateStatus(inc.id, e.target.value)}
                className="bg-white border border-[#e2e8f0] text-xs text-[#1e293b] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#1565c0]"
              >
                <option value="uncontrolled">Chưa kiểm soát</option>
                <option value="containing">Đang kiểm soát</option>
                <option value="controlled">Đã kiểm soát</option>
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
