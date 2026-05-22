import { useEffect, useState } from 'react'
import api from '../api/client'

interface User {
  id: number
  username: string
  full_name: string
  email: string
  role: 'admin' | 'ranger' | 'viewer'
  is_active: boolean
  created_at: string
  last_login?: string
}


const ROLE_META = {
  admin:  { label: 'Quản trị viên', cls: 'bg-red-50 text-red-600 border-red-200',     icon: 'admin_panel_settings' },
  ranger: { label: 'Kiểm lâm',     cls: 'bg-blue-50 text-blue-600 border-blue-200',   icon: 'forest' },
  viewer: { label: 'Quan sát',     cls: 'bg-slate-50 text-slate-600 border-slate-200', icon: 'visibility' },
}

const SAMPLE_USERS: User[] = [
  { id: 1, username: 'admin',      full_name: 'Nguyễn Văn An',   email: 'an.nguyen@kiemlamthanhhoa.vn',    role: 'admin',  is_active: true,  created_at: '2025-01-01T00:00:00', last_login: '2025-06-15T08:30:00' },
  { id: 2, username: 'ranger01',   full_name: 'Trần Thị Bình',   email: 'binh.tran@kiemlamthanhhoa.vn',   role: 'ranger', is_active: true,  created_at: '2025-01-10T00:00:00', last_login: '2025-06-14T16:00:00' },
  { id: 3, username: 'ranger02',   full_name: 'Lê Văn Cường',    email: 'cuong.le@kiemlamthanhhoa.vn',    role: 'ranger', is_active: true,  created_at: '2025-02-01T00:00:00', last_login: '2025-06-13T09:15:00' },
  { id: 4, username: 'viewer01',   full_name: 'Phạm Thị Dung',   email: 'dung.pham@kiemlamthanhhoa.vn',   role: 'viewer', is_active: true,  created_at: '2025-03-15T00:00:00', last_login: '2025-06-10T11:00:00' },
  { id: 5, username: 'ranger03',   full_name: 'Hoàng Văn Em',    email: 'em.hoang@kiemlamthanhhoa.vn',    role: 'ranger', is_active: false, created_at: '2025-02-20T00:00:00', last_login: '2025-05-01T08:00:00' },
  { id: 6, username: 'viewer02',   full_name: 'Vũ Thị Phương',   email: 'phuong.vu@kiemlamthanhhoa.vn',   role: 'viewer', is_active: true,  created_at: '2025-04-01T00:00:00' },
]

interface ModalProps {
  user: User | null
  onClose: () => void
  onSave: (u: Partial<User>) => void
}

function UserModal({ user, onClose, onSave }: ModalProps) {
  const [form, setForm] = useState({
    full_name: user?.full_name ?? '',
    email:     user?.email ?? '',
    username:  user?.username ?? '',
    role:      user?.role ?? 'viewer' as User['role'],
    is_active: user?.is_active ?? true,
    password:  '',
  })

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* header */}
        <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#1e293b]">
            {user ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
          </h2>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-[#64748b]">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* body */}
        <div className="px-6 py-4 space-y-4">
          {[
            { label: 'Họ và tên', key: 'full_name', type: 'text', placeholder: 'Nguyễn Văn A' },
            { label: 'Tên đăng nhập', key: 'username', type: 'text', placeholder: 'username' },
            { label: 'Email', key: 'email', type: 'email', placeholder: 'email@example.com' },
            { label: user ? 'Mật khẩu mới (bỏ trống để giữ nguyên)' : 'Mật khẩu', key: 'password', type: 'password', placeholder: '••••••••' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-[#64748b] mb-1">{label}</label>
              <input
                type={type}
                value={(form as unknown as Record<string, string>)[key]}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#1565c0] text-[#1e293b]"
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-medium text-[#64748b] mb-1">Vai trò</label>
            <select
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#1565c0] text-[#1e293b] bg-white"
            >
              <option value="admin">Quản trị viên</option>
              <option value="ranger">Kiểm lâm</option>
              <option value="viewer">Quan sát</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => set('is_active', !form.is_active)}
              className={`relative w-10 h-5 rounded-full transition-colors ${form.is_active ? 'bg-[#1565c0]' : 'bg-[#e2e8f0]'}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-xs text-[#64748b]">{form.is_active ? 'Tài khoản đang hoạt động' : 'Tài khoản bị khóa'}</span>
          </div>
        </div>

        {/* footer */}
        <div className="px-6 py-4 border-t border-[#e2e8f0] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#64748b] border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc]">
            Hủy
          </button>
          <button
            onClick={() => { onSave(form); onClose() }}
            className="px-4 py-2 text-sm text-white bg-[#1565c0] rounded-lg hover:bg-[#1251a3] font-medium"
          >
            {user ? 'Lưu thay đổi' : 'Tạo tài khoản'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Users() {
  const [users, setUsers]       = useState<User[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [roleFilter, setRole]   = useState('')
  const [modal, setModal]       = useState<'create' | User | null>(null)
  const [deleteTarget, setDel]  = useState<User | null>(null)

  useEffect(() => {
    api.get('/users')
      .then((r) => setUsers(r.data))
      .catch(() => setUsers(SAMPLE_USERS))
      .finally(() => setLoading(false))
  }, [])

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    const matchSearch = !search
      || u.full_name.toLowerCase().includes(q)
      || u.username.toLowerCase().includes(q)
      || u.email.toLowerCase().includes(q)
    const matchRole = !roleFilter || u.role === roleFilter
    return matchSearch && matchRole
  })

  const handleSave = (data: Partial<User>) => {
    if (modal === 'create') {
      const newUser: User = {
        id: Date.now(),
        username:   data.username ?? '',
        full_name:  data.full_name ?? '',
        email:      data.email ?? '',
        role:       data.role ?? 'viewer',
        is_active:  data.is_active ?? true,
        created_at: new Date().toISOString(),
      }
      setUsers((prev) => [...prev, newUser])
    } else if (modal && typeof modal === 'object') {
      setUsers((prev) => prev.map((u) => u.id === modal.id ? { ...u, ...data } : u))
    }
  }

  const handleDelete = (u: User) => {
    setUsers((prev) => prev.filter((x) => x.id !== u.id))
    setDel(null)
  }

  const toggleActive = (u: User) => {
    setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, is_active: !x.is_active } : x))
  }

  const counts = {
    admin:  users.filter((u) => u.role === 'admin').length,
    ranger: users.filter((u) => u.role === 'ranger').length,
    viewer: users.filter((u) => u.role === 'viewer').length,
    active: users.filter((u) => u.is_active).length,
  }

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-[#1e293b]">Quản lý người dùng</h1>
          <p className="text-xs text-[#64748b] mt-0.5">Phân quyền và quản lý tài khoản hệ thống</p>
        </div>
        <button
          onClick={() => setModal('create')}
          className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-[#1565c0] rounded-lg hover:bg-[#1251a3] font-medium shadow-sm"
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          Thêm người dùng
        </button>
      </div>

      {/* Summary cards */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Quản trị viên', count: counts.admin,  icon: 'admin_panel_settings', color: 'text-red-600',     bg: 'bg-red-50' },
            { label: 'Kiểm lâm',      count: counts.ranger, icon: 'forest',               color: 'text-blue-600',    bg: 'bg-blue-50' },
            { label: 'Quan sát',       count: counts.viewer, icon: 'visibility',            color: 'text-slate-600',   bg: 'bg-slate-50' },
            { label: 'Đang hoạt động', count: counts.active, icon: 'check_circle',          color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map(({ label, count, icon, color, bg }) => (
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

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-sm">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, username, email..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#1565c0] text-[#1e293b]"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRole(e.target.value)}
          className="bg-white border border-[#e2e8f0] text-sm text-[#1e293b] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1565c0]"
        >
          <option value="">Tất cả vai trò</option>
          <option value="admin">Quản trị viên</option>
          <option value="ranger">Kiểm lâm</option>
          <option value="viewer">Quan sát</option>
        </select>
        <span className="text-xs text-[#94a3b8] self-center">{filtered.length} người dùng</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
              {['Người dùng', 'Vai trò', 'Email', 'Trạng thái', 'Đăng nhập cuối', 'Thao tác'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-[#f1f5f9]">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-[#f1f5f9] rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-[#94a3b8] text-xs">Không có dữ liệu</td></tr>
            ) : (
              filtered.map((u) => {
                const rm = ROLE_META[u.role]
                return (
                  <tr key={u.id} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors">
                    {/* Avatar + name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1565c0] flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-semibold">
                            {u.full_name.split(' ').pop()?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-[#1e293b] text-xs">{u.full_name}</p>
                          <p className="text-[10px] text-[#94a3b8]">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    {/* Role */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${rm.cls}`}>
                        <span className="material-symbols-outlined text-xs" style={{ fontSize: 12 }}>{rm.icon}</span>
                        {rm.label}
                      </span>
                    </td>
                    {/* Email */}
                    <td className="px-4 py-3 text-xs text-[#64748b]">{u.email}</td>
                    {/* Status toggle */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(u)}
                        className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border font-medium transition-colors ${
                          u.is_active
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            : 'bg-slate-50 text-slate-400 border-slate-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        {u.is_active ? 'Hoạt động' : 'Đã khóa'}
                      </button>
                    </td>
                    {/* Last login */}
                    <td className="px-4 py-3 text-xs text-[#64748b] whitespace-nowrap">
                      {u.last_login ? new Date(u.last_login).toLocaleString('vi-VN') : '—'}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setModal(u)}
                          className="p-1.5 rounded hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#1565c0] transition-colors"
                          title="Chỉnh sửa"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button
                          onClick={() => setDel(u)}
                          className="p-1.5 rounded hover:bg-red-50 text-[#64748b] hover:text-red-500 transition-colors"
                          title="Xóa"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Role permission legend */}
      <div className="mt-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4">
        <h3 className="text-xs font-semibold text-[#64748b] mb-3 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm">info</span>
          Phân quyền theo vai trò
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              role: 'admin', label: 'Quản trị viên', icon: 'admin_panel_settings', color: 'text-red-600',
              perms: ['Toàn quyền hệ thống', 'Quản lý người dùng', 'Xem & xử lý mọi sự cố', 'Cấu hình hệ thống'],
            },
            {
              role: 'ranger', label: 'Kiểm lâm', icon: 'forest', color: 'text-blue-600',
              perms: ['Xem bản đồ & điểm cháy', 'Tạo & cập nhật sự cố', 'Nhận thông báo khẩn', 'Xem báo cáo'],
            },
            {
              role: 'viewer', label: 'Quan sát', icon: 'visibility', color: 'text-slate-600',
              perms: ['Xem bản đồ (chỉ đọc)', 'Xem danh sách sự cố', 'Xem thống kê', 'Không thể chỉnh sửa'],
            },
          ].map(({ label, icon, color, perms }) => (
            <div key={label}>
              <p className={`text-xs font-medium ${color} flex items-center gap-1 mb-2`}>
                <span className="material-symbols-outlined text-sm">{icon}</span>
                {label}
              </p>
              <ul className="space-y-1">
                {perms.map((p) => (
                  <li key={p} className="text-[11px] text-[#64748b] flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-[#cbd5e1] flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {modal !== null && (
        <UserModal
          user={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500">delete</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1e293b]">Xóa người dùng</p>
                <p className="text-xs text-[#64748b]">{deleteTarget.full_name}</p>
              </div>
            </div>
            <p className="text-xs text-[#64748b] mb-4">
              Bạn có chắc chắn muốn xóa tài khoản <strong>{deleteTarget.username}</strong>? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDel(null)} className="px-4 py-2 text-sm text-[#64748b] border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc]">
                Hủy
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                className="px-4 py-2 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600 font-medium"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
