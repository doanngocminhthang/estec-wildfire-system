import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-[#f0f4f8]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-11 border-b border-[#e2e8f0] bg-white flex items-center px-5 gap-3 flex-shrink-0 shadow-sm">
          <span className="material-symbols-outlined text-[#1565c0] text-base">shield</span>
          <span className="text-xs text-[#64748b]">
            Hệ thống Phòng cháy chữa cháy rừng tỉnh Thanh Hóa
          </span>
          <div className="ml-auto flex items-center gap-2 text-xs text-[#64748b]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Trực tuyến
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
