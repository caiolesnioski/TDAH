import { useState, useMemo, useEffect } from 'react';
import { useTimeBlocks } from '@/hooks/useTimeBlocks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Briefcase,
  GraduationCap,
  CalendarClock,
  Clock,
  CalendarRange,
} from 'lucide-react';
import { TimeBlockType } from '@/types';
import { cn } from '@/lib/utils';

// Configuração de cores por tipo de bloco
const BLOCK_TYPE_CONFIG = {
  [TimeBlockType.WORK]: {
    label: 'Trabalho',
    icon: Briefcase,
    bgColor: 'bg-blue-500',
    lightBg: 'bg-blue-100 dark:bg-blue-900/40',
    textColor: 'text-blue-700 dark:text-blue-300',
    borderColor: 'border-blue-400',
  },
  [TimeBlockType.CLASS]: {
    label: 'Aula',
    icon: GraduationCap,
    bgColor: 'bg-purple-500',
    lightBg: 'bg-purple-100 dark:bg-purple-900/40',
    textColor: 'text-purple-700 dark:text-purple-300',
    borderColor: 'border-purple-400',
  },
  [TimeBlockType.FIXED]: {
    label: 'Compromisso',
    icon: CalendarClock,
    bgColor: 'bg-orange-500',
    lightBg: 'bg-orange-100 dark:bg-orange-900/40',
    textColor: 'text-orange-700 dark:text-orange-300',
    borderColor: 'border-orange-400',
  },
  [TimeBlockType.TASK]: {
    label: 'Tarefa',
    icon: Clock,
    bgColor: 'bg-green-500',
    lightBg: 'bg-green-100 dark:bg-green-900/40',
    textColor: 'text-green-700 dark:text-green-300',
    borderColor: 'border-green-400',
  },
};

// Dias da semana (Segunda a Domingo para exibição)
const DAYS_OF_WEEK = [
  { value: 1, label: 'Segunda', short: 'Seg' },
  { value: 2, label: 'Terça', short: 'Ter' },
  { value: 3, label: 'Quarta', short: 'Qua' },
  { value: 4, label: 'Quinta', short: 'Qui' },
  { value: 5, label: 'Sexta', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
  { value: 0, label: 'Domingo', short: 'Dom' },
];

// Gerar horários de 6h às 23h com steps de 30min
const TIME_SLOTS: string[] = [];
for (let hour = 6; hour <= 23; hour++) {
  TIME_SLOTS.push(`${hour.toString().padStart(2, '0')}:00`);
  if (hour < 23) {
    TIME_SLOTS.push(`${hour.toString().padStart(2, '0')}:30`);
  }
}

// Meses em português
const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// Função para obter a segunda-feira da semana de uma data
const getMonday = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

// Função para formatar intervalo de datas
const formatWeekRange = (monday: Date): string => {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const startDay = monday.getDate();
  const endDay = sunday.getDate();
  const startMonth = MONTHS_PT[monday.getMonth()];
  const endMonth = MONTHS_PT[sunday.getMonth()];
  const year = monday.getFullYear();

  if (monday.getMonth() === sunday.getMonth()) {
    return `${startDay}-${endDay} ${startMonth} ${year}`;
  }
  return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
};

// Converter tempo (HH:mm) para minutos desde meia-noite
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Calcular posição e altura do bloco
const getBlockStyle = (block: TimeBlock): { top: string; height: string } => {
  const startMinutes = timeToMinutes(block.startTime);
  const endMinutes = timeToMinutes(block.endTime);
  const dayStartMinutes = 6 * 60; // 6:00

  const topOffset = ((startMinutes - dayStartMinutes) / 30) * 40; // 40px por slot de 30min
  const height = ((endMinutes - startMinutes) / 30) * 40;

  return {
    top: `${Math.max(0, topOffset)}px`,
    height: `${Math.max(40, height)}px`,
  };
};

// Verificar se um bloco é válido para uma data específica
const isBlockValidForDate = (block: TimeBlock, date: Date): boolean => {
  // Se não é recorrente ou não tem datas de validade, sempre é válido
  if (!block.isRecurring) return true;
  if (!block.validFrom && !block.validUntil) return true;

  // Normalizar a data para comparação (apenas ano/mês/dia)
  const dateStr = date.toISOString().split('T')[0];

  // Verificar validFrom
  if (block.validFrom) {
    const validFromStr = block.validFrom.split('T')[0];
    if (dateStr < validFromStr) return false;
  }

  // Verificar validUntil
  if (block.validUntil) {
    const validUntilStr = block.validUntil.split('T')[0];
    if (dateStr > validUntilStr) return false;
  }

  return true;
};

// Formatar data curta
const formatShortDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

export default function MyWeek() {
  const { data: blocks = [] } = useTimeBlocks();
  const [currentMonday, setCurrentMonday] = useState<Date>(() => getMonday(new Date()));
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  // Navegar semanas
  const goToPreviousWeek = () => {
    const newMonday = new Date(currentMonday);
    newMonday.setDate(currentMonday.getDate() - 7);
    setCurrentMonday(newMonday);
  };

  const goToNextWeek = () => {
    const newMonday = new Date(currentMonday);
    newMonday.setDate(currentMonday.getDate() + 7);
    setCurrentMonday(newMonday);
  };

  const goToToday = () => {
    setCurrentMonday(getMonday(new Date()));
  };

  // Calcular datas da semana atual
  const weekDates = useMemo(() => {
    return DAYS_OF_WEEK.map((day, index) => {
      const date = new Date(currentMonday);
      date.setDate(currentMonday.getDate() + index);
      return {
        ...day,
        date,
        dayNumber: date.getDate(),
        isToday: date.toDateString() === new Date().toDateString(),
      };
    });
  }, [currentMonday]);

  // Agrupar blocos por dia, filtrando por validade
  const blocksByDay = useMemo(() => {
    const grouped: Record<number, TimeBlock[]> = {};

    weekDates.forEach((dayInfo) => {
      grouped[dayInfo.value] = blocks
        // Filtrar pelo dia da semana
        .filter((b) => b.dayOfWeek === dayInfo.value)
        // Filtrar pelo horário válido (6h-24h)
        .filter((b) => {
          const startMinutes = timeToMinutes(b.startTime);
          return startMinutes >= 6 * 60 && startMinutes < 24 * 60;
        })
        // Filtrar pela validade da data
        .filter((b) => isBlockValidForDate(b, dayInfo.date))
        // Ordenar por horário
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    });

    return grouped;
  }, [blocks, weekDates]);

  // Contar total de blocos na semana
  const totalBlocksThisWeek = useMemo(() => {
    return Object.values(blocksByDay).reduce((sum, dayBlocks) => sum + dayBlocks.length, 0);
  }, [blocksByDay]);

  return (
    <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-7 w-7 text-focus-blue-500" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    Minha Semana
                    <Badge variant="secondary" className="text-xs">
                      {totalBlocksThisWeek} compromisso{totalBlocksThisWeek !== 1 ? 's' : ''}
                    </Badge>
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatWeekRange(currentMonday)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="text-focus-blue-600 border-focus-blue-300 hover:bg-focus-blue-50"
                >
                  Hoje
                </Button>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToPreviousWeek}
                    className="h-9 w-9"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={goToNextWeek}
                    className="h-9 w-9"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile: Seletor de dia */}
            <div className="flex md:hidden gap-1 overflow-x-auto pb-2">
              {weekDates.map((day, index) => {
                const dayBlockCount = blocksByDay[day.value]?.length || 0;
                return (
                  <Button
                    key={day.value}
                    variant={selectedDayIndex === index ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedDayIndex(index)}
                    className={cn(
                      'flex-shrink-0 flex-col h-auto py-2 px-3 relative',
                      selectedDayIndex === index &&
                        'bg-focus-blue-500 hover:bg-focus-blue-600',
                      day.isToday && selectedDayIndex !== index &&
                        'border-focus-blue-500 text-focus-blue-600'
                    )}
                  >
                    <span className="text-xs">{day.short}</span>
                    <span className="text-lg font-bold">{day.dayNumber}</span>
                    {dayBlockCount > 0 && (
                      <span className={cn(
                        'absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center',
                        selectedDayIndex === index
                          ? 'bg-white text-focus-blue-600'
                          : 'bg-focus-blue-500 text-white'
                      )}>
                        {dayBlockCount}
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>

            {/* Legenda */}
            <div className="flex flex-wrap gap-3">
              {Object.entries(BLOCK_TYPE_CONFIG).map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <div key={type} className="flex items-center gap-1.5">
                    <div className={cn('w-3 h-3 rounded', config.bgColor)} />
                    <Icon className={cn('h-4 w-4', config.textColor)} />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {config.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Grid Desktop: 7 colunas — scroll unificado, colunas não rolam individualmente */}
            <div className="hidden md:block overflow-y-auto rounded-lg" style={{ maxHeight: 'calc(100vh - 260px)' }}>
            <div className="grid grid-cols-7 gap-2">
              {weekDates.map((day) => {
                const dayBlocks = blocksByDay[day.value] || [];

                return (
                  <div
                    key={day.value}
                    className={cn(
                      'bg-base-200 rounded-xl shadow-md overflow-hidden border border-base-300',
                      day.isToday && 'ring-2 ring-focus-blue-500'
                    )}
                  >
                    <div className="py-2 px-3 bg-gray-50 dark:bg-gray-800">
                      <div className="text-sm font-medium flex items-center justify-between">
                        <span className={cn(day.isToday && 'text-focus-blue-600 dark:text-focus-blue-400')}>
                          {day.short}
                        </span>
                        <Badge
                          variant={day.isToday ? 'default' : 'outline'}
                          className={cn(
                            'text-xs h-6 w-6 p-0 flex items-center justify-center rounded-full',
                            day.isToday && 'bg-focus-blue-500'
                          )}
                        >
                          {day.dayNumber}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-0">
                      {/* Container com altura total do conteúdo — o scroll é no wrapper externo */}
                      <div
                        className="relative"
                        style={{ height: '1400px' }}
                      >
                        {/* Linhas de horário */}
                        <div className="absolute inset-0">
                          {TIME_SLOTS.map((slot, idx) => (
                            <div
                              key={slot}
                              className="h-10 border-b border-gray-100 dark:border-gray-700 flex items-start"
                            >
                              {idx % 2 === 0 && (
                                <span className="text-[10px] text-gray-400 pl-1 -mt-1">
                                  {slot}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Blocos */}
                        <div className="absolute inset-0 left-7">
                          {dayBlocks.map((block) => {
                            const config = BLOCK_TYPE_CONFIG[block.type];
                            const style = getBlockStyle(block);
                            const hasDateRange = block.validFrom || block.validUntil;

                            return (
                              <div
                                key={block.id}
                                className={cn(
                                  'absolute left-0 right-1 rounded-md px-1.5 py-1 overflow-hidden border-l-4',
                                  config.lightBg,
                                  config.borderColor
                                )}
                                style={style}
                                title={hasDateRange ? `Válido: ${formatShortDate(block.validFrom)} - ${formatShortDate(block.validUntil) || '∞'}` : undefined}
                              >
                                <p
                                  className={cn(
                                    'text-xs font-medium truncate',
                                    config.textColor
                                  )}
                                >
                                  {block.title}
                                </p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                  {block.startTime} - {block.endTime}
                                </p>
                                {hasDateRange && (
                                  <div className="flex items-center gap-0.5 mt-0.5">
                                    <CalendarRange className="h-2.5 w-2.5 text-gray-400" />
                                    <span className="text-[9px] text-gray-400">
                                      {formatShortDate(block.validFrom)}{block.validUntil ? ` - ${formatShortDate(block.validUntil)}` : ''}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Linha de hora atual */}
                        {(() => {
                          const h = now.getHours();
                          const m = now.getMinutes();
                          const totalMin = h * 60 + m;
                          if (totalMin < 6 * 60 || totalMin > 23 * 60) return null;
                          const top = ((totalMin - 6 * 60) / 30) * 40;
                          return (
                            <div
                              className="absolute left-0 right-0 z-20 pointer-events-none"
                              style={{ top: `${top}px` }}
                            >
                              <div className="relative h-0.5 bg-primary opacity-80 ml-7">
                                <div className="absolute -left-1 -top-[3px] w-2 h-2 bg-primary rounded-full" />
                              </div>
                            </div>
                          );
                        })()}

                        {/* Mensagem se não houver blocos */}
                        {dayBlocks.length === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <p className="text-xs text-gray-400">Livre</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            </div>

            {/* Mobile: 1 dia por vez */}
            <div className="md:hidden">
              {weekDates
                .filter((_, index) => index === selectedDayIndex)
                .map((day) => {
                  const dayBlocks = blocksByDay[day.value] || [];

                  return (
                    <div
                      key={day.value}
                      className={cn(
                        'bg-base-200 rounded-xl shadow-lg overflow-hidden border border-base-300',
                        day.isToday && 'ring-2 ring-focus-blue-500'
                      )}
                    >
                      <div className="py-3 px-4 bg-gray-50 dark:bg-gray-800">
                        <div className="text-base font-semibold flex items-center justify-between">
                          <span className={cn(day.isToday && 'text-focus-blue-600 dark:text-focus-blue-400')}>
                            {day.label}, {day.dayNumber}
                          </span>
                          {day.isToday && (
                            <Badge className="bg-focus-blue-500">Hoje</Badge>
                          )}
                        </div>
                      </div>
                      <div className="p-0">
                        <div
                          className="relative overflow-y-auto"
                          style={{ height: '60vh' }}
                        >
                          {/* Linhas de horário */}
                          <div className="absolute inset-0">
                            {TIME_SLOTS.map((slot, idx) => (
                              <div
                                key={slot}
                                className="h-10 border-b border-gray-100 dark:border-gray-700 flex items-start"
                              >
                                {idx % 2 === 0 && (
                                  <span className="text-xs text-gray-400 pl-2 -mt-1 w-12">
                                    {slot}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Blocos */}
                          <div className="absolute inset-0 left-14">
                            {dayBlocks.map((block) => {
                              const config = BLOCK_TYPE_CONFIG[block.type];
                              const Icon = config.icon;
                              const style = getBlockStyle(block);
                              const hasDateRange = block.validFrom || block.validUntil;

                              return (
                                <div
                                  key={block.id}
                                  className={cn(
                                    'absolute left-0 right-2 rounded-lg px-3 py-2 overflow-hidden border-l-4 shadow-sm',
                                    config.lightBg,
                                    config.borderColor
                                  )}
                                  style={style}
                                >
                                  <div className="flex items-center gap-2">
                                    <Icon className={cn('h-4 w-4 flex-shrink-0', config.textColor)} />
                                    <p
                                      className={cn(
                                        'text-sm font-medium truncate',
                                        config.textColor
                                      )}
                                    >
                                      {block.title}
                                    </p>
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {block.startTime} - {block.endTime}
                                  </p>
                                  {hasDateRange && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <CalendarRange className="h-3 w-3 text-gray-400" />
                                      <span className="text-[10px] text-gray-400">
                                        {formatShortDate(block.validFrom)}{block.validUntil ? ` - ${formatShortDate(block.validUntil)}` : ' em diante'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Mensagem se não houver blocos */}
                          {dayBlocks.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center text-gray-400">
                                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Nenhum compromisso</p>
                                <p className="text-xs">Dia livre!</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Resumo do dia (mobile) */}
            <div className="md:hidden">
              {(() => {
                const day = weekDates[selectedDayIndex];
                const dayBlocks = blocksByDay[day.value] || [];
                if (dayBlocks.length === 0) return null;

                // Calcular tempo total
                const totalMinutes = dayBlocks.reduce((sum, block) => {
                  const start = timeToMinutes(block.startTime);
                  const end = timeToMinutes(block.endTime);
                  return sum + (end - start);
                }, 0);
                const hours = Math.floor(totalMinutes / 60);
                const mins = totalMinutes % 60;

                return (
                  <div className="bg-base-200 rounded-xl border border-base-300 shadow-md">
                    <div className="py-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {dayBlocks.length} compromisso{dayBlocks.length !== 1 ? 's' : ''}
                        </p>
                        <p className="text-sm font-medium text-focus-blue-600 dark:text-focus-blue-400">
                          {hours}h{mins > 0 ? ` ${mins}min` : ''} ocupado{hours !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
  );
}
