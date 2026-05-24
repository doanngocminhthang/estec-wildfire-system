import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import api from '../api/client'

type Tab = 'info' | 'password' | 'notifications'

interface NotifPrefs {
  channels: { inapp: boolean; email: boolean; push: boolean }
  minSeverity: 'low' | 'medium' | 'high' | 'critical'
  events: { newHotspot: boolean; newIncident: boolean; taskAssigned: boolean; taskOverdue: boolean }
}

const DEFAULT_PREFS: NotifPrefs = {
  channels: { inapp: true, email: false, push: false },
  minSeverity: 'medium',
  events: { newHotspot: true, newIncident: true, taskAssigned: true, taskOverdue: true },
}

function loadPrefs(): NotifPrefs {
  try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem('wf-notif-prefs') ?? '{}') } }
  catch { return DEFAULT_PREFS }
}

function Toggle({ on, onChange, disabled = false }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!on)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${on ? 'bg-[#1565c0]' : 'bg-[#cbd5e1]'}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

function Field({ label, value, editing, onChange, type = 'text', disabled = false }: {
  label: string; value: string; editing: boolean
  onChange: (v: string) => void; type?: string; disabled?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#64748b] mb-1">{label}</label>
      {editing && !disabled ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#1565c0] text-[#1e293b]"
        />
      ) : (
        <p className={`text-sm px-3 py-2 rounded-lg ${disabled ? 'text-[#94a3b8]' : 'text-[#1e293b]'} bg-[#f8fafc] border border-transparent`}>
          {value || '—'}
        </p>
      )}
    </div>
  )
}

export default function Profile() {
  const { user } = useAuthStore()
  const [tab, setTab]         = useState<Tab>('info')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const [form, setForm] = useState({
    full_name: (user as { full_name?: string })?.full_name ?? '',
    email:     user?.email ?? '',
    phone:     (user as { phone?: string })?.phone ?? '',
    unit:      (user as { unit?: string })?.unit ?? 'Hạt Kiểm lâm Thanh Hóa',
  })

  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' })
  const [pwdMsg, setPwdMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [pwdSaving, setPwdSaving] = useState(false)

  // Notification prefs
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS)
  const [prefsSaved, setPrefsSaved] = useState(false)
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    setPrefs(loadPrefs())
    if ('Notification' in window) setPushPermission(Notification.permission)
  }, [])

  const setChannel = (k: keyof NotifPrefs['channels'], v: boolean) =>
    setPrefs(p => ({ ...p, channels: { ...p.channels, [k]: v } }))
  const setEvent = (k: keyof NotifPrefs['events'], v: boolean) =>
    setPrefs(p => ({ ...p, events: { ...p.events, [k]: v } }))

  const handleSavePrefs = () => {
    localStorage.setItem('wf-notif-prefs', JSON.stringify(prefs))
    setPrefsSaved(true)
    setTimeout(() => setPrefsSaved(false), 2500)
  }

  const requestPush = async () => {
    if (!('Notification' in window)) return
    const perm = await Notification.requestPermission()
    setPushPermission(perm)
    if (perm === 'granted') setChannel('push', true)
  }

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    setMsg(null)
    try {
      await api.patch('/users/me', form)
      setMsg({ type: 'ok', text: 'Đã lưu thông tin thành công.' })
      setEditing(false)
    } catch {
      setMsg({ type: 'err', text: 'Không thể lưu. Vui lòng thử lại.' })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setForm({
      full_name: (user as { full_name?: string })?.full_name ?? '',
      email:     user?.email ?? '',
      phone:     (user as { phone?: string })?.phone ?? '',
      unit:      (user as { unit?: string })?.unit ?? 'Hạt Kiểm lâm Thanh Hóa',
    })
    setEditing(false)
    setMsg(null)
  }

  const handleChangePassword = async () => {
    setPwdMsg(null)
    if (pwd.next !== pwd.confirm) {
      setPwdMsg({ type: 'err', text: 'Mật khẩu xác nhận không khớp.' })
      return
    }
    if (pwd.next.length < 8) {
      setPwdMsg({ type: 'err', text: 'Mật khẩu mới phải có ít nhất 8 ký tự.' })
      return
    }
    setPwdSaving(true)
    try {
      await api.post('/auth/change-password', { current_password: pwd.current, new_password: pwd.next })
      setPwdMsg({ type: 'ok', text: 'Đã đổi mật khẩu thành công.' })
      setPwd({ current: '', next: '', confirm: '' })
    } catch {
      setPwdMsg({ type: 'err', text: 'Mật khẩu hiện tại không đúng hoặc có lỗi xảy ra.' })
    } finally {
      setPwdSaving(false)
    }
  }

  const roleLabel = (user as { roles?: { name: string }[] })?.roles?.[0]?.name === 'admin'
    ? 'Quản trị viên'
    : (user as { roles?: { name: string }[] })?.roles?.[0]?.name === 'ranger'
    ? 'Kiểm lâm'
    : 'Quan sát'

  const initial = (form.full_name || user?.username || '?').split(' ').pop()?.charAt(0).toUpperCase() ?? '?'

  return (
    <div className="p-6 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg font-bold text-[#1e293b]">Thông tin cá nhân</h1>
        <p className="text-xs text-[#64748b] mt-0.5">Quản lý hồ sơ và cài đặt tài khoản</p>
      </div>

      {/* Avatar + name card */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-sm mb-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#1565c0] flex items-center justify-center flex-shrink-0 shadow">
          <span className="text-white text-2xl font-bold">{initial}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#1e293b]">{form.full_name || user?.username}</p>
          <p className="text-xs text-[#64748b]">@{user?.username}</p>
          <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 font-medium">
            {roleLabel}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-1 w-fit">
        {([
          { id: 'info',          label: 'Thông tin',    icon: 'person' },
          { id: 'password',      label: 'Đổi mật khẩu', icon: 'lock' },
          { id: 'notifications', label: 'Thông báo',    icon: 'notifications' },
        ] as const).map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => { setTab(id); setMsg(null); setPwdMsg(null) }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === id
                ? 'bg-white shadow-sm text-[#1565c0] border border-[#e2e8f0]'
                : 'text-[#64748b] hover:text-[#1e293b]'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Info */}
      {tab === 'info' && (
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Họ và tên"       value={form.full_name} editing={editing} onChange={(v) => set('full_name', v)} />
            <Field label="Tên đăng nhập"   value={user?.username ?? ''} editing={editing} onChange={() => {}} disabled />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email"           value={form.email}     editing={editing} onChange={(v) => set('email', v)} type="email" />
            <Field label="Số điện thoại"   value={form.phone}     editing={editing} onChange={(v) => set('phone', v)} type="tel" />
          </div>
          <Field label="Đơn vị công tác"  value={form.unit}      editing={editing} onChange={(v) => set('unit', v)} />

          {msg && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-xs ${
              msg.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
            }`}>
              <span className="material-symbols-outlined text-sm">
                {msg.type === 'ok' ? 'check_circle' : 'error'}
              </span>
              {msg.text}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            {editing ? (
              <>
                <button onClick={handleCancel} className="px-4 py-2 text-sm text-[#64748b] border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc]">
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 text-sm text-white bg-[#1565c0] rounded-lg hover:bg-[#1251a3] font-medium disabled:opacity-60"
                >
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-[#1565c0] rounded-lg hover:bg-[#1251a3] font-medium"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Chỉnh sửa
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab: Notifications */}
      {tab === 'notifications' && (
        <div className="space-y-4">

          {/* Kênh nhận thông báo */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-[#1e293b] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1565c0] text-base">sensors</span>
              Kênh nhận thông báo
            </h2>
            <div className="space-y-3">
              {/* In-app */}
              <div className="flex items-center justify-between py-2 border-b border-[#f1f5f9]">
                <div>
                  <p className="text-sm font-medium text-[#1e293b]">Trong ứng dụng</p>
                  <p className="text-xs text-[#64748b]">Chuông thông báo góc trên phải màn hình</p>
                </div>
                <Toggle on={prefs.channels.inapp} onChange={(v) => setChannel('inapp', v)} />
              </div>

              {/* Email */}
              <div className="flex items-center justify-between py-2 border-b border-[#f1f5f9]">
                <div>
                  <p className="text-sm font-medium text-[#1e293b]">Email</p>
                  <p className="text-xs text-[#64748b]">{user?.email ?? '—'}</p>
                </div>
                <Toggle on={prefs.channels.email} onChange={(v) => setChannel('email', v)} />
              </div>

              {/* Push */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-[#1e293b]">Push (trình duyệt)</p>
                  <p className="text-xs text-[#64748b]">
                    {pushPermission === 'granted' ? 'Đã cấp quyền'
                      : pushPermission === 'denied' ? 'Đã từ chối — mở lại trong cài đặt trình duyệt'
                      : 'Chưa cấp quyền thông báo'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {pushPermission === 'default' && (
                    <button onClick={requestPush}
                      className="text-xs text-[#1565c0] border border-[#1565c0] px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap">
                      Cho phép
                    </button>
                  )}
                  <Toggle
                    on={prefs.channels.push && pushPermission === 'granted'}
                    onChange={(v) => setChannel('push', v)}
                    disabled={pushPermission !== 'granted'}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Mức độ tối thiểu */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-[#1e293b] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#f59e0b] text-base">tune</span>
              Mức độ nguy hiểm tối thiểu
            </h2>
            <p className="text-xs text-[#64748b]">Chỉ nhận thông báo từ mức này trở lên</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: 'low',      label: 'Tất cả (thấp+)',  color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
                { id: 'medium',   label: 'Trung bình+',     color: 'text-amber-600   bg-amber-50   border-amber-200'   },
                { id: 'high',     label: 'Cao+',            color: 'text-orange-600  bg-orange-50  border-orange-200'  },
                { id: 'critical', label: 'Chỉ khẩn cấp',   color: 'text-red-600     bg-red-50     border-red-200'     },
              ] as const).map(({ id, label, color }) => (
                <button key={id} onClick={() => setPrefs(p => ({ ...p, minSeverity: id }))}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                    prefs.minSeverity === id ? color + ' ring-2 ring-offset-1 ring-current' : 'border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]'
                  }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    id === 'low' ? 'bg-emerald-500' : id === 'medium' ? 'bg-amber-500' : id === 'high' ? 'bg-orange-500' : 'bg-red-500'
                  }`} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Loại sự kiện */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-[#1e293b] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#64748b] text-base">checklist</span>
              Loại sự kiện
            </h2>
            <div className="space-y-2">
              {([
                { key: 'newHotspot',   icon: 'crisis_alert',          label: 'Điểm cháy mới phát hiện',     desc: 'Khi cảm biến/vệ tinh phát hiện hotspot' },
                { key: 'newIncident',  icon: 'local_fire_department',  label: 'Sự cố mới được tạo',          desc: 'Khi admin tạo một incident mới' },
                { key: 'taskAssigned', icon: 'assignment_ind',         label: 'Nhiệm vụ được giao cho tôi',  desc: 'Khi admin giao nhiệm vụ xác minh' },
                { key: 'taskOverdue',  icon: 'schedule',               label: 'Nhiệm vụ trễ deadline',       desc: 'Nhắc nhở khi nhiệm vụ sắp hoặc đã trễ hạn' },
              ] as const).map(({ key, icon, label, desc }) => {
                const on = prefs.events[key]
                return (
                  <label key={key} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#f8fafc] cursor-pointer group transition-colors">
                    <input type="checkbox" checked={on} onChange={() => setEvent(key, !on)} className="hidden" />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${on ? 'bg-[#1565c0] border-[#1565c0]' : 'border-[#cbd5e1] group-hover:border-[#1565c0]'}`}>
                      {on && <svg className="w-3 h-3 text-white" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5 L4 7.5 L8.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>}
                    </div>
                    <span className="material-symbols-outlined text-base text-[#64748b] flex-shrink-0">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${on ? 'text-[#1e293b]' : 'text-[#94a3b8]'}`}>{label}</p>
                      <p className="text-xs text-[#94a3b8]">{desc}</p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#94a3b8]">Cài đặt được lưu trên thiết bị này</p>
            <button onClick={handleSavePrefs}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-[#1565c0] rounded-lg hover:bg-[#1251a3] font-medium transition-colors">
              {prefsSaved
                ? <><span className="material-symbols-outlined text-sm">check_circle</span>Đã lưu</>
                : <><span className="material-symbols-outlined text-sm">save</span>Lưu cài đặt</>}
            </button>
          </div>
        </div>
      )}

      {/* Tab: Password */}
      {tab === 'password' && (
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 shadow-sm space-y-4">
          <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] text-xs text-[#64748b] flex items-start gap-2">
            <span className="material-symbols-outlined text-sm text-[#94a3b8] mt-0.5">info</span>
            <span>Mật khẩu mới phải có ít nhất 8 ký tự, nên bao gồm chữ hoa, chữ thường và số.</span>
          </div>

          {[
            { label: 'Mật khẩu hiện tại', key: 'current' },
            { label: 'Mật khẩu mới',      key: 'next' },
            { label: 'Xác nhận mật khẩu', key: 'confirm' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-[#64748b] mb-1">{label}</label>
              <input
                type="password"
                value={(pwd as Record<string, string>)[key]}
                onChange={(e) => setPwd((p) => ({ ...p, [key]: e.target.value }))}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#1565c0] text-[#1e293b]"
              />
            </div>
          ))}

          {pwdMsg && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-xs ${
              pwdMsg.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
            }`}>
              <span className="material-symbols-outlined text-sm">
                {pwdMsg.type === 'ok' ? 'check_circle' : 'error'}
              </span>
              {pwdMsg.text}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleChangePassword}
              disabled={pwdSaving || !pwd.current || !pwd.next || !pwd.confirm}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-[#1565c0] rounded-lg hover:bg-[#1251a3] font-medium disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-sm">lock_reset</span>
              {pwdSaving ? 'Đang đổi...' : 'Đổi mật khẩu'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
