import { useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Moon, Sun, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

function loadSleepPrefs() {
  try { return JSON.parse(localStorage.getItem('sleepPrefs') ?? 'null') ?? { hours: 8, wake: '07:00', sleep: '23:00' }; }
  catch { return { hours: 8, wake: '07:00', sleep: '23:00' }; }
}

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
    <SidebarProvider
      style={{ '--sidebar-width': 'calc(var(--spacing) * 72)', '--header-height': 'calc(var(--spacing) * 12)' } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 min-h-screen max-w-2xl mx-auto">

            <div className="flex items-center gap-3">
              <User className="h-7 w-7 text-blue-500" />
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Seu Perfil</h1>
            </div>

            {/* Avatar + info básica */}
            <Card className="border-0 shadow-md bg-white dark:bg-gray-800">
              <CardHeader><CardTitle className="text-base">Informações Básicas</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                    {(name || user?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">{user?.name || 'Usuário'}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <div className="flex gap-2">
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    />
                    <Button onClick={handleSaveName} disabled={saving} variant="primary" className="shrink-0 gap-2">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Salvar
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Email
                  </Label>
                  <Input value={user?.email ?? ''} disabled className="opacity-60" />
                  <p className="text-xs text-gray-400">O email não pode ser alterado aqui.</p>
                </div>
              </CardContent>
            </Card>

            {/* Preferências de sono */}
            <Card className="border-0 shadow-md bg-white dark:bg-gray-800">
              <CardHeader><CardTitle className="text-base flex items-center gap-2">
                <Moon className="h-4 w-4 text-purple-500" /> Preferências de Sono
              </CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Horas de sono necessárias: <span className="font-bold text-purple-500">{sleep.hours}h</span></Label>
                  <input
                    type="range" min={5} max={12} step={0.5}
                    value={sleep.hours}
                    onChange={(e) => setSleep((s) => ({ ...s, hours: Number(e.target.value) }))}
                    className="w-full accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400"><span>5h</span><span>12h</span></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><Sun className="h-3.5 w-3.5 text-amber-500" /> Acordo às</Label>
                    <Input type="time" value={sleep.wake}
                      onChange={(e) => setSleep((s) => ({ ...s, wake: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><Moon className="h-3.5 w-3.5 text-purple-500" /> Durmo às</Label>
                    <Input type="time" value={sleep.sleep}
                      onChange={(e) => setSleep((s) => ({ ...s, sleep: e.target.value }))} />
                  </div>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2">
                  💡 Com base nisso, vamos sugerir horários ideais para suas tarefas e pausas!
                </p>
                <Button onClick={handleSaveSleep} variant="primary" className="w-full gap-2">
                  <Save className="h-4 w-4" /> Salvar Preferências de Sono
                </Button>
              </CardContent>
            </Card>

            {/* Gamificação */}
            <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl">
                    {level}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 dark:text-white">Nível {level} — Focado Dedicado</p>
                    <p className="text-sm text-gray-500">{xp} / {maxXP} XP</p>
                  </div>
                  <Badge className="ml-auto bg-amber-500 text-white">+{maxXP - xp} XP para nível 9</Badge>
                </div>
                <div className="w-full bg-amber-200/50 dark:bg-amber-900/30 rounded-full h-3">
                  <div className={cn('h-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500')}
                    style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">{pct}% para o próximo nível</p>
              </CardContent>
            </Card>

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
