import { Outlet } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { WeeklyPlanningBanner } from '@/components/WeeklyPlanningBanner';
import TaskFocusModal from '@/components/TaskFocusModal';
import { CalendarPanel } from '@/components/CalendarPanel';
import { useCalendarPanelStore } from '@/store/calendarPanelStore';

export default function AppLayout() {
  const toggle = useCalendarPanelStore((s) => s.toggle);

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex items-center justify-between px-4 h-16 border-b border-base-300 shrink-0">
          <div />
          <button
            onClick={toggle}
            className="btn btn-ghost btn-sm btn-circle"
            title="Calendário"
          >
            <CalendarDays size={18} />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto">
          <WeeklyPlanningBanner />
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
      <TaskFocusModal />
      <CalendarPanel />
    </SidebarProvider>
  );
}
