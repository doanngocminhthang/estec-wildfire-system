import { useEffect, useRef, useState } from 'react'
import dataApi from '../api/dataClient'
import api from '../api/client'
import { downloadCSVRaw, printElement } from '../utils/exportUtils'

// ── Types ─────────────────────────────────────────────────────────────────────
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

interface Ranger {
  id: number
  username: string
  email: string
  roles: { name: string }[]
}

interface Task {
  id: number
  incident_id: number
  status: string
  deadline: string | null
  note: string | null
  result_note: string | null
  assigned_to: { id: number; username: string; email: string } | null
  assigned_by: { id: number; username: string; email: string } | null
  created_at: string
}

// ── Style maps ────────────────────────────────────────────────────────────────
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
const TASK_STATUS_STYLE: Record<string, string> = {
  pending:     'text-slate-600 bg-slate-50 border-slate-200',
  in_progress: 'text-blue-600 bg-blue-50 border-blue-200',
  done:        'text-emerald-600 bg-emerald-50 border-emerald-200',
  cancelled:   'text-red-400 bg-red-50 border-red-100',
}
const TASK_STATUS_LABEL: Record<string, string> = {
  pending:     'Chờ xử lý',
  in_progress: 'Đang thực hiện',
  done:        'Hoàn thành',
  cancelled:   'Đã hủy',
}

// ── Incident Export Menu ──────────────────────────────────────────────────────
function IncidentExportMenu({ onCSV, onPrint }: { onCSV: () => void; onPrint: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1565c0] border border-[#1565c0] rounded-lg hover:bg-[#e8f0fe] transition-colors"
      >
        <span className="material-symbols-outlined text-sm">download</span>
        Xuất báo cáo
        <span className="material-symbols-outlined text-xs">{open ? 'expand_less' : 'expand_more'}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white border border-[#e2e8f0] rounded-lg shadow-lg z-20 overflow-hidden">
          <button
            onClick={() => { onCSV(); setOpen(false) }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-[#1e293b] hover:bg-[#f8fafc]"
          >
            <span className="material-symbols-outlined text-sm text-emerald-600">table_view</span>
            Xuất CSV / Excel
          </button>
          <button
            onClick={() => { onPrint(); setOpen(false) }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-[#1e293b] hover:bg-[#f8fafc] border-t border-[#f1f5f9]"
          >
            <span className="material-symbols-outlined text-sm text-red-500">picture_as_pdf</span>
            In / Xuất PDF
          </button>
        </div>
      )}
    </div>
  )
}

// ── Task Assign Modal ─────────────────────────────────────────────────────────
function AssignModal({ incident, rangers, onClose, onAssigned }: {
  incident: Incident
  rangers: Ranger[]
  onClose: () => void
  onAssigned: (task: Task) => void
}) {
  const [assignTo, setAssignTo] = useState('')
  const [deadline, setDeadline] = useState('')
  const [note,     setNote]     = useState('')
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  async function handleSubmit() {
    if (!assignTo) { setError('Vui lòng chọn kiểm lâm viên'); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        incident_id:    incident.id,
        assigned_to_id: Number(assignTo),
        deadline:       deadline ? new Date(deadline).toISOString() : null,
        note:           note || null,
      }
      const { data } = await api.post<Task>('/tasks/', payload)
      onAssigned(data)
      onClose()
    } catch {
      setError('Không thể giao nhiệm vụ. Kiểm tra lại quyền hoặc kết nối.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f8fafc]">
          <div>
            <h2 className="text-sm font-semibold text-[#1e293b]">Giao nhiệm vụ xác minh</h2>
            <p className="text-xs text-[#94a3b8] mt-0.5">{incident.incident_code} — {incident.title}</p>
          </div>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-[#64748b]">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#64748b] mb-1">
              Kiểm lâm viên <span className="text-red-500">*</span>
            </label>
            <select
              value={assignTo}
              onChange={(e) => setAssignTo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#1565c0] text-[#1e293b] bg-white"
            >
              <option value="">-- Chọn kiểm lâm --</option>
              {rangers.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.username} ({r.email})
                </option>
              ))}
            </select>
            {rangers.length === 0 && (
              <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">warning</span>
                Chưa có kiểm lâm viên nào. Cần restart backend để seed dữ liệu.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#64748b] mb-1">Thời hạn hoàn thành</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#1565c0] text-[#1e293b]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#64748b] mb-1">Ghi chú nhiệm vụ</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Mô tả nhiệm vụ, khu vực cần xác minh..."
              className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#1565c0] text-[#1e293b] resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-xs text-red-600">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e2e8f0] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#64748b] border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc]">
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-[#1565c0] rounded-lg hover:bg-[#1251a3] font-medium disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-sm">assignment_ind</span>
            {saving ? 'Đang giao...' : 'Giao nhiệm vụ'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Task List Panel ───────────────────────────────────────────────────────────
function TaskPanel({ incident, onClose }: { incident: Incident; onClose: () => void }) {
  const [tasks,   setTasks]   = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Task[]>(`/tasks/?incident_id=${incident.id}`)
      .then(({ data }) => setTasks(data))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false))
  }, [incident.id])

  async function updateStatus(taskId: number, status: string) {
    try {
      const { data } = await api.patch<Task>(`/tasks/${taskId}/status`, { status })
      setTasks((prev) => prev.map((t) => t.id === taskId ? data : t))
    } catch { /**/ }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f8fafc]">
          <div>
            <h2 className="text-sm font-semibold text-[#1e293b]">Nhiệm vụ xác minh</h2>
            <p className="text-xs text-[#94a3b8] mt-0.5">{incident.incident_code} — {incident.title}</p>
          </div>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-[#64748b]">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="space-y-3">
              {[1,2].map((i) => <div key={i} className="h-16 bg-[#f1f5f9] rounded-lg animate-pulse" />)}
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#94a3b8]">
              <span className="material-symbols-outlined text-3xl block mb-2 text-[#cbd5e1]">assignment</span>
              Chưa có nhiệm vụ nào cho sự cố này
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((t) => (
                <div key={t.id} className="border border-[#e2e8f0] rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${TASK_STATUS_STYLE[t.status]}`}>
                          {TASK_STATUS_LABEL[t.status]}
                        </span>
                        {t.deadline && (
                          <span className="text-[10px] text-[#94a3b8] flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-xs">schedule</span>
                            {new Date(t.deadline).toLocaleString('vi-VN')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-[#1e293b] mt-1.5">
                        Kiểm lâm: <span className="text-[#1565c0]">{t.assigned_to?.username ?? '—'}</span>
                      </p>
                      {t.note && <p className="text-xs text-[#64748b] mt-1">{t.note}</p>}
                      {t.result_note && (
                        <p className="text-xs text-emerald-700 mt-1 bg-emerald-50 px-2 py-1 rounded">
                          Kết quả: {t.result_note}
                        </p>
                      )}
                    </div>
                    <select
                      value={t.status}
                      onChange={(e) => updateStatus(t.id, e.target.value)}
                      className="text-[10px] border border-[#e2e8f0] rounded-lg px-2 py-1 bg-white text-[#1e293b] focus:outline-none focus:border-[#1565c0] flex-shrink-0"
                    >
                      <option value="pending">Chờ xử lý</option>
                      <option value="in_progress">Đang thực hiện</option>
                      <option value="done">Hoàn thành</option>
                      <option value="cancelled">Hủy</option>
                    </select>
                  </div>
                  <p className="text-[10px] text-[#94a3b8]">
                    Giao bởi: {t.assigned_by?.username ?? '—'} · {new Date(t.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-[#e2e8f0] bg-[#f8fafc] text-right">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#64748b] border border-[#e2e8f0] rounded-lg hover:bg-white">
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Incidents() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading,   setLoading]   = useState(true)
  const [filter,    setFilter]    = useState('')
  const [rangers,   setRangers]   = useState<Ranger[]>([])
  const [assignFor, setAssignFor] = useState<Incident | null>(null)
  const [taskFor,   setTaskFor]   = useState<Incident | null>(null)
  // task count per incident (loaded lazily)
  const [taskCounts, setTaskCounts] = useState<Record<number, number>>({})

  // Load incidents
  useEffect(() => {
    setLoading(true)
    const url = filter ? `/incidents?status=${filter}` : '/incidents'
    dataApi.get<Incident[]>(url)
      .then((r) => setIncidents(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [filter])

  // Load rangers for assign modal — fallback: show all active users
  useEffect(() => {
    api.get<Ranger[]>('/users/')
      .then(({ data }) => {
        const rangerList = data.filter((u) =>
          u.roles.some((ro) => ro.name === 'ranger' || ro.name === 'dispatcher')
        )
        setRangers(rangerList.length ? rangerList : data)
      })
      .catch(() => {
        // API failed (e.g. not admin) — try fetching current user at least
        api.get<Ranger>('/users/me')
          .then(({ data }) => setRangers([data]))
          .catch(() => setRangers([]))
      })
  }, [])

  // Load task counts for all incidents
  useEffect(() => {
    if (incidents.length === 0) return
    api.get<{ incident_id: number; count: number }[]>('/tasks/')
      .then(({ data }) => {
        const counts: Record<number, number> = {}
        data.forEach((t) => { counts[t.incident_id] = (counts[t.incident_id] ?? 0) + 1 })
        setTaskCounts(counts)
      })
      .catch(() => { /* silent */ })
  }, [incidents])

  async function updateStatus(id: number, status: string) {
    await dataApi.patch(`/incidents/${id}/status`, { status })
    setIncidents((prev) => prev.map((i) => i.id === id ? { ...i, status } : i))
  }

  function handleAssigned(task: Task) {
    setTaskCounts((prev) => ({ ...prev, [task.incident_id]: (prev[task.incident_id] ?? 0) + 1 }))
  }

  function exportIncidentsCSV() {
    downloadCSVRaw(
      `su-co-chay-rung-${Date.now()}.csv`,
      ['incident_code', 'title', 'status', 'priority', 'burn_area_acres', 'latitude', 'longitude', 'created_at', 'updated_at'],
      ['Mã sự cố', 'Tiêu đề', 'Trạng thái', 'Mức độ', 'Diện tích (ha)', 'Vĩ độ', 'Kinh độ', 'Ngày tạo', 'Cập nhật'],
      incidents.map((i) => ({
        incident_code: i.incident_code,
        title: i.title,
        status: STATUS_LABEL[i.status] ?? i.status,
        priority: i.priority.toUpperCase(),
        burn_area_acres: i.burn_area_acres,
        latitude: i.latitude ?? '',
        longitude: i.longitude ?? '',
        created_at: new Date(i.created_at).toLocaleString('vi-VN'),
        updated_at: new Date(i.updated_at).toLocaleString('vi-VN'),
      })),
    )
  }

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-[#1e293b]">Quản lý sự cố</h1>
          <p className="text-xs text-[#64748b] mt-0.5">Theo dõi, cập nhật trạng thái và giao nhiệm vụ xác minh</p>
        </div>
        <IncidentExportMenu
          onCSV={exportIncidentsCSV}
          onPrint={() => printElement('incidents-print-area', 'Danh sách sự cố cháy rừng')}
        />
      </div>

      {/* Filter */}
      <div className="flex justify-end mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-white border border-[#e2e8f0] text-sm text-[#1e293b] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1565c0] shadow-sm"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="uncontrolled">Chưa kiểm soát</option>
          <option value="containing">Đang kiểm soát</option>
          <option value="controlled">Đã kiểm soát</option>
        </select>
      </div>

      {/* List */}
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
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-mono text-[#94a3b8]">{inc.incident_code}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[inc.status] ?? ''}`}>
                    {STATUS_LABEL[inc.status] ?? inc.status}
                  </span>
                  <span className={`text-xs ${PRIORITY_STYLE[inc.priority] ?? ''}`}>
                    {inc.priority.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm font-medium text-[#1e293b] truncate">{inc.title}</p>
                <p className="text-xs text-[#94a3b8] mt-0.5">
                  {inc.burn_area_acres} ha · {new Date(inc.updated_at).toLocaleString('vi-VN')}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Task count badge + view */}
                <button
                  onClick={() => setTaskFor(inc)}
                  className="relative flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#64748b] border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] transition-colors"
                  title="Xem nhiệm vụ"
                >
                  <span className="material-symbols-outlined text-sm">assignment</span>
                  <span>Nhiệm vụ</span>
                  {(taskCounts[inc.id] ?? 0) > 0 && (
                    <span className="ml-0.5 min-w-[16px] h-4 px-1 bg-[#1565c0] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {taskCounts[inc.id]}
                    </span>
                  )}
                </button>

                {/* Assign button */}
                <button
                  onClick={() => setAssignFor(inc)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white bg-[#1565c0] rounded-lg hover:bg-[#1251a3] transition-colors font-medium"
                  title="Giao nhiệm vụ"
                >
                  <span className="material-symbols-outlined text-sm">assignment_ind</span>
                  Giao
                </button>

                {/* Status select */}
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
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {assignFor && (
        <AssignModal
          incident={assignFor}
          rangers={rangers}
          onClose={() => setAssignFor(null)}
          onAssigned={handleAssigned}
        />
      )}
      {taskFor && (
        <TaskPanel
          incident={taskFor}
          onClose={() => setTaskFor(null)}
        />
      )}

      {/* Hidden print area */}
      <div id="incidents-print-area" className="hidden">
        <h1>Danh sách sự cố cháy rừng</h1>
        <p className="sub">Xuất ngày {new Date().toLocaleDateString('vi-VN')} — Tổng: {incidents.length} sự cố</p>
        <table>
          <thead>
            <tr>
              <th>Mã sự cố</th>
              <th>Tiêu đề</th>
              <th>Trạng thái</th>
              <th>Mức độ</th>
              <th>Diện tích (ha)</th>
              <th>Tọa độ</th>
              <th>Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((i) => (
              <tr key={i.id}>
                <td style={{ fontFamily: 'monospace' }}>{i.incident_code}</td>
                <td>{i.title}</td>
                <td>{STATUS_LABEL[i.status] ?? i.status}</td>
                <td>{i.priority.toUpperCase()}</td>
                <td>{i.burn_area_acres}</td>
                <td>{i.latitude != null ? `${i.latitude}, ${i.longitude}` : '—'}</td>
                <td>{new Date(i.created_at).toLocaleDateString('vi-VN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
