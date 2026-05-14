import { useState, useEffect, useRef } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { useFocusModalStore } from '../store/focusModalStore';
import {
  useStartTaskSession,
  useCompleteTaskSession,
  useExtendTaskSession,
  useAbandonTaskSession,
} from '../hooks/useTaskTimer';
import { TaskCategory } from '../types';
import type { Achievement } from '../types';

type ModalPhase = 'preparation' | 'running' | 'expired' | 'reward';

const TIME_PILLS = [15, 30, 45, 60, 90, 120];
const CIRCUMFERENCE = 2 * Math.PI * 80;

const MOTIVATIONAL = [
  'Foco total! Você está indo muito bem.',
  'Cada minuto conta. Continue assim!',
  'Seu cérebro está trabalhando. Confie no processo.',
  'Uma tarefa de cada vez. Você consegue!',
  'O foco de hoje é a conquista de amanhã.',
  'Respira fundo. Você está progredindo.',
  'Pequenos passos levam a grandes conquistas.',
  'Você escolheu começar. Isso já é uma vitória.',
];

const CATEGORY_LABELS: Record<number, string> = {
  [TaskCategory.STUDY]: 'Estudos',
  [TaskCategory.WORK]: 'Trabalho',
  [TaskCategory.HOME]: 'Casa',
  [TaskCategory.HEALTH]: 'Saúde',
  [TaskCategory.LEISURE]: 'Lazer',
  [TaskCategory.OTHER]: 'Outros',
};

const PRIORITY_LABELS: Record<number, string> = { 0: 'Baixa', 1: 'Média', 2: 'Alta' };

function pillLabel(min: number): string {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${m}`;
}

export default function TaskFocusModal() {
  const { isOpen, activeTask: task, closeModal } = useFocusModalStore();

  const [phase, setPhase] = useState<ModalPhase>('preparation');
  const [selectedMinutes, setSelectedMinutes] = useState(30);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [timerTotal, setTimerTotal] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const [rewardXP, setRewardXP] = useState(0);
  const [rewardAchievements, setRewardAchievements] = useState<Achievement[]>([]);
  const [rewardOnTime, setRewardOnTime] = useState(false);

  const startTimeRef = useRef<Date | null>(null);

  const startSession = useStartTaskSession();
  const completeSession = useCompleteTaskSession();
  const extendSession = useExtendTaskSession();
  const abandonSession = useAbandonTaskSession();

  const isPomodoro = task?.category === TaskCategory.STUDY;
  const effectiveMinutes = isPomodoro ? 25 : selectedMinutes;

  // Reset when modal opens
  useEffect(() => {
    if (!isOpen || !task) return;
    setPhase('preparation');
    setSelectedMinutes(task.estimatedMinutes || 30);
    setSessionId(null);
    setSecondsLeft(0);
    setTimerTotal(0);
    setMsgIndex(0);
    setRewardXP(0);
    setRewardAchievements([]);
    setRewardOnTime(false);
    startTimeRef.current = null;
  }, [isOpen, task]);

  // Countdown
  useEffect(() => {
    if (phase !== 'running') return;
    const id = setInterval(() => {
      setSecondsLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Detect expiry
  useEffect(() => {
    if (phase === 'running' && secondsLeft === 0 && timerTotal > 0) {
      setPhase('expired');
    }
  }, [secondsLeft, phase, timerTotal]);

  // Motivational message rotation
  useEffect(() => {
    if (phase !== 'running') return;
    const id = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % MOTIVATIONAL.length);
    }, 60000);
    return () => clearInterval(id);
  }, [phase]);

  if (!isOpen || !task) return null;

  const formatTime = (secs: number) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const getActualMinutes = () =>
    startTimeRef.current
      ? Math.max(1, Math.round((Date.now() - startTimeRef.current.getTime()) / 60000))
      : effectiveMinutes;

  const arcOffset = timerTotal > 0 ? CIRCUMFERENCE * (1 - secondsLeft / timerTotal) : 0;

  const handleStart = async () => {
    const result = await startSession.mutateAsync({
      taskId: task.id,
      estimatedMinutes: effectiveMinutes,
    });
    const total = effectiveMinutes * 60;
    startTimeRef.current = new Date();
    setSessionId(result.sessionId);
    setSecondsLeft(total);
    setTimerTotal(total);
    setPhase('running');
  };

  const handleComplete = async (completedOnTime: boolean) => {
    if (!sessionId) return;
    const result = await completeSession.mutateAsync({
      sessionId,
      taskId: task.id,
      completedOnTime,
      actualMinutes: getActualMinutes(),
      estimatedMinutes: effectiveMinutes,
      category: task.category,
      priority: task.priority,
    });
    setRewardXP(result.xpEarned);
    setRewardAchievements(result.achievements);
    setRewardOnTime(result.completedOnTime);
    setPhase('reward');
  };

  const handleAbandon = async () => {
    if (!sessionId) return;
    if (!window.confirm('Tem certeza que quer abandonar esta sessão?')) return;
    await abandonSession.mutateAsync({ sessionId });
    closeModal();
  };

  const handleExtend = async (extraMinutes: number) => {
    if (!sessionId) return;
    await extendSession.mutateAsync({ sessionId, extraMinutes });
    const addedSecs = extraMinutes * 60;
    setSecondsLeft(prev => prev + addedSecs);
    setTimerTotal(prev => prev + addedSecs);
    setPhase('running');
  };

  return (
    <>
      <style>{`
        @keyframes pop-in {
          0%   { transform: scale(0); }
          70%  { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .animate-pop-in { animation: pop-in 400ms ease-out forwards; }
      `}</style>

      <div
        style={{ background: 'rgba(0,0,0,0.8)' }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          style={{ background: '#1A2236', maxWidth: '480px' }}
          className="w-full rounded-2xl p-6 relative"
        >
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
          >
            <X size={18} />
          </button>

          {/* STATE 1 — Preparation */}
          {phase === 'preparation' && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-[#F1F5F9] font-semibold text-lg pr-6">{task.title}</h2>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: 'rgba(99,102,241,0.15)', color: '#6366F1' }}
                  >
                    {CATEGORY_LABELS[task.category]}
                  </span>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ background: 'rgba(148,163,184,0.15)', color: '#94A3B8' }}
                  >
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[#94A3B8] text-sm mb-3">Quanto tempo você acha que leva?</p>

                {isPomodoro ? (
                  <div
                    className="rounded-lg p-3 text-sm"
                    style={{
                      background: 'rgba(99,102,241,0.1)',
                      border: '1px solid rgba(99,102,241,0.3)',
                      color: '#6366F1',
                    }}
                  >
                    Modo Pomodoro será ativado (25min)
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {TIME_PILLS.map(min => {
                      const active = selectedMinutes === min;
                      return (
                        <button
                          key={min}
                          onClick={() => setSelectedMinutes(min)}
                          style={{
                            background: active ? '#6366F1' : 'transparent',
                            color: active ? '#fff' : '#94A3B8',
                            borderColor: active ? '#6366F1' : '#475569',
                          }}
                          className="border rounded-full px-3 py-1 text-sm transition-colors"
                        >
                          {pillLabel(min)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                onClick={handleStart}
                disabled={startSession.isPending}
                style={{ background: '#6366F1' }}
                className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-60 transition-opacity"
              >
                {startSession.isPending ? 'Iniciando...' : 'Iniciar foco →'}
              </button>
            </div>
          )}

          {/* STATE 2 — Timer running */}
          {phase === 'running' && (
            <div className="flex flex-col items-center gap-5">
              <p className="text-[#94A3B8] text-sm text-center">{task.title}</p>

              <svg viewBox="0 0 200 200" width="180" height="180">
                <circle cx="100" cy="100" r="80" fill="none" stroke="#2D3748" strokeWidth="8" />
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="none"
                  stroke="#6366F1"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={arcOffset}
                  transform="rotate(-90 100 100)"
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
                <text
                  x="100"
                  y="108"
                  textAnchor="middle"
                  fill="#F1F5F9"
                  fontSize="28"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  {formatTime(secondsLeft)}
                </text>
              </svg>

              <p className="text-[#94A3B8] text-sm text-center min-h-[2.5rem]">
                {MOTIVATIONAL[msgIndex]}
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => handleComplete(true)}
                  disabled={completeSession.isPending}
                  style={{ background: '#6366F1' }}
                  className="flex-1 py-2.5 rounded-xl text-white font-semibold disabled:opacity-60"
                >
                  ✓ Concluí!
                </button>
                <button
                  onClick={handleAbandon}
                  disabled={abandonSession.isPending}
                  className="px-4 py-2.5 rounded-xl text-sm border border-red-500 text-red-400 disabled:opacity-60"
                >
                  Abandonar
                </button>
              </div>
            </div>
          )}

          {/* STATE 3 — Time expired */}
          {phase === 'expired' && (
            <div className="flex flex-col gap-5">
              <div className="text-center">
                <h2 className="text-[#F1F5F9] text-lg font-semibold">
                  O tempo acabou — e tá tudo bem!
                </h2>
                <p className="text-[#94A3B8] text-sm mt-1">
                  Às vezes as coisas levam mais tempo.
                </p>
              </div>

              <div className="flex gap-2">
                {[10, 20, 30].map(extra => (
                  <button
                    key={extra}
                    onClick={() => handleExtend(extra)}
                    disabled={extendSession.isPending}
                    style={{ borderColor: '#6366F1', color: '#6366F1' }}
                    className="flex-1 border py-2 rounded-xl text-sm font-medium disabled:opacity-60"
                  >
                    +{extra}min
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleComplete(false)}
                disabled={completeSession.isPending}
                style={{ background: '#6366F1' }}
                className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-60"
              >
                ✓ Já terminei assim mesmo
              </button>
            </div>
          )}

          {/* STATE 4 — Reward */}
          {phase === 'reward' && (
            <div className="flex flex-col items-center gap-5">
              <div className="animate-pop-in">
                <CheckCircle size={64} color={rewardOnTime ? '#22C55E' : '#94A3B8'} />
              </div>

              <div className="text-center">
                <h2 className="text-[#F1F5F9] text-lg font-semibold">
                  {rewardOnTime
                    ? 'Tarefa concluída no tempo! 🎯'
                    : 'Tarefa concluída! Você foi longe 💪'}
                </h2>
                <span
                  style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E' }}
                  className="inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold"
                >
                  +{rewardXP} XP
                </span>
              </div>

              {rewardAchievements.length > 0 && (
                <div className="w-full flex flex-col gap-2">
                  {rewardAchievements.map(a => (
                    <div
                      key={a.id}
                      style={{
                        background: 'rgba(99,102,241,0.08)',
                        border: '1px solid rgba(99,102,241,0.25)',
                      }}
                      className="flex items-center gap-3 rounded-lg p-3"
                    >
                      <span className="text-xl">{a.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#F1F5F9] text-sm font-medium truncate">{a.title}</p>
                        <p className="text-[#94A3B8] text-xs">{a.description}</p>
                      </div>
                      <span
                        style={{ background: 'rgba(99,102,241,0.15)', color: '#6366F1' }}
                        className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"
                      >
                        +{a.xpReward} XP
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={closeModal}
                style={{ background: '#6366F1' }}
                className="w-full py-3 rounded-xl text-white font-semibold"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
