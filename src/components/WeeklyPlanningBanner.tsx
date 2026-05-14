import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { useSundayPlanning } from '@/hooks/useSundayPlanning';

const DISMISSED_KEY = 'weekly_planning_banner_dismissed';

function getIsDismissed(): boolean {
  const ts = sessionStorage.getItem(DISMISSED_KEY);
  if (!ts) return false;
  return Date.now() - Number(ts) < 2 * 60 * 60 * 1000; // 2 hours
}

export function WeeklyPlanningBanner() {
  const [dismissed, setDismissed] = useState<boolean>(getIsDismissed);
  const { needsPlanning } = useSundayPlanning();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (!needsPlanning || pathname === '/planning/weekly' || dismissed) return null;

  function handleDismiss() {
    sessionStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setDismissed(true);
  }

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 border-b border-border shrink-0"
      style={{
        backgroundColor: '#1A2236',
        borderLeftColor: '#6366F1',
        borderLeftWidth: '3px',
      }}
    >
      <CalendarDays className="w-5 h-5 mt-0.5 shrink-0" style={{ color: '#6366F1' }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>
          É domingo! Que tal planejar sua semana agora?
        </p>
        <p className="text-sm" style={{ color: '#94A3B8' }}>
          Leva menos de 5 minutos e organiza toda a sua semana.
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => navigate('/planning/weekly')}
          className="text-sm font-medium px-3 py-1.5 rounded-md transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#6366F1', color: '#F1F5F9' }}
        >
          Planejar agora
        </button>
        <button
          onClick={handleDismiss}
          className="text-sm px-3 py-1.5 rounded-md transition-opacity hover:opacity-70"
          style={{ color: '#94A3B8' }}
        >
          Depois
        </button>
      </div>
    </div>
  );
}
