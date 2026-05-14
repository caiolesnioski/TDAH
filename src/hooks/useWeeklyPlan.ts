import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WeeklyPlanTask {
  id: string;
  weekly_plan_id: string;
  title: string;
  category: string;
  priority: string;
  estimated_minutes: number;
  scheduled_day: string | null;
  scheduled_start: string | null;
  task_id: string | null;
  created_at: string;
}

export interface WeeklyPlan {
  id: string;
  user_id: string;
  week_start: string;
  created_at: string;
  completed_at: string | null;
  weekly_plan_tasks: WeeklyPlanTask[];
}

export interface PlanningSettings {
  user_id: string;
  sunday_planning_enabled: boolean;
  last_reminded_at: string | null;
}

type DayCode = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';

// ─── Date / time helpers ──────────────────────────────────────────────────────

/**
 * Returns the YYYY-MM-DD of the Monday that anchors the planning week:
 * - On Sunday  → tomorrow (next Monday, i.e. the week the user is planning for)
 * - Any other day → Monday of the current ISO week
 */
function getPlanWeekStart(today = new Date()): string {
  const dow = today.getDay(); // 0 = Sun
  const d = new Date(today);
  if (dow === 0) {
    d.setDate(d.getDate() + 1);
  } else {
    d.setDate(d.getDate() - (dow - 1));
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

/** Maps a day-code offset from week_start (Monday = 0) to a YYYY-MM-DD string. */
function dayCodeToDate(weekStart: string, day: DayCode): string {
  const offset: Record<DayCode, number> = {
    seg: 0, ter: 1, qua: 2, qui: 3, sex: 4, sab: 5, dom: 6,
  };
  const [y, mo, d] = weekStart.split('-').map(Number);
  const date = new Date(Date.UTC(y, mo - 1, d + offset[day]));
  return date.toISOString().slice(0, 10);
}

// ─── Distribution algorithm ───────────────────────────────────────────────────

const DAY_TO_DOW: Record<DayCode, number> = {
  dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6,
};

const WEEK_DAYS: DayCode[] = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];

interface FreeSlot { day: DayCode; start: number; end: number }
type RawBlock = { day_of_week: number; start_time: string; end_time: string };

/**
 * Builds the list of free time slots for the week by subtracting fixed time_blocks
 * from the awake window [wakeTime, sleepTime] on each day.
 * Overlapping or adjacent blocks are merged via the cursor approach.
 */
function computeFreeSlots(blocks: RawBlock[], wakeTime: string, sleepTime: string): FreeSlot[] {
  const wake = timeToMinutes(wakeTime);
  const sleep = timeToMinutes(sleepTime);
  const slots: FreeSlot[] = [];

  for (const day of WEEK_DAYS) {
    const occupied = blocks
      .filter(b => b.day_of_week === DAY_TO_DOW[day])
      .map(b => ({ start: timeToMinutes(b.start_time), end: timeToMinutes(b.end_time) }))
      .sort((a, b) => a.start - b.start);

    let cursor = wake;
    for (const block of occupied) {
      if (block.start > cursor) slots.push({ day, start: cursor, end: block.start });
      cursor = Math.max(cursor, block.end);
    }
    if (cursor < sleep) slots.push({ day, start: cursor, end: sleep });
  }

  return slots;
}

const PRIORITY_RANK: Record<string, number> = { alta: 0, media: 1, baixa: 2 };

/**
 * First-fit assignment: tasks are sorted by priority (alta first) then by size desc
 * so larger high-priority tasks claim early slots before smaller ones.
 * Returns a map of plan-task-id → { day, startTime }.
 * Tasks that don't fit in any slot are left unscheduled (not in the map).
 */
function assignTasksToSlots(
  tasks: WeeklyPlanTask[],
  slots: FreeSlot[],
): Map<string, { day: DayCode; startTime: string }> {
  const sorted = [...tasks].sort((a, b) => {
    const pr = (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1);
    return pr !== 0 ? pr : b.estimated_minutes - a.estimated_minutes;
  });

  const remaining = slots.map(s => ({ ...s })); // mutable copy to track consumed capacity
  const result = new Map<string, { day: DayCode; startTime: string }>();

  for (const task of sorted) {
    for (const slot of remaining) {
      if (slot.end - slot.start >= task.estimated_minutes) {
        result.set(task.id, { day: slot.day, startTime: minutesToTime(slot.start) });
        slot.start += task.estimated_minutes;
        break;
      }
    }
  }

  return result;
}

const CATEGORY_TO_INT: Record<string, number> = {
  Estudos: 0, Trabalho: 1, Casa: 2, Saúde: 3, Lazer: 4, Outros: 5,
};
const PRIORITY_TO_INT: Record<string, number> = { alta: 2, media: 1, baixa: 0 };

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** GET /api/weekly-plan/current */
export function useCurrentWeeklyPlan() {
  return useQuery<WeeklyPlan | null, Error>({
    queryKey: ['weekly_plan', 'current'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('weekly_plans')
        .select('*, weekly_plan_tasks(*)')
        .eq('user_id', user.id)
        .eq('week_start', getPlanWeekStart())
        .maybeSingle();

      if (error) throw error;
      return data as WeeklyPlan | null;
    },
  });
}

/** POST /api/weekly-plan — idempotent: returns existing plan if already created */
export function useCreateWeeklyPlan() {
  const qc = useQueryClient();
  return useMutation<WeeklyPlan, Error, { week_start: string }>({
    mutationFn: async ({ week_start }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data: existing } = await supabase
        .from('weekly_plans')
        .select('*, weekly_plan_tasks(*)')
        .eq('user_id', user.id)
        .eq('week_start', week_start)
        .maybeSingle();

      if (existing) return existing as WeeklyPlan;

      const { data, error } = await supabase
        .from('weekly_plans')
        .insert({ user_id: user.id, week_start })
        .select('*, weekly_plan_tasks(*)')
        .single();

      if (error) throw error;
      return data as WeeklyPlan;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['weekly_plan'] }),
  });
}

/** POST /api/weekly-plan/:id/tasks */
export function useAddWeeklyPlanTask() {
  const qc = useQueryClient();
  return useMutation<
    WeeklyPlanTask,
    Error,
    { planId: string; title: string; category: string; priority: string; estimated_minutes: number }
  >({
    mutationFn: async ({ planId, title, category, priority, estimated_minutes }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      if (!title.trim()) throw new Error('Título obrigatório');
      if (!category) throw new Error('Categoria obrigatória');
      if (!priority) throw new Error('Prioridade obrigatória');
      if (estimated_minutes <= 0) throw new Error('Duração deve ser maior que zero');

      const { data, error } = await supabase
        .from('weekly_plan_tasks')
        .insert({ weekly_plan_id: planId, title: title.trim(), category, priority, estimated_minutes })
        .select()
        .single();

      if (error) throw error;
      return data as WeeklyPlanTask;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['weekly_plan'] }),
  });
}

/** DELETE /api/weekly-plan/:planId/tasks/:taskId */
export function useDeleteWeeklyPlanTask() {
  const qc = useQueryClient();
  return useMutation<void, Error, { planId: string; taskId: string }>({
    mutationFn: async ({ taskId }) => {
      const { error } = await supabase
        .from('weekly_plan_tasks')
        .delete()
        .eq('id', taskId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['weekly_plan'] }),
  });
}

/**
 * POST /api/weekly-plan/:id/distribute
 *
 * 1. Fetch the plan's tasks, the user's fixed time_blocks, and sleep preferences.
 * 2. Compute free time slots for each day (wake → sleep, minus fixed blocks).
 * 3. Sort tasks by priority and assign them to the first slot that fits.
 * 4. Persist scheduled_day / scheduled_start on each weekly_plan_task.
 * 5. Create corresponding rows in the tasks table with the proper deadline.
 * 6. Back-link weekly_plan_tasks.task_id → newly created task ids.
 * 7. Mark the plan as completed.
 */
export function useDistributeWeeklyPlan() {
  const qc = useQueryClient();
  return useMutation<WeeklyPlan, Error, string>({
    mutationFn: async (planId) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Fetch plan with its tasks
      const { data: plan, error: planErr } = await supabase
        .from('weekly_plans')
        .select('*, weekly_plan_tasks(*)')
        .eq('id', planId)
        .eq('user_id', user.id)
        .single();
      if (planErr || !plan) throw planErr ?? new Error('Plano não encontrado');

      // Fetch fixed blocks and preferences in parallel
      const [{ data: blocks }, { data: prefsRow }] = await Promise.all([
        supabase
          .from('time_blocks')
          .select('day_of_week, start_time, end_time')
          .eq('user_id', user.id),
        supabase
          .from('user_preferences')
          .select('wake_time, sleep_time')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

      const wakeTime = (prefsRow?.wake_time as string) ?? '07:00';
      const sleepTime = (prefsRow?.sleep_time as string) ?? '23:00';

      const freeSlots = computeFreeSlots(blocks ?? [], wakeTime, sleepTime);
      const assignments = assignTasksToSlots(plan.weekly_plan_tasks as WeeklyPlanTask[], freeSlots);

      if (assignments.size > 0) {
        // Persist scheduled time on each plan task
        await Promise.all(
          Array.from(assignments.entries()).map(([taskId, { day, startTime }]) =>
            supabase
              .from('weekly_plan_tasks')
              .update({ scheduled_day: day, scheduled_start: startTime })
              .eq('id', taskId),
          ),
        );

        // Build the tasks to insert, keeping order aligned with assignments
        const planTasksById = new Map(
          (plan.weekly_plan_tasks as WeeklyPlanTask[]).map(t => [t.id, t]),
        );
        const assignedEntries = Array.from(assignments.entries());
        const toInsert = assignedEntries.map(([taskId, { day }]) => {
          const pt = planTasksById.get(taskId)!;
          return {
            title: pt.title,
            category: CATEGORY_TO_INT[pt.category] ?? 5,
            priority: PRIORITY_TO_INT[pt.priority] ?? 1,
            status: 0,
            estimated_minutes: pt.estimated_minutes,
            deadline: dayCodeToDate(plan.week_start as string, day),
            user_id: user.id,
          };
        });

        const { data: createdTasks, error: insertErr } = await supabase
          .from('tasks')
          .insert(toInsert)
          .select('id');
        if (insertErr) throw insertErr;

        // Back-link each plan task to its newly created real task
        if (createdTasks) {
          await Promise.all(
            assignedEntries.map(([planTaskId], i) =>
              supabase
                .from('weekly_plan_tasks')
                .update({ task_id: createdTasks[i].id })
                .eq('id', planTaskId),
            ),
          );
        }
      }

      // Mark plan as completed regardless of how many tasks were scheduled
      const { error: completeErr } = await supabase
        .from('weekly_plans')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', planId);
      if (completeErr) throw completeErr;

      // Return the fresh plan
      const { data: updated, error: fetchErr } = await supabase
        .from('weekly_plans')
        .select('*, weekly_plan_tasks(*)')
        .eq('id', planId)
        .single();
      if (fetchErr) throw fetchErr;
      return updated as WeeklyPlan;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['weekly_plan'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

/** GET /api/weekly-plan/settings */
export function usePlanningSettings() {
  return useQuery<PlanningSettings, Error>({
    queryKey: ['planning_settings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('user_planning_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return (data as PlanningSettings | null) ?? {
        user_id: user.id,
        sunday_planning_enabled: true,
        last_reminded_at: null,
      };
    },
  });
}

/** PUT /api/weekly-plan/settings */
export function useUpsertPlanningSettings() {
  const qc = useQueryClient();
  return useMutation<void, Error, { sunday_planning_enabled: boolean }>({
    mutationFn: async ({ sunday_planning_enabled }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { error } = await supabase
        .from('user_planning_settings')
        .upsert({ user_id: user.id, sunday_planning_enabled }, { onConflict: 'user_id' });

      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['planning_settings'] }),
  });
}
