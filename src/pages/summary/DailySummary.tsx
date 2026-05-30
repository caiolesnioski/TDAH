import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, X, Clock } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { useDailySummary } from '@/hooks/useTaskTimer';
import { TipBanner } from '@/components/ui/TipBanner';
import { supabase } from '@/lib/supabase';

dayjs.locale('pt-br');

const CATEGORY_NAMES: Record<number, string> = {
  0: 'Estudo',
  1: 'Trabalho',
  2: 'Casa',
  3: 'Saúde',
  4: 'Lazer',
  5: 'Outros',
};

type SessionRow = {
  id: string;
  taskTitle: string;
  taskCategory: number;
  actualMinutes: number | null;
  xpEarned: number;
  status: string;
};

function SessionGroup({
  title,
  sessions,
  icon,
  showXP,
}: {
  title: string;
  sessions: SessionRow[];
  icon: ReactNode;
  showXP: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h2 className="text-sm font-semibold text-base-content/60">{title}</h2>
      </div>
      <div className="flex flex-col gap-2">
        {sessions.map((s) => (
          <div
            key={s.id}
            className="bg-base-200 rounded-xl p-3 border border-base-300 flex items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{s.taskTitle || '(sem título)'}</p>
              <p className="text-xs text-base-content/50">
                {s.actualMinutes ? `${s.actualMinutes}min` : '—'} ·{' '}
                {CATEGORY_NAMES[s.taskCategory] ?? 'Outros'}
              </p>
            </div>
            {showXP && s.xpEarned > 0 && (
              <span className="text-xs font-semibold text-success shrink-0">
                +{s.xpEarned} XP
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DailySummary() {
  const date = new Date().toISOString().split('T')[0];
  const navigate = useNavigate();

  const { data: sessions = [], isLoading } = useDailySummary(date);

  const { data: todayAchievements = [] } = useQuery({
    queryKey: ['user_achievements', 'today', date],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', user.id)
        .gte('unlocked_at', `${date}T00:00:00.000Z`)
        .lte('unlocked_at', `${date}T23:59:59.999Z`);
      return (data ?? []) as { achievement_id: string; unlocked_at: string }[];
    },
  });

  const rawDate = dayjs().format('dddd, D [de] MMMM');
  const dateLabel = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  const completed = sessions.filter(
    (s) => s.status === 'completed_on_time' || s.status === 'completed_late',
  );
  const onTime = sessions.filter((s) => s.status === 'completed_on_time');
  const late = sessions.filter((s) => s.status === 'completed_late');
  const abandoned = sessions.filter((s) => s.status === 'abandoned');

  const totalXP = sessions.reduce((sum, s) => sum + s.xpEarned, 0);
  const totalMinutes = completed.reduce((sum, s) => sum + (s.actualMinutes ?? 0), 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  let streak = 0;
  for (const s of sessions) {
    if (s.status === 'completed_on_time') streak++;
    else if (s.status !== 'in_progress') streak = 0;
  }

  const completionRate = sessions.length > 0 ? (completed.length / sessions.length) * 100 : 0;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">Seu dia em {dateLabel}</h1>
          {totalXP > 0 && (
            <span className="badge badge-success text-white font-semibold">
              +{totalXP} XP hoje
            </span>
          )}
        </div>
        <p className="text-sm text-base-content/60 mt-1">Aqui está tudo que você fez hoje</p>
      </div>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Clock className="w-12 h-12 text-base-content/30" />
          <p className="font-semibold text-base-content/70">Nenhuma sessão hoje</p>
          <p className="text-sm text-base-content/50">
            Comece uma tarefa para ver seu resumo aqui
          </p>
        </div>
      ) : (
        <>
          {/* Grid 2×2 de métricas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-base-200 rounded-xl p-4 border border-base-300">
              <p className="text-xs text-base-content/50 mb-1">✅ Tarefas concluídas</p>
              <p className="text-2xl font-bold">{completed.length}</p>
            </div>
            <div className="bg-base-200 rounded-xl p-4 border border-base-300">
              <p className="text-xs text-base-content/50 mb-1">⏱ Tempo focado</p>
              <p className="text-2xl font-bold">
                {hours > 0 ? `${hours}h ` : ''}
                {mins}min
              </p>
            </div>
            <div className="bg-base-200 rounded-xl p-4 border border-base-300">
              <p className="text-xs text-base-content/50 mb-1">🎯 No prazo</p>
              <p className="text-2xl font-bold">
                {onTime.length} de {completed.length}
              </p>
            </div>
            <div className="bg-base-200 rounded-xl p-4 border border-base-300">
              <p className="text-xs text-base-content/50 mb-1">🔥 Sequência do dia</p>
              <p className="text-2xl font-bold">{streak}</p>
            </div>
          </div>

          {/* Lista de sessões agrupada por status */}
          <div className="flex flex-col gap-4">
            {onTime.length > 0 && (
              <SessionGroup
                title="Concluídas no prazo"
                sessions={onTime}
                icon={<CheckCircle className="w-4 h-4 text-success" />}
                showXP
              />
            )}
            {late.length > 0 && (
              <SessionGroup
                title="Concluídas com tempo extra"
                sessions={late}
                icon={<CheckCircle className="w-4 h-4 text-warning" />}
                showXP
              />
            )}
            {abandoned.length > 0 && (
              <SessionGroup
                title="Não concluídas"
                sessions={abandoned}
                icon={<X className="w-4 h-4 text-base-content/40" />}
                showXP={false}
              />
            )}
          </div>

          {/* Card motivacional */}
          {completed.length > 0 && (
            <TipBanner variant={completionRate >= 80 ? 'success' : 'info'}>
              {completionRate >= 80
                ? 'Dia incrível! Você arrasou hoje 🔥'
                : completionRate >= 50
                  ? 'Bom trabalho! Cada tarefa conta.'
                  : 'Hoje foi só um dia. Amanhã é uma nova chance 💪'}
            </TipBanner>
          )}

          {/* Conquistas desbloqueadas hoje */}
          {todayAchievements.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-base-content/50 uppercase tracking-wide mb-3">
                Conquistas desbloqueadas hoje
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {todayAchievements.map((a) => (
                  <div
                    key={a.achievement_id}
                    className="bg-base-200 rounded-xl p-3 border border-base-300 flex items-center gap-2"
                  >
                    <span className="text-xl shrink-0">🏆</span>
                    <p className="text-sm font-medium truncate capitalize">
                      {a.achievement_id.replace(/_/g, ' ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Rodapé */}
      <div className="pt-2 pb-4">
        <button onClick={() => navigate('/planning/weekly')} className="btn btn-primary w-full">
          Planejar próxima semana →
        </button>
      </div>
    </div>
  );
}
