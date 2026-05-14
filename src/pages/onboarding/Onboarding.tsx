import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Target,
  Calendar,
  TrendingUp,
  Bell,
  Trophy,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useUpsertPreferences } from '@/hooks/usePreferences';
import { useCreateTask } from '@/hooks/useTasks';
import { TaskPriority, TaskCategory } from '@/types';
import toast from 'react-hot-toast';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MotivationStyle = '' | 'competition' | 'progress' | 'reminders' | 'celebration';
type HasCommitments = 'yes' | 'no' | 'unknown';

interface OnboardingState {
  goals: string[];
  wakeTime: string;
  sleepHours: number;
  hasCommitments: HasCommitments;
  motivationStyle: MotivationStyle;
  firstTaskDesc: string;
  firstTaskMinutes: number;
  firstTaskPriority: TaskPriority;
}

const DEFAULT_STATE: OnboardingState = {
  goals: [],
  wakeTime: '07:00',
  sleepHours: 8,
  hasCommitments: 'unknown',
  motivationStyle: '',
  firstTaskDesc: '',
  firstTaskMinutes: 30,
  firstTaskPriority: TaskPriority.MEDIUM,
};

const STEP_LABELS = ['Boas-vindas', 'Objetivos', 'Perfil', 'Motivação', 'Primeira tarefa'];

const GOAL_OPTIONS = [
  { id: 'procrastination', label: 'Quero parar de procrastinar' },
  { id: 'starting', label: 'Tenho dificuldade em começar tarefas' },
  { id: 'forgetfulness', label: 'Esqueço coisas importantes' },
  { id: 'long_goals', label: 'Quero acompanhar metas de longo prazo' },
  { id: 'organization', label: 'Quero me organizar melhor no geral' },
];

const MOTIVATION_OPTIONS = [
  { id: 'competition', icon: Trophy, label: 'Competição e recordes', desc: 'Gosto de bater minhas marcas e ver ranking' },
  { id: 'progress', icon: TrendingUp, label: 'Ver meu progresso', desc: 'Prefiro gráficos e barras de progresso' },
  { id: 'reminders', icon: Bell, label: 'Lembretes frequentes', desc: 'Preciso ser lembrado(a) constantemente' },
  { id: 'celebration', icon: Sparkles, label: 'Celebrar conquistas', desc: 'Quero comemorar cada vitória, por menor que seja' },
];

const TIME_OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hora', value: 60 },
  { label: '2 horas', value: 120 },
];

const PRIORITY_OPTIONS: { label: string; value: TaskPriority; defaultCls: string }[] = [
  { label: 'Baixa', value: TaskPriority.LOW, defaultCls: 'hover:border-gray-400' },
  { label: 'Média', value: TaskPriority.MEDIUM, defaultCls: 'hover:border-yellow-400' },
  { label: 'Alta', value: TaskPriority.HIGH, defaultCls: 'hover:border-red-400' },
];

const PRIORITY_SELECTED: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'border-gray-500 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  [TaskPriority.MEDIUM]: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
  [TaskPriority.HIGH]: 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
};

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="px-6 pt-6 pb-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Passo {step} de {total}
        </span>
        <span className="text-xs font-medium text-violet-600 dark:text-violet-400">
          {STEP_LABELS[step - 1]}
        </span>
      </div>
      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full transition-all duration-500"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Welcome
// ---------------------------------------------------------------------------

function Step1Welcome({ name, onNext }: { name: string; onNext: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-6 py-4 animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
        <Sparkles className="w-10 h-10 text-white" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Olá, {name}! Seja bem-vindo(a) 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-sm">
          Vamos deixar tudo do seu jeito em menos de 2 minutos.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          Antes de começar, queremos entender melhor como podemos te ajudar.
        </p>
      </div>
      <Button
        size="lg"
        onClick={onNext}
        className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white gap-2"
      >
        Vamos lá
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Goals
// ---------------------------------------------------------------------------

function Step2Goals({
  goals,
  onChange,
  onNext,
  onBack,
}: {
  goals: string[];
  onChange: (v: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const toggle = (id: string) =>
    onChange(goals.includes(id) ? goals.filter((g) => g !== id) : [...goals, id]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">O que te trouxe até aqui?</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Pode escolher mais de um</p>
      </div>

      <div className="space-y-2">
        {GOAL_OPTIONS.map((opt) => {
          const selected = goals.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              className={cn(
                'w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium min-h-[44px]',
                selected
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              )}
            >
              <span className="flex items-center gap-3">
                <span
                  className={cn(
                    'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0',
                    selected ? 'border-violet-500 bg-violet-500' : 'border-gray-300 dark:border-gray-600'
                  )}
                >
                  {selected && <CheckCircle2 className="w-3 h-3 text-white" />}
                </span>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
        <Button
          onClick={onNext}
          className="bg-gradient-to-r from-violet-500 to-purple-600 text-white gap-1"
        >
          Continuar <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Profile
// ---------------------------------------------------------------------------

function Step3Profile({
  wakeTime,
  sleepHours,
  hasCommitments,
  onWakeTime,
  onSleepHours,
  onCommitments,
  onNext,
  onBack,
}: {
  wakeTime: string;
  sleepHours: number;
  hasCommitments: HasCommitments;
  onWakeTime: (v: string) => void;
  onSleepHours: (v: number) => void;
  onCommitments: (v: HasCommitments) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Como você organiza seu tempo?</h2>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Clock className="w-4 h-4 text-violet-500" />
            Horário que costuma acordar
          </Label>
          <Input
            type="time"
            value={wakeTime}
            onChange={(e) => onWakeTime(e.target.value)}
            className="w-36"
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Target className="w-4 h-4 text-violet-500" />
            Horas de sono que precisa:{' '}
            <span className="font-bold text-violet-600 dark:text-violet-400">{sleepHours}h</span>
          </Label>
          <input
            type="range"
            min={5}
            max={10}
            step={0.5}
            value={sleepHours}
            onChange={(e) => onSleepHours(Number(e.target.value))}
            className="w-full accent-violet-500"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>5h</span>
            <span>10h</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="w-4 h-4 text-violet-500" />
            Tem compromissos fixos na semana?
          </Label>
          <div className="flex gap-2">
            {(
              [
                { v: 'yes', label: 'Sim' },
                { v: 'no', label: 'Não' },
                { v: 'unknown', label: 'Ainda não sei' },
              ] as { v: HasCommitments; label: string }[]
            ).map((opt) => (
              <button
                key={opt.v}
                type="button"
                onClick={() => onCommitments(opt.v)}
                className={cn(
                  'flex-1 py-2 px-3 rounded-xl border-2 text-sm font-medium transition-all min-h-[44px]',
                  hasCommitments === opt.v
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
        Você pode alterar isso depois nas configurações
      </p>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
        <Button
          onClick={onNext}
          className="bg-gradient-to-r from-violet-500 to-purple-600 text-white gap-1"
        >
          Continuar <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Motivation style
// ---------------------------------------------------------------------------

function Step4Motivation({
  selected,
  onChange,
  onNext,
  onBack,
}: {
  selected: MotivationStyle;
  onChange: (v: MotivationStyle) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">O que te mantém motivado(a)?</h2>
      </div>

      <div className="space-y-3">
        {MOTIVATION_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id as MotivationStyle)}
              className={cn(
                'w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 min-h-[44px]',
                isSelected
                  ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                  isSelected
                    ? 'bg-violet-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p
                  className={cn(
                    'font-medium text-sm',
                    isSelected ? 'text-violet-700 dark:text-violet-300' : 'text-gray-800 dark:text-white'
                  )}
                >
                  {opt.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
        <Button
          onClick={onNext}
          className="bg-gradient-to-r from-violet-500 to-purple-600 text-white gap-1"
        >
          Continuar <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5 — First task (optional)
// ---------------------------------------------------------------------------

function Step5FirstTask({
  desc,
  minutes,
  priority,
  onDesc,
  onMinutes,
  onPriority,
  onFinish,
  onSkip,
  onBack,
  isLoading,
}: {
  desc: string;
  minutes: number;
  priority: TaskPriority;
  onDesc: (v: string) => void;
  onMinutes: (v: number) => void;
  onPriority: (v: TaskPriority) => void;
  onFinish: () => void;
  onSkip: () => void;
  onBack: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          Quer adicionar sua primeira tarefa?
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Começar com algo pequeno já é um grande passo.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="task-desc">Descrição da tarefa</Label>
          <Input
            id="task-desc"
            placeholder="Ex: Estudar por 30 minutos..."
            value={desc}
            onChange={(e) => onDesc(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Tempo estimado</Label>
          <div className="flex gap-2 flex-wrap">
            {TIME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onMinutes(opt.value)}
                className={cn(
                  'px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all min-h-[44px]',
                  minutes === opt.value
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Prioridade</Label>
          <div className="flex gap-2">
            {PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onPriority(opt.value)}
                className={cn(
                  'flex-1 py-2 px-3 rounded-xl border-2 text-sm font-medium transition-all min-h-[44px]',
                  priority === opt.value
                    ? PRIORITY_SELECTED[opt.value]
                    : `border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 ${opt.defaultCls}`
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-4 border-t">
        <Button
          onClick={onFinish}
          disabled={!desc.trim() || isLoading}
          className="bg-gradient-to-r from-violet-500 to-purple-600 text-white w-full"
        >
          {isLoading ? 'Salvando...' : 'Adicionar e ir para o Dashboard'}
        </Button>
        <Button
          variant="ghost"
          onClick={onSkip}
          disabled={isLoading}
          className="w-full text-gray-500 dark:text-gray-400"
        >
          Pular por agora
        </Button>
      </div>

      <div className="flex justify-start">
        <Button variant="ghost" size="sm" onClick={onBack} disabled={isLoading} className="text-gray-400">
          <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

function loadSavedProgress(): { step: number; data: OnboardingState } {
  try {
    const raw = localStorage.getItem('onboardingProgress');
    if (raw) return JSON.parse(raw) as { step: number; data: OnboardingState };
  } catch {
    // ignore corrupted data
  }
  return { step: 1, data: DEFAULT_STATE };
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const upsertPreferences = useUpsertPreferences();
  const createTask = useCreateTask();

  const saved = loadSavedProgress();
  const [step, setStep] = useState(saved.step);
  const [data, setData] = useState<OnboardingState>(saved.data);

  const saveProgress = (nextStep: number, nextData: OnboardingState) => {
    localStorage.setItem('onboardingProgress', JSON.stringify({ step: nextStep, data: nextData }));
  };

  const updateData = (partial: Partial<OnboardingState>) => {
    setData((prev) => {
      const next = { ...prev, ...partial };
      saveProgress(step, next);
      return next;
    });
  };

  const goNext = () => {
    const next = step + 1;
    setStep(next);
    saveProgress(next, data);
  };

  const goBack = () => {
    const prev = step - 1;
    setStep(prev);
    saveProgress(prev, data);
  };

  const finishOnboarding = async (withTask: boolean) => {
    try {
      await upsertPreferences.mutateAsync({
        wakeTime: data.wakeTime,
        idealSleepHours: data.sleepHours,
      });

      if (withTask && data.firstTaskDesc.trim()) {
        await createTask.mutateAsync({
          title: data.firstTaskDesc.trim(),
          category: TaskCategory.OTHER,
          priority: data.firstTaskPriority,
          estimatedMinutes: data.firstTaskMinutes,
        });
      }

      localStorage.setItem('onboardingGoals', JSON.stringify(data.goals));
      localStorage.setItem('onboardingMotivation', data.motivationStyle);
      localStorage.setItem('onboardingCompleted', 'true');
      localStorage.removeItem('onboardingProgress');

      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      toast.error('Erro ao salvar suas preferências. Tente novamente.');
    }
  };

  const isLoading = upsertPreferences.isPending || createTask.isPending;
  const firstName = user?.name?.split(' ')[0] ?? 'você';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl border-0">
        {step > 1 && <ProgressBar step={step} total={5} />}

        <CardContent className={cn('pb-8 px-6', step === 1 ? 'pt-8' : 'pt-6')}>
          {step === 1 && <Step1Welcome name={firstName} onNext={goNext} />}

          {step === 2 && (
            <Step2Goals
              goals={data.goals}
              onChange={(goals) => updateData({ goals })}
              onNext={goNext}
              onBack={goBack}
            />
          )}

          {step === 3 && (
            <Step3Profile
              wakeTime={data.wakeTime}
              sleepHours={data.sleepHours}
              hasCommitments={data.hasCommitments}
              onWakeTime={(v) => updateData({ wakeTime: v })}
              onSleepHours={(v) => updateData({ sleepHours: v })}
              onCommitments={(v) => updateData({ hasCommitments: v })}
              onNext={goNext}
              onBack={goBack}
            />
          )}

          {step === 4 && (
            <Step4Motivation
              selected={data.motivationStyle}
              onChange={(v) => updateData({ motivationStyle: v })}
              onNext={goNext}
              onBack={goBack}
            />
          )}

          {step === 5 && (
            <Step5FirstTask
              desc={data.firstTaskDesc}
              minutes={data.firstTaskMinutes}
              priority={data.firstTaskPriority}
              onDesc={(v) => updateData({ firstTaskDesc: v })}
              onMinutes={(v) => updateData({ firstTaskMinutes: v })}
              onPriority={(v) => updateData({ firstTaskPriority: v })}
              onFinish={() => finishOnboarding(true)}
              onSkip={() => finishOnboarding(false)}
              onBack={goBack}
              isLoading={isLoading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
