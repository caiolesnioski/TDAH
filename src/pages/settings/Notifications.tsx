import { useState } from 'react';
import { TimeInput } from '@/components/ui/IosWheelPicker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Clock, CheckCircle2, Star, Zap, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface NotifPrefs {
  taskReminders: boolean;
  reminderMinutes: number;
  dailyDigest: boolean;
  digestTime: string;
  streakAlerts: boolean;
  xpAlerts: boolean;
  focusReminders: boolean;
  focusInterval: number;
}

function loadPrefs(): NotifPrefs {
  try {
    return JSON.parse(localStorage.getItem('notifPrefs') ?? 'null') ?? {
      taskReminders: true,
      reminderMinutes: 15,
      dailyDigest: true,
      digestTime: '08:00',
      streakAlerts: true,
      xpAlerts: true,
      focusReminders: false,
      focusInterval: 25,
    };
  } catch {
    return {
      taskReminders: true,
      reminderMinutes: 15,
      dailyDigest: true,
      digestTime: '08:00',
      streakAlerts: true,
      xpAlerts: true,
      focusReminders: false,
      focusInterval: 25,
    };
  }
}

interface ToggleRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function ToggleRow({ icon, label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="shrink-0 text-blue-500">{icon}</div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-white">{label}</p>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${
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

export default function Notifications() {
  const [prefs, setPrefs] = useState<NotifPrefs>(loadPrefs);

  const set = <K extends keyof NotifPrefs>(key: K, val: NotifPrefs[K]) =>
    setPrefs((p) => ({ ...p, [key]: val }));

  const handleSave = () => {
    localStorage.setItem('notifPrefs', JSON.stringify(prefs));
    toast.success('Notificações salvas! 🔔');
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">

            <div className="flex items-center gap-3">
              <Bell className="h-7 w-7 text-blue-500" />
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Notificações</h1>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2">
              Configure como e quando você quer ser lembrado. Lembretes gentis ajudam a manter o foco sem sobrecarregar!
            </p>

            {/* Tarefas */}
            <Card className="border-0 shadow-md bg-white dark:bg-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Lembretes de Tarefas
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-gray-100 dark:divide-gray-700">
                <ToggleRow
                  icon={<Bell className="h-4 w-4" />}
                  label="Lembrar de tarefas pendentes"
                  description="Receba um aviso antes do prazo das suas tarefas"
                  checked={prefs.taskReminders}
                  onChange={(v) => set('taskReminders', v)}
                />
                {prefs.taskReminders && (
                  <div className="py-3 space-y-2">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Avisar com quantos minutos de antecedência?
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {[5, 10, 15, 30, 60].map((m) => (
                        <button
                          key={m}
                          onClick={() => set('reminderMinutes', m)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            prefs.reminderMinutes === m
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                          }`}
                        >
                          {m >= 60 ? '1h' : `${m}min`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resumo diário */}
            <Card className="border-0 shadow-md bg-white dark:bg-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-500" /> Resumo Diário
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-gray-100 dark:divide-gray-700">
                <ToggleRow
                  icon={<Bell className="h-4 w-4" />}
                  label="Resumo da manhã"
                  description="Receba um resumo das suas tarefas e compromissos do dia"
                  checked={prefs.dailyDigest}
                  onChange={(v) => set('dailyDigest', v)}
                />
                {prefs.dailyDigest && (
                  <div className="py-3 space-y-2">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Horário do resumo</p>
                    <TimeInput
                      value={prefs.digestTime}
                      onChange={(e) => set('digestTime', e.target.value)}
                      className="block rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gamificação */}
            <Card className="border-0 shadow-md bg-white dark:bg-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" /> Gamificação
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-gray-100 dark:divide-gray-700">
                <ToggleRow
                  icon={<Zap className="h-4 w-4 text-amber-500" />}
                  label="Alertas de streak"
                  description="Saiba quando sua sequência está em risco ou foi batida"
                  checked={prefs.streakAlerts}
                  onChange={(v) => set('streakAlerts', v)}
                />
                <ToggleRow
                  icon={<Star className="h-4 w-4 text-amber-500" />}
                  label="Conquistas e XP"
                  description="Notificações ao ganhar XP ou desbloquear conquistas"
                  checked={prefs.xpAlerts}
                  onChange={(v) => set('xpAlerts', v)}
                />
              </CardContent>
            </Card>

            {/* Timer de Foco */}
            <Card className="border-0 shadow-md bg-white dark:bg-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" /> Timer de Foco
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-gray-100 dark:divide-gray-700">
                <ToggleRow
                  icon={<Bell className="h-4 w-4" />}
                  label="Lembrete de pausa"
                  description="Alerta quando for hora de fazer uma pausa no Pomodoro"
                  checked={prefs.focusReminders}
                  onChange={(v) => set('focusReminders', v)}
                />
                {prefs.focusReminders && (
                  <div className="py-3 space-y-2">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Intervalo de foco</p>
                    <div className="flex gap-2 flex-wrap">
                      {[15, 25, 30, 45, 50].map((m) => (
                        <button
                          key={m}
                          onClick={() => set('focusInterval', m)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            prefs.focusInterval === m
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                          }`}
                        >
                          {m}min
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* TDAH tip */}
            <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 flex gap-2 items-start">
              <BellOff className="h-4 w-4 shrink-0 mt-0.5" />
              <p>Muitas notificações podem causar sobrecarga. Ative apenas o que realmente ajuda você a se manter no trilho!</p>
            </div>

            <Button onClick={handleSave} className="w-full gap-2">
              <Save className="h-4 w-4" /> Salvar Preferências
            </Button>

    </div>
  );
}
