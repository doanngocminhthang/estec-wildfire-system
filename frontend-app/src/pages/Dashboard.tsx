import { useEffect, useState } from 'react'
import api from '../api/client'

interface Stats {
  total_incidents: number
  active_sensors: number
  avg_confidence: number
  extreme_count: number
  high_count: number
  low_count: number
}

interface StatCardProps {
  icon: string
  label: string
  value: string | number
  sub?: string
  iconColor: string
  iconBg: string
  accent?: string
}

function StatCard({ icon, label, value, sub, iconColor, iconBg, accent }: StatCardProps) {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 flex items-start gap-4 shadow-sm">
      <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <span className={`material-symbols-outlined text-xl ${iconColor}`}>{icon}</span>
      </div>
      <div>
        <p className="text-xs text-[#64748b] mb-1">{label}</p>
        <p className={`text-2xl font-bold ${accent ?? 'text-[#1e293b]'}`}>{value}</p>
        {sub && <p className="text-xs text-[#94a3b8] mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

const services = [
  { label: 'Máy chủ API',    ok: true },
  { label: 'Cơ sở dữ liệu', ok: true },
  { label: 'Redis Cache',    ok: true },
  { label: 'MQTT Broker',    ok: true },
]

export default function Dashboard() {
  const [stats, setStats]     = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/hotspots/stats')
      .then((r) => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const now = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="p-6 max-w-5xl">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-lg font-bold text-[#1e293b]">Bảng điều khiển tổng quan</h1>
        <p className="text-xs text-[#64748b] mt-0.5 capitalize">{now}</p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-[#e2e8f0] rounded-xl h-24 animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <StatCard icon="crisis_alert"  label="Tổng điểm cháy"      value={stats.total_incidents}      sub="từ đầu hệ thống"    iconColor="text-red-500"    iconBg="bg-red-50"    accent="text-red-600" />
          <StatCard icon="sensors"       label="Thiết bị hoạt động"   value={stats.active_sensors}       sub="cảm biến / camera"  iconColor="text-emerald-500" iconBg="bg-emerald-50" />
          <StatCard icon="analytics"     label="Độ tin cậy TB"        value={`${stats.avg_confidence}%`} sub="xác suất phát hiện" iconColor="text-blue-500"   iconBg="bg-blue-50"   />
          <StatCard icon="warning"       label="Mức nguy hiểm cực cao" value={stats.extreme_count}        sub="confidence > 90%"  iconColor="text-red-400"    iconBg="bg-red-50"    accent="text-red-500" />
          <StatCard icon="report"        label="Mức nguy hiểm cao"    value={stats.high_count}            sub="confidence 70–90%" iconColor="text-amber-500"  iconBg="bg-amber-50"  accent="text-amber-600" />
          <StatCard icon="info"          label="Mức nguy hiểm thấp"   value={stats.low_count}             sub="confidence < 70%"  iconColor="text-emerald-500" iconBg="bg-emerald-50" />
        </div>
      ) : (
        <p className="text-sm text-[#94a3b8] mb-6">Không thể tải số liệu</p>
      )}

      {/* System status */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-[#1e293b] mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#1565c0] text-base">monitor_heart</span>
          Trạng thái hệ thống
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {services.map(({ label, ok }) => (
            <div
              key={label}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs ${
                ok
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-red-200 bg-red-50 text-red-600'
              }`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span>{label}</span>
              <span className="ml-auto font-medium">{ok ? 'Hoạt động' : 'Lỗi'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
