import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { TaskCategory, TaskStatus, TaskPriority } from '@/types';
import type { Task } from '@/types';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';

interface CategoryConfig {
  label: string;
  emoji: string;
  header: string;
  border: string;
  badge: string;
}

const CATEGORIES: Record<number, CategoryConfig> = {
  [TaskCategory.STUDY]:   { label: 'Estudos',   emoji: '📚', header: 'bg-purple-500', border: 'border-purple-200 dark:border-purple-800', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  [TaskCategory.WORK]:    { label: 'Trabalho',   emoji: '💼', header: 'bg-blue-500',   border: 'border-blue-200 dark:border-blue-800',     badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  [TaskCategory.HOME]:    { label: 'Casa',       emoji: '🏠', header: 'bg-green-500',  border: 'border-green-200 dark:border-green-800',   badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  [TaskCategory.HEALTH]:  { label: 'Saúde',      emoji: '💪', header: 'bg-pink-500',   border: 'border-pink-200 dark:border-pink-800',     badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' },
  [TaskCategory.LEISURE]: { label: 'Lazer',      emoji: '🎮', header: 'bg-yellow-500', border: 'border-yellow-200 dark:border-yellow-800', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  [TaskCategory.OTHER]:   { label: 'Outros',     emoji: '📦', header: 'bg-gray-500',   border: 'border-gray-200 dark:border-gray-700',     badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
};

const PRIORITY_COLORS: Record<number, string> = {
  0: 'text-green-500', 1: 'text-amber-500', 2: 'text-red-500',
};
const PRIORITY_LABELS: Record<number, string> = { 0: 'Baixa', 1: 'Média', 2: 'Alta' };

export default function ByCategory() {
  const { data: serverTasks = [], isLoading } = useTasks();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  useEffect(() => {
    setTasks(serverTasks);
  }, [serverTasks]);

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
      toast.success('🎉 +10 XP! Tarefa concluída!', { duration: 2500 });
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
      {
        title: newTitle.trim(),
        category: category as TaskCategory,
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.PENDING,
        estimatedMinutes: 25,
      },
      {
        onSuccess: () => toast.success('Tarefa adicionada!'),
        onError: () => toast.error('Erro ao adicionar tarefa'),
      }
    );
    setNewTitle('');
    setAddingTo(null);
  }, [newTitle, createTask]);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">

            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Tarefas por Categoria</h1>
              <Badge variant="secondary">{tasks.filter((t) => t.status !== TaskStatus.COMPLETED).length} pendentes</Badge>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {grouped.map(({ category, cfg, pending, done }) => (
                  <Card key={category} className={cn('border shadow-md overflow-hidden', cfg.border)}>
                    <CardHeader className={cn('py-3 px-4', cfg.header)}>
                      <CardTitle className="text-white text-sm font-semibold flex items-center justify-between">
                        <span>{cfg.emoji} {cfg.label}</span>
                        <Badge className="bg-white/20 text-white text-xs">{pending.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 space-y-2 max-h-80 overflow-y-auto">
                      {pending.length === 0 && done.length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-4">Nenhuma tarefa ainda</p>
                      )}
                      {pending.map((task) => (
                        <div key={task.id}
                          className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 group hover:bg-gray-100 dark:hover:bg-gray-700">
                          <button onClick={() => handleToggle(task.id, true)} className="shrink-0">
                            <Circle className="h-4 w-4 text-gray-400 hover:text-green-500 transition-colors" />
                          </button>
                          <span className="flex-1 text-sm text-gray-800 dark:text-white truncate">
                            {task.title || '(sem título)'}
                          </span>
                          <span className={cn('text-[10px] font-bold shrink-0', PRIORITY_COLORS[task.priority])}>
                            {PRIORITY_LABELS[task.priority]}
                          </span>
                          <button onClick={() => setTaskToDelete(task.id)}
                            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="h-3.5 w-3.5 text-red-400 hover:text-red-600" />
                          </button>
                        </div>
                      ))}
                      {done.length > 0 && (
                        <div className="pt-1 border-t border-gray-100 dark:border-gray-700 space-y-1">
                          {done.slice(0, 3).map((task) => (
                            <div key={task.id}
                              className="flex items-center gap-2 p-1.5 opacity-50">
                              <button onClick={() => handleToggle(task.id, false)} className="shrink-0">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              </button>
                              <span className="flex-1 text-xs text-gray-500 truncate line-through">
                                {task.title || '(sem título)'}
                              </span>
                            </div>
                          ))}
                          {done.length > 3 && (
                            <p className="text-[10px] text-gray-400 text-center">+{done.length - 3} concluídas</p>
                          )}
                        </div>
                      )}

                      {addingTo === category ? (
                        <div className="flex gap-1 pt-1">
                          <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAdd(category);
                              if (e.key === 'Escape') { setAddingTo(null); setNewTitle(''); }
                            }}
                            placeholder="Nome da tarefa..."
                            className="h-7 text-xs"
                            autoFocus
                          />
                          <Button size="sm" className="h-7 px-2 text-xs" onClick={() => handleAdd(category)}>OK</Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" className="w-full h-7 text-xs text-gray-400 hover:text-gray-600"
                          onClick={() => { setAddingTo(category); setNewTitle(''); }}>
                          <Plus className="h-3.5 w-3.5 mr-1" /> Nova tarefa
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

          </div>
        </div>
      </SidebarInset>

      <ConfirmDialog
        open={!!taskToDelete}
        title="Excluir tarefa"
        message="Tem certeza que deseja excluir essa tarefa?"
        confirmLabel="Excluir"
        onConfirm={() => { if (taskToDelete) handleDelete(taskToDelete); setTaskToDelete(null); }}
        onCancel={() => setTaskToDelete(null)}
      />
    </SidebarProvider>
  );
}
