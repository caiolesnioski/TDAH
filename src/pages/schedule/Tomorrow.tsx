import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Sparkles, Lightbulb } from 'lucide-react';
import { TaskStatus, TimeBlockType } from '@/types';
import type { Task, TimeBlock } from '@/types';
import { cn } from '@/lib/utils';

const BLOCK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  [TimeBlockType.WORK]:  { bg: 'bg-blue-100 dark:bg-blue-900/40',    text: 'text-blue-700 dark:text-blue-300',    border: 'border-blue-400' },
  [TimeBlockType.CLASS]: { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-400' },
  [TimeBlockType.FIXED]: { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-400' },
  [TimeBlockType.TASK]:  { bg: 'bg-green-100 dark:bg-green-900/40',   text: 'text-green-700 dark:text-green-300',  border: 'border-green-400' },
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

            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-5 w-5 opacity-80" />
                <span className="text-sm opacity-80">Planejamento</span>
              </div>
              <h1 className="text-3xl font-bold">Amanhã</h1>
              <p className="text-lg opacity-90">
                {DAYS_PT[dayOfWeek]}, {tomorrow.getDate()} de {MONTHS_PT[tomorrow.getMonth()]}
              </p>
            </div>

            {/* Dica TDAH */}
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-4 flex gap-3">
                <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Dica para TDAH
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
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
                <div key={label} className="bg-base-200 rounded-xl border border-base-300 p-3 text-center">
                    <Icon className="h-5 w-5 mx-auto mb-1 text-gray-400" />
                    <div className="text-lg font-bold text-gray-800 dark:text-white">{value}</div>
                    <div className="text-[11px] text-gray-400">{label}</div>
                </div>
              ))}
            </div>

            {/* Compromissos de amanhã */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Compromissos Fixos
              </h2>
              {blocks.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <Sparkles className="h-10 w-10 text-gray-300 mx-auto" />
                  <p className="text-sm text-gray-500">Nenhum compromisso fixo amanhã</p>
                  <p className="text-xs text-gray-400">Dia livre para focar no que quiser!</p>
                </div>
              ) : (
                blocks.map((block) => {
                  const cfg = BLOCK_COLORS[block.type] ?? BLOCK_COLORS[TimeBlockType.FIXED];
                  const duration = (timeToMin(block.endTime) - timeToMin(block.startTime));
                  return (
                    <div key={block.id}
                      className={cn('flex items-center gap-3 p-3 rounded-xl border-l-4', cfg.bg, cfg.border)}>
                      <div className="flex-1">
                        <p className={cn('font-medium text-sm', cfg.text)}>{block.title}</p>
                        <p className="text-xs text-gray-500">
                          {block.startTime} — {block.endTime}
                          <span className="ml-2 text-gray-400">({Math.floor(duration / 60)}h{duration % 60 > 0 ? `${duration % 60}min` : ''})</span>
                        </p>
                      </div>
                      <Clock className={cn('h-4 w-4 opacity-50', cfg.text)} />
                    </div>
                  );
                })
              )}
            </div>

            {/* Tarefas pendentes a considerar */}
            {tasks.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Tarefas Pendentes ({tasks.length})
                </h2>
                <p className="text-xs text-gray-400">
                  Considere encaixar essas tarefas nos seus horários livres de amanhã:
                </p>
                <div className="space-y-2">
                  {tasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="bg-base-200 rounded-xl border border-base-300 p-3 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                        <p className="text-sm text-gray-800 dark:text-white flex-1 truncate">
                          {task.title || '(sem título)'}
                        </p>
                        {task.estimatedMinutes > 0 && (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {task.estimatedMinutes}min
                          </Badge>
                        )}
                    </div>
                  ))}
                  {tasks.length > 5 && (
                    <p className="text-xs text-gray-400 text-center">+{tasks.length - 5} outras tarefas</p>
                  )}
                </div>
              </div>
            )}

    </div>
  );
}
