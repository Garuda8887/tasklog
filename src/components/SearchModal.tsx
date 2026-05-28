import { useState, useEffect, useRef, useMemo } from 'react'
import { Search, X, Calendar, Repeat } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { Task, Tag } from '../types'

interface Props {
  tasks: Task[]
  tags: Tag[]
  onClose: () => void
  onNavigate: (date: string, taskId: string) => void
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#ef4444', high: '#f97316', normal: '#3b82f6', low: '#6b7280',
}

export default function SearchModal({ tasks, tags, onClose, onNavigate }: Props) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const results = useMemo(() => {
    if (!query.trim()) return tasks.slice(0, 8)
    const q = query.toLowerCase()
    return tasks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      tags.filter(tag => t.tagIds.includes(tag.id)).some(tag => tag.name.toLowerCase().includes(q))
    ).slice(0, 12)
  }, [query, tasks, tags])

  useEffect(() => { setSelected(0) }, [results])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && results[selected]) {
      const t = results[selected]
      onNavigate(t.dueDate, t.id)
      onClose()
    }
    if (e.key === 'Escape') onClose()
  }

  useEffect(() => {
    const el = listRef.current?.children[selected] as HTMLElement
    el?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  const getTagsForTask = (task: Task) => tags.filter(t => task.tagIds.includes(t.id))

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-xl rounded-2xl overflow-hidden fade-in"
        style={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.15)', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-700/60">
          <Search size={18} className="text-slate-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tasks…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <kbd className="text-xs text-slate-600 px-1.5 py-0.5 rounded" style={{ background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.1)' }}>ESC</kbd>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-96 overflow-y-auto">
          {results.length === 0 && (
            <div className="py-12 text-center text-slate-600 text-sm">No tasks found</div>
          )}
          {results.map((task, i) => {
            const taskTags = getTagsForTask(task)
            const isSelected = i === selected
            return (
              <button
                key={task.id}
                className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
                style={{ background: isSelected ? 'rgba(139,92,246,0.12)' : 'transparent' }}
                onMouseEnter={() => setSelected(i)}
                onClick={() => { onNavigate(task.dueDate, task.id); onClose() }}
              >
                <div
                  className="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5"
                  style={{ background: PRIORITY_COLORS[task.priority], minWidth: 3 }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-sm font-medium"
                      style={{ color: task.completed ? '#475569' : '#e2e8f0', textDecoration: task.completed ? 'line-through' : 'none' }}
                    >
                      {task.title}
                    </span>
                    {task.isRecurring && <Repeat size={11} className="text-violet-400" />}
                    {taskTags.map(tag => (
                      <span key={tag.id} className="px-1.5 py-px rounded text-xs" style={{ background: `${tag.color}22`, color: tag.color }}>
                        {tag.name}
                      </span>
                    ))}
                  </div>
                  {task.description && (
                    <p className="text-xs text-slate-500 truncate mt-0.5">{task.description}</p>
                  )}
                  {task.subtasks.length > 0 && (
                    <p className="text-xs text-slate-600 mt-0.5">
                      {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} steps
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 flex-shrink-0 text-xs">
                  <Calendar size={11} />
                  <span>{format(parseISO(task.dueDate), 'MMM d')}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer hints */}
        <div className="px-4 py-2.5 border-t border-slate-700/40 flex items-center gap-4">
          {[['↑↓', 'navigate'], ['↵', 'open'], ['esc', 'close']].map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5 text-xs text-slate-600">
              <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.1)' }}>{key}</kbd>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
