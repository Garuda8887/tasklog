import { useState } from 'react'
import { Plus, BookOpen, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { TaskInstance, Tag, TimeLog, SubTask } from '../types'
import TaskCard from './TaskCard'

interface Props {
  date: string
  instances: TaskInstance[]
  tags: Tag[]
  journal: string
  streaks: Record<string, number>
  onAddTask: (date: string) => void
  onToggleTask: (instance: TaskInstance) => void
  onEditTask: (instance: TaskInstance) => void
  onDeleteTask: (id: string) => void
  onJournalChange: (date: string, content: string) => void
  onReschedule: (taskId: string, newDate: string) => void
  onUpdateTimeLogs?: (taskId: string, logs: TimeLog[]) => void
  onUpdateSubtasks?: (taskId: string, subtasks: SubTask[]) => void
  isToday: boolean
}

export default function DayPanel({
  date, instances, tags, journal, streaks,
  onAddTask, onToggleTask, onEditTask, onDeleteTask, onJournalChange,
  onUpdateTimeLogs, onUpdateSubtasks, isToday,
}: Props) {
  const [showJournal, setShowJournal] = useState(false)
  const [journalText, setJournalText] = useState(journal)

  const dateObj = parseISO(date)
  const overdue = instances.filter(i => !i.task.isRecurring && !i.isCompleted && i.task.dueDate < date)
  const regular = instances.filter(i => !(overdue.includes(i)))
  const completed = regular.filter(i => i.isCompleted)
  const pending = regular.filter(i => !i.isCompleted)

  const handleJournalBlur = () => {
    onJournalChange(date, journalText)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs font-medium text-slate-400 uppercase tracking-widest">
            {format(dateObj, 'EEEE')}
          </div>
          <div className="text-2xl font-bold text-slate-100">
            {format(dateObj, 'MMMM d')}
            {isToday && (
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 align-middle">
                Today
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => onAddTask(date)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400 mb-1.5">
            <AlertTriangle size={12} /> Overdue ({overdue.length})
          </div>
          <div className="space-y-1.5">
            {overdue.map(inst => (
              <TaskCard
                key={inst.task.id + inst.instanceDate}
                instance={inst}
                tags={tags}
                streak={inst.task.isRecurring ? streaks[inst.task.id] : undefined}
                onToggle={() => onToggleTask(inst)}
                onEdit={() => onEditTask(inst)}
                onDelete={() => onDeleteTask(inst.task.id)}
                onUpdateTimeLogs={onUpdateTimeLogs}
                onUpdateSubtasks={onUpdateSubtasks}
                draggable
              />
            ))}
          </div>
        </div>
      )}

      {/* Pending */}
      {pending.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-semibold text-slate-400 mb-1.5">
            Tasks · {pending.length}
          </div>
          <div className="space-y-1.5">
            {pending.map(inst => (
              <TaskCard
                key={inst.task.id + inst.instanceDate}
                instance={inst}
                tags={tags}
                streak={inst.task.isRecurring ? streaks[inst.task.id] : undefined}
                onToggle={() => onToggleTask(inst)}
                onEdit={() => onEditTask(inst)}
                onDelete={() => onDeleteTask(inst.task.id)}
                onUpdateTimeLogs={onUpdateTimeLogs}
                onUpdateSubtasks={onUpdateSubtasks}
                draggable
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-semibold text-slate-500 mb-1.5">
            Done · {completed.length}
          </div>
          <div className="space-y-1.5">
            {completed.map(inst => (
              <TaskCard
                key={inst.task.id + inst.instanceDate}
                instance={inst}
                tags={tags}
                onToggle={() => onToggleTask(inst)}
                onEdit={() => onEditTask(inst)}
                onDelete={() => onDeleteTask(inst.task.id)}
                onUpdateTimeLogs={onUpdateTimeLogs}
                onUpdateSubtasks={onUpdateSubtasks}
              />
            ))}
          </div>
        </div>
      )}

      {instances.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-slate-600">
            <div className="text-3xl mb-2">✓</div>
            <div className="text-sm">Nothing scheduled</div>
          </div>
        </div>
      )}

      {/* Journal */}
      <div className="mt-auto pt-3 border-t border-slate-700/50">
        <button
          onClick={() => setShowJournal(v => !v)}
          className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors w-full"
        >
          <BookOpen size={13} />
          <span>Daily note</span>
          {journalText && <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />}
          <span className="ml-auto">{showJournal ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</span>
        </button>
        {showJournal && (
          <textarea
            className="mt-2 w-full bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 resize-none focus:outline-none focus:border-violet-500/50 transition-colors"
            rows={4}
            placeholder="Write a note for this day..."
            value={journalText}
            onChange={e => setJournalText(e.target.value)}
            onBlur={handleJournalBlur}
          />
        )}
      </div>
    </div>
  )
}
