import { useState, useMemo } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Trophy, Lock, Star, Target, Zap, Dumbbell, Activity, Crown,
  BookOpen, Briefcase, Home, Sparkles, Swords, Calendar, Rocket,
} from 'lucide-react';
import { TaskCategory, TaskPriority, TaskStatus } from '@/types';
import type { Task } from '@/types';
import { cn } from '@/lib/utils';

interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  icon: React.ElementType;
  xp: number;
  max: number;
  category: 'tasks' | 'category' | 'focus' | 'special';
}

const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_task',   name: 'Primeiro Passo',   desc: 'Complete sua primeira tarefa',              icon: Target,    xp: 10,  max: 1,   category: 'tasks' },
  { id: 'tasks_5',      name: 'Embalo',            desc: 'Complete 5 tarefas',                        icon: Zap,       xp: 25,  max: 5,   category: 'tasks' },
  { id: 'tasks_25',     name: 'Produtivo',         desc: 'Complete 25 tarefas',                       icon: Dumbbell,  xp: 50,  max: 25,  category: 'tasks' },
  { id: 'tasks_100',    name: 'Maratonista',       desc: 'Complete 100 tarefas',                      icon: Activity,  xp: 100, max: 100, category: 'tasks' },
  { id: 'tasks_500',    name: 'Lenda',             desc: 'Complete 500 tarefas',                      icon: Crown,     xp: 500, max: 500, category: 'tasks' },
  { id: 'study_20',     name: 'Estudioso',         desc: 'Complete 20 tarefas de estudo',             icon: BookOpen,  xp: 60,  max: 20,  category: 'category' },
  { id: 'work_20',      name: 'Profissional',      desc: 'Complete 20 tarefas de trabalho',           icon: Briefcase, xp: 60,  max: 20,  category: 'category' },
  { id: 'health_10',    name: 'Saúde em Dia',      desc: 'Complete 10 tarefas de saúde',              icon: Dumbbell,  xp: 40,  max: 10,  category: 'category' },
  { id: 'home_10',      name: 'Lar Organizado',    desc: 'Complete 10 tarefas de casa',               icon: Home,      xp: 40,  max: 10,  category: 'category' },
  { id: 'variety',      name: 'Multitarefa',       desc: 'Complete tarefas em 5 categorias',          icon: Sparkles,  xp: 75,  max: 5,   category: 'special' },
  { id: 'high_prio',    name: 'Guerreiro',         desc: 'Complete 10 tarefas de alta prioridade',    icon: Swords,    xp: 80,  max: 10,  category: 'tasks' },
  { id: 'planner',      name: 'Planejador',        desc: 'Defina prazo em 10 tarefas',                icon: Calendar,  xp: 35,  max: 10,  category: 'special' },
  { id: 'all_cats',     name: 'Focado Total',      desc: 'Complete tarefas em todas as categorias',   icon: Star,      xp: 200, max: 6,   category: 'special' },
  { id: 'speed_day',    name: 'Relâmpago',         desc: 'Complete 5 tarefas em um único dia',        icon: Zap,       xp: 30,  max: 5,   category: 'focus' },
  { id: 'no_procras',   name: 'Sem Procrastinar',  desc: 'Complete 3 tarefas no mesmo dia que criou', icon: Rocket,    xp: 45,  max: 3,   category: 'focus' },
];

function getProgress(tasks: Task[], id: string): number {
  const done = tasks.filter((t) => t.status === TaskStatus.COMPLETED);
  switch (id) {
    case 'first_task':  return Math.min(done.length, 1);
    case 'tasks_5':     return Math.min(done.length, 5);
    case 'tasks_25':    return Math.min(done.length, 25);
    case 'tasks_100':   return Math.min(done.length, 100);
    case 'tasks_500':   return Math.min(done.length, 500);
    case 'study_20':    return Math.min(done.filter((t) => t.category === TaskCategory.STUDY).length, 20);
    case 'work_20':     return Math.min(done.filter((t) => t.category === TaskCategory.WORK).length, 20);
    case 'health_10':   return Math.min(done.filter((t) => t.category === TaskCategory.HEALTH).length, 10);
    case 'home_10':     return Math.min(done.filter((t) => t.category === TaskCategory.HOME).length, 10);
    case 'variety':     return Math.min(new Set(done.map((t) => t.category)).size, 5);
    case 'high_prio':   return Math.min(done.filter((t) => t.priority === TaskPriority.HIGH).length, 10);
    case 'planner':     return Math.min(tasks.filter((t) => t.dueDate).length, 10);
    case 'all_cats':    return Math.min(new Set(done.map((t) => t.category)).size, 6);
    default: return 0;
  }
}

type Filter = 'all' | 'unlocked' | 'progress' | 'locked';
const FILTER_LABELS: Record<Filter, string> = {
  all: 'Todas',
  unlocked: 'Desbloqueadas',
  progress: 'Em Progresso',
  locked: 'Bloqueadas',
};

export default function Conquistas() {
  const [filter, setFilter] = useState<Filter>('all');
  const { data: tasks = [] } = useTasks();

  const achievements = useMemo(() =>
    ACHIEVEMENTS.map((def) => {
      const progress = getProgress(tasks, def.id);
      const unlocked = progress >= def.max;
      return { ...def, progress, unlocked };
    }),
    [tasks]
  );

  const totalXP = achievements.filter((a) => a.unlocked).reduce((s, a) => s + a.xp, 0);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const filtered = achievements.filter((a) => {
    if (filter === 'unlocked') return a.unlocked;
    if (filter === 'progress') return !a.unlocked && a.progress > 0;
    if (filter === 'locked')   return !a.unlocked && a.progress === 0;
    return true;
  });

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-amber-500" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Suas Conquistas
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {unlockedCount}/{achievements.length} desbloqueadas · {totalXP} XP conquistados
                  </p>
                </div>
              </div>
              <div className="md:ml-auto">
                <div className="w-full md:w-64 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {Math.round((unlockedCount / achievements.length) * 100)}% completo
                </p>
              </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-2">
              {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f)}
                  className={cn(filter === f && 'bg-amber-500 hover:bg-amber-600 border-amber-500')}
                >
                  {FILTER_LABELS[f]}
                </Button>
              ))}
            </div>

            {/* Empty state */}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <Trophy className="h-16 w-16 text-gray-300 dark:text-gray-600" />
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  Nenhuma conquista aqui ainda!
                </p>
                <p className="text-sm text-gray-400">
                  Complete tarefas para desbloquear conquistas 🚀
                </p>
              </div>
            )}

            {/* Grid de conquistas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((a) => {
                const pct = Math.round((a.progress / a.max) * 100);
                const Icon = a.icon;
                return (
                  <Card
                    key={a.id}
                    className={cn(
                      'border-0 shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
                      a.unlocked
                        ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 ring-2 ring-amber-300 dark:ring-amber-700'
                        : a.progress > 0
                          ? 'bg-white dark:bg-gray-800'
                          : 'bg-white dark:bg-gray-800 opacity-50'
                    )}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'w-14 h-14 flex items-center justify-center rounded-2xl shrink-0',
                          a.unlocked
                            ? 'bg-amber-100 dark:bg-amber-900/40'
                            : 'bg-gray-100 dark:bg-gray-700'
                        )}>
                          {a.unlocked ? <Icon className="h-6 w-6 text-amber-600 dark:text-amber-400" /> : <Lock className="h-6 w-6 text-gray-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-800 dark:text-white truncate">
                              {a.name}
                            </h3>
                            <Badge className={cn(
                              'text-[10px] px-1.5 py-0 shrink-0',
                              a.unlocked
                                ? 'bg-amber-500 text-white'
                                : 'bg-transparent text-muted-foreground border border-border'
                            )}>
                              +{a.xp} XP
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                            {a.desc}
                          </p>
                          {!a.unlocked && (
                            <>
                              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-1">
                                <div
                                  className="h-2 rounded-full bg-primary transition-all duration-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] text-gray-400">
                                  {a.progress}/{a.max}
                                </span>
                                {a.progress > 0 && a.max - a.progress <= 3 && (
                                  <span className="text-[10px] text-purple-500 font-medium">
                                    Faltam apenas {a.max - a.progress}!
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                          {a.unlocked && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-amber-500" />
                              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                Desbloqueada!
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

    </div>
  );
}
