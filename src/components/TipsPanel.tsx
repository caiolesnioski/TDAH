import { useState } from 'react';
import { X } from 'lucide-react';
import { useTipsPanelStore } from '@/store/tipsPanelStore';
import { TIPS, getTodayTip, TIP_ICONS } from '@/lib/tips';
import type { Tip } from '@/lib/tips';
import TipModal from './TipModal';

export default function TipsPanel() {
  const { isOpen, close } = useTipsPanelStore();
  const [selectedTip, setSelectedTip] = useState<Tip | null>(null);
  const todayTip = getTodayTip();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 30 }}
          onClick={close}
        />
      )}

      {/* Painel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: '278px',
          background: 'var(--color-surface)',
          borderLeft: '1px solid var(--color-border)',
          zIndex: 40,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 200ms ease',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)' }}>
            Dicas para o Foco
          </span>
          <button
            onClick={close}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              padding: '4px',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Dica do dia em destaque */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--color-action)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            ✦ Dica de hoje
          </span>
          <div
            onClick={() => setSelectedTip(todayTip)}
            style={{
              marginTop: '8px',
              background: 'var(--color-action-bg)',
              borderLeft: '3px solid var(--color-action)',
              borderRadius: '0 8px 8px 0',
              padding: '10px 12px',
              cursor: 'pointer',
            }}
          >
            <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', margin: 0 }}>
              {todayTip.shortTitle}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--color-action)', marginTop: '4px', marginBottom: 0 }}>
              Ver como aplicar →
            </p>
          </div>
        </div>

        {/* Todas as dicas */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          <p
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '8px 16px 4px',
              margin: 0,
            }}
          >
            Todas as dicas
          </p>
          {TIPS.map((tip) => {
            const Icon = TIP_ICONS[tip.icon];
            const isToday = tip.id === todayTip.id;
            if (isToday) return null; // já aparece no destaque acima

            return (
              <div
                key={tip.id}
                onClick={() => setSelectedTip(tip)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--color-border)',
                  transition: 'background 150ms',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: tip.color + '22',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {Icon && <Icon size={16} style={{ color: tip.color }} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', margin: 0 }}>
                    {tip.shortTitle}
                  </p>
                  <p
                    style={{
                      fontSize: '11px',
                      color: 'var(--color-text-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '180px',
                      margin: 0,
                    }}
                  >
                    {tip.fullMessage.substring(0, 50)}...
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal da dica selecionada */}
      {selectedTip && (
        <TipModal
          tip={selectedTip}
          isOpen={!!selectedTip}
          onClose={() => setSelectedTip(null)}
          onAddTask={() => setSelectedTip(null)}
        />
      )}
    </>
  );
}
