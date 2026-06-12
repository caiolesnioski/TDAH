import { useEffect, useState } from 'react';
import { X, Lightbulb } from 'lucide-react';
import { getTodayTip, TIP_ICONS } from '@/lib/tips';
import TipModal from './TipModal';

const STORAGE_KEY = 'tip_shown_date';

export default function TipToast() {
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const tip = getTodayTip();
  const Icon = TIP_ICONS[tip.icon] ?? Lightbulb;

  // Aparece 3s após montar — apenas uma vez por dia
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (localStorage.getItem(STORAGE_KEY) === today) return;

    const showTimer = setTimeout(() => {
      setVisible(true);
      // Marca como exibida hoje assim que aparece, garantindo "uma vez por dia"
      localStorage.setItem(STORAGE_KEY, today);
    }, 3000);

    return () => clearTimeout(showTimer);
  }, []);

  // Auto-fecha após 8s se não interagir
  useEffect(() => {
    if (!visible) return;
    const hideTimer = setTimeout(() => setVisible(false), 8000);
    return () => clearTimeout(hideTimer);
  }, [visible]);

  const openModal = () => {
    setVisible(false);
    setModalOpen(true);
  };

  return (
    <>
      {visible && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '24px',
            zIndex: 1500,
            width: '300px',
            maxWidth: 'calc(100vw - 48px)',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderLeft: `4px solid ${tip.color}`,
            borderRadius: '12px',
            padding: '14px 16px',
            boxShadow: '0 8px 28px rgba(0,0,0,0.28)',
            animation: 'tip-toast-in 280ms ease-out',
          }}
        >
          <style>{`
            @keyframes tip-toast-in {
              from { opacity: 0; transform: translateY(16px) }
              to { opacity: 1; transform: translateY(0) }
            }
          `}</style>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon size={16} style={{ color: tip.color }} />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Dica do dia
              </span>
            </div>
            <button
              type="button"
              onClick={() => setVisible(false)}
              aria-label="Fechar"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
          </div>

          <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)', lineHeight: 1.4, margin: '0 0 10px 0' }}>
            {tip.shortTitle}
          </p>

          <button
            type="button"
            onClick={openModal}
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: tip.color,
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            Saiba como aplicar →
          </button>
        </div>
      )}

      <TipModal
        tip={tip}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAddTask={() => {}}
      />
    </>
  );
}
