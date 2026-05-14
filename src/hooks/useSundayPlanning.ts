import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { WeeklyPlan, PlanningSettings } from './useWeeklyPlan';

function getPlanWeekStart(): string {
  const today = new Date();
  const dow = today.getDay();
  const d = new Date(today);
  if (dow === 0) {
    d.setDate(d.getDate() + 1); // Sunday → next Monday (the week being planned)
  } else {
    d.setDate(d.getDate() - (dow - 1));
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export interface SundayPlanningState {
  isSunday: boolean;
  needsPlanning: boolean;
  planningEnabled: boolean;
  currentPlan: WeeklyPlan | null;
  isLoading: boolean;
}

export function useSundayPlanning(): SundayPlanningState {
  const isSunday = useMemo(() => new Date().getDay() === 0, []);

  const { data: currentPlan, isLoading: planLoading } = useQuery<WeeklyPlan | null, Error>({
    queryKey: ['weekly_plan', 'current'],
    enabled: isSunday,
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

  const { data: settings, isLoading: settingsLoading } = useQuery<PlanningSettings, Error>({
    queryKey: ['planning_settings'],
    enabled: isSunday,
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

  const planningEnabled = settings?.sunday_planning_enabled ?? true;
  const isLoading = isSunday && (planLoading || settingsLoading);

  const needsPlanning = useMemo(() => {
    if (!isSunday || !planningEnabled || isLoading) return false;
    return !currentPlan || !currentPlan.completed_at;
  }, [isSunday, planningEnabled, isLoading, currentPlan]);

  return {
    isSunday,
    needsPlanning,
    planningEnabled,
    currentPlan: currentPlan ?? null,
    isLoading,
  };
}
