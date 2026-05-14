import { useState, useMemo } from 'react';
import { useTimeBlocks, useDeleteTimeBlock } from '@/hooks/useTimeBlocks';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Plus, Trash2, Clock } from 'lucide-react';
import { TimeBlockType } from '@/types';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const DAYS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const BLOCK_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  [TimeBlockType.WORK]:  { bg: 'bg-blue-50 dark:bg-blue-900/20',    text: 'text-blue-700 dark:text-blue-300',    border: 'border-blue-300', dot: 'bg-blue-500' },
  [TimeBlockType.CLASS]: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300', dot: 'bg-purple-500' },
  [TimeBlockType.FIXED]: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-300', dot: 'bg-orange-500' },
  [TimeBlockType.TASK]:  { bg: 'bg-green-50 dark:bg-green-900/20',   text: 'text-green-700 dark:text-green-300',  border: 'border-green-300', dot: 'bg-green-500' },
};

const BLOCK_TYPE_LABELS: Record<string, string> = {
  [TimeBlockType.WORK]:  'Trabalho',
  [TimeBlockType.CLASS]: 'Aula',
  [TimeBlockType.FIXED]: 'Fixo',
  [TimeBlockType.TASK]:  'Tarefa',
};

function timeToMin(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export default function SchedulesList() {
  const navigate = useNavigate();
  const { data: blocks = [] } = useTimeBlocks();
  const deleteTimeBlock = useDeleteTimeBlock();
  const [filterDay, setFilterDay] = useState<number | 'all'>('all');
  const [blockToDelete, setBlockToDelete] = useState<string | null>(null);

  const filtered = useMemo(() =>
    blocks
      .filter((b) => filterDay === 'all' || b.dayOfWeek === filterDay)
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek || timeToMin(a.startTime) - timeToMin(b.startTime)),
    [blocks, filterDay]
  );

  const grouped = useMemo(() => {
    const map: Record<number, TimeBlock[]> = {};
    for (const b of filtered) {
      if (!map[b.dayOfWeek]) map[b.dayOfWeek] = [];
      map[b.dayOfWeek].push(b);
    }
    return Object.entries(map).map(([day, items]) => ({ day: Number(day), items }));
  }, [filtered]);

  const totalHours = blocks.reduce((s, b) => s + (timeToMin(b.endTime) - timeToMin(b.startTime)), 0) / 60;

  const handleDelete = (id: string) => {
    deleteTimeBlock.mutate(id, {
      onSuccess: () => toast.success('Horário removido.'),
      onError: () => toast.error('Erro ao remover horário'),
    });
  };

  return (
    <>
      <SidebarProvider
        style={{ '--sidebar-width': 'calc(var(--spacing) * 72)', '--header-height': 'calc(var(--spacing) * 12)' } as React.CSSProperties}
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 min-h-screen">

              {/* Header */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-7 w-7 text-blue-500" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Meus Compromissos</h1>
                    <p className="text-sm text-gray-500">{blocks.length} {blocks.length === 1 ? 'compromisso' : 'compromissos'} • {totalHours.toFixed(1)}h/semana</p>
                  </div>
                </div>
                <Button onClick={() => navigate('/schedule/new')} className="gap-2 shrink-0">
                  <Plus className="h-4 w-4" /> Novo
                </Button>
              </div>

              {/* Stats por dia */}
              <div className="grid grid-cols-7 gap-1.5">
                {DAYS_SHORT.map((d, i) => {
                  const count = blocks.filter((b) => b.dayOfWeek === i).length;
                  return (
                    <button
                      key={i}
                      onClick={() => setFilterDay(filterDay === i ? 'all' : i)}
                      className={cn(
                        'rounded-xl p-2 flex flex-col items-center gap-1 text-xs font-medium transition-all',
                        filterDay === i
                          ? 'bg-blue-500 text-white shadow-md'
                          : count > 0
                          ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-sm hover:shadow-md'
                          : 'bg-gray-100 dark:bg-gray-800/50 text-gray-400'
                      )}
                    >
                      <span>{d}</span>
                      {count > 0 && (
                        <span className={cn('text-[10px] font-bold', filterDay === i ? 'text-blue-100' : 'text-blue-500')}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Filtro ativo */}
              {filterDay !== 'all' && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{DAYS_FULL[filterDay]}</Badge>
                  <button onClick={() => setFilterDay('all')} className="text-xs text-gray-400 hover:text-gray-600">
                    × limpar filtro
                  </button>
                </div>
              )}

              {/* Empty state */}
              {blocks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <div className="text-6xl">📅</div>
                  <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Nenhum compromisso ainda</p>
                  <p className="text-sm text-gray-400 text-center max-w-xs">
                    Adicione seus horários fixos — aulas, trabalho, academia — para visualizar na agenda semanal!
                  </p>
                  <Button onClick={() => navigate('/schedule/new')} className="gap-2 mt-2">
                    <Plus className="h-4 w-4" /> Adicionar Compromisso
                  </Button>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  Nenhum compromisso em {DAYS_FULL[filterDay as number]}.
                </div>
              ) : (
                <div className="space-y-6">
                  {grouped.map(({ day, items }) => (
                    <div key={day} className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          {DAYS_FULL[day]}
                        </h2>
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                        <Badge variant="secondary" className="text-xs">{items.length}</Badge>
                      </div>
                      {items.map((block) => {
                        const cfg = BLOCK_COLORS[block.type] ?? BLOCK_COLORS[TimeBlockType.FIXED];
                        const durMin = timeToMin(block.endTime) - timeToMin(block.startTime);
                        return (
                          <Card key={block.id} className={cn('border shadow-sm group hover:shadow-md transition-shadow', cfg.border)}>
                            <CardContent className={cn('p-3 flex items-center gap-3 rounded-xl', cfg.bg)}>
                              <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', cfg.dot)} />
                              <div className="flex-1 min-w-0">
                                <p className={cn('font-medium text-sm', cfg.text)}>{block.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {block.startTime} — {block.endTime}
                                    <span className="text-gray-400 ml-1">
                                      ({Math.floor(durMin / 60)}h{durMin % 60 > 0 ? `${durMin % 60}min` : ''})
                                    </span>
                                  </span>
                                </div>
                              </div>
                              <Badge variant="outline" className={cn('text-xs shrink-0', cfg.text)}>
                                {BLOCK_TYPE_LABELS[block.type]}
                              </Badge>
                              <button
                                onClick={() => setBlockToDelete(block.id)}
                                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                              >
                                <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                              </button>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      <ConfirmDialog
        open={!!blockToDelete}
        title="Excluir compromisso"
        message="Tem certeza que deseja excluir esse horário fixo?"
        confirmLabel="Excluir"
        onConfirm={() => { if (blockToDelete) handleDelete(blockToDelete); setBlockToDelete(null); }}
        onCancel={() => setBlockToDelete(null)}
      />
    </>
  );
}
