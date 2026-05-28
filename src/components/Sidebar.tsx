import { useState } from 'react'
import {
  Calendar, LayoutGrid, List, BarChart2, Plus,
  Repeat, X, ChevronDown, ChevronRight, LogOut, Download,
} from 'lucide-react'
import type { Tag as TagType, Task } from '../types'
import { computeStreak } from '../utils/dateUtils'
import type { CompletionLog } from '../types'
import type { StoredUser } from '../utils/auth'

interface Props {
  view: string
  onViewChange: (v: string) => void
  tags: TagType[]
  recurringTasks: Task[]
  completionLogs: CompletionLog[]
  onAddTag: (name: string, color: string) => void
  onDeleteTag: (id: string) => void
  onWeeklyReview: () => void
  onExportICal: () => void
  onAddTask: () => void
  activeTagFilter: string | null
  onTagFilter: (id: string | null) => void
  currentUser: StoredUser
  onLogout: () => void
}

const TAG_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
]

export default function Sidebar({
  view, onViewChange, tags, recurringTasks, completionLogs,
  onAddTag, onDeleteTag, onWeeklyReview, onExportICal, onAddTask,
  activeTagFilter, onTagFilter, currentUser, onLogout,
}: Props) {
  const [showTagForm, setShowTagForm] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0])
  const [showRecurring, setShowRecurring] = useState(true)

  const handleAddTag = () => {
    if (!newTagName.trim()) return
    onAddTag(newTagName.trim(), newTagColor)
    setNewTagName('')
    setNewTagColor(TAG_COLORS[0])
    setShowTagForm(false)
  }

  const NAV_ITEMS = [
    { id: 'month', label: 'Month', icon: LayoutGrid },
    { id: 'week', label: 'Week', icon: Calendar },
    { id: 'agenda', label: 'Agenda', icon: List },
  ]

  return (
    <aside
      className="flex flex-col h-full py-6 px-4"
      style={{
        background: 'linear-gradient(180deg, #0a0f1e 0%, #0f172a 100%)',
        borderRight: '1px solid rgba(148,163,184,0.08)',
        width: 220,
        flexShrink: 0,
      }}
    >
      {/* App brand */}
      <div className="flex items-center gap-2 px-2 mb-5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#6d28d9,#4338ca)' }}
        >
          <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
            <path d="M 5 16.5 L 12 24 L 27 9" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">TaskLog</span>
      </div>

      {/* User card */}
      <div
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-5"
        style={{ background: 'rgba(148,163,184,0.05)', border: '1px solid rgba(148,163,184,0.08)' }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ background: currentUser.avatarColor }}
        >
          {currentUser.displayName[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-200 truncate">{currentUser.displayName}</div>
          <div className="text-xs text-slate-500 truncate">@{currentUser.username}</div>
        </div>
        <button
          onClick={onLogout}
          title="Sign out"
          className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
        >
          <LogOut size={14} />
        </button>
      </div>

      {/* Add Task */}
      <button
        onClick={onAddTask}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white mb-6 transition-all hover:opacity-90 hover:scale-[1.02]"
        style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
      >
        <Plus size={16} /> New Task
      </button>

      {/* Views */}
      <div className="mb-6">
        <div className="text-xs font-semibold text-slate-600 uppercase tracking-widest px-2 mb-2">View</div>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all mb-0.5"
            style={{
              background: view === id ? 'rgba(139,92,246,0.15)' : 'transparent',
              color: view === id ? '#c4b5fd' : '#64748b',
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Tags */}
      <div className="mb-6">
        <div className="flex items-center justify-between px-2 mb-2">
          <div className="text-xs font-semibold text-slate-600 uppercase tracking-widest">Tags</div>
          <button
            onClick={() => setShowTagForm(v => !v)}
            className="text-slate-600 hover:text-violet-400 transition-colors"
          >
            <Plus size={13} />
          </button>
        </div>

        {showTagForm && (
          <div className="mb-2 px-2 space-y-2 fade-in">
            <input
              autoFocus
              type="text"
              placeholder="Tag name..."
              value={newTagName}
              onChange={e => setNewTagName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddTag()}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500"
            />
            <div className="flex gap-1.5 flex-wrap">
              {TAG_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setNewTagColor(c)}
                  className="w-5 h-5 rounded-full transition-transform"
                  style={{
                    background: c,
                    transform: newTagColor === c ? 'scale(1.3)' : 'scale(1)',
                    outline: newTagColor === c ? `2px solid ${c}` : 'none',
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={handleAddTag}
                disabled={!newTagName.trim()}
                className="flex-1 py-1 rounded-lg text-xs font-medium text-white disabled:opacity-40"
                style={{ background: '#7c3aed' }}
              >
                Add
              </button>
              <button
                onClick={() => setShowTagForm(false)}
                className="flex-1 py-1 rounded-lg text-xs font-medium text-slate-400 border border-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* All filter */}
        <button
          onClick={() => onTagFilter(null)}
          className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-medium transition-all mb-0.5"
          style={{
            background: activeTagFilter === null ? 'rgba(148,163,184,0.1)' : 'transparent',
            color: activeTagFilter === null ? '#cbd5e1' : '#475569',
          }}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
          All tasks
        </button>

        {tags.map(tag => (
          <div key={tag.id} className="group flex items-center gap-2 w-full px-3 py-1.5 rounded-lg transition-all mb-0.5"
            style={{
              background: activeTagFilter === tag.id ? `${tag.color}18` : 'transparent',
            }}
          >
            <button
              onClick={() => onTagFilter(tag.id === activeTagFilter ? null : tag.id)}
              className="flex-1 flex items-center gap-2 text-xs font-medium text-left"
              style={{ color: activeTagFilter === tag.id ? tag.color : '#64748b' }}
            >
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: tag.color }} />
              {tag.name}
            </button>
            <button
              onClick={() => onDeleteTag(tag.id)}
              className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
            >
              <X size={11} />
            </button>
          </div>
        ))}
      </div>

      {/* Recurring / Streaks */}
      {recurringTasks.length > 0 && (
        <div className="mb-6">
          <button
            className="flex items-center gap-2 w-full px-2 mb-2"
            onClick={() => setShowRecurring(v => !v)}
          >
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-widest flex-1 text-left">Streaks</div>
            {showRecurring ? <ChevronDown size={12} className="text-slate-600" /> : <ChevronRight size={12} className="text-slate-600" />}
          </button>
          {showRecurring && (
            <div className="space-y-0.5 fade-in">
              {recurringTasks.slice(0, 6).map(task => {
                const streak = computeStreak(task, completionLogs)
                return (
                  <div key={task.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg">
                    <Repeat size={11} className="text-violet-400 flex-shrink-0" />
                    <span className="text-xs text-slate-500 flex-1 truncate">{task.title}</span>
                    {streak > 0 && (
                      <span className="text-xs font-bold text-orange-400 flex items-center gap-0.5 streak-fire">
                        🔥{streak}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Weekly Review + iCal */}
      <div className="mt-auto space-y-2">
        <button
          onClick={onWeeklyReview}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{
            background: 'rgba(139,92,246,0.08)',
            border: '1px solid rgba(139,92,246,0.15)',
            color: '#a78bfa',
          }}
        >
          <BarChart2 size={15} />
          Weekly Review
        </button>
        <button
          onClick={onExportICal}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-medium transition-all"
          style={{
            background: 'rgba(148,163,184,0.04)',
            border: '1px solid rgba(148,163,184,0.1)',
            color: '#64748b',
          }}
        >
          <Download size={13} />
          Export iCal (.ics)
        </button>
      </div>
    </aside>
  )
}
