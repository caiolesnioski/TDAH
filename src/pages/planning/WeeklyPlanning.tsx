import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Trash2,
  CalendarDays,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useCreateWeeklyPlan,
  useAddWeeklyPlanTask,
  useDeleteWeeklyPlanTask,
  useDistributeWeeklyPlan,
  type WeeklyPlan,
  type WeeklyPlanTask,
} from '@/hooks/useWeeklyPlan';

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = 'alta' | 'media' | 'baixa';
type DayCode = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';

interface LocalTask {
  localId: string;
  title: string;
  category: string;
  priority: Priority;
  estimated_minutes: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ['Estudos', 'Trabalho', 'Casa', 'Saúde', 'Lazer', 'Outros'];

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Média' },
  { value: 'baixa', label: 'Baixa' },
];

const DURATIONS: { value: number; label: string }[] = [
  { value: 15, label: '15min' },
  { value: 30, label: '30min' },
  { value: 45, label: '45min' },
  { value: 60, label: '1h' },
  { value: 90, label: '1h30' },
  { value: 120, label: '2h' },
];

const WEEK_DAYS: DayCode[] = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];

const DAY_LABELS: Record<DayCode, string> = {
  seg: 'Segunda-feira',
  ter: 'Terça-feira',
  qua: 'Quarta-feira',
  qui: 'Quinta-feira',
  sex: 'Sexta-feira',
  sab: 'Sábado',
  dom: 'Domingo',
};

const PRIORITY_DOT_COLOR: Record<Priority, string> = {
  alta: '#EF4444',
  media: '#F59E0B',
  baixa: '#22C55E',
};

const PRIORITY_GROUP_LABEL: Record<Priority, string> = {
  alta: 'Alta Prioridade',
  media: 'Média Prioridade',
  baixa: 'Baixa Prioridade',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPlanWeekStart(): string {
  const today = new Date();
  const dow = today.getDay();
  const d = new Date(today);
  if (dow === 0) {
    d.setDate(d.getDate() + 1);
  } else {
    d.setDate(d.getDate() - (dow - 1));
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDayDate(weekStart: string, day: DayCode): string {
  const offset: Record<DayCode, number> = {
    seg: 0, ter: 1, qua: 2, qui: 3, sex: 4, sab: 5, dom: 6,
  };
  const [y, mo, d] = weekStart.split('-').map(Number);
  const date = new Date(Date.UTC(y, mo - 1, d + offset[day]));
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', timeZone: 'UTC' });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h${m}` : `${h}h`;
}

function formatTimeRange(start: string, durationMinutes: number): string {
  const [h, m] = start.split(':').map(Number);
  const endTotal = h * 60 + m + durationMinutes;
  const endH = Math.floor(endTotal / 60) % 24;
  const endM = endTotal % 60;
  return `${start} – ${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PriorityDot({ priority }: { priority: Priority }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" className="shrink-0">
      <circle cx="5" cy="5" r="5" fill={PRIORITY_DOT_COLOR[priority]} />
    </svg>
  );
}

function Stepper({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: 'Suas tarefas da semana' },
    { n: 2, label: 'Revisar distribuição' },
    { n: 3, label: 'Confirmar' },
  ] as const;

  return (
    <div className="flex items-center mb-8">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                s.n < current
                  ? 'bg-success/15 text-success border border-success/30'
                  : s.n === current
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {s.n < current ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.n}
            </div>
            <span
              className={`text-sm hidden sm:block ${
                s.n === current ? 'text-foreground font-medium' : 'text-muted-foreground'
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && <div className="h-px bg-border mx-3 w-8 shrink-0" />}
        </div>
      ))}
    </div>
  );
}

// ─── Step 1: Add tasks ────────────────────────────────────────────────────────

interface Step1Props {
  tasks: LocalTask[];
  onAdd: (t: Omit<LocalTask, 'localId'>) => void;
  onRemove: (id: string) => void;
  onNext: () => void;
  isSubmitting: boolean;
}

function Step1({ tasks, onAdd, onRemove, onNext, isSubmitting }: Step1Props) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [priority, setPriority] = useState<Priority>('media');
  const [duration, setDuration] = useState(60);

  function handleAdd() {
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd({ title: trimmed, category, priority, estimated_minutes: duration });
    setTitle('');
  }

  const grouped: Record<Priority, LocalTask[]> = {
    alta: tasks.filter(t => t.priority === 'alta'),
    media: tasks.filter(t => t.priority === 'media'),
    baixa: tasks.filter(t => t.priority === 'baixa'),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          O que você quer fazer essa semana?
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Adicione as tarefas por prioridade. O sistema vai encaixá-las nos seus horários livres.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Título da tarefa..."
              className="flex-1 min-w-[180px] h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as Priority)}
              className="h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <select
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              className="h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <Button onClick={handleAdd} disabled={!title.trim()}>
              + Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {tasks.length > 0 ? (
        <div className="space-y-4">
          {(['alta', 'media', 'baixa'] as Priority[]).map(p =>
            grouped[p].length > 0 ? (
              <div key={p}>
                <div className="flex items-center gap-2 mb-2">
                  <PriorityDot priority={p} />
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {PRIORITY_GROUP_LABEL[p]}
                  </span>
                </div>
                <Card>
                  <CardContent className="p-0">
                    {grouped[p].map((task, i) => (
                      <div
                        key={task.localId}
                        className={`flex items-center justify-between px-4 py-3 group ${
                          i < grouped[p].length - 1 ? 'border-b border-border' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <PriorityDot priority={task.priority} />
                          <span className="text-sm text-foreground truncate">{task.title}</span>
                          <Badge variant="secondary" className="shrink-0 text-xs">
                            {task.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatDuration(task.estimated_minutes)}
                          </span>
                        </div>
                        <button
                          onClick={() => onRemove(task.localId)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-danger/10 text-muted-foreground hover:text-danger"
                          aria-label="Remover tarefa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            ) : null
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Nenhuma tarefa adicionada ainda
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button
          onClick={onNext}
          disabled={tasks.length === 0 || isSubmitting}
          className="gap-2"
        >
          {isSubmitting ? 'Calculando...' : 'Ver como ficaria minha semana'}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 2: Review distribution ──────────────────────────────────────────────

interface Step2Props {
  plan: WeeklyPlan;
  weekStart: string;
  onBack: () => void;
  onConfirm: () => void;
}

function Step2({ plan, weekStart, onBack, onConfirm }: Step2Props) {
  const tasks = plan.weekly_plan_tasks ?? [];
  const unscheduled = tasks.filter(t => !t.scheduled_day);

  const byDay = WEEK_DAYS.reduce<Record<DayCode, WeeklyPlanTask[]>>(
    (acc, d) => { acc[d] = []; return acc; },
    {} as Record<DayCode, WeeklyPlanTask[]>,
  );

  for (const t of tasks) {
    if (t.scheduled_day) {
      byDay[t.scheduled_day as DayCode].push(t);
    }
  }
  for (const day of WEEK_DAYS) {
    byDay[day].sort((a, b) =>
      (a.scheduled_start ?? '').localeCompare(b.scheduled_start ?? ''),
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Como ficaria sua semana</h1>
        <p className="text-sm text-muted-foreground mt-1">
          O sistema alocou suas tarefas nos horários livres. Confira antes de confirmar.
        </p>
      </div>

      {unscheduled.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            <strong>
              {unscheduled.length}{' '}
              {unscheduled.length === 1
                ? 'tarefa não pôde ser alocada'
                : 'tarefas não puderam ser alocadas'}
            </strong>
            {' '}— sua semana está cheia. Considere reduzir a duração ou remover tarefas.
          </span>
        </div>
      )}

      <div className="space-y-3">
        {WEEK_DAYS.map(day => {
          const dayTasks = byDay[day];
          return (
            <Card key={day}>
              <CardContent className="p-0">
                <div className="flex items-baseline gap-2 px-4 py-3 border-b border-border">
                  <span className="text-sm font-medium text-foreground">{DAY_LABELS[day]}</span>
                  <span className="text-xs text-muted-foreground">
                    {getDayDate(weekStart, day)}
                  </span>
                </div>
                {dayTasks.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground italic">
                    Nenhuma tarefa alocada
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {dayTasks.map(t => (
                      <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                        <span className="text-xs font-mono text-muted-foreground w-28 shrink-0">
                          {t.scheduled_start
                            ? formatTimeRange(t.scheduled_start, t.estimated_minutes)
                            : '—'}
                        </span>
                        <span className="text-sm text-foreground flex-1 truncate">{t.title}</span>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {t.category}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ChevronLeft className="w-4 h-4" />
          Ajustar tarefas
        </Button>
        <Button onClick={onConfirm} className="gap-2">
          Confirmar planejamento
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 3: Confirmation ─────────────────────────────────────────────────────

interface Step3Props {
  plan: WeeklyPlan;
  weekStart: string;
}

function Step3({ plan, weekStart }: Step3Props) {
  const navigate = useNavigate();
  const tasks = plan.weekly_plan_tasks ?? [];
  const scheduled = tasks.filter(t => t.scheduled_day);

  const byDay = WEEK_DAYS.reduce<Record<DayCode, WeeklyPlanTask[]>>(
    (acc, d) => { acc[d] = []; return acc; },
    {} as Record<DayCode, WeeklyPlanTask[]>,
  );
  for (const t of scheduled) {
    byDay[t.scheduled_day as DayCode].push(t);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Semana planejada!</h1>
        <p className="text-sm text-muted-foreground">
          {scheduled.length}{' '}
          {scheduled.length === 1 ? 'tarefa foi adicionada' : 'tarefas foram adicionadas'} à sua
          semana
        </p>
      </div>

      <div className="space-y-2">
        {WEEK_DAYS.filter(d => byDay[d].length > 0).map(day => (
          <Card key={day}>
            <CardContent className="p-0">
              <div className="px-4 py-2 border-b border-border">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {DAY_LABELS[day]} · {getDayDate(weekStart, day)}
                </span>
              </div>
              {byDay[day].map(t => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-2">
                  <span className="text-xs font-mono text-muted-foreground w-12 shrink-0">
                    {t.scheduled_start ?? '—'}
                  </span>
                  <span className="text-sm text-foreground flex-1 truncate">{t.title}</span>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {t.category}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center pt-2">
        <Button onClick={() => navigate('/schedule/week')} className="gap-2">
          <CalendarDays className="w-4 h-4" />
          Ver minha semana
        </Button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WeeklyPlanning() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [localTasks, setLocalTasks] = useState<LocalTask[]>([]);
  const [distributedPlan, setDistributedPlan] = useState<WeeklyPlan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const weekStart = getPlanWeekStart();

  const createPlan = useCreateWeeklyPlan();
  const addTask = useAddWeeklyPlanTask();
  const deleteTask = useDeleteWeeklyPlanTask();
  const distributePlan = useDistributeWeeklyPlan();

  function handleAddTask(task: Omit<LocalTask, 'localId'>) {
    setLocalTasks(prev => [...prev, { ...task, localId: crypto.randomUUID() }]);
  }

  function handleRemoveTask(id: string) {
    setLocalTasks(prev => prev.filter(t => t.localId !== id));
  }

  async function handleDistribute() {
    setIsSubmitting(true);
    try {
      const plan = await createPlan.mutateAsync({ week_start: weekStart });

      // If retrying after going back, clean up previously added tasks first
      const existingTasks = plan.weekly_plan_tasks ?? [];
      if (existingTasks.length > 0) {
        await Promise.all(
          existingTasks.map(t =>
            deleteTask.mutateAsync({ planId: plan.id, taskId: t.id }),
          ),
        );
      }

      await Promise.all(
        localTasks.map(t =>
          addTask.mutateAsync({
            planId: plan.id,
            title: t.title,
            category: t.category,
            priority: t.priority,
            estimated_minutes: t.estimated_minutes,
          }),
        ),
      );

      const distributed = await distributePlan.mutateAsync(plan.id);
      setDistributedPlan(distributed);
      setStep(2);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao calcular distribuição';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBack() {
    setDistributedPlan(null);
    setStep(1);
  }

  return (
    <SidebarProvider
      style={{
        '--sidebar-width': 'calc(var(--spacing) * 72)',
        '--header-height': 'calc(var(--spacing) * 12)',
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <main className="flex flex-1 flex-col p-6">
          <div className="mx-auto w-full max-w-3xl">
            <Stepper current={step} />

            {step === 1 && (
              <Step1
                tasks={localTasks}
                onAdd={handleAddTask}
                onRemove={handleRemoveTask}
                onNext={handleDistribute}
                isSubmitting={isSubmitting}
              />
            )}

            {step === 2 && distributedPlan && (
              <Step2
                plan={distributedPlan}
                weekStart={weekStart}
                onBack={handleBack}
                onConfirm={() => setStep(3)}
              />
            )}

            {step === 3 && distributedPlan && (
              <Step3 plan={distributedPlan} weekStart={weekStart} />
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
