import { useDroppable } from '@dnd-kit/core'
import { format, isToday, parseISO } from 'date-fns'
import type { TaskInstance, Tag } from '../types'
import { toDateStr } from '../utils/dateUtils'

interface WeekDayColProps {
  date: Date
  instances: TaskInstance[]
  tags: Tag[]
  selected: boolean
  streaks: Record<string, number>
  onClick: () => void
  onToggle: (inst: TaskInstance) => void
  onAdd: (date: string) => void
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#ef4444',
  high: '#f97316',
  normal: '#3b82f6',
  low: '#6b7280',
}

function WeekDayCol({ date, instances, tags, selected, streaks, onClick, onToggle, onAdd }: WeekDayColProps) {
  const dateStr = toDateStr(date)
  const { setNodeRef, isOver } = useDroppable({ id: dateStr })
  const todayFlag = isToday(date)

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col rounded-xl overflow-hidden transition-all cursor-pointer"
      style={{
        border: selected ? '1.5px solid rgba(139,92,246,0.5)' : '1px solid rgba(148,163,184,0.08)',
        background: isOver ? 'rgba(139,92,246,0.1)' : selected ? 'rgba(139,92,246,0.06)' : 'rgba(30,41,59,0.4)',
        minHeight: 180,
      }}
      onClick={onClick}
    >
      {/* Day header */}
      <div
        className="px-3 py-2 flex items-center gap-2 border-b"
        style={{ borderColor: 'rgba(148,163,184,0.08)' }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{
            background: todayFlag ? '#8b5cf6' : 'transparent',
            color: todayFlag ? '#fff' : '#94a3b8',
          }}
        >
          {format(date, 'd')}
        </div>
        <div>
          <div className="text-xs font-medium text-slate-400">{format(date, 'EEE')}</div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onAdd(dateStr) }}
          className="ml-auto text-slate-600 hover:text-violet-400 transition-colors opacity-0 group-hover:opacity-100"
          style={{ fontSize: 18, lineHeight: 1 }}
        >
          +
        </button>
      </div>

      {/* Tasks */}
      <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
        {instances.map(inst => {
          const taskTags = tags.filter(t => inst.task.tagIds.includes(t.id))
          return (
            <div
              key={inst.task.id + inst.instanceDate}
              onClick={e => { e.stopPropagation(); onToggle(inst) }}
              className="flex items-start gap-1.5 rounded-lg px-2 py-1.5 cursor-pointer transition-all hover:brightness-110"
              style={{
                background: `${PRIORITY_COLORS[inst.task.priority]}15`,
                borderLeft: `2px solid ${PRIORITY_COLORS[inst.task.priority]}`,
              }}
            >
              <div
                className="mt-0.5 w-3.5 h-3.5 rounded border-2 flex-shrink-0 flex items-center justify-center"
                style={{
                  borderColor: inst.isCompleted ? PRIORITY_COLORS[inst.task.priority] : 'rgba(148,163,184,0.3)',
                  background: inst.isCompleted ? PRIORITY_COLORS[inst.task.priority] : 'transparent',
                }}
              >
                {inst.isCompleted && (
                  <svg width="8" height="8" viewBox="0 0 8 8">
                    <path d="M1 4l2 2 4-4" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  </svg>
                )}
              </div>
              <div className="min-w-0">
                <div
                  className="text-xs font-medium leading-tight"
                  style={{
                    color: inst.isCompleted ? '#475569' : '#cbd5e1',
                    textDecoration: inst.isCompleted ? 'line-through' : 'none',
                  }}
                >
                  {inst.task.title}
                </div>
                {taskTags.length > 0 && (
                  <div className="flex gap-1 mt-0.5 flex-wrap">
                    {taskTags.map(tag => (
                      <span
                        key={tag.id}
                        className="px-1 py-px rounded text-xs"
                        style={{ background: `${tag.color}22`, color: tag.color, fontSize: '9px' }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {instances.length === 0 && (
          <div className="text-xs text-slate-700 text-center py-4">—</div>
        )}
      </div>
    </div>
  )
}

interface Props {
  days: Date[]
  selectedDate: string
  getInstances: (date: string) => TaskInstance[]
  tags: Tag[]
  streaks: Record<string, number>
  onSelectDate: (date: string) => void
  onToggleTask: (inst: TaskInstance) => void
  onAddTask: (date: string) => void
}

export default function WeekView({ days, selectedDate, getInstances, tags, streaks, onSelectDate, onToggleTask, onAddTask }: Props) {
  return (
    <div className="grid grid-cols-7 gap-2 h-full group">
      {days.map(date => {
        const dateStr = toDateStr(date)
        return (
          <WeekDayCol
            key={dateStr}
            date={date}
            instances={getInstances(dateStr)}
            tags={tags}
            selected={dateStr === selectedDate}
            streaks={streaks}
            onClick={() => onSelectDate(dateStr)}
            onToggle={onToggleTask}
            onAdd={onAddTask}
          />
        )
      })}
    </div>
  )
}
