import { useDroppable } from '@dnd-kit/core'
import { format, isSameMonth, isToday } from 'date-fns'
import type { TaskInstance, Tag } from '../types'
import { toDateStr } from '../utils/dateUtils'

interface DayCellProps {
  date: Date
  instances: TaskInstance[]
  tags: Tag[]
  isCurrentMonth: boolean
  isSelected: boolean
  onClick: () => void
}

function DayCell({ date, instances, tags, isCurrentMonth, isSelected, onClick }: DayCellProps) {
  const dateStr = toDateStr(date)
  const { setNodeRef, isOver } = useDroppable({ id: dateStr })
  const todayFlag = isToday(date)
  const pending = instances.filter(i => !i.isCompleted)
  const completed = instances.filter(i => i.isCompleted)
  const overdue = instances.filter(i => !i.task.isRecurring && !i.isCompleted && i.task.dueDate < dateStr)

  const PRIORITY_COLORS: Record<string, string> = {
    urgent: '#ef4444',
    high: '#f97316',
    normal: '#3b82f6',
    low: '#6b7280',
  }

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className="relative min-h-24 p-1.5 rounded-xl cursor-pointer transition-all duration-150"
      style={{
        background: isOver
          ? 'rgba(139,92,246,0.15)'
          : isSelected
          ? 'rgba(139,92,246,0.12)'
          : todayFlag
          ? 'rgba(139,92,246,0.06)'
          : 'rgba(30,41,59,0.4)',
        border: isSelected
          ? '1.5px solid rgba(139,92,246,0.6)'
          : isOver
          ? '1.5px solid #8b5cf6'
          : '1px solid rgba(148,163,184,0.06)',
        opacity: isCurrentMonth ? 1 : 0.3,
      }}
    >
      {/* Day number */}
      <div className="flex items-center justify-between mb-1">
        <span
          className="text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full"
          style={{
            background: todayFlag ? '#8b5cf6' : 'transparent',
            color: todayFlag ? '#fff' : isCurrentMonth ? '#e2e8f0' : '#475569',
          }}
        >
          {format(date, 'd')}
        </span>
        {overdue.length > 0 && (
          <span className="text-xs text-red-400 font-bold">!</span>
        )}
      </div>

      {/* Task dots / mini bars */}
      <div className="space-y-0.5">
        {instances.slice(0, 3).map((inst, i) => (
          <div
            key={inst.task.id + i}
            className="flex items-center gap-1 group/bar"
          >
            <div
              className="w-1 h-1 rounded-full flex-shrink-0"
              style={{
                background: inst.isCompleted
                  ? '#334155'
                  : PRIORITY_COLORS[inst.task.priority],
              }}
            />
            <span
              className="text-xs leading-tight truncate"
              style={{
                color: inst.isCompleted ? '#475569' : '#94a3b8',
                textDecoration: inst.isCompleted ? 'line-through' : 'none',
                fontSize: '10px',
              }}
            >
              {inst.task.title}
            </span>
          </div>
        ))}
        {instances.length > 3 && (
          <div className="text-xs text-slate-500" style={{ fontSize: '10px' }}>
            +{instances.length - 3} more
          </div>
        )}
      </div>

      {/* Journal indicator */}
    </div>
  )
}

interface Props {
  days: Date[]
  currentMonth: number
  selectedDate: string
  getInstances: (date: string) => TaskInstance[]
  journals: Record<string, { content: string }>
  tags: Tag[]
  onSelectDate: (date: string) => void
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function CalendarGrid({ days, currentMonth, selectedDate, getInstances, journals, tags, onSelectDate }: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAY_LABELS.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-slate-500 py-2 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1.5 flex-1">
        {days.map(date => {
          const dateStr = toDateStr(date)
          const instances = getInstances(dateStr)
          return (
            <DayCell
              key={dateStr}
              date={date}
              instances={instances}
              tags={tags}
              isCurrentMonth={date.getMonth() === currentMonth}
              isSelected={dateStr === selectedDate}
              onClick={() => onSelectDate(dateStr)}
            />
          )
        })}
      </div>
    </div>
  )
}
