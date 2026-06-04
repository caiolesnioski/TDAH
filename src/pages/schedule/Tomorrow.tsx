import { useMemo } from 'react';
import { Calendar, Clock, Sparkles, Lightbulb } from 'lucide-react';
import { TaskStatus, TimeBlockType } from '@/types';
import type { Task, TimeBlock } from '@/types';

const BLOCK_COLORS: Record<string, { bg: string; text: string; borderColor: string }> = {
  [TimeBlockType.WORK]:  { bg: 'var(--color-focus-bg)',  text: 'var(--color-focus)',  borderColor: 'var(--color-focus)' },
  [TimeBlockType.CLASS]: { bg: 'var(--color-reward-bg)', text: 'var(--color-reward)', borderColor: 'var(--color-reward)' },
  [TimeBlockType.FIXED]: { bg: 'var(--color-action-bg)', text: 'var(--color-action)', borderColor: 'var(--color-action)' },
  [TimeBlockType.TASK]:  { bg: 'var(--color-done-bg)',   text: 'var(--color-done)',   borderColor: 'var(--color-done)' },
};

const DAYS_PT = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function timeToMin(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

const loadTasks  = (): Task[]      => { try { return JSON.parse(localStorage.getItem('tasks') ?? '[]'); } catch { return []; } };
const loadBlocks = (): TimeBlock[] => { try { return JSON.parse(localStorage.getItem('weeklyRoutine') ?? '[]'); } catch { return []; } };

export default function Tomorrow() {
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  }, []);

  const dayOfWeek = tomorrow.getDay();

  const blocks = useMemo(() =>
    loadBlocks()
      .filter((b) => b.dayOfWeek === dayOfWeek)
      .sort((a, b) => timeToMin(a.startTime) - timeToMin(b.startTime)),
    [dayOfWeek]
  );

  const tasks = useMemo(() =>
    loadTasks().filter((t) => t.status !== TaskStatus.COMPLETED),
    []
  );

  const totalBlockHours = blocks.reduce((s, b) => s + (timeToMin(b.endTime) - timeToMin(b.startTime)), 0) / 60;
  const freeHours = Math.max(0, 16 - totalBlockHours);
  const formatHoras = (h: number) => `${parseFloat(h.toFixed(1))}h`;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">

      {/* Hero */}
      <div style={{background:'var(--color-reward-bg)',borderLeft:'4px solid var(--color-reward)',borderRadius:'12px',padding:'24px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'4px'}}>
          <Calendar style={{width:'20px',height:'20px',color:'var(--color-reward)',opacity:0.7}} />
          <span style={{fontSize:'13px',color:'var(--color-text-sec)'}}>Planejamento</span>
        </div>
        <h1 style={{fontSize:'28px',fontWeight:700,color:'var(--color-text)'}}>Amanhã</h1>
        <p style={{fontSize:'16px',color:'var(--color-text-sec)'}}>
          {DAYS_PT[dayOfWeek]}, {tomorrow.getDate()} de {MONTHS_PT[tomorrow.getMonth()]}
        </p>
      </div>

      {/* Dica TDAH */}
      <div style={{background:'var(--color-action-bg)',borderLeft:'4px solid var(--color-action)',borderRadius:'8px',padding:'16px',display:'flex',gap:'12px'}}>
        <Lightbulb style={{width:'20px',height:'20px',color:'var(--color-action)',flexShrink:0,marginTop:'2px'}} />
        <div>
          <p style={{fontSize:'13px',fontWeight:500,color:'var(--color-action)'}}>Dica para TDAH</p>
          <p style={{fontSize:'13px',color:'var(--color-text-sec)',marginTop:'2px'}}>
            Planejar o dia de amanhã hoje reduz a ansiedade e facilita começar as tarefas! 💡
          </p>
        </div>
      </div>

      {/* Resumo do dia */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Compromissos', value: blocks.length, Icon: Calendar },
          { label: 'Horas Ocupadas', value: formatHoras(totalBlockHours), Icon: Clock },
          { label: 'Horas Livres', value: formatHoras(freeHours), Icon: Sparkles },
        ].map(({ label, value, Icon }) => (
          <div key={label} style={{background:'var(--color-surface)',border:'1px solid var(--color-border)',borderRadius:'12px',padding:'12px',textAlign:'center'}}>
            <Icon style={{width:'20px',height:'20px',margin:'0 auto 4px',color:'var(--color-text-muted)'}} />
            <div style={{fontSize:'18px',fontWeight:700,color:'var(--color-text)'}}>{value}</div>
            <div style={{fontSize:'11px',color:'var(--color-text-muted)'}}>{label}</div>
          </div>
        ))}
      </div>

      {/* Compromissos de amanhã */}
      <div className="space-y-3">
        <h2 style={{fontSize:'11px',fontWeight:600,color:'var(--color-text-sec)',textTransform:'uppercase',letterSpacing:'0.08em'}}>
          Compromissos Fixos
        </h2>
        {blocks.length === 0 ? (
          <div style={{textAlign:'center',padding:'32px 24px'}}>
            <Sparkles style={{width:'40px',height:'40px',margin:'0 auto 8px',color:'var(--color-border)'}} />
            <p style={{fontSize:'13px',color:'var(--color-text-sec)'}}>Nenhum compromisso fixo amanhã</p>
            <p style={{fontSize:'11px',color:'var(--color-text-muted)'}}>Dia livre para focar no que quiser!</p>
          </div>
        ) : (
          blocks.map((block) => {
            const cfg = BLOCK_COLORS[block.type] ?? BLOCK_COLORS[TimeBlockType.FIXED];
            const duration = timeToMin(block.endTime) - timeToMin(block.startTime);
            return (
              <div key={block.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px',borderRadius:'12px',background:cfg.bg,borderLeft:`4px solid ${cfg.borderColor}`}}>
                <div style={{flex:1}}>
                  <p style={{fontWeight:500,fontSize:'13px',color:cfg.text}}>{block.title}</p>
                  <p style={{fontSize:'11px',color:'var(--color-text-muted)'}}>
                    {block.startTime} — {block.endTime}
                    <span style={{marginLeft:'8px'}}>({Math.floor(duration / 60)}h{duration % 60 > 0 ? `${duration % 60}min` : ''})</span>
                  </p>
                </div>
                <Clock style={{width:'16px',height:'16px',opacity:0.5,color:cfg.text}} />
              </div>
            );
          })
        )}
      </div>

      {/* Tarefas pendentes a considerar */}
      {tasks.length > 0 && (
        <div className="space-y-3">
          <h2 style={{fontSize:'11px',fontWeight:600,color:'var(--color-text-sec)',textTransform:'uppercase',letterSpacing:'0.08em'}}>
            Tarefas Pendentes ({tasks.length})
          </h2>
          <p style={{fontSize:'11px',color:'var(--color-text-muted)'}}>
            Considere encaixar essas tarefas nos seus horários livres de amanhã:
          </p>
          <div className="space-y-2">
            {tasks.slice(0, 5).map((task) => (
              <div key={task.id} style={{background:'var(--color-surface)',border:'1px solid var(--color-border)',borderRadius:'12px',padding:'12px',display:'flex',alignItems:'center',gap:'12px'}}>
                <div style={{width:'8px',height:'8px',borderRadius:'50%',background:'var(--color-focus)',flexShrink:0}} />
                <p style={{fontSize:'13px',color:'var(--color-text)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {task.title || '(sem título)'}
                </p>
                {task.estimatedMinutes > 0 && (
                  <span style={{background:'var(--color-surface-2)',color:'var(--color-text-sec)',borderRadius:'999px',padding:'2px 8px',fontSize:'11px',flexShrink:0}}>
                    {task.estimatedMinutes}min
                  </span>
                )}
              </div>
            ))}
            {tasks.length > 5 && (
              <p style={{fontSize:'11px',color:'var(--color-text-muted)',textAlign:'center'}}>+{tasks.length - 5} outras tarefas</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
