import { useState, useMemo, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTimeBlocks } from '@/hooks/useTimeBlocks';
import { useTasks } from '@/hooks/useTasks';
import { TaskCategory, TaskStatus, TimeBlockType } from '@/types';

const DAY_HEADERS = [
  { label: 'Seg', dow: 1 },
  { label: 'Ter', dow: 2 },
  { label: 'Qua', dow: 3 },
  { label: 'Qui', dow: 4 },
  { label: 'Sex', dow: 5 },
  { label: 'Sáb', dow: 6 },
  { label: 'Dom', dow: 0 },
];

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6..22
const HOUR_PX = 64;
const START_HOUR = 6;
const END_HOUR = 23;

const BLOCK_STYLES: Record<string, { bg: string; borderColor: string; color: string }> = {
  [TimeBlockType.WORK]:  { bg: 'var(--color-focus-bg)',  borderColor: 'var(--color-focus)',  color: 'var(--color-focus)' },
  [TimeBlockType.CLASS]: { bg: 'var(--color-reward-bg)', borderColor: 'var(--color-reward)', color: 'var(--color-reward)' },
  [TimeBlockType.FIXED]: { bg: 'var(--color-action-bg)', borderColor: 'var(--color-action)', color: 'var(--color-action)' },
  [TimeBlockType.TASK]:  { bg: 'var(--color-done-bg)',   borderColor: 'var(--color-done)',   color: 'var(--color-done)' },
};

const BLOCK_DOT_COLOR: Record<string, string> = {
  [TimeBlockType.WORK]:  'var(--color-focus)',
  [TimeBlockType.CLASS]: 'var(--color-reward)',
  [TimeBlockType.FIXED]: 'var(--color-action)',
  [TimeBlockType.TASK]:  'var(--color-done)',
};

const BLOCK_LABEL: Record<string, string> = {
  [TimeBlockType.WORK]:  'Trabalho',
  [TimeBlockType.CLASS]: 'Aula',
  [TimeBlockType.FIXED]: 'Compromisso',
  [TimeBlockType.TASK]:  'Tarefa',
};

const TASK_CAT_STYLES: Record<number, { bg: string; borderColor: string; color: string }> = {
  [TaskCategory.STUDY]:   { bg: 'var(--color-reward-bg)', borderColor: 'var(--color-reward)', color: 'var(--color-reward)' },
  [TaskCategory.WORK]:    { bg: 'var(--color-focus-bg)',  borderColor: 'var(--color-focus)',  color: 'var(--color-focus)' },
  [TaskCategory.HOME]:    { bg: 'var(--color-done-bg)',   borderColor: 'var(--color-done)',   color: 'var(--color-done)' },
  [TaskCategory.HEALTH]:  { bg: 'var(--color-alert-bg)',  borderColor: 'var(--color-alert)',  color: 'var(--color-alert)' },
  [TaskCategory.LEISURE]: { bg: 'var(--color-action-bg)', borderColor: 'var(--color-action)', color: 'var(--color-action)' },
  [TaskCategory.OTHER]:   { bg: 'var(--color-surface-2)', borderColor: 'var(--color-text-muted)', color: 'var(--color-text-muted)' },
};

function getWeekMonday(offset: number): dayjs.Dayjs {
  const today = dayjs();
  const dow = today.day();
  const daysBack = dow === 0 ? 6 : dow - 1;
  return today.subtract(daysBack, 'day').startOf('day').add(offset * 7, 'day');
}

function toMin(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export default function MyWeek() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [now, setNow] = useState(() => dayjs());
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: blocks = [] } = useTimeBlocks();
  const { data: tasks = [] } = useTasks();

  useEffect(() => {
    const id = setInterval(() => setNow(dayjs()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = (7 - START_HOUR) * HOUR_PX;
    }
  }, []);

  const monday = useMemo(() => getWeekMonday(weekOffset), [weekOffset]);

  const weekDays = useMemo(() =>
    DAY_HEADERS.map((d, i) => {
      const date = monday.add(i, 'day');
      return { ...d, date, dateStr: date.format('YYYY-MM-DD') };
    }), [monday]);

  const weekRange = useMemo(() => {
    const start = monday;
    const end = monday.add(6, 'day');
    if (start.month() === end.month()) {
      return `${start.date()}–${end.date()} ${start.format('MMM YYYY')}`;
    }
    return `${start.date()} ${start.format('MMM')} – ${end.date()} ${end.format('MMM YYYY')}`;
  }, [monday]);

  const today = dayjs().format('YYYY-MM-DD');

  const tasksByDate = useMemo(() => {
    const map: Record<string, typeof tasks> = {};
    weekDays.forEach(d => { map[d.dateStr] = []; });
    tasks
      .filter(t => t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED)
      .forEach(t => {
        const dl = t.deadline || t.dueDate || '';
        if (map[dl] !== undefined) map[dl].push(t);
      });
    return map;
  }, [tasks, weekDays]);

  const hasAnyTasks = useMemo(() =>
    weekDays.some(d => (tasksByDate[d.dateStr]?.length ?? 0) > 0),
    [tasksByDate, weekDays]);

  const blocksByDow = useMemo(() => {
    const map: Record<number, typeof blocks> = {};
    for (let i = 0; i <= 6; i++) map[i] = [];
    blocks.forEach(b => map[b.dayOfWeek]?.push(b));
    return map;
  }, [blocks]);

  const totalEvents = useMemo(() =>
    weekDays.reduce((sum, d) =>
      sum + (blocksByDow[d.dow]?.length ?? 0) + (tasksByDate[d.dateStr]?.length ?? 0), 0),
    [weekDays, blocksByDow, tasksByDate]);

  const nowMin = now.hour() * 60 + now.minute();
  const nowTop = nowMin >= START_HOUR * 60 && nowMin < END_HOUR * 60
    ? ((nowMin - START_HOUR * 60) / 60) * HOUR_PX
    : null;

  return (
    <div className="-mx-6 -mt-6 flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Page header */}
      <div style={{flexShrink:0,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 24px',borderBottom:'1px solid var(--color-border)',background:'var(--color-surface)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <CalendarDays size={20} style={{color:'var(--color-action)'}} />
          <div>
            <h1 style={{fontSize:'15px',fontWeight:600,lineHeight:'1.2',color:'var(--color-text)'}}>Minha Semana</h1>
            <p style={{fontSize:'11px',color:'var(--color-text-muted)'}}>{weekRange}</p>
          </div>
          <span style={{fontSize:'11px',background:'var(--color-surface-2)',color:'var(--color-text-muted)',borderRadius:'999px',padding:'2px 8px'}}>
            {totalEvents} compromisso{totalEvents !== 1 ? 's' : ''}
          </span>
        </div>

        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <div className="hidden lg:flex items-center gap-4 mr-2">
            {Object.entries(BLOCK_LABEL).map(([type, label]) => (
              <div key={type} style={{display:'flex',alignItems:'center',gap:'6px'}}>
                <div style={{width:'8px',height:'8px',borderRadius:'50%',background:BLOCK_DOT_COLOR[type]}} />
                <span style={{fontSize:'11px',color:'var(--color-text-sec)'}}>{label}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setWeekOffset(0)}
            style={{background:'transparent',border:'1px solid var(--color-border)',borderRadius:'8px',padding:'4px 10px',fontSize:'12px',color:'var(--color-text-sec)',cursor:'pointer'}}
          >
            Hoje
          </button>
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            style={{background:'transparent',border:'1px solid var(--color-border)',borderRadius:'8px',padding:'4px 8px',color:'var(--color-text-sec)',cursor:'pointer',display:'flex',alignItems:'center'}}
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            style={{background:'transparent',border:'1px solid var(--color-border)',borderRadius:'8px',padding:'4px 8px',color:'var(--color-text-sec)',cursor:'pointer',display:'flex',alignItems:'center'}}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Calendar body */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {/* Sticky day headers */}
        <div style={{position:'sticky',top:0,zIndex:20,display:'flex',background:'var(--color-surface)',borderBottom:'1px solid var(--color-border)'}}>
          <div style={{width:'56px',flexShrink:0}} />
          {weekDays.map(d => {
            const isToday = d.dateStr === today;
            return (
              <div
                key={d.dateStr}
                style={{flex:1,padding:'8px 0',display:'flex',flexDirection:'column',alignItems:'center',gap:'2px',borderRight:'1px solid rgba(0,0,0,0.06)'}}
                className="last:border-r-0"
              >
                <span style={{fontSize:'10px',color:'var(--color-text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>
                  {d.label}
                </span>
                <span style={{
                  width:'28px',height:'28px',display:'flex',alignItems:'center',justifyContent:'center',
                  borderRadius:'50%',fontSize:'13px',fontWeight:500,
                  background: isToday ? 'var(--color-action)' : 'transparent',
                  color: isToday ? '#1E1E1C' : 'var(--color-text)',
                }}>
                  {d.date.date()}
                </span>
              </div>
            );
          })}
        </div>

        {/* All-day tasks row */}
        {hasAnyTasks && (
          <div style={{display:'flex',borderBottom:'1px solid rgba(0,0,0,0.06)',background:'var(--color-surface-2)'}}>
            <div style={{width:'56px',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'flex-end',padding:'4px 8px 4px 0'}}>
              <span style={{fontSize:'10px',color:'var(--color-text-muted)',textAlign:'right',lineHeight:'1.3'}}>
                dia<br />todo
              </span>
            </div>
            {weekDays.map(d => (
              <div
                key={d.dateStr}
                style={{flex:1,minHeight:'28px',padding:'4px',display:'flex',flexDirection:'column',gap:'2px',borderRight:'1px solid rgba(0,0,0,0.06)'}}
                className="last:border-r-0"
              >
                {tasksByDate[d.dateStr]?.map(t => {
                  const s = TASK_CAT_STYLES[t.category] ?? TASK_CAT_STYLES[TaskCategory.OTHER];
                  return (
                    <div key={t.id} style={{fontSize:'10px',padding:'2px 6px',borderRadius:'4px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',background:s.bg,borderLeft:`2px solid ${s.borderColor}`,color:s.color}}>
                      {t.title}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Time grid */}
        <div style={{display:'flex'}}>
          {/* Hour labels */}
          <div style={{width:'56px',flexShrink:0}}>
            {HOURS.map(h => (
              <div
                key={h}
                style={{height:HOUR_PX,borderBottom:'1px solid rgba(0,0,0,0.04)',display:'flex',alignItems:'flex-start',justifyContent:'flex-end',padding:'4px 8px 0 0'}}
              >
                <span style={{fontSize:'11px',color:'var(--color-text-muted)'}}>
                  {String(h).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div style={{display:'flex',flex:1}}>
            {weekDays.map(d => {
              const isWeekend = d.dow === 0 || d.dow === 6;
              const dayBlocks = blocksByDow[d.dow] ?? [];

              return (
                <div
                  key={d.dateStr}
                  style={{flex:1,position:'relative',borderRight:'1px solid rgba(0,0,0,0.06)',background:isWeekend?'rgba(0,0,0,0.015)':'transparent'}}
                  className="last:border-r-0"
                >
                  {/* Hour grid lines */}
                  {HOURS.map(h => (
                    <div key={h} style={{height:HOUR_PX,borderBottom:'1px solid rgba(0,0,0,0.04)'}} />
                  ))}

                  {/* Current time indicator */}
                  {d.dateStr === today && nowTop !== null && (
                    <div style={{position:'absolute',top:nowTop,left:0,right:0,zIndex:15,pointerEvents:'none'}}>
                      <div style={{position:'relative',height:'1px',background:'var(--color-focus)',opacity:0.7}}>
                        <div style={{position:'absolute',left:'-2px',top:'-3px',width:'7px',height:'7px',borderRadius:'50%',background:'var(--color-focus)'}} />
                      </div>
                    </div>
                  )}

                  {/* Time blocks */}
                  {dayBlocks.map(block => {
                    const startMin = toMin(block.startTime);
                    const endMin = toMin(block.endTime);
                    if (startMin < START_HOUR * 60 || startMin >= END_HOUR * 60) return null;
                    const top = ((startMin - START_HOUR * 60) / 60) * HOUR_PX;
                    const height = Math.max(22, ((endMin - startMin) / 60) * HOUR_PX);
                    const bs = BLOCK_STYLES[block.type] ?? BLOCK_STYLES[TimeBlockType.WORK];
                    return (
                      <div
                        key={block.id}
                        style={{position:'absolute',top,height,left:2,right:2,zIndex:10,background:bs.bg,borderLeft:`2px solid ${bs.borderColor}`,borderRadius:'0 6px 6px 0',overflow:'hidden'}}
                      >
                        <div style={{padding:'4px',height:'100%',overflow:'hidden'}}>
                          <p style={{fontSize:'12px',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',lineHeight:'1.2',color:bs.color}}>
                            {block.title}
                          </p>
                          {height > 30 && (
                            <p style={{fontSize:'10px',opacity:0.7,color:bs.color}}>
                              {block.startTime} – {block.endTime}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
