import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

const WORK_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;
const RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function FocusTimer() {
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const isBreakRef = useRef(false);

  const total = isBreak ? BREAK_DURATION : WORK_DURATION;
  const progress = (total - timeLeft) / total;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');

  const tick = useCallback(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        setIsRunning(false);
        if (!isBreakRef.current) {
          setSessionCount((c) => c + 1);
          isBreakRef.current = true;
          setIsBreak(true);
          return BREAK_DURATION;
        } else {
          isBreakRef.current = false;
          setIsBreak(false);
          return WORK_DURATION;
        }
      }
      return prev - 1;
    });
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isRunning, tick]);

  const handleReset = () => {
    setIsRunning(false);
    isBreakRef.current = false;
    setIsBreak(false);
    setTimeLeft(WORK_DURATION);
  };

  const dotCount = Math.max(4, sessionCount + (sessionCount % 4 === 0 ? 0 : 4 - (sessionCount % 4)));

  return (
    <div className="flex flex-1 items-center justify-center min-h-[calc(100vh-3rem)] bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900">
          <div className="flex flex-col items-center gap-8 px-4 w-full max-w-sm">

            {/* Título */}
            <div className="text-center space-y-1">
              <div className="flex items-center gap-2 justify-center">
                {isBreak
                  ? <Coffee className="h-5 w-5 text-green-500" />
                  : <Brain className="h-5 w-5 text-blue-500" />
                }
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {isBreak ? 'Hora da Pausa' : 'Modo Foco'}
                </h1>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isBreak ? 'Descanse um pouco ☕' : 'Mantenha o foco 🧠'}
              </p>
            </div>

            {/* Timer circular */}
            <div className="relative w-52 h-52">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
                <circle
                  cx="100" cy="100" r={RADIUS}
                  fill="none" stroke="#2A3A55" strokeWidth="6"
                />
                <circle
                  cx="100" cy="100" r={RADIUS}
                  fill="none" stroke="#6366F1" strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                <span className="text-5xl font-bold font-mono tabular-nums text-gray-800 dark:text-white">
                  {minutes}:{seconds}
                </span>
                <span className="text-sm text-gray-400">
                  {isBreak ? 'pausa' : 'foco'}
                </span>
              </div>
            </div>

            {/* Controles */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={handleReset}
                title="Reiniciar"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                onClick={() => setIsRunning((r) => !r)}
                className={cn(
                  'h-16 w-16 rounded-full text-white shadow-lg',
                  isBreak
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-blue-500 hover:bg-blue-600'
                )}
              >
                {isRunning
                  ? <Pause className="h-7 w-7" />
                  : <Play className="h-7 w-7 translate-x-0.5" />
                }
              </Button>
              <div className="h-12 w-12" />
            </div>

            {/* Sessões completadas */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-2">
                {Array.from({ length: dotCount }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-2.5 h-2.5 rounded-full transition-colors',
                      i < sessionCount ? 'bg-primary' : 'bg-border'
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {sessionCount} pomodoro{sessionCount !== 1 ? 's' : ''} completado{sessionCount !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Dicas */}
            <Card className="w-full border-0 shadow-md bg-white dark:bg-gray-800">
              <CardContent className="p-4 space-y-1 text-sm text-gray-500 dark:text-gray-400">
                <p>🍅 <strong className="text-gray-700 dark:text-gray-300">25 min</strong> de foco concentrado</p>
                <p>☕ <strong className="text-gray-700 dark:text-gray-300">5 min</strong> de pausa</p>
                <p>🏆 A cada 4 sessões, faça uma pausa longa</p>
              </CardContent>
            </Card>

          </div>
        </div>
  );
}
