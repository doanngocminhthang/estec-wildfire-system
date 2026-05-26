import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from 'recharts'
import dataApi from '../api/dataClient'
import { downloadCSVRaw, printElement } from '../utils/exportUtils'

// ── Types ─────────────────────────────────────────────────────────────────────
interface HotspotStats {
  total_incidents: number
  active_sensors: number
  avg_confidence: number
  extreme_count: number
  high_count: number
  low_count: number
}

// ── Static sample data (thay bằng API sau) ────────────────────────────────────
const MONTHLY_DATA = [
  { month: 'T1', diem_chay: 3,  dien_tich: 12 },
  { month: 'T2', diem_chay: 5,  dien_tich: 28 },
  { month: 'T3', diem_chay: 12, dien_tich: 67 },
  { month: 'T4', diem_chay: 18, dien_tich: 134 },
  { month: 'T5', diem_chay: 24, dien_tich: 198 },
  { month: 'T6', diem_chay: 31, dien_tich: 245 },
  { month: 'T7', diem_chay: 27, dien_tich: 189 },
  { month: 'T8', diem_chay: 19, dien_tich: 142 },
  { month: 'T9', diem_chay: 9,  dien_tich: 56 },
  { month: 'T10', diem_chay: 6, dien_tich: 31 },
  { month: 'T11', diem_chay: 4, dien_tich: 18 },
  { month: 'T12', diem_chay: 2, dien_tich: 8 },
]

const STATUS_DATA = [
  { name: 'Chưa kiểm soát', value: 8,  color: '#ef4444' },
  { name: 'Đang kiểm soát', value: 14, color: '#f59e0b' },
  { name: 'Đã kiểm soát',   value: 23, color: '#10b981' },
]

const REGION_DATA = [
  { name: 'Thường Xuân', value: 18 },
  { name: 'Lang Chánh',  value: 14 },
  { name: 'Quan Hóa',    value: 11 },
  { name: 'Bá Thước',    value: 9  },
  { name: 'Ngọc Lặc',    value: 7  },
  { name: 'Cẩm Thủy',    value: 5  },
]

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, iconBg, iconColor, accent }: {
  icon: string; label: string; value: string | number; sub?: string
  iconBg: string; iconColor: string; accent?: string
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

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-[#1e293b] mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[#1565c0] text-base">{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  )
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-[#1e293b] mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <b>{p.value}</b></p>
      ))}
    </div>
  )
}

// ── Export menu ───────────────────────────────────────────────────────────────
function ExportMenu({ onCSV, onPrint }: { onCSV: () => void; onPrint: () => void }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#1565c0] rounded-lg hover:bg-[#1251a3] transition-colors"
      >
        <span className="material-symbols-outlined text-sm">download</span>
        {t('common.exportReport')}
        <span className="material-symbols-outlined text-xs">{open ? 'expand_less' : 'expand_more'}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white border border-[#e2e8f0] rounded-lg shadow-lg z-20 overflow-hidden">
          <button
            onClick={() => { onCSV(); setOpen(false) }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-[#1e293b] hover:bg-[#f8fafc] transition-colors"
          >
            <span className="material-symbols-outlined text-sm text-emerald-600">table_view</span>
            {t('common.exportCSV')}
          </button>
          <button
            onClick={() => { onPrint(); setOpen(false) }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-[#1e293b] hover:bg-[#f8fafc] transition-colors border-t border-[#f1f5f9]"
          >
            <span className="material-symbols-outlined text-sm text-red-500">picture_as_pdf</span>
            {t('common.exportPDF')}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Analytics() {
  const { t } = useTranslation()
  const [stats, setStats]     = useState<HotspotStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dataApi.get('/hotspots/stats')
      .then((r) => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const totalFires = MONTHLY_DATA.reduce((s, d) => s + d.diem_chay, 0)
  const totalArea  = MONTHLY_DATA.reduce((s, d) => s + d.dien_tich, 0)

  function exportCSV() {
    const now = new Date().toLocaleDateString('vi-VN')
    // Monthly data
    downloadCSVRaw(
      `thong-ke-chay-rung-theo-thang-${Date.now()}.csv`,
      ['month', 'diem_chay', 'dien_tich'],
      ['Tháng', 'Số điểm cháy', 'Diện tích (ha)'],
      MONTHLY_DATA.map((d) => ({ month: d.month, diem_chay: d.diem_chay, dien_tich: d.dien_tich })),
    )
    // Region data (small delay to avoid browser blocking multiple downloads)
    setTimeout(() => {
      downloadCSVRaw(
        `thong-ke-chay-rung-theo-huyen-${Date.now()}.csv`,
        ['name', 'value'],
        ['Huyện', 'Số điểm cháy'],
        REGION_DATA.map((d) => ({ name: d.name, value: d.value })),
      )
    }, 200)
    void now
  }

  return (
    <div className="p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#1e293b]">{t('analytics.title')}</h1>
          <p className="text-xs text-[#64748b] mt-0.5">{t('analytics.subtitle')} — {t('analytics.inYear')} 2025</p>
        </div>
        <ExportMenu
          onCSV={exportCSV}
          onPrint={() => printElement('analytics-print-area', 'Báo cáo thống kê cháy rừng')}
        />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="local_fire_department" label={t('analytics.totalFires')}    value={loading ? '—' : (stats?.total_incidents ?? totalFires)}
          sub={`${t('analytics.inYear')} 2025`} iconBg="bg-red-50" iconColor="text-red-500" accent="text-red-600" />
        <StatCard icon="landscape"             label={t('analytics.burnArea')}       value={`${totalArea} ha`}
          sub={t('analytics.estTotal')} iconBg="bg-amber-50" iconColor="text-amber-500" accent="text-amber-600" />
        <StatCard icon="analytics"             label={t('analytics.avgConfidence')}  value={loading ? '—' : `${stats?.avg_confidence ?? 82}%`}
          sub={t('analytics.detectionProb')} iconBg="bg-blue-50" iconColor="text-blue-500" />
        <StatCard icon="sensors"               label={t('analytics.activeSensors')} value={loading ? '—' : (stats?.active_sensors ?? 12)}
          sub={t('analytics.cameraIoT')} iconBg="bg-emerald-50" iconColor="text-emerald-500" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Bar chart — điểm cháy theo tháng */}
        <div className="lg:col-span-2">
          <Section title={t('analytics.firesByMonth')} icon="bar_chart">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={MONTHLY_DATA} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="diem_chay" name={t('analytics.firePoints')} fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>

        {/* Pie — trạng thái sự cố */}
        <Section title={t('analytics.incidentStatus')} icon="pie_chart">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={STATUS_DATA} dataKey="value" cx="50%" cy="45%"
                innerRadius={50} outerRadius={75} paddingAngle={3}>
                {STATUS_DATA.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v} ${t('analytics.incidents')}`, '']} />
              <Legend iconType="circle" iconSize={8}
                formatter={(v) => <span style={{ fontSize: 11, color: '#64748b' }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </Section>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Area — diện tích cháy */}
        <div className="lg:col-span-2">
          <Section title={t('analytics.burnAreaByMonth')} icon="area_chart">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={MONTHLY_DATA}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="dien_tich" name={t('analytics.burnedArea')}
                  stroke="#f59e0b" strokeWidth={2} fill="url(#areaGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </Section>
        </div>

        {/* Bar horizontal — theo khu vực */}
        <Section title={t('analytics.firesByDistrict')} icon="map">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={REGION_DATA} layout="vertical" barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" name={t('analytics.firePoints')} fill="#1565c0" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Section>
      </div>

      {/* Mức độ nguy hiểm */}
      {stats && (
        <Section title={t('analytics.dangerDistribution')} icon="warning">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: t('analytics.extremeLabel'), value: stats.extreme_count, color: 'bg-red-500',   bar: 'bg-red-100', pct: Math.round(stats.extreme_count / stats.total_incidents * 100) },
              { label: t('analytics.highLabel'),    value: stats.high_count,    color: 'bg-amber-500', bar: 'bg-amber-100', pct: Math.round(stats.high_count / stats.total_incidents * 100) },
              { label: t('analytics.lowLabel'),     value: stats.low_count,     color: 'bg-emerald-500', bar: 'bg-emerald-100', pct: Math.round(stats.low_count / stats.total_incidents * 100) },
            ].map(({ label, value, color, bar, pct }) => (
              <div key={label} className={`${bar} rounded-xl p-4`}>
                <p className="text-xs text-[#64748b] mb-2">{label}</p>
                <p className="text-2xl font-bold text-[#1e293b] mb-2">{value}</p>
                <div className="w-full h-1.5 bg-white/60 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[10px] text-[#64748b] mt-1">{pct}% {t('analytics.pctOfTotal').replace('% ', '')}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Hidden print-friendly tables */}
      <div id="analytics-print-area" className="hidden">
        <h1>Báo cáo thống kê cháy rừng tỉnh Thanh Hóa</h1>
        <p className="sub">Năm 2025 — Xuất ngày {new Date().toLocaleDateString('vi-VN')}</p>
        {stats && (
          <>
            <h2 style={{ marginTop: 16, marginBottom: 8, fontSize: 13 }}>Tổng quan</h2>
            <table>
              <thead><tr><th>Chỉ số</th><th>Giá trị</th></tr></thead>
              <tbody>
                <tr><td>Tổng điểm cháy</td><td>{stats.total_incidents}</td></tr>
                <tr><td>Độ tin cậy trung bình</td><td>{stats.avg_confidence}%</td></tr>
                <tr><td>Cảm biến hoạt động</td><td>{stats.active_sensors}</td></tr>
                <tr><td>Mức cực cao (&gt;90%)</td><td>{stats.extreme_count}</td></tr>
                <tr><td>Mức cao (70–90%)</td><td>{stats.high_count}</td></tr>
                <tr><td>Mức thấp (&lt;70%)</td><td>{stats.low_count}</td></tr>
              </tbody>
            </table>
          </>
        )}
        <h2 style={{ marginTop: 16, marginBottom: 8, fontSize: 13 }}>Thống kê theo tháng</h2>
        <table>
          <thead><tr><th>Tháng</th><th>Số điểm cháy</th><th>Diện tích (ha)</th></tr></thead>
          <tbody>
            {MONTHLY_DATA.map((d) => (
              <tr key={d.month}><td>{d.month}</td><td>{d.diem_chay}</td><td>{d.dien_tich}</td></tr>
            ))}
            <tr>
              <td><b>Tổng</b></td>
              <td><b>{totalFires}</b></td>
              <td><b>{totalArea}</b></td>
            </tr>
          </tbody>
        </table>
        <h2 style={{ marginTop: 16, marginBottom: 8, fontSize: 13 }}>Thống kê theo huyện</h2>
        <table>
          <thead><tr><th>Huyện</th><th>Số điểm cháy</th></tr></thead>
          <tbody>
            {REGION_DATA.map((d) => (
              <tr key={d.name}><td>{d.name}</td><td>{d.value}</td></tr>
            ))}
          </tbody>
        </table>
        <h2 style={{ marginTop: 16, marginBottom: 8, fontSize: 13 }}>Phân bố trạng thái sự cố</h2>
        <table>
          <thead><tr><th>Trạng thái</th><th>Số lượng</th></tr></thead>
          <tbody>
            {STATUS_DATA.map((d) => (
              <tr key={d.name}><td>{d.name}</td><td>{d.value}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
