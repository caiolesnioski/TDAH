import { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSundayPlanning } from '@/hooks/useSundayPlanning';
import { WeeklyPlanningBanner } from '@/components/WeeklyPlanningBanner';
import TaskFocusModal from '@/components/TaskFocusModal';

function getWeekRedirectKey(): string {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `weekly_planning_redirected_${d.getFullYear()}-${String(week).padStart(2, '0')}`;
}

// Headless child component — isolates hook calls that must not run before auth checks
function AuthenticatedLayout() {
  const { needsPlanning, isLoading } = useSundayPlanning();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (isLoading || !needsPlanning || pathname === '/planning/weekly') return;
    const key = getWeekRedirectKey();
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    navigate('/planning/weekly', { replace: true });
  }, [needsPlanning, isLoading, pathname, navigate]);

  return (
    <>
      <WeeklyPlanningBanner />
      <Outlet />
      <TaskFocusModal />
    </>
  );
}

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const onboardingCompleted = localStorage.getItem('onboardingCompleted') === 'true';
  if (!onboardingCompleted && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <AuthenticatedLayout />;
}
