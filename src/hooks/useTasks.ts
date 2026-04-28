import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Task, TaskStatus } from '../types';

type SupabaseTask = {
  id: string;
  title: string;
  description: string | null;
  category: number;
  priority: number;
  status: number;
  estimated_minutes: number;
  actual_minutes: number | null;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
};

function mapTask(row: SupabaseTask): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    category: row.category as Task['category'],
    priority: row.priority as Task['priority'],
    status: row.status as Task['status'],
    estimatedMinutes: row.estimated_minutes,
    actualMinutes: row.actual_minutes ?? undefined,
    deadline: row.deadline ?? '',
    dueDate: row.deadline ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type NewTaskPayload = {
  title: string;
  category: Task['category'];
  priority: Task['priority'];
  status?: TaskStatus;
  estimatedMinutes?: number;
  description?: string;
  dueDate?: string;
};

type UpdateTaskPayload = Partial<NewTaskPayload>;
type UpdateTaskVariables = { id: string; data: UpdateTaskPayload };

export function useTasks() {
  return useQuery<Task[], Error>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as SupabaseTask[]).map(mapTask);
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation<Task, Error, NewTaskPayload>({
    mutationFn: async (payload) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: payload.title,
          description: payload.description ?? null,
          category: payload.category,
          priority: payload.priority,
          status: payload.status ?? 0,
          estimated_minutes: payload.estimatedMinutes ?? 25,
          deadline: payload.dueDate ?? null,
          user_id: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return mapTask(data as SupabaseTask);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation<Task, Error, UpdateTaskVariables>({
    mutationFn: async ({ id, data: payload }) => {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (payload.title !== undefined) updateData.title = payload.title;
      if (payload.description !== undefined) updateData.description = payload.description ?? null;
      if (payload.category !== undefined) updateData.category = payload.category;
      if (payload.priority !== undefined) updateData.priority = payload.priority;
      if (payload.status !== undefined) updateData.status = payload.status;
      if (payload.estimatedMinutes !== undefined) updateData.estimated_minutes = payload.estimatedMinutes;
      if ('dueDate' in payload) updateData.deadline = payload.dueDate ?? null;

      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return mapTask(data as SupabaseTask);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export default useTasks;
