import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api/client'

// ---------- Types ----------

interface APIKey {
  id: number
  name: string
  key_prefix: string
  is_active: boolean
  last_used_at: string | null
  expires_at: string | null
  created_at: string
  raw_key?: string
}

interface WebhookItem {
  id: number
  name: string
  url: string
  events: string[]
  is_active: boolean
  last_triggered_at: string | null
  failure_count: number
  created_at: string
  secret?: string
}

const EVENT_OPTIONS = [
  { id: 'hotspot_new',       label: 'hotspot_new',       desc: 'Điểm cháy mới từ vệ tinh/cảm biến' },
  { id: 'incident_new',      label: 'incident_new',      desc: 'Sự cố mới được tạo' },
  { id: 'incident_updated',  label: 'incident_updated',  desc: 'Cập nhật trạng thái sự cố' },
  { id: 'alert_critical',    label: 'alert_critical',    desc: 'Cảnh báo mức cực cao (>90%)' },
]

// ---------- Sub-components ----------

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="ml-2 px-2 py-0.5 rounded text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors">
      {copied ? '✓ Đã sao chép' : 'Sao chép'}
    </button>
  )
}

function SecretReveal({ label, value }: { label: string; value: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
      <div className="font-semibold text-yellow-800 mb-1">⚠ {label} — chỉ hiển thị một lần, lưu lại ngay!</div>
      <div className="flex items-center gap-2 font-mono text-xs break-all text-gray-800">
        {show ? value : '•'.repeat(32)}
        <button onClick={() => setShow(v => !v)} className="shrink-0 text-blue-600 underline">{show ? 'Ẩn' : 'Hiện'}</button>
        <CopyBtn text={value} />
      </div>
    </div>
  )
}

// ---------- Tab: API Keys ----------

function KeysTab() {
  const [keys, setKeys] = useState<APIKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<APIKey | null>(null)

  const load = useCallback(async () => {
    try {
      const r = await api.get<APIKey[]>('/integrations/api-keys')
      setKeys(r.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const r = await api.post<APIKey>('/integrations/api-keys', { name: newName.trim() })
      setCreated(r.data)
      setKeys(prev => [r.data, ...prev])
      setNewName('')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Xóa API key này?')) return
    await api.delete(`/integrations/api-keys/${id}`)
    setKeys(prev => prev.filter(k => k.id !== id))
  }

  const fmt = (s: string | null) => s ? new Date(s).toLocaleDateString('vi-VN') : '—'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">API keys cho phép hệ thống bên ngoài truy cập API với quyền chỉ đọc.</p>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
          <span className="material-icons text-base">add</span>
          Tạo API Key
        </button>
      </div>

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-lg mb-4">Tạo API Key mới</h3>
            <label className="block text-sm text-gray-600 mb-1">Tên / Mô tả</label>
            <input value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="VD: Hệ thống UBND Tỉnh"
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={e => e.key === 'Enter' && handleCreate()} />
            {created?.raw_key && <SecretReveal label="API Key" value={created.raw_key} />}
            <div className="flex justify-end gap-2 mt-4">
              {!created ? (
                <>
                  <button onClick={() => { setShowModal(false); setCreated(null); setNewName('') }}
                    className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200">Hủy</button>
                  <button onClick={handleCreate} disabled={creating || !newName.trim()}
                    className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50">
                    {creating ? 'Đang tạo...' : 'Tạo key'}
                  </button>
                </>
              ) : (
                <button onClick={() => { setShowModal(false); setCreated(null) }}
                  className="px-4 py-2 text-sm rounded-lg bg-green-600 hover:bg-green-700 text-white">
                  Đã lưu key, đóng
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Keys table */}
      {loading ? (
        <div className="text-sm text-gray-400">Đang tải...</div>
      ) : keys.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Chưa có API key nào. Tạo key đầu tiên để bắt đầu.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs uppercase border-b">
                <th className="pb-2 pr-4">Tên</th>
                <th className="pb-2 pr-4">Prefix</th>
                <th className="pb-2 pr-4">Tạo lúc</th>
                <th className="pb-2 pr-4">Hết hạn</th>
                <th className="pb-2 pr-4">Dùng lần cuối</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {keys.map(k => (
                <tr key={k.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 pr-4 font-medium">{k.name}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-gray-500">{k.key_prefix}...</td>
                  <td className="py-3 pr-4 text-gray-500">{fmt(k.created_at)}</td>
                  <td className="py-3 pr-4 text-gray-500">{fmt(k.expires_at)}</td>
                  <td className="py-3 pr-4 text-gray-500">{fmt(k.last_used_at)}</td>
                  <td className="py-3">
                    <button onClick={() => handleDelete(k.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors">
                      <span className="material-icons text-lg">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ---------- Tab: Webhooks ----------

function WebhooksTab() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', url: '', events: [] as string[] })
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<WebhookItem | null>(null)
  const [testResult, setTestResult] = useState<Record<number, { ok: boolean; status: number } | null>>({})

  const load = useCallback(async () => {
    try {
      const r = await api.get<WebhookItem[]>('/integrations/webhooks')
      setWebhooks(r.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function toggleEvent(id: string) {
    setForm(f => ({
      ...f,
      events: f.events.includes(id) ? f.events.filter(e => e !== id) : [...f.events, id],
    }))
  }

  async function handleCreate() {
    if (!form.name.trim() || !form.url.trim() || form.events.length === 0) return
    setCreating(true)
    try {
      const r = await api.post<WebhookItem>('/integrations/webhooks', form)
      setCreated(r.data)
      setWebhooks(prev => [r.data, ...prev])
      setForm({ name: '', url: '', events: [] })
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Xóa webhook này?')) return
    await api.delete(`/integrations/webhooks/${id}`)
    setWebhooks(prev => prev.filter(w => w.id !== id))
  }

  async function handleTest(id: number) {
    setTestResult(r => ({ ...r, [id]: null }))
    const res = await api.post<{ ok: boolean; status: number }>(`/integrations/webhooks/${id}/test`)
    setTestResult(r => ({ ...r, [id]: res.data }))
  }

  const fmt = (s: string | null) => s ? new Date(s).toLocaleDateString('vi-VN') : '—'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Nhận push notification khi có sự kiện cháy rừng. Mỗi request có chữ ký HMAC-SHA256.
        </p>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
          <span className="material-icons text-base">add</span>
          Thêm Webhook
        </button>
      </div>

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
            <h3 className="font-semibold text-lg mb-4">Đăng ký Webhook mới</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tên</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="VD: Alert Feed UBND Tỉnh"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">URL đích (HTTPS)</label>
                <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://your-system.com/webhook/wildfire"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Events</label>
                <div className="space-y-1.5">
                  {EVENT_OPTIONS.map(ev => (
                    <label key={ev.id} className="flex items-start gap-2.5 cursor-pointer">
                      <input type="checkbox" checked={form.events.includes(ev.id)}
                        onChange={() => toggleEvent(ev.id)}
                        className="mt-0.5 accent-blue-600" />
                      <div>
                        <span className="font-mono text-xs text-gray-700">{ev.label}</span>
                        <span className="ml-2 text-xs text-gray-400">{ev.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {created?.secret && <SecretReveal label="Webhook Secret" value={created.secret} />}

            <div className="flex justify-end gap-2 mt-5">
              {!created ? (
                <>
                  <button onClick={() => { setShowModal(false); setCreated(null) }}
                    className="px-4 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200">Hủy</button>
                  <button
                    onClick={handleCreate}
                    disabled={creating || !form.name.trim() || !form.url.trim() || form.events.length === 0}
                    className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50">
                    {creating ? 'Đang tạo...' : 'Đăng ký'}
                  </button>
                </>
              ) : (
                <button onClick={() => { setShowModal(false); setCreated(null) }}
                  className="px-4 py-2 text-sm rounded-lg bg-green-600 hover:bg-green-700 text-white">
                  Đã lưu secret, đóng
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Webhooks table */}
      {loading ? (
        <div className="text-sm text-gray-400">Đang tải...</div>
      ) : webhooks.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Chưa có webhook nào. Thêm webhook để nhận push notification.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs uppercase border-b">
                <th className="pb-2 pr-4">Tên</th>
                <th className="pb-2 pr-4">URL</th>
                <th className="pb-2 pr-4">Events</th>
                <th className="pb-2 pr-4">Lỗi</th>
                <th className="pb-2 pr-4">Kích hoạt lần cuối</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {webhooks.map(wh => (
                <tr key={wh.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 pr-4 font-medium">{wh.name}</td>
                  <td className="py-3 pr-4 text-xs text-gray-500 max-w-[200px] truncate">
                    <a href={wh.url} target="_blank" rel="noreferrer" className="hover:underline">{wh.url}</a>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex flex-wrap gap-1">
                      {wh.events.map(ev => (
                        <span key={ev} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-mono">{ev}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    {wh.failure_count > 0
                      ? <span className="text-red-500 font-medium">{wh.failure_count}</span>
                      : <span className="text-green-600">0</span>}
                  </td>
                  <td className="py-3 pr-4 text-gray-500">{fmt(wh.last_triggered_at)}</td>
                  <td className="py-3 flex items-center gap-1">
                    <button onClick={() => handleTest(wh.id)}
                      className="p-1.5 rounded hover:bg-blue-50 text-blue-500 transition-colors" title="Gửi test">
                      <span className="material-icons text-lg">send</span>
                    </button>
                    {testResult[wh.id] !== undefined && (
                      <span className={`text-xs font-medium ${testResult[wh.id]?.ok ? 'text-green-600' : 'text-red-500'}`}>
                        {testResult[wh.id]?.ok ? `✓ ${testResult[wh.id]?.status}` : `✗ ${testResult[wh.id]?.status || 'ERR'}`}
                      </span>
                    )}
                    <button onClick={() => handleDelete(wh.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors">
                      <span className="material-icons text-lg">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ---------- Tab: API Docs ----------

function DocsTab() {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'
  const endpoints = [
    { method: 'GET',   path: '/api/hotspots',          desc: 'Danh sách điểm cháy (có tọa độ)' },
    { method: 'GET',   path: '/api/hotspots/geojson',   desc: 'GeoJSON FeatureCollection điểm cháy' },
    { method: 'GET',   path: '/api/hotspots/stats',     desc: 'Thống kê tổng quan hệ thống' },
    { method: 'GET',   path: '/api/incidents',          desc: 'Danh sách sự cố cháy rừng' },
    { method: 'GET',   path: '/api/incidents/{id}',     desc: 'Chi tiết một sự cố' },
    { method: 'GET',   path: '/api/v1/firms/status',    desc: 'Trạng thái đồng bộ vệ tinh FIRMS' },
    { method: 'GET',   path: '/api/boundaries/province', desc: 'GeoJSON ranh giới tỉnh Thanh Hóa' },
    { method: 'GET',   path: '/api/boundaries/districts', desc: 'GeoJSON ranh giới 27 huyện' },
  ]
  const mCls = { GET: 'bg-green-100 text-green-700', POST: 'bg-blue-100 text-blue-700', DELETE: 'bg-red-100 text-red-700' }

  return (
    <div className="space-y-6 text-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Base URL */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="text-xs text-gray-400 uppercase mb-2 font-semibold">Base URL</div>
          <code className="text-sm text-gray-800">{origin}/api/</code>
          <div className="text-xs text-gray-400 mt-1">v1 endpoints: {origin}/api/v1/</div>
        </div>

        {/* Auth */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="text-xs text-gray-400 uppercase mb-2 font-semibold">Xác thực</div>
          <code className="block text-xs text-gray-700 mb-1">Authorization: Bearer &lt;JWT&gt;</code>
          <code className="block text-xs text-gray-700">Authorization: Bearer &lt;wf_api_key&gt;</code>
          <div className="text-xs text-gray-400 mt-1">Endpoint /api/* không yêu cầu auth (công khai)</div>
        </div>

        {/* Rate limit */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="text-xs text-gray-400 uppercase mb-2 font-semibold">Rate Limit</div>
          <div className="text-gray-700">100 requests/phút per IP</div>
          <div className="text-xs text-gray-400 mt-1">Áp dụng ở tầng nginx/proxy trong môi trường production</div>
        </div>

        {/* Format */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="text-xs text-gray-400 uppercase mb-2 font-semibold">Response Format</div>
          <div className="text-gray-700">JSON, UTF-8</div>
          <code className="block text-xs text-gray-400 mt-1">Content-Type: application/json</code>
        </div>
      </div>

      {/* Endpoints */}
      <div>
        <div className="font-semibold text-gray-700 mb-3">Endpoints</div>
        <div className="border rounded-xl overflow-hidden">
          {endpoints.map((ep, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-3 text-xs ${i < endpoints.length - 1 ? 'border-b' : ''}`}>
              <span className={`px-2 py-0.5 rounded font-mono font-semibold shrink-0 ${mCls[ep.method as keyof typeof mCls]}`}>
                {ep.method}
              </span>
              <code className="text-gray-700 shrink-0">{ep.path}</code>
              <span className="text-gray-400 ml-auto text-right">{ep.desc}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 text-right">
          <a href="/api/docs" target="_blank" className="text-xs text-blue-600 hover:underline">
            Xem Swagger UI đầy đủ →
          </a>
        </div>
      </div>

      {/* Webhook signature */}
      <div>
        <div className="font-semibold text-gray-700 mb-2">Xác thực Webhook</div>
        <div className="bg-gray-900 text-green-400 rounded-xl p-4 font-mono text-xs space-y-1 overflow-x-auto">
          <div className="text-gray-400"># Python — verify HMAC-SHA256 signature</div>
          <div>import hmac, hashlib</div>
          <div>sig = request.headers.get("X-Wildfire-Signature", "").removeprefix("sha256=")</div>
          <div>expected = hmac.new(SECRET.encode(), request.body, hashlib.sha256).hexdigest()</div>
          <div>assert hmac.compare_digest(sig, expected), "Invalid signature"</div>
        </div>
      </div>

      {/* Example payload */}
      <div>
        <div className="font-semibold text-gray-700 mb-2">Ví dụ Webhook Payload</div>
        <div className="bg-gray-900 text-gray-100 rounded-xl p-4 font-mono text-xs overflow-x-auto">
          <pre>{JSON.stringify({
            event: "hotspot_new",
            timestamp: new Date().toISOString(),
            data: {
              count: 3,
              source: "FIRMS",
              bbox: "104.2,19.0,106.5,20.8",
            }
          }, null, 2)}</pre>
        </div>
      </div>
    </div>
  )
}

// ---------- Main page ----------

type Tab = 'keys' | 'webhooks' | 'docs'

export default function Integrations() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('keys')

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'keys',     label: 'API Keys',    icon: 'key' },
    { id: 'webhooks', label: 'Webhooks',    icon: 'webhook' },
    { id: 'docs',     label: 'API Docs',    icon: 'integration_instructions' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t('integrations.title')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t('integrations.subtitle')}</p>
      </div>

      {/* Tab bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex border-b">
          {tabs.map(tb => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={`flex items-center gap-2 px-6 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px
                ${tab === tb.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <span className="material-icons text-base">{tb.icon}</span>
              {tb.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'keys'     && <KeysTab />}
          {tab === 'webhooks' && <WebhooksTab />}
          {tab === 'docs'     && <DocsTab />}
        </div>
      </div>
    </div>
  )
}
