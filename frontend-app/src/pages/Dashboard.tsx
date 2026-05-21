import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import dataApi from '../api/dataClient'
import api from '../api/client'

interface Stats {
  total_incidents: number
  active_sensors: number
  avg_confidence: number
  extreme_count: number
  high_count: number
  low_count: number
}

interface Incident {
  id: number
  incident_code: string
  title: string
  status: string
  priority: string
  burn_area_acres: number
  updated_at: string
}

interface Health {
  status: string
  database: string
}

interface Bulletin {
  id: number
  title: string
  body: string
  priority: 'info' | 'warning' | 'critical'
  created_by_username: string | null
  created_at: string
}

function StatCard({ icon, label, value, sub, iconColor, iconBg, accent }: {
  icon: string; label: string; value: string | number; sub?: string
  iconColor: string; iconBg: string; accent?: string
}) {
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
const PRIORITY_COLOR: Record<string, string> = {
  critical: 'text-red-600', high: 'text-amber-600', medium: 'text-[#64748b]', low: 'text-emerald-600',
}

export default function Dashboard() {
  const [stats,     setStats]     = useState<Stats | null>(null)
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [health,    setHealth]    = useState<Health | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [bulletins, setBulletins] = useState<Bulletin[]>([])

  useEffect(() => {
    Promise.allSettled([
      dataApi.get<Stats>('/hotspots/stats'),
      dataApi.get<Incident[]>('/incidents?limit=5'),
      dataApi.get<Health>('/health'),
      api.get<Bulletin[]>('/bulletins/'),
    ]).then(([statsRes, incRes, healthRes, bulletinsRes]) => {
      if (statsRes.status === 'fulfilled')    setStats(statsRes.value.data)
      if (incRes.status === 'fulfilled')      setIncidents(incRes.value.data.slice(0, 5))
      if (healthRes.status === 'fulfilled')   setHealth(healthRes.value.data)
      if (bulletinsRes.status === 'fulfilled') setBulletins(bulletinsRes.value.data.slice(0, 3))
    }).finally(() => setLoading(false))
  }, [])

  const now = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const systemServices = [
    { label: 'Máy chủ API',    ok: health !== null },
    { label: 'Cơ sở dữ liệu', ok: health?.database === 'connected' },
    { label: 'Redis Cache',    ok: true },
    { label: 'MQTT Broker',    ok: true },
  ]

  return (
    <div className="p-6 max-w-5xl space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-lg font-bold text-[#1e293b]">Bảng điều khiển tổng quan</h1>
        <p className="text-xs text-[#64748b] mt-0.5 capitalize">{now}</p>
      </div>

      {/* Bulletin banners */}
      {bulletins.length > 0 && (
        <div className="space-y-2">
          {bulletins.map(b => {
            const styles = {
              critical: 'bg-red-50 border-red-300 text-red-800',
              warning:  'bg-amber-50 border-amber-300 text-amber-800',
              info:     'bg-blue-50 border-blue-300 text-blue-800',
            }
            const icons = { critical: 'emergency', warning: 'warning', info: 'campaign' }
            return (
              <div key={b.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${styles[b.priority]}`}>
                <span className="material-symbols-outlined text-lg flex-shrink-0 mt-0.5">{icons[b.priority]}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{b.title}</p>
                  <p className="text-xs mt-0.5 opacity-80 line-clamp-2">{b.body}</p>
                </div>
                <Link to="/bulletins" className="text-xs underline opacity-70 hover:opacity-100 flex-shrink-0">
                  Xem thêm
                </Link>
              </div>
            )
          })}
        </div>
      )}

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-[#e2e8f0] rounded-xl h-24 animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard icon="crisis_alert"  label="Tổng điểm cháy"       value={stats.total_incidents}      sub="từ đầu hệ thống"    iconColor="text-red-500"     iconBg="bg-red-50"    accent="text-red-600" />
          <StatCard icon="sensors"       label="Thiết bị hoạt động"    value={stats.active_sensors}       sub="cảm biến / camera"  iconColor="text-emerald-500" iconBg="bg-emerald-50" />
          <StatCard icon="analytics"     label="Độ tin cậy TB"         value={`${stats.avg_confidence}%`} sub="xác suất phát hiện" iconColor="text-blue-500"    iconBg="bg-blue-50" />
          <StatCard icon="warning"       label="Nguy hiểm cực cao"     value={stats.extreme_count}        sub="confidence > 90%"   iconColor="text-red-400"     iconBg="bg-red-50"    accent="text-red-500" />
          <StatCard icon="report"        label="Nguy hiểm cao"         value={stats.high_count}           sub="confidence 70–90%"  iconColor="text-amber-500"   iconBg="bg-amber-50"  accent="text-amber-600" />
          <StatCard icon="info"          label="Nguy hiểm thấp"        value={stats.low_count}            sub="confidence < 70%"   iconColor="text-emerald-500" iconBg="bg-emerald-50" />
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">warning</span>
          Không thể kết nối backend. Kiểm tra server đang chạy chưa.
        </div>
      )}

      {/* Recent incidents + System status side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Recent incidents — 3/5 */}
        <div className="lg:col-span-3 bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#f1f5f9] bg-[#f8fafc]">
            <h2 className="text-sm font-semibold text-[#1e293b] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1565c0] text-base">local_fire_department</span>
              Sự cố gần đây
            </h2>
            <Link to="/incidents" className="text-xs text-[#1565c0] hover:underline flex items-center gap-0.5">
              Xem tất cả <span className="material-symbols-outlined text-sm">chevron_right</span>
            </Link>
          </div>

          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 bg-[#f1f5f9] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : incidents.length === 0 ? (
            <div className="px-5 py-8 text-center text-xs text-[#94a3b8]">Chưa có sự cố nào</div>
          ) : (
            <ul className="divide-y divide-[#f8fafc]">
              {incidents.map((inc) => (
                <li key={inc.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#f8fafc] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-mono text-[#94a3b8]">{inc.incident_code}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${STATUS_STYLE[inc.status] ?? 'text-[#64748b] bg-[#f1f5f9] border-[#e2e8f0]'}`}>
                        {STATUS_LABEL[inc.status] ?? inc.status}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-[#1e293b] truncate">{inc.title}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-xs font-semibold ${PRIORITY_COLOR[inc.priority] ?? 'text-[#64748b]'}`}>
                      {inc.priority.toUpperCase()}
                    </p>
                    <p className="text-[10px] text-[#94a3b8]">{inc.burn_area_acres} ha</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* System status — 2/5 */}
        <div className="lg:col-span-2 bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-[#f1f5f9] bg-[#f8fafc]">
            <h2 className="text-sm font-semibold text-[#1e293b] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1565c0] text-base">monitor_heart</span>
              Trạng thái hệ thống
            </h2>
          </div>
          <div className="p-4 space-y-2">
            {systemServices.map(({ label, ok }) => (
              <div key={label} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs ${
                ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600'
              }`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ok ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="flex-1">{label}</span>
                <span className="font-medium">{ok ? 'Hoạt động' : 'Lỗi'}</span>
              </div>
            ))}

            {/* Uptime note */}
            <div className="mt-3 pt-3 border-t border-[#f1f5f9] text-center">
              <p className="text-[10px] text-[#94a3b8]">Kiểm tra lần cuối</p>
              <p className="text-xs font-medium text-[#1e293b] mt-0.5">
                {new Date().toLocaleTimeString('vi-VN')}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Quick actions */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-[#1e293b] mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#1565c0] text-base">bolt</span>
          Truy cập nhanh
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: '/map',       icon: 'map',                   label: 'Bản đồ',      color: 'text-blue-600',    bg: 'bg-blue-50'    },
            { to: '/hotspots',  icon: 'crisis_alert',          label: 'Điểm cháy',   color: 'text-red-600',     bg: 'bg-red-50'     },
            { to: '/incidents', icon: 'local_fire_department', label: 'Sự cố',       color: 'text-amber-600',   bg: 'bg-amber-50'   },
            { to: '/analytics', icon: 'bar_chart',             label: 'Thống kê',    color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map(({ to, icon, label, color, bg }) => (
            <Link key={to} to={to}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-[#e2e8f0] ${bg} hover:shadow-md transition-shadow`}>
              <span className={`material-symbols-outlined text-2xl ${color}`}>{icon}</span>
              <span className={`text-xs font-medium ${color}`}>{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
