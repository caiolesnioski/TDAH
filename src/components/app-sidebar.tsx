import * as React from 'react';
import {
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

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { BrandLogo } from '@/components/brand-logo';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext';

const navSections = [
  {
    label: 'PLANEJAMENTO',
    items: [
      { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
      { title: 'Hoje', url: '/schedule/today', icon: Sun },
      { title: 'Amanhã', url: '/schedule/tomorrow', icon: Sunset },
      { title: 'Semana', url: '/schedule/week', icon: CalendarDays },
    ],
  },
  {
    label: 'TAREFAS',
    items: [
      { title: 'Todas', url: '/tasks/notion', icon: ListTodo },
      { title: 'Por Categoria', url: '/tasks/by-category', icon: LayoutGrid },
      { title: 'Concluídas', url: '/tasks/completed', icon: CheckSquare },
    ],
  },
  {
    label: 'FOCO',
    items: [
      { title: 'Timer', url: '/focus', icon: Timer },
      { title: 'Horários', url: '/schedule/routine', icon: Clock },
    ],
  },
  {
    label: 'PERFIL',
    items: [
      { title: 'Configurações', url: '/settings/profile', icon: Settings },
    ],
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const userData = {
    name: user?.name || 'Usuário',
    email: user?.email || '',
    avatar: '',
  };

  return (
    <Sidebar
      collapsible="icon"
      {...props}
    >
      <SidebarHeader>
        <BrandLogo />
      </SidebarHeader>
      <SidebarContent>
        <NavMain sections={navSections} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
