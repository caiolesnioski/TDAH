export const TaskCategory = {
  STUDY: 0,
  WORK: 1,
  HOME: 2,
  HEALTH: 3,
  LEISURE: 4,
  OTHER: 5,
} as const;
export type TaskCategory = (typeof TaskCategory)[keyof typeof TaskCategory];

export const TaskPriority = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
} as const;
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export const TaskStatus = {
  PENDING: 0,
  IN_PROGRESS: 1,
  COMPLETED: 2,
  CANCELLED: 3,
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  estimatedMinutes: number;
  actualMinutes?: number;
  deadline: string;
  dueDate?: string;
  difficultyRating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  deadline: string;
  estimatedMinutes: number;
  description?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  idealSleepHours: string;
  wakeUpTime: string;
  password: string;
  confirmPassword: string;
}

// Gamification Types
export interface UserLevel {
  level: number;
  title: string;
  minXP: number;
  maxXP: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
  xpReward: number;
  category: 'tasks' | 'streak' | 'special' | 'social';
}

export interface UserStats {
  totalXP: number;
  currentLevel: UserLevel;
  tasksCompleted: number;
  tasksCompletedToday: number;
  currentStreak: number;
  longestStreak: number;
  totalMinutesFocused: number;
  achievements: Achievement[];
  weeklyProgress: {
    day: string;
    completed: number;
  }[];
}

// Schedule/Time Block Types
export const TimeBlockType = {
  WORK: 'WORK',
  CLASS: 'CLASS',
  FIXED: 'FIXED',
  TASK: 'TASK',
} as const;
export type TimeBlockType = (typeof TimeBlockType)[keyof typeof TimeBlockType];

export interface TimeBlock {
  id: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Domingo, 6 = Sábado
  startTime: string; // Formato HH:mm
  endTime: string; // Formato HH:mm
  type: TimeBlockType;
  title: string;
  category?: TaskCategory;
  isRecurring: boolean;
  validFrom?: string; // Data início da repetição (ISO string)
  validUntil?: string; // Data fim da repetição (ISO string)
}

export interface WeekSchedule {
  blocks: TimeBlock[];
}

// Onboarding Types
export interface OnboardingData {
  workSchedule: TimeBlock[];
  classSchedule: TimeBlock[];
  fixedCommitments: TimeBlock[];
}
