import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface UserPreferences {
  idealSleepHours: number;
  wakeTime: string;
  sleepTime: string;
  pomodoroLength: number;
  breakLength: number;
  dailyGoal: number;
  maxTasksPerDay: number;
  taskChunkMinutes: number;
  simplifiedView: boolean;
  priorityHighlight: boolean;
  motivationMessages: boolean;
  confirmDestructive: boolean;
  autoBreakReminder: boolean;
  taskReminders: boolean;
  reminderMinutes: number;
  dailyDigest: boolean;
  digestHour: string;
  streakAlerts: boolean;
  xpAlerts: boolean;
  focusReminders: boolean;
  focusIntervalMinutes: number;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  idealSleepHours: 8,
  wakeTime: '07:00',
  sleepTime: '23:00',
  pomodoroLength: 25,
  breakLength: 5,
  dailyGoal: 5,
  maxTasksPerDay: 8,
  taskChunkMinutes: 25,
  simplifiedView: false,
  priorityHighlight: true,
  motivationMessages: true,
  confirmDestructive: true,
  autoBreakReminder: true,
  taskReminders: true,
  reminderMinutes: 15,
  dailyDigest: true,
  digestHour: '08:00',
  streakAlerts: true,
  xpAlerts: true,
  focusReminders: false,
  focusIntervalMinutes: 25,
};

type Row = Record<string, unknown>;

function mapPrefs(row: Row): UserPreferences {
  return {
    idealSleepHours:    (row.ideal_sleep_hours    as number)  ?? DEFAULT_PREFERENCES.idealSleepHours,
    wakeTime:           (row.wake_time             as string)  ?? DEFAULT_PREFERENCES.wakeTime,
    sleepTime:          (row.sleep_time            as string)  ?? DEFAULT_PREFERENCES.sleepTime,
    pomodoroLength:     (row.pomodoro_length       as number)  ?? DEFAULT_PREFERENCES.pomodoroLength,
    breakLength:        (row.break_length          as number)  ?? DEFAULT_PREFERENCES.breakLength,
    dailyGoal:          (row.daily_goal            as number)  ?? DEFAULT_PREFERENCES.dailyGoal,
    maxTasksPerDay:     (row.max_tasks_per_day     as number)  ?? DEFAULT_PREFERENCES.maxTasksPerDay,
    taskChunkMinutes:   (row.task_chunk_minutes    as number)  ?? DEFAULT_PREFERENCES.taskChunkMinutes,
    simplifiedView:     (row.simplified_view       as boolean) ?? DEFAULT_PREFERENCES.simplifiedView,
    priorityHighlight:  (row.priority_highlight    as boolean) ?? DEFAULT_PREFERENCES.priorityHighlight,
    motivationMessages: (row.motivation_messages   as boolean) ?? DEFAULT_PREFERENCES.motivationMessages,
    confirmDestructive: (row.confirm_destructive   as boolean) ?? DEFAULT_PREFERENCES.confirmDestructive,
    autoBreakReminder:  (row.auto_break_reminder   as boolean) ?? DEFAULT_PREFERENCES.autoBreakReminder,
    taskReminders:      (row.task_reminders        as boolean) ?? DEFAULT_PREFERENCES.taskReminders,
    reminderMinutes:    (row.reminder_minutes      as number)  ?? DEFAULT_PREFERENCES.reminderMinutes,
    dailyDigest:        (row.daily_digest          as boolean) ?? DEFAULT_PREFERENCES.dailyDigest,
    digestHour:         (row.digest_hour           as string)  ?? DEFAULT_PREFERENCES.digestHour,
    streakAlerts:       (row.streak_alerts         as boolean) ?? DEFAULT_PREFERENCES.streakAlerts,
    xpAlerts:           (row.xp_alerts             as boolean) ?? DEFAULT_PREFERENCES.xpAlerts,
    focusReminders:     (row.focus_reminders       as boolean) ?? DEFAULT_PREFERENCES.focusReminders,
    focusIntervalMinutes: (row.focus_interval_minutes as number) ?? DEFAULT_PREFERENCES.focusIntervalMinutes,
  };
}

function toRow(prefs: Partial<UserPreferences>): Row {
  const r: Row = {};
  if (prefs.idealSleepHours    !== undefined) r.ideal_sleep_hours     = prefs.idealSleepHours;
  if (prefs.wakeTime           !== undefined) r.wake_time             = prefs.wakeTime;
  if (prefs.sleepTime          !== undefined) r.sleep_time            = prefs.sleepTime;
  if (prefs.pomodoroLength     !== undefined) r.pomodoro_length       = prefs.pomodoroLength;
  if (prefs.breakLength        !== undefined) r.break_length          = prefs.breakLength;
  if (prefs.dailyGoal          !== undefined) r.daily_goal            = prefs.dailyGoal;
  if (prefs.maxTasksPerDay     !== undefined) r.max_tasks_per_day     = prefs.maxTasksPerDay;
  if (prefs.taskChunkMinutes   !== undefined) r.task_chunk_minutes    = prefs.taskChunkMinutes;
  if (prefs.simplifiedView     !== undefined) r.simplified_view       = prefs.simplifiedView;
  if (prefs.priorityHighlight  !== undefined) r.priority_highlight    = prefs.priorityHighlight;
  if (prefs.motivationMessages !== undefined) r.motivation_messages   = prefs.motivationMessages;
  if (prefs.confirmDestructive !== undefined) r.confirm_destructive   = prefs.confirmDestructive;
  if (prefs.autoBreakReminder  !== undefined) r.auto_break_reminder   = prefs.autoBreakReminder;
  if (prefs.taskReminders      !== undefined) r.task_reminders        = prefs.taskReminders;
  if (prefs.reminderMinutes    !== undefined) r.reminder_minutes      = prefs.reminderMinutes;
  if (prefs.dailyDigest        !== undefined) r.daily_digest          = prefs.dailyDigest;
  if (prefs.digestHour         !== undefined) r.digest_hour           = prefs.digestHour;
  if (prefs.streakAlerts       !== undefined) r.streak_alerts         = prefs.streakAlerts;
  if (prefs.xpAlerts           !== undefined) r.xp_alerts             = prefs.xpAlerts;
  if (prefs.focusReminders     !== undefined) r.focus_reminders       = prefs.focusReminders;
  if (prefs.focusIntervalMinutes !== undefined) r.focus_interval_minutes = prefs.focusIntervalMinutes;
  return r;
}

export function usePreferences() {
  return useQuery<UserPreferences, Error>({
    queryKey: ['preferences'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return DEFAULT_PREFERENCES;
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error || !data) return DEFAULT_PREFERENCES;
      return mapPrefs(data as Row);
    },
  });
}

export function useUpsertPreferences() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, Partial<UserPreferences>>({
    mutationFn: async (prefs) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase
        .from('user_preferences')
        .upsert(
          { user_id: user.id, ...toRow(prefs), updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['preferences'] }),
  });
}
