import { useState, useEffect, useRef } from 'react'
import { Check, Trash2, Edit2, Repeat, Flame, GripVertical, Play, Square, ChevronDown, ChevronUp } from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'
import type { TaskInstance, Tag, TimeLog } from '../types'
import { generateId } from '../utils/storage'
import SubTaskList from './SubTaskList'
import MarkdownContent from './MarkdownContent'

interface Props {
  instance: TaskInstance
  tags: Tag[]
  streak?: number
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onUpdateTimeLogs?: (taskId: string, logs: TimeLog[]) => void
  onUpdateSubtasks?: (taskId: string, subtasks: typeof instance.task.subtasks) => void
  draggable?: boolean
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#ef4444', high: '#f97316', normal: '#3b82f6', low: '#6b7280',
}
const PRIORITY_BG: Record<string, string> = {
  urgent: 'rgba(239,68,68,0.08)', high: 'rgba(249,115,22,0.08)',
  normal: 'rgba(59,130,246,0.08)', low: 'rgba(107,114,128,0.06)',
}

function formatSeconds(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
}

export default function TaskCard({ instance, tags, streak, onToggle, onEdit, onDelete, onUpdateTimeLogs, onUpdateSubtasks, draggable = false }: Props) {
  const { task, isCompleted } = instance
  const [expanded, setExpanded] = useState(false)
  const [timing, setTiming] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<number | null>(null)
  const startRef = useRef<number>(0)

  const totalLogged = task.timeLogs.reduce((sum, l) => sum + l.seconds, 0)

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    disabled: !draggable || task.isRecurring,
    data: { task },
  })

  const taskTags = tags.filter(t => task.tagIds.includes(t.id))
  const priorityColor = PRIORITY_COLORS[task.priority]
  const hasSubtasks = task.subtasks.length > 0
  const completedSubs = task.subtasks.filter(s => s.completed).length

  const startTimer = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (timing) {
      // Stop
      clearInterval(timerRef.current!)
      const seconds = Math.round((Date.now() - startRef.current) / 1000)
      if (seconds > 0 && onUpdateTimeLogs) {
        const log: TimeLog = {
          id: generateId(),
          startedAt: new Date(startRef.current).toISOString(),
          endedAt: new Date().toISOString(),
          seconds,
        }
        onUpdateTimeLogs(task.id, [...task.timeLogs, log])
      }
      setTiming(false)
      setElapsed(0)
    } else {
      // Start
      startRef.current = Date.now()
      timerRef.current = window.setInterval(() => {
        setElapsed(Math.round((Date.now() - startRef.current) / 1000))
      }, 1000)
      setTiming(true)
    }
  }

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const hasExpansion = hasSubtasks || !!task.description

  return (
    <div
      ref={setNodeRef}
      className="group relative rounded-xl fade-in"
      style={{
        background: isDragging ? 'rgba(139,92,246,0.15)' : PRIORITY_BG[task.priority],
        border: `1px solid ${isDragging ? '#8b5cf6' : 'rgba(148,163,184,0.08)'}`,
        borderLeft: `3px solid ${priorityColor}`,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      {/* Main row */}
      <div className="flex items-start gap-2 px-3 py-2.5">
        {draggable && !task.isRecurring && (
          <div {...listeners} {...attributes}
            className="mt-0.5 text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing transition-colors opacity-0 group-hover:opacity-100">
            <GripVertical size={14} />
          </div>
        )}

        <button onClick={onToggle}
          className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all"
          style={{ borderColor: isCompleted ? priorityColor : 'rgba(148,163,184,0.4)', background: isCompleted ? priorityColor : 'transparent' }}>
          {isCompleted && <Check size={10} className="text-white" strokeWidth={3} />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium leading-tight"
              style={{ color: isCompleted ? '#64748b' : '#e2e8f0', textDecoration: isCompleted ? 'line-through' : 'none' }}>
              {task.title}
            </span>
            {task.isRecurring && <Repeat size={11} className="text-violet-400 flex-shrink-0" />}
            {streak !== undefined && streak > 0 && (
              <span className="flex items-center gap-0.5 text-xs font-bold text-orange-400 streak-fire">
                <Flame size={11} /> {streak}
              </span>
            )}
            {timing && (
              <span className="text-xs font-mono text-emerald-400 animate-pulse">{formatSeconds(elapsed)}</span>
            )}
          </div>

          {/* Subtask progress bar */}
          {hasSubtasks && !expanded && (
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex-1 h-1 rounded-full overflow-hidden max-w-20" style={{ background: 'rgba(148,163,184,0.15)' }}>
                <div className="h-full rounded-full transition-all"
                  style={{
                    width: `${(completedSubs / task.subtasks.length) * 100}%`,
                    background: completedSubs === task.subtasks.length ? '#10b981' : '#7c3aed',
                  }} />
              </div>
              <span className="text-xs text-slate-600">{completedSubs}/{task.subtasks.length}</span>
            </div>
          )}

          {/* Tags */}
          {taskTags.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {taskTags.map(tag => (
                <span key={tag.id} className="px-1.5 py-0.5 rounded text-xs font-medium"
                  style={{ background: `${tag.color}22`, color: tag.color }}>
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Time logged */}
          {totalLogged > 0 && !timing && (
            <span className="text-xs text-slate-600 mt-0.5 block">⏱ {formatSeconds(totalLogged)}</span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 items-center">
          {!task.isRecurring && onUpdateTimeLogs && (
            <button onClick={startTimer}
              className={`p-1 rounded transition-all ${timing ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500 hover:text-emerald-400'} hover:bg-emerald-500/10`}>
              {timing ? <Square size={12} /> : <Play size={12} />}
            </button>
          )}
          {hasExpansion && (
            <button onClick={() => setExpanded(v => !v)}
              className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-700 transition-all">
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
          <button onClick={onEdit} className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-700 transition-all">
            <Edit2 size={13} />
          </button>
          <button onClick={onDelete} className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="px-3 pb-3 pt-0 space-y-3 fade-in border-t border-slate-700/30 mt-1">
          {task.description && (
            <MarkdownContent content={task.description} className="pt-2" />
          )}
          {hasSubtasks && onUpdateSubtasks && (
            <SubTaskList
              subtasks={task.subtasks}
              onChange={subs => onUpdateSubtasks(task.id, subs)}
            />
          )}
        </div>
      )}
    </div>
  )
}
