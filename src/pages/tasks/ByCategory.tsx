import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  BookOpen, Briefcase, Home, Heart, Gamepad2, MoreHorizontal,
  Plus, Trash2, CheckCircle2, Circle, Loader2,
} from 'lucide-react';
import { TaskCategory, TaskStatus, TaskPriority } from '@/types';
import type { Task } from '@/types';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';

interface CategoryConfig {
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  border: string;
  iconColor: string;
  dot: string;
  badge: string;
}

const CATEGORIES: Record<number, CategoryConfig> = {
  [TaskCategory.STUDY]:   { label: 'Estudos',  Icon: BookOpen,       border: 'border-indigo-500/20', iconColor: 'text-indigo-400', dot: 'bg-indigo-400', badge: 'bg-indigo-500/15 text-indigo-300' },
  [TaskCategory.WORK]:    { label: 'Trabalho', Icon: Briefcase,      border: 'border-blue-500/20',   iconColor: 'text-blue-400',   dot: 'bg-blue-400',   badge: 'bg-blue-500/15 text-blue-300' },
  [TaskCategory.HOME]:    { label: 'Casa',     Icon: Home,           border: 'border-green-500/20',  iconColor: 'text-green-400',  dot: 'bg-green-400',  badge: 'bg-green-500/15 text-green-300' },
  [TaskCategory.HEALTH]:  { label: 'Saúde',    Icon: Heart,          border: 'border-rose-500/20',   iconColor: 'text-rose-400',   dot: 'bg-rose-400',   badge: 'bg-rose-500/15 text-rose-300' },
  [TaskCategory.LEISURE]: { label: 'Lazer',    Icon: Gamepad2,       border: 'border-purple-500/20', iconColor: 'text-purple-400', dot: 'bg-purple-400', badge: 'bg-purple-500/15 text-purple-300' },
  [TaskCategory.OTHER]:   { label: 'Outros',   Icon: MoreHorizontal, border: 'border-base-300',      iconColor: 'text-base-content/50', dot: 'bg-base-content/30', badge: 'bg-base-300 text-base-content/60' },
};

export default function ByCategory() {
  const { data: serverTasks = [], isLoading } = useTasks();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  useEffect(() => { setTasks(serverTasks); }, [serverTasks]);

  const grouped = useMemo(() =>
    Object.entries(CATEGORIES).map(([cat, cfg]) => ({
      category: Number(cat),
      cfg,
      pending: tasks.filter((t) => t.category === Number(cat) && t.status !== TaskStatus.COMPLETED),
      done: tasks.filter((t) => t.category === Number(cat) && t.status === TaskStatus.COMPLETED),
    })),
    [tasks]
  );

  const handleToggle = useCallback((id: string, completed: boolean) => {
    const newStatus = completed ? TaskStatus.COMPLETED : TaskStatus.PENDING;
    setTasks((prev) => prev.map((t) =>
      t.id === id ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t
    ));
    updateTask.mutate({ id, data: { status: newStatus } });
    if (completed) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      toast.success('+10 XP! Tarefa concluída!');
    }
  }, [updateTask]);

  const handleDelete = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    deleteTask.mutate(id, {
      onError: () => {
        setTasks(serverTasks);
        toast.error('Erro ao excluir tarefa');
      },
    });
  }, [deleteTask, serverTasks]);

  const handleAdd = useCallback((category: number) => {
    if (!newTitle.trim()) return;
    createTask.mutate(
      { title: newTitle.trim(), category: category as TaskCategory, priority: TaskPriority.MEDIUM, status: TaskStatus.PENDING, estimatedMinutes: 25 },
      {
        onSuccess: () => toast.success('Tarefa adicionada!'),
        onError: () => toast.error('Erro ao adicionar tarefa'),
      }
    );
    setNewTitle(''); setAddingTo(null);
  }, [newTitle, createTask]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-base-content/30" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-base-content">Por Categoria</h1>
        <span className="text-xs bg-base-300 text-base-content/60 px-2 py-0.5 rounded-full">
          {tasks.filter((t) => t.status !== TaskStatus.COMPLETED).length} pendentes
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {grouped.map(({ category, cfg, pending, done }) => (
          <div key={category} className={cn('rounded-xl border bg-base-200 overflow-hidden', cfg.border)}>
            {/* Card header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-base-300">
              <div className="flex items-center gap-2">
                <div className={cn('w-2 h-2 rounded-full flex-shrink-0', cfg.dot)} />
                <cfg.Icon size={14} className={cfg.iconColor} />
                <span className="text-sm font-semibold text-base-content">{cfg.label}</span>
              </div>
              <span className="text-xs text-base-content/40 bg-base-300 px-2 py-0.5 rounded-full">
                {pending.length}
              </span>
            </div>

            {/* Tasks */}
            <div className="p-3 space-y-1.5 max-h-80 overflow-y-auto">
              {pending.length === 0 && done.length === 0 && (
                <p className="text-xs text-base-content/30 text-center py-4">Nenhuma tarefa ainda</p>
              )}

              {pending.map((task) => (
                <div key={task.id}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded-lg bg-base-300/40 group hover:bg-base-300 transition-colors',
                    task.priority === TaskPriority.HIGH   && 'border-l-2 border-l-red-500',
                    task.priority === TaskPriority.MEDIUM && 'border-l-2 border-l-amber-400',
                  )}>
                  <button onClick={() => handleToggle(task.id, true)} className="shrink-0">
                    <Circle className="h-4 w-4 text-base-content/30 hover:text-primary transition-colors" />
                  </button>
                  <span className={cn(
                    'flex-1 text-sm text-base-content truncate',
                    task.priority === TaskPriority.HIGH && 'text-red-300',
                  )}>
                    {task.title || '(sem título)'}
                  </span>
                  <button onClick={() => setTaskToDelete(task.id)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-3.5 w-3.5 text-error/60 hover:text-error" />
                  </button>
                </div>
              ))}

              {done.length > 0 && (
                <div className="pt-1 border-t border-base-300 space-y-1">
                  {done.slice(0, 3).map((task) => (
                    <div key={task.id} className="flex items-center gap-2 p-1.5 opacity-40">
                      <button onClick={() => handleToggle(task.id, false)} className="shrink-0">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      </button>
                      <span className="flex-1 text-xs text-base-content truncate line-through">
                        {task.title || '(sem título)'}
                      </span>
                    </div>
                  ))}
                  {done.length > 3 && (
                    <p className="text-[10px] text-base-content/30 text-center">+{done.length - 3} concluídas</p>
                  )}
                </div>
              )}

              {addingTo === category ? (
                <div className="flex gap-1 pt-1">
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAdd(category);
                      if (e.key === 'Escape') { setAddingTo(null); setNewTitle(''); }
                    }}
                    placeholder="Nome da tarefa..."
                    className="flex-1 h-7 text-xs bg-base-300 rounded px-2 focus:outline-none text-base-content"
                    autoFocus
                  />
                  <button className="btn btn-primary btn-xs h-7" onClick={() => handleAdd(category)}>OK</button>
                </div>
              ) : (
                <button
                  className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs text-base-content/40 hover:text-base-content transition-colors rounded-lg hover:bg-base-300"
                  onClick={() => { setAddingTo(category); setNewTitle(''); }}>
                  <Plus className="h-3.5 w-3.5" /> Nova tarefa
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!taskToDelete}
        title="Excluir tarefa"
        message="Tem certeza que deseja excluir essa tarefa?"
        confirmLabel="Excluir"
        onConfirm={() => { if (taskToDelete) handleDelete(taskToDelete); setTaskToDelete(null); }}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );
}
