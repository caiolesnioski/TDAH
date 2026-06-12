import { useEffect, useState } from 'react';
import { X, Lightbulb, CheckCircle2, Plus, Loader2, Check } from 'lucide-react';
import type { Tip } from '@/lib/tips';
import { TIP_ICONS } from '@/lib/tips';
import { useCreateTask } from '@/hooks/useTasks';
import type { Task } from '@/types';

interface TipModalProps {
  tip: Tip;
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Tip['suggestedTask']) => void;
}

export default function TipModal({ tip, isOpen, onClose, onAddTask }: TipModalProps) {
  const createTask = useCreateTask();
  const [added, setAdded] = useState(false);
  const Icon = TIP_ICONS[tip.icon] ?? Lightbulb;
  const paragraphs = tip.howToApply.split('\n\n');

  // Reseta o estado de "adicionada" sempre que o modal abre ou muda de dica
  useEffect(() => {
    if (isOpen) setAdded(false);
  }, [isOpen, tip.id]);

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

  const handleAdd = async () => {
    try {
      await createTask.mutateAsync({
        title: tip.suggestedTask.title,
        category: tip.suggestedTask.category as Task['category'],
        priority: tip.suggestedTask.priority as Task['priority'],
        estimatedMinutes: tip.suggestedTask.estimatedMinutes,
      });
      setAdded(true);
      onAddTask(tip.suggestedTask);
      setTimeout(onClose, 1500);
    } catch {
      // Mantém o modal aberto em caso de erro para o usuário tentar novamente
    }
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
        zIndex: 2000,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'tip-fade-in 150ms ease-out',
      }}
    >
      <style>{`
        @keyframes tip-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes tip-pop-in { from { opacity: 0; transform: scale(0.96) translateY(8px) } to { opacity: 1; transform: scale(1) translateY(0) } }
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
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
          animation: 'tip-pop-in 180ms ease-out',
        }}
      >
        {/* Cabeçalho: ícone grande + botão fechar */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'var(--color-surface-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon size={26} style={{ color: tip.color }} />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Título curto */}
        <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--color-text)', lineHeight: 1.25 }}>
          {tip.shortTitle}
        </h2>

        {/* Mensagem completa em itálico */}
        <p style={{ fontStyle: 'italic', fontSize: '15px', lineHeight: 1.6, color: 'var(--color-text-sec)', margin: 0 }}>
          “{tip.fullMessage}”
        </p>

        <div style={divider} />

        {/* Como aplicar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Lightbulb size={18} style={{ color: tip.color }} />
          <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: 'var(--color-text)' }}>
            Como aplicar isso
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {paragraphs.map((para, i) => (
            <p key={i} style={{ fontSize: '14px', lineHeight: 1.65, color: 'var(--color-text-sec)', margin: 0 }}>
              {para}
            </p>
          ))}
        </div>

        <div style={divider} />

        {/* Tarefa sugerida */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <CheckCircle2 size={18} style={{ color: 'var(--color-done)' }} />
          <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: 'var(--color-text)' }}>
            Tarefa sugerida
          </h3>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            borderRadius: '10px',
            padding: '12px 14px',
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>
            {tip.suggestedTask.title}
          </span>
          <span
            style={{
              flexShrink: 0,
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              whiteSpace: 'nowrap',
            }}
          >
            {tip.suggestedTask.estimatedMinutes}min
          </span>
        </div>

        {/* Ações */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              borderRadius: '8px',
              background: 'transparent',
              color: 'var(--color-text-sec)',
              border: '1px solid var(--color-border)',
            }}
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={createTask.isPending || added}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: createTask.isPending || added ? 'default' : 'pointer',
              borderRadius: '8px',
              border: 'none',
              background: added ? 'var(--color-done)' : 'var(--color-action)',
              color: added ? '#fff' : '#1E1E1C',
              opacity: createTask.isPending ? 0.7 : 1,
              transition: 'background 200ms',
            }}
          >
            {added ? (
              <>
                <Check size={16} />
                Tarefa adicionada!
              </>
            ) : createTask.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Adicionando…
              </>
            ) : (
              <>
                <Plus size={16} />
                Adicionar esta tarefa
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
