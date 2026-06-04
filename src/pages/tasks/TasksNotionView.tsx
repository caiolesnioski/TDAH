import React, { useState, useRef, useEffect } from 'react';
import {
  CalendarDays, ListTodo, BookOpen, Briefcase, Home, Heart, Gamepad2,
  MoreHorizontal, Plus, ChevronRight, ChevronDown, Flag, Clock, Trash2, Play, X, Brain, Tag,
} from 'lucide-react';
import { TaskCategory, TaskPriority, TaskStatus } from '@/types';
import type { Task } from '@/types';
import { cn } from '@/lib/utils';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { useFloatingTimerStore } from '@/store/floatingTimerStore';

// ─── types ─────────────────────────────────────────────────────────────────────

type TaskPatch = {
  title?: string;
  description?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  status?: TaskStatus;
  estimatedMinutes?: number;
  dueDate?: string;
};

type TimeGroup = 'morning' | 'afternoon' | 'night' | 'notime';

// ─── constants ─────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<TaskCategory, {
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bg: string;
}> = {
  [TaskCategory.STUDY]:   { label: 'Estudos',  Icon: BookOpen,       color: 'text-indigo-400', bg: 'bg-indigo-500/15 text-indigo-300' },
  [TaskCategory.WORK]:    { label: 'Trabalho', Icon: Briefcase,      color: 'text-blue-400',   bg: 'bg-blue-500/15 text-blue-300' },
  [TaskCategory.HOME]:    { label: 'Casa',     Icon: Home,           color: 'text-green-400',  bg: 'bg-green-500/15 text-green-300' },
  [TaskCategory.HEALTH]:  { label: 'Saúde',    Icon: Heart,          color: 'text-rose-400',   bg: 'bg-rose-500/15 text-rose-300' },
  [TaskCategory.LEISURE]: { label: 'Lazer',    Icon: Gamepad2,       color: 'text-purple-400', bg: 'bg-purple-500/15 text-purple-300' },
  [TaskCategory.OTHER]:   { label: 'Outros',   Icon: MoreHorizontal, color: 'text-gray-400',   bg: 'bg-gray-500/15 text-gray-300' },
};

const CATEGORY_KEYS = [
  TaskCategory.STUDY, TaskCategory.WORK, TaskCategory.HOME,
  TaskCategory.HEALTH, TaskCategory.LEISURE, TaskCategory.OTHER,
] as const;

const TIME_GROUP_DEFS: { key: TimeGroup; label: string }[] = [
  { key: 'morning',   label: 'Manhã' },
  { key: 'afternoon', label: 'Tarde' },
  { key: 'night',     label: 'Noite' },
  { key: 'notime',    label: 'Sem horário' },
];

// ─── helpers ───────────────────────────────────────────────────────────────────

function todayStr() { return new Date().toISOString().slice(0, 10); }

function formatDisplayDate(): string {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
}

function getDeadlineDate(deadline: string): string { return deadline ? deadline.slice(0, 10) : ''; }

function getDeadlineTime(deadline: string): string {
  if (!deadline || !deadline.includes('T')) return '';
  return deadline.slice(11, 16);
}

function getTimeGroup(deadline: string): TimeGroup {
  const t = getDeadlineTime(deadline);
  if (!t) return 'notime';
  const h = parseInt(t.slice(0, 2), 10);
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  return 'night';
}

// ─── FilterButton ──────────────────────────────────────────────────────────────

function FilterButton({ active, onClick, icon, label, count }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm transition-colors',
        active ? 'bg-primary/15 text-primary' : 'text-base-content hover:bg-base-300',
      )}
    >
      {icon}
      <span className="flex-1 text-left whitespace-nowrap">{label}</span>
      <span className="text-xs text-base-content/40">{count}</span>
    </button>
  );
}

// ─── TaskRow ───────────────────────────────────────────────────────────────────

function TaskRow({ task, onToggle, onSelect }: {
  task: Task; onToggle: (t: Task) => void; onSelect: (t: Task) => void;
}) {
  const isCompleted = task.status === TaskStatus.COMPLETED;
  const cat = CATEGORY_META[task.category];
  const time = getDeadlineTime(task.deadline);
  const { start } = useFloatingTimerStore();
  const isStudy = task.category === TaskCategory.STUDY;

  const priorityBorder = !isCompleted ? {
    [TaskPriority.HIGH]:   'border-l-2 border-l-red-500 bg-red-500/5 hover:bg-red-500/10',
    [TaskPriority.MEDIUM]: 'border-l-2 border-l-amber-400 bg-amber-400/5 hover:bg-amber-400/10',
    [TaskPriority.LOW]:    'hover:bg-base-300/50',
  }[task.priority] : 'hover:bg-base-300/50';

  return (
    <div className={cn('flex items-center gap-3 px-4 py-2.5 rounded-lg group transition-colors', priorityBorder)}>
      <button
        onClick={() => onToggle(task)}
        className={cn(
          'w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all flex items-center justify-center',
          isCompleted ? 'bg-success/60 border-success/60' : 'border-base-content/30 hover:border-primary',
        )}
        aria-label={isCompleted ? 'Desmarcar' : 'Concluir'}
      >
        {isCompleted && (
          <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none">
            <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <span className={cn(
        'flex-1 text-sm min-w-0 truncate',
        isCompleted ? 'line-through text-base-content/40' : 'text-base-content font-medium',
        task.priority === TaskPriority.HIGH && !isCompleted && 'text-red-300',
      )}>
        {task.title}
      </span>

      <span className={cn('text-xs px-2 py-0.5 rounded-full hidden sm:inline-flex items-center gap-1 flex-shrink-0', cat.bg)}>
        <cat.Icon size={10} />
        {cat.label}
      </span>

      {time && <span className="text-xs text-base-content/50 tabular-nums flex-shrink-0">{time}</span>}

      {task.priority === TaskPriority.HIGH && (
        <Flag size={12} className="text-red-400 flex-shrink-0" />
      )}
      {task.priority === TaskPriority.MEDIUM && (
        <Flag size={12} className="text-amber-400 flex-shrink-0" />
      )}

      {!isCompleted && (
        <button
          onClick={() => start(task, isStudy ? 25 : 30, isStudy)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-primary/60 hover:text-primary flex-shrink-0"
          title={isStudy ? 'Iniciar Pomodoro' : 'Iniciar timer'}
          aria-label="Iniciar timer"
        >
          {isStudy ? <Brain size={14} /> : <Play size={13} />}
        </button>
      )}

      <button
        onClick={() => onSelect(task)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-base-content/40 hover:text-base-content flex-shrink-0"
        aria-label="Detalhes"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

// ─── DetailPanel ───────────────────────────────────────────────────────────────

function DetailPanel({ task, onClose }: { task: Task; onClose: () => void }) {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { start } = useFloatingTimerStore();

  const [title, setTitle]                       = useState(task.title);
  const [description, setDescription]           = useState(task.description ?? '');
  const [category, setCategory]                 = useState(String(task.category));
  const [priority, setPriority]                 = useState(String(task.priority));
  const [estimatedMinutes, setEstimatedMinutes] = useState(String(task.estimatedMinutes));
  const [date, setDate]                         = useState(getDeadlineDate(task.deadline));
  const [time, setTime]                         = useState(getDeadlineTime(task.deadline));

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description ?? '');
    setCategory(String(task.category));
    setPriority(String(task.priority));
    setEstimatedMinutes(String(task.estimatedMinutes));
    setDate(getDeadlineDate(task.deadline));
    setTime(getDeadlineTime(task.deadline));
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [task.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function save(patch: TaskPatch) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateTask.mutate({ id: task.id, data: patch });
    }, 500);
  }

  function buildDeadline(d: string, t: string) {
    if (!d) return undefined;
    return t ? `${d}T${t}:00` : d;
  }

  function handleDelete() {
    if (!window.confirm('Excluir esta tarefa permanentemente?')) return;
    deleteTask.mutate(task.id);
    onClose();
  }

  const isStudy = Number(category) === TaskCategory.STUDY;
  const duration = Number(estimatedMinutes) > 0 ? Number(estimatedMinutes) : (isStudy ? 25 : 30);

  return (
    <div className="fixed inset-0 z-40" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside className="absolute right-0 top-0 h-full w-72 bg-base-200 border-l border-base-300 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-base-300 flex-shrink-0">
          <span className="text-sm font-semibold text-base-content">Detalhes</span>
          <button onClick={onClose} className="btn btn-ghost btn-xs btn-circle"><X size={14} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <input
            className="w-full text-sm font-semibold bg-transparent border-b border-base-300 pb-2 focus:outline-none focus:border-primary text-base-content"
            value={title}
            onChange={(e) => { setTitle(e.target.value); save({ title: e.target.value }); }}
          />

          <div className="flex items-center gap-3">
            <CalendarDays size={14} className="text-base-content/50 flex-shrink-0" />
            <input type="date" className="flex-1 text-sm bg-transparent text-base-content focus:outline-none"
              value={date}
              onChange={(e) => { setDate(e.target.value); save({ dueDate: buildDeadline(e.target.value, time) }); }} />
          </div>

          <div className="flex items-center gap-3">
            <Clock size={14} className="text-base-content/50 flex-shrink-0" />
            <input type="time" className="flex-1 text-sm bg-transparent text-base-content focus:outline-none"
              value={time}
              onChange={(e) => { setTime(e.target.value); save({ dueDate: buildDeadline(date, e.target.value) }); }} />
          </div>

          <div className="flex items-center gap-3">
            <Tag size={14} className="text-base-content/50 flex-shrink-0" />
            <select className="flex-1 text-sm bg-base-200 text-base-content focus:outline-none rounded"
              value={category}
              onChange={(e) => { setCategory(e.target.value); save({ category: Number(e.target.value) as TaskCategory }); }}>
              {CATEGORY_KEYS.map((k) => (
                <option key={k} value={k}>{CATEGORY_META[k].label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <Flag size={14} className="text-base-content/50 flex-shrink-0" />
            <select className="flex-1 text-sm bg-base-200 text-base-content focus:outline-none rounded"
              value={priority}
              onChange={(e) => { setPriority(e.target.value); save({ priority: Number(e.target.value) as TaskPriority }); }}>
              <option value={TaskPriority.HIGH}>Alta</option>
              <option value={TaskPriority.MEDIUM}>Média</option>
              <option value={TaskPriority.LOW}>Baixa</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <Clock size={14} className="text-base-content/50 flex-shrink-0" />
            <input type="number" min={1} className="w-16 text-sm bg-transparent text-base-content focus:outline-none"
              value={estimatedMinutes}
              onChange={(e) => {
                setEstimatedMinutes(e.target.value);
                const n = Number(e.target.value);
                if (n > 0) save({ estimatedMinutes: n });
              }} />
            <span className="text-xs text-base-content/40">min</span>
          </div>

          <textarea className="w-full text-sm bg-base-300/50 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-primary text-base-content resize-none"
            rows={4} placeholder="Notas..."
            value={description}
            onChange={(e) => { setDescription(e.target.value); save({ description: e.target.value }); }} />
        </div>

        <div className="p-4 border-t border-base-300 space-y-2 flex-shrink-0">
          <button
            className="btn btn-primary btn-sm w-full gap-2"
            onClick={() => { start(task, duration, isStudy); onClose(); }}
          >
            {isStudy ? <><Brain size={14} /> Iniciar Pomodoro</> : <><Play size={14} /> Iniciar timer</>}
          </button>
          <button className="btn btn-ghost btn-sm w-full text-error gap-2" onClick={handleDelete}>
            <Trash2 size={14} /> Excluir tarefa
          </button>
        </div>
      </aside>
    </div>
  );
}

// ─── main ──────────────────────────────────────────────────────────────────────

export default function TasksNotionView() {
  const { data: tasks = [], isLoading } = useTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { start } = useFloatingTimerStore();

  const [activeFilter, setActiveFilter] = useState<'today' | 'all' | TaskCategory | string>('today');
  const [selectedTask,  setSelectedTask]  = useState<Task | null>(null);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [showCompleted,   setShowCompleted]   = useState(false);

  // form state
  const [newTitle,    setNewTitle]    = useState('');
  const [newDate,     setNewDate]     = useState('');
  const [newTime,     setNewTime]     = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [newCategory, setNewCategory] = useState<TaskCategory>(TaskCategory.OTHER);
  const [newDuration, setNewDuration] = useState(25);
  const [showDatePicker,     setShowDatePicker]     = useState(false);
  const [showTimePicker,     setShowTimePicker]     = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // custom lists (local — use provided SQL migration for persistence)
  const [customLists,      setCustomLists]      = useState<{ id: string; name: string }[]>([]);
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [newListName,      setNewListName]      = useState('');

  const newTitleRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (showNewTaskForm) newTitleRef.current?.focus(); }, [showNewTaskForm]);

  const today = todayStr();
  const isStudySelected = newCategory === TaskCategory.STUDY;

  function matchesFilter(t: Task): boolean {
    if (activeFilter === 'today') {
      const dd = getDeadlineDate(t.deadline);
      const cd = t.createdAt.slice(0, 10);
      return dd === today || (!t.deadline && cd === today);
    }
    if (activeFilter === 'all') return true;
    if (typeof activeFilter === 'string' && activeFilter.startsWith('list-')) return true;
    return t.category === (activeFilter as TaskCategory);
  }

  const activeTasks    = tasks.filter((t) => matchesFilter(t) && t.status !== TaskStatus.COMPLETED);
  const completedTasks = tasks.filter((t) => matchesFilter(t) && t.status === TaskStatus.COMPLETED);

  const grouped: Record<TimeGroup, Task[]> = { morning: [], afternoon: [], night: [], notime: [] };
  activeTasks.forEach((t) => grouped[getTimeGroup(t.deadline)].push(t));

  const todayCount = tasks.filter((t) => {
    const dd = getDeadlineDate(t.deadline);
    const cd = t.createdAt.slice(0, 10);
    return (dd === today || (!t.deadline && cd === today)) && t.status !== TaskStatus.COMPLETED;
  }).length;
  const allCount = tasks.filter((t) => t.status !== TaskStatus.COMPLETED).length;
  const categoryCounts = CATEGORY_KEYS.reduce<Partial<Record<TaskCategory, number>>>((acc, k) => {
    acc[k] = tasks.filter((t) => t.category === k && t.status !== TaskStatus.COMPLETED).length;
    return acc;
  }, {});

  function handleToggle(task: Task) {
    const newStatus = task.status === TaskStatus.COMPLETED ? TaskStatus.PENDING : TaskStatus.COMPLETED;
    updateTask.mutate({ id: task.id, data: { status: newStatus } });
  }

  function resetForm() {
    setNewTitle(''); setNewDate(''); setNewTime('');
    setNewPriority(TaskPriority.MEDIUM); setNewCategory(TaskCategory.OTHER); setNewDuration(25);
    setShowNewTaskForm(false);
    setShowDatePicker(false); setShowTimePicker(false);
    setShowPriorityPicker(false); setShowCategoryPicker(false);
  }

  function handleSaveNew(asCompleted = false) {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    const dueDate = newDate ? (newTime ? `${newDate}T${newTime}:00` : newDate) : undefined;
    createTask.mutate(
      {
        title: trimmed, category: newCategory, priority: newPriority, dueDate,
        ...(asCompleted ? { status: TaskStatus.COMPLETED } : {}),
      },
      {
        onSuccess: () => {
          setNewTitle('');
          setNewDate('');
          setNewTime('');
          setShowDatePicker(false);
          setShowTimePicker(false);
          setShowPriorityPicker(false);
          setShowCategoryPicker(false);
          if (asCompleted) setShowCompleted(true);
          setTimeout(() => newTitleRef.current?.focus(), 0);
        },
      },
    );
  }

  function handleSaveAndStart() {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    const dueDate = newDate ? (newTime ? `${newDate}T${newTime}:00` : newDate) : undefined;
    const tempTask = {
      id: 'tmp-' + Date.now(), title: trimmed, category: newCategory,
      priority: newPriority, status: TaskStatus.PENDING,
      description: '', estimatedMinutes: newDuration, actualMinutes: 0,
      deadline: dueDate ?? '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    } as Task;
    createTask.mutate(
      { title: trimmed, category: newCategory, priority: newPriority, dueDate },
      { onSuccess: resetForm },
    );
    start(tempTask, newDuration, isStudySelected);
  }

  function handleClearCompleted() {
    if (!window.confirm(`Excluir ${completedTasks.length} tarefa(s) concluída(s)?`)) return;
    completedTasks.forEach((t) => deleteTask.mutate(t.id));
  }

  function handleAddList() {
    const name = newListName.trim();
    if (!name) return;
    setCustomLists((prev) => [...prev, { id: 'list-' + Date.now(), name }]);
    setNewListName(''); setShowNewListInput(false);
  }

  const viewTitle =
    activeFilter === 'today' ? 'Hoje' :
    activeFilter === 'all'   ? 'Todas as Tarefas' :
    typeof activeFilter === 'string' && activeFilter.startsWith('list-')
      ? (customLists.find((l) => l.id === activeFilter)?.name ?? 'Lista')
      : (CATEGORY_META[activeFilter as TaskCategory]?.label ?? 'Tarefas');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="loading loading-spinner loading-md text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full min-h-0 overflow-hidden">
        {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
        <aside className="w-44 shrink-0 bg-base-200 border-r border-base-300 p-3 flex flex-col overflow-y-auto">
          <div className="space-y-0.5">
            <FilterButton active={activeFilter === 'today'} onClick={() => setActiveFilter('today')}
              icon={<CalendarDays size={14} className="text-blue-400" />} label="Hoje" count={todayCount} />
            <FilterButton active={activeFilter === 'all'} onClick={() => setActiveFilter('all')}
              icon={<ListTodo size={14} className="text-base-content/60" />} label="Todos" count={allCount} />
          </div>

          <p className="text-[10px] font-semibold text-base-content/40 tracking-widest px-2 mt-4 mb-1 uppercase">
            Minhas listas
          </p>
          <div className="space-y-0.5">
            {CATEGORY_KEYS.map((k) => {
              const { label, Icon, color } = CATEGORY_META[k];
              return (
                <FilterButton key={k} active={activeFilter === k} onClick={() => setActiveFilter(k)}
                  icon={<Icon size={14} className={color} />} label={label} count={categoryCounts[k] ?? 0} />
              );
            })}
          </div>

          {customLists.length > 0 && (
            <>
              <p className="text-[10px] font-semibold text-base-content/40 tracking-widest px-2 mt-4 mb-1 uppercase">
                Listas
              </p>
              <div className="space-y-0.5">
                {customLists.map((list) => (
                  <FilterButton key={list.id} active={activeFilter === list.id}
                    onClick={() => setActiveFilter(list.id)}
                    icon={<Tag size={14} className="text-base-content/50" />} label={list.name} count={allCount} />
                ))}
              </div>
            </>
          )}

          <div className="mt-auto pt-4">
            {showNewListInput ? (
              <div className="flex items-center gap-1">
                <input
                  className="flex-1 text-xs bg-base-300 rounded px-2 py-1 focus:outline-none text-base-content"
                  placeholder="Nome da lista..."
                  value={newListName} autoFocus
                  onChange={(e) => setNewListName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddList();
                    if (e.key === 'Escape') { setShowNewListInput(false); setNewListName(''); }
                  }}
                />
                <button onClick={handleAddList} className="btn btn-primary btn-xs">✓</button>
              </div>
            ) : (
              <button
                className="flex items-center gap-2 w-full px-2 py-2 text-sm text-base-content/50 hover:text-base-content transition-colors"
                onClick={() => setShowNewListInput(true)}
              >
                <Plus size={15} /> Nova lista
              </button>
            )}
          </div>
        </aside>

        {/* ── MAIN ────────────────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-start justify-between px-6 pt-6 pb-4 flex-shrink-0">
            <div>
              <h1 className="text-xl font-bold text-base-content">{viewTitle}</h1>
              <p className="text-sm text-base-content/50 capitalize mt-0.5">{formatDisplayDate()}</p>
            </div>
            <button onClick={() => setShowNewTaskForm(true)} className="btn btn-primary btn-sm gap-1.5">
              <Plus size={14} /> Nova Tarefa
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-8">
            {/* Inline new-task form */}
            {showNewTaskForm && (
              <div className="mb-4 bg-base-300/30 rounded-xl border border-base-300">
                {/* Input row */}
                <div className="flex items-center gap-2 px-4 py-2.5">
                  <button
                    onClick={() => handleSaveNew(true)}
                    title="Salvar como concluída"
                    className={cn(
                      'w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all flex items-center justify-center group/circle',
                      newTitle.trim()
                        ? 'border-base-content/40 hover:border-success hover:bg-success/20 cursor-pointer'
                        : 'border-base-content/15 cursor-default',
                    )}
                  >
                    <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 opacity-0 group-hover/circle:opacity-60 transition-opacity" fill="none">
                      <path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-success" />
                    </svg>
                  </button>
                  <input
                    ref={newTitleRef}
                    className="flex-1 text-sm bg-transparent focus:outline-none text-base-content placeholder:text-base-content/40 min-w-0"
                    placeholder="Título da tarefa..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveNew();
                      if (e.key === 'Escape') resetForm();
                    }}
                  />

                  {/* Date */}
                  <div className="relative flex-shrink-0">
                    <button onClick={() => { setShowDatePicker(!showDatePicker); setShowTimePicker(false); setShowPriorityPicker(false); setShowCategoryPicker(false); }}
                      className={cn('btn btn-ghost btn-xs', newDate && 'text-primary')}>
                      <CalendarDays size={13} />
                    </button>
                    {showDatePicker && (
                      <div className="absolute top-8 right-0 z-50 bg-base-100 border border-base-300 rounded-lg p-2 shadow-xl">
                        <input type="date" className="text-sm bg-transparent text-base-content focus:outline-none"
                          value={newDate} onChange={(e) => { setNewDate(e.target.value); setShowDatePicker(false); }} />
                      </div>
                    )}
                  </div>

                  {/* Time */}
                  <div className="relative flex-shrink-0">
                    <button onClick={() => { setShowTimePicker(!showTimePicker); setShowDatePicker(false); setShowPriorityPicker(false); setShowCategoryPicker(false); }}
                      className={cn('btn btn-ghost btn-xs', newTime && 'text-primary')}>
                      <Clock size={13} />
                    </button>
                    {showTimePicker && (
                      <div className="absolute top-8 right-0 z-50 bg-base-100 border border-base-300 rounded-lg p-2 shadow-xl">
                        <input type="time" className="text-sm bg-transparent text-base-content focus:outline-none"
                          value={newTime} onChange={(e) => { setNewTime(e.target.value); setShowTimePicker(false); }} />
                      </div>
                    )}
                  </div>

                  {/* Category */}
                  <div className="relative flex-shrink-0">
                    <button onClick={() => { setShowCategoryPicker(!showCategoryPicker); setShowDatePicker(false); setShowTimePicker(false); setShowPriorityPicker(false); }}
                      className="btn btn-ghost btn-xs">
                      {(() => { const { Icon, color } = CATEGORY_META[newCategory]; return <Icon size={13} className={color} />; })()}
                    </button>
                    {showCategoryPicker && (
                      <div className="absolute top-8 right-0 z-50 bg-base-100 border border-base-300 rounded-xl p-2 shadow-xl grid grid-cols-3 gap-1 min-w-[176px]">
                        {CATEGORY_KEYS.map((k) => {
                          const { label, Icon, color } = CATEGORY_META[k];
                          return (
                            <button key={k}
                              className={cn('flex flex-col items-center gap-1 p-2 rounded-lg text-xs hover:bg-base-200 transition-colors', newCategory === k && 'bg-primary/15 text-primary')}
                              onClick={() => {
                                setNewCategory(k); setShowCategoryPicker(false);
                                if (k === TaskCategory.STUDY) setNewDuration(25);
                              }}>
                              <Icon size={14} className={color} />{label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Priority */}
                  <div className="relative flex-shrink-0">
                    <button onClick={() => { setShowPriorityPicker(!showPriorityPicker); setShowDatePicker(false); setShowTimePicker(false); setShowCategoryPicker(false); }}
                      className={cn('btn btn-ghost btn-xs',
                        newPriority === TaskPriority.HIGH && 'text-red-400',
                        newPriority === TaskPriority.MEDIUM && 'text-amber-400',
                      )}>
                      <Flag size={13} />
                    </button>
                    {showPriorityPicker && (
                      <div className="absolute top-8 right-0 z-50 bg-base-100 border border-base-300 rounded-lg shadow-xl overflow-hidden min-w-[80px]">
                        {([TaskPriority.HIGH, TaskPriority.MEDIUM, TaskPriority.LOW] as const).map((p) => (
                          <button key={p} className="block w-full text-left px-3 py-1.5 text-sm hover:bg-base-200 text-base-content"
                            onClick={() => { setNewPriority(p); setShowPriorityPicker(false); }}>
                            {p === TaskPriority.HIGH ? 'Alta' : p === TaskPriority.MEDIUM ? 'Média' : 'Baixa'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button onClick={() => handleSaveNew()} className="btn btn-ghost btn-xs flex-shrink-0">✓</button>
                  <button onClick={resetForm} className="btn btn-ghost btn-xs flex-shrink-0"><X size={13} /></button>
                </div>

                {/* Duration + Start row */}
                <div className="flex items-center gap-2 px-4 pb-3 border-t border-base-300/50 pt-2">
                  <Clock size={11} className="text-base-content/40" />
                  <span className="text-xs text-base-content/40">Duração:</span>
                  <div className="flex gap-1">
                    {[15, 25, 30, 45, 60].map((d) => (
                      <button key={d}
                        className={cn('text-xs px-2 py-0.5 rounded-full border transition-colors',
                          newDuration === d
                            ? 'border-primary text-primary bg-primary/10'
                            : 'border-base-300 text-base-content/50 hover:border-base-content/50')}
                        onClick={() => setNewDuration(d)}>
                        {d}m
                      </button>
                    ))}
                  </div>

                  {isStudySelected && (
                    <span className="flex items-center gap-1 text-xs text-red-400">
                      <Brain size={11} /> Pomodoro
                    </span>
                  )}

                  <button
                    onClick={handleSaveAndStart}
                    disabled={!newTitle.trim()}
                    className="ml-auto btn btn-primary btn-xs gap-1.5 disabled:opacity-40"
                  >
                    <Play size={11} /> Start
                  </button>
                </div>
              </div>
            )}

            {/* Empty state */}
            {activeTasks.length === 0 && !showNewTaskForm && (
              <div className="flex flex-col items-center justify-center py-16 text-base-content/30">
                <ListTodo size={36} className="mb-3" />
                <p className="text-sm">Nenhuma tarefa aqui</p>
                <button className="mt-3 text-xs text-primary hover:underline" onClick={() => setShowNewTaskForm(true)}>
                  + Criar tarefa
                </button>
              </div>
            )}

            {/* Time groups */}
            {TIME_GROUP_DEFS.map(({ key, label }) => {
              if (grouped[key].length === 0) return null;
              return (
                <div key={key} className="mb-4">
                  <div className="text-xs font-semibold text-base-content/40 uppercase tracking-widest py-2 border-b border-base-300 mb-1">
                    {label}
                  </div>
                  {grouped[key].map((task) => (
                    <TaskRow key={task.id} task={task} onToggle={handleToggle} onSelect={setSelectedTask} />
                  ))}
                </div>
              );
            })}

            {/* Completed accordion */}
            {completedTasks.length > 0 && (
              <div className="mt-6 border-t border-base-300 pt-2">
                <div className="flex items-center">
                  <button
                    onClick={() => setShowCompleted((v) => !v)}
                    className="flex items-center gap-1.5 flex-1 text-sm text-base-content/50 hover:text-base-content py-2 transition-colors"
                  >
                    <ChevronDown size={14} className={cn('transition-transform', showCompleted && 'rotate-180')} />
                    Concluídas ({completedTasks.length})
                  </button>
                  {showCompleted && (
                    <button onClick={handleClearCompleted} className="text-xs text-error/50 hover:text-error transition-colors py-2 px-2">
                      Limpar
                    </button>
                  )}
                </div>
                {showCompleted && (
                  <div className="opacity-60">
                    {completedTasks.map((task) => (
                      <TaskRow key={task.id} task={task} onToggle={handleToggle} onSelect={setSelectedTask} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {selectedTask && <DetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </>
  );
}
