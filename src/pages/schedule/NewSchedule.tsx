import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateTimeBlock } from '@/hooks/useTimeBlocks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Check, Clock } from 'lucide-react';
import { TimeBlockType } from '@/types';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DAYS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const BLOCK_TYPES: { type: TimeBlockType; label: string; color: string }[] = [
  { type: TimeBlockType.WORK,  label: 'Trabalho',  color: 'bg-blue-500' },
  { type: TimeBlockType.CLASS, label: 'Aula',       color: 'bg-purple-500' },
  { type: TimeBlockType.TASK,  label: 'Tarefa',     color: 'bg-green-500' },
  { type: TimeBlockType.FIXED, label: 'Fixo',       color: 'bg-orange-500' },
];

export default function NewSchedule() {
  const navigate = useNavigate();
  const createTimeBlock = useCreateTimeBlock();
  const [step, setStep] = useState(1);

  const [title, setTitle] = useState('');
  const [blockType, setBlockType] = useState<TimeBlockType>(TimeBlockType.FIXED);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');

  const toggleDay = (d: number) =>
    setSelectedDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);

  const durationMin = (() => {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  })();

  const canAdvanceStep1 = title.trim().length > 0;
  const canAdvanceStep2 = selectedDays.length > 0;
  const canSave = canAdvanceStep1 && canAdvanceStep2 && durationMin > 0;

  const handleSave = async () => {
    if (!canSave) { toast.error('Preencha todos os campos'); return; }
    try {
      await Promise.all(
        selectedDays.map((day) =>
          createTimeBlock.mutateAsync({
            title: title.trim(),
            type: blockType,
            dayOfWeek: day,
            startTime,
            endTime,
          })
        )
      );
      toast.success(`${selectedDays.length > 1 ? `${selectedDays.length} horários adicionados` : 'Horário adicionado'}! 🎉`);
      navigate('/schedule/routine');
    } catch {
      toast.error('Erro ao salvar horário');
    }
  };

  const stepLabels = ['Detalhes', 'Dias', 'Horário'];

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">

            <div className="flex items-center gap-3">
              <Plus className="h-7 w-7 text-blue-500" />
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Novo Horário Fixo</h1>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-0">
              {stepLabels.map((label, i) => {
                const num = i + 1;
                const done = step > num;
                const active = step === num;
                return (
                  <div key={label} className="flex items-center flex-1">
                    <div className="flex flex-col items-center gap-1">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                        done ? 'bg-green-500 text-white' : active ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                      )}>
                        {done ? <Check className="h-4 w-4" /> : num}
                      </div>
                      <span className={cn('text-[10px] font-medium', active ? 'text-blue-500' : 'text-gray-400')}>{label}</span>
                    </div>
                    {i < stepLabels.length - 1 && (
                      <div className={cn('flex-1 h-px mb-4 mx-1', done ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700')} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step 1: Detalhes */}
            {step === 1 && (
              <Card className="border-0 shadow-md bg-white dark:bg-gray-800">
                <CardHeader><CardTitle className="text-base">O que é esse compromisso?</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Aula de matemática, Reunião, Academia..."
                      onKeyDown={(e) => e.key === 'Enter' && canAdvanceStep1 && setStep(2)}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {BLOCK_TYPES.map(({ type, label, color }) => (
                        <button
                          key={type}
                          onClick={() => setBlockType(type)}
                          className={cn(
                            'flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all',
                            blockType === type
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                              : 'border-transparent bg-gray-50 dark:bg-gray-700/50 hover:border-gray-300'
                          )}
                        >
                          <div className={cn('w-3 h-3 rounded-full', color)} />
                          {label}
                          {blockType === type && <Check className="h-3.5 w-3.5 text-blue-500 ml-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button onClick={() => setStep(2)} disabled={!canAdvanceStep1} className="w-full">
                    Próximo →
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Dias */}
            {step === 2 && (
              <Card className="border-0 shadow-md bg-white dark:bg-gray-800">
                <CardHeader><CardTitle className="text-base">Quais dias da semana?</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-7 gap-1.5">
                    {DAYS.map((d, i) => (
                      <button
                        key={i}
                        onClick={() => toggleDay(i)}
                        className={cn(
                          'aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all',
                          selectedDays.includes(i)
                            ? 'bg-blue-500 text-white shadow-md scale-105'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  {selectedDays.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedDays.sort().map((d) => (
                        <Badge key={d} variant="secondary" className="text-xs">{DAYS_FULL[d]}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1">← Voltar</Button>
                    <Button onClick={() => setStep(3)} disabled={!canAdvanceStep2} className="flex-1">Próximo →</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Horário */}
            {step === 3 && (
              <Card className="border-0 shadow-md bg-white dark:bg-gray-800">
                <CardHeader><CardTitle className="text-base">Que horas?</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Início</Label>
                      <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Fim</Label>
                      <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                    </div>
                  </div>

                  {durationMin > 0 && (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span>{Math.floor(durationMin / 60)}h{durationMin % 60 > 0 ? ` ${durationMin % 60}min` : ''} de duração</span>
                    </div>
                  )}
                  {durationMin <= 0 && startTime && endTime && (
                    <p className="text-xs text-red-500">O horário de fim deve ser depois do início.</p>
                  )}

                  {/* Resumo */}
                  {canSave && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 space-y-2">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">Resumo</p>
                      <p className="font-medium text-gray-800 dark:text-white">{title}</p>
                      <p className="text-sm text-gray-500">
                        {selectedDays.sort().map((d) => DAYS[d]).join(', ')} • {startTime} — {endTime}
                      </p>
                      <p className="text-xs text-gray-400">
                        {selectedDays.length} {selectedDays.length === 1 ? 'dia' : 'dias'} × {Math.floor(durationMin / 60)}h{durationMin % 60 > 0 ? `${durationMin % 60}min` : ''} por semana
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(2)} className="flex-1">← Voltar</Button>
                    <Button onClick={handleSave} disabled={!canSave} className="flex-1 gap-2">
                      <Plus className="h-4 w-4" /> Criar Horário
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

    </div>
  );
}
