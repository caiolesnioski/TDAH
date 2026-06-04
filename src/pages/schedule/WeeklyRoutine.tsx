import { useState } from 'react';
import {
  Clock,
  Plus,
  Trash2,
  Briefcase,
  GraduationCap,
  CalendarClock,
  CalendarRange,
  Save,
  RotateCcw,
} from 'lucide-react';
import { TimeBlockType } from '@/types';
import type { TimeBlock } from '@/types';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Segunda', short: 'Seg' },
  { value: 2, label: 'Terça', short: 'Ter' },
  { value: 3, label: 'Quarta', short: 'Qua' },
  { value: 4, label: 'Quinta', short: 'Qui' },
  { value: 5, label: 'Sexta', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
];

const BLOCK_TYPE_CONFIG = {
  [TimeBlockType.WORK]: {
    label: 'Trabalho',
    icon: Briefcase,
    borderColor: 'var(--color-focus)',
    bg: 'var(--color-focus-bg)',
    textColor: 'var(--color-focus)',
  },
  [TimeBlockType.CLASS]: {
    label: 'Aula',
    icon: GraduationCap,
    borderColor: 'var(--color-reward)',
    bg: 'var(--color-reward-bg)',
    textColor: 'var(--color-reward)',
  },
  [TimeBlockType.FIXED]: {
    label: 'Compromisso',
    icon: CalendarClock,
    borderColor: 'var(--color-action)',
    bg: 'var(--color-action-bg)',
    textColor: 'var(--color-action)',
  },
  [TimeBlockType.TASK]: {
    label: 'Tarefa',
    icon: Clock,
    borderColor: 'var(--color-done)',
    bg: 'var(--color-done-bg)',
    textColor: 'var(--color-done)',
  },
};

const generateId = () => Math.random().toString(36).substring(2, 9);

const loadBlocks = (): TimeBlock[] => {
  try {
    const saved = localStorage.getItem('weeklyRoutine');
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return [];
};

const saveBlocks = (blocks: TimeBlock[]) => {
  localStorage.setItem('weeklyRoutine', JSON.stringify(blocks));
};

const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

interface NewBlockForm {
  title: string;
  type: TimeBlockType;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  validFrom: string;
  validUntil: string;
}

function ConfirmModal({ open, title, message, confirmLabel, onConfirm, onCancel }: {
  open: boolean; title: string; message: string; confirmLabel: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '90%' }}>
        <h3 style={{ color: 'var(--color-text)', fontWeight: 600, fontSize: '16px', margin: '0 0 8px 0' }}>{title}</h3>
        <p style={{ color: 'var(--color-text-sec)', fontSize: '14px', margin: '0 0 20px 0' }}>{message}</p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{ background: 'transparent', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '14px' }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{ background: 'transparent', color: 'var(--color-alert)', border: '1px solid var(--color-alert)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

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

export default function WeeklyRoutine() {
  const [blocks, setBlocks] = useState<TimeBlock[]>(loadBlocks);
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const [newBlock, setNewBlock] = useState<NewBlockForm>({
    title: '',
    type: TimeBlockType.WORK,
    daysOfWeek: [1],
    startTime: '09:00',
    endTime: '18:00',
    isRecurring: true,
    validFrom: today,
    validUntil: '',
  });

  const toggleDay = (dayValue: number) => {
    setNewBlock((prev) => {
      const isSelected = prev.daysOfWeek.includes(dayValue);
      if (isSelected) {
        if (prev.daysOfWeek.length === 1) return prev;
        return { ...prev, daysOfWeek: prev.daysOfWeek.filter((d) => d !== dayValue) };
      }
      return { ...prev, daysOfWeek: [...prev.daysOfWeek, dayValue].sort((a, b) => a - b) };
    });
  };

  const selectWeekdays = () => setNewBlock((prev) => ({ ...prev, daysOfWeek: [1, 2, 3, 4, 5] }));
  const selectAllDays = () => setNewBlock((prev) => ({ ...prev, daysOfWeek: [0, 1, 2, 3, 4, 5, 6] }));

  const handleAddBlock = () => {
    if (!newBlock.title.trim()) return;
    if (newBlock.daysOfWeek.length === 0) return;

    const newBlocks: TimeBlock[] = newBlock.daysOfWeek.map((day) => ({
      id: generateId(),
      title: newBlock.title,
      type: newBlock.type,
      dayOfWeek: day as 0 | 1 | 2 | 3 | 4 | 5 | 6,
      startTime: newBlock.startTime,
      endTime: newBlock.endTime,
      isRecurring: newBlock.isRecurring,
      validFrom: newBlock.isRecurring ? newBlock.validFrom : undefined,
      validUntil: newBlock.isRecurring && newBlock.validUntil ? newBlock.validUntil : undefined,
    }));

    const updatedBlocks = [...blocks, ...newBlocks];
    setBlocks(updatedBlocks);
    saveBlocks(updatedBlocks);

    setNewBlock({
      title: '',
      type: TimeBlockType.WORK,
      daysOfWeek: [1],
      startTime: '09:00',
      endTime: '18:00',
      isRecurring: true,
      validFrom: today,
      validUntil: '',
    });
    setShowAddForm(false);
  };

  const handleRemoveBlock = (id: string) => {
    const updatedBlocks = blocks.filter((b) => b.id !== id);
    setBlocks(updatedBlocks);
    saveBlocks(updatedBlocks);
  };

  const handleClearAll = () => {
    setBlocks([]);
    localStorage.removeItem('weeklyRoutine');
  };

  const blocksByDay = DAYS_OF_WEEK.map((day) => ({
    ...day,
    blocks: blocks
      .filter((b) => b.dayOfWeek === day.value)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }));

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px', background: 'var(--color-bg)', minHeight: '100vh' }}>

        {/* Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 4px 0' }}>
              <Clock style={{ width: '22px', height: '22px', color: 'var(--color-focus)' }} />
              Minha Rotina Semanal
            </h1>
            <p style={{ color: 'var(--color-text-sec)', fontSize: '14px', margin: 0 }}>
              Configure seus horários fixos de trabalho, aulas e compromissos.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setConfirmClearAll(true)}
              disabled={blocks.length === 0}
              style={{ background: 'transparent', color: 'var(--color-alert)', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: blocks.length === 0 ? 'not-allowed' : 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', opacity: blocks.length === 0 ? 0.4 : 1 }}
            >
              <RotateCcw style={{ width: '15px', height: '15px' }} />
              Limpar Tudo
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              style={{ background: 'var(--color-action)', color: '#1E1E1C', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontWeight: 500, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus style={{ width: '16px', height: '16px' }} />
              Adicionar Horário
            </button>
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div style={{ background: 'var(--color-surface)', border: '2px dashed var(--color-focus)', borderRadius: '12px', padding: '20px' }}>
            <h2 style={{ color: 'var(--color-text)', fontWeight: 600, fontSize: '16px', marginBottom: '16px', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus style={{ width: '18px', height: '18px', color: 'var(--color-focus)' }} />
              Novo Horário
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle} htmlFor="title">Título</label>
                <input
                  id="title"
                  style={inputStyle}
                  placeholder="Ex: Trabalho, Faculdade, Estágio..."
                  value={newBlock.title}
                  onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })}
                />
              </div>
              <div>
                <label style={labelStyle} htmlFor="type">Tipo</label>
                <select
                  id="type"
                  value={newBlock.type}
                  onChange={(e) => setNewBlock({ ...newBlock, type: e.target.value as TimeBlockType })}
                  style={{ ...inputStyle, height: '37px' }}
                >
                  {Object.entries(BLOCK_TYPE_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dias da Semana */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Dias da Semana</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={selectWeekdays}
                    style={{ background: 'transparent', color: 'var(--color-text-sec)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '3px 10px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Seg–Sex
                  </button>
                  <button
                    type="button"
                    onClick={selectAllDays}
                    style={{ background: 'transparent', color: 'var(--color-text-sec)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '3px 10px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    Todos
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = newBlock.daysOfWeek.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        border: isSelected ? '2px solid var(--color-focus)' : '2px solid var(--color-border)',
                        background: isSelected ? 'var(--color-focus-bg)' : 'var(--color-surface-2)',
                        color: isSelected ? 'var(--color-focus)' : 'var(--color-text-sec)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {day.short}
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '6px', marginBottom: 0 }}>
                {newBlock.daysOfWeek.length === 1 ? '1 dia selecionado' : `${newBlock.daysOfWeek.length} dias selecionados`}
              </p>
            </div>

            {/* Horários */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle} htmlFor="start">Hora Início</label>
                <input
                  id="start" type="time"
                  value={newBlock.startTime}
                  onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle} htmlFor="end">Hora Fim</label>
                <input
                  id="end" type="time"
                  value={newBlock.endTime}
                  onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Repetição */}
            <div style={{ background: 'var(--color-surface-2)', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: newBlock.isRecurring ? '16px' : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CalendarRange style={{ width: '16px', height: '16px', color: 'var(--color-focus)' }} />
                  <label style={{ ...labelStyle, marginBottom: 0, fontWeight: 500 }}>Repetir toda semana</label>
                </div>
                <input
                  type="checkbox"
                  checked={newBlock.isRecurring}
                  onChange={(e) => setNewBlock({ ...newBlock, isRecurring: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--color-action)', cursor: 'pointer' }}
                />
              </div>

              {newBlock.isRecurring && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={labelStyle} htmlFor="validFrom">A partir de</label>
                    <input
                      id="validFrom" type="date"
                      value={newBlock.validFrom}
                      onChange={(e) => setNewBlock({ ...newBlock, validFrom: e.target.value })}
                      min={today}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle} htmlFor="validUntil">Até (opcional)</label>
                    <input
                      id="validUntil" type="date"
                      value={newBlock.validUntil}
                      onChange={(e) => setNewBlock({ ...newBlock, validUntil: e.target.value })}
                      min={newBlock.validFrom || today}
                      style={inputStyle}
                    />
                    <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px', marginBottom: 0 }}>
                      Deixe vazio para repetir indefinidamente
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Botões do form */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleAddBlock}
                disabled={!newBlock.title.trim() || newBlock.daysOfWeek.length === 0}
                style={{ flex: 1, background: 'var(--color-action)', color: '#1E1E1C', border: 'none', borderRadius: '8px', padding: '9px 16px', cursor: !newBlock.title.trim() ? 'not-allowed' : 'pointer', fontWeight: 500, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: !newBlock.title.trim() ? 0.6 : 1 }}
              >
                <Save style={{ width: '16px', height: '16px' }} />
                Salvar {newBlock.daysOfWeek.length > 1 ? `(${newBlock.daysOfWeek.length} dias)` : ''}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                style={{ background: 'transparent', color: 'var(--color-text)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '9px 16px', cursor: 'pointer', fontSize: '14px' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Weekly Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
          {blocksByDay.map((day) => (
            <div key={day.value} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>{day.label}</span>
                <span style={{ background: 'var(--color-action-bg)', color: 'var(--color-action)', borderRadius: '999px', padding: '1px 8px', fontSize: '12px', fontWeight: 500 }}>
                  {day.blocks.length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '120px' }}>
                {day.blocks.length > 0 ? (
                  day.blocks.map((block) => {
                    const config = BLOCK_TYPE_CONFIG[block.type];
                    const Icon = config.icon;
                    return (
                      <div
                        key={block.id}
                        style={{ padding: '6px 8px', borderRadius: '8px', background: config.bg, borderLeft: `3px solid ${config.borderColor}`, fontSize: '12px', position: 'relative' }}
                        className="group"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                          <Icon style={{ width: '11px', height: '11px', color: config.textColor, flexShrink: 0 }} />
                          <span style={{ fontWeight: 500, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{block.title}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-sec)' }}>
                          {block.startTime} - {block.endTime}
                        </div>
                        {block.isRecurring && (block.validFrom || block.validUntil) && (
                          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                            {block.validFrom && formatDate(block.validFrom)}
                            {block.validUntil && ` - ${formatDate(block.validUntil)}`}
                          </div>
                        )}
                        <button
                          onClick={() => setBlockToDelete(block.id)}
                          style={{ position: 'absolute', top: '4px', right: '4px', opacity: 0, background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-alert)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                        >
                          <Trash2 style={{ width: '12px', height: '12px' }} />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--color-text-muted)', fontSize: '12px' }}>
                    Nenhum horário
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Resumo */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ color: 'var(--color-text)', fontWeight: 600, fontSize: '16px', marginBottom: '16px', marginTop: 0 }}>Resumo da Semana</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
            {Object.entries(BLOCK_TYPE_CONFIG).map(([type, config]) => {
              const count = blocks.filter((b) => b.type === type).length;
              const Icon = config.icon;
              return (
                <div key={type} style={{ padding: '16px', borderRadius: '10px', background: config.bg, borderLeft: `3px solid ${config.borderColor}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Icon style={{ width: '18px', height: '18px', color: config.textColor }} />
                    <span style={{ fontWeight: 500, fontSize: '14px', color: 'var(--color-text)' }}>{config.label}</span>
                  </div>
                  <p style={{ fontSize: '24px', fontWeight: 700, color: config.textColor, margin: '0 0 2px 0' }}>{count}</p>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>horários</p>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      <ConfirmModal
        open={confirmClearAll}
        title="Limpar toda a rotina"
        message="Tem certeza que deseja remover todos os horários? Essa ação não pode ser desfeita."
        confirmLabel="Limpar Tudo"
        onConfirm={() => { handleClearAll(); setConfirmClearAll(false); }}
        onCancel={() => setConfirmClearAll(false)}
      />

      <ConfirmModal
        open={!!blockToDelete}
        title="Remover horário"
        message="Tem certeza que deseja remover esse horário da sua rotina?"
        confirmLabel="Remover"
        onConfirm={() => {
          if (blockToDelete) handleRemoveBlock(blockToDelete);
          setBlockToDelete(null);
        }}
        onCancel={() => setBlockToDelete(null)}
      />
    </>
  );
}
