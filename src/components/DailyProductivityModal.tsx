import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle2, ClipboardList, Sparkles, ArrowRight, Lightbulb } from 'lucide-react';
import type { Task } from '@/types';
import { getProductivityMessage, getTomorrowReminder } from '@/lib/productivityMessages';

export interface ProductivityStats {
  completed: number;
  total: number;
  completionRate: number; // 0 a 1
  incompleteTasks: Task[];
  xpEarned: number;
  isNextDay: boolean; // true = modal matinal (resumo de ontem)
}

interface DailyProductivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: ProductivityStats;
}

export default function DailyProductivityModal({ isOpen, onClose, stats }: DailyProductivityModalProps) {
  const navigate = useNavigate();

  // Sorteia mensagem e lembrete uma única vez por abertura (não a cada render)
  const message = useMemo(
    () => getProductivityMessage(stats.completionRate),
    [isOpen, stats.completionRate],
  );
  const reminder = useMemo(() => getTomorrowReminder(), [isOpen]);

  const pending = stats.total - stats.completed;

  // Dispara confetti em duas ondas ao abrir
  useEffect(() => {
    if (!isOpen) return;

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { x: 0.3, y: 0.6 },
      colors: ['#EF9F27', '#7F77DD', '#1D9E75', '#378ADD', '#D85A30'],
    });
    const t = setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { x: 0.7, y: 0.6 },
        colors: ['#EF9F27', '#7F77DD', '#1D9E75'],
      });
    }, 400);
    return () => clearTimeout(t);
  }, [isOpen]);

  // Fecha ao pressionar Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePlanTomorrow = () => {
    onClose();
    navigate('/planning/weekly');
  };

  const divider: React.CSSProperties = {
    borderTop: '1px solid var(--color-border)',
    margin: '20px 0',
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'prod-fade-in 150ms ease-out',
      }}
    >
      <style>{`
        @keyframes prod-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes prod-pop-in { from { opacity: 0; transform: scale(0.96) translateY(10px) } to { opacity: 1; transform: scale(1) translateY(0) } }
      `}</style>

      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '20px',
          padding: '32px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
          animation: 'prod-pop-in 200ms ease-out',
        }}
      >
        {/* Emoji de celebração */}
        <div style={{ fontSize: '44px', lineHeight: 1, marginBottom: '16px' }}>🎉</div>

        {/* Título grande */}
        <h2 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 12px 0', color: 'var(--color-text)', lineHeight: 1.2 }}>
          {message.title}
        </h2>

        {/* Subtítulo motivacional */}
        <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--color-text-sec)', margin: 0 }}>
          {message.subtitle}
        </p>

        <div style={divider} />

        {/* Métricas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 600, color: 'var(--color-text)' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--color-done)' }} />
              {stats.completed} {stats.completed === 1 ? 'tarefa concluída' : 'tarefas concluídas'}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--color-reward)',
                background: 'var(--color-reward-bg)',
                borderRadius: '999px',
                padding: '4px 12px',
              }}
            >
              <Sparkles size={14} />
              +{stats.xpEarned} XP
            </span>
          </div>

          {pending > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', color: 'var(--color-text-sec)' }}>
              <ClipboardList size={16} style={{ color: 'var(--color-text-muted)' }} />
              {pending} {pending === 1 ? 'tarefa pendente' : 'tarefas pendentes'}
            </span>
          )}
        </div>

        {/* Aviso: tarefas de ontem viraram prioridade alta (modal matinal) */}
        {stats.isNextDay && stats.incompleteTasks.length > 0 && (
          <>
            <div style={divider} />
            <div
              style={{
                background: 'var(--color-action-bg)',
                borderRadius: '12px',
                padding: '14px 16px',
                fontSize: '13px',
                lineHeight: 1.5,
                color: 'var(--color-text-sec)',
                textAlign: 'left',
              }}
            >
              As tarefas de ontem que ficaram pendentes viraram <strong style={{ color: 'var(--color-text)' }}>prioridade Alta</strong> hoje, prontas para você continuar de onde parou.
            </div>
          </>
        )}

        <div style={divider} />

        {/* Lembrete de preparar amanhã */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', textAlign: 'left' }}>
          <Lightbulb size={20} style={{ color: 'var(--color-action)', flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '14px', lineHeight: 1.55, color: 'var(--color-text-sec)', margin: 0 }}>
            {reminder}
          </p>
        </div>

        {/* Ações */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '11px 18px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              borderRadius: '10px',
              background: 'transparent',
              color: 'var(--color-text-sec)',
              border: '1px solid var(--color-border)',
            }}
          >
            Agora não
          </button>
          <button
            type="button"
            onClick={handlePlanTomorrow}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '11px 18px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '10px',
              border: 'none',
              background: 'var(--color-action)',
              color: '#1E1E1C',
            }}
          >
            Planejar amanhã
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
