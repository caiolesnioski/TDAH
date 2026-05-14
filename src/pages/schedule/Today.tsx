import { useState, useMemo, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, Circle, CalendarDays, Zap, Sun } from 'lucide-react';
import { TaskStatus, TimeBlockType } from '@/types';
import type { Task, TimeBlock } from '@/types';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

const BLOCK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  [TimeBlockType.WORK]:  { bg: 'bg-blue-100 dark:bg-blue-900/40',   text: 'text-blue-700 dark:text-blue-300',   border: 'border-blue-400' },
  [TimeBlockType.CLASS]: { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-400' },
  [TimeBlockType.FIXED]: { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-400' },
  [TimeBlockType.TASK]:  { bg: 'bg-green-100 dark:bg-green-900/40',  text: 'text-green-700 dark:text-green-300',  border: 'border-green-400' },
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

            {/* Header com data */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-1">
                <CalendarDays className="h-5 w-5 opacity-80" />
                <span className="text-sm opacity-80">Hoje</span>
              </div>
              <h1 className="text-3xl font-bold">{DAYS_PT[dayOfWeek]}</h1>
              <p className="text-lg opacity-90">{today.getDate()} de {MONTHS_PT[today.getMonth()]} de {today.getFullYear()}</p>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="h-4 w-4 opacity-70" />
                <span className="text-xl font-mono font-semibold">
                  {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Progresso do dia */}
            <div className="bg-base-200 rounded-xl border border-base-300 p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progresso do Dia</span>
                  <span className="text-sm font-bold text-gray-800 dark:text-white">{doneTasks.length}/{tasks.length}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
                    style={{ width: tasks.length === 0 ? '0%' : `${Math.round((doneTasks.length / tasks.length) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  {allDone ? '🎉 Parabéns! Você completou tudo hoje!' : progress >= 50 ? '💪 Você está indo muito bem!' : 'Vamos lá, você consegue! 🚀'}
                </p>
            </div>

            {/* Próximo compromisso */}
            {nextBlock && (
              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl border-l-4 border-amber-400 p-4 flex items-center gap-3">
                  <Zap className="h-5 w-5 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium uppercase tracking-wide">Próximo compromisso</p>
                    <p className="font-semibold text-gray-800 dark:text-white">{nextBlock.title}</p>
                    <p className="text-xs text-gray-500">às {nextBlock.startTime} — {nextBlock.endTime}</p>
                  </div>
              </div>
            )}

            {/* Compromissos de hoje */}
            {blocks.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Compromissos de Hoje
                </h2>
                {blocks.map((block) => {
                  const cfg = BLOCK_COLORS[block.type] ?? BLOCK_COLORS[TimeBlockType.FIXED];
                  const started = timeToMin(block.startTime) <= currentMinutes;
                  const ended   = timeToMin(block.endTime)   <= currentMinutes;
                  const active  = started && !ended;
                  return (
                    <div key={block.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border-l-4',
                        cfg.bg, cfg.border,
                        active && 'ring-2 ring-offset-1 ring-blue-400'
                      )}>
                      <div>
                        <p className={cn('font-medium text-sm', cfg.text)}>{block.title}</p>
                        <p className="text-xs text-gray-500">{block.startTime} — {block.endTime}</p>
                      </div>
                      {active && <Badge className="ml-auto bg-blue-500 text-white animate-pulse">Agora</Badge>}
                      {ended  && <Badge variant="secondary" className="ml-auto opacity-50">Concluído</Badge>}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tarefas do dia */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Suas Tarefas
              </h2>
              {tasks.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <Sun className="h-12 w-12 text-gray-300 mx-auto" />
                  <p className="font-semibold text-gray-700 dark:text-gray-300">Dia livre! Aproveite</p>
                  <p className="text-sm text-gray-400">Nenhuma tarefa para hoje</p>
                </div>
              ) : (
                tasks.map((task) => {
                  const done = task.status === TaskStatus.COMPLETED;
                  return (
                    <div key={task.id}
                      className={cn('bg-base-200 rounded-xl border border-base-300 hover:shadow-md transition-shadow', done && 'opacity-60')}>
                      <div className="p-3 flex items-center gap-3">
                        <button onClick={() => handleToggle(task.id, !done)} className="shrink-0">
                          {done
                            ? <CheckCircle2 className="h-6 w-6 text-green-500" />
                            : <Circle className="h-6 w-6 text-gray-300 hover:text-green-400 transition-colors" />
                          }
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={cn('font-medium text-gray-800 dark:text-white truncate', done && 'line-through')}>
                            {task.title || '(sem título)'}
                          </p>
                          {task.estimatedMinutes > 0 && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />{task.estimatedMinutes}min
                            </span>
                          )}
                        </div>
                        {done && <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 shrink-0">✓ Feito</Badge>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

    </div>
  );
}
