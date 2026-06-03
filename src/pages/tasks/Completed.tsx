import { useMemo, useState } from 'react';
import { CheckCircle2, Clock, Loader2, Trophy, Sun, Calendar, BookOpen, Briefcase, Home, Heart, Gamepad2, MoreHorizontal } from 'lucide-react';
import { TaskStatus } from '@/types';
import type { Task } from '@/types';
import { cn } from '@/lib/utils';
import { useTasks } from '@/hooks/useTasks';

const CATEGORY_CONFIG: Record<number, {
  label: string;
  bg: string;
}> = {
  0: { label: 'Estudos',  bg: 'bg-indigo-500/15 text-indigo-300' },
  1: { label: 'Trabalho', bg: 'bg-blue-500/15 text-blue-300' },
  2: { label: 'Casa',     bg: 'bg-green-500/15 text-green-300' },
  3: { label: 'Saúde',    bg: 'bg-rose-500/15 text-rose-300' },
  4: { label: 'Lazer',    bg: 'bg-purple-500/15 text-purple-300' },
  5: { label: 'Outros',   bg: 'bg-base-300 text-base-content/60' },
};

const PRIORITY_CONFIG: Record<number, { label: string; color: string }> = {
  0: { label: 'Baixa', color: 'bg-base-300 text-base-content/50' },
  1: { label: 'Média', color: 'bg-amber-500/15 text-amber-300' },
  2: { label: 'Alta',  color: 'bg-red-500/15 text-red-300' },
};

const CAT_ICONS: Record<number, typeof BookOpen> = {
  0: BookOpen, 1: Briefcase, 2: Home, 3: Heart, 4: Gamepad2, 5: MoreHorizontal,
};

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'agora mesmo';
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ontem';
  return `${days} dias atrás`;
}

function groupByDay(tasks: Task[]): { label: string; date: string; tasks: Task[] }[] {
  const groups: Record<string, Task[]> = {};
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  for (const task of tasks) {
    const key = new Date(task.updatedAt).toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(task);
  }

  return Object.entries(groups)
    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
    .map(([key, tasks]) => ({
      label: key === today ? 'Hoje' : key === yesterday ? 'Ontem'
        : new Date(key).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }),
      date: key,
      tasks,
    }));
}

export default function Completed() {
  const { data: allTasks = [], isLoading } = useTasks();
  const [catFilter, setCatFilter] = useState<number | 'all'>('all');

  const completed = useMemo(() =>
    allTasks
      .filter((t) => t.status === TaskStatus.COMPLETED)
      .filter((t) => catFilter === 'all' || t.category === catFilter)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [allTasks, catFilter]
  );

  const groups = useMemo(() => groupByDay(completed), [completed]);

  const todayCount = allTasks.filter(
    (t) => t.status === TaskStatus.COMPLETED && new Date(t.updatedAt).toDateString() === new Date().toDateString()
  ).length;

  const monthCount = allTasks.filter((t) => {
    const d = new Date(t.updatedAt);
    const now = new Date();
    return t.status === TaskStatus.COMPLETED && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const totalCount = allTasks.filter((t) => t.status === TaskStatus.COMPLETED).length;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Trophy className="h-6 w-6 text-amber-400" />
        <div>
          <h1 className="text-xl font-bold text-base-content">Tarefas Concluídas</h1>
          <p className="text-sm text-base-content/50">Histórico de tudo que você completou</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Hoje',     value: todayCount,  Icon: Sun      },
          { label: 'Este Mês', value: monthCount,  Icon: Calendar },
          { label: 'Total',    value: totalCount,  Icon: Trophy   },
        ].map(({ label, value, Icon }) => (
          <div key={label} className="rounded-xl border border-base-300 bg-base-200 p-4 text-center">
            <Icon className="h-5 w-5 text-base-content/40 mx-auto mb-1" />
            <div className="text-2xl font-bold text-base-content">{value}</div>
            <div className="text-xs text-base-content/50 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <button
          className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            catFilter === 'all' ? 'bg-primary text-primary-content' : 'bg-base-200 text-base-content/70 hover:bg-base-300')}
          onClick={() => setCatFilter('all')}>
          Todas
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
          const CatIcon = CAT_ICONS[Number(key)];
          return (
            <button key={key}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
                catFilter === Number(key) ? 'bg-primary text-primary-content' : 'bg-base-200 text-base-content/70 hover:bg-base-300')}
              onClick={() => setCatFilter(Number(key))}>
              <CatIcon size={13} />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-base-content/30" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && completed.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-base-content/30">
          <CheckCircle2 className="h-12 w-12 mb-3" />
          <p className="text-base font-medium">Nenhuma tarefa concluída ainda</p>
          <p className="text-sm mt-1">Complete tarefas para ver seu histórico aqui</p>
        </div>
      )}

      {/* Timeline */}
      {!isLoading && groups.map((group) => (
        <div key={group.date} className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-semibold text-base-content/40 uppercase tracking-widest capitalize">
              {group.label}
            </h2>
            <div className="flex-1 h-px bg-base-300" />
            <span className="text-xs text-base-content/30 bg-base-300 px-2 py-0.5 rounded-full">
              {group.tasks.length}
            </span>
          </div>

          <div className="space-y-1.5">
            {group.tasks.map((task) => {
              const cat = CATEGORY_CONFIG[task.category];
              const pri = PRIORITY_CONFIG[task.priority];
              const CatIcon = CAT_ICONS[task.category];
              return (
                <div key={task.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-base-300 bg-base-200 hover:bg-base-300 transition-colors">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-base-content/60 truncate line-through">
                      {task.title || '(sem título)'}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span className={cn('inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full', cat.bg)}>
                        <CatIcon size={10} /> {cat.label}
                      </span>
                      <span className={cn('text-xs px-1.5 py-0.5 rounded-full', pri.color)}>
                        {pri.label}
                      </span>
                      {task.estimatedMinutes > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-base-content/30">
                          <Clock className="h-3 w-3" />{task.estimatedMinutes}min
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-base-content/30 shrink-0">{formatRelative(task.updatedAt)}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
