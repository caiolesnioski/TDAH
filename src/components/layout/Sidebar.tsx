import { NavLink } from 'react-router-dom';
import {
  Brain,
  LayoutDashboard, Sun, Sunset, CalendarDays,
  ListTodo, LayoutGrid, CheckSquare,
  Timer, Clock,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const sections = [
  {
    label: 'PLANEJAMENTO',
    items: [
      { title: 'Dashboard',  to: '/dashboard',          Icon: LayoutDashboard },
      { title: 'Hoje',       to: '/schedule/today',     Icon: Sun },
      { title: 'Amanhã',     to: '/schedule/tomorrow',  Icon: Sunset },
      { title: 'Semana',     to: '/schedule/week',      Icon: CalendarDays },
    ],
  },
  {
    label: 'TAREFAS',
    items: [
      { title: 'Todas',        to: '/tasks/notion',       Icon: ListTodo },
      { title: 'Por Categoria', to: '/tasks/by-category', Icon: LayoutGrid },
      { title: 'Concluídas',   to: '/tasks/completed',   Icon: CheckSquare },
    ],
  },
  {
    label: 'FOCO',
    items: [
      { title: 'Timer',    to: '/focus',             Icon: Timer },
      { title: 'Horários', to: '/schedule/routine',  Icon: Clock },
    ],
  },
  {
    label: 'PERFIL',
    items: [
      { title: 'Configurações', to: '/settings/profile', Icon: Settings },
    ],
  },
];

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export default function Sidebar() {
  const { user } = useAuth();
  const name  = user?.name  || 'Usuário';
  const email = user?.email || '';

  return (
    <aside className="sidebar-nav">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Brain size={20} />
        </div>
        <span className="sidebar-logo-text">TDAH</span>
      </div>

      <div className="sidebar-content">
        {sections.map(({ label, items }) => (
          <div key={label}>
            <span className="sidebar-section-label">{label}</span>
            {items.map(({ title, to, Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  isActive ? 'sidebar-item active' : 'sidebar-item'
                }
              >
                <Icon size={16} className="sidebar-item-icon" />
                <span className="sidebar-item-text">{title}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      <div className="sidebar-user">
        <div className="sidebar-user-avatar">{initials(name)}</div>
        <div className="sidebar-user-info">
          <span>{name}</span>
          <span>{email}</span>
        </div>
      </div>
    </aside>
  );
}
