import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, Circle, CalendarDays, Zap, Sun } from 'lucide-react';
import { TaskStatus, TimeBlockType } from '@/types';
import type { Task, TimeBlock } from '@/types';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';

const BLOCK_COLORS: Record<string, { bg: string; text: string; borderColor: string }> = {
  [TimeBlockType.WORK]:  { bg: 'var(--color-focus-bg)',  text: 'var(--color-focus)',  borderColor: 'var(--color-focus)' },
  [TimeBlockType.CLASS]: { bg: 'var(--color-reward-bg)', text: 'var(--color-reward)', borderColor: 'var(--color-reward)' },
  [TimeBlockType.FIXED]: { bg: 'var(--color-action-bg)', text: 'var(--color-action)', borderColor: 'var(--color-action)' },
  [TimeBlockType.TASK]:  { bg: 'var(--color-done-bg)',   text: 'var(--color-done)',   borderColor: 'var(--color-done)' },
};

const loadTasks   = (): Task[]      => { try { return JSON.parse(localStorage.getItem('tasks') ?? '[]'); } catch { return []; } };
const loadBlocks  = (): TimeBlock[] => { try { return JSON.parse(localStorage.getItem('weeklyRoutine') ?? '[]'); } catch { return []; } };
const saveTasks   = (t: Task[])     => localStorage.setItem('tasks', JSON.stringify(t));

const DAYS_PT = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function timeToMin(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export default function Today() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const today = now;
  const dayOfWeek = today.getDay();
  const blocks = useMemo(() =>
    loadBlocks()
      .filter((b) => b.dayOfWeek === dayOfWeek)
      .sort((a, b) => timeToMin(a.startTime) - timeToMin(b.startTime)),
    [dayOfWeek]
  );

  const doneTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED);
  const progress = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const nextBlock = blocks.find((b) => timeToMin(b.startTime) > currentMinutes);

  const handleToggle = (id: string, complete: boolean) => {
    const updated = tasks.map((t) =>
      t.id === id
        ? { ...t, status: complete ? TaskStatus.COMPLETED : TaskStatus.PENDING, updatedAt: new Date().toISOString() }
        : t
    );
    setTasks(updated);
    saveTasks(updated);
    if (complete) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success('🎉 +10 XP! Arrasando!', { duration: 2500 });
    }
  };

  const allDone = tasks.length > 0 && doneTasks.length === tasks.length;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">

      {/* Hero do dia */}
      <div style={{background:'var(--color-focus-bg)',borderLeft:'4px solid var(--color-focus)',borderRadius:'12px',padding:'24px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
          <CalendarDays style={{width:'20px',height:'20px',color:'var(--color-focus)',opacity:0.7}} />
          <span style={{fontSize:'13px',color:'var(--color-text-sec)'}}>Hoje</span>
        </div>
        <h1 style={{fontSize:'28px',fontWeight:700,color:'var(--color-text)'}}>{DAYS_PT[dayOfWeek]}</h1>
        <p style={{fontSize:'16px',color:'var(--color-text-sec)'}}>{today.getDate()} de {MONTHS_PT[today.getMonth()]} de {today.getFullYear()}</p>
        <div style={{display:'flex',alignItems:'center',gap:'8px',marginTop:'8px'}}>
          <Clock style={{width:'16px',height:'16px',color:'var(--color-focus)',opacity:0.7}} />
          <span style={{fontSize:'18px',fontFamily:'monospace',fontWeight:600,color:'var(--color-focus)'}}>
            {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Progresso do dia */}
      <div style={{background:'var(--color-surface)',border:'1px solid var(--color-border)',borderRadius:'12px',padding:'16px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
          <span style={{fontSize:'13px',fontWeight:500,color:'var(--color-text-sec)'}}>Progresso do Dia</span>
          <span style={{fontSize:'13px',fontWeight:700,color:'var(--color-text)'}}>{doneTasks.length}/{tasks.length}</span>
        </div>
        <div style={{background:'var(--color-border)',borderRadius:'999px',height:'6px'}}>
          <div style={{
            background:'var(--color-done)',height:'100%',borderRadius:'999px',
            width:tasks.length===0?'0%':`${Math.round((doneTasks.length/tasks.length)*100)}%`,
            transition:'width 0.5s',
          }} />
        </div>
        <p style={{fontSize:'11px',color:'var(--color-text-muted)',marginTop:'6px'}}>
          {allDone ? '🎉 Parabéns! Você completou tudo hoje!' : progress >= 50 ? '💪 Você está indo muito bem!' : 'Vamos lá, você consegue! 🚀'}
        </p>
      </div>

      {/* Próximo compromisso */}
      {nextBlock && (
        <div style={{background:'var(--color-action-bg)',borderLeft:'4px solid var(--color-action)',borderRadius:'8px',padding:'16px',display:'flex',alignItems:'center',gap:'12px'}}>
          <Zap style={{width:'20px',height:'20px',color:'var(--color-action)',flexShrink:0}} />
          <div>
            <p style={{fontSize:'11px',color:'var(--color-action)',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.05em'}}>Próximo compromisso</p>
            <p style={{fontWeight:600,color:'var(--color-text)'}}>{nextBlock.title}</p>
            <p style={{fontSize:'11px',color:'var(--color-text-muted)'}}>às {nextBlock.startTime} — {nextBlock.endTime}</p>
          </div>
        </div>
      )}

      {/* Compromissos de hoje */}
      {blocks.length > 0 && (
        <div className="space-y-3">
          <h2 style={{fontSize:'11px',fontWeight:600,color:'var(--color-text-sec)',textTransform:'uppercase',letterSpacing:'0.08em'}}>
            Compromissos de Hoje
          </h2>
          {blocks.map((block) => {
            const cfg = BLOCK_COLORS[block.type] ?? BLOCK_COLORS[TimeBlockType.FIXED];
            const started = timeToMin(block.startTime) <= currentMinutes;
            const ended   = timeToMin(block.endTime)   <= currentMinutes;
            const active  = started && !ended;
            return (
              <div key={block.id} style={{
                display:'flex',alignItems:'center',gap:'12px',padding:'12px',borderRadius:'12px',
                background:cfg.bg,borderLeft:`4px solid ${cfg.borderColor}`,
                ...(active ? {outline:'2px solid var(--color-focus)',outlineOffset:'2px'} : {}),
              }}>
                <div>
                  <p style={{fontWeight:500,fontSize:'13px',color:cfg.text}}>{block.title}</p>
                  <p style={{fontSize:'11px',color:'var(--color-text-muted)'}}>{block.startTime} — {block.endTime}</p>
                </div>
                {active && <span style={{marginLeft:'auto',background:'var(--color-focus)',color:'#fff',borderRadius:'999px',padding:'2px 8px',fontSize:'12px',fontWeight:500}}>Agora</span>}
                {ended  && <span style={{marginLeft:'auto',background:'var(--color-done-bg)',color:'var(--color-done)',borderRadius:'999px',padding:'2px 8px',fontSize:'12px',fontWeight:500,opacity:0.7}}>Concluído</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Tarefas do dia */}
      <div className="space-y-3">
        <h2 style={{fontSize:'11px',fontWeight:600,color:'var(--color-text-sec)',textTransform:'uppercase',letterSpacing:'0.08em'}}>
          Suas Tarefas
        </h2>
        {tasks.length === 0 ? (
          <div style={{textAlign:'center',padding:'48px 24px'}}>
            <Sun style={{width:'48px',height:'48px',margin:'0 auto 8px',color:'var(--color-border)'}} />
            <p style={{fontWeight:600,color:'var(--color-text-sec)'}}>Dia livre! Aproveite</p>
            <p style={{fontSize:'13px',color:'var(--color-text-muted)'}}>Nenhuma tarefa para hoje</p>
          </div>
        ) : (
          tasks.map((task) => {
            const done = task.status === TaskStatus.COMPLETED;
            return (
              <div key={task.id} style={{
                background:'var(--color-surface)',border:'1px solid var(--color-border)',
                borderRadius:'12px',opacity:done?0.6:1,transition:'box-shadow 0.2s',
              }}>
                <div style={{padding:'12px',display:'flex',alignItems:'center',gap:'12px'}}>
                  <button onClick={() => handleToggle(task.id, !done)} style={{flexShrink:0,background:'none',border:'none',cursor:'pointer',padding:0}}>
                    {done
                      ? <CheckCircle2 style={{width:'24px',height:'24px',color:'var(--color-done)'}} />
                      : <Circle style={{width:'24px',height:'24px',color:'var(--color-border)'}} />
                    }
                  </button>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{
                      fontWeight:500,color:'var(--color-text)',
                      overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
                      textDecoration:done?'line-through':'none',
                    }}>
                      {task.title || '(sem título)'}
                    </p>
                    {task.estimatedMinutes > 0 && (
                      <span style={{fontSize:'11px',color:'var(--color-text-muted)',display:'flex',alignItems:'center',gap:'4px'}}>
                        <Clock style={{width:'12px',height:'12px'}} />{task.estimatedMinutes}min
                      </span>
                    )}
                  </div>
                  {done && <span style={{background:'var(--color-done-bg)',color:'var(--color-done)',borderRadius:'999px',padding:'2px 8px',fontSize:'12px',fontWeight:500,flexShrink:0}}>✓ Feito</span>}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Botão de resumo do dia */}
      {(now.getHours() >= 18 || doneTasks.length >= 1) && (
        <div style={{paddingTop:'8px',paddingBottom:'16px'}}>
          <button
            onClick={() => navigate('/summary/daily')}
            style={{width:'100%',background:'transparent',color:'var(--color-focus)',border:'1px solid var(--color-focus)',borderRadius:'8px',padding:'10px 16px',cursor:'pointer',fontWeight:500}}
          >
            Ver resumo do dia →
          </button>
        </div>
      )}

    </div>
  );
}
