import { useEffect } from 'react';
import { X, Pause, Play, Brain, Timer } from 'lucide-react';
import { useFloatingTimerStore } from '@/store/floatingTimerStore';
import { cn } from '@/lib/utils';

export default function FloatingTimer() {
  const { task, timeRemaining, durationMinutes, isRunning, isPomodoro, tick, pause, resume, stop } =
    useFloatingTimerStore();

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isRunning, tick]);

  if (!task) return null;

  const mins = String(Math.floor(timeRemaining / 60)).padStart(2, '0');
  const secs = String(timeRemaining % 60).padStart(2, '0');
  const done = timeRemaining === 0;
  const pct = durationMinutes > 0 ? Math.round((1 - timeRemaining / (durationMinutes * 60)) * 100) : 100;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-60 bg-base-200 border border-base-300 rounded-2xl shadow-2xl overflow-hidden">
      <div className="h-1 bg-base-300">
        <div
          className={cn(
            'h-full transition-all duration-1000 ease-linear',
            done ? 'bg-success' : isPomodoro ? 'bg-red-500' : 'bg-primary',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className={cn('flex items-center gap-1 text-xs mb-0.5', isPomodoro ? 'text-red-400' : 'text-primary/70')}>
              {isPomodoro ? <Brain size={11} /> : <Timer size={11} />}
              {isPomodoro ? 'Pomodoro' : 'Timer'}
            </div>
            <p className="text-sm font-medium text-base-content truncate">{task.title}</p>
          </div>
          <button onClick={stop} className="btn btn-ghost btn-xs btn-circle ml-2 flex-shrink-0">
            <X size={13} />
          </button>
        </div>

        <div className={cn(
          'text-4xl font-mono font-bold text-center tracking-widest mb-4',
          done ? 'text-success' : 'text-base-content',
        )}>
          {mins}:{secs}
        </div>

        {done ? (
          <p className="text-center text-sm text-success font-medium">Tempo esgotado!</p>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={isRunning ? pause : resume}
              className={cn('btn btn-sm gap-2', isPomodoro ? 'btn-error' : 'btn-primary')}
            >
              {isRunning ? <><Pause size={14} /> Pausar</> : <><Play size={14} /> Retomar</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
