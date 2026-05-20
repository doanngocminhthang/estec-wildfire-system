import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const links = [
  { to: '/dashboard', icon: 'dashboard',             label: 'Tổng quan' },
  { to: '/map',       icon: 'map',                   label: 'Bản đồ' },
  { to: '/incidents', icon: 'local_fire_department', label: 'Sự cố' },
  { to: '/hotspots',  icon: 'crisis_alert',          label: 'Điểm cháy' },
  { to: '/analytics', icon: 'bar_chart',             label: 'Thống kê' },
]

const adminLinks = [
  { to: '/users', icon: 'group', label: 'Người dùng' },
]

export default function Sidebar() {
  const { user, logout, hasRole } = useAuthStore()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside className="flex flex-col w-16 lg:w-60 min-h-screen bg-[#1a2e4a] flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 py-4 border-b border-white/10">
        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-[#1565c0] rounded">
          <span className="material-symbols-outlined text-white text-lg">forest</span>
        </div>
        <div className="hidden lg:block min-w-0">
          <p className="text-[10px] text-white/40 uppercase tracking-wider leading-tight">Hệ thống</p>
          <p className="text-xs font-semibold text-white leading-tight truncate">PCCCR Thanh Hóa</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {links.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-[#1565c0] text-white'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <span className="material-symbols-outlined text-xl flex-shrink-0">{icon}</span>
            <span className="hidden lg:block">{label}</span>
          </NavLink>
        ))}

        {hasRole('admin') && (
          <>
            <div className="my-2 border-t border-white/10" />
            <p className="hidden lg:block px-2.5 pb-1 text-[10px] uppercase tracking-wider text-white/30">
              Quản trị
            </p>
            {adminLinks.map(({ to, icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-[#1565c0] text-white'
                      : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <span className="material-symbols-outlined text-xl flex-shrink-0">{icon}</span>
                <span className="hidden lg:block">{label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User */}
      <div className="p-2 border-t border-white/10">
        <div className="flex items-center gap-2 px-2 py-2">
          <span className="material-symbols-outlined text-white/40 text-xl flex-shrink-0">account_circle</span>
          <span className="hidden lg:block text-xs text-white/50 truncate flex-1">{user?.username}</span>
          <button
            onClick={handleLogout}
            title="Đăng xuất"
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
