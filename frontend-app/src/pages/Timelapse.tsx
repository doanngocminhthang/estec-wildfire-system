import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'

function seededRng(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

interface TimePoint {
  date: string
  label: string
  fullLabel: string
  ndvi: number
  forestCover: number
  alertCount: number
  burnArea: number
}

function generateTimePoints(): TimePoint[] {
  const points: TimePoint[] = []
  const baseForestCover = 68.5

  for (let year = 2023; year <= 2025; year++) {
    for (let month = 1; month <= 12; month++) {
      const monthStr = month.toString().padStart(2, '0')
      const date = `${year}-${monthStr}`
      const seed = year * 100 + month

      const isRainy = month >= 5 && month <= 10
      const seasonalBase = isRainy ? 0.63 : 0.40
      const noise = seededRng(seed * 7) * 0.10
      const ndvi = Math.min(0.82, Math.max(0.22, seasonalBase + noise - (year - 2023) * 0.015))

      const coverDrop = (year - 2023) * 0.35 + (month - 1) * 0.012
      const forestCover = Math.max(65.0, baseForestCover - coverDrop + (isRainy ? 0.3 : -0.15))

      const baseAlerts = isRainy ? 2 : 11
      const alertCount = Math.max(0, Math.round(baseAlerts + seededRng(seed * 13) * 8))

      const baseBurn = isRainy ? 5 : 80
      const burnArea = Math.round(baseBurn + seededRng(seed * 17) * (isRainy ? 15 : 120))

      points.push({
        date,
        label: `T${month}/${year}`,
        fullLabel: `Tháng ${month}, ${year}`,
        ndvi: Math.round(ndvi * 1000) / 1000,
        forestCover: Math.round(forestCover * 10) / 10,
        alertCount,
        burnArea,
      })
    }
  }
  return points
}

const TIME_POINTS = generateTimePoints()
const SPEEDS = [0.5, 1, 2, 4]

function ndviToColor(ndvi: number): string {
  if (ndvi > 0.65) return '#16a34a'
  if (ndvi > 0.50) return '#65a30d'
  if (ndvi > 0.38) return '#ca8a04'
  if (ndvi > 0.28) return '#ea580c'
  return '#dc2626'
}

function getNdviLabel(ndvi: number, t: (k: string) => string): string {
  if (ndvi > 0.65) return t('timelapse.ndviLevels.veryHealthy')
  if (ndvi > 0.50) return t('timelapse.ndviLevels.healthy')
  if (ndvi > 0.38) return t('timelapse.ndviLevels.stressed')
  if (ndvi > 0.28) return t('timelapse.ndviLevels.critical')
  return t('timelapse.ndviLevels.burned')
}

function getHotspots(idx: number) {
  const count = TIME_POINTS[idx].alertCount
  return Array.from({ length: Math.min(count, 9) }, (_, i) => ({
    x: 10 + seededRng(idx * 31 + i * 7) * 78,
    y: 8 + seededRng(idx * 19 + i * 11) * 78,
    r: 3 + seededRng(idx * 41 + i * 3) * 7,
  }))
}

export default function Timelapse() {
  const { t, i18n } = useTranslation()
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [showNdvi, setShowNdvi] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const current = TIME_POINTS[currentIdx]
  const hotspots = getHotspots(currentIdx)
  const color = ndviToColor(current.ndvi)
  const ndviPct = Math.round((current.ndvi / 0.85) * 100)

  const prev = TIME_POINTS[currentIdx > 0 ? currentIdx - 1 : 0]
  const coverDelta = currentIdx > 0 ? current.forestCover - prev.forestCover : 0
  const ndviDelta = currentIdx > 0 ? current.ndvi - prev.ndvi : 0

  const stepForward = useCallback(() => {
    setCurrentIdx(i => (i + 1) % TIME_POINTS.length)
  }, [])

  const stepBack = useCallback(() => {
    setCurrentIdx(i => (i - 1 + TIME_POINTS.length) % TIME_POINTS.length)
  }, [])

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (isPlaying) {
      intervalRef.current = setInterval(stepForward, 1000 / speed)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isPlaying, speed, stepForward])

  const stressLevel = Math.max(0, 0.50 - current.ndvi)
  const locale = i18n.language === 'en' ? 'en-US' : 'vi-VN'

  // Build sparkline points string
  const sparklinePoints = (() => {
    const startIdx = Math.max(0, currentIdx - 11)
    const pts = TIME_POINTS.slice(startIdx, currentIdx + 1)
    if (pts.length < 2) return ''
    return pts.map((p, i) => {
      const x = (i / (pts.length - 1)) * 96 + 2
      const y = 28 - ((p.ndvi - 0.2) / 0.65) * 24
      return `${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ')
  })()
  const lastPt = sparklinePoints ? sparklinePoints.split(' ').at(-1)!.split(',') : null

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('timelapse.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('timelapse.subtitle')}</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showNdvi}
            onChange={e => setShowNdvi(e.target.checked)}
            className="w-4 h-4 accent-green-600"
          />
          {t('timelapse.showNdvi')}
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Satellite view */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900 rounded-xl overflow-hidden relative" style={{ aspectRatio: '16/9' }}>
            <svg viewBox="0 0 100 56" className="w-full h-full" style={{ display: 'block' }}>
              <defs>
                <linearGradient id="tlTerrainGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#163b22" />
                  <stop offset="35%" stopColor="#1f5c31" />
                  <stop offset="65%" stopColor="#1a4f2a" />
                  <stop offset="100%" stopColor="#2d6a3f" />
                </linearGradient>
              </defs>

              {/* Base terrain */}
              <rect width="100" height="56" fill="url(#tlTerrainGrad)" />

              {/* Forest patches */}
              <ellipse cx="18" cy="13" rx="16" ry="9" fill="#1f5c31" opacity="0.85" />
              <ellipse cx="63" cy="9"  rx="21" ry="11" fill="#226338" opacity="0.78" />
              <ellipse cx="44" cy="34" rx="24" ry="13" fill="#1a5228" opacity="0.80" />
              <ellipse cx="82" cy="44" rx="16" ry="9"  fill="#206030" opacity="0.75" />
              <ellipse cx="9"  cy="46" rx="11" ry="7"  fill="#1e5c32" opacity="0.70" />
              <ellipse cx="90" cy="18" rx="12" ry="7"  fill="#245e35" opacity="0.65" />

              {/* River */}
              <path d="M0,30 Q28,24 50,31 Q72,38 100,33"
                stroke="#4a90a4" strokeWidth="0.9" fill="none" opacity="0.55" />
              {/* Road */}
              <path d="M26,0 L29,56"
                stroke="#8b7355" strokeWidth="0.5" fill="none" opacity="0.35" />
              <path d="M0,42 L100,40"
                stroke="#8b7355" strokeWidth="0.4" fill="none" opacity="0.25" />

              {/* NDVI overlay */}
              {showNdvi && (
                <rect width="100" height="56" fill={color}
                  opacity={0.20 + (1 - current.ndvi) * 0.22} />
              )}

              {/* Stress patches in dry/low-NDVI periods */}
              {stressLevel > 0 && (
                <>
                  <ellipse cx="36" cy="21"
                    rx={Math.min(12, stressLevel * 50)}
                    ry={Math.min(7, stressLevel * 30)}
                    fill="#b45309" opacity={0.45} />
                  <ellipse cx="74" cy="39"
                    rx={Math.min(9, stressLevel * 38)}
                    ry={Math.min(5, stressLevel * 22)}
                    fill="#92400e" opacity={0.38} />
                </>
              )}

              {/* Hotspot fire markers */}
              {hotspots.map((h, i) => (
                <g key={i}>
                  <circle cx={h.x} cy={h.y} r={h.r * 2.0} fill="#ff4500" opacity={0.12} />
                  <circle cx={h.x} cy={h.y} r={h.r * 0.85} fill="#ff6b35" opacity={0.75} />
                  <circle cx={h.x} cy={h.y} r={h.r * 0.38} fill="#fde047" opacity={0.95} />
                </g>
              ))}
            </svg>

            {/* Timestamp */}
            <div className="absolute top-3 left-3 bg-black/65 text-white text-sm font-mono px-3 py-1 rounded">
              {current.fullLabel}
            </div>

            {/* NDVI badge */}
            <div className="absolute top-3 right-3 px-3 py-1 rounded text-white text-sm font-bold"
              style={{ backgroundColor: color }}>
              NDVI {current.ndvi.toFixed(3)}
            </div>

            {/* Satellite label */}
            <div className="absolute bottom-3 left-3 text-xs text-white/45 font-mono">
              MODIS/Terra · Band 1–7 · 250m · Thanh Hóa
            </div>

            {/* REC indicator */}
            {isPlaying && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-red-600/80 text-white text-xs px-2 py-1 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                REC
              </div>
            )}
          </div>

          {/* NDVI scale legend */}
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <span className="shrink-0">{t('timelapse.ndviScale')}</span>
            <div className="flex-1 h-2.5 rounded"
              style={{ background: 'linear-gradient(to right, #dc2626, #ea580c, #ca8a04, #65a30d, #16a34a)' }} />
            <span className="text-red-500 shrink-0">0.2</span>
            <span className="text-green-700 shrink-0">0.8+</span>
          </div>
        </div>

        {/* Stats panel */}
        <div className="flex flex-col gap-3">
          {/* NDVI */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('timelapse.stats.ndvi')}</div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold" style={{ color }}>{current.ndvi.toFixed(3)}</span>
              {currentIdx > 0 && (
                <span className={`text-xs mb-1 font-medium ${ndviDelta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {ndviDelta >= 0 ? '▲' : '▼'} {Math.abs(ndviDelta * 1000).toFixed(1)}
                </span>
              )}
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
              <div className="h-2 rounded-full transition-all duration-500"
                style={{ width: `${ndviPct}%`, backgroundColor: color }} />
            </div>
            <div className="text-xs mt-1 font-medium" style={{ color }}>{getNdviLabel(current.ndvi, t)}</div>
          </div>

          {/* Forest cover */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('timelapse.stats.forestCover')}</div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-emerald-700">{current.forestCover.toFixed(1)}%</span>
              {currentIdx > 0 && (
                <span className={`text-xs mb-1 font-medium ${coverDelta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {coverDelta >= 0 ? '▲' : '▼'} {Math.abs(coverDelta).toFixed(2)}%
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-1">{t('timelapse.stats.totalArea')} ~593,000 ha</div>
          </div>

          {/* Alert count */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('timelapse.stats.alerts')}</div>
            <div className="text-2xl font-bold text-orange-600">{current.alertCount}</div>
            <div className="text-xs text-gray-400 mt-1">{t('timelapse.stats.alertsSub')}</div>
          </div>

          {/* Burn area */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('timelapse.stats.burnArea')}</div>
            <div className="text-2xl font-bold text-red-600">
              {current.burnArea.toLocaleString(locale)} ha
            </div>
            <div className="text-xs text-gray-400 mt-1">{t('timelapse.stats.burnAreaSub')}</div>
          </div>

          {/* Sparkline trend */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex-1">
            <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">{t('timelapse.stats.trend')}</div>
            <svg viewBox="0 0 100 30" className="w-full h-12">
              {sparklinePoints && (
                <>
                  <polyline points={sparklinePoints} fill="none" stroke="#16a34a" strokeWidth="1.5"
                    strokeLinejoin="round" />
                  {lastPt && (
                    <circle cx={parseFloat(lastPt[0])} cy={parseFloat(lastPt[1])} r="2.5" fill={color} />
                  )}
                </>
              )}
            </svg>
            <div className="text-xs text-gray-400">{t('timelapse.stats.last12Months')}</div>
          </div>
        </div>
      </div>

      {/* Timeline scrubber */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs text-gray-400 shrink-0 w-16 text-right">2023-01</span>
          <input
            type="range"
            min={0}
            max={TIME_POINTS.length - 1}
            value={currentIdx}
            onChange={e => {
              setCurrentIdx(Number(e.target.value))
              setIsPlaying(false)
            }}
            className="flex-1 accent-green-600 cursor-pointer"
          />
          <span className="text-xs text-gray-400 shrink-0 w-16">2025-12</span>
        </div>

        {/* Year jump buttons */}
        <div className="flex justify-between px-[4.75rem] mb-3">
          {[2023, 2024, 2025].map(year => (
            <button key={year}
              onClick={() => { setCurrentIdx((year - 2023) * 12); setIsPlaying(false) }}
              className="text-xs text-gray-400 hover:text-green-600 transition-colors font-medium">
              {year}
            </button>
          ))}
        </div>

        {/* Playback controls */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button onClick={stepBack}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
            <span className="material-icons text-xl">skip_previous</span>
          </button>

          <button
            onClick={() => setIsPlaying(p => !p)}
            className="p-3 rounded-full bg-green-600 hover:bg-green-700 transition-colors text-white shadow-md">
            <span className="material-icons text-2xl">{isPlaying ? 'pause' : 'play_arrow'}</span>
          </button>

          <button onClick={stepForward}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
            <span className="material-icons text-xl">skip_next</span>
          </button>

          <div className="flex items-center gap-2 ml-4">
            <span className="text-sm text-gray-500">{t('timelapse.speed')}</span>
            {SPEEDS.map(s => (
              <button key={s}
                onClick={() => setSpeed(s)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors
                  ${speed === s ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {s}x
              </button>
            ))}
          </div>

          <div className="ml-auto text-sm font-medium text-gray-700 shrink-0">
            {current.fullLabel}{' '}
            <span className="text-gray-400 text-xs">({currentIdx + 1}/{TIME_POINTS.length})</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">{t('timelapse.dataNote')}</p>
    </div>
  )
}
