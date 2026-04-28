import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
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
  Timer,
  ListTodo,
} from 'lucide-react';
import { TaskCategory, TaskPriority, TaskStatus } from '@/types';
import type { Task } from '@/types';
import { cn } from '@/lib/utils';

// Configuração de categorias com ícones e cores
const CATEGORY_CONFIG = {
  [TaskCategory.STUDY]: {
    label: 'Estudos',
    icon: Book,
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    badgeColor: 'bg-amber-500',
  },
  [TaskCategory.WORK]: {
    label: 'Trabalho',
    icon: Briefcase,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    badgeColor: 'bg-blue-500',
  },
  [TaskCategory.HOME]: {
    label: 'Casa',
    icon: Home,
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    badgeColor: 'bg-green-500',
  },
  [TaskCategory.HEALTH]: {
    label: 'Saúde',
    icon: Heart,
    color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    badgeColor: 'bg-pink-500',
  },
  [TaskCategory.LEISURE]: {
    label: 'Lazer',
    icon: Gamepad2,
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    badgeColor: 'bg-purple-500',
  },
  [TaskCategory.OTHER]: {
    label: 'Outro',
    icon: Package,
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300',
    badgeColor: 'bg-gray-500',
  },
};

// Configuração de prioridades
const PRIORITY_CONFIG = {
  [TaskPriority.HIGH]: {
    label: 'Alta',
    color: 'bg-red-500 hover:bg-red-600 text-white',
  },
  [TaskPriority.MEDIUM]: {
    label: 'Média',
    color: 'bg-amber-500 hover:bg-amber-600 text-white',
  },
  [TaskPriority.LOW]: {
    label: 'Baixa',
    color: 'bg-green-500 hover:bg-green-600 text-white',
  },
};

const generateId = () => Math.random().toString(36).substring(2, 11);

// Carregar tarefas do localStorage
const loadTasks = (): Task[] => {
  try {
    const saved = localStorage.getItem('tasks');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // ignore
  }
  return [];
};

// Salvar tarefas no localStorage
const saveTasks = (tasks: Task[]) => {
  localStorage.setItem('tasks', JSON.stringify(tasks));
};

// Criar tarefa vazia
const createEmptyTask = (): Task => ({
  id: generateId(),
  title: '',
  category: TaskCategory.OTHER,
  priority: TaskPriority.MEDIUM,
  status: TaskStatus.PENDING,
  estimatedMinutes: 25,
  deadline: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export default function TasksNotionView() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  // Salvar automaticamente quando as tarefas mudam
  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  // Adicionar nova tarefa no topo
  const handleAddTask = useCallback(() => {
    const newTask = createEmptyTask();
    setTasks((prev) => [newTask, ...prev]);
  }, []);

  // Atualizar tarefa
  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? { ...task, ...updates, updatedAt: new Date().toISOString() }
          : task
      )
    );
  }, []);

  // Deletar tarefa
  const handleDeleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }, []);

  // Toggle status (checkbox)
  const handleToggleStatus = useCallback((id: string, completed: boolean) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              status: completed ? TaskStatus.COMPLETED : TaskStatus.PENDING,
              updatedAt: new Date().toISOString(),
            }
          : task
      )
    );
    if (completed) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success('🎉 +10 XP! Tarefa concluída!', { duration: 3000 });
    }
  }, []);

  const today = new Date().toISOString().substring(0, 10);
  const tomorrowD = new Date();
  tomorrowD.setDate(tomorrowD.getDate() + 1);
  const tomorrow = tomorrowD.toISOString().substring(0, 10);

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
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Minhas Tarefas
                </h1>
                <Badge
                  variant="secondary"
                  className="bg-focus-blue-100 text-focus-blue-700 dark:bg-focus-blue-900/30 dark:text-focus-blue-300 text-sm px-3 py-1"
                >
                  {tasks.length} {tasks.length === 1 ? 'tarefa' : 'tarefas'}
                </Badge>
              </div>

              <Button
                onClick={handleAddTask}
                className="bg-gradient-to-r from-focus-blue-500 to-calm-purple-500 hover:from-focus-blue-600 hover:to-calm-purple-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
            </div>

            {/* Lista de Tarefas */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              {/* Cabeçalho da tabela */}
              <div className="hidden md:grid md:grid-cols-[48px_1fr_130px_90px_120px_80px_48px_48px] gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <div></div>
                <div>Título</div>
                <div>Categoria</div>
                <div>Prioridade</div>
                <div>Prazo</div>
                <div>Min</div>
                <div></div>
                <div></div>
              </div>

              {/* Linhas de tarefas */}
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-4">
                    <div className="text-6xl select-none">📝</div>
                    <div className="text-center space-y-1">
                      <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        Nenhuma tarefa ainda!
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        Que tal começar com uma pequena? 🚀
                      </p>
                    </div>
                    <Button
                      onClick={handleAddTask}
                      className="gap-2 bg-gradient-to-r from-focus-blue-500 to-calm-purple-500 hover:from-focus-blue-600 hover:to-calm-purple-600"
                    >
                      <Plus className="h-4 w-4" />
                      Criar Primeira Tarefa
                    </Button>
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
                          'grid grid-cols-1 md:grid-cols-[48px_1fr_130px_90px_120px_80px_48px_48px] gap-2 md:gap-2 px-4 py-3 items-center hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group',
                          isCompleted && 'bg-gray-50/50 dark:bg-gray-800/50',
                          isOverdue && 'border-l-4 border-red-400'
                        )}
                      >
                        {/* Checkbox */}
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={isCompleted}
                            onCheckedChange={(checked) =>
                              handleToggleStatus(task.id, checked === true)
                            }
                            className="h-6 w-6 rounded-md border-2 border-gray-300 dark:border-gray-600 data-[state=checked]:bg-focus-blue-500 data-[state=checked]:border-focus-blue-500"
                          />
                        </div>

                        {/* Título */}
                        <div className="flex items-center gap-2">
                          <Input
                            value={task.title}
                            onChange={(e) =>
                              updateTask(task.id, { title: e.target.value })
                            }
                            placeholder="Digite o título da tarefa..."
                            className={cn(
                              'border-0 bg-transparent focus:ring-2 focus:ring-focus-blue-500 rounded-md px-2 py-1 text-gray-800 dark:text-white placeholder:text-gray-400',
                              isCompleted &&
                                'line-through opacity-50 text-gray-500'
                            )}
                          />
                        </div>

                        {/* Categoria com ícone */}
                        <div className="flex items-center">
                          <Select
                            value={String(task.category)}
                            onValueChange={(value) =>
                              updateTask(task.id, {
                                category: Number(value) as TaskCategory,
                              })
                            }
                          >
                            <SelectTrigger
                              className={cn(
                                'w-full h-8 border-0 text-sm',
                                categoryConfig.color
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <CategoryIcon className="h-4 w-4" />
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(CATEGORY_CONFIG).map(
                                ([key, config]) => {
                                  const Icon = config.icon;
                                  return (
                                    <SelectItem key={key} value={key}>
                                      <div className="flex items-center gap-2">
                                        <Icon className="h-4 w-4" />
                                        {config.label}
                                      </div>
                                    </SelectItem>
                                  );
                                }
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Prioridade */}
                        <div className="flex items-center">
                          <Select
                            value={String(task.priority)}
                            onValueChange={(value) =>
                              updateTask(task.id, {
                                priority: Number(value) as TaskPriority,
                              })
                            }
                          >
                            <SelectTrigger className="w-full h-8 border-0">
                              <Badge
                                className={cn(
                                  'text-xs font-medium px-2 py-0.5',
                                  priorityConfig.color
                                )}
                              >
                                {priorityConfig.label}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(PRIORITY_CONFIG).map(
                                ([key, config]) => (
                                  <SelectItem key={key} value={key}>
                                    <Badge
                                      className={cn(
                                        'text-xs font-medium',
                                        config.color
                                      )}
                                    >
                                      {config.label}
                                    </Badge>
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Prazo */}
                        <div className="flex items-center">
                          <div className="relative w-full">
                            <input
                              type="date"
                              value={task.dueDate ?? ''}
                              onChange={(e) =>
                                updateTask(task.id, {
                                  dueDate: e.target.value || undefined,
                                })
                              }
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
                            onChange={(e) =>
                              updateTask(task.id, {
                                estimatedMinutes:
                                  parseInt(e.target.value, 10) || 0,
                              })
                            }
                            className="w-full h-8 border-0 bg-gray-100 dark:bg-gray-700 focus:ring-2 focus:ring-focus-blue-500 rounded-md text-center text-sm"
                          />
                        </div>

                        {/* Botão Timer (só visível se categoria = Estudos) */}
                        <div className="flex items-center justify-center">
                          {task.category === TaskCategory.STUDY && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                              title="Iniciar Timer Pomodoro"
                            >
                              <Timer className="h-5 w-5" />
                            </Button>
                          )}
                        </div>

                        {/* Botão Delete */}
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Pendentes
                  </p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">
                    {
                      tasks.filter((t) => t.status === TaskStatus.PENDING)
                        .length
                    }
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Concluídas
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {
                      tasks.filter((t) => t.status === TaskStatus.COMPLETED)
                        .length
                    }
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Tempo Estimado
                  </p>
                  <p className="text-2xl font-bold text-focus-blue-600 dark:text-focus-blue-400">
                    {tasks
                      .filter((t) => t.status !== TaskStatus.COMPLETED)
                      .reduce((acc, t) => acc + t.estimatedMinutes, 0)}{' '}
                    min
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Alta Prioridade
                  </p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {
                      tasks.filter(
                        (t) =>
                          t.priority === TaskPriority.HIGH &&
                          t.status !== TaskStatus.COMPLETED
                      ).length
                    }
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
      onConfirm={() => {
        if (taskToDelete) handleDeleteTask(taskToDelete);
        setTaskToDelete(null);
      }}
      onCancel={() => setTaskToDelete(null)}
    />
    </>
  );
}
