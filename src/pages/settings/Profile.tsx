import { useState } from 'react';
import { TimeInput } from '@/components/ui/IosWheelPicker';
import { User, Mail, Moon, Sun, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

function loadSleepPrefs() {
  try { return JSON.parse(localStorage.getItem('sleepPrefs') ?? 'null') ?? { hours: 8, wake: '07:00', sleep: '23:00' }; }
  catch { return { hours: 8, wake: '07:00', sleep: '23:00' }; }
}

const cardStyle: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '12px',
  padding: '20px',
};

const inputStyle: React.CSSProperties = {
  background: 'var(--color-surface-2)',
  color: 'var(--color-text)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  padding: '8px 12px',
  width: '100%',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box' as const,
};

const labelStyle: React.CSSProperties = {
  color: 'var(--color-text-sec)',
  fontSize: '13px',
  fontWeight: 500,
  display: 'block',
  marginBottom: '4px',
};

const btnPrimary: React.CSSProperties = {
  background: 'var(--color-action)',
  color: '#1E1E1C',
  border: 'none',
  borderRadius: '8px',
  padding: '8px 16px',
  fontWeight: 500,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '14px',
};

export default function Profile() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [sleep, setSleep] = useState<{ hours: number; wake: string; sleep: string }>(loadSleepPrefs);

  const handleSaveName = async () => {
    if (!name.trim()) { toast.error('Nome não pode ser vazio'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { name: name.trim() } });
      if (error) throw error;
      if (user) setUser({ ...user, name: name.trim() });
      toast.success('Perfil atualizado!');
    } catch {
      toast.error('Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSleep = () => {
    localStorage.setItem('sleepPrefs', JSON.stringify(sleep));
    toast.success('Preferências de sono salvas! 😴');
  };

  const xp = 2450;
  const level = 8;
  const maxXP = 3000;
  const minXP = 2000;
  const pct = Math.round(((xp - minXP) / (maxXP - minXP)) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px', maxWidth: '640px', margin: '0 auto' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <User style={{ width: '28px', height: '28px', color: 'var(--color-focus)' }} />
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>Seu Perfil</h1>
      </div>

      {/* Informações Básicas */}
      <div style={cardStyle}>
        <h2 style={{ color: 'var(--color-text)', fontWeight: 600, fontSize: '15px', marginBottom: '16px', marginTop: 0 }}>
          Informações Básicas
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-action-bg)', color: 'var(--color-action)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700, flexShrink: 0 }}>
            {(name || user?.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={{ fontWeight: 600, color: 'var(--color-text)', margin: '0 0 4px 0' }}>{user?.name || 'Usuário'}</p>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>{user?.email}</p>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle} htmlFor="name">Nome</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              id="name"
              style={inputStyle}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
            />
            <button onClick={handleSaveName} disabled={saving} style={{ ...btnPrimary, flexShrink: 0, opacity: saving ? 0.7 : 1 }}>
              {saving
                ? <Loader2 style={{ width: '16px', height: '16px' }} className="animate-spin" />
                : <Save style={{ width: '16px', height: '16px' }} />
              }
              Salvar
            </button>
          </div>
        </div>

        <div>
          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Mail style={{ width: '14px', height: '14px' }} /> Email
          </label>
          <input style={{ ...inputStyle, opacity: 0.6 }} value={user?.email ?? ''} disabled />
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '6px' }}>O email não pode ser alterado aqui.</p>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />

      {/* Preferências de Sono */}
      <div style={cardStyle}>
        <h2 style={{ color: 'var(--color-text)', fontWeight: 600, fontSize: '15px', marginBottom: '16px', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Moon style={{ width: '16px', height: '16px', color: 'var(--color-reward)' }} /> Preferências de Sono
        </h2>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>
            Horas de sono necessárias:{' '}
            <span style={{ fontWeight: 700, color: 'var(--color-reward)' }}>{sleep.hours}h</span>
          </label>
          <input
            type="range" min={5} max={12} step={0.5}
            value={sleep.hours}
            onChange={(e) => setSleep((s) => ({ ...s, hours: Number(e.target.value) }))}
            style={{ width: '100%', accentColor: 'var(--color-action)', display: 'block', margin: '8px 0' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            <span>5h</span><span>12h</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sun style={{ width: '13px', height: '13px', color: 'var(--color-action)' }} /> Acordo às
            </label>
            <TimeInput
              value={sleep.wake}
              onChange={(e) => setSleep((s) => ({ ...s, wake: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Moon style={{ width: '13px', height: '13px', color: 'var(--color-reward)' }} /> Durmo às
            </label>
            <TimeInput
              value={sleep.sleep}
              onChange={(e) => setSleep((s) => ({ ...s, sleep: e.target.value }))}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ background: 'var(--color-focus-bg)', borderLeft: '3px solid var(--color-focus)', borderRadius: '8px', padding: '10px 14px', color: 'var(--color-text)', fontSize: '13px', marginBottom: '16px' }}>
          💡 Com base nisso, vamos sugerir horários ideais para suas tarefas e pausas!
        </div>

        <button onClick={handleSaveSleep} style={{ ...btnPrimary, width: '100%', justifyContent: 'center' }}>
          <Save style={{ width: '16px', height: '16px' }} /> Salvar Preferências de Sono
        </button>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />

      {/* Gamificação */}
      <div style={{ ...cardStyle, background: 'var(--color-action-bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-action)', color: '#1E1E1C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '20px', flexShrink: 0 }}>
            {level}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, color: 'var(--color-text)', margin: '0 0 2px 0' }}>Nível {level} — Focado Dedicado</p>
            <p style={{ fontSize: '13px', color: 'var(--color-text-sec)', margin: 0 }}>{xp} / {maxXP} XP</p>
          </div>
          <span style={{ background: 'var(--color-action)', color: '#1E1E1C', borderRadius: '999px', padding: '3px 10px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
            +{maxXP - xp} XP para nível 9
          </span>
        </div>
        <div style={{ width: '100%', background: 'rgba(0,0,0,0.08)', borderRadius: '999px', height: '10px', overflow: 'hidden' }}>
          <div style={{ height: '10px', borderRadius: '999px', background: 'var(--color-action)', width: `${pct}%`, transition: 'width 0.5s' }} />
        </div>
        <p style={{ fontSize: '12px', color: 'var(--color-text-sec)', marginTop: '8px', marginBottom: 0 }}>{pct}% para o próximo nível</p>
      </div>

    </div>
  );
}
