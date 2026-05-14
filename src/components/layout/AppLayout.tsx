import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  Brain,
  LayoutDashboard,
  Sun,
  Sunset,
  CalendarDays,
  ListTodo,
  LayoutGrid,
  CheckSquare,
  Timer,
  Clock,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { WeeklyPlanningBanner } from '@/components/WeeklyPlanningBanner';
import TaskFocusModal from '@/components/TaskFocusModal';

const NAV_SECTIONS = [
  {
    label: 'PLANEJAMENTO',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/schedule/today', icon: Sun, label: 'Hoje' },
      { to: '/schedule/tomorrow', icon: Sunset, label: 'Amanhã' },
      { to: '/schedule/week', icon: CalendarDays, label: 'Semana' },
    ],
  },
  {
    label: 'TAREFAS',
    items: [
      { to: '/tasks/notion', icon: ListTodo, label: 'Todas' },
      { to: '/tasks/by-category', icon: LayoutGrid, label: 'Por Categoria' },
      { to: '/tasks/completed', icon: CheckSquare, label: 'Concluídas' },
    ],
  },
  {
    label: 'FOCO',
    items: [
      { to: '/focus', icon: Timer, label: 'Timer' },
      { to: '/schedule/routine', icon: Clock, label: 'Horários' },
    ],
  },
  {
    label: 'PERFIL',
    items: [{ to: '/settings/profile', icon: Settings, label: 'Configurações' }],
  },
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function Sidebar() {
  const { pathname } = useLocation();
  const { user } = useAuth();

  const initials = user?.name ? getInitials(user.name) : (user?.email?.[0]?.toUpperCase() ?? '?');

  return (
    <aside className="relative flex flex-col w-56 shrink-0 h-screen bg-base-200 border-r border-base-300">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-base-300">
        <Brain size={20} className="text-primary" />
        <span className="font-semibold text-base-content">TDAH</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto pb-20">
        <ul className="menu px-2 py-3 gap-0.5">
          {NAV_SECTIONS.map((section) => (
            <li key={section.label}>
              <span className="menu-title text-[10px] tracking-widest opacity-40 mt-3">
                {section.label}
              </span>
              <ul>
                {section.items.map(({ to, icon: Icon, label }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className={`rounded-lg gap-2.5${pathname === to ? ' active' : ''}`}
                    >
                      <Icon size={16} />
                      <span className="text-sm">{label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </nav>

      {/* User footer */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-base-300 bg-base-200">
        <div className="flex items-center gap-3">
          <div className="avatar placeholder">
            <div className="bg-primary/20 text-primary rounded-full w-8 flex items-center justify-center">
              <span className="text-xs font-medium">{initials}</span>
            </div>
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-base-content leading-none truncate">
              {user?.name || 'Usuário'}
            </p>
            <p className="text-xs text-base-content/50 mt-0.5 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function AppLayout() {
  return (
    <div className="flex h-screen bg-base-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <WeeklyPlanningBanner />
        <Outlet />
      </main>
      <TaskFocusModal />
    </div>
  );
}
