import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { calculateSessionXP, checkAchievements } from '../lib/rewards';
import { TaskCategory, TaskPriority, TaskStatus } from '../types';
import type { Achievement } from '../types';

type SessionStatus = 'in_progress' | 'completed_on_time' | 'completed_late' | 'abandoned';

type TaskSession = {
  id: string;
  taskId: string;
  estimatedMinutes: number;
  actualMinutes: number | null;
  startedAt: string;
  completedAt: string | null;
  status: SessionStatus;
  extraMinutesAdded: number;
  xpEarned: number;
};

type SessionWithTask = TaskSession & {
  taskTitle: string;
  taskCategory: TaskCategory;
  taskPriority: TaskPriority;
};

type StartSessionParams = {
  taskId: string;
  estimatedMinutes: number;
};

type StartSessionResult = {
  sessionId: string;
  startedAt: string;
};

type CompleteSessionParams = {
  sessionId: string;
  taskId: string;
  completedOnTime: boolean;
  actualMinutes: number;
  estimatedMinutes: number;
  category: TaskCategory;
  priority: TaskPriority;
};

type CompleteSessionResult = {
  xpEarned: number;
  achievements: Achievement[];
  completedOnTime: boolean;
};

type ExtendSessionParams = {
  sessionId: string;
  extraMinutes: number;
};

// ── useStartTaskSession ───────────────────────────────────────────────────────

export function useStartTaskSession() {
  const queryClient = useQueryClient();
  return useMutation<StartSessionResult, Error, StartSessionParams>({
    mutationFn: async ({ taskId, estimatedMinutes }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('task_sessions')
        .insert({
          user_id: user.id,
          task_id: taskId,
          estimated_minutes: estimatedMinutes,
          status: 'in_progress',
        })
        .select('id, started_at')
        .single();
      if (error) throw error;

      return { sessionId: data.id as string, startedAt: data.started_at as string };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task_sessions'] }),
  });
}

// ── useCompleteTaskSession ────────────────────────────────────────────────────

export function useCompleteTaskSession() {
  const queryClient = useQueryClient();
  return useMutation<CompleteSessionResult, Error, CompleteSessionParams>({
    mutationFn: async ({
      sessionId,
      taskId,
      completedOnTime,
      actualMinutes,
      estimatedMinutes,
      category,
      priority,
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const today = new Date().toISOString().split('T')[0];
      const todayStart = `${today}T00:00:00.000Z`;

      // Fetch counts needed for XP and achievement calculation (parallel)
      const [
        { count: todayCompletedCount },
        { count: totalOnTimeCount },
        { count: totalCompletedCount },
        { count: todayOnTimeCount },
        { data: existingAchievements },
        { data: statsData },
      ] = await Promise.all([
        supabase
          .from('task_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('status', ['completed_on_time', 'completed_late'])
          .gte('started_at', todayStart),
        supabase
          .from('task_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed_on_time'),
        supabase
          .from('task_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .in('status', ['completed_on_time', 'completed_late']),
        supabase
          .from('task_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed_on_time')
          .gte('started_at', todayStart),
        supabase
          .from('user_achievements')
          .select('achievement_id')
          .eq('user_id', user.id),
        supabase
          .from('user_stats')
          .select('total_xp, tasks_completed, total_focus_minutes')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      const alreadyUnlocked = (existingAchievements ?? []).map(
        (a: { achievement_id: string }) => a.achievement_id
      );

      // Post-completion counts include this session
      const newTotalCompleted = (totalCompletedCount ?? 0) + 1;
      const newTotalOnTime = completedOnTime ? (totalOnTimeCount ?? 0) + 1 : (totalOnTimeCount ?? 0);
      const newTodayOnTime = completedOnTime ? (todayOnTimeCount ?? 0) + 1 : (todayOnTimeCount ?? 0);

      const sessionXP = calculateSessionXP({
        estimatedMinutes,
        completedOnTime,
        category,
        priority,
        todayCompletedCount: todayCompletedCount ?? 0,
      });

      const newAchievements = checkAchievements({
        totalSessionsCompleted: newTotalCompleted,
        totalOnTimeCompleted: newTotalOnTime,
        todayOnTimeCount: newTodayOnTime,
        completedOnTime,
        category,
        estimatedMinutes,
        alreadyUnlocked,
      });

      const achievementXP = newAchievements.reduce((sum, a) => sum + a.xpReward, 0);
      const totalXPEarned = sessionXP + achievementXP;
      const sessionStatus: SessionStatus = completedOnTime ? 'completed_on_time' : 'completed_late';
      const now = new Date().toISOString();

      // 1. Update task_sessions
      const { error: sessionError } = await supabase
        .from('task_sessions')
        .update({
          status: sessionStatus,
          completed_at: now,
          actual_minutes: actualMinutes,
          xp_earned: sessionXP,
        })
        .eq('id', sessionId);
      if (sessionError) throw sessionError;

      // 2. Mark task as completed
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ status: TaskStatus.COMPLETED, updated_at: now })
        .eq('id', taskId);
      if (taskError) throw taskError;

      // 3. Upsert user_stats
      const { error: statsError } = await supabase
        .from('user_stats')
        .upsert(
          {
            user_id: user.id,
            total_xp: (statsData?.total_xp ?? 0) + totalXPEarned,
            tasks_completed: (statsData?.tasks_completed ?? 0) + 1,
            total_focus_minutes: (statsData?.total_focus_minutes ?? 0) + actualMinutes,
            last_activity_date: today,
            updated_at: now,
          },
          { onConflict: 'user_id' }
        );
      if (statsError) throw statsError;

      // 4. Insert newly unlocked achievements
      if (newAchievements.length > 0) {
        const { error: achError } = await supabase
          .from('user_achievements')
          .insert(
            newAchievements.map(a => ({
              user_id: user.id,
              achievement_id: a.id,
              unlocked_at: now,
            }))
          );
        if (achError) throw achError;
      }

      return { xpEarned: totalXPEarned, achievements: newAchievements, completedOnTime };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task_sessions'] });
      queryClient.invalidateQueries({ queryKey: ['user_stats'] });
    },
  });
}

// ── useExtendTaskSession ──────────────────────────────────────────────────────

export function useExtendTaskSession() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, ExtendSessionParams>({
    mutationFn: async ({ sessionId, extraMinutes }) => {
      // Use RPC-style increment via raw SQL expression isn't available in JS client,
      // so we fetch current value then update to avoid a race — acceptable for single-user sessions.
      const { data, error: fetchError } = await supabase
        .from('task_sessions')
        .select('extra_minutes_added')
        .eq('id', sessionId)
        .single();
      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('task_sessions')
        .update({ extra_minutes_added: (data.extra_minutes_added as number) + extraMinutes })
        .eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task_sessions'] }),
  });
}

// ── useAbandonTaskSession ─────────────────────────────────────────────────────

export function useAbandonTaskSession() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { sessionId: string }>({
    mutationFn: async ({ sessionId }) => {
      const { error } = await supabase
        .from('task_sessions')
        .update({ status: 'abandoned', completed_at: new Date().toISOString() })
        .eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task_sessions'] });
    },
  });
}

// ── useDailySummary ───────────────────────────────────────────────────────────

export function useDailySummary(date: string) {
  return useQuery<SessionWithTask[], Error>({
    queryKey: ['task_sessions', 'daily', date],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('task_sessions')
        .select('*, tasks(id, title, category, priority)')
        .eq('user_id', user.id)
        .gte('started_at', `${date}T00:00:00.000Z`)
        .lte('started_at', `${date}T23:59:59.999Z`)
        .order('started_at', { ascending: true });
      if (error) throw error;

      return (data ?? []).map((row: Record<string, unknown>) => {
        const task = row.tasks as { id: string; title: string; category: number; priority: number } | null;
        return {
          id: row.id as string,
          taskId: row.task_id as string,
          taskTitle: task?.title ?? '',
          taskCategory: (task?.category ?? 0) as TaskCategory,
          taskPriority: (task?.priority ?? 0) as TaskPriority,
          estimatedMinutes: row.estimated_minutes as number,
          actualMinutes: row.actual_minutes as number | null,
          startedAt: row.started_at as string,
          completedAt: row.completed_at as string | null,
          status: row.status as SessionStatus,
          extraMinutesAdded: row.extra_minutes_added as number,
          xpEarned: row.xp_earned as number,
        };
      });
    },
  });
}
