import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Flame,
  Trophy,
  Zap,
  Target,
  Clock,
  Star,
  Award,
  TrendingUp,
  Calendar,
  Sparkles,
  Medal,
  Crown,
  Heart,
  BookOpen,
  Briefcase,
  Home,
  Dumbbell,
  Gamepad2,
  MoreHorizontal,
  Plus,
  Timer,
} from 'lucide-react';
import type { UserStats, Achievement } from '@/types';

// Dados mockados para demonstração
const mockUserStats: UserStats = {
  totalXP: 2450,
  currentLevel: {
    level: 8,
    title: 'Focado Dedicado',
    minXP: 2000,
    maxXP: 3000,
  },
  tasksCompleted: 127,
  tasksCompletedToday: 5,
  currentStreak: 12,
  longestStreak: 21,
  totalMinutesFocused: 4320,
  achievements: [
    {
      id: '1',
      title: 'Primeiro Passo',
      description: 'Complete sua primeira tarefa',
      icon: 'star',
      unlockedAt: '2024-01-10',
      progress: 1,
      maxProgress: 1,
      xpReward: 50,
      category: 'tasks',
    },
    {
      id: '2',
      title: 'Sequência de Fogo',
      description: 'Mantenha uma sequência de 7 dias',
      icon: 'flame',
      unlockedAt: '2024-01-15',
      progress: 7,
      maxProgress: 7,
      xpReward: 150,
      category: 'streak',
    },
    {
      id: '3',
      title: 'Mestre das Tarefas',
      description: 'Complete 100 tarefas',
      icon: 'trophy',
      unlockedAt: '2024-01-20',
      progress: 100,
      maxProgress: 100,
      xpReward: 300,
      category: 'tasks',
    },
    {
      id: '4',
      title: 'Madrugador',
      description: 'Complete 10 tarefas antes das 9h',
      icon: 'clock',
      progress: 7,
      maxProgress: 10,
      xpReward: 200,
      category: 'special',
    },
    {
      id: '5',
      title: 'Hiperfoco',
      description: 'Acumule 60 horas de foco',
      icon: 'target',
      progress: 72,
      maxProgress: 60,
      xpReward: 500,
      category: 'special',
    },
    {
      id: '6',
      title: 'Semana Perfeita',
      description: 'Complete todas as tarefas por 7 dias seguidos',
      icon: 'crown',
      progress: 3,
      maxProgress: 7,
      xpReward: 400,
      category: 'streak',
    },
  ],
  weeklyProgress: [
    { day: 'Seg', completed: 4 },
    { day: 'Ter', completed: 6 },
    { day: 'Qua', completed: 3 },
    { day: 'Qui', completed: 5 },
    { day: 'Sex', completed: 7 },
    { day: 'Sáb', completed: 2 },
    { day: 'Dom', completed: 5 },
  ],
};

const levels = [
  { level: 1, title: 'Iniciante', minXP: 0, maxXP: 100 },
  { level: 2, title: 'Aprendiz', minXP: 100, maxXP: 250 },
  { level: 3, title: 'Praticante', minXP: 250, maxXP: 500 },
  { level: 4, title: 'Competente', minXP: 500, maxXP: 800 },
  { level: 5, title: 'Proficiente', minXP: 800, maxXP: 1200 },
  { level: 6, title: 'Especialista', minXP: 1200, maxXP: 1600 },
  { level: 7, title: 'Mestre', minXP: 1600, maxXP: 2000 },
  { level: 8, title: 'Focado Dedicado', minXP: 2000, maxXP: 3000 },
  { level: 9, title: 'Campeão', minXP: 3000, maxXP: 4500 },
  { level: 10, title: 'Lendário', minXP: 4500, maxXP: 999999 },
];

const motivationalQuotes = [
  'Cada tarefa concluída é uma vitória! Continue assim!',
  'Você está construindo hábitos incríveis!',
  'Seu progresso é inspirador! Não desista!',
  'Um passo de cada vez leva a grandes conquistas!',
  'Hoje você está mais forte que ontem!',
];

function getAchievementIcon(iconName: string) {
  const icons: Record<string, React.ReactNode> = {
    star: <Star className="h-6 w-6" />,
    flame: <Flame className="h-6 w-6" />,
    trophy: <Trophy className="h-6 w-6" />,
    clock: <Clock className="h-6 w-6" />,
    target: <Target className="h-6 w-6" />,
    crown: <Crown className="h-6 w-6" />,
    medal: <Medal className="h-6 w-6" />,
    award: <Award className="h-6 w-6" />,
  };
  return icons[iconName] || <Star className="h-6 w-6" />;
}

function getCategoryIcon(category: string) {
  const icons: Record<string, React.ReactNode> = {
    tasks: <CheckCircle2 className="h-4 w-4" />,
    streak: <Flame className="h-4 w-4" />,
    special: <Sparkles className="h-4 w-4" />,
    social: <Heart className="h-4 w-4" />,
  };
  return icons[category] || <Star className="h-4 w-4" />;
}

function getCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    tasks: 'Tarefas',
    streak: 'Sequência',
    special: 'Especial',
    social: 'Social',
  };
  return labels[category] || 'Outro';
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  iconBg,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
}) {
  return (
    <Card className={`relative overflow-hidden border-0 ${gradient}`}>
      <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full bg-white/10" />
      <div className="absolute bottom-0 left-0 w-24 h-24 -ml-8 -mb-8 rounded-full bg-white/5" />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-white/90">{title}</CardTitle>
        <div className={`p-2 rounded-xl ${iconBg}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-white">{value}</div>
        {subtitle && <p className="text-sm text-white/70 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function XPProgressBar({ currentXP, minXP, maxXP }: { currentXP: number; minXP: number; maxXP: number }) {
  const progress = ((currentXP - minXP) / (maxXP - minXP)) * 100;
  return (
    <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
      <div
        className="absolute h-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${Math.min(progress, 100)}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-gray-700 dark:text-white drop-shadow-sm">
          {currentXP - minXP} / {maxXP - minXP} XP
        </span>
      </div>
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const isUnlocked = !!achievement.unlockedAt;
  const progress = (achievement.progress / achievement.maxProgress) * 100;

  return (
    <div
      className={`relative p-4 rounded-2xl border-2 transition-all duration-300 ${
        isUnlocked
          ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-300 dark:border-amber-600'
          : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
      }`}
    >
      {isUnlocked && (
        <div className="absolute -top-2 -right-2">
          <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-full p-1">
            <CheckCircle2 className="h-4 w-4 text-white" />
          </div>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div
          className={`p-3 rounded-xl ${
            isUnlocked
              ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
          }`}
        >
          {getAchievementIcon(achievement.icon)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-semibold truncate ${isUnlocked ? 'text-amber-800 dark:text-amber-300' : 'text-gray-600 dark:text-gray-400'}`}>
              {achievement.title}
            </h4>
            <Badge
              variant="outline"
              className={`shrink-0 text-xs ${
                isUnlocked ? 'border-amber-300 text-amber-700 dark:text-amber-400' : 'border-gray-300 text-gray-500'
              }`}
            >
              {getCategoryIcon(achievement.category)}
              <span className="ml-1">{getCategoryLabel(achievement.category)}</span>
            </Badge>
          </div>

          <p className={`text-sm mb-2 ${isUnlocked ? 'text-amber-700/80 dark:text-amber-400/80' : 'text-gray-500'}`}>
            {achievement.description}
          </p>

          {!isUnlocked && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Progresso</span>
                <span>
                  {achievement.progress}/{achievement.maxProgress}
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-400 to-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-1 mt-2">
            <Zap className={`h-4 w-4 ${isUnlocked ? 'text-amber-500' : 'text-gray-400'}`} />
            <span className={`text-sm font-medium ${isUnlocked ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500'}`}>
              +{achievement.xpReward} XP
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeeklyProgressChart({ data }: { data: { day: string; completed: number }[] }) {
  const maxCompleted = Math.max(...data.map((d) => d.completed), 1);

  return (
    <div className="flex items-end justify-between gap-2 h-32">
      {data.map((item, index) => {
        const height = (item.completed / maxCompleted) * 100;
        const isToday = index === data.length - 1;

        return (
          <div key={item.day} className="flex flex-col items-center gap-2 flex-1">
            <div className="relative w-full flex justify-center">
              <div
                className={`w-8 rounded-t-lg transition-all duration-500 ${
                  isToday
                    ? 'bg-gradient-to-t from-violet-500 to-purple-400'
                    : 'bg-gradient-to-t from-emerald-400 to-teal-300'
                }`}
                style={{ height: `${Math.max(height, 8)}px` }}
              />
              {item.completed > 0 && (
                <span className="absolute -top-6 text-xs font-semibold text-gray-600 dark:text-gray-300">
                  {item.completed}
                </span>
              )}
            </div>
            <span className={`text-xs font-medium ${isToday ? 'text-violet-600 dark:text-violet-400' : 'text-gray-500'}`}>
              {item.day}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TaskCategoryCard({
  category,
  count,
  icon: Icon,
  color,
}: {
  category: string;
  count: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl ${color}`}>
      <Icon className="h-5 w-5" />
      <div className="flex-1">
        <span className="text-sm font-medium">{category}</span>
      </div>
      <Badge variant="secondary" className="bg-white/20 text-current">
        {count}
      </Badge>
    </div>
  );
}

// Função para selecionar citação aleatória (chamada fora do render)
const getRandomQuote = () => motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
const initialQuote = getRandomQuote();

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats] = useState<UserStats>(mockUserStats);
  const [quote] = useState(initialQuote);

  const unlockedAchievements = stats.achievements.filter((a) => a.unlockedAt);
  const inProgressAchievements = stats.achievements.filter((a) => !a.unlockedAt);

  const nextLevel = levels.find((l) => l.level === stats.currentLevel.level + 1);
  const xpToNextLevel = nextLevel ? nextLevel.minXP - stats.totalXP : 0;

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 min-h-screen">
            {/* Mensagem Motivacional */}
            <Card className="border-0 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold mb-1">Olá! Bem-vindo de volta!</h2>
                    <p className="text-white/90">{quote}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ação Rápida */}
            <Card className="border-0 shadow-md bg-white dark:bg-gray-800">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">
                      O que você vai fazer hoje? 💪
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      Suas tarefas estão esperando por você
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/focus')}
                      className="gap-1.5 text-orange-600 border-orange-200 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-950"
                    >
                      <Timer className="h-4 w-4" />
                      Foco
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => navigate('/tasks/notion')}
                      className="gap-1.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar Tarefa
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Nível e XP */}
            <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 flex items-center justify-center">
                        <span className="text-2xl font-bold text-white">{stats.currentLevel.level}</span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full p-1">
                        <Crown className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white">{stats.currentLevel.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Nível {stats.currentLevel.level}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Zap className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">{stats.totalXP} XP Total</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Progresso para o próximo nível</span>
                      {nextLevel && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Faltam <span className="font-bold text-violet-600 dark:text-violet-400">{xpToNextLevel} XP</span> para{' '}
                          <span className="font-semibold">{nextLevel.title}</span>
                        </span>
                      )}
                    </div>
                    <XPProgressBar currentXP={stats.totalXP} minXP={stats.currentLevel.minXP} maxXP={stats.currentLevel.maxXP} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Tarefas Concluídas"
                value={stats.tasksCompleted}
                subtitle={`+${stats.tasksCompletedToday} hoje`}
                icon={CheckCircle2}
                gradient="bg-gradient-to-br from-emerald-400 to-teal-500"
                iconBg="bg-emerald-600/30"
              />
              <StatCard
                title="Sequência Atual"
                value={`${stats.currentStreak} dias`}
                subtitle={`Recorde: ${stats.longestStreak} dias`}
                icon={Flame}
                gradient="bg-gradient-to-br from-orange-400 to-red-500"
                iconBg="bg-orange-600/30"
              />
              <StatCard
                title="Tempo Focado"
                value={`${Math.floor(stats.totalMinutesFocused / 60)}h`}
                subtitle={`${stats.totalMinutesFocused % 60} minutos`}
                icon={Target}
                gradient="bg-gradient-to-br from-blue-400 to-indigo-500"
                iconBg="bg-blue-600/30"
              />
              <StatCard
                title="Conquistas"
                value={unlockedAchievements.length}
                subtitle={`de ${stats.achievements.length} disponíveis`}
                icon={Trophy}
                gradient="bg-gradient-to-br from-amber-400 to-yellow-500"
                iconBg="bg-amber-600/30"
              />
            </div>

            {/* Grid de Conteúdo */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Progresso Semanal */}
              <Card className="lg:col-span-2 border-0 shadow-lg bg-white dark:bg-gray-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white">
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                      Progresso Semanal
                    </CardTitle>
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <Calendar className="h-3 w-3 mr-1" />
                      Esta semana
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <WeeklyProgressChart data={stats.weeklyProgress} />
                </CardContent>
              </Card>

              {/* Tarefas por Categoria */}
              <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-gray-800 dark:text-white">Tarefas por Categoria</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <TaskCategoryCard
                    category="Estudos"
                    count={12}
                    icon={BookOpen}
                    color="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                  />
                  <TaskCategoryCard
                    category="Trabalho"
                    count={8}
                    icon={Briefcase}
                    color="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  />
                  <TaskCategoryCard
                    category="Casa"
                    count={5}
                    icon={Home}
                    color="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                  />
                  <TaskCategoryCard
                    category="Saúde"
                    count={3}
                    icon={Dumbbell}
                    color="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                  />
                  <TaskCategoryCard
                    category="Lazer"
                    count={4}
                    icon={Gamepad2}
                    color="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                  />
                  <TaskCategoryCard
                    category="Outros"
                    count={2}
                    icon={MoreHorizontal}
                    color="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Seção de Conquistas */}
            <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-gray-800 dark:text-white">
                    <Award className="h-5 w-5 text-amber-500" />
                    Suas Conquistas
                  </CardTitle>
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    {unlockedAchievements.length} de {stats.achievements.length} desbloqueadas
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Conquistas Desbloqueadas */}
                {unlockedAchievements.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Desbloqueadas
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {unlockedAchievements.map((achievement) => (
                        <AchievementCard key={achievement.id} achievement={achievement} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Conquistas em Progresso */}
                {inProgressAchievements.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4 text-violet-500" />
                      Em Progresso
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {inProgressAchievements.map((achievement) => (
                        <AchievementCard key={achievement.id} achievement={achievement} />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dica do Dia */}
            <Card className="border-0 bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl shrink-0">
                    <Heart className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">Dica para TDAH</h3>
                    <p className="text-white/90">
                      Divida suas tarefas grandes em pequenos passos. Isso ajuda a manter o foco e traz uma sensação de
                      progresso constante. Cada pequena vitória conta!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
