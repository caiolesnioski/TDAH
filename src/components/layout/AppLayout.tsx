import { Outlet } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import Sidebar from './Sidebar';
import { WeeklyPlanningBanner } from '@/components/WeeklyPlanningBanner';
import TaskFocusModal from '@/components/TaskFocusModal';
import FloatingTimer from '@/components/FloatingTimer';
import { CalendarPanel } from '@/components/CalendarPanel';
import { useCalendarPanelStore } from '@/store/calendarPanelStore';

export default function AppLayout() {
  const toggle = useCalendarPanelStore((s) => s.toggle);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: '48px', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
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
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <WeeklyPlanningBanner />
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
      <TaskFocusModal />
      <FloatingTimer />
      <CalendarPanel />
    </div>
  );
}
