import { useState, useRef } from 'react'
import { X, Calendar, Repeat, Tag as TagIcon, AlertCircle, Wand2 } from 'lucide-react'
import type { Task, Priority, RecurFrequency, Tag, SubTask } from '../types'
import { today } from '../utils/dateUtils'
import { parseNaturalTask } from '../utils/nlpParser'
import SubTaskList from './SubTaskList'

interface Props {
  task?: Task | null
  defaultDate?: string
  tags: Tag[]
  onSave: (task: Omit<Task, 'id' | 'createdAt'>) => void
  onClose: () => void
}

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: 'urgent', label: 'Urgent', color: '#ef4444' },
  { value: 'high', label: 'High', color: '#f97316' },
  { value: 'normal', label: 'Normal', color: '#3b82f6' },
  { value: 'low', label: 'Low', color: '#6b7280' },
]

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function TaskModal({ task, defaultDate, tags, onSave, onClose }: Props) {
  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [dueDate, setDueDate] = useState(task?.dueDate ?? defaultDate ?? today())
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'normal')
  const [tagIds, setTagIds] = useState<string[]>(task?.tagIds ?? [])
  const [isRecurring, setIsRecurring] = useState(task?.isRecurring ?? false)
  const [recurFrequency, setRecurFrequency] = useState<RecurFrequency>(task?.recurFrequency ?? 'daily')
  const [recurInterval, setRecurInterval] = useState(task?.recurInterval ?? 1)
  const [recurDaysOfWeek, setRecurDaysOfWeek] = useState<number[]>(task?.recurDaysOfWeek ?? [])
  const [recurEndDate, setRecurEndDate] = useState(task?.recurEndDate ?? '')
  const [subtasks, setSubtasks] = useState<SubTask[]>(task?.subtasks ?? [])
  const [nlpInput, setNlpInput] = useState('')
  const [nlpMode, setNlpMode] = useState(!task)
  const titleRef = useRef<HTMLInputElement>(null)

  const applyNlp = () => {
    if (!nlpInput.trim()) return
    const parsed = parseNaturalTask(nlpInput)
    if (parsed.title) setTitle(parsed.title)
    if (parsed.dueDate) setDueDate(parsed.dueDate)
    if (parsed.priority) setPriority(parsed.priority)
    if (parsed.isRecurring) {
      setIsRecurring(true)
      if (parsed.recurFrequency) setRecurFrequency(parsed.recurFrequency)
      if (parsed.recurInterval) setRecurInterval(parsed.recurInterval)
      if (parsed.recurDaysOfWeek) setRecurDaysOfWeek(parsed.recurDaysOfWeek)
    }
    setNlpMode(false)
    setTimeout(() => titleRef.current?.focus(), 50)
  }

  const toggleTag = (id: string) =>
    setTagIds(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])

  const toggleDay = (d: number) =>
    setRecurDaysOfWeek(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      description,
      dueDate,
      completed: task?.completed ?? false,
      completedAt: task?.completedAt,
      priority,
      tagIds,
      isRecurring,
      recurFrequency: isRecurring ? recurFrequency : undefined,
      recurInterval: isRecurring ? recurInterval : undefined,
      recurDaysOfWeek: isRecurring && recurFrequency === 'weekly' ? recurDaysOfWeek : undefined,
      recurEndDate: isRecurring && recurEndDate ? recurEndDate : undefined,
      subtasks,
      timeLogs: task?.timeLogs ?? [],
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl fade-in max-h-screen overflow-y-auto"
        style={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.15)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 sticky top-0 z-10" style={{ background: '#1e293b' }}>
          <h2 className="text-lg font-semibold text-slate-100">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* NLP quick-add */}
          {nlpMode && !task && (
            <div
              className="rounded-xl p-3 fade-in"
              style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Wand2 size={13} className="text-violet-400" />
                <span className="text-xs font-medium text-violet-300">Smart input — try "dentist tomorrow urgent" or "workout every day"</span>
              </div>
              <div className="flex gap-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="Describe your task naturally…"
                  value={nlpInput}
                  onChange={e => setNlpInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyNlp() } }}
                  className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
                <button
                  type="button"
                  onClick={applyNlp}
                  disabled={!nlpInput.trim()}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-40"
                  style={{ background: '#7c3aed' }}
                >
                  Parse
                </button>
              </div>
              <button
                type="button"
                onClick={() => setNlpMode(false)}
                className="text-xs text-slate-600 hover:text-slate-400 mt-1.5 transition-colors"
              >
                Fill form manually →
              </button>
            </div>
          )}

          {/* Title */}
          <div>
            <input
              ref={titleRef}
              autoFocus={!!task || !nlpMode}
              type="text"
              placeholder="Task title..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 text-base"
            />
          </div>

          {/* Description (markdown hint) */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Notes <span className="text-slate-700">· markdown supported</span></label>
            <textarea
              placeholder="Add notes, links, **bold**, - lists…"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 text-sm resize-none"
            />
          </div>

          {/* Date & Priority */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Calendar size={13} /> Due date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-violet-500 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                <AlertCircle size={13} /> Priority
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:border-violet-500 text-sm"
              >
                {PRIORITY_OPTIONS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                <TagIcon size={13} /> Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)}
                    className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: tagIds.includes(tag.id) ? tag.color : 'rgba(148,163,184,0.1)',
                      color: tagIds.includes(tag.id) ? '#fff' : '#94a3b8',
                      border: `1px solid ${tagIds.includes(tag.id) ? tag.color : 'transparent'}`,
                    }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subtasks */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Checklist</label>
            <SubTaskList subtasks={subtasks} onChange={setSubtasks} />
          </div>

          {/* Recurring */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => setIsRecurring(v => !v)}
                className="relative w-10 h-5 rounded-full transition-colors"
                style={{ background: isRecurring ? '#8b5cf6' : '#334155' }}
              >
                <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                  style={{ transform: isRecurring ? 'translateX(20px)' : 'translateX(0)' }} />
              </div>
              <span className="text-sm text-slate-300 flex items-center gap-1.5">
                <Repeat size={14} /> Recurring task
              </span>
            </label>

            {isRecurring && (
              <div className="mt-3 space-y-3 pl-3 border-l-2 border-violet-500/30">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-slate-400 mb-1">Frequency</label>
                    <select value={recurFrequency} onChange={e => setRecurFrequency(e.target.value as RecurFrequency)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-violet-500">
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="block text-xs text-slate-400 mb-1">Every</label>
                    <input type="number" min={1} max={30} value={recurInterval}
                      onChange={e => setRecurInterval(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {recurFrequency === 'weekly' && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Days of week</label>
                    <div className="flex gap-1.5">
                      {DAYS.map((day, i) => (
                        <button key={day} type="button" onClick={() => toggleDay(i)}
                          className="w-9 h-9 rounded-lg text-xs font-medium transition-all"
                          style={{
                            background: recurDaysOfWeek.includes(i) ? '#8b5cf6' : '#1e293b',
                            border: `1px solid ${recurDaysOfWeek.includes(i) ? '#8b5cf6' : '#334155'}`,
                            color: recurDaysOfWeek.includes(i) ? '#fff' : '#64748b',
                          }}>
                          {day[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs text-slate-400 mb-1">End date (optional)</label>
                  <input type="date" value={recurEndDate} onChange={e => setRecurEndDate(e.target.value)}
                    className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 border border-slate-600 hover:border-slate-500 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={!title.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
              {task ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
