import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain } from 'lucide-react';

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
  const timerColor = isBreak ? 'var(--color-done)' : 'var(--color-action)';

  return (
    <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 3rem)', background: 'var(--color-bg)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', padding: '16px', width: '100%', maxWidth: '360px' }}>

        {/* Título */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '4px' }}>
            {isBreak
              ? <Coffee style={{ width: '20px', height: '20px', color: 'var(--color-done)' }} />
              : <Brain style={{ width: '20px', height: '20px', color: 'var(--color-focus)' }} />
            }
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
              {isBreak ? 'Hora da Pausa' : 'Modo Foco'}
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-text-sec)', margin: 0 }}>
            {isBreak ? 'Descanse um pouco ☕' : 'Mantenha o foco 🧠'}
          </p>
        </div>

        {/* Timer circular */}
        <div style={{ position: 'relative', width: '208px', height: '208px' }}>
          <svg
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}
            viewBox="0 0 200 200"
          >
            <circle cx="100" cy="100" r={RADIUS} fill="none" stroke="var(--color-border)" strokeWidth="6" />
            <circle
              cx="100" cy="100" r={RADIUS}
              fill="none"
              stroke={timerColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <span style={{ fontSize: '48px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-text)', lineHeight: 1 }}>
              {minutes}:{seconds}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              {isBreak ? 'pausa' : 'foco'}
            </span>
          </div>
        </div>

        {/* Controles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={handleReset}
            title="Reiniciar"
            style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'transparent', border: '1px solid var(--color-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text)' }}
          >
            <RotateCcw style={{ width: '20px', height: '20px' }} />
          </button>
          <button
            onClick={() => setIsRunning((r) => !r)}
            style={{ width: '64px', height: '64px', borderRadius: '50%', background: timerColor, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isBreak ? 'white' : '#1E1E1C', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
          >
            {isRunning
              ? <Pause style={{ width: '28px', height: '28px' }} />
              : <Play style={{ width: '28px', height: '28px', transform: 'translateX(2px)' }} />
            }
          </button>
          <div style={{ width: '48px', height: '48px' }} />
        </div>

        {/* Sessões completadas */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {Array.from({ length: dotCount }).map((_, i) => (
              <div
                key={i}
                style={{ width: '10px', height: '10px', borderRadius: '50%', background: i < sessionCount ? 'var(--color-action)' : 'var(--color-border)', transition: 'background 0.3s' }}
              />
            ))}
          </div>
          <span style={{ fontSize: '13px', color: 'var(--color-text-sec)' }}>
            {sessionCount} pomodoro{sessionCount !== 1 ? 's' : ''} completado{sessionCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Dicas */}
        <div style={{ width: '100%', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--color-text-sec)' }}>
            <p style={{ margin: 0 }}>🍅 <strong style={{ color: 'var(--color-text)' }}>25 min</strong> de foco concentrado</p>
            <p style={{ margin: 0 }}>☕ <strong style={{ color: 'var(--color-text)' }}>5 min</strong> de pausa</p>
            <p style={{ margin: 0 }}>🏆 A cada 4 sessões, faça uma pausa longa</p>
          </div>
        </div>

      </div>
    </div>
  );
}
