import { useLocation } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/conquistas': 'Conquistas',
  '/dashboard/estatisticas': 'Estatísticas',
  '/schedule/week': 'Minha Semana',
  '/schedule/today': 'Hoje',
  '/schedule/tomorrow': 'Amanhã',
  '/schedule/routine': 'Rotina Semanal',
  '/schedule/new': 'Novo Horário',
  '/schedule/list': 'Compromissos',
  '/tasks/notion': 'Minhas Tarefas',
  '/tasks/completed': 'Tarefas Concluídas',
  '/tasks/by-category': 'Tarefas por Categoria',
  '/focus': 'Timer de Foco',
  '/settings/profile': 'Perfil',
  '/settings/notifications': 'Notificações',
  '/settings/tdah': 'Preferências TDAH',
};

export function SiteHeader() {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? 'TDAH Manager';

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium">{title}</h1>
      </div>
    </header>
  );
}
