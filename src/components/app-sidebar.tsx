import * as React from 'react';
import { Home, Calendar, ListTodo, Clock, Settings, Timer } from 'lucide-react';

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
      {
        title: 'Dashboard',
        url: '/dashboard',
        icon: Home,
        items: [
          { title: 'Visão Geral',  url: '/dashboard' },
          { title: 'Conquistas',   url: '/dashboard/conquistas' },
          { title: 'Estatísticas', url: '/dashboard/estatisticas' },
        ],
      },
      {
        title: 'Minha Semana',
        url: '/schedule/week',
        icon: Calendar,
        items: [
          { title: 'Hoje',          url: '/schedule/today' },
          { title: 'Amanhã',        url: '/schedule/tomorrow' },
          { title: 'Visão Semanal', url: '/schedule/week' },
          { title: 'Calendário',    url: '/schedule/week' },
        ],
      },
    ],
  },
  {
    label: 'TAREFAS',
    items: [
      {
        title: 'Lista de Tarefas',
        url: '/tasks/notion',
        icon: ListTodo,
        items: [
          { title: 'Todas as Tarefas', url: '/tasks/notion' },
          { title: 'Nova Tarefa',      url: '/tasks/notion' },
          { title: 'Concluídas',       url: '/tasks/completed' },
          { title: 'Por Categoria',    url: '/tasks/by-category' },
        ],
      },
    ],
  },
  {
    label: 'FOCO',
    items: [
      {
        title: 'Timer de Foco',
        url: '/focus',
        icon: Timer,
        items: [
          { title: 'Pomodoro', url: '/focus' },
        ],
      },
      {
        title: 'Horários Fixos',
        url: '/schedule/list',
        icon: Clock,
        items: [
          { title: 'Minha Rotina',  url: '/schedule/routine' },
          { title: 'Novo Horário',  url: '/schedule/new' },
          { title: 'Compromissos',  url: '/schedule/list' },
          { title: 'Repetições',    url: '/schedule/routine', disabled: true },
        ],
      },
    ],
  },
  {
    label: 'PERFIL',
    items: [
      {
        title: 'Configurações',
        url: '/settings/profile',
        icon: Settings,
        items: [
          { title: 'Perfil',            url: '/settings/profile' },
          { title: 'Notificações',      url: '/settings/notifications' },
          { title: 'Aparência',         url: '/settings/profile', disabled: true },
          { title: 'Preferências TDAH', url: '/settings/tdah' },
        ],
      },
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
    <Sidebar collapsible="icon" {...props} className="sticky">
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
