import { TaskCategory, TaskPriority } from '../types';
import type { Achievement } from '../types';

// All possible achievements the system can award
const ACHIEVEMENT_CATALOG: Achievement[] = [
  {
    id: 'first_task',
    title: 'Primeira Conquista',
    description: 'Concluiu sua primeira tarefa com sucesso!',
    icon: 'Star',
    xpReward: 50,
    progress: 0,
    maxProgress: 1,
    category: 'tasks',
  },
  {
    id: 'on_time_3',
    title: 'No Ritmo',
    description: 'Concluiu 3 tarefas no prazo no mesmo dia.',
    icon: 'Zap',
    xpReward: 75,
    progress: 0,
    maxProgress: 3,
    category: 'streak',
  },
  {
    id: 'on_time_10',
    title: 'Mestre do Prazo',
    description: 'Concluiu 10 tarefas no prazo ao longo do tempo.',
    icon: 'Trophy',
    xpReward: 200,
    progress: 0,
    maxProgress: 10,
    category: 'tasks',
  },
  {
    id: 'study_focus',
    title: 'Foco de Estudante',
    description: 'Concluiu uma sessão de Estudos dentro do tempo estimado.',
    icon: 'GraduationCap',
    xpReward: 100,
    progress: 0,
    maxProgress: 1,
    category: 'special',
  },
  {
    id: 'speed_runner',
    title: 'Speed Runner',
    description: 'Concluiu uma tarefa de 15+ minutos dentro do tempo estimado.',
    icon: 'Rocket',
    xpReward: 150,
    progress: 0,
    maxProgress: 1,
    category: 'special',
  },
];

/**
 * Calculates XP earned for a completed focus session.
 *
 * Base: estimated_minutes * 2 (on time) or * 1 (late), min 10 / 5 respectively.
 * Bonuses applied multiplicatively: STUDY +50%, HIGH priority +25%, streak 3+ today +20%.
 */
export function calculateSessionXP(params: {
  estimatedMinutes: number;
  completedOnTime: boolean;
  category: TaskCategory;
  priority: TaskPriority;
  todayCompletedCount: number;
}): number {
  const { estimatedMinutes, completedOnTime, category, priority, todayCompletedCount } = params;

  let xp = completedOnTime
    ? Math.max(estimatedMinutes * 2, 10)
    : Math.max(estimatedMinutes, 5);

  if (category === TaskCategory.STUDY) xp = Math.round(xp * 1.5);
  if (priority === TaskPriority.HIGH) xp = Math.round(xp * 1.25);
  if (todayCompletedCount >= 3) xp = Math.round(xp * 1.2);

  return xp;
}

/**
 * Returns achievements newly unlocked by this session.
 * Pass alreadyUnlocked so we never return duplicates.
 *
 * Counts are post-completion (i.e. include the session just finished).
 */
export function checkAchievements(params: {
  totalSessionsCompleted: number;  // all completed sessions (on-time + late), including this one
  totalOnTimeCompleted: number;    // completed_on_time sessions all-time, including this one
  todayOnTimeCount: number;        // completed_on_time sessions today, including this one
  completedOnTime: boolean;
  category: TaskCategory;
  estimatedMinutes: number;
  alreadyUnlocked: string[];       // achievement IDs the user already has
}): Achievement[] {
  const {
    totalSessionsCompleted,
    totalOnTimeCompleted,
    todayOnTimeCount,
    completedOnTime,
    category,
    estimatedMinutes,
    alreadyUnlocked,
  } = params;

  const unlocked = new Set(alreadyUnlocked);

  const candidates: { id: string; condition: boolean }[] = [
    { id: 'first_task',   condition: totalSessionsCompleted === 1 },
    { id: 'on_time_3',   condition: completedOnTime && todayOnTimeCount >= 3 },
    { id: 'on_time_10',  condition: completedOnTime && totalOnTimeCompleted >= 10 },
    { id: 'study_focus', condition: completedOnTime && category === TaskCategory.STUDY },
    { id: 'speed_runner', condition: completedOnTime && estimatedMinutes > 15 },
  ];

  return candidates
    .filter(c => c.condition && !unlocked.has(c.id))
    .map(c => ACHIEVEMENT_CATALOG.find(a => a.id === c.id)!);
}
