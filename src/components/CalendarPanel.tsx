import { useState } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useCalendarPanelStore } from '@/store/calendarPanelStore';
import { useTasks } from '@/hooks/useTasks';
import { useTimeBlocks } from '@/hooks/useTimeBlocks';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 || 12;
  return m === 0 ? `${hour}${suffix}` : `${hour}:${m.toString().padStart(2, '0')}${suffix}`;
}

function buildGrid(currentMonth: Dayjs): Dayjs[] {
  const start = currentMonth.startOf('month').startOf('week');
  return Array.from({ length: 42 }, (_, i) => start.add(i, 'day'));
}

export function CalendarPanel() {
  const { isOpen, selectedDate, selectDate, close } = useCalendarPanelStore();
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(() => dayjs().startOf('month'));
  const { data: tasks = [] } = useTasks();
  const { data: timeBlocks = [] } = useTimeBlocks();

  const today = dayjs().format('YYYY-MM-DD');
  const activeDate = selectedDate ?? today;
  const days = buildGrid(currentMonth);

  function hasEvents(dateStr: string) {
    const dow = dayjs(dateStr).day();
    return (
      tasks.some((t) => t.dueDate === dateStr) ||
      timeBlocks.some((b) => b.dayOfWeek === dow)
    );
  }

  function dayButtonClass(day: Dayjs, dateStr: string) {
    const isCurrentMonth = day.month() === currentMonth.month();
    const isToday = dateStr === today;
    const isSelected = dateStr === activeDate;

    if (isSelected && isToday) {
      return 'w-8 h-8 rounded-full text-xs flex items-center justify-center bg-primary text-primary-content font-medium ring-2 ring-primary ring-offset-1 ring-offset-base-200';
    }
    if (isSelected) {
      return 'w-8 h-8 rounded-full text-xs flex items-center justify-center bg-primary/20 border border-primary text-base-content';
    }
    if (isToday) {
      return 'w-8 h-8 rounded-full text-xs flex items-center justify-center bg-primary text-primary-content font-medium';
    }
    if (!isCurrentMonth) {
      return 'w-8 h-8 rounded-full text-xs flex items-center justify-center text-base-content/25 hover:bg-base-300 transition-colors';
    }
    return 'w-8 h-8 rounded-full text-xs flex items-center justify-center hover:bg-base-300 transition-colors';
  }

  const selectedDow = dayjs(activeDate).day();
  const dayTasks = tasks.filter((t) => t.dueDate === activeDate && t.status !== 3);
  const dayBlocks = timeBlocks.filter((b) => b.dayOfWeek === selectedDow);
  const hasActivities = dayTasks.length > 0 || dayBlocks.length > 0;

  return (
    <>
      {/* Overlay — fechar ao clicar fora */}
      {isOpen && (
        <div className="fixed inset-0 z-30" onClick={close} />
      )}

      <div
        className={`fixed top-0 right-0 h-screen w-[278px] bg-base-200 border-l border-base-300 z-40 flex flex-col transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Cabeçalho com título e botão X */}
        <div className="flex items-center justify-between px-4 pt-4 pb-0 shrink-0">
          <span className="text-sm font-semibold text-base-content/80">Calendário</span>
          <button onClick={close} className="btn btn-ghost btn-xs btn-circle">
            <X size={14} />
          </button>
        </div>

      {/* Mini Calendar */}
      <div className="p-4 border-b border-base-300 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setCurrentMonth((m) => m.subtract(1, 'month'))}
            className="btn btn-ghost btn-xs btn-circle"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-sm font-medium">
            {currentMonth.format('MMMM YYYY')}
          </span>
          <button
            onClick={() => setCurrentMonth((m) => m.add(1, 'month'))}
            className="btn btn-ghost btn-xs btn-circle"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="w-8 h-6 flex items-center justify-center text-xs text-base-content/40"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-0.5">
          {days.map((day, i) => {
            const dateStr = day.format('YYYY-MM-DD');
            const dot = hasEvents(dateStr);
            return (
              <div key={i} className="flex flex-col items-center">
                <button
                  onClick={() => selectDate(dateStr)}
                  className={dayButtonClass(day, dateStr)}
                >
                  {day.date()}
                </button>
                <div className={`w-1 h-1 rounded-full mt-0.5 ${dot ? 'bg-warning' : 'invisible'}`} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Activities */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-base-300 shrink-0">
          <span className="text-sm font-medium">
            {dayjs(activeDate).format('MMMM D, YYYY')}
          </span>
          <button className="btn btn-ghost btn-xs btn-circle">
            <Plus size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {!hasActivities ? (
            <div className="flex items-center justify-center h-full text-base-content/40 text-sm">
              Nenhuma atividade
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {dayBlocks.map((block) => (
                <div
                  key={block.id}
                  className="flex items-stretch gap-2 px-2 py-2 rounded-lg hover:bg-base-300 transition-colors min-h-[52px]"
                >
                  <div className="w-1 rounded-full bg-primary shrink-0" />
                  <div className="flex flex-col justify-center min-w-0">
                    <span className="text-sm font-medium truncate">{block.title}</span>
                    <span className="text-xs text-base-content/50">
                      {formatTime(block.startTime)} - {formatTime(block.endTime)}
                    </span>
                  </div>
                </div>
              ))}
              {dayTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-stretch gap-2 px-2 py-2 rounded-lg hover:bg-base-300 transition-colors min-h-[52px]"
                >
                  <div className="w-1 rounded-full bg-warning shrink-0" />
                  <div className="flex flex-col justify-center min-w-0">
                    <span className="text-sm font-medium truncate">{task.title}</span>
                    <span className="text-xs text-base-content/50">
                      {dayjs(activeDate).format('MMM D')} · tarefa
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
