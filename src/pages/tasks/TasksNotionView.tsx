import React, { useState, useRef, useEffect } from 'react';
import {
  CalendarDays, ListTodo, BookOpen, Briefcase, Home, Heart, Gamepad2,
  MoreHorizontal, Plus, ChevronRight, ChevronDown, Flag, Clock, Trash2, Play, X, Brain, Tag, Loader2,
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
  difficultyRating?: number;
};

type TimeGroup = 'morning' | 'afternoon' | 'night' | 'notime';

// ─── constants ─────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<TaskCategory, {
  label: string;
  Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
}> = {
  [TaskCategory.STUDY]:   { label: 'Estudos',  Icon: BookOpen,       iconColor: 'var(--color-reward)', badgeBg: 'var(--color-reward-bg)', badgeText: 'var(--color-reward)' },
  [TaskCategory.WORK]:    { label: 'Trabalho', Icon: Briefcase,      iconColor: 'var(--color-focus)',  badgeBg: 'var(--color-focus-bg)',  badgeText: 'var(--color-focus)' },
  [TaskCategory.HOME]:    { label: 'Casa',     Icon: Home,           iconColor: 'var(--color-done)',   badgeBg: 'var(--color-done-bg)',   badgeText: 'var(--color-done)' },
  [TaskCategory.HEALTH]:  { label: 'Saúde',    Icon: Heart,          iconColor: 'var(--color-alert)',  badgeBg: 'var(--color-alert-bg)', badgeText: 'var(--color-alert)' },
  [TaskCategory.LEISURE]: { label: 'Lazer',    Icon: Gamepad2,       iconColor: 'var(--color-action)', badgeBg: 'var(--color-action-bg)', badgeText: 'var(--color-action)' },
  [TaskCategory.OTHER]:   { label: 'Outros',   Icon: MoreHorizontal, iconColor: 'var(--color-text-muted)', badgeBg: 'var(--color-surface-2)', badgeText: 'var(--color-text-muted)' },
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
      style={{
        display:'flex',alignItems:'center',gap:'8px',width:'100%',padding:'6px 8px',
        borderRadius:'8px',fontSize:'13px',border:'none',cursor:'pointer',
        background: active ? 'var(--color-action-bg)' : 'transparent',
        color: active ? 'var(--color-action)' : 'var(--color-text-sec)',
      }}
    >
      {icon}
      <span style={{flex:1,textAlign:'left',whiteSpace:'nowrap'}}>{label}</span>
      <span style={{fontSize:'11px',color:'var(--color-text-muted)'}}>{count}</span>
    </button>
  );
}

// ─── DifficultyRatingModal ────────────────────────────────────────────────────

const DIFFICULTY_COLORS = ['var(--color-done)', '#6BBF7A', 'var(--color-action)', 'var(--color-focus)', 'var(--color-alert)'];
const DIFFICULTY_LABELS = ['Fácil', '', 'Ok', '', 'Difícil'];

function DifficultyRatingModal({ task, onRate, onSkip }: {
  task: Task; onRate: (rating: number) => void; onSkip: () => void;
}) {
  return (
    <div
      style={{position:'fixed',inset:0,zIndex:60,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center'}}
      onClick={onSkip}
    >
      <div
        style={{background:'var(--color-surface)',border:'1px solid var(--color-border)',borderRadius:'16px',padding:'24px 28px',width:'320px',boxShadow:'0 24px 48px rgba(0,0,0,0.24)'}}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
          <svg viewBox="0 0 12 12" width="14" height="14" fill="none">
            <path d="M2 6L5 9L10 3" stroke="var(--color-done)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{fontSize:'12px',color:'var(--color-done)',fontWeight:500}}>Tarefa concluída!</span>
        </div>
        <p style={{fontSize:'15px',fontWeight:600,color:'var(--color-text)',marginBottom:'20px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {task.title}
        </p>
        <p style={{fontSize:'13px',color:'var(--color-text-sec)',marginBottom:'14px'}}>
          Como foi a dificuldade?
        </p>
        <div style={{display:'flex',gap:'8px',marginBottom:'18px'}}>
          {[1,2,3,4,5].map((n) => (
            <button
              key={n}
              onClick={() => onRate(n)}
              style={{
                flex:1,height:'44px',borderRadius:'10px',border:'1px solid var(--color-border)',
                background:'var(--color-surface-2)',cursor:'pointer',display:'flex',
                flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'2px',
                transition:'background 0.12s,border-color 0.12s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = DIFFICULTY_COLORS[n-1];
                (e.currentTarget as HTMLButtonElement).style.background = DIFFICULTY_COLORS[n-1] + '22';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)';
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-surface-2)';
              }}
            >
              <span style={{fontSize:'15px',fontWeight:700,color:DIFFICULTY_COLORS[n-1]}}>{n}</span>
              {DIFFICULTY_LABELS[n-1] && (
                <span style={{fontSize:'9px',color:'var(--color-text-muted)',lineHeight:1}}>{DIFFICULTY_LABELS[n-1]}</span>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={onSkip}
          style={{width:'100%',background:'transparent',border:'none',color:'var(--color-text-muted)',fontSize:'12px',cursor:'pointer',padding:'4px'}}
        >
          Pular
        </button>
      </div>
    </div>
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

  const rowStyle: React.CSSProperties = !isCompleted
    ? task.priority === TaskPriority.HIGH
      ? { borderLeft: '2px solid var(--color-alert)', background: 'var(--color-alert-bg)' }
      : task.priority === TaskPriority.MEDIUM
      ? { borderLeft: '2px solid var(--color-action)', background: 'var(--color-action-bg)' }
      : {}
    : {};

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg group transition-colors" style={{...rowStyle, position: 'relative'}}>
      <button
        onClick={() => onToggle(task)}
        className="w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all flex items-center justify-center"
        style={{
          borderColor: isCompleted ? 'var(--color-done)' : 'var(--color-border)',
          background: isCompleted ? 'var(--color-done)' : 'transparent',
          cursor: 'pointer',
          padding: 0,
          position: 'relative',
          zIndex: 10,
        }}
        aria-label={isCompleted ? 'Desmarcar' : 'Concluir'}
      >
        {isCompleted && (
          <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" fill="none">
            <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <span
        className={cn('flex-1 text-sm min-w-0 truncate', isCompleted && 'line-through')}
        style={{
          color: isCompleted ? 'var(--color-text-muted)'
               : task.priority === TaskPriority.HIGH ? 'var(--color-alert)'
               : 'var(--color-text)',
          fontWeight: isCompleted ? 400 : 500,
        }}
      >
        {task.title}
      </span>

      <span
        className="hidden sm:inline-flex items-center gap-1 flex-shrink-0 text-xs"
        style={{padding:'2px 8px',borderRadius:'999px',background:cat.badgeBg,color:cat.badgeText}}
      >
        <cat.Icon size={10} />
        {cat.label}
      </span>

      {time && (
        <span style={{fontSize:'11px',color:'var(--color-text-muted)',fontVariantNumeric:'tabular-nums',flexShrink:0}}>
          {time}
        </span>
      )}

      {isCompleted && task.difficultyRating != null && (
        <span
          title={`Dificuldade: ${task.difficultyRating}/5`}
          style={{fontSize:'10px',fontWeight:600,color:DIFFICULTY_COLORS[task.difficultyRating-1],flexShrink:0,opacity:0.8}}
        >
          {task.difficultyRating}/5
        </span>
      )}

      {!isCompleted && task.priority === TaskPriority.HIGH && (
        <Flag size={12} style={{color:'var(--color-alert)',flexShrink:0}} />
      )}
      {!isCompleted && task.priority === TaskPriority.MEDIUM && (
        <Flag size={12} style={{color:'var(--color-action)',flexShrink:0}} />
      )}

      {!isCompleted && (
        <button
          onClick={() => start(task, isStudy ? 25 : 30, isStudy)}
          className="opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity flex-shrink-0"
          style={{background:'none',border:'none',cursor:'pointer',padding:0,color:'var(--color-action)'}}
          title={isStudy ? 'Iniciar Pomodoro' : 'Iniciar timer'}
          aria-label="Iniciar timer"
        >
          {isStudy ? <Brain size={14} /> : <Play size={13} />}
        </button>
      )}

      <button
        onClick={() => onSelect(task)}
        className="opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity flex-shrink-0"
        style={{background:'none',border:'none',cursor:'pointer',padding:0,color:'var(--color-text-muted)'}}
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

  const fieldStyle: React.CSSProperties = { display:'flex',alignItems:'center',gap:'12px' };
  const iconStyle: React.CSSProperties  = { color:'var(--color-text-muted)',flexShrink:0 };

  return (
    <div className="fixed inset-0 z-40" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside style={{position:'absolute',right:0,top:0,height:'100%',width:'288px',background:'var(--color-surface)',borderLeft:'1px solid var(--color-border)',display:'flex',flexDirection:'column',boxShadow:'0 24px 48px rgba(0,0,0,0.12)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid var(--color-border)',flexShrink:0}}>
          <span style={{fontSize:'13px',fontWeight:600,color:'var(--color-text)'}}>Detalhes</span>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',padding:'4px',borderRadius:'50%',display:'flex',color:'var(--color-text-muted)'}}>
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <input
            style={{width:'100%',fontSize:'13px',fontWeight:600,background:'transparent',borderBottom:'1px solid var(--color-border)',paddingBottom:'8px',outline:'none',color:'var(--color-text)'}}
            value={title}
            onChange={(e) => { setTitle(e.target.value); save({ title: e.target.value }); }}
          />

          <div style={fieldStyle}>
            <CalendarDays size={14} style={iconStyle} />
            <input type="date"
              style={{flex:1,fontSize:'13px',background:'transparent',color:'var(--color-text)',outline:'none',border:'none'}}
              value={date}
              onChange={(e) => { setDate(e.target.value); save({ dueDate: buildDeadline(e.target.value, time) }); }} />
          </div>

          <div style={fieldStyle}>
            <Clock size={14} style={iconStyle} />
            <input type="time"
              style={{flex:1,fontSize:'13px',background:'transparent',color:'var(--color-text)',outline:'none',border:'none'}}
              value={time}
              onChange={(e) => { setTime(e.target.value); save({ dueDate: buildDeadline(date, e.target.value) }); }} />
          </div>

          <div style={fieldStyle}>
            <Tag size={14} style={iconStyle} />
            <select
              style={{flex:1,fontSize:'13px',background:'var(--color-surface-2)',color:'var(--color-text)',outline:'none',borderRadius:'6px',border:'none',padding:'2px 4px'}}
              value={category}
              onChange={(e) => { setCategory(e.target.value); save({ category: Number(e.target.value) as TaskCategory }); }}>
              {CATEGORY_KEYS.map((k) => (
                <option key={k} value={k}>{CATEGORY_META[k].label}</option>
              ))}
            </select>
          </div>

          <div style={fieldStyle}>
            <Flag size={14} style={iconStyle} />
            <select
              style={{flex:1,fontSize:'13px',background:'var(--color-surface-2)',color:'var(--color-text)',outline:'none',borderRadius:'6px',border:'none',padding:'2px 4px'}}
              value={priority}
              onChange={(e) => { setPriority(e.target.value); save({ priority: Number(e.target.value) as TaskPriority }); }}>
              <option value={TaskPriority.HIGH}>Alta</option>
              <option value={TaskPriority.MEDIUM}>Média</option>
              <option value={TaskPriority.LOW}>Baixa</option>
            </select>
          </div>

          <div style={fieldStyle}>
            <Clock size={14} style={iconStyle} />
            <input type="number" min={1}
              style={{width:'64px',fontSize:'13px',background:'transparent',color:'var(--color-text)',outline:'none',border:'none'}}
              value={estimatedMinutes}
              onChange={(e) => {
                setEstimatedMinutes(e.target.value);
                const n = Number(e.target.value);
                if (n > 0) save({ estimatedMinutes: n });
              }} />
            <span style={{fontSize:'11px',color:'var(--color-text-muted)'}}>min</span>
          </div>

          <textarea
            style={{width:'100%',fontSize:'13px',background:'var(--color-surface-2)',borderRadius:'8px',padding:'12px',outline:'none',color:'var(--color-text)',resize:'none',border:'none'}}
            rows={4} placeholder="Notas..."
            value={description}
            onChange={(e) => { setDescription(e.target.value); save({ description: e.target.value }); }} />
        </div>

        <div style={{padding:'16px',borderTop:'1px solid var(--color-border)',display:'flex',flexDirection:'column',gap:'8px',flexShrink:0}}>
          <button
            style={{background:'var(--color-action)',color:'#1E1E1C',border:'none',borderRadius:'8px',padding:'8px 16px',width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',fontWeight:500,fontSize:'13px',cursor:'pointer'}}
            onClick={() => { start(task, duration, isStudy); onClose(); }}
          >
            {isStudy ? <><Brain size={14} /> Iniciar Pomodoro</> : <><Play size={14} /> Iniciar timer</>}
          </button>
          <button
            style={{background:'transparent',color:'var(--color-alert)',border:'1px solid var(--color-alert)',borderRadius:'8px',padding:'8px 16px',width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',fontSize:'13px',cursor:'pointer'}}
            onClick={handleDelete}
          >
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
  const [selectedTask,    setSelectedTask]    = useState<Task | null>(null);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [showCompleted,   setShowCompleted]   = useState(false);
  const [pendingComplete, setPendingComplete] = useState<Task | null>(null);

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
    if (task.status === TaskStatus.COMPLETED) {
      updateTask.mutate({ id: task.id, data: { status: TaskStatus.PENDING } });
    } else {
      setPendingComplete(task);
    }
  }

  function handleCompleteWithRating(rating: number | null) {
    if (!pendingComplete) return;
    updateTask.mutate({
      id: pendingComplete.id,
      data: {
        status: TaskStatus.COMPLETED,
        ...(rating !== null ? { difficultyRating: rating } : {}),
      },
    });
    setPendingComplete(null);
    setShowCompleted(true);
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

  const pickerPopupStyle: React.CSSProperties = {
    position:'absolute',top:'32px',right:0,zIndex:50,
    background:'var(--color-surface)',border:'1px solid var(--color-border)',
    borderRadius:'8px',padding:'8px',boxShadow:'0 8px 24px rgba(0,0,0,0.12)',
  };

  const ghostBtnStyle: React.CSSProperties = {
    background:'transparent',border:'none',cursor:'pointer',padding:'4px',
    borderRadius:'6px',display:'flex',alignItems:'center',color:'var(--color-text-muted)',
  };

  if (isLoading) {
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'256px'}}>
        <Loader2 className="h-8 w-8 animate-spin" style={{color:'var(--color-action)'}} />
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full min-h-0 overflow-hidden">
        {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
        <aside style={{width:'176px',flexShrink:0,background:'var(--color-surface-2)',borderRight:'1px solid var(--color-border)',padding:'12px',display:'flex',flexDirection:'column',overflowY:'auto'}}>
          <div className="space-y-0.5">
            <FilterButton active={activeFilter === 'today'} onClick={() => setActiveFilter('today')}
              icon={<CalendarDays size={14} style={{color:'var(--color-focus)'}} />} label="Hoje" count={todayCount} />
            <FilterButton active={activeFilter === 'all'} onClick={() => setActiveFilter('all')}
              icon={<ListTodo size={14} style={{color:'var(--color-text-muted)'}} />} label="Todos" count={allCount} />
          </div>

          <p style={{fontSize:'10px',fontWeight:600,color:'var(--color-text-muted)',letterSpacing:'0.1em',padding:'0 8px',marginTop:'16px',marginBottom:'4px',textTransform:'uppercase'}}>
            Minhas listas
          </p>
          <div className="space-y-0.5">
            {CATEGORY_KEYS.map((k) => {
              const { label, Icon, iconColor } = CATEGORY_META[k];
              return (
                <FilterButton key={k} active={activeFilter === k} onClick={() => setActiveFilter(k)}
                  icon={<Icon size={14} style={{color:iconColor}} />} label={label} count={categoryCounts[k] ?? 0} />
              );
            })}
          </div>

          {customLists.length > 0 && (
            <>
              <p style={{fontSize:'10px',fontWeight:600,color:'var(--color-text-muted)',letterSpacing:'0.1em',padding:'0 8px',marginTop:'16px',marginBottom:'4px',textTransform:'uppercase'}}>
                Listas
              </p>
              <div className="space-y-0.5">
                {customLists.map((list) => (
                  <FilterButton key={list.id} active={activeFilter === list.id}
                    onClick={() => setActiveFilter(list.id)}
                    icon={<Tag size={14} style={{color:'var(--color-text-muted)'}} />} label={list.name} count={allCount} />
                ))}
              </div>
            </>
          )}

          <div className="mt-auto pt-4">
            {showNewListInput ? (
              <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                <input
                  style={{flex:1,fontSize:'11px',background:'var(--color-surface)',borderRadius:'6px',padding:'4px 8px',border:'1px solid var(--color-border)',outline:'none',color:'var(--color-text)'}}
                  placeholder="Nome da lista..."
                  value={newListName} autoFocus
                  onChange={(e) => setNewListName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddList();
                    if (e.key === 'Escape') { setShowNewListInput(false); setNewListName(''); }
                  }}
                />
                <button onClick={handleAddList}
                  style={{background:'var(--color-action)',color:'#1E1E1C',border:'none',borderRadius:'6px',padding:'4px 8px',fontSize:'11px',fontWeight:500,cursor:'pointer'}}>
                  ✓
                </button>
              </div>
            ) : (
              <button
                style={{display:'flex',alignItems:'center',gap:'8px',width:'100%',padding:'8px',fontSize:'13px',color:'var(--color-text-muted)',background:'none',border:'none',cursor:'pointer'}}
                onClick={() => setShowNewListInput(true)}
              >
                <Plus size={15} /> Nova lista
              </button>
            )}
          </div>
        </aside>

        {/* ── MAIN ────────────────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',padding:'24px 24px 16px',flexShrink:0}}>
            <div>
              <h1 style={{fontSize:'20px',fontWeight:700,color:'var(--color-text)'}}>{viewTitle}</h1>
              <p style={{fontSize:'13px',color:'var(--color-text-muted)',textTransform:'capitalize',marginTop:'2px'}}>{formatDisplayDate()}</p>
            </div>
            <button
              onClick={() => setShowNewTaskForm(true)}
              style={{background:'var(--color-action)',color:'#1E1E1C',border:'none',borderRadius:'8px',padding:'7px 14px',fontWeight:500,fontSize:'13px',cursor:'pointer',display:'flex',alignItems:'center',gap:'6px'}}
            >
              <Plus size={14} /> Nova Tarefa
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-8">
            {/* Inline new-task form */}
            {showNewTaskForm && (
              <div style={{marginBottom:'16px',background:'var(--color-surface-2)',borderRadius:'12px',border:'1px solid var(--color-border)'}}>
                {/* Input row */}
                <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'10px 16px'}}>
                  <button
                    type="button"
                    onClick={() => handleSaveNew(true)}
                    title="Salvar como concluída"
                    style={{
                      width:'16px',height:'16px',borderRadius:'50%',flexShrink:0,
                      border:`2px solid ${newTitle.trim() ? 'var(--color-border)' : 'rgba(0,0,0,0.1)'}`,
                      display:'flex',alignItems:'center',justifyContent:'center',
                      background:'transparent',cursor: newTitle.trim() ? 'pointer' : 'default',padding:0,
                    }}
                    className="group/circle"
                  >
                    <svg viewBox="0 0 10 10" style={{width:'10px',height:'10px',opacity:0}} className="group-hover/circle:opacity-60 transition-opacity" fill="none">
                      <path d="M2 5L4 7L8 3" stroke="var(--color-done)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  <input
                    ref={newTitleRef}
                    style={{flex:1,fontSize:'13px',background:'transparent',outline:'none',color:'var(--color-text)',minWidth:0}}
                    placeholder="Título da tarefa..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleSaveNew(); }
                      if (e.key === 'Escape') { e.preventDefault(); resetForm(); }
                    }}
                  />

                  {/* Date */}
                  <div className="relative flex-shrink-0">
                    <button type="button" style={{...ghostBtnStyle,color:newDate?'var(--color-action)':'var(--color-text-muted)'}}
                      onClick={() => { setShowDatePicker(!showDatePicker); setShowTimePicker(false); setShowPriorityPicker(false); setShowCategoryPicker(false); }}>
                      <CalendarDays size={13} />
                    </button>
                    {showDatePicker && (
                      <div style={pickerPopupStyle}>
                        <input type="date" style={{fontSize:'13px',background:'transparent',color:'var(--color-text)',outline:'none',border:'none'}}
                          value={newDate} onChange={(e) => { setNewDate(e.target.value); setShowDatePicker(false); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} />
                      </div>
                    )}
                  </div>

                  {/* Time */}
                  <div className="relative flex-shrink-0">
                    <button type="button" style={{...ghostBtnStyle,color:newTime?'var(--color-action)':'var(--color-text-muted)'}}
                      onClick={() => { setShowTimePicker(!showTimePicker); setShowDatePicker(false); setShowPriorityPicker(false); setShowCategoryPicker(false); }}>
                      <Clock size={13} />
                    </button>
                    {showTimePicker && (
                      <div style={pickerPopupStyle}>
                        <input type="time" style={{fontSize:'13px',background:'transparent',color:'var(--color-text)',outline:'none',border:'none'}}
                          value={newTime} onChange={(e) => { setNewTime(e.target.value); setShowTimePicker(false); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} />
                      </div>
                    )}
                  </div>

                  {/* Category */}
                  <div className="relative flex-shrink-0">
                    <button type="button" style={ghostBtnStyle}
                      onClick={() => { setShowCategoryPicker(!showCategoryPicker); setShowDatePicker(false); setShowTimePicker(false); setShowPriorityPicker(false); }}>
                      {(() => { const { Icon, iconColor } = CATEGORY_META[newCategory]; return <Icon size={13} style={{color:iconColor}} />; })()}
                    </button>
                    {showCategoryPicker && (
                      <div style={{...pickerPopupStyle,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'4px',minWidth:'176px'}}>
                        {CATEGORY_KEYS.map((k) => {
                          const { label, Icon, iconColor } = CATEGORY_META[k];
                          return (
                            <button key={k}
                              style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'4px',padding:'8px',borderRadius:'8px',fontSize:'11px',cursor:'pointer',border:'none',background:newCategory===k?'var(--color-action-bg)':'transparent',color:newCategory===k?'var(--color-action)':'var(--color-text-sec)'}}
                              onClick={() => {
                                setNewCategory(k); setShowCategoryPicker(false);
                                if (k === TaskCategory.STUDY) setNewDuration(25);
                              }}>
                              <Icon size={14} style={{color:iconColor}} />{label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Priority */}
                  <div className="relative flex-shrink-0">
                    <button
                      type="button"
                      style={{...ghostBtnStyle,color:newPriority===TaskPriority.HIGH?'var(--color-alert)':newPriority===TaskPriority.MEDIUM?'var(--color-action)':'var(--color-text-muted)'}}
                      onClick={() => { setShowPriorityPicker(!showPriorityPicker); setShowDatePicker(false); setShowTimePicker(false); setShowCategoryPicker(false); }}>
                      <Flag size={13} />
                    </button>
                    {showPriorityPicker && (
                      <div style={{...pickerPopupStyle,minWidth:'80px',padding:0,overflow:'hidden'}}>
                        {([TaskPriority.HIGH, TaskPriority.MEDIUM, TaskPriority.LOW] as const).map((p) => (
                          <button key={p}
                            style={{display:'block',width:'100%',textAlign:'left',padding:'6px 12px',fontSize:'13px',background:'transparent',border:'none',cursor:'pointer',color:p===TaskPriority.HIGH?'var(--color-alert)':p===TaskPriority.MEDIUM?'var(--color-action)':'var(--color-text-sec)'}}
                            onClick={() => { setNewPriority(p); setShowPriorityPicker(false); }}>
                            {p === TaskPriority.HIGH ? 'Alta' : p === TaskPriority.MEDIUM ? 'Média' : 'Baixa'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button type="button" onClick={() => handleSaveNew()} style={{...ghostBtnStyle,fontSize:'13px'}}>✓</button>
                  <button type="button" onClick={resetForm} style={ghostBtnStyle}><X size={13} /></button>
                </div>

                {/* Duration + Start row */}
                <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 16px 12px',borderTop:'1px solid var(--color-border)'}}>
                  <Clock size={11} style={{color:'var(--color-text-muted)'}} />
                  <span style={{fontSize:'11px',color:'var(--color-text-muted)'}}>Duração:</span>
                  <div style={{display:'flex',gap:'4px'}}>
                    {[15, 25, 30, 45, 60].map((d) => (
                      <button key={d} type="button"
                        style={{fontSize:'11px',padding:'2px 8px',borderRadius:'999px',cursor:'pointer',border:`1px solid ${newDuration===d?'var(--color-action)':'var(--color-border)'}`,color:newDuration===d?'var(--color-action)':'var(--color-text-muted)',background:newDuration===d?'var(--color-action-bg)':'transparent'}}
                        onClick={() => setNewDuration(d)}>
                        {d}m
                      </button>
                    ))}
                  </div>

                  {isStudySelected && (
                    <span style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'11px',color:'var(--color-alert)'}}>
                      <Brain size={11} /> Pomodoro
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveAndStart}
                    disabled={!newTitle.trim()}
                    style={{marginLeft:'auto',background:'var(--color-action)',color:'#1E1E1C',border:'none',borderRadius:'6px',padding:'4px 10px',fontSize:'11px',fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',gap:'6px',opacity:!newTitle.trim()?0.4:1}}
                  >
                    <Play size={11} /> Start
                  </button>
                </div>
              </div>
            )}

            {/* Empty state */}
            {activeTasks.length === 0 && !showNewTaskForm && (
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'64px 0',color:'var(--color-text-muted)'}}>
                <ListTodo size={36} style={{marginBottom:'12px'}} />
                <p style={{fontSize:'13px'}}>Nenhuma tarefa aqui</p>
                <button
                  style={{marginTop:'12px',fontSize:'11px',color:'var(--color-action)',background:'none',border:'none',cursor:'pointer',textDecoration:'underline'}}
                  onClick={() => setShowNewTaskForm(true)}>
                  + Criar tarefa
                </button>
              </div>
            )}

            {/* Time groups */}
            {TIME_GROUP_DEFS.map(({ key, label }) => {
              if (grouped[key].length === 0) return null;
              return (
                <div key={key} className="mb-4">
                  <div style={{fontSize:'11px',fontWeight:600,color:'var(--color-text-muted)',textTransform:'uppercase',letterSpacing:'0.08em',padding:'8px 0',borderBottom:'1px solid var(--color-border)',marginBottom:'4px'}}>
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
              <div style={{marginTop:'24px',borderTop:'1px solid var(--color-border)',paddingTop:'8px'}}>
                <div style={{display:'flex',alignItems:'center'}}>
                  <button
                    onClick={() => setShowCompleted((v) => !v)}
                    style={{display:'flex',alignItems:'center',gap:'6px',flex:1,fontSize:'13px',color:'var(--color-text-muted)',background:'none',border:'none',cursor:'pointer',padding:'8px 0'}}
                  >
                    <ChevronDown size={14} className={cn('transition-transform', showCompleted && 'rotate-180')} />
                    Concluídas ({completedTasks.length})
                  </button>
                  {showCompleted && (
                    <button
                      onClick={handleClearCompleted}
                      style={{fontSize:'11px',color:'var(--color-alert)',background:'none',border:'none',cursor:'pointer',padding:'8px'}}
                    >
                      Limpar
                    </button>
                  )}
                </div>
                {showCompleted && (
                  <div style={{opacity:0.6}}>
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

      {pendingComplete && (
        <DifficultyRatingModal
          task={pendingComplete}
          onRate={(rating) => handleCompleteWithRating(rating)}
          onSkip={() => handleCompleteWithRating(null)}
        />
      )}

      {selectedTask && <DetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </>
  );
}
