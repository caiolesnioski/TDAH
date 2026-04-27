import { useState, useMemo, useCallback } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { TaskCategory, TaskStatus, TaskPriority } from '@/types';
import type { Task } from '@/types';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';

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

const generateId = () => Math.random().toString(36).substring(2, 11);

const loadTasks = (): Task[] => {
  try { return JSON.parse(localStorage.getItem('tasks') ?? '[]'); } catch { return []; }
};
const saveTasks = (tasks: Task[]) => localStorage.setItem('tasks', JSON.stringify(tasks));

export default function ByCategory() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [addingTo, setAddingTo] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const grouped = useMemo(() =>
    Object.entries(CATEGORIES).map(([cat, cfg]) => ({
      category: Number(cat),
      cfg,
      pending: tasks.filter((t) => t.category === Number(cat) && t.status !== TaskStatus.COMPLETED),
      done: tasks.filter((t) => t.category === Number(cat) && t.status === TaskStatus.COMPLETED),
    })),
    [tasks]
  );

  const updateAndSave = useCallback((updated: Task[]) => {
    setTasks(updated);
    saveTasks(updated);
  }, []);

  const handleToggle = useCallback((id: string, completed: boolean) => {
    const updated = tasks.map((t) =>
      t.id === id
        ? { ...t, status: completed ? TaskStatus.COMPLETED : TaskStatus.PENDING, updatedAt: new Date().toISOString() }
        : t
    );
    updateAndSave(updated);
    if (completed) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      toast.success('🎉 +10 XP! Tarefa concluída!', { duration: 2500 });
    }
  }, [tasks, updateAndSave]);

  const handleDelete = useCallback((id: string) => {
    updateAndSave(tasks.filter((t) => t.id !== id));
  }, [tasks, updateAndSave]);

  const handleAdd = useCallback((category: number) => {
    if (!newTitle.trim()) return;
    const task: Task = {
      id: generateId(),
      title: newTitle.trim(),
      category: category as TaskCategory,
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.PENDING,
      estimatedMinutes: 25,
      deadline: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    updateAndSave([task, ...tasks]);
    setNewTitle('');
    setAddingTo(null);
    toast.success('Tarefa adicionada!');
  }, [newTitle, tasks, updateAndSave]);

  return (
    <SidebarProvider
      style={{ '--sidebar-width': 'calc(var(--spacing) * 72)', '--header-height': 'calc(var(--spacing) * 12)' } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 min-h-screen">

            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Tarefas por Categoria</h1>
              <Badge variant="secondary">{tasks.filter((t) => t.status !== TaskStatus.COMPLETED).length} pendentes</Badge>
            </div>

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

                    {/* Add inline */}
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
