import { useState } from 'react'
import { Plus, X, Check } from 'lucide-react'
import type { SubTask } from '../types'
import { generateId } from '../utils/storage'

interface Props {
  subtasks: SubTask[]
  onChange: (subtasks: SubTask[]) => void
  readOnly?: boolean
}

export default function SubTaskList({ subtasks, onChange, readOnly = false }: Props) {
  const [newTitle, setNewTitle] = useState('')

  const toggle = (id: string) =>
    onChange(subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s))

  const remove = (id: string) =>
    onChange(subtasks.filter(s => s.id !== id))

  const add = () => {
    const t = newTitle.trim()
    if (!t) return
    onChange([...subtasks, { id: generateId(), title: t, completed: false }])
    setNewTitle('')
  }

  const completed = subtasks.filter(s => s.completed).length

  return (
    <div>
      {subtasks.length > 0 && (
        <div className="mb-2">
          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.15)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${subtasks.length ? (completed / subtasks.length) * 100 : 0}%`,
                  background: completed === subtasks.length && subtasks.length > 0
                    ? 'linear-gradient(90deg,#10b981,#059669)'
                    : 'linear-gradient(90deg,#7c3aed,#4f46e5)',
                }}
              />
            </div>
            <span className="text-xs text-slate-500 flex-shrink-0">{completed}/{subtasks.length}</span>
          </div>

          <div className="space-y-1">
            {subtasks.map(sub => (
              <div key={sub.id} className="flex items-center gap-2 group">
                <button
                  type="button"
                  onClick={() => !readOnly && toggle(sub.id)}
                  className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    borderColor: sub.completed ? '#8b5cf6' : 'rgba(148,163,184,0.3)',
                    background: sub.completed ? '#8b5cf6' : 'transparent',
                  }}
                >
                  {sub.completed && <Check size={9} className="text-white" strokeWidth={3} />}
                </button>
                <span
                  className="text-xs flex-1"
                  style={{
                    color: sub.completed ? '#475569' : '#94a3b8',
                    textDecoration: sub.completed ? 'line-through' : 'none',
                  }}
                >
                  {sub.title}
                </span>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => remove(sub.id)}
                    className="text-slate-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!readOnly && (
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            placeholder="Add step..."
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
            className="flex-1 bg-transparent border-b text-xs text-slate-300 placeholder-slate-600 focus:outline-none py-1 transition-colors"
            style={{ borderColor: 'rgba(148,163,184,0.15)' }}
            onFocus={e => (e.target.style.borderColor = '#7c3aed')}
            onBlur={e => (e.target.style.borderColor = 'rgba(148,163,184,0.15)')}
          />
          <button
            type="button"
            onClick={add}
            disabled={!newTitle.trim()}
            className="text-slate-600 hover:text-violet-400 transition-colors disabled:opacity-30"
          >
            <Plus size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
