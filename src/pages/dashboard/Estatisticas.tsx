import { useMemo, useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, CheckCircle2, Clock, Zap, BarChart2 } from 'lucide-react';
import { TaskCategory, TaskStatus } from '@/types';
import type { Task } from '@/types';
import { cn } from '@/lib/utils';

const CATEGORY_LABELS: Record<number, { label: string; color: string; emoji: string }> = {
  [TaskCategory.STUDY]:   { label: 'Estudos',   color: 'bg-purple-500', emoji: '📚' },
  [TaskCategory.WORK]:    { label: 'Trabalho',   color: 'bg-blue-500',   emoji: '💼' },
  [TaskCategory.HOME]:    { label: 'Casa',       color: 'bg-green-500',  emoji: '🏠' },
  [TaskCategory.HEALTH]:  { label: 'Saúde',      color: 'bg-pink-500',   emoji: '💪' },
  [TaskCategory.LEISURE]: { label: 'Lazer',      color: 'bg-yellow-500', emoji: '🎮' },
  [TaskCategory.OTHER]:   { label: 'Outros',     color: 'bg-gray-500',   emoji: '📦' },
};

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const loadTasks = (): Task[] => {
  try {
    const s = localStorage.getItem('tasks');
    return s ? JSON.parse(s) : [];
  } catch { return []; }
};

type Period = '7' | '30' | '90' | 'all';

function filterByPeriod(tasks: Task[], period: Period): Task[] {
  if (period === 'all') return tasks;
  const days = Number(period);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return tasks.filter((t) => new Date(t.createdAt) >= cutoff);
}

export default function Estatisticas() {
  const [period, setPeriod] = useState<Period>('30');
  const allTasks = useMemo(loadTasks, []);
  const tasks = useMemo(() => filterByPeriod(allTasks, period), [allTasks, period]);

  const completed = tasks.filter((t) => t.status === TaskStatus.COMPLETED);
  const completionRate = tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0;
  const avgPerDay = period !== 'all'
    ? (completed.length / Number(period)).toFixed(1)
    : completed.length;

  // Por categoria
  const byCategory = Object.entries(CATEGORY_LABELS).map(([cat, cfg]) => {
    const count = completed.filter((t) => t.category === Number(cat)).length;
    return { cat: Number(cat), ...cfg, count };
  }).filter((c) => c.count > 0).sort((a, b) => b.count - a.count);

  const maxCat = byCategory[0]?.count || 1;

  // Por dia da semana
  const byDayOfWeek = DAYS_PT.map((day, i) => ({
    day,
    count: completed.filter((t) => new Date(t.updatedAt).getDay() === i).length,
  }));
  const maxDay = Math.max(...byDayOfWeek.map((d) => d.count), 1);

  // Por prioridade
  const highDone = completed.filter((t) => t.priority === 2).length;
  const medDone  = completed.filter((t) => t.priority === 1).length;
  const lowDone  = completed.filter((t) => t.priority === 0).length;

  // Insights
  const bestDay = byDayOfWeek.reduce((a, b) => (b.count > a.count ? b : a), byDayOfWeek[0]);
  const bestCat = byCategory[0];

  const insights: string[] = [];
  if (bestDay.count > 0) insights.push(`Você é mais produtivo às ${bestDay.day}feiras! 🌟`);
  if (bestCat) insights.push(`Sua categoria favorita é ${bestCat.emoji} ${bestCat.label}.`);
  if (completionRate >= 80) insights.push(`Taxa de conclusão de ${completionRate}% — excelente! 🏆`);
  else if (completionRate >= 50) insights.push(`${completionRate}% de conclusão — continue assim! 💪`);
  if (completed.length === 0) insights.push('Comece a completar tarefas para ver seus insights! 🚀');

  const PERIODS: { v: Period; l: string }[] = [
    { v: '7', l: '7 dias' }, { v: '30', l: '30 dias' },
    { v: '90', l: '90 dias' }, { v: 'all', l: 'Tudo' },
  ];

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
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <BarChart2 className="h-8 w-8 text-blue-500" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Suas Estatísticas</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Veja sua evolução ao longo do tempo</p>
                </div>
              </div>
              <div className="flex gap-1 sm:ml-auto flex-wrap">
                {PERIODS.map(({ v, l }) => (
                  <Button key={v} size="sm" variant={period === v ? 'default' : 'outline'}
                    onClick={() => setPeriod(v)}
                    className={cn(period === v && 'bg-blue-500 hover:bg-blue-600')}>
                    {l}
                  </Button>
                ))}
              </div>
            </div>

            {/* Cards de resumo */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Completadas', value: completed.length, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/30' },
                { label: 'Média por Dia', value: avgPerDay, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
                { label: 'Taxa de Conclusão', value: `${completionRate}%`, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
                { label: 'Min. Focados', value: completed.reduce((s, t) => s + (t.estimatedMinutes || 0), 0), icon: Clock, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30' },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <Card key={label} className={cn('border-0 shadow-md', bg)}>
                  <CardContent className="p-4">
                    <Icon className={cn('h-5 w-5 mb-2', color)} />
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">{value}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Por categoria + por dia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-0 shadow-md bg-white dark:bg-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Por Categoria</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {byCategory.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">Nenhum dado ainda</p>
                  )}
                  {byCategory.map(({ cat, label, color, emoji, count }) => (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300">{emoji} {label}</span>
                        <span className="font-semibold text-gray-800 dark:text-white">{count}</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={cn('h-2 rounded-full transition-all duration-500', color)}
                          style={{ width: `${(count / maxCat) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-white dark:bg-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Por Dia da Semana</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2 h-32">
                    {byDayOfWeek.map(({ day, count }) => (
                      <div key={day} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] text-gray-500 font-medium">{count || ''}</span>
                        <div className="w-full rounded-t-sm bg-blue-500 transition-all duration-500"
                          style={{ height: `${Math.max((count / maxDay) * 96, count > 0 ? 4 : 0)}px` }} />
                        <span className="text-[10px] text-gray-500">{day}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Prioridades */}
            <Card className="border-0 shadow-md bg-white dark:bg-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Por Prioridade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[
                    { label: 'Alta', count: highDone, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30' },
                    { label: 'Média', count: medDone, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
                    { label: 'Baixa', count: lowDone, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/30' },
                  ].map(({ label, count, color, bg }) => (
                    <div key={label} className={cn('rounded-xl p-4', bg)}>
                      <div className={cn('text-3xl font-bold', color)}>{count}</div>
                      <div className="text-sm text-gray-500 mt-1">{label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Insights */}
            <Card className="border-0 shadow-md bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">💡</span>
                  <h3 className="font-semibold text-lg">Seus Insights</h3>
                </div>
                {insights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-white/90">
                    <span className="mt-0.5">→</span>
                    <span>{insight}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
