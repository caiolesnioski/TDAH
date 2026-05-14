import { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Book,
  Briefcase,
  Home,
  Heart,
  Gamepad2,
  Package,
  Plus,
  Trash2,
  ListTodo,
  ClipboardList,
  Loader2,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { TaskCategory, TaskPriority, TaskStatus } from '@/types';
import type { Task } from '@/types';
import { cn } from '@/lib/utils';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { useFocusModalStore } from '@/store/focusModalStore';

const CATEGORY_CONFIG = {
  [TaskCategory.STUDY]: {
    label: 'Estudos',
    icon: Book,
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  },
  [TaskCategory.WORK]: {
    label: 'Trabalho',
    icon: Briefcase,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  },
  [TaskCategory.HOME]: {
    label: 'Casa',
    icon: Home,
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  },
  [TaskCategory.HEALTH]: {
    label: 'Saúde',
    icon: Heart,
    color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  },
  [TaskCategory.LEISURE]: {
    label: 'Lazer',
    icon: Gamepad2,
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  },
  [TaskCategory.OTHER]: {
    label: 'Outro',
    icon: Package,
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300',
  },
};

const PRIORITY_CONFIG = {
  [TaskPriority.HIGH]: { label: 'Alta', color: 'bg-red-500 hover:bg-red-600 text-white' },
  [TaskPriority.MEDIUM]: { label: 'Média', color: 'bg-amber-500 hover:bg-amber-600 text-white' },
  [TaskPriority.LOW]: { label: 'Baixa', color: 'bg-green-500 hover:bg-green-600 text-white' },
};

export default function TasksNotionView() {
  const { data: serverTasks = [], isLoading } = useTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { openModal } = useFocusModalStore();

  // Local state for fast UI — synced from server
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    setTasks(serverTasks);
  }, [serverTasks]);

  const today = new Date().toISOString().substring(0, 10);
  const tomorrowD = new Date();
  tomorrowD.setDate(tomorrowD.getDate() + 1);
  const tomorrow = tomorrowD.toISOString().substring(0, 10);

  // Immediate update (for selects, checkboxes, number inputs)
  const updateImmediate = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    updateTask.mutate({ id, data: updates });
  }, [updateTask]);

  // Debounced update (for text inputs — avoids network call per keystroke)
  const updateDebounced = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    clearTimeout(debounceTimers.current[id]);
    debounceTimers.current[id] = setTimeout(() => {
      updateTask.mutate({ id, data: updates });
    }, 700);
  }, [updateTask]);

  const handleAddTask = useCallback(() => {
    createTask.mutate(
      { title: '', category: TaskCategory.OTHER, priority: TaskPriority.MEDIUM, status: TaskStatus.PENDING, estimatedMinutes: 25 },
      { onError: () => toast.error('Erro ao criar tarefa') }
    );
  }, [createTask]);

  const handleDeleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    deleteTask.mutate(id, { onError: () => toast.error('Erro ao excluir tarefa') });
  }, [deleteTask]);

  const handleToggleStatus = useCallback((id: string, completed: boolean) => {
    const status = completed ? TaskStatus.COMPLETED : TaskStatus.PENDING;
    updateImmediate(id, { status });
    if (completed) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success('🎉 +10 XP! Tarefa concluída!', { duration: 3000 });
    }
  }, [updateImmediate]);

  return (
    <>
      <SidebarProvider
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 72)',
            '--header-height': 'calc(var(--spacing) * 12)',
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 min-h-screen">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <ListTodo className="h-7 w-7 text-focus-blue-500" />
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Minhas Tarefas</h1>
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {tasks.length} {tasks.length === 1 ? 'tarefa' : 'tarefas'}
                  </Badge>
                </div>
                <Button
                  onClick={handleAddTask}
                  disabled={createTask.isPending}
                  className="bg-gradient-to-r from-focus-blue-500 to-calm-purple-500 hover:from-focus-blue-600 hover:to-calm-purple-600"
                >
                  {createTask.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Nova Tarefa
                </Button>
              </div>

              {/* Lista */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="hidden md:grid md:grid-cols-[48px_1fr_130px_90px_120px_80px_48px_48px] gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-sm font-semibold text-muted-foreground">
                  <div />
                  <div>Título</div>
                  <div>Categoria</div>
                  <div>Prioridade</div>
                  <div>Prazo</div>
                  <div>Duração</div>
                  <div />
                  <div />
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>Carregando tarefas...</span>
                    </div>
                  ) : tasks.length === 0 ? (
                    <div className="py-8">
                      <EmptyState
                        icon={<ClipboardList className="h-12 w-12" />}
                        title="Nenhuma tarefa ainda!"
                        description="Que tal começar com uma pequena?"
                        action={{ label: 'Criar Primeira Tarefa', onClick: handleAddTask }}
                      />
                    </div>
                  ) : (
                    tasks.map((task) => {
                      const isCompleted = task.status === TaskStatus.COMPLETED;
                      const categoryConfig = CATEGORY_CONFIG[task.category];
                      const priorityConfig = PRIORITY_CONFIG[task.priority];
                      const CategoryIcon = categoryConfig.icon;
                      const isOverdue = !isCompleted && task.dueDate && task.dueDate < today;
                      const isDueToday = !isCompleted && task.dueDate === today;
                      const isDueTomorrow = !isCompleted && task.dueDate === tomorrow;

                      return (
                        <div
                          key={task.id}
                          className={cn(
                            'grid grid-cols-1 md:grid-cols-[48px_1fr_130px_90px_120px_80px_48px_48px] gap-2 px-4 py-3 items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group',
                            isCompleted && 'bg-gray-50/50 dark:bg-gray-800/50',
                            isOverdue && 'border-l-4 border-red-400'
                          )}
                        >
                          {/* Checkbox */}
                          <div className="flex items-center justify-center">
                            <Checkbox
                              checked={isCompleted}
                              onCheckedChange={(checked) => handleToggleStatus(task.id, checked === true)}
                              className="h-6 w-6 rounded-md border-2 border-gray-300 dark:border-gray-600"
                            />
                          </div>

                          {/* Título */}
                          <div className="flex items-center gap-2">
                            <Input
                              value={task.title}
                              onChange={(e) => updateDebounced(task.id, { title: e.target.value })}
                              placeholder="Digite o título da tarefa..."
                              className={cn(
                                'border-0 bg-transparent focus:ring-2 focus:ring-focus-blue-500 rounded-md px-2 py-1 text-gray-800 dark:text-white placeholder:text-gray-400',
                                isCompleted && 'line-through opacity-50 text-gray-500'
                              )}
                            />
                            {!isCompleted && (
                              <button
                                onClick={() => openModal(task)}
                                title="Iniciar foco"
                                style={{ borderColor: '#6366F1', color: '#6366F1' }}
                                className="shrink-0 flex items-center gap-1 px-2 py-1 text-xs rounded border hover:opacity-80 transition-opacity opacity-0 group-hover:opacity-100"
                              >
                                ▶ Iniciar
                              </button>
                            )}
                          </div>

                          {/* Categoria */}
                          <div className="flex items-center">
                            <Select
                              value={String(task.category)}
                              onValueChange={(value) => updateImmediate(task.id, { category: Number(value) as TaskCategory })}
                            >
                              <SelectTrigger className={cn('w-full h-8 border-0 text-sm', categoryConfig.color)}>
                                <div className="flex items-center gap-2">
                                  <CategoryIcon className="h-4 w-4" />
                                  <SelectValue />
                                </div>
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                                  const Icon = config.icon;
                                  return (
                                    <SelectItem key={key} value={key}>
                                      <div className="flex items-center gap-2">
                                        <Icon className="h-4 w-4" />
                                        {config.label}
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Prioridade */}
                          <div className="flex items-center">
                            <Select
                              value={String(task.priority)}
                              onValueChange={(value) => updateImmediate(task.id, { priority: Number(value) as TaskPriority })}
                            >
                              <SelectTrigger className="w-full h-8 border-0">
                                <Badge className={cn('text-xs font-medium px-2 py-0.5', priorityConfig.color)}>
                                  {priorityConfig.label}
                                </Badge>
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                                  <SelectItem key={key} value={key}>
                                    <Badge className={cn('text-xs font-medium', config.color)}>{config.label}</Badge>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Prazo */}
                          <div className="flex items-center">
                            <div className="relative w-full">
                              <input
                                type="date"
                                value={task.dueDate ?? ''}
                                onChange={(e) => updateImmediate(task.id, { dueDate: e.target.value || undefined })}
                                className={cn(
                                  'w-full h-8 rounded-md text-xs px-2 bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-focus-blue-500',
                                  isOverdue && 'text-red-500 font-medium',
                                  isDueToday && 'text-amber-600 font-medium',
                                  isDueTomorrow && 'text-blue-600',
                                  !task.dueDate && 'text-gray-400'
                                )}
                              />
                              {(isOverdue || isDueToday) && (
                                <span className={cn(
                                  'absolute -top-2 right-0 text-[9px] font-bold px-1 rounded',
                                  isOverdue ? 'text-red-500' : 'text-amber-600'
                                )}>
                                  {isOverdue ? 'atrasada' : 'hoje'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Minutos estimados */}
                          <div className="flex items-center">
                            <Input
                              type="number"
                              min={1}
                              max={999}
                              value={task.estimatedMinutes}
                              onChange={(e) => updateImmediate(task.id, { estimatedMinutes: parseInt(e.target.value, 10) || 25 })}
                              className="w-full h-8 border-0 bg-gray-100 dark:bg-gray-700 focus:ring-2 focus:ring-focus-blue-500 rounded-md text-center text-sm"
                            />
                          </div>

                          <div />

                          {/* Delete */}
                          <div className="flex items-center justify-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setTaskToDelete(task.id)}
                              className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Excluir tarefa"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Resumo */}
              {tasks.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Pendentes</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">
                      {tasks.filter((t) => t.status === TaskStatus.PENDING).length}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Concluídas</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {tasks.filter((t) => t.status === TaskStatus.COMPLETED).length}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tempo Estimado</p>
                    <p className="text-2xl font-bold text-focus-blue-600 dark:text-focus-blue-400">
                      {tasks.filter((t) => t.status !== TaskStatus.COMPLETED).reduce((acc, t) => acc + t.estimatedMinutes, 0)} min
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Alta Prioridade</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {tasks.filter((t) => t.priority === TaskPriority.HIGH && t.status !== TaskStatus.COMPLETED).length}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      <ConfirmDialog
        open={!!taskToDelete}
        title="Excluir tarefa"
        message="Tem certeza que deseja excluir essa tarefa? Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={() => { if (taskToDelete) handleDeleteTask(taskToDelete); setTaskToDelete(null); }}
        onCancel={() => setTaskToDelete(null)}
      />
    </>
  );
}
