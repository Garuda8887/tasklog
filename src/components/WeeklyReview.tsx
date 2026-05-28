import { X, TrendingUp, CheckCircle2, XCircle, Clock, Timer } from 'lucide-react'
import { format } from 'date-fns'

interface Props {
  summary: { completed: number; missed: number; total: number; pending: number }
  weekStart: Date
  weeklyTimeLogged?: number
  onClose: () => void
  onPrevWeek: () => void
  onNextWeek: () => void
}

function formatSeconds(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return `${s}s`
}

export default function WeeklyReview({ summary, weekStart, weeklyTimeLogged = 0, onClose, onPrevWeek, onNextWeek }: Props) {
  const weekEnd = new Date(weekStart.getTime() + 6 * 86400000)
  const rate = summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0

  const getEmoji = () => {
    if (rate >= 80) return '🔥'
    if (rate >= 60) return '✨'
    if (rate >= 40) return '📈'
    return '💪'
  }

  const getMessage = () => {
    if (rate >= 80) return 'Crushing it!'
    if (rate >= 60) return 'Solid week'
    if (rate >= 40) return 'Getting there'
    return 'Keep pushing'
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl fade-in"
        style={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.15)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-violet-400" />
            <h2 className="text-lg font-semibold text-slate-100">Weekly Review</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Week nav */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onPrevWeek}
              className="px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-all"
            >
              ← Prev
            </button>
            <div className="text-center">
              <div className="text-sm font-semibold text-slate-200">
                {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
              </div>
            </div>
            <button
              onClick={onNextWeek}
              className="px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-all"
            >
              Next →
            </button>
          </div>

          {/* Score */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-2">{getEmoji()}</div>
            <div className="text-3xl font-bold text-slate-100">{rate}%</div>
            <div className="text-slate-400 text-sm mt-1">{getMessage()}</div>
          </div>

          {/* Progress ring */}
          <div className="flex justify-center mb-6">
            <svg width={120} height={120} viewBox="0 0 120 120">
              <circle cx={60} cy={60} r={50} fill="none" stroke="#1e293b" strokeWidth={12} />
              <circle
                cx={60}
                cy={60}
                r={50}
                fill="none"
                stroke="#334155"
                strokeWidth={12}
              />
              {summary.total > 0 && (
                <circle
                  cx={60}
                  cy={60}
                  r={50}
                  fill="none"
                  stroke="url(#reviewGrad)"
                  strokeWidth={12}
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - rate / 100)}`}
                  transform="rotate(-90 60 60)"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              )}
              <defs>
                <linearGradient id="reviewGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>
              </defs>
              <text x={60} y={65} textAnchor="middle" fill="#e2e8f0" fontSize={18} fontWeight="bold">
                {summary.completed}/{summary.total}
              </text>
            </svg>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div
              className="rounded-xl p-3 text-center"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.15)' }}
            >
              <CheckCircle2 size={18} className="text-green-400 mx-auto mb-1" />
              <div className="text-xl font-bold text-green-400">{summary.completed}</div>
              <div className="text-xs text-slate-500">Done</div>
            </div>
            <div
              className="rounded-xl p-3 text-center"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.15)' }}
            >
              <XCircle size={18} className="text-red-400 mx-auto mb-1" />
              <div className="text-xl font-bold text-red-400">{summary.missed}</div>
              <div className="text-xs text-slate-500">Missed</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-xl p-3 text-center"
              style={{ background: 'rgba(148,163,184,0.05)', border: '1px solid rgba(148,163,184,0.1)' }}
            >
              <Clock size={18} className="text-slate-400 mx-auto mb-1" />
              <div className="text-xl font-bold text-slate-300">{summary.pending}</div>
              <div className="text-xs text-slate-500">Upcoming</div>
            </div>
            <div
              className="rounded-xl p-3 text-center"
              style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}
            >
              <Timer size={18} className="text-violet-400 mx-auto mb-1" />
              <div className="text-xl font-bold text-violet-300">{weeklyTimeLogged > 0 ? formatSeconds(weeklyTimeLogged) : '—'}</div>
              <div className="text-xs text-slate-500">Logged</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
