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

const BLOCK_STYLES: Record<string, string> = {
  [TimeBlockType.WORK]:  'bg-blue-500/20 border-l-2 border-blue-500 text-blue-300',
  [TimeBlockType.CLASS]: 'bg-purple-500/20 border-l-2 border-purple-500 text-purple-300',
  [TimeBlockType.FIXED]: 'bg-orange-500/20 border-l-2 border-orange-500 text-orange-300',
  [TimeBlockType.TASK]:  'bg-green-500/20 border-l-2 border-green-500 text-green-300',
};

const BLOCK_DOT: Record<string, string> = {
  [TimeBlockType.WORK]:  'bg-blue-500',
  [TimeBlockType.CLASS]: 'bg-purple-500',
  [TimeBlockType.FIXED]: 'bg-orange-500',
  [TimeBlockType.TASK]:  'bg-green-500',
};

const BLOCK_LABEL: Record<string, string> = {
  [TimeBlockType.WORK]:  'Trabalho',
  [TimeBlockType.CLASS]: 'Aula',
  [TimeBlockType.FIXED]: 'Compromisso',
  [TimeBlockType.TASK]:  'Tarefa',
};

const TASK_CAT_STYLES: Record<number, string> = {
  [TaskCategory.STUDY]:   'bg-indigo-500/20 border-l-2 border-indigo-500 text-indigo-300',
  [TaskCategory.WORK]:    'bg-blue-500/20 border-l-2 border-blue-400 text-blue-200',
  [TaskCategory.HOME]:    'bg-green-500/20 border-l-2 border-green-500 text-green-300',
  [TaskCategory.HEALTH]:  'bg-rose-500/20 border-l-2 border-rose-500 text-rose-300',
  [TaskCategory.LEISURE]: 'bg-purple-500/20 border-l-2 border-purple-500 text-purple-300',
  [TaskCategory.OTHER]:   'bg-zinc-500/20 border-l-2 border-zinc-500 text-zinc-300',
};

function getWeekMonday(offset: number): dayjs.Dayjs {
  const today = dayjs();
  const dow = today.day(); // 0 = Sun
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
      {/* ── Page header ── */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-base-300 bg-base-100">
        <div className="flex items-center gap-3">
          <CalendarDays size={20} className="text-primary" />
          <div>
            <h1 className="text-base font-semibold leading-tight">Minha Semana</h1>
            <p className="text-xs text-base-content/50">{weekRange}</p>
          </div>
          <span className="text-[11px] bg-base-300 text-base-content/60 rounded-full px-2 py-0.5">
            {totalEvents} compromisso{totalEvents !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-4 mr-2">
            {Object.entries(BLOCK_LABEL).map(([type, label]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${BLOCK_DOT[type]}`} />
                <span className="text-xs text-base-content/60">{label}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setWeekOffset(0)} className="btn btn-ghost btn-sm text-xs">
            Hoje
          </button>
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="btn btn-ghost btn-sm btn-square"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            className="btn btn-ghost btn-sm btn-square"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* ── Calendar body (scrollable) ── */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {/* Sticky day-column headers */}
        <div className="sticky top-0 z-20 flex bg-base-100/95 backdrop-blur-sm border-b border-base-300">
          <div className="w-14 shrink-0" />
          {weekDays.map(d => {
            const isToday = d.dateStr === today;
            return (
              <div
                key={d.dateStr}
                className="flex-1 py-2 flex flex-col items-center gap-0.5 border-r border-base-300/40 last:border-r-0"
              >
                <span className="text-[10px] text-base-content/40 uppercase tracking-wide">
                  {d.label}
                </span>
                <span
                  className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium ${
                    isToday
                      ? 'bg-primary text-primary-content'
                      : 'text-base-content'
                  }`}
                >
                  {d.date.date()}
                </span>
              </div>
            );
          })}
        </div>

        {/* All-day tasks row */}
        {hasAnyTasks && (
          <div className="flex border-b border-base-300/40 bg-base-200/20">
            <div className="w-14 shrink-0 flex items-center justify-end pr-2 py-1">
              <span className="text-[10px] text-base-content/30 text-right leading-tight">
                dia<br />todo
              </span>
            </div>
            {weekDays.map(d => (
              <div
                key={d.dateStr}
                className="flex-1 min-h-[28px] px-1 py-1 flex flex-col gap-0.5 border-r border-base-300/30 last:border-r-0"
              >
                {tasksByDate[d.dateStr]?.map(t => (
                  <div
                    key={t.id}
                    className={`text-[10px] px-1.5 py-0.5 rounded-sm truncate ${
                      TASK_CAT_STYLES[t.category] ?? TASK_CAT_STYLES[TaskCategory.OTHER]
                    }`}
                  >
                    {t.title}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Time grid */}
        <div className="flex">
          {/* Hour labels */}
          <div className="w-14 shrink-0">
            {HOURS.map(h => (
              <div
                key={h}
                style={{ height: HOUR_PX }}
                className="border-b border-base-300/20 flex items-start justify-end pr-2 pt-1"
              >
                <span className="text-[11px] text-base-content/30">
                  {String(h).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div className="flex flex-1">
            {weekDays.map(d => {
              const isWeekend = d.dow === 0 || d.dow === 6;
              const dayBlocks = blocksByDow[d.dow] ?? [];

              return (
                <div
                  key={d.dateStr}
                  className={`flex-1 relative border-r border-base-300/30 last:border-r-0 ${
                    isWeekend ? 'bg-base-200/15' : ''
                  }`}
                >
                  {/* Hour grid lines */}
                  {HOURS.map(h => (
                    <div
                      key={h}
                      style={{ height: HOUR_PX }}
                      className="border-b border-base-300/20"
                    />
                  ))}

                  {/* Current time indicator */}
                  {d.dateStr === today && nowTop !== null && (
                    <div
                      style={{ position: 'absolute', top: nowTop, left: 0, right: 0, zIndex: 15 }}
                      className="pointer-events-none"
                    >
                      <div className="relative h-px bg-primary/70">
                        <div className="absolute -left-0.5 top-[-3px] w-2 h-2 rounded-full bg-primary" />
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
                    const cls = BLOCK_STYLES[block.type] ?? BLOCK_STYLES[TimeBlockType.WORK];
                    return (
                      <div
                        key={block.id}
                        style={{ position: 'absolute', top, height, left: 2, right: 2, zIndex: 10 }}
                        className={`rounded-r-md overflow-hidden ${cls}`}
                      >
                        <div className="p-1 h-full overflow-hidden">
                          <p className="text-xs font-medium truncate leading-tight">
                            {block.title}
                          </p>
                          {height > 30 && (
                            <p className="text-[10px] opacity-70">
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
