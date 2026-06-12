import { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { getTodayTip, TIP_ICONS } from '@/lib/tips';
import TipModal from './TipModal';

export default function TipOfDayCard() {
  const [modalOpen, setModalOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const tip = getTodayTip();
  const Icon = TIP_ICONS[tip.icon] ?? Lightbulb;

  return (
    <>
      <div
        onClick={() => setModalOpen(true)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderLeft: `4px solid ${tip.color}`,
          borderRadius: '12px',
          padding: '16px 20px',
          cursor: 'pointer',
          transition: 'box-shadow 150ms',
          boxShadow: hover ? '0 4px 16px rgba(0,0,0,0.18)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Icon size={18} style={{ color: tip.color }} />
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
        <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)', lineHeight: 1.5, margin: 0 }}>
          {tip.shortTitle}
        </p>
        <p style={{ fontSize: '12px', color: 'var(--color-text-sec)', marginTop: '4px', marginBottom: 0 }}>
          Clique para ver como aplicar →
        </p>
      </div>

      <TipModal
        tip={tip}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAddTask={() => {}}
      />
    </>
  );
}
