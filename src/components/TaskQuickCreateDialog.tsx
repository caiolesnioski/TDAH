import { useState, useEffect } from 'react';
import { TimeInput } from '@/components/ui/IosWheelPicker';
import { X, BookOpen, Briefcase, Home, Heart, Gamepad2, MoreHorizontal } from 'lucide-react';
import dayjs from 'dayjs';
import { TaskCategory, TaskPriority, TaskStatus } from '@/types';
import { useCreateTask } from '@/hooks/useTasks';

interface TaskQuickCreateDialogProps {
  isOpen: boolean;
  date: string; // YYYY-MM-DD
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  { label: 'Estudos', value: TaskCategory.STUDY, Icon: BookOpen, color: 'var(--color-reward)' },
  { label: 'Trabalho', value: TaskCategory.WORK, Icon: Briefcase, color: 'var(--color-focus)' },
  { label: 'Casa', value: TaskCategory.HOME, Icon: Home, color: 'var(--color-done)' },
  { label: 'Saúde', value: TaskCategory.HEALTH, Icon: Heart, color: '#E8713C' },
  { label: 'Lazer', value: TaskCategory.LEISURE, Icon: Gamepad2, color: 'var(--color-action)' },
  { label: 'Outros', value: TaskCategory.OTHER, Icon: MoreHorizontal, color: 'var(--color-text-muted)' },
] as const;

const DURATIONS = [
  { label: '15min', value: 15 },
  { label: '25min', value: 25 },
  { label: '30min', value: 30 },
  { label: '45min', value: 45 },
  { label: '1h', value: 60 },
  { label: '1h30', value: 90 },
  { label: '2h', value: 120 },
];

const PRIORITIES = [
  { label: 'Alta', value: TaskPriority.HIGH, color: 'var(--color-alert)' },
  { label: 'Média', value: TaskPriority.MEDIUM, color: 'var(--color-action)' },
  { label: 'Baixa', value: TaskPriority.LOW, color: 'var(--color-text-muted)' },
] as const;

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
};

export function TaskQuickCreateDialog({ isOpen, date, onClose, onSuccess }: TaskQuickCreateDialogProps) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('09:00');
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory>(TaskCategory.STUDY);
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);

  const { mutateAsync: createTask, isPending } = useCreateTask();

  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setTime('09:00');
      setSelectedDuration(30);
      setSelectedCategory(TaskCategory.STUDY);
      setSelectedPriority(TaskPriority.MEDIUM);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!title.trim()) return;
    const dueDate = dayjs(`${date}T${time}`).toISOString();
    await createTask({
      title: title.trim(),
      category: selectedCategory,
      priority: selectedPriority,
      estimatedMinutes: selectedDuration,
      dueDate,
      status: TaskStatus.PENDING,
    });
    onSuccess();
    onClose();
  };

  const canSave = title.trim().length > 0 && !isPending;

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '24px',
          width: '100%', maxWidth: '440px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>
              Nova tarefa
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              {dayjs(date).format('MMMM D, YYYY')}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-muted)', padding: '4px', lineHeight: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '16px 0' }} />

        {/* Título */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '6px' }}>
            Título *
          </label>
          <input
            autoFocus
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
            placeholder="O que você precisa fazer?"
            style={fieldStyle}
          />
        </div>

        {/* Hora + Duração */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '6px' }}>
              Hora
            </label>
            <TimeInput
              value={time}
              onChange={e => setTime(e.target.value)}
              style={fieldStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '6px' }}>
              Duração
            </label>
            <select
              value={selectedDuration}
              onChange={e => setSelectedDuration(Number(e.target.value))}
              style={fieldStyle}
            >
              {DURATIONS.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Categoria */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '8px' }}>
            Categoria
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {CATEGORIES.map(cat => {
              const isActive = selectedCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    border: `1px solid ${isActive ? cat.color : 'var(--color-border)'}`,
                    background: isActive ? `${cat.color}22` : 'transparent',
                    color: isActive ? cat.color : 'var(--color-text-muted)',
                    fontSize: '12px', fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <cat.Icon size={13} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Prioridade */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '8px' }}>
            Prioridade
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {PRIORITIES.map(p => {
              const isActive = selectedPriority === p.value;
              return (
                <button
                  key={p.value}
                  onClick={() => setSelectedPriority(p.value)}
                  style={{
                    flex: 1,
                    padding: '7px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${isActive ? p.color : 'var(--color-border)'}`,
                    background: isActive ? `${p.color}22` : 'transparent',
                    color: isActive ? p.color : 'var(--color-text-muted)',
                    fontSize: '13px', fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '0 0 16px' }} />

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-text-muted)',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: canSave ? 'var(--color-action)' : 'var(--color-border)',
              color: canSave ? 'white' : 'var(--color-text-muted)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: canSave ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
            }}
          >
            {isPending ? 'Salvando...' : 'Salvar tarefa'}
          </button>
        </div>
      </div>
    </div>
  );
}
