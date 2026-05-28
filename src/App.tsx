import { useState, useCallback, useMemo, useEffect } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { format, addMonths, subMonths, addWeeks, subWeeks, startOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Search, LayoutGrid, Calendar as CalendarIcon, List } from 'lucide-react'

import useAppData from './hooks/useAppData'
import { getMonthGrid, getWeekDays, today } from './utils/dateUtils'
import type { Task, TaskInstance, ViewMode } from './types'
import { getCurrentUser, logOut } from './utils/auth'
import type { StoredUser } from './utils/auth'
import { exportToICal } from './utils/ical'
import { scheduleNotifications } from './utils/notifications'

import Sidebar from './components/Sidebar'
import CalendarGrid from './components/CalendarGrid'
import WeekView from './components/WeekView'
import AgendaView from './components/AgendaView'
import DayPanel from './components/DayPanel'
import TaskModal from './components/TaskModal'
import WeeklyReview from './components/WeeklyReview'
import AuthScreen from './components/AuthScreen'
import SearchModal from './components/SearchModal'

export default function App() {
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(getCurrentUser)

  if (!currentUser) {
    return <AuthScreen onAuth={setCurrentUser} />
  }

  return <CalendarView user={currentUser} onLogout={() => setCurrentUser(null)} />
}

function CalendarView({ user, onLogout }: { user: StoredUser; onLogout: () => void }) {
  const handleLogout = () => {
    logOut()
    onLogout()
  }
  const {
    data, addTask, updateTask, deleteTask,
    completeTask, uncompleteTask,
    completeRecurringInstance, isRecurringCompleted,
    getInstancesForDate, addTag, deleteTag,
    saveJournal, getJournal,
    rescheduleTask, getStreak, getWeeklySummary,
    updateSubtasks, updateTimeLogs, getWeeklyTimeLogged,
  } = useAppData(user.id)

  const [view, setView] = useState<ViewMode>('month')
  const [anchorDate, setAnchorDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(today())
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [defaultModalDate, setDefaultModalDate] = useState<string | undefined>()
  const [showReview, setShowReview] = useState(false)
  const [reviewWeekStart, setReviewWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [showDayPanel, setShowDayPanel] = useState(false)

  // Schedule notifications on mount
  useEffect(() => {
    const cleanup = scheduleNotifications(data.tasks)
    return cleanup
  }, [data.tasks])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'

      if (e.key === 'Escape') {
        setShowSearch(false)
        setShowModal(false)
        setShowReview(false)
        setEditingTask(null)
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(v => !v)
        return
      }

      if (isTyping) return

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        handleAddTask(selectedDate)
      } else if (e.key === '/' ) {
        e.preventDefault()
        setShowSearch(true)
      } else if (e.key === 't' || e.key === 'T') {
        goToday()
      } else if (e.key === 'ArrowLeft') {
        goBack()
      } else if (e.key === 'ArrowRight') {
        goForward()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedDate, view, anchorDate])

  // Navigation
  const goBack = () => {
    if (view === 'month') setAnchorDate(d => subMonths(d, 1))
    else if (view === 'week') setAnchorDate(d => subWeeks(d, 1))
    else setAnchorDate(d => subWeeks(d, 3))
  }
  const goForward = () => {
    if (view === 'month') setAnchorDate(d => addMonths(d, 1))
    else if (view === 'week') setAnchorDate(d => addWeeks(d, 1))
    else setAnchorDate(d => addWeeks(d, 3))
  }
  const goToday = () => {
    setAnchorDate(new Date())
    setSelectedDate(today())
  }

  // Calendar data
  const monthDays = useMemo(() => getMonthGrid(anchorDate.getFullYear(), anchorDate.getMonth()), [anchorDate])
  const weekDays = useMemo(() => getWeekDays(anchorDate), [anchorDate])

  // Streaks cache
  const streaks = useMemo(() => {
    const result: Record<string, number> = {}
    for (const task of data.tasks.filter(t => t.isRecurring)) {
      result[task.id] = getStreak(task.id)
    }
    return result
  }, [data.tasks, data.completionLogs, getStreak])

  // Filter instances by tag
  const getFilteredInstances = useCallback((dateStr: string): TaskInstance[] => {
    let instances = getInstancesForDate(dateStr)
    if (tagFilter) {
      instances = instances.filter(i => i.task.tagIds.includes(tagFilter))
    }
    return instances
  }, [getInstancesForDate, tagFilter])

  // Task actions
  const handleToggle = (inst: TaskInstance) => {
    if (inst.task.isRecurring) {
      completeRecurringInstance(inst.task.id, inst.instanceDate)
    } else {
      if (inst.isCompleted) uncompleteTask(inst.task.id)
      else completeTask(inst.task.id)
    }
  }

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData)
    } else {
      addTask(taskData)
    }
    setShowModal(false)
    setEditingTask(null)
  }

  const handleAddTask = (date?: string) => {
    setEditingTask(null)
    setDefaultModalDate(date)
    setShowModal(true)
  }

  const handleEditTask = (inst: TaskInstance) => {
    setEditingTask(inst.task)
    setShowModal(true)
  }

  const handleDeleteTask = (id: string) => {
    deleteTask(id)
  }

  const handleExportICal = () => {
    exportToICal(data.tasks, data.completionLogs)
  }

  const handleNavigateToTask = (date: string, _taskId: string) => {
    setSelectedDate(date)
    setAnchorDate(new Date(date))
    setShowDayPanel(true)
  }

  // Drag and drop
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    rescheduleTask(String(active.id), String(over.id))
  }

  // Header label
  const headerLabel = useMemo(() => {
    if (view === 'month') return format(anchorDate, 'MMMM yyyy')
    if (view === 'week') {
      const days = getWeekDays(anchorDate)
      return `${format(days[0], 'MMM d')} – ${format(days[6], 'MMM d, yyyy')}`
    }
    return format(anchorDate, 'MMM d, yyyy') + ' (next 3 weeks)'
  }, [view, anchorDate])

  const journal = getJournal(selectedDate)
  const selectedInstances = getFilteredInstances(selectedDate)
  const recurringTasks = data.tasks.filter(t => t.isRecurring)
  const weeklySummary = getWeeklySummary(reviewWeekStart)
  const weeklyTimeLogged = getWeeklyTimeLogged(reviewWeekStart)

  const MOBILE_NAV = [
    { id: 'month', label: 'Month', icon: LayoutGrid },
    { id: 'week', label: 'Week', icon: CalendarIcon },
    { id: 'agenda', label: 'Agenda', icon: List },
  ]

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex h-screen overflow-hidden" style={{ background: '#0f172a' }}>
        {/* Sidebar — hidden on mobile */}
        <div className="sidebar-desktop">
          <Sidebar
            view={view}
            onViewChange={v => setView(v as ViewMode)}
            tags={data.tags}
            recurringTasks={recurringTasks}
            completionLogs={data.completionLogs}
            onAddTag={(name, color) => addTag({ name, color })}
            onDeleteTag={deleteTag}
            onWeeklyReview={() => setShowReview(true)}
            onExportICal={handleExportICal}
            onAddTask={() => handleAddTask(selectedDate)}
            activeTagFilter={tagFilter}
            onTagFilter={setTagFilter}
            currentUser={user}
            onLogout={handleLogout}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top bar */}
          <div
            className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
            style={{
              background: 'rgba(15,23,42,0.95)',
              borderBottom: '1px solid rgba(148,163,184,0.08)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div className="flex items-center gap-1.5">
              <button
                onClick={goBack}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={goForward}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <h1 className="text-base font-bold text-slate-100 truncate">{headerLabel}</h1>

            <button
              onClick={goToday}
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 border border-slate-700 hover:border-violet-500/50 hover:text-violet-300 transition-all flex-shrink-0"
            >
              Today
            </button>

            <div className="ml-auto flex items-center gap-2">
              {tagFilter && (
                <div
                  className="px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                  style={{
                    background: `${data.tags.find(t => t.id === tagFilter)?.color}22`,
                    color: data.tags.find(t => t.id === tagFilter)?.color,
                    border: `1px solid ${data.tags.find(t => t.id === tagFilter)?.color}44`,
                  }}
                >
                  {data.tags.find(t => t.id === tagFilter)?.name}
                  <button onClick={() => setTagFilter(null)} className="hover:opacity-70">×</button>
                </div>
              )}
              <button
                onClick={() => setShowSearch(true)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
                title="Search (/ or Ctrl+K)"
              >
                <Search size={16} />
              </button>
              <button
                onClick={() => handleAddTask(selectedDate)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
              >
                <Plus size={15} /> <span className="hidden sm:inline">New Task</span>
              </button>
            </div>
          </div>

          {/* Calendar + Day panel */}
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Calendar area */}
            <div className="flex-1 overflow-auto p-3 main-scroll">
              {view === 'month' && (
                <CalendarGrid
                  days={monthDays}
                  currentMonth={anchorDate.getMonth()}
                  selectedDate={selectedDate}
                  getInstances={getFilteredInstances}
                  journals={data.journals}
                  tags={data.tags}
                  onSelectDate={d => { setSelectedDate(d); setShowDayPanel(true) }}
                />
              )}
              {view === 'week' && (
                <WeekView
                  days={weekDays}
                  selectedDate={selectedDate}
                  getInstances={getFilteredInstances}
                  tags={data.tags}
                  streaks={streaks}
                  onSelectDate={d => { setSelectedDate(d); setShowDayPanel(true) }}
                  onToggleTask={handleToggle}
                  onAddTask={handleAddTask}
                />
              )}
              {view === 'agenda' && (
                <AgendaView
                  startDate={anchorDate}
                  getInstances={getFilteredInstances}
                  tags={data.tags}
                  streaks={streaks}
                  onToggleTask={handleToggle}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  onAddTask={handleAddTask}
                  onSelectDate={d => { setSelectedDate(d); setShowDayPanel(true) }}
                />
              )}
            </div>

            {/* Day panel — desktop: sidebar; mobile: hidden (full-screen overlay) */}
            <div
              className="day-panel-desktop w-80 flex-shrink-0 overflow-y-auto p-4"
              style={{
                background: 'rgba(15,23,42,0.6)',
                borderLeft: '1px solid rgba(148,163,184,0.08)',
              }}
            >
              <DayPanel
                date={selectedDate}
                instances={selectedInstances}
                tags={data.tags}
                journal={journal?.content ?? ''}
                streaks={streaks}
                onAddTask={handleAddTask}
                onToggleTask={handleToggle}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onJournalChange={saveJournal}
                onReschedule={rescheduleTask}
                onUpdateTimeLogs={updateTimeLogs}
                onUpdateSubtasks={updateSubtasks}
                isToday={selectedDate === today()}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div
        className="mobile-nav hidden fixed bottom-0 left-0 right-0 z-40 items-center justify-around px-2 py-2"
        style={{
          background: 'rgba(10,15,30,0.97)',
          borderTop: '1px solid rgba(148,163,184,0.1)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {MOBILE_NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setView(id as ViewMode); setShowDayPanel(false) }}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all"
            style={{ color: view === id && !showDayPanel ? '#a78bfa' : '#475569' }}
          >
            <Icon size={20} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
        <button
          onClick={() => setShowSearch(true)}
          className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all"
          style={{ color: '#475569' }}
        >
          <Search size={20} />
          <span className="text-xs font-medium">Search</span>
        </button>
        <button
          onClick={() => handleAddTask(selectedDate)}
          className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl"
          style={{ color: '#a78bfa' }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
          >
            <Plus size={20} className="text-white" />
          </div>
        </button>
      </div>

      {/* Mobile Day Panel overlay */}
      {showDayPanel && (
        <div
          className="mobile-nav hidden fixed inset-0 z-30 flex-col"
          style={{ background: '#0f172a' }}
        >
          <div
            className="flex items-center gap-3 px-4 py-3"
            style={{ borderBottom: '1px solid rgba(148,163,184,0.08)' }}
          >
            <button
              onClick={() => setShowDayPanel(false)}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-semibold text-slate-200">
              {format(new Date(selectedDate), 'EEEE, MMM d')}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 pb-20">
            <DayPanel
              date={selectedDate}
              instances={selectedInstances}
              tags={data.tags}
              journal={journal?.content ?? ''}
              streaks={streaks}
              onAddTask={handleAddTask}
              onToggleTask={handleToggle}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onJournalChange={saveJournal}
              onReschedule={rescheduleTask}
              onUpdateTimeLogs={updateTimeLogs}
              onUpdateSubtasks={updateSubtasks}
              isToday={selectedDate === today()}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      {showSearch && (
        <SearchModal
          tasks={data.tasks}
          tags={data.tags}
          onClose={() => setShowSearch(false)}
          onNavigate={handleNavigateToTask}
        />
      )}
      {showModal && (
        <TaskModal
          task={editingTask}
          defaultDate={defaultModalDate}
          tags={data.tags}
          onSave={handleSaveTask}
          onClose={() => { setShowModal(false); setEditingTask(null) }}
        />
      )}
      {showReview && (
        <WeeklyReview
          summary={weeklySummary}
          weekStart={reviewWeekStart}
          weeklyTimeLogged={weeklyTimeLogged}
          onClose={() => setShowReview(false)}
          onPrevWeek={() => setReviewWeekStart(d => subWeeks(d, 1))}
          onNextWeek={() => setReviewWeekStart(d => addWeeks(d, 1))}
        />
      )}
    </DndContext>
  )
}
