import { useState, useRef, useEffect, useMemo, forwardRef } from 'react';
import dayjs from 'dayjs';

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEM_H = 44;
const VISIBLE = 5;
const DRUM_H = ITEM_H * VISIBLE; // 220px

// ─── WheelColumn ─────────────────────────────────────────────────────────────

interface WheelColumnProps {
  items: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  width?: number;
}

function WheelColumn({ items, selectedIndex, onChange, width = 80 }: WheelColumnProps) {
  const [renderOffset, setRenderOffset] = useState(selectedIndex * ITEM_H);
  const offsetRef = useRef(selectedIndex * ITEM_H);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartOffset = useRef(0);
  const velHistory = useRef<{ y: number; t: number }[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  useEffect(() => {
    if (!isDragging.current) {
      animateTo(offsetRef.current, selectedIndex * ITEM_H, 200);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex]);

  function setOffset(v: number) {
    offsetRef.current = v;
    setRenderOffset(v);
  }

  function clamp(v: number) {
    return Math.max(0, Math.min((items.length - 1) * ITEM_H, v));
  }

  function animateTo(from: number, to: number, duration = 280) {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const clamped = clamp(to);
    const startTime = performance.now();
    function tick(now: number) {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setOffset(from + (clamped - from) * ease);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        onChangeRef.current(Math.round(clamped / ITEM_H));
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    isDragging.current = true;
    dragStartY.current = e.clientY;
    dragStartOffset.current = offsetRef.current;
    velHistory.current = [{ y: e.clientY, t: e.timeStamp }];
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!isDragging.current) return;
    setOffset(clamp(dragStartOffset.current + (dragStartY.current - e.clientY)));
    const now = e.timeStamp;
    velHistory.current.push({ y: e.clientY, t: now });
    velHistory.current = velHistory.current.filter(p => now - p.t < 80).slice(-6);
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!isDragging.current) return;
    isDragging.current = false;

    let velocity = 0;
    const hist = velHistory.current;
    if (hist.length >= 2) {
      const oldest = hist[0];
      const dt = e.timeStamp - oldest.t;
      velocity = dt > 0 ? ((oldest.y - e.clientY) / dt) * 16 : 0;
    }

    const target = clamp(offsetRef.current + velocity * 6);
    animateTo(offsetRef.current, Math.round(target / ITEM_H) * ITEM_H);
  }

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: 'relative',
        width,
        height: DRUM_H,
        overflow: 'hidden',
        cursor: 'ns-resize',
        userSelect: 'none',
        touchAction: 'none',
        perspective: '350px',
        perspectiveOrigin: '50% 50%',
      }}
    >
      {/* Fade top/bottom */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
        background: `linear-gradient(to bottom,
          var(--color-surface) 0%,
          transparent 28%,
          transparent 72%,
          var(--color-surface) 100%)`,
      }} />

      {/* Center highlight lines */}
      <div style={{
        position: 'absolute', left: 8, right: 8, zIndex: 1, pointerEvents: 'none',
        top: ITEM_H * 2, height: ITEM_H,
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
      }} />

      {/* Items */}
      {items.map((label, i) => {
        const d = (i * ITEM_H - renderOffset) / ITEM_H;
        if (Math.abs(d) > 3.2) return null;
        const top = i * ITEM_H - renderOffset + DRUM_H / 2 - ITEM_H / 2;
        const isSelected = Math.abs(d) < 0.5;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0, right: 0, top,
              height: ITEM_H,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transform: `rotateX(${d * -26}deg)`,
              transformOrigin: 'center center',
              opacity: Math.max(0, 1 - Math.abs(d) * 0.28),
              color: isSelected ? 'var(--color-text)' : 'var(--color-text-muted)',
              fontSize: isSelected ? '20px' : '17px',
              fontWeight: isSelected ? 600 : 400,
              pointerEvents: 'none',
            }}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
}

// ─── PickerModal ──────────────────────────────────────────────────────────────

interface PickerModalProps {
  title: string;
  onClose: () => void;
  onConfirm: () => void;
  children: React.ReactNode;
}

function PickerModal({ title, onClose, onConfirm, children }: PickerModalProps) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
      }}
      onPointerDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: '100%', maxWidth: 440,
          background: 'var(--color-surface)',
          borderRadius: '20px 20px 0 0',
          paddingBottom: 32,
          boxShadow: '0 -8px 40px rgba(0,0,0,0.25)',
        }}
        onPointerDown={e => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--color-border)' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 24px 12px',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <button
            type="button" onClick={onClose}
            style={{ fontSize: 15, color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontFamily: 'inherit' }}
          >
            Cancelar
          </button>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)' }}>{title}</span>
          <button
            type="button" onClick={() => { onConfirm(); onClose(); }}
            style={{ fontSize: 15, fontWeight: 600, color: '#E8713C', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontFamily: 'inherit' }}
          >
            Confirmar
          </button>
        </div>

        {/* Wheel content */}
        <div style={{ padding: '12px 24px 0', display: 'flex', justifyContent: 'center' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── IosTimePicker ────────────────────────────────────────────────────────────

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

interface IosTimePickerProps {
  value: string;
  onConfirm: (value: string) => void;
  onClose: () => void;
}

function IosTimePicker({ value, onConfirm, onClose }: IosTimePickerProps) {
  const [hStr, mStr] = (value || '00:00').split(':');
  const [hourIdx, setHourIdx] = useState(Math.min(parseInt(hStr || '0', 10), 23));
  const [minIdx, setMinIdx] = useState(Math.min(parseInt(mStr || '0', 10), 59));

  return (
    <PickerModal
      title="Selecionar Hora"
      onClose={onClose}
      onConfirm={() => onConfirm(`${HOURS[hourIdx]}:${MINUTES[minIdx]}`)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <WheelColumn items={HOURS} selectedIndex={hourIdx} onChange={setHourIdx} width={76} />
        <span style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1, marginBottom: 2 }}>:</span>
        <WheelColumn items={MINUTES} selectedIndex={minIdx} onChange={setMinIdx} width={76} />
      </div>
    </PickerModal>
  );
}

// ─── IosDatePicker ────────────────────────────────────────────────────────────

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function buildYears() {
  const y = dayjs().year();
  return Array.from({ length: 8 }, (_, i) => String(y - 1 + i));
}

interface IosDatePickerProps {
  value: string;
  onConfirm: (value: string) => void;
  onClose: () => void;
}

function IosDatePicker({ value, onConfirm, onClose }: IosDatePickerProps) {
  const YEARS = useMemo(() => buildYears(), []);
  const parsed = value ? dayjs(value) : dayjs();

  const [dayIdx, setDayIdx] = useState(parsed.date() - 1);
  const [monthIdx, setMonthIdx] = useState(parsed.month());
  const [yearIdx, setYearIdx] = useState(Math.max(0, YEARS.indexOf(String(parsed.year()))));

  const DAYS = useMemo(() => {
    const count = dayjs(`${YEARS[yearIdx]}-${String(monthIdx + 1).padStart(2, '0')}-01`).daysInMonth();
    return Array.from({ length: count }, (_, i) => String(i + 1).padStart(2, '0'));
  }, [monthIdx, yearIdx, YEARS]);

  useEffect(() => {
    if (dayIdx >= DAYS.length) setDayIdx(DAYS.length - 1);
  }, [DAYS.length, dayIdx]);

  const safeDayIdx = Math.min(dayIdx, DAYS.length - 1);

  return (
    <PickerModal
      title="Selecionar Data"
      onClose={onClose}
      onConfirm={() => {
        const y = YEARS[yearIdx];
        const m = String(monthIdx + 1).padStart(2, '0');
        const d = String(safeDayIdx + 1).padStart(2, '0');
        onConfirm(`${y}-${m}-${d}`);
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <WheelColumn items={DAYS} selectedIndex={safeDayIdx} onChange={setDayIdx} width={58} />
        <WheelColumn items={MONTH_LABELS} selectedIndex={monthIdx} onChange={setMonthIdx} width={64} />
        <WheelColumn items={YEARS} selectedIndex={yearIdx} onChange={setYearIdx} width={72} />
      </div>
    </PickerModal>
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

interface InputProps {
  value?: string;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
  name?: string;
  id?: string;
  style?: React.CSSProperties;
  className?: string;
  placeholder?: string;
  children?: React.ReactNode;
}

export const TimeInput = forwardRef<HTMLButtonElement, InputProps>(
  ({ value = '', onChange, name, id, style, className, placeholder = '--:--', children }, ref) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button
          ref={ref} type="button" id={id}
          onClick={() => setOpen(true)}
          className={className}
          style={{ textAlign: 'left', cursor: 'pointer', ...style }}
        >
          {children ?? (value || placeholder)}
        </button>
        {open && (
          <IosTimePicker
            value={value || '00:00'}
            onConfirm={v => onChange?.({ target: { value: v, name } })}
            onClose={() => setOpen(false)}
          />
        )}
      </>
    );
  }
);
TimeInput.displayName = 'TimeInput';

export const DateInput = forwardRef<HTMLButtonElement, InputProps>(
  ({ value = '', onChange, name, id, style, className, placeholder = 'Selecionar data', children }, ref) => {
    const [open, setOpen] = useState(false);
    const display = value ? dayjs(value).format('DD/MM/YYYY') : '';
    return (
      <>
        <button
          ref={ref} type="button" id={id}
          onClick={() => setOpen(true)}
          className={className}
          style={{ textAlign: 'left', cursor: 'pointer', ...style }}
        >
          {children ?? (display || placeholder)}
        </button>
        {open && (
          <IosDatePicker
            value={value || dayjs().format('YYYY-MM-DD')}
            onConfirm={v => onChange?.({ target: { value: v, name } })}
            onClose={() => setOpen(false)}
          />
        )}
      </>
    );
  }
);
DateInput.displayName = 'DateInput';
