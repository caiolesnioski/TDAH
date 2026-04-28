import { useMemo, useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, Trophy } from 'lucide-react';
import { TaskStatus } from '@/types';
import type { Task } from '@/types';
import { cn } from '@/lib/utils';

const CATEGORY_CONFIG: Record<number, { label: string; color: string; emoji: string }> = {
  0: { label: 'Estudos',  color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', emoji: '📚' },
  1: { label: 'Trabalho', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',         emoji: '💼' },
  2: { label: 'Casa',     color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',     emoji: '🏠' },
  3: { label: 'Saúde',    color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',         emoji: '💪' },
  4: { label: 'Lazer',    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', emoji: '🎮' },
  5: { label: 'Outros',   color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',            emoji: '📦' },
};
const PRIORITY_CONFIG: Record<number, { label: string; color: string }> = {
  0: { label: 'Baixa', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  1: { label: 'Média', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  2: { label: 'Alta',  color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
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
    const d = new Date(task.updatedAt);
    const key = d.toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(task);
  }

  return Object.entries(groups)
    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
    .map(([key, tasks]) => ({
      label: key === today ? 'Hoje' : key === yesterday ? 'Ontem' : new Date(key).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }),
      date: key,
      tasks,
    }));
}

const loadTasks = (): Task[] => {
  try { return JSON.parse(localStorage.getItem('tasks') ?? '[]'); } catch { return []; }
};

export default function Completed() {
  const [catFilter, setCatFilter] = useState<number | 'all'>('all');
  const allTasks = useMemo(() => loadTasks(), []);

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

  return (
    <SidebarProvider
      style={{ '--sidebar-width': 'calc(var(--spacing) * 72)', '--header-height': 'calc(var(--spacing) * 12)' } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 min-h-screen">

            {/* Header */}
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-amber-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Tarefas Concluídas 🎉</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Olha quanta coisa você já fez!
                </p>
              </div>
            </div>

            {/* Stats rápidas */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Hoje', value: todayCount, icon: '☀️' },
                { label: 'Este Mês', value: monthCount, icon: '📅' },
                { label: 'Total', value: allTasks.filter((t) => t.status === TaskStatus.COMPLETED).length, icon: '🏆' },
              ].map(({ label, value, icon }) => (
                <Card key={label} className="border-0 shadow-md bg-white dark:bg-gray-800">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl mb-1">{icon}</div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">{value}</div>
                    <div className="text-xs text-gray-500">{label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Filtro por categoria */}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={catFilter === 'all' ? 'default' : 'outline'} onClick={() => setCatFilter('all')}>
                Todas
              </Button>
              {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                <Button key={key} size="sm" variant={catFilter === Number(key) ? 'default' : 'outline'}
                  onClick={() => setCatFilter(Number(key))}>
                  {cfg.emoji} {cfg.label}
                </Button>
              ))}
            </div>

            {/* Empty state */}
            {completed.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="text-6xl">📭</div>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  Nenhuma tarefa concluída ainda!
                </p>
                <p className="text-sm text-gray-400">Complete tarefas para ver seu histórico aqui 🚀</p>
              </div>
            )}

            {/* Timeline */}
            {groups.map((group) => (
              <div key={group.date} className="space-y-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider capitalize">
                    {group.label}
                  </h2>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  <Badge variant="secondary" className="text-xs">{group.tasks.length}</Badge>
                </div>
                <div className="space-y-2">
                  {group.tasks.map((task) => {
                    const cat = CATEGORY_CONFIG[task.category];
                    const pri = PRIORITY_CONFIG[task.priority];
                    return (
                      <Card key={task.id} className="border-0 shadow-sm bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 dark:text-white truncate line-through opacity-70">
                                {task.title || '(sem título)'}
                              </p>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                <Badge className={cn('text-xs px-1.5 py-0', cat.color)}>{cat.emoji} {cat.label}</Badge>
                                <Badge className={cn('text-xs px-1.5 py-0', pri.color)}>{pri.label}</Badge>
                                {task.estimatedMinutes > 0 && (
                                  <span className="flex items-center gap-0.5 text-xs text-gray-400">
                                    <Clock className="h-3 w-3" />{task.estimatedMinutes}min
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-xs text-gray-400 shrink-0">{formatRelative(task.updatedAt)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
