import { useMemo, useState } from 'react';
import { CheckCircle2, Clock, Loader2, Trophy, Sun, Calendar, BookOpen, Briefcase, Home, Heart, Gamepad2, MoreHorizontal } from 'lucide-react';
import { TaskStatus } from '@/types';
import type { Task } from '@/types';
import { useTasks } from '@/hooks/useTasks';

const CATEGORY_CONFIG: Record<number, { label: string; bg: string; text: string }> = {
  0: { label: 'Estudos',  bg: 'var(--color-reward-bg)', text: 'var(--color-reward)' },
  1: { label: 'Trabalho', bg: 'var(--color-focus-bg)',  text: 'var(--color-focus)' },
  2: { label: 'Casa',     bg: 'var(--color-done-bg)',   text: 'var(--color-done)' },
  3: { label: 'Saúde',    bg: 'var(--color-alert-bg)',  text: 'var(--color-alert)' },
  4: { label: 'Lazer',    bg: 'var(--color-action-bg)', text: 'var(--color-action)' },
  5: { label: 'Outros',   bg: 'var(--color-surface-2)', text: 'var(--color-text-muted)' },
};

const PRIORITY_CONFIG: Record<number, { label: string; bg: string; text: string }> = {
  0: { label: 'Baixa', bg: 'var(--color-surface-2)', text: 'var(--color-text-muted)' },
  1: { label: 'Média', bg: 'var(--color-action-bg)', text: 'var(--color-action)' },
  2: { label: 'Alta',  bg: 'var(--color-alert-bg)',  text: 'var(--color-alert)' },
};

const CAT_ICONS: Record<number, typeof BookOpen> = {
  0: BookOpen, 1: Briefcase, 2: Home, 3: Heart, 4: Gamepad2, 5: MoreHorizontal,
};

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'agora mesmo';
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ontem';
  return `${days} dias atrás`;
}

function groupByDay(tasks: Task[]): { label: string; date: string; tasks: Task[] }[] {
  const groups: Record<string, Task[]> = {};
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  for (const task of tasks) {
    const key = new Date(task.updatedAt).toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(task);
  }

  return Object.entries(groups)
    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
    .map(([key, tasks]) => ({
      label: key === today ? 'Hoje' : key === yesterday ? 'Ontem'
        : new Date(key).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }),
      date: key,
      tasks,
    }));
}

export default function Completed() {
  const { data: allTasks = [], isLoading } = useTasks();
  const [catFilter, setCatFilter] = useState<number | 'all'>('all');

  const completed = useMemo(() =>
    allTasks
      .filter((t) => t.status === TaskStatus.COMPLETED)
      .filter((t) => catFilter === 'all' || t.category === catFilter)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [allTasks, catFilter]
  );

  const groups = useMemo(() => groupByDay(completed), [completed]);

  const todayCount = allTasks.filter(
    (t) => t.status === TaskStatus.COMPLETED && new Date(t.updatedAt).toDateString() === new Date().toDateString()
  ).length;

  const monthCount = allTasks.filter((t) => {
    const d = new Date(t.updatedAt);
    const now = new Date();
    return t.status === TaskStatus.COMPLETED && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const totalCount = allTasks.filter((t) => t.status === TaskStatus.COMPLETED).length;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
        <Trophy style={{width:'24px',height:'24px',color:'var(--color-action)'}} />
        <div>
          <h1 style={{fontSize:'20px',fontWeight:700,color:'var(--color-text)'}}>Tarefas Concluídas</h1>
          <p style={{fontSize:'13px',color:'var(--color-text-muted)'}}>Histórico de tudo que você completou</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Hoje',     value: todayCount,  Icon: Sun      },
          { label: 'Este Mês', value: monthCount,  Icon: Calendar },
          { label: 'Total',    value: totalCount,  Icon: Trophy   },
        ].map(({ label, value, Icon }) => (
          <div key={label} style={{background:'var(--color-surface)',border:'1px solid var(--color-border)',borderRadius:'12px',padding:'16px',textAlign:'center'}}>
            <Icon style={{width:'20px',height:'20px',color:'var(--color-text-muted)',margin:'0 auto 4px'}} />
            <div style={{fontSize:'24px',fontWeight:700,color:'var(--color-text)'}}>{value}</div>
            <div style={{fontSize:'11px',color:'var(--color-text-muted)',marginTop:'2px'}}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <button
          style={{padding:'6px 12px',borderRadius:'8px',fontSize:'13px',fontWeight:500,border:'none',cursor:'pointer',background:catFilter==='all'?'var(--color-action)':'var(--color-surface-2)',color:catFilter==='all'?'#1E1E1C':'var(--color-text-sec)'}}
          onClick={() => setCatFilter('all')}>
          Todas
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
          const CatIcon = CAT_ICONS[Number(key)];
          const isActive = catFilter === Number(key);
          return (
            <button key={key}
              style={{display:'flex',alignItems:'center',gap:'6px',padding:'6px 12px',borderRadius:'8px',fontSize:'13px',border:'none',cursor:'pointer',background:isActive?'var(--color-action)':'var(--color-surface-2)',color:isActive?'#1E1E1C':'var(--color-text-sec)'}}
              onClick={() => setCatFilter(Number(key))}>
              <CatIcon size={13} />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{display:'flex',justifyContent:'center',padding:'64px 0'}}>
          <Loader2 className="h-8 w-8 animate-spin" style={{color:'var(--color-text-muted)'}} />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && completed.length === 0 && (
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'80px 0',color:'var(--color-text-muted)'}}>
          <CheckCircle2 style={{width:'48px',height:'48px',marginBottom:'12px'}} />
          <p style={{fontSize:'15px',fontWeight:500}}>Nenhuma tarefa concluída ainda</p>
          <p style={{fontSize:'13px',marginTop:'4px'}}>Complete tarefas para ver seu histórico aqui</p>
        </div>
      )}

      {/* Timeline */}
      {!isLoading && groups.map((group) => (
        <div key={group.date} className="space-y-2">
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <h2 style={{fontSize:'11px',fontWeight:600,color:'var(--color-text-muted)',textTransform:'uppercase',letterSpacing:'0.08em'}}>
              {group.label}
            </h2>
            <div style={{flex:1,height:'1px',background:'var(--color-border)'}} />
            <span style={{fontSize:'11px',color:'var(--color-text-muted)',background:'var(--color-surface-2)',padding:'2px 8px',borderRadius:'999px'}}>
              {group.tasks.length}
            </span>
          </div>

          <div className="space-y-1.5">
            {group.tasks.map((task) => {
              const cat = CATEGORY_CONFIG[task.category];
              const pri = PRIORITY_CONFIG[task.priority];
              const CatIcon = CAT_ICONS[task.category];
              return (
                <div key={task.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 16px',borderRadius:'12px',border:'1px solid var(--color-border)',background:'var(--color-surface)'}}>
                  <CheckCircle2 style={{width:'16px',height:'16px',color:'var(--color-done)',flexShrink:0}} />
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:'13px',fontWeight:500,color:'var(--color-text-sec)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textDecoration:'line-through'}}>
                      {task.title || '(sem título)'}
                    </p>
                    <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginTop:'4px'}}>
                      <span style={{display:'inline-flex',alignItems:'center',gap:'4px',fontSize:'11px',background:cat.bg,color:cat.text,padding:'2px 6px',borderRadius:'999px'}}>
                        <CatIcon size={10} /> {cat.label}
                      </span>
                      <span style={{fontSize:'11px',background:pri.bg,color:pri.text,padding:'2px 6px',borderRadius:'999px'}}>
                        {pri.label}
                      </span>
                      {task.estimatedMinutes > 0 && (
                        <span style={{display:'flex',alignItems:'center',gap:'2px',fontSize:'11px',color:'var(--color-text-muted)'}}>
                          <Clock style={{width:'12px',height:'12px'}} />{task.estimatedMinutes}min
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{fontSize:'11px',color:'var(--color-text-muted)',flexShrink:0}}>{formatRelative(task.updatedAt)}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
