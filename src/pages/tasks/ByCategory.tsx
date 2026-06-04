import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  BookOpen, Briefcase, Home, Heart, Gamepad2, MoreHorizontal,
  Plus, Trash2, CheckCircle2, Circle, Loader2,
} from 'lucide-react';
import { TaskCategory, TaskStatus, TaskPriority } from '@/types';
import type { Task } from '@/types';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';

interface CategoryConfig {
  label: string;
  Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>;
  color: string;
}

const CATEGORIES: Record<number, CategoryConfig> = {
  [TaskCategory.STUDY]:   { label: 'Estudos',  Icon: BookOpen,       color: 'var(--color-reward)' },
  [TaskCategory.WORK]:    { label: 'Trabalho', Icon: Briefcase,      color: 'var(--color-focus)' },
  [TaskCategory.HOME]:    { label: 'Casa',     Icon: Home,           color: 'var(--color-done)' },
  [TaskCategory.HEALTH]:  { label: 'Saúde',    Icon: Heart,          color: '#E8713C' },
  [TaskCategory.LEISURE]: { label: 'Lazer',    Icon: Gamepad2,       color: 'var(--color-action)' },
  [TaskCategory.OTHER]:   { label: 'Outros',   Icon: MoreHorizontal, color: 'var(--color-text-muted)' },
};

export default function ByCategory() {
  const { data: serverTasks = [], isLoading } = useTasks();
  const [tasks, setTasks] = useState<Task[]>([]);
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
      <div style={{display:'flex',justifyContent:'center',padding:'64px 0'}}>
        <Loader2 className="h-8 w-8 animate-spin" style={{color:'var(--color-text-muted)'}} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
        <h1 style={{fontSize:'20px',fontWeight:700,color:'var(--color-text)'}}>Por Categoria</h1>
        <span style={{fontSize:'11px',background:'var(--color-surface-2)',color:'var(--color-text-muted)',padding:'2px 8px',borderRadius:'999px'}}>
          {tasks.filter((t) => t.status !== TaskStatus.COMPLETED).length} pendentes
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {grouped.map(({ category, cfg, pending, done }) => (
          <div key={category} style={{
            background:'var(--color-surface)',
            border:'1px solid var(--color-border)',
            borderRadius:'12px',
            overflow:'hidden',
            borderLeft:`4px solid ${cfg.color}`,
          }}>
            {/* Card header */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:'1px solid var(--color-border)'}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <div style={{width:'8px',height:'8px',borderRadius:'50%',background:cfg.color,flexShrink:0}} />
                <cfg.Icon size={14} style={{color:cfg.color}} />
                <span style={{fontSize:'13px',fontWeight:600,color:'var(--color-text)'}}>{cfg.label}</span>
              </div>
              <span style={{fontSize:'11px',color:'var(--color-text-muted)',background:'var(--color-surface-2)',borderRadius:'999px',padding:'2px 8px'}}>
                {pending.length}
              </span>
            </div>

            {/* Tasks */}
            <div style={{padding:'12px',maxHeight:'320px',overflowY:'auto',display:'flex',flexDirection:'column',gap:'6px'}}>
              {pending.length === 0 && done.length === 0 && (
                <p style={{fontSize:'11px',color:'var(--color-text-muted)',textAlign:'center',padding:'16px 0'}}>Nenhuma tarefa ainda</p>
              )}

              {pending.map((task) => (
                <div key={task.id}
                  style={{
                    display:'flex',alignItems:'center',gap:'8px',padding:'8px',borderRadius:'8px',
                    background:'var(--color-surface-2)',
                    borderLeft: task.priority === TaskPriority.HIGH   ? '2px solid var(--color-alert)'
                              : task.priority === TaskPriority.MEDIUM ? '2px solid var(--color-action)'
                              : 'none',
                  }}
                  className="group"
                >
                  <button onClick={() => handleToggle(task.id, true)} style={{flexShrink:0,background:'none',border:'none',cursor:'pointer',padding:0}}>
                    <Circle style={{width:'16px',height:'16px',color:'var(--color-border)'}} />
                  </button>
                  <span style={{
                    flex:1,fontSize:'13px',
                    color: task.priority === TaskPriority.HIGH ? 'var(--color-alert)' : 'var(--color-text)',
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
                  }}>
                    {task.title || '(sem título)'}
                  </span>
                  <button
                    onClick={() => { if (window.confirm('Excluir esta tarefa?')) handleDelete(task.id); }}
                    style={{flexShrink:0,background:'none',border:'none',cursor:'pointer',padding:0,opacity:0,color:'var(--color-alert)',transition:'opacity 0.15s'}}
                    className="group-hover:opacity-100"
                  >
                    <Trash2 style={{width:'14px',height:'14px'}} />
                  </button>
                </div>
              ))}

              {done.length > 0 && (
                <div style={{paddingTop:'4px',borderTop:'1px solid var(--color-border)',display:'flex',flexDirection:'column',gap:'4px'}}>
                  {done.slice(0, 3).map((task) => (
                    <div key={task.id} style={{display:'flex',alignItems:'center',gap:'8px',padding:'6px',opacity:0.4}}>
                      <button onClick={() => handleToggle(task.id, false)} style={{flexShrink:0,background:'none',border:'none',cursor:'pointer',padding:0}}>
                        <CheckCircle2 style={{width:'16px',height:'16px',color:'var(--color-done)'}} />
                      </button>
                      <span style={{flex:1,fontSize:'11px',color:'var(--color-text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textDecoration:'line-through'}}>
                        {task.title || '(sem título)'}
                      </span>
                    </div>
                  ))}
                  {done.length > 3 && (
                    <p style={{fontSize:'10px',color:'var(--color-text-muted)',textAlign:'center'}}>+{done.length - 3} concluídas</p>
                  )}
                </div>
              )}

              {addingTo === category ? (
                <div style={{display:'flex',gap:'4px',paddingTop:'4px'}}>
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAdd(category);
                      if (e.key === 'Escape') { setAddingTo(null); setNewTitle(''); }
                    }}
                    placeholder="Nome da tarefa..."
                    style={{flex:1,height:'28px',fontSize:'12px',background:'var(--color-bg)',border:'1px solid var(--color-border)',borderRadius:'6px',padding:'0 8px',color:'var(--color-text)',outline:'none'}}
                    autoFocus
                  />
                  <button
                    style={{background:'var(--color-action)',color:'#1E1E1C',border:'none',borderRadius:'6px',padding:'4px 10px',fontSize:'12px',fontWeight:500,cursor:'pointer'}}
                    onClick={() => handleAdd(category)}
                  >OK</button>
                </div>
              ) : (
                <button
                  style={{display:'flex',alignItems:'center',gap:'6px',width:'100%',padding:'6px 8px',fontSize:'11px',color:'var(--color-text-muted)',background:'transparent',border:'none',borderRadius:'8px',cursor:'pointer'}}
                  onClick={() => { setAddingTo(category); setNewTitle(''); }}
                >
                  <Plus style={{width:'14px',height:'14px'}} /> Nova tarefa
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
