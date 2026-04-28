import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { TimeBlock, TimeBlockType } from '../types';

type SupabaseTimeBlock = {
  id: string;
  user_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  type: string;
  title: string;
  created_at: string;
  updated_at: string;
};

function mapBlock(row: SupabaseTimeBlock): TimeBlock {
  return {
    id: row.id,
    dayOfWeek: row.day_of_week as TimeBlock['dayOfWeek'],
    startTime: row.start_time,
    endTime: row.end_time,
    type: row.type as TimeBlockType,
    title: row.title,
    isRecurring: true,
  };
}

type NewBlockPayload = {
  title: string;
  type: TimeBlockType;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export function useTimeBlocks() {
  return useQuery<TimeBlock[], Error>({
    queryKey: ['time_blocks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_blocks')
        .select('*')
        .order('day_of_week', { ascending: true });
      if (error) throw error;
      return (data as SupabaseTimeBlock[]).map(mapBlock);
    },
  });
}

export function useCreateTimeBlock() {
  const queryClient = useQueryClient();
  return useMutation<TimeBlock, Error, NewBlockPayload>({
    mutationFn: async (payload) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      const { data, error } = await supabase
        .from('time_blocks')
        .insert({
          title: payload.title,
          type: payload.type,
          day_of_week: payload.dayOfWeek,
          start_time: payload.startTime,
          end_time: payload.endTime,
          user_id: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return mapBlock(data as SupabaseTimeBlock);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['time_blocks'] }),
  });
}

export function useDeleteTimeBlock() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase.from('time_blocks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['time_blocks'] }),
  });
}

export function useDeleteAllTimeBlocks() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from('time_blocks').delete().eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['time_blocks'] }),
  });
}
