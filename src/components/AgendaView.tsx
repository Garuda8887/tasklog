import { format, parseISO, isToday, addDays } from 'date-fns'
import type { TaskInstance, Tag } from '../types'
import { toDateStr } from '../utils/dateUtils'
import TaskCard from './TaskCard'

interface Props {
  startDate: Date
  getInstances: (date: string) => TaskInstance[]
  tags: Tag[]
  streaks: Record<string, number>
  onToggleTask: (inst: TaskInstance) => void
  onEditTask: (inst: TaskInstance) => void
  onDeleteTask: (id: string) => void
  onAddTask: (date: string) => void
  onSelectDate: (date: string) => void
}

export default function AgendaView({
  startDate, getInstances, tags, streaks,
  onToggleTask, onEditTask, onDeleteTask, onAddTask, onSelectDate,
}: Props) {
  const days: Date[] = []
  for (let i = 0; i < 21; i++) {
    days.push(addDays(startDate, i))
  }

  const daysWithTasks = days.filter(d => {
    const dateStr = toDateStr(d)
    const instances = getInstances(dateStr)
    return instances.length > 0 || isToday(d)
  })

  return (
    <div className="h-full overflow-y-auto pr-2 space-y-4 pb-8">
      {daysWithTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center h-48 text-slate-600">
          <div className="text-4xl mb-3">📭</div>
          <div className="text-sm">No tasks in the next 21 days</div>
        </div>
      )}
      {daysWithTasks.map(date => {
        const dateStr = toDateStr(date)
        const instances = getInstances(dateStr)
        const todayFlag = isToday(date)

        return (
          <div key={dateStr} className="fade-in">
            <div
              className="flex items-center gap-3 mb-2 cursor-pointer"
              onClick={() => onSelectDate(dateStr)}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0"
                style={{
                  background: todayFlag ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : 'rgba(30,41,59,0.6)',
                  color: todayFlag ? '#fff' : '#64748b',
                  border: todayFlag ? 'none' : '1px solid rgba(148,163,184,0.1)',
                }}
              >
                {format(date, 'd')}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-200">
                  {format(date, 'EEEE')}
                  {todayFlag && <span className="ml-2 text-xs text-violet-400">Today</span>}
                </div>
                <div className="text-xs text-slate-500">{format(date, 'MMMM yyyy')}</div>
              </div>
              <div className="ml-auto text-xs text-slate-600">
                {instances.filter(i => !i.isCompleted).length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                    {instances.filter(i => !i.isCompleted).length} pending
                  </span>
                )}
              </div>
            </div>

            {instances.length > 0 ? (
              <div className="ml-[52px] space-y-1.5">
                {instances.map(inst => (
                  <TaskCard
                    key={inst.task.id + inst.instanceDate}
                    instance={inst}
                    tags={tags}
                    streak={inst.task.isRecurring ? streaks[inst.task.id] : undefined}
                    onToggle={() => onToggleTask(inst)}
                    onEdit={() => onEditTask(inst)}
                    onDelete={() => onDeleteTask(inst.task.id)}
                    draggable={!inst.task.isRecurring}
                  />
                ))}
              </div>
            ) : (
              <div className="ml-[52px]">
                <button
                  onClick={() => onAddTask(dateStr)}
                  className="text-xs text-slate-700 hover:text-violet-400 transition-colors"
                >
                  + Add task
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
