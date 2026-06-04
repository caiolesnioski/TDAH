import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { TaskStatus, TaskCategory, TaskPriority } from '@/types';
import type { UserStats, Achievement, Task } from '@/types';
import { useTasks } from '@/hooks/useTasks';
import EmptyState from '@/components/dashboard/EmptyState';

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function computeStats(tasks: Task[]): UserStats {
  const completed = tasks.filter((t) => t.status === TaskStatus.COMPLETED);
  const today = new Date().toDateString();
  const todayCount = completed.filter((t) => new Date(t.updatedAt).toDateString() === today).length;
  const totalXP =
    completed.length * 10 +
    completed.filter((t) => t.priority === TaskPriority.HIGH).length * 5;

  const currentLevel = levels.reduce((acc, l) => (totalXP >= l.minXP ? l : acc), levels[0]);

  const weeklyProgress = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      day: DAY_LABELS[d.getDay()],
      completed: completed.filter((t) => new Date(t.updatedAt).toDateString() === d.toDateString()).length,
    };
  });

  let streak = 0;
  const check = new Date();
  for (let i = 0; i < 365; i++) {
    if (!completed.some((t) => new Date(t.updatedAt).toDateString() === check.toDateString())) break;
    streak++;
    check.setDate(check.getDate() - 1);
  }

  const totalMinutes = completed.reduce((s, t) => s + t.estimatedMinutes, 0);

  const achievements: Achievement[] = [
    {
      id: 'first_task', title: 'Primeiro Passo', description: 'Complete sua primeira tarefa',
      icon: 'star', xpReward: 10, category: 'tasks', maxProgress: 1,
      progress: Math.min(completed.length, 1),
      unlockedAt: completed.length >= 1 ? completed[completed.length - 1].updatedAt : undefined,
    },
    {
      id: 'tasks_5', title: 'Embalo', description: 'Complete 5 tarefas',
      icon: 'trophy', xpReward: 25, category: 'tasks', maxProgress: 5,
      progress: Math.min(completed.length, 5),
      unlockedAt: completed.length >= 5 ? completed[completed.length - 1].updatedAt : undefined,
    },
    {
      id: 'tasks_25', title: 'Produtivo', description: 'Complete 25 tarefas',
      icon: 'medal', xpReward: 75, category: 'tasks', maxProgress: 25,
      progress: Math.min(completed.length, 25),
      unlockedAt: completed.length >= 25 ? completed[completed.length - 1].updatedAt : undefined,
    },
    {
      id: 'tasks_100', title: 'Maratonista', description: 'Complete 100 tarefas',
      icon: 'award', xpReward: 200, category: 'tasks', maxProgress: 100,
      progress: Math.min(completed.length, 100),
      unlockedAt: completed.length >= 100 ? completed[completed.length - 1].updatedAt : undefined,
    },
    {
      id: 'streak_7', title: 'Sequência de Fogo', description: 'Mantenha uma sequência de 7 dias',
      icon: 'flame', xpReward: 75, category: 'streak', maxProgress: 7,
      progress: Math.min(streak, 7),
      unlockedAt: streak >= 7 ? new Date().toISOString() : undefined,
    },
    {
      id: 'focus_60h', title: 'Hiperfoco', description: 'Acumule 60 horas de foco',
      icon: 'target', xpReward: 200, category: 'special', maxProgress: 3600,
      progress: Math.min(totalMinutes, 3600),
      unlockedAt: totalMinutes >= 3600 ? new Date().toISOString() : undefined,
    },
  ];

  return {
    totalXP,
    currentLevel,
    tasksCompleted: completed.length,
    tasksCompletedToday: todayCount,
    currentStreak: streak,
    longestStreak: streak,
    totalMinutesFocused: totalMinutes,
    achievements,
    weeklyProgress,
  };
}

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
  accentColor,
  accentBg,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  accentColor: string;
  accentBg: string;
}) {
  return (
    <div style={{
      background: accentBg,
      border: `1px solid ${accentColor}`,
      borderLeft: `4px solid ${accentColor}`,
      borderRadius: '12px',
      padding: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Icon size={16} color={accentColor} />
        <span style={{ fontSize: '13px', color: accentColor, fontWeight: 500 }}>{title}</span>
      </div>
      <p style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>{value}</p>
      {subtitle && <p style={{ fontSize: '12px', color: 'var(--color-text-sec)', margin: '4px 0 0 0' }}>{subtitle}</p>}
    </div>
  );
}

function XPProgressBar({ currentXP, minXP, maxXP }: { currentXP: number; minXP: number; maxXP: number }) {
  const progress = ((currentXP - minXP) / (maxXP - minXP)) * 100;
  return (
    <div style={{ position: 'relative', height: '16px', background: 'var(--color-border)', borderRadius: '999px', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          height: '100%',
          background: 'var(--color-done)',
          borderRadius: '999px',
          width: `${Math.min(progress, 100)}%`,
          transition: 'width 500ms ease-out',
        }}
      />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text)', filter: 'drop-shadow(0 1px 1px rgba(255,255,255,0.5))' }}>
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
    <div style={{
      position: 'relative',
      padding: '16px',
      borderRadius: '12px',
      border: isUnlocked ? '2px solid var(--color-reward)' : '1px solid var(--color-border)',
      background: isUnlocked ? 'var(--color-reward-bg)' : 'var(--color-surface-2)',
      transition: 'all 300ms',
    }}>
      {isUnlocked && (
        <div style={{ position: 'absolute', top: '-8px', right: '-8px' }}>
          <div style={{ background: 'var(--color-reward)', borderRadius: '999px', padding: '4px', display: 'flex' }}>
            <CheckCircle2 size={14} color="#fff" />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{
          padding: '10px',
          borderRadius: '10px',
          background: isUnlocked ? 'var(--color-reward)' : 'var(--color-border)',
          color: isUnlocked ? '#fff' : 'var(--color-text-muted)',
          display: 'flex',
          flexShrink: 0,
        }}>
          {getAchievementIcon(achievement.icon)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h4 style={{
              fontWeight: 600,
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: isUnlocked ? 'var(--color-reward)' : 'var(--color-text-sec)',
            }}>
              {achievement.title}
            </h4>
            <span style={{
              flexShrink: 0,
              fontSize: '11px',
              color: isUnlocked ? 'var(--color-reward)' : 'var(--color-text-muted)',
              border: `1px solid ${isUnlocked ? 'var(--color-reward)' : 'var(--color-border)'}`,
              borderRadius: '999px',
              padding: '2px 6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              {getCategoryIcon(achievement.category)}
              {getCategoryLabel(achievement.category)}
            </span>
          </div>

          <p style={{ fontSize: '13px', margin: '0 0 8px 0', color: isUnlocked ? 'var(--color-text-sec)' : 'var(--color-text-muted)' }}>
            {achievement.description}
          </p>

          {!isUnlocked && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                <span>Progresso</span>
                <span>{achievement.progress}/{achievement.maxProgress}</span>
              </div>
              <div style={{ height: '6px', background: 'var(--color-border)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  background: 'var(--color-reward)',
                  borderRadius: '999px',
                  width: `${progress}%`,
                  transition: 'width 300ms',
                }} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Zap size={14} color={isUnlocked ? 'var(--color-action)' : 'var(--color-text-muted)'} />
            <span style={{ fontSize: '13px', fontWeight: 500, color: isUnlocked ? 'var(--color-action)' : 'var(--color-text-muted)' }}>
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
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px', height: '128px' }}>
      {data.map((item, index) => {
        const height = (item.completed / maxCompleted) * 100;
        const isToday = index === data.length - 1;

        return (
          <div key={item.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
            <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: '32px',
                  borderRadius: '4px 4px 0 0',
                  height: `${Math.max(height, 8)}px`,
                  background: isToday ? 'var(--color-reward)' : 'var(--color-done)',
                  transition: 'height 500ms',
                }}
              />
              {item.completed > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-20px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--color-text-sec)',
                }}>
                  {item.completed}
                </span>
              )}
            </div>
            <span style={{
              fontSize: '11px',
              fontWeight: 500,
              color: isToday ? 'var(--color-reward)' : 'var(--color-text-muted)',
            }}>
              {item.day}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const categoryConfig: { key: keyof typeof TaskCategory; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { key: 'STUDY',   label: 'Estudos',  icon: BookOpen,       color: 'var(--color-reward)', bg: 'var(--color-reward-bg)' },
  { key: 'WORK',    label: 'Trabalho', icon: Briefcase,      color: 'var(--color-focus)',  bg: 'var(--color-focus-bg)'  },
  { key: 'HOME',    label: 'Casa',     icon: Home,           color: 'var(--color-done)',   bg: 'var(--color-done-bg)'   },
  { key: 'HEALTH',  label: 'Saúde',    icon: Dumbbell,       color: 'var(--color-alert)',  bg: 'var(--color-alert-bg)'  },
  { key: 'LEISURE', label: 'Lazer',    icon: Gamepad2,       color: 'var(--color-action)', bg: 'var(--color-action-bg)' },
  { key: 'OTHER',   label: 'Outros',   icon: MoreHorizontal, color: 'var(--color-text-muted)', bg: 'var(--color-surface-2)' },
];

const getRandomQuote = () => motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
const initialQuote = getRandomQuote();

const cardStyle: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '12px',
};

const sectionHeaderStyle: React.CSSProperties = {
  padding: '20px 20px 0 20px',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [quote] = useState(initialQuote);
  const { data: tasks = [] } = useTasks();

  const stats = useMemo(() => computeStats(tasks), [tasks]);

  const categoryCounts = useMemo(() => {
    const done = tasks.filter((t) => t.status === TaskStatus.COMPLETED);
    return {
      STUDY:   done.filter((t) => t.category === TaskCategory.STUDY).length,
      WORK:    done.filter((t) => t.category === TaskCategory.WORK).length,
      HOME:    done.filter((t) => t.category === TaskCategory.HOME).length,
      HEALTH:  done.filter((t) => t.category === TaskCategory.HEALTH).length,
      LEISURE: done.filter((t) => t.category === TaskCategory.LEISURE).length,
      OTHER:   done.filter((t) => t.category === TaskCategory.OTHER).length,
    };
  }, [tasks]);

  const unlockedAchievements = stats.achievements.filter((a) => a.unlockedAt);
  const inProgressAchievements = stats.achievements.filter((a) => !a.unlockedAt);
  const hasWeeklyActivity = stats.weeklyProgress.some((d) => d.completed > 0);

  const nextLevel = levels.find((l) => l.level === stats.currentLevel.level + 1);
  const xpToNextLevel = nextLevel ? nextLevel.minXP - stats.totalXP : 0;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">

      {/* Saudação */}
      <div style={{ ...cardStyle, padding: '20px', borderLeft: '4px solid var(--color-action)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            padding: '12px',
            background: 'var(--color-action-bg)',
            borderRadius: '12px',
            display: 'flex',
            flexShrink: 0,
          }}>
            <Sparkles size={24} color="var(--color-action)" />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--color-text)' }}>
              Olá! Bem-vindo de volta!
            </h2>
            <p style={{ margin: 0, color: 'var(--color-text-sec)', fontSize: '14px' }}>{quote}</p>
          </div>
        </div>
      </div>

      {/* Ação Rápida */}
      <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px' }}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontWeight: 600, color: 'var(--color-text)' }}>
              O que você vai fazer hoje?
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-sec)' }}>
              Suas tarefas estão esperando por você
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => navigate('/focus')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                borderRadius: '8px',
                background: 'var(--color-focus-bg)',
                color: 'var(--color-focus)',
                border: '1px solid var(--color-focus)',
              }}
            >
              <Timer size={14} />
              Foco
            </button>
            <button
              onClick={() => navigate('/tasks/notion')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                borderRadius: '8px',
                background: 'var(--color-action)',
                color: '#1E1E1C',
                border: 'none',
              }}
            >
              <Plus size={14} />
              Adicionar Tarefa
            </button>
          </div>
        </div>
      </div>

      {/* Nível e XP */}
      <div style={{ ...cardStyle, padding: '24px' }}>
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '999px',
                background: 'var(--color-action)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: '24px', fontWeight: 700, color: '#1E1E1C' }}>{stats.currentLevel.level}</span>
              </div>
              <div style={{
                position: 'absolute',
                bottom: '-4px',
                right: '-4px',
                background: 'var(--color-reward)',
                borderRadius: '999px',
                padding: '4px',
                display: 'flex',
              }}>
                <Crown size={14} color="#fff" />
              </div>
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 2px 0', color: 'var(--color-text)' }}>
                {stats.currentLevel.title}
              </h3>
              <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--color-text-sec)' }}>
                Nível {stats.currentLevel.level}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Zap size={14} color="var(--color-action)" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-action)' }}>
                  {stats.totalXP} XP Total
                </span>
              </div>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-sec)' }}>
                Progresso para o próximo nível
              </span>
              {nextLevel && (
                <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                  Faltam{' '}
                  <span style={{ fontWeight: 700, color: 'var(--color-reward)' }}>{xpToNextLevel} XP</span>{' '}
                  para <span style={{ fontWeight: 600, color: 'var(--color-text-sec)' }}>{nextLevel.title}</span>
                </span>
              )}
            </div>
            <XPProgressBar currentXP={stats.totalXP} minXP={stats.currentLevel.minXP} maxXP={stats.currentLevel.maxXP} />
          </div>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tarefas Concluídas"
          value={stats.tasksCompleted}
          subtitle={`+${stats.tasksCompletedToday} hoje`}
          icon={CheckCircle2}
          accentColor="var(--color-done)"
          accentBg="var(--color-done-bg)"
        />
        <StatCard
          title="Sequência Atual"
          value={`${stats.currentStreak} dias`}
          subtitle={`Recorde: ${stats.longestStreak} dias`}
          icon={Flame}
          accentColor="var(--color-alert)"
          accentBg="var(--color-alert-bg)"
        />
        <StatCard
          title="Tempo Focado"
          value={`${Math.floor(stats.totalMinutesFocused / 60)}h`}
          subtitle={`${stats.totalMinutesFocused % 60} minutos`}
          icon={Target}
          accentColor="var(--color-focus)"
          accentBg="var(--color-focus-bg)"
        />
        <StatCard
          title="Conquistas"
          value={unlockedAchievements.length}
          subtitle={`de ${stats.achievements.length} disponíveis`}
          icon={Trophy}
          accentColor="var(--color-reward)"
          accentBg="var(--color-reward-bg)"
        />
      </div>

      {/* Grid de Conteúdo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progresso Semanal */}
        <div style={{ ...cardStyle, gridColumn: 'span 2' }} className="lg:col-span-2">
          <div style={sectionHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: 600, color: 'var(--color-text)' }}>
                <TrendingUp size={18} color="var(--color-done)" />
                Progresso Semanal
              </h2>
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                color: 'var(--color-done)',
                background: 'var(--color-done-bg)',
                border: '1px solid var(--color-done)',
                borderRadius: '999px',
                padding: '3px 10px',
              }}>
                <Calendar size={11} />
                Esta semana
              </span>
            </div>
          </div>
          <div style={{ padding: '0 20px 20px 20px' }}>
            {hasWeeklyActivity ? (
              <WeeklyProgressChart data={stats.weeklyProgress} />
            ) : (
              <EmptyState
                icon={TrendingUp}
                message="Complete sua primeira tarefa para ver seu progresso aqui."
              />
            )}
          </div>
        </div>

        {/* Tarefas por Categoria */}
        <div style={cardStyle}>
          <div style={sectionHeaderStyle}>
            <h2 style={{ margin: '0 0 16px 0', fontWeight: 600, color: 'var(--color-text)', paddingBottom: '0' }}>
              Tarefas por Categoria
            </h2>
          </div>
          <div style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {stats.tasksCompleted === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                message="Suas tarefas por categoria aparecem aqui após você completar algumas."
                ctaLabel="Adicionar tarefa"
                onCta={() => navigate('/tasks/notion')}
              />
            ) : (
              categoryConfig.map(({ key, label, icon: Icon, color, bg }) => (
                <div key={key} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: bg,
                }}>
                  <Icon size={16} color={color} />
                  <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>{label}</span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color,
                    background: 'rgba(255,255,255,0.5)',
                    borderRadius: '999px',
                    padding: '2px 8px',
                  }}>
                    {categoryCounts[key]}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Conquistas */}
      <div style={cardStyle}>
        <div style={sectionHeaderStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: 600, color: 'var(--color-text)' }}>
              <Award size={18} color="var(--color-action)" />
              Suas Conquistas
            </h2>
            <span style={{
              fontSize: '12px',
              color: 'var(--color-action)',
              background: 'var(--color-action-bg)',
              border: '1px solid var(--color-action)',
              borderRadius: '999px',
              padding: '3px 10px',
            }}>
              {unlockedAchievements.length} de {stats.achievements.length} desbloqueadas
            </span>
          </div>
        </div>
        <div style={{ padding: '0 20px 20px 20px' }}>
          {unlockedAchievements.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '13px', fontWeight: 600, color: 'var(--color-done)',
                margin: '0 0 12px 0',
              }}>
                <CheckCircle2 size={14} color="var(--color-done)" />
                Desbloqueadas
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {unlockedAchievements.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            </div>
          )}

          {inProgressAchievements.length > 0 && (
            <div>
              <h4 style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '13px', fontWeight: 600, color: 'var(--color-reward)',
                margin: '0 0 12px 0',
              }}>
                <Target size={14} color="var(--color-reward)" />
                Em Progresso
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {inProgressAchievements.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dica TDAH */}
      <div style={{
        background: 'var(--color-action-bg)',
        border: '1px solid var(--color-action)',
        borderLeft: '4px solid var(--color-action)',
        borderRadius: '12px',
        padding: '16px 20px',
        fontSize: '14px',
        color: 'var(--color-text-sec)',
        lineHeight: '1.6',
      }}>
        <strong style={{ color: 'var(--color-text)' }}>Dica para TDAH:</strong>{' '}
        Divida suas tarefas grandes em pequenos passos. Isso ajuda a manter o foco e traz uma sensação de progresso constante. Cada pequena vitória conta!
      </div>

    </div>
  );
}
