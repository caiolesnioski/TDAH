import { useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Zap, Target, Clock, Eye, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface TdahPrefs {
  pomodoroLength: number;
  breakLength: number;
  maxTasksPerDay: number;
  taskChunkMinutes: number;
  showMotivation: boolean;
  confirmDestructive: boolean;
  autoBreakReminder: boolean;
  simplifiedView: boolean;
  priorityHighlight: boolean;
  dailyGoal: number;
}

function loadPrefs(): TdahPrefs {
  try {
    return JSON.parse(localStorage.getItem('tdahPrefs') ?? 'null') ?? {
      pomodoroLength: 25,
      breakLength: 5,
      maxTasksPerDay: 5,
      taskChunkMinutes: 25,
      showMotivation: true,
      confirmDestructive: true,
      autoBreakReminder: true,
      simplifiedView: false,
      priorityHighlight: true,
      dailyGoal: 3,
    };
  } catch {
    return {
      pomodoroLength: 25,
      breakLength: 5,
      maxTasksPerDay: 5,
      taskChunkMinutes: 25,
      showMotivation: true,
      confirmDestructive: true,
      autoBreakReminder: true,
      simplifiedView: false,
      priorityHighlight: true,
      dailyGoal: 3,
    };
  }
}

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-white">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
          checked ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 mt-0.5 ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

interface ChipGroupProps {
  label: string;
  value: number;
  options: number[];
  format?: (v: number) => string;
  onChange: (v: number) => void;
}

function ChipGroup({ label, value, options, format, onChange }: ChipGroupProps) {
  return (
    <div className="space-y-2 py-3">
      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</p>
      <div className="flex gap-2 flex-wrap">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              value === o
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            {format ? format(o) : o}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function TdahPreferences() {
  const [prefs, setPrefs] = useState<TdahPrefs>(loadPrefs);

  const set = <K extends keyof TdahPrefs>(key: K, val: TdahPrefs[K]) =>
    setPrefs((p) => ({ ...p, [key]: val }));

  const handleSave = () => {
    localStorage.setItem('tdahPrefs', JSON.stringify(prefs));
    toast.success('Preferências salvas! 🧠');
  };

  const handleReset = () => {
    const defaults: TdahPrefs = {
      pomodoroLength: 25, breakLength: 5, maxTasksPerDay: 5, taskChunkMinutes: 25,
      showMotivation: true, confirmDestructive: true, autoBreakReminder: true,
      simplifiedView: false, priorityHighlight: true, dailyGoal: 3,
    };
    setPrefs(defaults);
    toast('Preferências redefinidas para o padrão.');
  };

  return (
    <SidebarProvider
      style={{ '--sidebar-width': 'calc(var(--spacing) * 72)', '--header-height': 'calc(var(--spacing) * 12)' } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 min-h-screen max-w-2xl">

            <div className="flex items-center gap-3">
              <Brain className="h-7 w-7 text-purple-500" />
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Preferências TDAH</h1>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2">
              Adapte o app ao seu cérebro. Não existe certo ou errado — personalize o que funciona melhor para você!
            </p>

            {/* Foco e Pomodoro */}
            <Card className="border-0 shadow-md bg-white dark:bg-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" /> Timer de Foco
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-gray-100 dark:divide-gray-700">
                <ChipGroup
                  label="Duração do pomodoro"
                  value={prefs.pomodoroLength}
                  options={[15, 20, 25, 30, 45, 50]}
                  format={(v) => `${v}min`}
                  onChange={(v) => set('pomodoroLength', v)}
                />
                <ChipGroup
                  label="Duração da pausa curta"
                  value={prefs.breakLength}
                  options={[3, 5, 10, 15]}
                  format={(v) => `${v}min`}
                  onChange={(v) => set('breakLength', v)}
                />
              </CardContent>
            </Card>

            {/* Tarefas */}
            <Card className="border-0 shadow-md bg-white dark:bg-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-500" /> Gerenciamento de Tarefas
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-gray-100 dark:divide-gray-700">
                <ChipGroup
                  label="Meta diária de tarefas concluídas"
                  value={prefs.dailyGoal}
                  options={[1, 2, 3, 5, 7, 10]}
                  onChange={(v) => set('dailyGoal', v)}
                />
                <ChipGroup
                  label="Limite de tarefas visíveis por dia"
                  value={prefs.maxTasksPerDay}
                  options={[3, 5, 7, 10, 15]}
                  format={(v) => `${v} tarefas`}
                  onChange={(v) => set('maxTasksPerDay', v)}
                />
                <ChipGroup
                  label="Tempo sugerido por tarefa (chunking)"
                  value={prefs.taskChunkMinutes}
                  options={[15, 20, 25, 30, 45]}
                  format={(v) => `${v}min`}
                  onChange={(v) => set('taskChunkMinutes', v)}
                />
              </CardContent>
            </Card>

            {/* Interface */}
            <Card className="border-0 shadow-md bg-white dark:bg-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4 text-indigo-500" /> Interface
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-gray-100 dark:divide-gray-700">
                <ToggleRow
                  label="Modo simplificado"
                  description="Reduz informações na tela para menor sobrecarga cognitiva"
                  checked={prefs.simplifiedView}
                  onChange={(v) => set('simplifiedView', v)}
                />
                <ToggleRow
                  label="Destaque de prioridade alta"
                  description="Tarefas urgentes aparecem com borda colorida especial"
                  checked={prefs.priorityHighlight}
                  onChange={(v) => set('priorityHighlight', v)}
                />
                <ToggleRow
                  label="Mensagens motivacionais"
                  description="Exibe dicas e elogios enquanto você usa o app"
                  checked={prefs.showMotivation}
                  onChange={(v) => set('showMotivation', v)}
                />
              </CardContent>
            </Card>

            {/* Segurança cognitiva */}
            <Card className="border-0 shadow-md bg-white dark:bg-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" /> Proteções
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-gray-100 dark:divide-gray-700">
                <ToggleRow
                  label="Confirmar ações destrutivas"
                  description="Pede confirmação antes de excluir tarefas ou limpar dados"
                  checked={prefs.confirmDestructive}
                  onChange={(v) => set('confirmDestructive', v)}
                />
                <ToggleRow
                  label="Lembrete automático de pausa"
                  description="Avisa quando você ficou mais de 90 minutos sem pausa"
                  checked={prefs.autoBreakReminder}
                  onChange={(v) => set('autoBreakReminder', v)}
                />
              </CardContent>
            </Card>

            {/* TDAH info */}
            <div className="text-xs text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3">
              🧠 Essas configurações foram pensadas especialmente para mentes TDAH. Experimente e ajuste até encontrar o que funciona para você — sem julgamentos!
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleReset} className="flex-1">
                Redefinir Padrões
              </Button>
              <Button onClick={handleSave} className="flex-1 gap-2">
                <Save className="h-4 w-4" /> Salvar
              </Button>
            </div>

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
